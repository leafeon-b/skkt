import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createPrismaCircleInviteLinkRepository } from "./prisma-circle-invite-link-repository";
import {
  setupTestPrisma,
  teardownTestPrisma,
  truncateAllTables,
  type TestPrismaContext,
} from "@/server/test-utils/prisma-test-client";
import { circleId } from "@/server/domain/common/ids";

let ctx: TestPrismaContext;
const CIRCLE_ID = "circle-1";
const USER_ID = "user-1";

beforeAll(async () => {
  ctx = await setupTestPrisma();
});

afterAll(async () => {
  await teardownTestPrisma(ctx);
});

beforeEach(async () => {
  await truncateAllTables(ctx.pglite);

  // Seed parent records required by foreign keys
  await ctx.prisma.user.create({
    data: { id: USER_ID, name: "Test User" },
  });
  await ctx.prisma.circle.create({
    data: { id: CIRCLE_ID, name: "Test Circle" },
  });
});

describe("PrismaCircleInviteLinkRepository.findActiveByCircleId", () => {
  it("AC1: 有効リンクと期限切れリンクがある場合、有効リンクのみ返す", async () => {
    const repo = createPrismaCircleInviteLinkRepository(ctx.prisma);
    const now = new Date();

    // Active link: expires 1 hour from now
    const activeExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-active",
        circleId: CIRCLE_ID,
        token: "token-active",
        createdByUserId: USER_ID,
        expiresAt: activeExpiresAt,
      },
    });

    // Expired link: expired 1 hour ago
    const expiredExpiresAt = new Date(now.getTime() - 60 * 60 * 1000);
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-expired",
        circleId: CIRCLE_ID,
        token: "token-expired",
        createdByUserId: USER_ID,
        expiresAt: expiredExpiresAt,
      },
    });

    const result = await repo.findActiveByCircleId(circleId(CIRCLE_ID));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("link-active");
    expect(result!.token).toBe("token-active");
  });

  it("AC2: すべて期限切れの場合、null を返す", async () => {
    const repo = createPrismaCircleInviteLinkRepository(ctx.prisma);
    const now = new Date();

    // Two expired links
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-expired-1",
        circleId: CIRCLE_ID,
        token: "token-expired-1",
        createdByUserId: USER_ID,
        expiresAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
    });
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-expired-2",
        circleId: CIRCLE_ID,
        token: "token-expired-2",
        createdByUserId: USER_ID,
        expiresAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    });

    const result = await repo.findActiveByCircleId(circleId(CIRCLE_ID));

    expect(result).toBeNull();
  });

  it("AC3: expiresAt がちょうど現在時刻の場合、null を返す（境界値）", async () => {
    const repo = createPrismaCircleInviteLinkRepository(ctx.prisma);

    // Create a link that expires 3 seconds in the past to avoid timing issues.
    // The repository uses `expiresAt > new Date()` (strict gt),
    // and domain `isExpired` uses `now >= expiresAt`.
    // A link whose expiresAt is in the past (even by seconds) must not be returned.
    const expiresAt = new Date(Date.now() - 3_000);
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-boundary",
        circleId: CIRCLE_ID,
        token: "token-boundary",
        createdByUserId: USER_ID,
        expiresAt,
      },
    });

    const result = await repo.findActiveByCircleId(circleId(CIRCLE_ID));

    expect(result).toBeNull();
  });

  it("データ不整合で複数の有効リンクが存在する場合、createdAtが最新のリンクを返す", async () => {
    const repo = createPrismaCircleInviteLinkRepository(ctx.prisma);
    const now = new Date();

    // Active link 1: created 1 hour ago
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-active-old",
        circleId: CIRCLE_ID,
        token: "token-active-old",
        createdByUserId: USER_ID,
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
    });

    // Active link 2: created now (newest)
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-active-new",
        circleId: CIRCLE_ID,
        token: "token-active-new",
        createdByUserId: USER_ID,
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        createdAt: now,
      },
    });

    const result = await repo.findActiveByCircleId(circleId(CIRCLE_ID));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("link-active-new");
  });

  it("有効リンク1件と期限切れリンク複数件が混在する場合、有効リンクのみ返す", async () => {
    const repo = createPrismaCircleInviteLinkRepository(ctx.prisma);
    const now = new Date();

    // Active link
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-active",
        circleId: CIRCLE_ID,
        token: "token-active",
        createdByUserId: USER_ID,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      },
    });

    // Expired link 1: expired 1 hour ago
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-expired-1",
        circleId: CIRCLE_ID,
        token: "token-expired-1",
        createdByUserId: USER_ID,
        expiresAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
    });

    // Expired link 2: expired 2 hours ago
    await ctx.prisma.circleInviteLink.create({
      data: {
        id: "link-expired-2",
        circleId: CIRCLE_ID,
        token: "token-expired-2",
        createdByUserId: USER_ID,
        expiresAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    });

    const result = await repo.findActiveByCircleId(circleId(CIRCLE_ID));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("link-active");
  });
});
