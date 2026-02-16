import { userId, type CircleId, type UserId } from "@/server/domain/common/ids";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleParticipation } from "@/server/domain/models/circle/circle-participation";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import {
  assertCanAddCircleMemberWithRole,
  assertCanChangeCircleMemberRole,
  assertCanRemoveCircleMember,
  assertSingleCircleOwner,
  transferCircleOwnership,
} from "@/server/domain/services/authz/ownership";
import { CircleRole } from "@/server/domain/services/authz/roles";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/domain/common/errors";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleParticipationServiceDeps = {
  circleParticipationRepository: CircleParticipationRepository;
  circleRepository: CircleRepository;
  accessService: AccessService;
};

export type UserCircleParticipation = {
  circleId: CircleId;
  circleName: string;
  role: CircleRole;
};

export const createCircleParticipationService = (
  deps: CircleParticipationServiceDeps,
) => ({
  async listByCircleId(params: {
    actorId: string;
    circleId: CircleId;
  }): Promise<CircleParticipation[]> {
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

    return deps.circleParticipationRepository.listByCircleId(params.circleId);
  },

  async listByUserId(params: {
    actorId: string;
    userId: UserId;
  }): Promise<UserCircleParticipation[]> {
    if (params.userId !== userId(params.actorId)) {
      throw new ForbiddenError();
    }
    const allowed = await deps.accessService.canListOwnCircles(params.actorId);
    if (!allowed) {
      throw new ForbiddenError();
    }

    const participations =
      await deps.circleParticipationRepository.listByUserId(params.userId);
    const uniqueCircleIds = Array.from(
      new Set(participations.map((participation) => participation.circleId)),
    );
    const circles = await deps.circleRepository.findByIds(uniqueCircleIds);
    if (circles.length !== uniqueCircleIds.length) {
      throw new NotFoundError("Circle");
    }
    const circlesById = new Map(circles.map((circle) => [circle.id, circle]));

    return participations.map((participation) => {
      const circle = circlesById.get(participation.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }
      return {
        circleId: participation.circleId,
        circleName: circle.name,
        role: participation.role,
      };
    });
  },

  async addParticipation(params: {
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

    const participations =
      await deps.circleParticipationRepository.listByCircleId(params.circleId);

    if (participations.some((member) => member.userId === params.userId)) {
      throw new BadRequestError("Participation already exists");
    }

    assertCanAddCircleMemberWithRole(participations, params.role);

    await deps.circleParticipationRepository.addParticipation(
      params.circleId,
      params.userId,
      params.role,
    );
  },

  async changeParticipationRole(params: {
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

    const participations =
      await deps.circleParticipationRepository.listByCircleId(params.circleId);
    const target = participations.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new NotFoundError("Participation");
    }

    assertCanChangeCircleMemberRole(target.role, params.role);

    await deps.circleParticipationRepository.updateParticipationRole(
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

    const participations =
      await deps.circleParticipationRepository.listByCircleId(params.circleId);

    const updated = transferCircleOwnership(
      participations,
      params.fromUserId,
      params.toUserId,
    );
    assertSingleCircleOwner(updated);

    const before = new Map(
      participations.map((member) => [member.userId, member.role]),
    );

    for (const member of updated) {
      if (before.get(member.userId) !== member.role) {
        await deps.circleParticipationRepository.updateParticipationRole(
          params.circleId,
          member.userId,
          member.role,
        );
      }
    }
  },

  async withdrawParticipation(params: {
    actorId: string;
    circleId: CircleId;
  }): Promise<void> {
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

    const participations =
      await deps.circleParticipationRepository.listByCircleId(params.circleId);
    const actor = participations.find(
      (member) => member.userId === userId(params.actorId),
    );

    if (!actor) {
      throw new NotFoundError("Participation");
    }

    assertCanRemoveCircleMember(actor.role);

    await deps.circleParticipationRepository.removeParticipation(
      params.circleId,
      actor.userId,
    );
  },

  async removeParticipation(params: {
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

    const participations =
      await deps.circleParticipationRepository.listByCircleId(params.circleId);
    const target = participations.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new NotFoundError("Participation");
    }

    assertCanRemoveCircleMember(target.role);

    await deps.circleParticipationRepository.removeParticipation(
      params.circleId,
      params.userId,
    );
  },
});
