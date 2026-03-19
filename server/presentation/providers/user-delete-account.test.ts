import { beforeEach, describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  toCircleId,
  toCircleSessionId,
  toUserId,
} from "@/server/domain/common/ids";

vi.mock("@/server/env", () => ({ env: {} }));

import { createServiceContainer } from "@/server/infrastructure/service-container";
import {
  createMockDeps,
  toServiceContainerDeps,
  type MockDeps,
} from "./__tests__/helpers/create-mock-deps";
import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import type { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";

const ACTOR_ID = toUserId("actor-1");
const NOW = new Date("2025-01-01T00:00:00Z");

let mockDeps: MockDeps;

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () => {
    const services = createServiceContainer(toServiceContainerDeps(mockDeps));
    return Promise.resolve({ actorId: ACTOR_ID, ...services });
  },
}));

const { appRouter } = await import(
  "@/server/presentation/trpc/router"
);

const createCaller = () =>
  appRouter.createCaller({
    actorId: ACTOR_ID,
    ...createServiceContainer(toServiceContainerDeps(mockDeps)),
    clientIp: "127.0.0.1",
  } as never);

const makeUser = (uid: string) => ({
  id: toUserId(uid),
  name: "テストユーザー",
  email: "test@example.com",
  image: null,
  hasCustomImage: false,
  profileVisibility: "PUBLIC" as const,
  createdAt: NOW,
});

const makeMembership = (
  circleId: string,
  role: "CircleOwner" | "CircleManager" | "CircleMember",
  deletedAt: Date | null = null,
): CircleMembership => ({
  circleId: toCircleId(circleId),
  userId: ACTOR_ID,
  role,
  createdAt: NOW,
  deletedAt,
});

const makeSessionMembership = (
  sessionId: string,
  role: CircleSessionRole,
  deletedAt: Date | null = null,
): CircleSessionMembership => ({
  circleSessionId: toCircleSessionId(sessionId),
  userId: ACTOR_ID,
  role,
  createdAt: NOW,
  deletedAt,
});

describe("users.deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  test("アカウント削除が成功し、deleteAccountリポジトリメソッドが呼ばれる", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([]);

    const caller = createCaller();
    await caller.users.deleteAccount();

    expect(mockDeps.userRepository.deleteAccount).toHaveBeenCalledWith(
      ACTOR_ID,
      expect.any(Date),
    );
  });

  test("メンバーやマネージャーのみの場合はアカウント削除できる", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([
      makeMembership("circle-1", "CircleMember"),
      makeMembership("circle-2", "CircleManager"),
    ]);

    const caller = createCaller();
    await caller.users.deleteAccount();

    expect(mockDeps.userRepository.deleteAccount).toHaveBeenCalled();
  });

  test("論理削除済みのオーナーシップがある場合はアカウント削除できる", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([
      makeMembership("circle-1", "CircleOwner", new Date("2024-12-01")),
    ]);

    const caller = createCaller();
    await caller.users.deleteAccount();

    expect(mockDeps.userRepository.deleteAccount).toHaveBeenCalled();
  });

  test("研究会オーナーはアカウントを削除できない", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([
      makeMembership("circle-1", "CircleOwner"),
    ]);

    const caller = createCaller();

    await expect(caller.users.deleteAccount()).rejects.toThrow(TRPCError);
    await expect(caller.users.deleteAccount()).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mockDeps.userRepository.deleteAccount).not.toHaveBeenCalled();
  });

  test("セッションオーナーはアカウントを削除できない", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([]);
    mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
      makeSessionMembership("session-1", "CircleSessionOwner"),
    ]);

    const caller = createCaller();

    await expect(caller.users.deleteAccount()).rejects.toThrow(TRPCError);
    await expect(caller.users.deleteAccount()).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mockDeps.userRepository.deleteAccount).not.toHaveBeenCalled();
  });

  test("セッションマネージャー・メンバーの場合はアカウント削除できる", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([]);
    mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
      makeSessionMembership("session-1", "CircleSessionManager"),
      makeSessionMembership("session-2", "CircleSessionMember"),
    ]);

    const caller = createCaller();
    await caller.users.deleteAccount();

    expect(mockDeps.userRepository.deleteAccount).toHaveBeenCalled();
  });

  test("論理削除済みのセッションオーナーシップがある場合はアカウント削除できる", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([]);
    mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
      makeSessionMembership(
        "session-1",
        "CircleSessionOwner",
        new Date("2024-12-01"),
      ),
    ]);

    const caller = createCaller();
    await caller.users.deleteAccount();

    expect(mockDeps.userRepository.deleteAccount).toHaveBeenCalled();
  });

  test("研究会オーナーかつセッションオーナーの場合は研究会オーナーのエラーが先に出る", async () => {
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([
      makeMembership("circle-1", "CircleOwner"),
    ]);
    mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
      makeSessionMembership("session-1", "CircleSessionOwner"),
    ]);

    const caller = createCaller();

    await expect(caller.users.deleteAccount()).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("研究会"),
    });

    expect(
      mockDeps.circleSessionRepository.listMembershipsByUserId,
    ).not.toHaveBeenCalled();
  });
});
