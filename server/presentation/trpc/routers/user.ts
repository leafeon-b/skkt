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
import { NotFoundError } from "@/server/domain/common/errors";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";
import { userCircleRouter } from "@/server/presentation/trpc/routers/user-circle";
import { userCircleSessionRouter } from "@/server/presentation/trpc/routers/user-circle-session";
import { z } from "zod";

export const userRouter = router({
  get: protectedProcedure
    .input(userGetInputSchema)
    .output(userDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const user = await ctx.userService.getUser(ctx.actorId, input.userId);
        if (!user) {
          throw new NotFoundError("User");
        }
        return toUserDto(user);
      }),
    ),

  memberships: userMembershipRouter,
  circles: userCircleRouter,
  circleSessions: userCircleSessionRouter,

  list: protectedProcedure
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

  me: protectedProcedure.output(meDtoSchema).query(({ ctx }) =>
    handleTrpcError(async () => {
      const { user, hasPassword } = await ctx.userService.getMe(
        ctx.actorId,
      );
      return { ...toUserDto(user), hasPassword };
    }),
  ),

  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.userService.updateProfile(
          ctx.actorId,
          input.name,
          input.email,
        );
      }),
    ),

  changePassword: protectedProcedure
    .input(changePasswordInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.userService.changePassword(
          ctx.actorId,
          input.currentPassword,
          input.newPassword,
        );
      }),
    ),
});
