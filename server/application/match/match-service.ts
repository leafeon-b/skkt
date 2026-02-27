import type { Match } from "@/server/domain/models/match/match";
import {
  createMatch,
  deleteMatch,
  updateMatchOutcome,
  updateMatchPlayers,
} from "@/server/domain/models/match/match";
import type {
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import type {
  Repositories,
  UnitOfWork,
} from "@/server/domain/common/unit-of-work";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/domain/common/errors";

type AccessService = ReturnType<typeof createAccessService>;

export type MatchServiceDeps = {
  matchRepository: MatchRepository;
  circleSessionRepository: CircleSessionRepository;
  accessService: AccessService;
  unitOfWork?: UnitOfWork;
};

export const createMatchService = (deps: MatchServiceDeps) => {
  const uow: UnitOfWork =
    deps.unitOfWork ?? (async (op) => op(deps as unknown as Repositories));

  const ensurePlayersParticipating = async (
    circleSessionRepository: CircleSessionRepository,
    circleSessionId: CircleSessionId,
    player1Id: UserId,
    player2Id: UserId,
  ) => {
    const ok = await circleSessionRepository.areUsersParticipating(
      circleSessionId,
      [player1Id, player2Id],
    );
    if (!ok) {
      throw new BadRequestError("Players must belong to the circle session");
    }
  };

  return {
    async recordMatch(params: {
      actorId: UserId;
      id: MatchId;
      circleSessionId: CircleSessionId;
      player1Id: UserId;
      player2Id: UserId;
      outcome?: Match["outcome"];
    }): Promise<Match> {
      return uow(async (repos) => {
        const session = await repos.circleSessionRepository.findById(
          params.circleSessionId,
        );
        if (!session) {
          throw new NotFoundError("CircleSession");
        }
        const allowed = await deps.accessService.canRecordMatch(
          params.actorId as string,
          session.circleId as string,
          params.circleSessionId as string,
        );
        if (!allowed) {
          throw new ForbiddenError();
        }
        await ensurePlayersParticipating(
          repos.circleSessionRepository,
          params.circleSessionId,
          params.player1Id,
          params.player2Id,
        );

        const match = createMatch({
          id: params.id,
          circleSessionId: params.circleSessionId,
          player1Id: params.player1Id,
          player2Id: params.player2Id,
          outcome: params.outcome,
        });
        await repos.matchRepository.save(match);
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
      return uow(async (repos) => {
        const match = await repos.matchRepository.findById(params.id);
        if (!match) {
          throw new NotFoundError("Match");
        }
        if (match.deletedAt) {
          throw new BadRequestError("Match is deleted");
        }
        const session = await repos.circleSessionRepository.findById(
          match.circleSessionId,
        );
        if (!session) {
          throw new NotFoundError("CircleSession");
        }
        const allowed = await deps.accessService.canEditMatch(
          params.actorId as string,
          session.circleId as string,
          match.circleSessionId as string,
        );
        if (!allowed) {
          throw new ForbiddenError();
        }

        let updated = match;

        if (params.player1Id || params.player2Id) {
          if (!params.player1Id || !params.player2Id) {
            throw new BadRequestError(
              "player1Id and player2Id must both be provided",
            );
          }
          await ensurePlayersParticipating(
            repos.circleSessionRepository,
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

        await repos.matchRepository.save(updated);
        return updated;
      });
    },

    async deleteMatch(params: {
      actorId: UserId;
      id: MatchId;
    }): Promise<Match> {
      return uow(async (repos) => {
        const match = await repos.matchRepository.findById(params.id);
        if (!match) {
          throw new NotFoundError("Match");
        }
        if (match.deletedAt) {
          throw new BadRequestError("Match is deleted");
        }
        const session = await repos.circleSessionRepository.findById(
          match.circleSessionId,
        );
        if (!session) {
          throw new NotFoundError("CircleSession");
        }
        const allowed = await deps.accessService.canDeleteMatch(
          params.actorId as string,
          session.circleId as string,
          match.circleSessionId as string,
        );
        if (!allowed) {
          throw new ForbiddenError();
        }

        const deleted = deleteMatch(match);
        await repos.matchRepository.save(deleted);
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
        throw new NotFoundError("CircleSession");
      }
      const allowed = await deps.accessService.canViewMatch(
        params.actorId as string,
        session.circleId as string,
        match.circleSessionId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
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
        throw new NotFoundError("CircleSession");
      }
      const allowed = await deps.accessService.canViewMatch(
        params.actorId as string,
        session.circleId as string,
        params.circleSessionId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }
      return deps.matchRepository.listByCircleSessionId(params.circleSessionId);
    },
  };
};
