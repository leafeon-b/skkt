import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleSessionParticipationService } from "@/server/application/circle-session/circle-session-participation-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import {
  circleId,
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import { createMatch } from "@/server/domain/models/match/match";

const matchRepository = {
  findById: vi.fn(),
  listByCircleSessionId: vi.fn(),
  save: vi.fn(),
} satisfies MatchRepository;

const circleSessionParticipationRepository = {
  listParticipants: vi.fn(),
  addParticipant: vi.fn(),
  updateParticipantRole: vi.fn(),
  areParticipants: vi.fn(),
  removeParticipant: vi.fn(),
} satisfies CircleSessionParticipationRepository;

const circleSessionRepository = {
  findById: vi.fn(),
  listByCircleId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleSessionRepository;

const accessService = createAccessServiceStub();

const service = createCircleSessionParticipationService({
  matchRepository,
  circleSessionRepository,
  circleSessionParticipationRepository,
  accessService,
});

const baseMatch = () =>
  createMatch({
    id: matchId("match-1"),
    circleSessionId: circleSessionId("session-1"),
    order: 1,
    player1Id: userId("user-1"),
    player2Id: userId("user-2"),
    outcome: "P1_WIN",
  });

const baseSession = () => ({
  id: circleSessionId("session-1"),
  circleId: circleId("circle-1"),
  sequence: 1,
  title: "第1回 研究会",
  startsAt: new Date(),
  endsAt: new Date(),
  location: null,
  note: "",
  createdAt: new Date(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(circleSessionRepository.findById).mockResolvedValue(baseSession());
  vi.mocked(accessService.canViewCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canAddCircleSessionMember).mockResolvedValue(true);
  vi.mocked(accessService.canChangeCircleSessionMemberRole).mockResolvedValue(
    true,
  );
  vi.mocked(accessService.canTransferCircleSessionOwnership).mockResolvedValue(
    true,
  );
  vi.mocked(accessService.canRemoveCircleSessionMember).mockResolvedValue(true);
});

describe("CircleSession 参加者サービス", () => {
  test("listParticipants は一覧を返す", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipants,
    ).mockResolvedValueOnce([
      { userId: userId("user-1"), role: "CircleSessionOwner" },
    ]);

    const result = await service.listParticipants({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
    });

    expect(
      circleSessionParticipationRepository.listParticipants,
    ).toHaveBeenCalledWith(circleSessionId("session-1"));
    expect(result).toEqual([
      { userId: userId("user-1"), role: "CircleSessionOwner" },
    ]);
  });

  test("addParticipant は Owner がいない状態で Member を拒否する", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipants,
    ).mockResolvedValueOnce([]);

    await expect(
      service.addParticipant({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      }),
    ).rejects.toThrow("CircleSession must have exactly one owner");

    expect(
      circleSessionParticipationRepository.addParticipant,
    ).not.toHaveBeenCalled();
  });

  test("addParticipant は Owner がいる場合に Member を追加できる", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipants,
    ).mockResolvedValueOnce([
      { userId: userId("user-1"), role: "CircleSessionOwner" },
    ]);

    await service.addParticipant({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-2"),
      role: "CircleSessionMember",
    });

    expect(
      circleSessionParticipationRepository.addParticipant,
    ).toHaveBeenCalledWith(
      circleSessionId("session-1"),
      userId("user-2"),
      "CircleSessionMember",
    );
  });

  test("changeParticipantRole は Owner への変更を拒否する", async () => {
    await expect(
      service.changeParticipantRole({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      }),
    ).rejects.toThrow("Use transferOwnership to assign owner");
  });

  test("transferOwnership は Owner を移譲する", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipants,
    ).mockResolvedValueOnce([
      { userId: userId("user-1"), role: "CircleSessionOwner" },
      { userId: userId("user-2"), role: "CircleSessionMember" },
    ]);

    await service.transferOwnership({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      fromUserId: userId("user-1"),
      toUserId: userId("user-2"),
    });

    expect(
      circleSessionParticipationRepository.updateParticipantRole,
    ).toHaveBeenCalledWith(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionManager",
    );
    expect(
      circleSessionParticipationRepository.updateParticipantRole,
    ).toHaveBeenCalledWith(
      circleSessionId("session-1"),
      userId("user-2"),
      "CircleSessionOwner",
    );
  });

  test("removeParticipant は対局に登場する参加者を削除できない", async () => {
    vi.mocked(matchRepository.listByCircleSessionId).mockResolvedValue([
      baseMatch(),
    ]);

    await expect(
      service.removeParticipant({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
      }),
    ).rejects.toThrow("Participant cannot be removed because matches exist");

    expect(
      circleSessionParticipationRepository.removeParticipant,
    ).not.toHaveBeenCalled();
  });

  test("removeParticipant は対局に登場しない参加者を削除できる", async () => {
    vi.mocked(matchRepository.listByCircleSessionId).mockResolvedValue([
      baseMatch(),
    ]);

    await expect(
      service.removeParticipant({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-3"),
      }),
    ).resolves.toBeUndefined();

    expect(
      circleSessionParticipationRepository.removeParticipant,
    ).toHaveBeenCalledWith(circleSessionId("session-1"), userId("user-3"));
  });
});
