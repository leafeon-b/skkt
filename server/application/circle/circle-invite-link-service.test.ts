import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleInviteLinkService } from "@/server/application/circle/circle-invite-link-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle/circle-invite-link-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import { circleId, circleInviteLinkId, userId } from "@/server/domain/common/ids";

const circleInviteLinkRepository = {
  findByToken: vi.fn(),
  findActiveByCircleId: vi.fn(),
  listByCircleId: vi.fn(),
  save: vi.fn(),
} satisfies CircleInviteLinkRepository;

const circleRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleRepository;

const circleParticipationRepository = {
  listByCircleId: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  removeParticipation: vi.fn(),
} satisfies CircleParticipationRepository;

const accessService = createAccessServiceStub();

const service = createCircleInviteLinkService({
  circleInviteLinkRepository,
  circleRepository,
  circleParticipationRepository,
  accessService,
  generateToken: () => "test-token",
  generateId: () => "test-id",
});

const baseCircle = () => ({
  id: circleId("circle-1"),
  name: "テスト研究会",
  createdAt: new Date(),
});

const baseLink = () => ({
  id: circleInviteLinkId("link-1"),
  circleId: circleId("circle-1"),
  token: "test-token",
  createdByUserId: userId("user-1"),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(circleRepository.findById).mockResolvedValue(baseCircle());
  vi.mocked(accessService.canViewCircle).mockResolvedValue(true);
  vi.mocked(circleInviteLinkRepository.findActiveByCircleId).mockResolvedValue(
    null,
  );
});

describe("招待リンクサービス", () => {
  describe("createInviteLink", () => {
    test("研究会メンバーが招待リンクを作成できる", async () => {
      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: circleId("circle-1"),
      });

      expect(result.token).toBe("test-token");
      expect(result.circleId).toBe("circle-1");
      expect(circleInviteLinkRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          token: "test-token",
          circleId: circleId("circle-1"),
        }),
      );
    });

    test("有効期限のカスタム日数を指定できる", async () => {
      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: circleId("circle-1"),
        expiryDays: 14,
      });

      const expectedMinExpiry = new Date(
        Date.now() + 13 * 24 * 60 * 60 * 1000,
      );
      expect(result.expiresAt.getTime()).toBeGreaterThan(
        expectedMinExpiry.getTime(),
      );
    });

    test("研究会が存在しない場合はエラー", async () => {
      vi.mocked(circleRepository.findById).mockResolvedValue(null);

      await expect(
        service.createInviteLink({
          actorId: "user-1",
          circleId: circleId("circle-1"),
        }),
      ).rejects.toThrow("Circle not found");
    });

    test("既存の有効リンクがあればそれを返し新規作成しない (BR-011)", async () => {
      const existing = baseLink();
      vi.mocked(
        circleInviteLinkRepository.findActiveByCircleId,
      ).mockResolvedValue(existing);

      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: circleId("circle-1"),
      });

      expect(result).toEqual(existing);
      expect(circleInviteLinkRepository.save).not.toHaveBeenCalled();
    });

    test("有効リンクがなければ新規作成する (BR-011)", async () => {
      // findActiveByCircleId returns null (default mock in beforeEach)

      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: circleId("circle-1"),
      });

      expect(result.token).toBe("test-token");
      expect(circleInviteLinkRepository.save).toHaveBeenCalled();
    });

    test("認可拒否時はエラー", async () => {
      vi.mocked(accessService.canViewCircle).mockResolvedValue(false);

      await expect(
        service.createInviteLink({
          actorId: "user-1",
          circleId: circleId("circle-1"),
        }),
      ).rejects.toThrow("Forbidden");

      expect(circleInviteLinkRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getInviteLinkInfo", () => {
    test("トークンから研究会情報を取得できる", async () => {
      vi.mocked(circleInviteLinkRepository.findByToken).mockResolvedValue(
        baseLink(),
      );

      const result = await service.getInviteLinkInfo({ token: "test-token" });

      expect(result.circleName).toBe("テスト研究会");
      expect(result.circleId).toBe("circle-1");
      expect(result.expired).toBe(false);
    });

    test("期限切れリンクはexpired=trueを返す", async () => {
      const expiredLink = {
        ...baseLink(),
        expiresAt: new Date(Date.now() - 1000),
      };
      vi.mocked(circleInviteLinkRepository.findByToken).mockResolvedValue(
        expiredLink,
      );

      const result = await service.getInviteLinkInfo({ token: "test-token" });

      expect(result.expired).toBe(true);
    });

    test("存在しないトークンはエラー", async () => {
      vi.mocked(circleInviteLinkRepository.findByToken).mockResolvedValue(null);

      await expect(
        service.getInviteLinkInfo({ token: "nonexistent" }),
      ).rejects.toThrow("InviteLink not found");
    });
  });

  describe("redeemInviteLink", () => {
    beforeEach(() => {
      vi.mocked(circleInviteLinkRepository.findByToken).mockResolvedValue(
        baseLink(),
      );
      vi.mocked(circleParticipationRepository.listByCircleId).mockResolvedValue(
        [],
      );
    });

    test("新規ユーザーが招待リンクで参加できる", async () => {
      const result = await service.redeemInviteLink({
        actorId: "user-new",
        token: "test-token",
      });

      expect(result.circleId).toBe("circle-1");
      expect(result.alreadyMember).toBe(false);
      expect(
        circleParticipationRepository.addParticipation,
      ).toHaveBeenCalledWith(
        circleId("circle-1"),
        userId("user-new"),
        "CircleMember",
      );
    });

    test("既存メンバーはalreadyMember=trueを返す", async () => {
      vi.mocked(circleParticipationRepository.listByCircleId).mockResolvedValue(
        [
          {
            circleId: circleId("circle-1"),
            userId: userId("user-existing"),
            role: "CircleMember",
            createdAt: new Date(),
          },
        ],
      );

      const result = await service.redeemInviteLink({
        actorId: "user-existing",
        token: "test-token",
      });

      expect(result.alreadyMember).toBe(true);
      expect(
        circleParticipationRepository.addParticipation,
      ).not.toHaveBeenCalled();
    });

    test("期限切れリンクはエラー", async () => {
      const expiredLink = {
        ...baseLink(),
        expiresAt: new Date(Date.now() - 1000),
      };
      vi.mocked(circleInviteLinkRepository.findByToken).mockResolvedValue(
        expiredLink,
      );

      await expect(
        service.redeemInviteLink({
          actorId: "user-new",
          token: "test-token",
        }),
      ).rejects.toThrow("Invite link has expired");
    });

    test("存在しないトークンはエラー", async () => {
      vi.mocked(circleInviteLinkRepository.findByToken).mockResolvedValue(null);

      await expect(
        service.redeemInviteLink({
          actorId: "user-new",
          token: "nonexistent",
        }),
      ).rejects.toThrow("InviteLink not found");
    });
  });
});
