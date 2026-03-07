import { NextResponse } from "next/server";
import { buildServiceContainer } from "@/server/presentation/trpc/context";
import {
  DomainError,
  type DomainErrorCode,
} from "@/server/domain/common/errors";
import { isValidUnsubscribeToken } from "@/server/domain/common/token-validation";

const { notificationPreferenceService } = buildServiceContainer();

const domainErrorToHttpStatus: Record<DomainErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() || null;

  if (!token) {
    return NextResponse.json(
      { message: "トークンが指定されていません。" },
      { status: 400 },
    );
  }

  if (!isValidUnsubscribeToken(token)) {
    return NextResponse.json(
      { message: "無効なトークンです。" },
      { status: 400 },
    );
  }

  try {
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
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { message: error.message },
        { status: domainErrorToHttpStatus[error.code] },
      );
    }

    console.error("Unhandled error in unsubscribe handler:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
