import { randomBytes, scryptSync } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/server/infrastructure/db";

const HASH_PREFIX = "scrypt";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 8;

const hashPassword = (password: string): string => {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return [
    HASH_PREFIX,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
};

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

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { message: "メールアドレスを入力してください。" },
      { status: 400 },
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      {
        message: `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`,
      },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { message: "このメールアドレスは既に登録されています。" },
      { status: 409 },
    );
  }

  const passwordHash = hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
