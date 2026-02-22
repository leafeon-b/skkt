import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import { NotFoundError } from "@/server/domain/common/errors";
import type { UserProfileViewModel } from "@/server/presentation/view-models/user-profile";
import { TRPCError } from "@trpc/server";
import { userId as userIdBrand } from "@/server/domain/common/ids";

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

  const [sessionParticipationCount, { total, byCircle }] = await Promise.all([
    ctx.circleSessionParticipationService.countPastSessionsByUserId(
      brandedUserId,
    ),
    ctx.userStatisticsService.getMatchStatisticsAll(brandedUserId),
  ]);

  return {
    userId: user.id,
    name: user.name ?? "名前未設定",
    image: user.image ?? null,
    sessionParticipationCount,
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
