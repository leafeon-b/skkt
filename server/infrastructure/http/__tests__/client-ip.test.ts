import { describe, expect, test } from "vitest";
import { getClientIp } from "@/server/infrastructure/http/client-ip";

const createRequest = (headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/test", { headers });

describe("getClientIp", () => {
  test("x-real-ip がある場合はそれを優先する", () => {
    const req = createRequest({
      "x-real-ip": "9.8.7.6",
      "x-forwarded-for": "1.2.3.4, 10.0.0.1",
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  test("x-real-ip の値に空白がある場合はトリムされる", () => {
    const req = createRequest({ "x-real-ip": "  9.8.7.6 " });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  test("x-real-ip が無い場合は x-forwarded-for の最左 IP を返す", () => {
    const req = createRequest({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  test("x-forwarded-for が単一 IP の場合そのまま返す", () => {
    const req = createRequest({ "x-forwarded-for": "192.168.1.1" });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  test("どちらのヘッダーも無い場合は unknown を返す", () => {
    const req = createRequest();
    expect(getClientIp(req)).toBe("unknown");
  });

  test("x-forwarded-for が空文字の場合は unknown を返す", () => {
    const req = createRequest({ "x-forwarded-for": "" });
    expect(getClientIp(req)).toBe("unknown");
  });

  test("x-forwarded-for の値に空白がある場合はトリムされる", () => {
    const req = createRequest({ "x-forwarded-for": "  1.2.3.4 , 10.0.0.1" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  test("IPv6 アドレスを返す", () => {
    const req = createRequest({ "x-forwarded-for": "::1" });
    expect(getClientIp(req)).toBe("::1");
  });
});
