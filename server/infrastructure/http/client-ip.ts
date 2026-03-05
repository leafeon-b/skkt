/**
 * Request から クライアント IP アドレスを取得する。
 * Vercel が設定する x-real-ip を優先し、無ければ x-forwarded-for の最左値を使用。
 * 取得できない場合は "unknown" を返す。
 */
export const getClientIp = (request: Request): string => {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  return "unknown";
};
