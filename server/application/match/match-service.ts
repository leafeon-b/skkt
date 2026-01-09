import type { Match } from "@/server/domain/models/match/match";
import {
  createMatch,
  deleteMatch,
  updateMatchOutcome,
  updateMatchPlayers,
} from "@/server/domain/models/match/match";
import {
  createMatchHistory,
  type MatchHistoryAction,
} from "@/server/domain/models/match-history/match-history";
import type {
  CircleSessionId,
  MatchHistoryId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { MatchHistoryRepository } from "@/server/domain/models/match-history/match-history-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { createAccessService } from "@/server/application/authz/access-service";

type AccessService = ReturnType<typeof createAccessService>;

export type TransactionRunner = <T>(operation: () => Promise<T>) => Promise<T>;

export type MatchServiceDeps = {
  matchRepository: MatchRepository;
  matchHistoryRepository: MatchHistoryRepository;
  circleSessionParticipationRepository: CircleSessionParticipationRepository;
  circleSessionRepository: CircleSessionRepository;
  accessService: AccessService;
  generateMatchHistoryId: () => MatchHistoryId;
  transactionRunner?: TransactionRunner;
};

export const createMatchService = (deps: MatchServiceDeps) => {
  const run = deps.transactionRunner ?? (async (operation) => operation());

  const ensurePlayersParticipating = async (
    circleSessionId: CircleSessionId,
    player1Id: UserId,
    player2Id: UserId,
  ) => {
    const ok = await deps.circleSessionParticipationRepository.areUsersParticipating(
      circleSessionId,
      [player1Id, player2Id],
    );
    if (!ok) {
      throw new Error("Players must belong to the circle session");
    }
  };

  const recordHistory = (
    action: MatchHistoryAction,
    match: Match,
    editorId: UserId,
  ) =>
    deps.matchHistoryRepository.add(
      createMatchHistory({
        id: deps.generateMatchHistoryId(),
        matchId: match.id,
        editorId,
        action,
        order: match.order,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        outcome: match.outcome,
      }),
    );

  return {
    async recordMatch(params: {
      actorId: UserId;
      id: MatchId;
      circleSessionId: CircleSessionId;
      order: number;
      player1Id: UserId;
      player2Id: UserId;
      outcome?: Match["outcome"];
    }): Promise<Match> {
      return run(async () => {
        const session = await deps.circleSessionRepository.findById(
          params.circleSessionId,
        );
        if (!session) {
          throw new Error("CircleSession not found");
        }
        const allowed = await deps.accessService.canRecordMatch(
          params.actorId as string,
          session.circleId as string,
          params.circleSessionId as string,
        );
        if (!allowed) {
          throw new Error("Forbidden");
        }
        await ensurePlayersParticipating(
          params.circleSessionId,
          params.player1Id,
          params.player2Id,
        );

        const match = createMatch({
          id: params.id,
          circleSessionId: params.circleSessionId,
          order: params.order,
          player1Id: params.player1Id,
          player2Id: params.player2Id,
          outcome: params.outcome,
        });
        await deps.matchRepository.save(match);
        await recordHistory("CREATE", match, params.actorId);
        return match;
      });
    },

    async updateMatch(params: {
      actorId: UserId;
      id: MatchId;
      player1Id?: UserId;
      player2Id?: UserId;
      outcome?: Match["outcome"];
    }): Promise<Match> {
      return run(async () => {
        const match = await deps.matchRepository.findById(params.id);
        if (!match) {
          throw new Error("Match not found");
        }
        if (match.deletedAt) {
          throw new Error("Match is deleted");
        }
        const session = await deps.circleSessionRepository.findById(
          match.circleSessionId,
        );
        if (!session) {
          throw new Error("CircleSession not found");
        }
        const allowed = await deps.accessService.canEditMatch(
          params.actorId as string,
          session.circleId as string,
          match.circleSessionId as string,
        );
        if (!allowed) {
          throw new Error("Forbidden");
        }

        let updated = match;

        if (params.player1Id || params.player2Id) {
          if (!params.player1Id || !params.player2Id) {
            throw new Error("player1Id and player2Id must both be provided");
          }
          await ensurePlayersParticipating(
            match.circleSessionId,
            params.player1Id,
            params.player2Id,
          );
          updated = updateMatchPlayers(
            updated,
            params.player1Id,
            params.player2Id,
          );
        }

        if (params.outcome !== undefined) {
          updated = updateMatchOutcome(updated, params.outcome);
        }

        await deps.matchRepository.save(updated);
        await recordHistory("UPDATE", updated, params.actorId);
        return updated;
      });
    },

    async deleteMatch(params: {
      actorId: UserId;
      id: MatchId;
    }): Promise<Match> {
      return run(async () => {
        const match = await deps.matchRepository.findById(params.id);
        if (!match) {
          throw new Error("Match not found");
        }
        if (match.deletedAt) {
          throw new Error("Match is deleted");
        }
        const session = await deps.circleSessionRepository.findById(
          match.circleSessionId,
        );
        if (!session) {
          throw new Error("CircleSession not found");
        }
        const allowed = await deps.accessService.canDeleteMatch(
          params.actorId as string,
          session.circleId as string,
          match.circleSessionId as string,
        );
        if (!allowed) {
          throw new Error("Forbidden");
        }

        const deleted = deleteMatch(match);
        await deps.matchRepository.save(deleted);
        await recordHistory("DELETE", deleted, params.actorId);
        return deleted;
      });
    },

    async getMatch(params: {
      actorId: UserId;
      id: MatchId;
    }): Promise<Match | null> {
      const match = await deps.matchRepository.findById(params.id);
      if (!match) {
        return null;
      }
      const session = await deps.circleSessionRepository.findById(
        match.circleSessionId,
      );
      if (!session) {
        throw new Error("CircleSession not found");
      }
      const allowed = await deps.accessService.canViewMatch(
        params.actorId as string,
        session.circleId as string,
        match.circleSessionId as string,
      );
      if (!allowed) {
        throw new Error("Forbidden");
      }
      return match;
    },

    async listByCircleSessionId(params: {
      actorId: UserId;
      circleSessionId: CircleSessionId;
    }): Promise<Match[]> {
      const session = await deps.circleSessionRepository.findById(
        params.circleSessionId,
      );
      if (!session) {
        throw new Error("CircleSession not found");
      }
      const allowed = await deps.accessService.canViewMatch(
        params.actorId as string,
        session.circleId as string,
        params.circleSessionId as string,
      );
      if (!allowed) {
        throw new Error("Forbidden");
      }
      return deps.matchRepository.listByCircleSessionId(params.circleSessionId);
    },
  };
};
