import { z } from "zod";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";
import { getHolidayDateStrings } from "@/server/infrastructure/holiday/japanese-holiday-provider";

const MAX_RANGE_MS = 5 * 365.25 * 24 * 60 * 60 * 1000; // ~5年

export const holidayRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          start: z.date(),
          end: z.date(),
        })
        .refine((data) => data.start <= data.end, {
          message: "start must be before or equal to end",
        })
        .refine(
          (data) => data.end.getTime() - data.start.getTime() <= MAX_RANGE_MS,
          { message: "Date range must not exceed 5 years" },
        ),
    )
    .output(z.array(z.string()))
    .query(({ input }) => {
      return getHolidayDateStrings(input.start, input.end);
    }),
});
