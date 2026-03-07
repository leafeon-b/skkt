import { describe, test, expect, vi, beforeEach } from "vitest";
import { createNotificationPreferenceService } from "@/server/application/notification/notification-preference-service";
import { toUserId } from "@/server/domain/common/ids";
import type { NotificationPreferenceRepository } from "@/server/domain/models/notification-preference/notification-preference-repository";
import type { UnsubscribeTokenService } from "@/server/domain/services/unsubscribe-token";

const mockNotificationPreferenceRepository = {
  findByUserId: vi.fn(),
  findByUserIds: vi.fn(),
  save: vi.fn(),
} as unknown as NotificationPreferenceRepository;

const mockUnsubscribeTokenService: UnsubscribeTokenService = {
  generate: vi.fn(),
  verify: vi.fn(),
};

const service = createNotificationPreferenceService({
  notificationPreferenceRepository: mockNotificationPreferenceRepository,
  unsubscribeTokenService: mockUnsubscribeTokenService,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationPreferenceService", () => {
  describe("getPreference", () => {
    test("レコード未存在時に emailEnabled: true のデフォルトを返す", async () => {
      vi.mocked(mockNotificationPreferenceRepository.findByUserId).mockResolvedValue(null);

      const result = await service.getPreference(toUserId("user-1"));

      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: true });
    });

    test("レコード存在時にそのまま返す", async () => {
      const existing = { userId: toUserId("user-1"), emailEnabled: false };
      vi.mocked(mockNotificationPreferenceRepository.findByUserId).mockResolvedValue(existing);

      const result = await service.getPreference(toUserId("user-1"));

      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
    });
  });

  describe("updatePreference", () => {
    test("リポジトリに保存し、保存した設定を返す", async () => {
      vi.mocked(mockNotificationPreferenceRepository.save).mockResolvedValue(undefined);

      const result = await service.updatePreference(toUserId("user-1"), false);

      expect(mockNotificationPreferenceRepository.save).toHaveBeenCalledWith({
        userId: toUserId("user-1"),
        emailEnabled: false,
      });
      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
    });
  });

  describe("disableByToken", () => {
    test("有効なトークンの場合、emailEnabled: false で保存して返す", async () => {
      vi.mocked(mockUnsubscribeTokenService.verify).mockReturnValue("user-1");
      vi.mocked(mockNotificationPreferenceRepository.save).mockResolvedValue(undefined);

      const result = await service.disableByToken("valid-token");

      expect(result).toEqual({ userId: toUserId("user-1"), emailEnabled: false });
      expect(mockNotificationPreferenceRepository.save).toHaveBeenCalledWith({
        userId: toUserId("user-1"),
        emailEnabled: false,
      });
    });

    test("無効なトークンの場合、null を返す", async () => {
      vi.mocked(mockUnsubscribeTokenService.verify).mockReturnValue(null);

      const result = await service.disableByToken("invalid-token");

      expect(result).toBeNull();
      expect(mockNotificationPreferenceRepository.save).not.toHaveBeenCalled();
    });
  });
});
