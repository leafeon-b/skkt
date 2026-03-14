import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { UserMatchStatistics } from "@/server/domain/models/match/match-statistics";
import type { CircleMatchStatisticsRow } from "@/server/domain/models/match/match-statistics";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapMatchToDomain,
  mapMatchToPersistence,
} from "@/server/infrastructure/mappers/match-mapper";
import type { Match } from "@/server/domain/models/match/match";
import type { MatchWithCircle } from "@/server/domain/models/match/match-read-models";
import type {
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";
import { Prisma } from "@/generated/prisma/client";

export const createPrismaMatchRepository = (
  client: PrismaClientLike,
): MatchRepository => ({
  async findById(id: MatchId): Promise<Match | null> {
    const found = await client.match.findUnique({
      where: { id: toPersistenceId(id) },
    });

    return found ? mapMatchToDomain(found) : null;
  },

  async listByCircleSessionId(
    circleSessionId: CircleSessionId,
  ): Promise<Match[]> {
    const matches = await client.match.findMany({
      where: { circleSessionId: toPersistenceId(circleSessionId) },
      orderBy: { createdAt: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async listByPlayerId(playerId: UserId): Promise<Match[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          { player1Id: toPersistenceId(playerId) },
          { player2Id: toPersistenceId(playerId) },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async listByBothPlayerIds(
    playerId: UserId,
    opponentId: UserId,
  ): Promise<Match[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            player1Id: toPersistenceId(playerId),
            player2Id: toPersistenceId(opponentId),
          },
          {
            player1Id: toPersistenceId(opponentId),
            player2Id: toPersistenceId(playerId),
          },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async listByPlayerIdWithCircle(playerId: UserId): Promise<MatchWithCircle[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          { player1Id: toPersistenceId(playerId) },
          { player2Id: toPersistenceId(playerId) },
        ],
      },
      include: {
        session: {
          include: {
            circle: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return matches.map((m) => ({
      ...mapMatchToDomain(m),
      circleId: toCircleId(m.session.circleId),
      circleName: m.session.circle.name,
    }));
  },

  async listDistinctOpponentIds(playerId: UserId): Promise<UserId[]> {
    const pid = toPersistenceId(playerId);

    const [asPlayer1, asPlayer2] = await Promise.all([
      client.match.findMany({
        where: { player1Id: pid, deletedAt: null },
        select: { player2Id: true },
        distinct: ["player2Id"],
      }),
      client.match.findMany({
        where: { player2Id: pid, deletedAt: null },
        select: { player1Id: true },
        distinct: ["player1Id"],
      }),
    ]);

    const ids = new Set<string>();
    for (const m of asPlayer1) ids.add(m.player2Id);
    for (const m of asPlayer2) ids.add(m.player1Id);

    return [...ids].map(toUserId);
  },

  async countMatchStatisticsByUserId(
    userId: UserId,
  ): Promise<UserMatchStatistics> {
    const pid = toPersistenceId(userId);

    const rows = await client.$queryRaw<
      { wins: bigint; losses: bigint; draws: bigint }[]
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(CASE
          WHEN ("player1Id" = ${pid} AND outcome = 'P1_WIN')
            OR ("player2Id" = ${pid} AND outcome = 'P2_WIN')
          THEN 1 ELSE 0 END), 0) AS wins,
        COALESCE(SUM(CASE
          WHEN ("player1Id" = ${pid} AND outcome = 'P2_WIN')
            OR ("player2Id" = ${pid} AND outcome = 'P1_WIN')
          THEN 1 ELSE 0 END), 0) AS losses,
        COALESCE(SUM(CASE
          WHEN outcome = 'DRAW'
            AND ("player1Id" = ${pid} OR "player2Id" = ${pid})
          THEN 1 ELSE 0 END), 0) AS draws
      FROM "Match"
      WHERE "deletedAt" IS NULL
        AND ("player1Id" = ${pid} OR "player2Id" = ${pid})
        AND outcome != 'UNKNOWN'
    `);

    const row = rows[0]!;
    return {
      wins: Number(row.wins),
      losses: Number(row.losses),
      draws: Number(row.draws),
    };
  },

  async countMatchStatisticsByUserIdGroupByCircle(
    userId: UserId,
  ): Promise<CircleMatchStatisticsRow[]> {
    const pid = toPersistenceId(userId);

    const rows = await client.$queryRaw<
      {
        circleId: string;
        circleName: string;
        wins: bigint;
        losses: bigint;
        draws: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        c.id AS "circleId",
        c.name AS "circleName",
        COALESCE(SUM(CASE
          WHEN (m."player1Id" = ${pid} AND m.outcome = 'P1_WIN')
            OR (m."player2Id" = ${pid} AND m.outcome = 'P2_WIN')
          THEN 1 ELSE 0 END), 0) AS wins,
        COALESCE(SUM(CASE
          WHEN (m."player1Id" = ${pid} AND m.outcome = 'P2_WIN')
            OR (m."player2Id" = ${pid} AND m.outcome = 'P1_WIN')
          THEN 1 ELSE 0 END), 0) AS losses,
        COALESCE(SUM(CASE
          WHEN m.outcome = 'DRAW'
            AND (m."player1Id" = ${pid} OR m."player2Id" = ${pid})
          THEN 1 ELSE 0 END), 0) AS draws
      FROM "Match" m
      JOIN "CircleSession" cs ON m."circleSessionId" = cs.id
      JOIN "Circle" c ON cs."circleId" = c.id
      WHERE m."deletedAt" IS NULL
        AND (m."player1Id" = ${pid} OR m."player2Id" = ${pid})
        AND m.outcome != 'UNKNOWN'
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);

    return rows.map((row) => ({
      circleId: toCircleId(row.circleId),
      circleName: row.circleName,
      wins: Number(row.wins),
      losses: Number(row.losses),
      draws: Number(row.draws),
    }));
  },

  async countMatchStatisticsByBothPlayerIds(
    userId: UserId,
    opponentId: UserId,
  ): Promise<UserMatchStatistics> {
    const uid = toPersistenceId(userId);
    const oid = toPersistenceId(opponentId);

    const rows = await client.$queryRaw<
      { wins: bigint; losses: bigint; draws: bigint }[]
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(CASE
          WHEN ("player1Id" = ${uid} AND outcome = 'P1_WIN')
            OR ("player2Id" = ${uid} AND outcome = 'P2_WIN')
          THEN 1 ELSE 0 END), 0) AS wins,
        COALESCE(SUM(CASE
          WHEN ("player1Id" = ${uid} AND outcome = 'P2_WIN')
            OR ("player2Id" = ${uid} AND outcome = 'P1_WIN')
          THEN 1 ELSE 0 END), 0) AS losses,
        COALESCE(SUM(CASE
          WHEN outcome = 'DRAW' THEN 1 ELSE 0 END), 0) AS draws
      FROM "Match"
      WHERE "deletedAt" IS NULL
        AND outcome != 'UNKNOWN'
        AND (
          ("player1Id" = ${uid} AND "player2Id" = ${oid})
          OR ("player1Id" = ${oid} AND "player2Id" = ${uid})
        )
    `);

    const row = rows[0]!;
    return {
      wins: Number(row.wins),
      losses: Number(row.losses),
      draws: Number(row.draws),
    };
  },

  async save(match: Match): Promise<void> {
    const data = mapMatchToPersistence(match);

    await client.match.upsert({
      where: { id: data.id },
      update: {
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        outcome: data.outcome,
        deletedAt: data.deletedAt,
      },
      create: data,
    });
  },
});

export const prismaMatchRepository = createPrismaMatchRepository(prisma);
