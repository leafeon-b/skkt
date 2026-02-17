import {
  changePasswordInputSchema,
  meDtoSchema,
  updateProfileInputSchema,
  userDtoSchema,
  userGetInputSchema,
  userListInputSchema,
} from "@/server/presentation/dto/user";
import { userMembershipRouter } from "@/server/presentation/trpc/routers/user-membership";
import {
  toUserDto,
  toUserDtos,
} from "@/server/presentation/mappers/user-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";
import { userCircleRouter } from "@/server/presentation/trpc/routers/user-circle";
import { userCircleSessionRouter } from "@/server/presentation/trpc/routers/user-circle-session";
import { userId } from "@/server/domain/common/ids";
import { z } from "zod";

export const userRouter = router({
  get: publicProcedure
    .input(userGetInputSchema)
    .output(userDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const user = await ctx.userService.getUser(ctx.actorId, input.userId);
        if (!user) {
          throw new Error("User not found");
        }
        return toUserDto(user);
      }),
    ),

  memberships: userMembershipRouter,
  circles: userCircleRouter,
  circleSessions: userCircleSessionRouter,

  list: publicProcedure
    .input(userListInputSchema)
    .output(userDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const users = await ctx.userService.listUsers(
          ctx.actorId,
          input.userIds,
        );
        return toUserDtos(users);
      }),
    ),

  me: publicProcedure.output(meDtoSchema).query(({ ctx }) =>
    handleTrpcError(async () => {
      const { user, hasPassword } = await ctx.userService.getMe(
        userId(ctx.actorId),
      );
      return { ...toUserDto(user), hasPassword };
    }),
  ),

  updateProfile: publicProcedure
    .input(updateProfileInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.userService.updateProfile(
          userId(ctx.actorId),
          input.name,
          input.email,
        );
      }),
    ),

  changePassword: publicProcedure
    .input(changePasswordInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.userService.changePassword(
          userId(ctx.actorId),
          input.currentPassword,
          input.newPassword,
        );
      }),
    ),
});
