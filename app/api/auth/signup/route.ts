import { NextResponse } from "next/server";
import { createSignupService } from "@/server/application/auth/signup-service";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";
import {
  hashPassword,
  verifyPassword,
} from "@/server/infrastructure/auth/password";

const signupService = createSignupService({
  userRepository: prismaUserRepository,
  passwordHasher: { hash: hashPassword, verify: verifyPassword },
});

type SignupPayload = {
  email?: string;
  password?: string;
  name?: string;
  agreedToTerms?: boolean;
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

  const agreedToTerms = body.agreedToTerms === true;

  const result = await signupService.signup({
    email,
    password,
    name,
    agreedToTerms,
  });

  if (!result.success) {
    const errorMessages = {
      terms_not_agreed:
        "利用規約およびプライバシーポリシーに同意してください。",
      invalid_email: "メールアドレスを入力してください。",
      password_too_short: "パスワードは8文字以上で入力してください。",
      password_too_long: "パスワードは128文字以内で入力してください。",
      name_too_long: "表示名は50文字以内で入力してください。",
      email_exists: "このメールアドレスは既に登録されています。",
    };
    const statusCodes = {
      terms_not_agreed: 400,
      invalid_email: 400,
      password_too_short: 400,
      password_too_long: 400,
      name_too_long: 400,
      email_exists: 409,
    };
    return NextResponse.json(
      { message: errorMessages[result.error] },
      { status: statusCodes[result.error] },
    );
  }

  return NextResponse.json({ id: result.userId }, { status: 201 });
}
