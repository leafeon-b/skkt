import { beforeEach, describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { toCircleSessionId, toUserId } from "@/server/domain/common/ids";

vi.mock("@/server/env", () => ({ env: {} }));

import { createServiceContainer } from "@/server/infrastructure/service-container";
import {
  createMockDeps,
  toServiceContainerDeps,
  type MockDeps,
} from "./__tests__/helpers/create-mock-deps";

const VIEWER_ID = toUserId("viewer-1");
const TARGET_USER_ID = toUserId("target-1");
const NOW = new Date("2025-01-01T00:00:00Z");

let mockDeps: MockDeps;

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () => {
    const services = createServiceContainer(toServiceContainerDeps(mockDeps));
    return Promise.resolve({ actorId: VIEWER_ID, ...services });
  },
}));

const { getUserProfileViewModel } = await import("./user-profile-provider");

const makeUser = (uid: string, name: string, visibility: "PUBLIC" | "PRIVATE") => ({
  id: toUserId(uid),
  name,
  email: null,
  image: null,
  profileVisibility: visibility,
  createdAt: NOW,
  passwordChangedAt: null,
});

describe("getUserProfileViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  describe("認可エラー", () => {
    test("未登録ユーザーのプロファイルを取得するとFORBIDDENエラーになる", async () => {
      // authzRepository.isRegisteredUser はデフォルト false のまま
      // userRepository.findById で対象ユーザーは存在する
      mockDeps.userRepository.findById.mockResolvedValue(
        makeUser("target-1", "対象ユーザー", "PUBLIC"),
      );

      await expect(
        getUserProfileViewModel("target-1"),
      ).rejects.toThrow(TRPCError);

      await expect(
        getUserProfileViewModel("target-1"),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("正常系", () => {
    beforeEach(() => {
      // Viewer is a registered user
      mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
    });

    test("プロフィール非公開ユーザーの場合、統計情報がゼロで返される", async () => {
      mockDeps.userRepository.findById.mockResolvedValue(
        makeUser("target-1", "非公開ユーザー", "PRIVATE"),
      );

      const result = await getUserProfileViewModel("target-1");

      expect(result.isProfilePublic).toBe(false);
      expect(result.name).toBe("非公開ユーザー");
      expect(result.sessionMembershipCount).toBe(0);
      expect(result.matchStatistics).toEqual({ wins: 0, losses: 0, draws: 0 });
      expect(result.circleMatchStatistics).toEqual([]);
    });

    test("プロフィール公開ユーザーの場合、統計情報が含まれる", async () => {
      mockDeps.userRepository.findById.mockResolvedValue(
        makeUser("target-1", "公開ユーザー", "PUBLIC"),
      );

      // セッション参加回数
      mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue(
        [
          {
            circleSessionId: toCircleSessionId("session-past"),
            userId: TARGET_USER_ID,
            role: "CircleSessionMember" as never,
            createdAt: NOW,
            deletedAt: null,
          },
        ],
      );

      // findByIds で対応するセッションを返す（過去のセッション）
      mockDeps.circleSessionRepository.findByIds.mockResolvedValue([
        {
          id: "session-past" as never,
          circleId: "circle-1" as never,
          title: "過去のセッション",
          startsAt: new Date("2024-01-01T10:00:00Z"),
          endsAt: new Date("2024-01-01T12:00:00Z"),
          location: "会議室",
          note: "",
          createdAt: NOW,
        },
      ]);

      // 対局統計
      mockDeps.matchRepository.countMatchStatisticsByUserId.mockResolvedValue({
        wins: 1,
        losses: 0,
        draws: 0,
      });
      mockDeps.matchRepository.countMatchStatisticsByUserIdGroupByCircle.mockResolvedValue([
        {
          circleId: "circle-1" as never,
          circleName: "テスト研究会",
          wins: 1,
          losses: 0,
          draws: 0,
        },
      ]);

      const result = await getUserProfileViewModel("target-1");

      expect(result.isProfilePublic).toBe(true);
      expect(result.name).toBe("公開ユーザー");
      expect(result.matchStatistics.wins).toBe(1);
      expect(result.circleMatchStatistics).toHaveLength(1);
      expect(result.circleMatchStatistics[0].circleName).toBe("テスト研究会");
    });
  });
});
