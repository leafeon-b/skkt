import type { Circle } from "@/server/domain/models/circle/circle";
import {
  createCircle,
  renameCircle,
} from "@/server/domain/models/circle/circle";
import { userId } from "@/server/domain/common/ids";
import type { CircleId } from "@/server/domain/common/ids";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import type {
  Repositories,
  UnitOfWork,
} from "@/server/application/common/unit-of-work";
import { CircleRole } from "@/server/domain/services/authz/roles";
import { ForbiddenError, NotFoundError } from "@/server/domain/common/errors";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleServiceDeps = {
  circleRepository: CircleRepository;
  circleParticipationRepository: CircleParticipationRepository;
  accessService: AccessService;
  unitOfWork?: UnitOfWork;
};

export const createCircleService = (deps: CircleServiceDeps) => {
  const uow: UnitOfWork =
    deps.unitOfWork ?? (async (op) => op(deps as unknown as Repositories));

  return {
    async createCircle(params: {
      actorId: string;
      id: CircleId;
      name: string;
      createdAt?: Date;
    }): Promise<Circle> {
      const allowed = await deps.accessService.canCreateCircle(params.actorId);
      if (!allowed) {
        throw new ForbiddenError();
      }
      const circle = createCircle({
        id: params.id,
        name: params.name,
        createdAt: params.createdAt,
      });
      await uow(async (repos) => {
        await repos.circleRepository.save(circle);
        await repos.circleParticipationRepository.addParticipation(
          circle.id,
          userId(params.actorId),
          CircleRole.CircleOwner,
        );
      });
      return circle;
    },

    async renameCircle(
      actorId: string,
      id: CircleId,
      name: string,
    ): Promise<Circle> {
      const circle = await deps.circleRepository.findById(id);
      if (!circle) {
        throw new NotFoundError("Circle");
      }
      const allowed = await deps.accessService.canEditCircle(
        actorId,
        id as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const updated = renameCircle(circle, name);
      await deps.circleRepository.save(updated);
      return updated;
    },

    async getCircle(actorId: string, id: CircleId): Promise<Circle | null> {
      const circle = await deps.circleRepository.findById(id);
      if (!circle) {
        return null;
      }
      const allowed = await deps.accessService.canViewCircle(
        actorId,
        id as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }
      return circle;
    },

    async deleteCircle(actorId: string, id: CircleId): Promise<void> {
      const circle = await deps.circleRepository.findById(id);
      if (!circle) {
        throw new NotFoundError("Circle");
      }
      const allowed = await deps.accessService.canDeleteCircle(
        actorId,
        id as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }
      await deps.circleRepository.delete(id);
    },
  };
};
