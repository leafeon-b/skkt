import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { type User as PrismaUser, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/infrastructure/db";
import { toUserId } from "@/server/domain/common/ids";
import { ConflictError } from "@/server/domain/common/errors";
import { createUser } from "@/server/domain/models/user/user";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";
import { mapUserToPersistence } from "@/server/infrastructure/mappers/user-mapper";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma User リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("findById は User を返す", async () => {
    const prismaUser = {
      id: "user-1",
      name: null,
      email: null,
      image: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    } as PrismaUser;

    mockedPrisma.user.findUnique.mockResolvedValueOnce(prismaUser);

    const user = await prismaUserRepository.findById(toUserId("user-1"));

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(user?.id).toBe("user-1");
  });

  test("findById は未取得時に null を返す", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

    const user = await prismaUserRepository.findById(toUserId("user-1"));

    expect(user).toBeNull();
  });

  test("findByIds は入力順に User を返す", async () => {
    const prismaUsers = [
      {
        id: "user-3",
        name: "C",
        email: null,
        image: null,
        createdAt: new Date("2024-01-03T00:00:00Z"),
      },
      {
        id: "user-1",
        name: "A",
        email: null,
        image: null,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    ] as PrismaUser[];

    mockedPrisma.user.findMany.mockResolvedValueOnce(prismaUsers);

    const users = await prismaUserRepository.findByIds([
      toUserId("user-1"),
      toUserId("user-2"),
      toUserId("user-3"),
    ]);

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["user-1", "user-2", "user-3"] } },
    });
    expect(users.map((user) => user.id)).toEqual(["user-1", "user-3"]);
  });

  test("save は upsert を呼ぶ", async () => {
    const user = createUser({
      id: toUserId("user-1"),
      name: "Alice",
      email: "alice@example.com",
      image: "https://example.com/icon.png",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const data = mapUserToPersistence(user);

    await prismaUserRepository.save(user);

    expect(mockedPrisma.user.upsert).toHaveBeenCalledWith({
      where: { id: data.id },
      update: {
        name: data.name,
        email: data.email,
        image: data.image,
      },
      create: data,
    });
  });

  test("updateProfile は P2002（email 一意制約違反）で ConflictError をスローする", async () => {
    mockedPrisma.user.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "0.0.0",
        meta: { target: ["email"] },
      }),
    );

    await expect(
      prismaUserRepository.updateProfile(toUserId("user-1"), "Name", "dup@example.com"),
    ).rejects.toThrow(ConflictError);
  });

  test("updateProfile は P2002 で target が期待と異なる場合そのまま再スローする", async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "0.0.0",
        meta: { target: ["other_field"] },
      },
    );
    mockedPrisma.user.update.mockRejectedValueOnce(error);

    await expect(
      prismaUserRepository.updateProfile(toUserId("user-1"), "Name", "dup@example.com"),
    ).rejects.toThrow(error);
  });

  test("updateProfile は P2002 以外の Prisma エラーはそのまま伝播する", async () => {
    const otherError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "0.0.0" },
    );
    mockedPrisma.user.update.mockRejectedValueOnce(otherError);

    await expect(
      prismaUserRepository.updateProfile(toUserId("user-1"), "Name", "dup@example.com"),
    ).rejects.toThrow(otherError);
  });

  test("createUser は P2002（email 一意制約違反）で ConflictError をスローする", async () => {
    mockedPrisma.user.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "0.0.0",
        meta: { target: ["email"] },
      }),
    );

    await expect(
      prismaUserRepository.createUser({
        email: "test@example.com",
        passwordHash: "hashed",
        name: "Test",
      }),
    ).rejects.toThrow(ConflictError);
  });

  test("createUser は P2002 で target が期待と異なる場合そのまま再スローする", async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "0.0.0",
        meta: { target: ["other_field"] },
      },
    );
    mockedPrisma.user.create.mockRejectedValueOnce(error);

    await expect(
      prismaUserRepository.createUser({
        email: "test@example.com",
        passwordHash: "hashed",
        name: "Test",
      }),
    ).rejects.toThrow(error);
  });

  test("createUser は P2002 以外の Prisma エラーはそのまま伝播する", async () => {
    const otherError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "0.0.0" },
    );
    mockedPrisma.user.create.mockRejectedValueOnce(otherError);

    await expect(
      prismaUserRepository.createUser({
        email: "test@example.com",
        passwordHash: "hashed",
        name: "Test",
      }),
    ).rejects.toThrow(otherError);
  });
});
