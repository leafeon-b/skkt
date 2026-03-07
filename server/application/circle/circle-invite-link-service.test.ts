import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleInviteLinkService } from "@/server/application/circle/circle-invite-link-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createInMemoryCircleInviteLinkRepository,
  createInMemoryCircleRepository,
} from "@/server/infrastructure/repository/in-memory";
import {
  toCircleId,
  toCircleInviteLinkId,
  toInviteLinkToken,
  toUserId,
} from "@/server/domain/common/ids";

const circleInviteLinkRepository = createInMemoryCircleInviteLinkRepository();

const circleRepository = createInMemoryCircleRepository();

const accessService = createAccessServiceStub();

const TEST_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440000";
const NONEXISTENT_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440099";

const service = createCircleInviteLinkService({
  circleInviteLinkRepository,
  circleRepository,
  accessService,
  generateToken: () => TEST_TOKEN_UUID,
  generateId: () => "test-id",
});

const baseCircle = () => ({
  id: toCircleId("circle-1"),
  name: "テスト研究会",
  createdAt: new Date(),
  sessionEmailNotificationEnabled: true,
});

const baseLink = () => ({
  id: toCircleInviteLinkId("link-1"),
  circleId: toCircleId("circle-1"),
  token: toInviteLinkToken(TEST_TOKEN_UUID),
  createdByUserId: toUserId("user-1"),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
});

beforeEach(async () => {
  circleInviteLinkRepository._clear();
  circleRepository._clear();
  vi.clearAllMocks();
  await circleRepository.save(baseCircle());
  vi.mocked(accessService.canViewCircle).mockResolvedValue(true);
});

describe("招待リンクサービス", () => {
  describe("createInviteLink", () => {
    test("研究会メンバーが招待リンクを作成できる", async () => {
      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: toCircleId("circle-1"),
      });

      expect(result.token).toBe(TEST_TOKEN_UUID);
      expect(result.circleId).toBe("circle-1");
      const saved = await circleInviteLinkRepository.findByToken(
        toInviteLinkToken(TEST_TOKEN_UUID),
      );
      expect(saved).not.toBeNull();
      expect(saved?.token).toBe(toInviteLinkToken(TEST_TOKEN_UUID));
      expect(saved?.circleId).toBe(toCircleId("circle-1"));
    });

    test("有効期限のカスタム日数を指定できる", async () => {
      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: toCircleId("circle-1"),
        expiryDays: 14,
      });

      const expectedMinExpiry = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000);
      expect(result.expiresAt.getTime()).toBeGreaterThan(
        expectedMinExpiry.getTime(),
      );
    });

    test("研究会が存在しない場合はエラー", async () => {
      circleRepository._circleStore.clear();

      await expect(
        service.createInviteLink({
          actorId: "user-1",
          circleId: toCircleId("circle-1"),
        }),
      ).rejects.toThrow("Circle not found");
    });

    test("既存の有効リンクがあればそれを返し新規作成しない (BR-011)", async () => {
      const existing = baseLink();
      await circleInviteLinkRepository.save(existing);

      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: toCircleId("circle-1"),
      });

      expect(result).toEqual(existing);
      const stored = await circleInviteLinkRepository.findActiveByCircleId(
        toCircleId("circle-1"),
      );
      expect(stored).not.toBeNull();
    });

    test("有効リンクがなければ新規作成する (BR-011)", async () => {
      const result = await service.createInviteLink({
        actorId: "user-1",
        circleId: toCircleId("circle-1"),
      });

      expect(result.token).toBe(TEST_TOKEN_UUID);
      const saved = await circleInviteLinkRepository.findByToken(
        toInviteLinkToken(TEST_TOKEN_UUID),
      );
      expect(saved).not.toBeNull();
    });

    test("認可拒否時はエラー", async () => {
      vi.mocked(accessService.canViewCircle).mockResolvedValue(false);

      await expect(
        service.createInviteLink({
          actorId: "user-1",
          circleId: toCircleId("circle-1"),
        }),
      ).rejects.toThrow("Forbidden");

      const stored = await circleInviteLinkRepository.findActiveByCircleId(
        toCircleId("circle-1"),
      );
      expect(stored).toBeNull();
    });
  });

  describe("getInviteLinkInfo", () => {
    test("トークンから研究会情報を取得できる", async () => {
      await circleInviteLinkRepository.save(baseLink());

      const result = await service.getInviteLinkInfo({
        token: toInviteLinkToken(TEST_TOKEN_UUID),
      });

      expect(result.circleName).toBe("テスト研究会");
      expect(result.circleId).toBe("circle-1");
      expect(result.expired).toBe(false);
    });

    test("期限切れリンクはexpired=trueを返す", async () => {
      const expiredLink = {
        ...baseLink(),
        expiresAt: new Date(Date.now() - 1000),
      };
      await circleInviteLinkRepository.save(expiredLink);

      const result = await service.getInviteLinkInfo({
        token: toInviteLinkToken(TEST_TOKEN_UUID),
      });

      expect(result.expired).toBe(true);
    });

    test("存在しないトークンはエラー", async () => {
      await expect(
        service.getInviteLinkInfo({
          token: toInviteLinkToken(NONEXISTENT_TOKEN_UUID),
        }),
      ).rejects.toThrow("InviteLink not found");
    });
  });

  describe("redeemInviteLink", () => {
    beforeEach(async () => {
      await circleInviteLinkRepository.save(baseLink());
    });

    test("新規ユーザーが招待リンクで参加できる", async () => {
      const result = await service.redeemInviteLink({
        actorId: "user-new",
        token: toInviteLinkToken(TEST_TOKEN_UUID),
      });

      expect(result.circleId).toBe("circle-1");
      expect(result.alreadyMember).toBe(false);
      const memberships = await circleRepository.listMembershipsByCircleId(
        toCircleId("circle-1"),
      );
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe("user-new");
      expect(memberships[0].role).toBe("CircleMember");
    });

    test("既存メンバーはalreadyMember=trueを返す", async () => {
      await circleRepository.addMembership(
        toCircleId("circle-1"),
        toUserId("user-existing"),
        "CircleMember",
      );

      const result = await service.redeemInviteLink({
        actorId: "user-existing",
        token: toInviteLinkToken(TEST_TOKEN_UUID),
      });

      expect(result.alreadyMember).toBe(true);
      const memberships = await circleRepository.listMembershipsByCircleId(
        toCircleId("circle-1"),
      );
      expect(memberships).toHaveLength(1);
    });

    test("期限切れリンクはエラー", async () => {
      circleInviteLinkRepository._clear();
      const expiredLink = {
        ...baseLink(),
        expiresAt: new Date(Date.now() - 1000),
      };
      await circleInviteLinkRepository.save(expiredLink);

      await expect(
        service.redeemInviteLink({
          actorId: "user-new",
          token: toInviteLinkToken(TEST_TOKEN_UUID),
        }),
      ).rejects.toThrow("Invite link has expired");
    });

    test("存在しないトークンはエラー", async () => {
      await expect(
        service.redeemInviteLink({
          actorId: "user-new",
          token: toInviteLinkToken(NONEXISTENT_TOKEN_UUID),
        }),
      ).rejects.toThrow("InviteLink not found");
    });
  });
});
