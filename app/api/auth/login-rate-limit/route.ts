import { LOGIN_RATE_LIMIT_CONFIG } from "@/server/infrastructure/auth/auth-config";
import { TooManyRequestsError } from "@/server/domain/common/errors";
import { getClientIp } from "@/server/infrastructure/http/client-ip";
import { createPrismaRateLimiter } from "@/server/infrastructure/rate-limit/prisma-rate-limiter";
import { NextResponse } from "next/server";

const loginRateLimiter = createPrismaRateLimiter(LOGIN_RATE_LIMIT_CONFIG);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400 },
    );
  }

  const email = (body as Record<string, unknown>).email;
  if (typeof email !== "string" || email === "") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const clientIp = getClientIp(request);
  const rateLimitKey = `${email}:${clientIp}`;

  try {
    await loginRateLimiter.check(rateLimitKey);
    return NextResponse.json({});
  } catch (e) {
    if (e instanceof TooManyRequestsError) {
      return NextResponse.json({ retryAfterMs: e.retryAfterMs });
    }
    console.error("[login-rate-limit] unexpected error", e);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
