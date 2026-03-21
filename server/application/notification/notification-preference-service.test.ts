import { describe, test, expect, beforeEach } from "vitest";
import { createNotificationPreferenceService } from "@/server/application/notification/notification-preference-service";
import { toUserId } from "@/server/domain/common/ids";
import { createInMemoryNotificationPreferenceRepository } from "@/server/infrastructure/repository/in-memory";
import type { UnsubscribeTokenService } from "@/server/domain/services/unsubscribe-token";
import { vi } from "vitest";

const repo = createInMemoryNotificationPreferenceRepository();

const mockUnsubscribeTokenService: UnsubscribeTokenService = {
  generate: vi.fn(),
  verify: vi.fn(),
};

const service = createNotificationPreferenceService({
  notificationPreferenceRepository: repo,
  unsubscribeTokenService: mockUnsubscribeTokenService,
});

beforeEach(() => {
  repo._clear();
  vi.clearAllMocks();
});

describe("NotificationPreferenceService", () => {
  describe("getPreference", () => {
    test("レコード未存在時に emailEnabled: true のデフォルトを返す", async () => {
      const result = await service.getPreference(toUserId("user-1"));

      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: true });
    });

    test("レコード存在時にそのまま返す", async () => {
      const existing = { userId: toUserId("user-1"), emailEnabled: false };
      await repo.save(existing);

      const result = await service.getPreference(toUserId("user-1"));

      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
    });
  });

  describe("updatePreference", () => {
    test("リポジトリに保存し、保存した設定を返す", async () => {
      const result = await service.updatePreference(toUserId("user-1"), false);

      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
      const stored = repo._store.get(toUserId("user-1"));
      expect(stored).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
    });
  });

  describe("disableByToken", () => {
    test("有効なトークンの場合、emailEnabled: false で保存して返す", async () => {
      vi.mocked(mockUnsubscribeTokenService.verify).mockReturnValue("user-1");

      const result = await service.disableByToken("valid-token");

      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
      const stored = repo._store.get(toUserId("user-1"));
      expect(stored).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
    });

    test("無効なトークンの場合、null を返す", async () => {
      vi.mocked(mockUnsubscribeTokenService.verify).mockReturnValue(null);

      const result = await service.disableByToken("invalid-token");

      expect(result).toBeNull();
      expect(repo._store.size).toBe(0);
    });
  });
});
