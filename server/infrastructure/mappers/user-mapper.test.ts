import { describe, expect, test } from "vitest";
import type { User as PrismaUser } from "@/generated/prisma/client";
import {
  mapUserToDomain,
  mapUserToPersistence,
} from "@/server/infrastructure/mappers/user-mapper";
import { userId } from "@/server/domain/common/ids";
import { createUser } from "@/server/domain/models/user/user";

describe("User マッパー", () => {
  test("Prisma User をドメインに変換できる", () => {
    const prismaUser: PrismaUser = {
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      emailVerified: null,
      image: "https://example.com/icon.png",
      passwordHash: null,
      passwordChangedAt: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    };

    const user = mapUserToDomain(prismaUser);

    expect(user.id).toBe("user-1");
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@example.com");
    expect(user.image).toBe("https://example.com/icon.png");
    expect(user.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  test("ドメイン User を永続化モデルに変換できる", () => {
    const user = createUser({
      id: userId("user-1"),
      name: "Alice",
      email: "alice@example.com",
      image: "https://example.com/icon.png",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const mapped = mapUserToPersistence(user);

    expect(mapped).toEqual({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      image: "https://example.com/icon.png",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
  });
});
