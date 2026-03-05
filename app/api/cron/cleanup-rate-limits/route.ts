import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { rateLimitCleanupService } from "@/server/presentation/cron/rate-limit-cleanup";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = `Bearer ${cronSecret}`;
  const headerBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);

  if (
    headerBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(headerBuf, expectedBuf)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await rateLimitCleanupService.cleanupExpired();

    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("[cron] cleanup-rate-limits failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
