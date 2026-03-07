import { NextResponse } from "next/server";
import { buildServiceContainer } from "@/server/presentation/trpc/context";

const { notificationPreferenceService } = buildServiceContainer();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { message: "トークンが指定されていません。" },
      { status: 400 },
    );
  }

  const result = await notificationPreferenceService.disableByToken(token);
  if (!result) {
    return NextResponse.json(
      { message: "無効なトークンです。" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { message: "メール配信を停止しました。" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
