import { NextResponse } from "next/server";
import { createSignupService } from "@/server/application/auth/signup-service";
import { prismaSignupRepository } from "@/server/infrastructure/repository/user/prisma-signup-repository";

const signupService = createSignupService({
  signupRepository: prismaSignupRepository,
});

type SignupPayload = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(request: Request) {
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

  const result = await signupService.signup({ email, password, name });

  if (!result.success) {
    const errorMessages = {
      invalid_email: "メールアドレスを入力してください。",
      password_too_short: "パスワードは8文字以上で入力してください。",
      email_exists: "このメールアドレスは既に登録されています。",
    };
    const statusCodes = {
      invalid_email: 400,
      password_too_short: 400,
      email_exists: 409,
    };
    return NextResponse.json(
      { message: errorMessages[result.error] },
      { status: statusCodes[result.error] },
    );
  }

  return NextResponse.json({ id: result.userId }, { status: 201 });
}
