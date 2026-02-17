import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import {
  createCircleSession,
  rescheduleCircleSession,
} from "@/server/domain/models/circle-session/circle-session";
import type { CircleId, CircleSessionId } from "@/server/domain/common/ids";
import { userId } from "@/server/domain/common/ids";
import { assertNonEmpty } from "@/server/domain/common/validation";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import type {
  Repositories,
  UnitOfWork,
} from "@/server/application/common/unit-of-work";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/domain/common/errors";
import { CircleSessionRole } from "@/server/domain/services/authz/roles";

type AccessService = ReturnType<typeof createAccessService>;

export type CircleSessionServiceDeps = {
  circleRepository: CircleRepository;
  circleSessionRepository: CircleSessionRepository;
  circleSessionParticipationRepository: CircleSessionParticipationRepository;
  accessService: AccessService;
  unitOfWork?: UnitOfWork;
};

export const createCircleSessionService = (deps: CircleSessionServiceDeps) => {
  const uow: UnitOfWork =
    deps.unitOfWork ?? (async (op) => op(deps as unknown as Repositories));

  return {
    async createCircleSession(params: {
      actorId: string;
      id: CircleSessionId;
      circleId: CircleId;
      title: string;
      startsAt: Date;
      endsAt: Date;
      location?: string | null;
      note?: string;
      createdAt?: Date;
    }): Promise<CircleSession> {
      const circle = await deps.circleRepository.findById(params.circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }
      const allowed = await deps.accessService.canCreateCircleSession(
        params.actorId,
        params.circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const session = createCircleSession({
        id: params.id,
        circleId: params.circleId,
        title: params.title,
        startsAt: params.startsAt,
        endsAt: params.endsAt,
        location: params.location,
        note: params.note,
        createdAt: params.createdAt,
      });
      await uow(async (repos) => {
        await repos.circleSessionRepository.save(session);
        await repos.circleSessionParticipationRepository.addParticipation(
          session.id,
          userId(params.actorId),
          CircleSessionRole.CircleSessionOwner,
        );
      });
      return session;
    },

    async rescheduleCircleSession(
      actorId: string,
      id: CircleSessionId,
      startsAt: Date,
      endsAt: Date,
    ): Promise<CircleSession> {
      const session = await deps.circleSessionRepository.findById(id);
      if (!session) {
        throw new NotFoundError("CircleSession");
      }
      const allowed = await deps.accessService.canEditCircleSession(
        actorId,
        id as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const updated = rescheduleCircleSession(session, startsAt, endsAt);
      await deps.circleSessionRepository.save(updated);
      return updated;
    },

    async updateCircleSessionDetails(
      actorId: string,
      id: CircleSessionId,
      params: {
        title?: string;
        startsAt?: Date;
        endsAt?: Date;
        location?: string | null;
        note?: string;
      },
    ): Promise<CircleSession> {
      const session = await deps.circleSessionRepository.findById(id);
      if (!session) {
        throw new NotFoundError("CircleSession");
      }
      const allowed = await deps.accessService.canEditCircleSession(
        actorId,
        id as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      let updated = session;

      if (params.startsAt || params.endsAt) {
        if (!params.startsAt || !params.endsAt) {
          throw new BadRequestError(
            "startsAt and endsAt must both be provided",
          );
        }
        updated = rescheduleCircleSession(
          updated,
          params.startsAt,
          params.endsAt,
        );
      }

      if (params.title !== undefined) {
        updated = {
          ...updated,
          title: assertNonEmpty(params.title, "CircleSession title"),
        };
      }

      if (params.location !== undefined) {
        updated = {
          ...updated,
          location: params.location ?? null,
        };
      }

      if (params.note !== undefined) {
        updated = {
          ...updated,
          note: params.note.trim(),
        };
      }

      await deps.circleSessionRepository.save(updated);
      return updated;
    },

    async getCircleSession(
      actorId: string,
      id: CircleSessionId,
    ): Promise<CircleSession | null> {
      const session = await deps.circleSessionRepository.findById(id);
      if (!session) {
        return null;
      }
      const allowed = await deps.accessService.canViewCircleSession(
        actorId,
        session.circleId as string,
        id as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }
      return session;
    },

    async listByCircleId(
      actorId: string,
      circleId: CircleId,
    ): Promise<CircleSession[]> {
      const circle = await deps.circleRepository.findById(circleId);
      if (!circle) {
        throw new NotFoundError("Circle");
      }
      const allowed = await deps.accessService.canViewCircle(
        actorId,
        circleId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }
      return deps.circleSessionRepository.listByCircleId(circleId);
    },

    async deleteCircleSession(
      actorId: string,
      id: CircleSessionId,
    ): Promise<void> {
      const session = await deps.circleSessionRepository.findById(id);
      if (!session) {
        throw new NotFoundError("CircleSession");
      }
      const allowed = await deps.accessService.canDeleteCircleSession(
        actorId,
        id as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }
      await deps.circleSessionRepository.delete(id);
    },
  };
};
