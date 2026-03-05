import { NextResponse } from "next/server";

import { prisma } from "@/server/infrastructure/db";

const CLEANUP_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24時間

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const threshold = new Date(Date.now() - CLEANUP_THRESHOLD_MS);

    const result = await prisma.rateLimitAttempt.deleteMany({
      where: {
        attemptedAt: { lt: threshold },
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("[cron] cleanup-rate-limits failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
