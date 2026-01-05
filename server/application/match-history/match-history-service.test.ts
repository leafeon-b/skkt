import { describe, expect, test, vi } from "vitest";
import { createMatchHistoryService } from "@/server/application/match-history/match-history-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { MatchHistoryRepository } from "@/server/domain/models/match-history/match-history-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import { circleId, circleSessionId, matchId } from "@/server/domain/common/ids";

const matchHistoryRepository = {
  listByMatchId: vi.fn(),
  add: vi.fn(),
} satisfies MatchHistoryRepository;

const matchRepository = {
  findById: vi.fn(),
  listByCircleSessionId: vi.fn(),
  save: vi.fn(),
} satisfies MatchRepository;

const circleSessionRepository = {
  findById: vi.fn(),
  listByCircleId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleSessionRepository;

const accessService = createAccessServiceStub();

const service = createMatchHistoryService({
  matchHistoryRepository,
  matchRepository,
  circleSessionRepository,
  accessService,
});

describe("MatchHistory サービス", () => {
  test("listByMatchId は履歴を返す", async () => {
    vi.mocked(matchRepository.findById).mockResolvedValueOnce({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      order: 1,
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "UNKNOWN",
      deletedAt: null,
    });
    vi.mocked(circleSessionRepository.findById).mockResolvedValueOnce({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T00:00:00Z"),
      endsAt: new Date("2024-01-02T00:00:00Z"),
      location: null,
      note: "",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    vi.mocked(accessService.canViewMatchHistory).mockResolvedValueOnce(true);
    vi.mocked(matchHistoryRepository.listByMatchId).mockResolvedValue([]);

    const result = await service.listByMatchId({
      actorId: "user-1",
      matchId: matchId("match-1"),
    });

    expect(matchHistoryRepository.listByMatchId).toHaveBeenCalledWith(
      matchId("match-1"),
    );
    expect(result).toEqual([]);
  });
});
