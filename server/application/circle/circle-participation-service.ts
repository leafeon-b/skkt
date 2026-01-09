import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleParticipation } from "@/server/domain/models/circle/circle-participation";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import {
  assertSingleCircleOwner,
  transferCircleOwnership,
} from "@/server/domain/services/authz/ownership";
import { CircleRole } from "@/server/domain/services/authz/roles";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleParticipationServiceDeps = {
  circleParticipationRepository: CircleParticipationRepository;
  circleRepository: CircleRepository;
  accessService: AccessService;
};

export const createCircleParticipationService = (
  deps: CircleParticipationServiceDeps,
) => ({
  async listParticipations(params: {
    actorId: string;
    circleId: CircleId;
  }): Promise<CircleParticipation[]> {
    const circle = await deps.circleRepository.findById(params.circleId);
    if (!circle) {
      throw new Error("Circle not found");
    }

    const allowed = await deps.accessService.canViewCircle(
      params.actorId,
      params.circleId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }

    return deps.circleParticipationRepository.listParticipations(
      params.circleId,
    );
  },

  async addParticipation(params: {
    actorId: string;
    circleId: CircleId;
    userId: UserId;
    role: CircleRole;
  }): Promise<void> {
    const circle = await deps.circleRepository.findById(params.circleId);
    if (!circle) {
      throw new Error("Circle not found");
    }

    const allowed = await deps.accessService.canAddCircleMember(
      params.actorId,
      params.circleId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const participations =
      await deps.circleParticipationRepository.listParticipations(
        params.circleId,
      );

    if (participations.some((member) => member.userId === params.userId)) {
      throw new Error("Participation already exists");
    }

    const hasOwner = participations.some(
      (member) => member.role === CircleRole.CircleOwner,
    );

    if (!hasOwner && params.role !== CircleRole.CircleOwner) {
      throw new Error("Circle must have exactly one owner");
    }

    if (hasOwner && params.role === CircleRole.CircleOwner) {
      throw new Error("Circle must have exactly one owner");
    }

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
      throw new Error("Circle not found");
    }

    const allowed = await deps.accessService.canChangeCircleMemberRole(
      params.actorId,
      params.userId as string,
      params.circleId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }

    if (params.role === CircleRole.CircleOwner) {
      throw new Error("Use transferOwnership to assign owner");
    }

    const participations =
      await deps.circleParticipationRepository.listParticipations(
        params.circleId,
      );
    const target = participations.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new Error("Participation not found");
    }

    if (target.role === CircleRole.CircleOwner) {
      throw new Error("Use transferOwnership to change owner");
    }

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
      throw new Error("Circle not found");
    }

    const allowed = await deps.accessService.canTransferCircleOwnership(
      params.actorId,
      params.circleId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const participations =
      await deps.circleParticipationRepository.listParticipations(
        params.circleId,
      );

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

  async removeParticipation(params: {
    actorId: string;
    circleId: CircleId;
    userId: UserId;
  }): Promise<void> {
    const circle = await deps.circleRepository.findById(params.circleId);
    if (!circle) {
      throw new Error("Circle not found");
    }

    const allowed = await deps.accessService.canRemoveCircleMember(
      params.actorId,
      params.circleId as string,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const participations =
      await deps.circleParticipationRepository.listParticipations(
        params.circleId,
      );
    const target = participations.find(
      (member) => member.userId === params.userId,
    );

    if (!target) {
      throw new Error("Participation not found");
    }

    if (target.role === CircleRole.CircleOwner) {
      throw new Error("Use transferOwnership to remove owner");
    }

    await deps.circleParticipationRepository.removeParticipation(
      params.circleId,
      params.userId,
    );
  },
});
