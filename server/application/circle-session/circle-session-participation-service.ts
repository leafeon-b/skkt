import type { CircleSessionId, UserId } from "@/server/domain/common/ids";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import { assertCanRemoveCircleSessionParticipation } from "@/server/domain/services/circle-session/participation";
import {
  assertSingleCircleSessionOwner,
  transferCircleSessionOwnership,
} from "@/server/domain/services/authz/ownership";
import { CircleSessionRole } from "@/server/domain/services/authz/roles";
import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleSessionParticipationServiceDeps = {
  matchRepository: MatchRepository;
  circleSessionRepository: CircleSessionRepository;
  circleSessionParticipationRepository: CircleSessionParticipationRepository;
  accessService: AccessService;
};

export const createCircleSessionParticipationService = (
  deps: CircleSessionParticipationServiceDeps,
) => ({
  async listParticipations(params: {
    actorId: string;
    circleSessionId: CircleSessionId;
  }): Promise<CircleSessionParticipation[]> {
    const session = await deps.circleSessionRepository.findById(
      params.circleSessionId,
    );
    if (!session) {
      throw new Error("CircleSession not found");
    }
    const allowed = await deps.accessService.canViewCircleSession(
      params.actorId,
      session.circleId as string,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }
    return deps.circleSessionParticipationRepository.listParticipations(
      params.circleSessionId,
    );
  },

  async addParticipation(params: {
    actorId: string;
    circleSessionId: CircleSessionId;
    userId: UserId;
    role: CircleSessionRole;
  }): Promise<void> {
    const session = await deps.circleSessionRepository.findById(
      params.circleSessionId,
    );
    if (!session) {
      throw new Error("CircleSession not found");
    }
    const allowed = await deps.accessService.canAddCircleSessionMember(
      params.actorId,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }
    const participations =
      await deps.circleSessionParticipationRepository.listParticipations(
        params.circleSessionId,
      );

    if (participations.some((member) => member.userId === params.userId)) {
      throw new Error("Participation already exists");
    }

    const hasOwner = participations.some(
      (member) => member.role === CircleSessionRole.CircleSessionOwner,
    );

    if (!hasOwner && params.role !== CircleSessionRole.CircleSessionOwner) {
      throw new Error("CircleSession must have exactly one owner");
    }

    if (hasOwner && params.role === CircleSessionRole.CircleSessionOwner) {
      throw new Error("CircleSession must have exactly one owner");
    }

    await deps.circleSessionParticipationRepository.addParticipation(
      params.circleSessionId,
      params.userId,
      params.role,
    );
  },

  async changeParticipationRole(params: {
    actorId: string;
    circleSessionId: CircleSessionId;
    userId: UserId;
    role: CircleSessionRole;
  }): Promise<void> {
    const session = await deps.circleSessionRepository.findById(
      params.circleSessionId,
    );
    if (!session) {
      throw new Error("CircleSession not found");
    }
    const allowed = await deps.accessService.canChangeCircleSessionMemberRole(
      params.actorId,
      params.userId as string,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }
    if (params.role === CircleSessionRole.CircleSessionOwner) {
      throw new Error("Use transferOwnership to assign owner");
    }

    const participations =
      await deps.circleSessionParticipationRepository.listParticipations(
        params.circleSessionId,
      );
    const target = participations.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new Error("Participation not found");
    }

    if (target.role === CircleSessionRole.CircleSessionOwner) {
      throw new Error("Use transferOwnership to change owner");
    }

    await deps.circleSessionParticipationRepository.updateParticipationRole(
      params.circleSessionId,
      params.userId,
      params.role,
    );
  },

  async transferOwnership(params: {
    actorId: string;
    circleSessionId: CircleSessionId;
    fromUserId: UserId;
    toUserId: UserId;
  }): Promise<void> {
    const session = await deps.circleSessionRepository.findById(
      params.circleSessionId,
    );
    if (!session) {
      throw new Error("CircleSession not found");
    }
    const allowed = await deps.accessService.canTransferCircleSessionOwnership(
      params.actorId,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }
    const participations =
      await deps.circleSessionParticipationRepository.listParticipations(
        params.circleSessionId,
      );

    const updated = transferCircleSessionOwnership(
      participations,
      params.fromUserId,
      params.toUserId,
    );
    assertSingleCircleSessionOwner(updated);

    const before = new Map(
      participations.map((member) => [member.userId, member.role]),
    );

    for (const member of updated) {
      if (before.get(member.userId) !== member.role) {
        await deps.circleSessionParticipationRepository.updateParticipationRole(
          params.circleSessionId,
          member.userId,
          member.role,
        );
      }
    }
  },

  async removeParticipation(params: {
    actorId: string;
    circleSessionId: CircleSessionId;
    userId: UserId;
  }): Promise<void> {
    const session = await deps.circleSessionRepository.findById(
      params.circleSessionId,
    );
    if (!session) {
      throw new Error("CircleSession not found");
    }
    const allowed = await deps.accessService.canRemoveCircleSessionMember(
      params.actorId,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }
    const matches = await deps.matchRepository.listByCircleSessionId(
      params.circleSessionId,
    );
    assertCanRemoveCircleSessionParticipation(matches, params.userId);
    await deps.circleSessionParticipationRepository.removeParticipation(
      params.circleSessionId,
      params.userId,
    );
  },
});
