import { describe, expect, test } from "vitest";
import { createInMemoryCircleInviteLinkRepository } from "./in-memory-circle-invite-link-repository";
import { createCircleInviteLink } from "@/server/domain/models/circle-invite-link/circle-invite-link";
import {
  toCircleId,
  toCircleInviteLinkId,
  toInviteLinkToken,
  toUserId,
} from "@/server/domain/common/ids";
import { randomUUID } from "crypto";

describe("InMemoryCircleInviteLinkRepository", () => {
  const makeRepo = () => createInMemoryCircleInviteLinkRepository();

  const makeLink = (
    id: string,
    cId: string,
    expiresAt: Date,
    createdAt?: Date,
  ) =>
    createCircleInviteLink({
      id: toCircleInviteLinkId(id),
      circleId: toCircleId(cId),
      token: toInviteLinkToken(randomUUID()),
      createdByUserId: toUserId("u1"),
      expiresAt,
      createdAt,
    });

  test("save した Link を findByToken で取得できる", async () => {
    const repo = makeRepo();
    const link = makeLink("link1", "c1", new Date(Date.now() + 86400000));
    await repo.save(link);

    const found = await repo.findByToken(link.token);
    expect(found).toEqual(link);
  });

  test("存在しない Token は null を返す", async () => {
    const repo = makeRepo();
    const found = await repo.findByToken(toInviteLinkToken(randomUUID()));
    expect(found).toBeNull();
  });

  test("findActiveByCircleId は有効期限内のリンクを返す", async () => {
    const repo = makeRepo();
    const activeLink = makeLink(
      "link1",
      "c1",
      new Date(Date.now() + 86400000), // 明日
    );
    await repo.save(activeLink);

    const found = await repo.findActiveByCircleId(toCircleId("c1"));
    expect(found).toEqual(activeLink);
  });

  test("findActiveByCircleId は期限切れのリンクを返さない", async () => {
    const repo = makeRepo();
    const expiredLink = makeLink(
      "link1",
      "c1",
      new Date(Date.now() - 86400000), // 昨日
    );
    await repo.save(expiredLink);

    const found = await repo.findActiveByCircleId(toCircleId("c1"));
    expect(found).toBeNull();
  });

  test("findActiveByCircleId は createdAt desc で最新のリンクを返す", async () => {
    const repo = makeRepo();
    const older = makeLink(
      "link1",
      "c1",
      new Date(Date.now() + 86400000),
      new Date("2024-01-01"),
    );
    const newer = makeLink(
      "link2",
      "c1",
      new Date(Date.now() + 86400000),
      new Date("2024-06-01"),
    );
    await repo.save(older);
    await repo.save(newer);

    const found = await repo.findActiveByCircleId(toCircleId("c1"));
    expect(found?.id).toBe(toCircleInviteLinkId("link2"));
  });

  test("findActiveByCircleId は別の Circle のリンクを返さない", async () => {
    const repo = makeRepo();
    const link = makeLink("link1", "c1", new Date(Date.now() + 86400000));
    await repo.save(link);

    const found = await repo.findActiveByCircleId(toCircleId("c2"));
    expect(found).toBeNull();
  });

  test("save は既存のリンクを上書きする", async () => {
    const repo = makeRepo();
    const link = makeLink("link1", "c1", new Date(Date.now() + 86400000));
    await repo.save(link);

    const newExpiry = new Date(Date.now() + 172800000);
    await repo.save({ ...link, expiresAt: newExpiry });

    const found = await repo.findByToken(link.token);
    expect(found?.expiresAt).toEqual(newExpiry);
  });
});
