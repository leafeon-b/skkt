import { userId, type CircleId, type UserId } from "@/server/domain/common/ids";
import type { CircleMembershipRepository } from "@/server/domain/models/circle/circle-membership-repository";
import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import type {
  Repositories,
  UnitOfWork,
} from "@/server/application/common/unit-of-work";
import {
  assertCanAddCircleMemberWithRole,
  assertCanChangeCircleMemberRole,
  assertCanRemoveCircleMember,
  assertCanWithdraw,
  assertSingleCircleOwner,
  transferCircleOwnership,
} from "@/server/domain/services/authz/ownership";
import { CircleRole } from "@/server/domain/services/authz/roles";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/domain/common/errors";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleMembershipServiceDeps = {
  circleMembershipRepository: CircleMembershipRepository;
  circleRepository: CircleRepository;
  accessService: AccessService;
  unitOfWork?: UnitOfWork;
};

export type UserCircleMembership = {
  circleId: CircleId;
  circleName: string;
  role: CircleRole;
};

export const createCircleMembershipService = (
  deps: CircleMembershipServiceDeps,
) => {
  const uow: UnitOfWork =
    deps.unitOfWork ?? (async (op) => op(deps as unknown as Repositories));

  return {
    async listByCircleId(params: {
      actorId: string;
      circleId: CircleId;
    }): Promise<CircleMembership[]> {
      const circle = await deps.circleRepository.findById(params.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }

      const allowed = await deps.accessService.canViewCircle(
        params.actorId,
        params.circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      return deps.circleMembershipRepository.listByCircleId(params.circleId);
    },

    async listByUserId(params: {
      actorId: string;
      userId: UserId;
    }): Promise<UserCircleMembership[]> {
      if (params.userId !== userId(params.actorId)) {
        throw new ForbiddenError();
      }
      const allowed = await deps.accessService.canListOwnCircles(
        params.actorId,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const memberships =
        await deps.circleMembershipRepository.listByUserId(params.userId);
      const uniqueCircleIds = Array.from(
        new Set(memberships.map((membership) => membership.circleId)),
      );
      const circles = await deps.circleRepository.findByIds(uniqueCircleIds);
      if (circles.length !== uniqueCircleIds.length) {
        throw new NotFoundError("Circle");
      }
      const circlesById = new Map(circles.map((circle) => [circle.id, circle]));

      return memberships.map((membership) => {
        const circle = circlesById.get(membership.circleId);
        if (!circle) {
          throw new NotFoundError("Circle");
        }
        return {
          circleId: membership.circleId,
          circleName: circle.name,
          role: membership.role,
        };
      });
    },

    async addMembership(params: {
      actorId: string;
      circleId: CircleId;
      userId: UserId;
      role: CircleRole;
    }): Promise<void> {
      const circle = await deps.circleRepository.findById(params.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }

      const allowed = await deps.accessService.canAddCircleMember(
        params.actorId,
        params.circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const memberships =
        await deps.circleMembershipRepository.listByCircleId(
          params.circleId,
        );

      if (memberships.some((member) => member.userId === params.userId)) {
        throw new ConflictError("Membership already exists");
      }

      assertCanAddCircleMemberWithRole(memberships, params.role);

      await deps.circleMembershipRepository.addMembership(
        params.circleId,
        params.userId,
        params.role,
      );
    },

    async changeMembershipRole(params: {
      actorId: string;
      circleId: CircleId;
      userId: UserId;
      role: CircleRole;
    }): Promise<void> {
      const circle = await deps.circleRepository.findById(params.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }

      const allowed = await deps.accessService.canChangeCircleMemberRole(
        params.actorId,
        params.userId as string,
        params.circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const memberships =
        await deps.circleMembershipRepository.listByCircleId(
          params.circleId,
        );
      const target = memberships.find(
        (member) => member.userId === params.userId,
      );

      if (!target) {
        throw new NotFoundError("Membership");
      }

      assertCanChangeCircleMemberRole(target.role, params.role);

      await deps.circleMembershipRepository.updateMembershipRole(
        params.circleId,
        params.userId,
        params.role,
      );
    },

    async transferOwnership(params: {
      actorId: string;
      circleId: CircleId;
      fromUserId: UserId;
      toUserId: UserId;
    }): Promise<void> {
      const circle = await deps.circleRepository.findById(params.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }

      const allowed = await deps.accessService.canTransferCircleOwnership(
        params.actorId,
        params.circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const memberships =
        await deps.circleMembershipRepository.listByCircleId(
          params.circleId,
        );

      const updated = transferCircleOwnership(
        memberships,
        params.fromUserId,
        params.toUserId,
      );
      assertSingleCircleOwner(updated);

      const before = new Map(
        memberships.map((member) => [member.userId, member.role]),
      );

      for (const member of updated) {
        if (before.get(member.userId) !== member.role) {
          await deps.circleMembershipRepository.updateMembershipRole(
            params.circleId,
            member.userId,
            member.role,
          );
        }
      }
    },

    async withdrawMembership(params: {
      actorId: string;
      circleId: CircleId;
    }): Promise<void> {
      const circle = await deps.circleRepository.findById(params.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }

      const allowed = await deps.accessService.canWithdrawFromCircle(
        params.actorId,
        params.circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const memberships =
        await deps.circleMembershipRepository.listByCircleId(
          params.circleId,
        );
      const actor = memberships.find(
        (member) => member.userId === userId(params.actorId),
      );

      if (!actor) {
        throw new NotFoundError("Membership");
      }

      assertCanWithdraw(actor.role);

      await uow(async (repos) => {
        await repos.circleMembershipRepository.removeMembership(
          params.circleId,
          actor.userId,
        );
      });
    },

    async removeMembership(params: {
      actorId: string;
      circleId: CircleId;
      userId: UserId;
    }): Promise<void> {
      const circle = await deps.circleRepository.findById(params.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }

      const allowed = await deps.accessService.canRemoveCircleMember(
        params.actorId,
        params.circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const memberships =
        await deps.circleMembershipRepository.listByCircleId(
          params.circleId,
        );
      const target = memberships.find(
        (member) => member.userId === params.userId,
      );

      if (!target) {
        throw new NotFoundError("Membership");
      }

      assertCanRemoveCircleMember(target.role);

      await uow(async (repos) => {
        await repos.circleMembershipRepository.removeMembership(
          params.circleId,
          params.userId,
        );
      });
    },
  };
};
