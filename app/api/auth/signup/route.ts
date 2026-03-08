import { NextResponse } from "next/server";
import { buildServiceContainer } from "@/server/presentation/trpc/context";
import { SIGNUP_RATE_LIMIT_CONFIG } from "@/server/infrastructure/auth/auth-config";
import { TooManyRequestsError } from "@/server/domain/common/errors";
import { getClientIp } from "@/server/infrastructure/http/client-ip";
import { createPrismaRateLimiter } from "@/server/infrastructure/rate-limit/prisma-rate-limiter";

const { signupService } = buildServiceContainer();
const signupRateLimiter = createPrismaRateLimiter(SIGNUP_RATE_LIMIT_CONFIG);

type SignupPayload = {
  email?: string;
  password?: string;
  name?: string;
  agreedToTerms?: boolean;
};

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    await signupRateLimiter.check(clientIp);
  } catch (e) {
    if (e instanceof TooManyRequestsError) {
      return NextResponse.json(
        { message: "リクエストが多すぎます。しばらくしてからお試しください。" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.max(1, Math.ceil(e.retryAfterMs / 1000)).toString(),
          },
        },
      );
    }
    throw e;
  }

  const body = (await request.json().catch(() => null)) as SignupPayload | null;
  if (!body) {
    return NextResponse.json(
      { message: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;

  const agreedToTerms = body.agreedToTerms === true;

  const result = await signupService.signup({
    email,
    password,
    name,
    agreedToTerms,
  });

  await signupRateLimiter.recordAttempt(clientIp);

  if (!result.success) {
    const errorMessages = {
      terms_not_agreed:
        "利用規約およびプライバシーポリシーに同意してください。",
      invalid_email: "メールアドレスを入力してください。",
      password_too_short: "パスワードは8文字以上で入力してください。",
      password_too_long: "パスワードは128文字以内で入力してください。",
      name_too_long: "表示名は50文字以内で入力してください。",
      signup_failed: "アカウントの作成に失敗しました。",
    };
    const statusCodes = {
      terms_not_agreed: 400,
      invalid_email: 400,
      password_too_short: 400,
      password_too_long: 400,
      name_too_long: 400,
      signup_failed: 400,
    };
    return NextResponse.json(
      { message: errorMessages[result.error] },
      { status: statusCodes[result.error] },
    );
  }

  return NextResponse.json({ id: result.userId }, { status: 201 });
}
