import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import { NotFoundError } from "@/server/domain/common/errors";
import type { UserProfileViewModel } from "@/server/presentation/view-models/user-profile";
import { TRPCError } from "@trpc/server";
import { toUserId as userIdBrand } from "@/server/domain/common/ids";

export async function getUserProfileViewModel(
  userId: string,
): Promise<UserProfileViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  let user;
  try {
    user = await caller.users.get({ userId });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      throw new NotFoundError("User");
    }
    throw error;
  }

  const brandedUserId = userIdBrand(userId);

  const isProfilePublic = await ctx.accessService.canViewUserProfile(
    ctx.actorId!,
    brandedUserId,
  );

  if (!isProfilePublic) {
    return {
      userId: user.id,
      name: user.name ?? "名前未設定",
      image: user.image ?? null,
      isProfilePublic: false,
      sessionMembershipCount: 0,
      matchStatistics: { wins: 0, losses: 0, draws: 0 },
      circleMatchStatistics: [],
    };
  }

  const [sessionMembershipCount, { total, byCircle }] = await Promise.all([
    ctx.circleSessionMembershipService.countPastSessionsByUserId(brandedUserId),
    ctx.userStatisticsService.getMatchStatisticsAll(brandedUserId),
  ]);

  return {
    userId: user.id,
    name: user.name ?? "名前未設定",
    image: user.image ?? null,
    isProfilePublic: true,
    sessionMembershipCount,
    matchStatistics: total,
    circleMatchStatistics: byCircle.map((s) => ({
      circleId: s.circleId,
      circleName: s.circleName,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
    })),
  };
}
