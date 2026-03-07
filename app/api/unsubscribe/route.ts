import { NextResponse } from "next/server";
import { createUnsubscribeTokenService } from "@/server/domain/services/unsubscribe-token";
import { buildServiceContainer } from "@/server/presentation/trpc/context";
import { userId } from "@/server/domain/common/ids";

const unsubscribeTokenService = createUnsubscribeTokenService(
  process.env.UNSUBSCRIBE_SECRET || "default-unsubscribe-secret",
);
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

  const extractedUserId = unsubscribeTokenService.verify(token);
  if (!extractedUserId) {
    return NextResponse.json(
      { message: "無効なトークンです。" },
      { status: 400 },
    );
  }

  await notificationPreferenceService.updatePreference(
    userId(extractedUserId),
    false,
  );

  return NextResponse.json(
    { message: "メール配信を停止しました。" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
