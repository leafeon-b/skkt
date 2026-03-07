import {
  notificationPreferenceDtoSchema,
  updateNotificationPreferenceInputSchema,
} from "@/server/presentation/dto/notification-preference";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const notificationPreferenceRouter = router({
  get: protectedProcedure
    .output(notificationPreferenceDtoSchema)
    .query(({ ctx }) =>
      handleTrpcError(async () => {
        const pref =
          await ctx.notificationPreferenceService.getPreference(ctx.actorId);
        return { emailEnabled: pref.emailEnabled };
      }),
    ),

  update: protectedProcedure
    .input(updateNotificationPreferenceInputSchema)
    .output(notificationPreferenceDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const pref =
          await ctx.notificationPreferenceService.updatePreference(
            ctx.actorId,
            input.emailEnabled,
          );
        return { emailEnabled: pref.emailEnabled };
      }),
    ),
});
