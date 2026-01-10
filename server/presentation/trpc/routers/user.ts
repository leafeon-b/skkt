import {
  userDtoSchema,
  userGetInputSchema,
  userListInputSchema,
} from "@/server/presentation/dto/user";
import { userMembershipRouter } from "@/server/presentation/trpc/routers/user-membership";
import { userSessionRouter } from "@/server/presentation/trpc/routers/user-session";
import {
  toUserDto,
  toUserDtos,
} from "@/server/presentation/mappers/user-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";
import { userCircleRouter } from "@/server/presentation/trpc/routers/user-circle";

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
  sessions: userSessionRouter,
  circles: userCircleRouter,

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
});
