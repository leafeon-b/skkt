import type { CircleInviteLink } from "@/server/domain/models/circle/circle-invite-link";
import type { InviteLinkInfo } from "@/server/application/circle/circle-invite-link-service";
import {
  circleInviteLinkDtoSchema,
  circleInviteLinkInfoDtoSchema,
  type CircleInviteLinkDto,
  type CircleInviteLinkInfoDto,
} from "@/server/presentation/dto/circle-invite-link";

export const toCircleInviteLinkDto = (
  link: CircleInviteLink,
): CircleInviteLinkDto => circleInviteLinkDtoSchema.parse(link);

export const toCircleInviteLinkInfoDto = (
  info: InviteLinkInfo,
): CircleInviteLinkInfoDto => circleInviteLinkInfoDtoSchema.parse(info);
