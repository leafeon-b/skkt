import { z } from "zod";
import { userIdSchema } from "@/server/presentation/dto/ids";
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
} from "@/server/domain/models/user/user";

const optionalTextSchema = z.string().trim().min(1).nullable();

export const profileVisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export type ProfileVisibilityDto = z.infer<typeof profileVisibilitySchema>;

export const userDtoSchema = z.object({
  id: userIdSchema,
  name: optionalTextSchema,
  email: optionalTextSchema,
  image: optionalTextSchema,
  createdAt: z.date(),
});

export type UserDto = z.infer<typeof userDtoSchema>;

export const userGetInputSchema = z.object({
  userId: userIdSchema,
});

export type UserGetInput = z.infer<typeof userGetInputSchema>;

export const userListInputSchema = z.object({
  userIds: userIdSchema.array(),
});

export type UserListInput = z.infer<typeof userListInputSchema>;

export const meDtoSchema = userDtoSchema.extend({
  hasPassword: z.boolean(),
  profileVisibility: profileVisibilitySchema,
});

export type MeDto = z.infer<typeof meDtoSchema>;

export const updateProfileInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .refine((v) => [...v].length <= USER_NAME_MAX_LENGTH, {
      message: `名前は${String(USER_NAME_MAX_LENGTH)}文字以内で入力してください`,
    })
    .nullable(),
  email: z.string().trim().min(1).max(USER_EMAIL_MAX_LENGTH).nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1).max(USER_PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(8).max(USER_PASSWORD_MAX_LENGTH),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const updateProfileVisibilityInputSchema = z.object({
  visibility: profileVisibilitySchema,
});

export type UpdateProfileVisibilityInput = z.infer<
  typeof updateProfileVisibilityInputSchema
>;

export const opponentsInputSchema = z.object({
  targetUserId: userIdSchema,
});

export const opponentDtoSchema = z.object({
  userId: z.string(),
  name: z.string(),
});

export const opponentRecordInputSchema = z.object({
  targetUserId: userIdSchema,
  opponentId: userIdSchema,
});

export const opponentRecordDtoSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  draws: z.number(),
});
