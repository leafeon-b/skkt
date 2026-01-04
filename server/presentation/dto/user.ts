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
