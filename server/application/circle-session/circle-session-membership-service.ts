import {
  userId,
  type CircleId,
  type CircleSessionId,
  type UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import {
  assertCanAddSessionMemberWithRole,
  assertCanChangeCircleSessionMemberRole,
  assertCanRemoveCircleSessionMember,
  assertCanWithdrawFromSession,
  assertSingleCircleSessionOwner,
  transferCircleSessionOwnership,
} from "@/server/domain/services/authz/ownership";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/domain/common/errors";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleSessionMembershipServiceDeps = {
  circleRepository: CircleRepository;
  circleSessionRepository: CircleSessionRepository;
  accessService: AccessService;
};

export type UserCircleSessionMembershipSummary = {
  circleSessionId: CircleSessionId;
  circleId: CircleId;
  circleName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
};

export const createCircleSessionMembershipService = (
  deps: CircleSessionMembershipServiceDeps,
) => ({
  async countPastSessionsByUserId(targetUserId: UserId): Promise<number> {
    const memberships =
      await deps.circleSessionRepository.listMembershipsByUserId(targetUserId);
    if (memberships.length === 0) {
      return 0;
    }

    const sessionIds = memberships.map((p) => p.circleSessionId);
    const sessions = await deps.circleSessionRepository.findByIds(sessionIds);

    const now = new Date();
    return sessions.filter((s) => s.endsAt <= now).length;
  },

  async listMemberships(params: {
    actorId: string;
    circleSessionId: CircleSessionId;
  }): Promise<CircleSessionMembership[]> {
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
    return deps.circleSessionRepository.listMemberships(params.circleSessionId);
  },

  async listByUserId(params: {
    actorId: string;
    userId: UserId;
    limit?: number;
  }): Promise<UserCircleSessionMembershipSummary[]> {
    if (params.userId !== userId(params.actorId)) {
      throw new ForbiddenError();
    }
    const allowed = await deps.accessService.canListOwnCircles(params.actorId);
    if (!allowed) {
      throw new ForbiddenError();
    }

    const memberships =
      await deps.circleSessionRepository.listMembershipsByUserId(params.userId);
    if (memberships.length === 0) {
      return [];
    }

    const uniqueSessionIds = Array.from(
      new Set(memberships.map((membership) => membership.circleSessionId)),
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
      return {
        circleSessionId: session.id,
        circleId: session.circleId,
        circleName,
        title: session.title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        location: session.location ?? null,
      };
    });

    summaries.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

    if (params.limit != null) {
      return summaries.slice(0, params.limit);
    }

    return summaries;
  },

  async addMembership(params: {
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

    const circleMembership =
      await deps.circleRepository.findMembershipByCircleAndUser(
        session.circleId,
        params.userId,
      );
    if (!circleMembership) {
      throw new BadRequestError("User is not an active member of the circle");
    }

    const memberships = await deps.circleSessionRepository.listMemberships(
      params.circleSessionId,
    );

    if (memberships.some((member) => member.userId === params.userId)) {
      throw new ConflictError("Membership already exists");
    }

    assertCanAddSessionMemberWithRole(memberships, params.role);

    await deps.circleSessionRepository.addMembership(
      params.circleSessionId,
      params.userId,
      params.role,
    );
  },

  async changeMembershipRole(params: {
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
    const memberships = await deps.circleSessionRepository.listMemberships(
      params.circleSessionId,
    );
    const target = memberships.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new NotFoundError("Membership");
    }

    assertCanChangeCircleSessionMemberRole(target.role, params.role);

    await deps.circleSessionRepository.updateMembershipRole(
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
    const memberships = await deps.circleSessionRepository.listMemberships(
      params.circleSessionId,
    );

    const updated = transferCircleSessionOwnership(
      memberships,
      params.fromUserId,
      params.toUserId,
    );
    assertSingleCircleSessionOwner(updated);

    const before = new Map(
      memberships.map((member) => [member.userId, member.role]),
    );

    for (const member of updated) {
      if (before.get(member.userId) !== member.role) {
        await deps.circleSessionRepository.updateMembershipRole(
          params.circleSessionId,
          member.userId,
          member.role,
        );
      }
    }
  },

  async removeMembership(params: {
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
    const memberships = await deps.circleSessionRepository.listMemberships(
      params.circleSessionId,
    );
    const target = memberships.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new NotFoundError("Membership");
    }

    assertCanRemoveCircleSessionMember(target.role);

    const deletedAt = new Date();
    await deps.circleSessionRepository.removeMembership(
      params.circleSessionId,
      params.userId,
      deletedAt,
    );
  },

  async withdrawMembership(params: {
    actorId: string;
    circleSessionId: CircleSessionId;
  }): Promise<void> {
    const session = await deps.circleSessionRepository.findById(
      params.circleSessionId,
    );
    if (!session) {
      throw new NotFoundError("CircleSession");
    }

    const allowed = await deps.accessService.canWithdrawFromCircleSession(
      params.actorId,
      params.circleSessionId as string,
    );
    if (!allowed) {
      throw new ForbiddenError();
    }

    const memberships = await deps.circleSessionRepository.listMemberships(
      params.circleSessionId,
    );
    const actor = memberships.find(
      (member) => member.userId === userId(params.actorId),
    );

    if (!actor) {
      throw new NotFoundError("Membership");
    }

    assertCanWithdrawFromSession(actor.role);

    const deletedAt = new Date();
    await deps.circleSessionRepository.removeMembership(
      params.circleSessionId,
      userId(params.actorId),
      deletedAt,
    );
  },
});
