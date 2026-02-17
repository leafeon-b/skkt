import { z } from "zod";
import { userIdSchema } from "@/server/presentation/dto/ids";

const optionalTextSchema = z.string().trim().min(1).nullable();

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
});

export type MeDto = z.infer<typeof meDtoSchema>;

export const updateProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(50).nullable(),
  email: z.string().trim().min(1).max(254).nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
