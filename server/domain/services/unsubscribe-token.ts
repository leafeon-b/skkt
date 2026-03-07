import { createHmac, timingSafeEqual } from "node:crypto";

export type UnsubscribeTokenService = {
  generate(userId: string): string;
  verify(token: string): string | null;
};

export const createUnsubscribeTokenService = (
  secret: string,
): UnsubscribeTokenService => {
  const sign = (userId: string): string =>
    createHmac("sha256", secret).update(userId).digest("hex");

  return {
    generate(userId: string): string {
      const signature = sign(userId);
      return Buffer.from(`${userId}:${signature}`).toString("base64url");
    },

    verify(token: string): string | null {
      try {
        const decoded = Buffer.from(token, "base64url").toString();
        const separatorIndex = decoded.lastIndexOf(":");
        if (separatorIndex === -1) return null;

        const extractedUserId = decoded.slice(0, separatorIndex);
        const signature = decoded.slice(separatorIndex + 1);

        if (!extractedUserId || !signature) return null;

        const expected = sign(extractedUserId);
        if (
          signature.length !== expected.length ||
          !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
        )
          return null;

        return extractedUserId;
      } catch {
        return null;
      }
    },
  };
};
