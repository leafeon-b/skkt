import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    circleMembership: {
      findFirst: vi.fn(),
    },
    circleSessionMembership: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/infrastructure/db";
import { prismaAuthzRepository } from "@/server/infrastructure/repository/authz/prisma-authz-repository";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma Authz リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("isRegisteredUser は存在時に true", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      name: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      email: null,
      emailVerified: null,
      image: null,
      passwordHash: null,
      passwordChangedAt: null,
    });

    const result = await prismaAuthzRepository.isRegisteredUser("user-1");

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true },
    });
    expect(result).toBe(true);
  });

  test("isRegisteredUser は未存在時に false", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await prismaAuthzRepository.isRegisteredUser("user-1");

    expect(result).toBe(false);
  });

  test("findCircleMembership はロールを返す", async () => {
    mockedPrisma.circleMembership.findFirst.mockResolvedValueOnce({
      id: "membership-1",
      userId: "user-1",
      circleId: "circle-1",
      role: "CircleOwner",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const membership = await prismaAuthzRepository.findCircleMembership(
      "user-1",
      "circle-1",
    );

    expect(mockedPrisma.circleMembership.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", circleId: "circle-1" },
      select: { role: true },
    });
    expect(membership).toEqual({ kind: "member", role: "CircleOwner" });
  });

  test("findCircleMembership は未参加時に none を返す", async () => {
    mockedPrisma.circleMembership.findFirst.mockResolvedValueOnce(null);

    const membership = await prismaAuthzRepository.findCircleMembership(
      "user-1",
      "circle-1",
    );

    expect(membership).toEqual({ kind: "none" });
  });

  test("findCircleSessionMembership はロールを返す", async () => {
    mockedPrisma.circleSessionMembership.findFirst.mockResolvedValueOnce({
      id: "session-membership-1",
      userId: "user-1",
      circleSessionId: "session-1",
      role: "CircleSessionMember",
    });

    const membership = await prismaAuthzRepository.findCircleSessionMembership(
      "user-1",
      "session-1",
    );

    expect(mockedPrisma.circleSessionMembership.findFirst).toHaveBeenCalledWith(
      {
        where: { userId: "user-1", circleSessionId: "session-1" },
        select: { role: true },
      },
    );
    expect(membership).toEqual({ kind: "member", role: "CircleSessionMember" });
  });

  test("findCircleSessionMembership は未参加時に none を返す", async () => {
    mockedPrisma.circleSessionMembership.findFirst.mockResolvedValueOnce(null);

    const membership = await prismaAuthzRepository.findCircleSessionMembership(
      "user-1",
      "session-1",
    );

    expect(membership).toEqual({ kind: "none" });
  });
});
