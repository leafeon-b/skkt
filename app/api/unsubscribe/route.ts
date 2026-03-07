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

  const redirectUrl = new URL("/unsubscribe", request.url);
  if (token) {
    redirectUrl.searchParams.set("token", token);
  }
  return NextResponse.redirect(redirectUrl, 302);
}

export async function POST(request: Request) {
  let token: string | null = null;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    token = typeof body.token === "string" ? body.token.trim() || null : null;
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const raw = formData.get("token");
    token = typeof raw === "string" ? raw.trim() || null : null;
  } else {
    return NextResponse.json(
      { message: "Unsupported Content-Type" },
      { status: 415 },
    );
  }

  if (!token) {
    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get("token")?.trim() || null;
    if (queryToken) {
      token = queryToken;
    }
  }

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
