import { randomUUID } from "crypto";
import {
  circleInviteLinkId,
  userId,
  type CircleId,
} from "@/server/domain/common/ids";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/domain/common/errors";
import {
  createCircleInviteLink,
  isExpired,
  type CircleInviteLink,
} from "@/server/domain/models/circle/circle-invite-link";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle/circle-invite-link-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import { CircleRole } from "@/server/domain/services/authz/roles";

type AccessService = ReturnType<typeof createAccessService>;

const DEFAULT_EXPIRY_DAYS = 7;

export type CircleInviteLinkServiceDeps = {
  circleInviteLinkRepository: CircleInviteLinkRepository;
  circleRepository: CircleRepository;
  circleParticipationRepository: CircleParticipationRepository;
  accessService: AccessService;
  generateToken?: () => string;
  generateId?: () => string;
};

export type InviteLinkInfo = {
  token: string;
  circleName: string;
  circleId: CircleId;
  expired: boolean;
};

export const createCircleInviteLinkService = (
  deps: CircleInviteLinkServiceDeps,
) => ({
  async createInviteLink(params: {
    actorId: string;
    circleId: CircleId;
    expiryDays?: number;
  }): Promise<CircleInviteLink> {
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

    // BR-011: 1研究会1有効リンク制約 — 既存の有効リンクがあればそれを返す（冪等方式）
    const activeLink =
      await deps.circleInviteLinkRepository.findActiveByCircleId(
        params.circleId,
      );
    if (activeLink) {
      return activeLink;
    }

    const generateToken = deps.generateToken ?? randomUUID;
    const generateId = deps.generateId ?? randomUUID;

    const days = params.expiryDays ?? DEFAULT_EXPIRY_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const link = createCircleInviteLink({
      id: circleInviteLinkId(generateId()),
      circleId: params.circleId,
      token: generateToken(),
      createdByUserId: userId(params.actorId),
      expiresAt,
    });

    await deps.circleInviteLinkRepository.save(link);

    return link;
  },

  async getInviteLinkInfo(params: { token: string }): Promise<InviteLinkInfo> {
    const link = await deps.circleInviteLinkRepository.findByToken(
      params.token,
    );
    if (!link) {
      throw new NotFoundError("InviteLink");
    }

    const circle = await deps.circleRepository.findById(link.circleId);
    if (!circle) {
      throw new NotFoundError("Circle");
    }

    return {
      token: link.token,
      circleName: circle.name,
      circleId: circle.id,
      expired: isExpired(link),
    };
  },

  async redeemInviteLink(params: {
    actorId: string;
    token: string;
  }): Promise<{ circleId: CircleId; alreadyMember: boolean }> {
    const link = await deps.circleInviteLinkRepository.findByToken(
      params.token,
    );
    if (!link) {
      throw new NotFoundError("InviteLink");
    }

    if (isExpired(link)) {
      throw new BadRequestError("Invite link has expired");
    }

    const circle = await deps.circleRepository.findById(link.circleId);
    if (!circle) {
      throw new NotFoundError("Circle");
    }

    const participations =
      await deps.circleParticipationRepository.listByCircleId(link.circleId);
    const alreadyMember = participations.some(
      (p) => p.userId === userId(params.actorId),
    );

    if (alreadyMember) {
      return { circleId: link.circleId, alreadyMember: true };
    }

    await deps.circleParticipationRepository.addParticipation(
      link.circleId,
      userId(params.actorId),
      CircleRole.CircleMember,
    );

    return { circleId: link.circleId, alreadyMember: false };
  },
});
