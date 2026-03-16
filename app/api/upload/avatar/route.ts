import { NextResponse } from "next/server";
import {
  buildServiceContainer,
  getSessionUserId,
} from "@/server/presentation/trpc/context";
import { toUserId } from "@/server/domain/common/ids";
import { BadRequestError, UnauthorizedError } from "@/server/domain/common/errors";

export async function POST(request: Request) {
  let actorId: string;
  try {
    actorId = await getSessionUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { message: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "画像ファイルを選択してください。" },
      { status: 400 },
    );
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { message: "ファイルサイズが大きすぎます" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type;

  const { userService } = buildServiceContainer();

  try {
    await userService.uploadAvatar(toUserId(actorId), buffer, mimeType);
  } catch (e) {
    if (e instanceof BadRequestError) {
      return NextResponse.json({ message: e.message }, { status: 400 });
    }
    console.error("[upload/avatar] Unexpected error:", e);
    return NextResponse.json(
      { message: "アップロードに失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
