import type { CircleId } from "@/server/domain/common/ids";
import type { CircleInviteLink } from "@/server/domain/models/circle/circle-invite-link";

export type CircleInviteLinkRepository = {
  findByToken(token: string): Promise<CircleInviteLink | null>;
  listByCircleId(circleId: CircleId): Promise<CircleInviteLink[]>;
  save(link: CircleInviteLink): Promise<void>;
};
