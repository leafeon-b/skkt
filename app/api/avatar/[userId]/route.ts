import { NextResponse } from "next/server";
import { buildServiceContainer } from "@/server/presentation/trpc/context";
import { toUserId } from "@/server/domain/common/ids";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const { userService } = buildServiceContainer();
  const imageData = await userService.findImageData(toUserId(userId));

  if (!imageData) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(imageData.data), {
    status: 200,
    headers: {
      "Content-Type": imageData.mimeType,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
