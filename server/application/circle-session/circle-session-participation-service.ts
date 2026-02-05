import {
  userId,
  type CircleId,
  type CircleSessionId,
  type UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import { assertCanRemoveCircleSessionParticipation } from "@/server/domain/services/circle-session/participation";
import {
  assertCanAddParticipantWithRole,
  assertSingleCircleSessionOwner,
  transferCircleSessionOwnership,
} from "@/server/domain/services/authz/ownership";
import { CircleSessionRole } from "@/server/domain/services/authz/roles";
import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/domain/common/errors";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleSessionParticipationServiceDeps = {
  matchRepository: MatchRepository;
  circleRepository: CircleRepository;
  circleSessionRepository: CircleSessionRepository;
  circleSessionParticipationRepository: CircleSessionParticipationRepository;
  accessService: AccessService;
};

export type UserCircleSessionParticipationSummary = {
  circleSessionId: CircleSessionId;
  circleId: CircleId;
  circleName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  status: "scheduled" | "done" | "draft";
};

const buildSessionTitle = (sequence: number) => `第${sequence}回 研究会`;

const getSessionStatus = (
  startsAt: Date,
  endsAt: Date,
): "scheduled" | "done" => {
  const now = new Date();
  if (endsAt < now) {
    return "done";
  }
  if (startsAt > now) {
    return "scheduled";
  }
  return "scheduled";
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
      throw new NotFoundError("CircleSession");
    }
    const allowed = await deps.accessService.canViewCircleSession(
      params.actorId,
      session.circleId as string,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new ForbiddenError();
    }
    return deps.circleSessionParticipationRepository.listParticipations(
      params.circleSessionId,
    );
  },

  async listByUserId(params: {
    actorId: string;
    userId: UserId;
    limit?: number;
  }): Promise<UserCircleSessionParticipationSummary[]> {
    if (params.userId !== userId(params.actorId)) {
      throw new ForbiddenError();
    }
    const allowed = await deps.accessService.canListOwnCircles(
      params.actorId,
    );
    if (!allowed) {
      throw new ForbiddenError();
    }

    const participations =
      await deps.circleSessionParticipationRepository.listByUserId(
        params.userId,
      );
    if (participations.length === 0) {
      return [];
    }

    const uniqueSessionIds = Array.from(
      new Set(
        participations.map((participation) => participation.circleSessionId),
      ),
    );
    const sessions =
      await deps.circleSessionRepository.findByIds(uniqueSessionIds);
    if (sessions.length !== uniqueSessionIds.length) {
      throw new NotFoundError("CircleSession");
    }

    const uniqueCircleIds = Array.from(
      new Set(sessions.map((session) => session.circleId)),
    );
    const circles = await deps.circleRepository.findByIds(uniqueCircleIds);
    if (circles.length !== uniqueCircleIds.length) {
      throw new NotFoundError("Circle");
    }
    const circleNameById = new Map(
      circles.map((circle) => [circle.id as string, circle.name]),
    );

    const summaries = sessions.map((session) => {
      const circleName = circleNameById.get(session.circleId as string);
      if (!circleName) {
        throw new NotFoundError("Circle");
      }
      const trimmedTitle = session.title?.trim();
      const title = trimmedTitle
        ? session.title
        : buildSessionTitle(session.sequence);

      return {
        circleSessionId: session.id,
        circleId: session.circleId,
        circleName,
        title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        location: session.location ?? null,
        status: getSessionStatus(session.startsAt, session.endsAt),
      };
    });

    summaries.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

    if (params.limit != null) {
      return summaries.slice(0, params.limit);
    }

    return summaries;
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
      throw new NotFoundError("CircleSession");
    }
    const allowed = await deps.accessService.canAddCircleSessionMember(
      params.actorId,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new ForbiddenError();
    }
    const participations =
      await deps.circleSessionParticipationRepository.listParticipations(
        params.circleSessionId,
      );

    if (participations.some((member) => member.userId === params.userId)) {
      throw new BadRequestError("Participation already exists");
    }

    assertCanAddParticipantWithRole(participations, params.role);

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
      throw new NotFoundError("CircleSession");
    }
    const allowed = await deps.accessService.canChangeCircleSessionMemberRole(
      params.actorId,
      params.userId as string,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new ForbiddenError();
    }
    if (params.role === CircleSessionRole.CircleSessionOwner) {
      throw new BadRequestError("Use transferOwnership to assign owner");
    }

    const participations =
      await deps.circleSessionParticipationRepository.listParticipations(
        params.circleSessionId,
      );
    const target = participations.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new NotFoundError("Participation");
    }

    if (target.role === CircleSessionRole.CircleSessionOwner) {
      throw new BadRequestError("Use transferOwnership to change owner");
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
      throw new NotFoundError("CircleSession");
    }
    const allowed = await deps.accessService.canTransferCircleSessionOwnership(
      params.actorId,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new ForbiddenError();
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
      throw new NotFoundError("CircleSession");
    }
    const allowed = await deps.accessService.canRemoveCircleSessionMember(
      params.actorId,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new ForbiddenError();
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
