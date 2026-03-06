import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import pg from "pg";
import {
  CircleRole,
  CircleSessionRole,
  MatchOutcome,
  PrismaClient,
} from "../generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type DemoSessionRoleSeed = {
  circleSessionId: string;
  role: CircleSessionRole;
};

type DemoUserSeed = {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  circleRole?: CircleRole;
  sessionRoles?: DemoSessionRoleSeed[];
};

// SSoT: demoUsers defines login accounts and the role coverage for checks.
const demoUsers: DemoUserSeed[] = [
  {
    id: "user-1",
    name: "山田 太郎",
    email: "taro@example.com",
    passwordHash:
      "scrypt$5jteFLxOGwBIhQkuKyZq/w==$Cpp2UvzMDGI6A4nQsmMPTKberD9/ID/CA+0zNz3FJJ4QkrR36iQ6olMP/9YYaTtrNSzX6qn4qW+fRQ6kyRF6yQ==",
    circleRole: CircleRole.CircleOwner,
    sessionRoles: [
      {
        circleSessionId: "demo-session-42",
        role: CircleSessionRole.CircleSessionOwner,
      },
      {
        circleSessionId: "demo-session-43",
        role: CircleSessionRole.CircleSessionOwner,
      },
    ],
  },
  {
    id: "user-2",
    name: "鈴木 花子",
    email: "hanako@example.com",
    passwordHash:
      "scrypt$LB/WpSUVa4YAq/mw6ooWeQ==$psMSAlyc9B8JVAf/BUGzOo0gO709Ej73xiGjKIlzlRse5jEEK2i76FesK5Si/a0XRMxUZ7L3SB02oYK4V4PYnQ==",
    circleRole: CircleRole.CircleManager,
  },
  {
    id: "user-3",
    name: "田中 一郎",
    email: "ichiro@example.com",
    passwordHash:
      "scrypt$ghXg41bEALR5yYMcQ5UrPw==$5r70+5O1QPJYBlI0qHGqqaLHCAUoyahC29MBQhxDAHCdhq7N6j2DYh7FS1Sj8SWgZqCDPYnxEIVqY3K/HqrMRQ==",
    circleRole: CircleRole.CircleManager,
  },
  {
    id: "user-4",
    name: "高橋 次郎",
    email: "jiro@example.com",
    passwordHash:
      "scrypt$+u68AJg5EEaLBgknMx+9JQ==$CFvEjebQhpCfSPe57BW5aPfV8L0YAduMmYbp5NT8d4a9c4v2/SmFkc/T7wfpemS6zzVmLAhQGIDP43W7SFB8Uw==",
    circleRole: CircleRole.CircleMember,
    sessionRoles: [
      {
        circleSessionId: "demo-session-42",
        role: CircleSessionRole.CircleSessionMember,
      },
      {
        circleSessionId: "demo-session-43",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-5",
    name: "中村 美咲",
    email: "misaki@example.com",
    passwordHash:
      "scrypt$wlX3QQxWcvETK6Ym5ejDTQ==$JxuLdzMch3QF/vCia3D8qkSalj2cFzGYRELLUHW21eLrfRcjtJIHtTs5vVh7wC+oYX49mgxBXBaHPL6m7rSc2Q==",
    sessionRoles: [
      {
        circleSessionId: "demo-session-42",
        role: CircleSessionRole.CircleSessionManager,
      },
      {
        circleSessionId: "demo-session-43",
        role: CircleSessionRole.CircleSessionManager,
      },
    ],
  },
  {
    id: "user-6",
    name: "小林 健太",
    email: "kenta@example.com",
    passwordHash:
      "scrypt$dewvJFQLnkLZwe/p5NxpfA==$6idej0tvQyepO4xJDK+rrbPAM+B9UakP4D4/OeXDjenceUl89kurJjCl06Sb03Vd286D1DfGHU1b4CWqkw2BvQ==",
    sessionRoles: [
      {
        circleSessionId: "demo-session-42",
        role: CircleSessionRole.CircleSessionManager,
      },
    ],
  },
  {
    id: "user-7",
    name: "加藤 さくら",
    email: "sakura@example.com",
    passwordHash:
      "scrypt$3gd5OcI1qlKw5iI6+UVTRQ==$R3pKeUNut2vV+yVS6pjmDvwqE3S0LjnflI1NcPdN8X8uIJo6KUB6ygVjz4/QD3IPBu+Mw+fnuGpDpr8UgRYWFQ==",
    sessionRoles: [
      {
        circleSessionId: "demo-session-42",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-8",
    name: "吉田 大輔",
    email: "daisuke@example.com",
    passwordHash:
      "scrypt$lhDwOyRHnhI6aKEy91iRtg==$M+E+IOBx+PuxF7OHwYbAJ2ML77lGn3BdNWlBlOc5Urm2o/5M/bQOET3YtbHv7WZEM3Q31T6k7I15wH/8XHX0Xw==",
    sessionRoles: [
      {
        circleSessionId: "demo-session-42",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
];

// --- あおば将棋研究会（10人）---
// パスワードはすべて demo-pass-1
const demoPassHash =
  "scrypt$5jteFLxOGwBIhQkuKyZq/w==$Cpp2UvzMDGI6A4nQsmMPTKberD9/ID/CA+0zNz3FJJ4QkrR36iQ6olMP/9YYaTtrNSzX6qn4qW+fRQ6kyRF6yQ==";

type OsakaUserSeed = {
  id: string;
  name: string;
  email: string;
  circleRole: CircleRole;
  sessionRoles?: DemoSessionRoleSeed[];
};

const osakaUsers: OsakaUserSeed[] = [
  {
    id: "user-9",
    name: "松本 陽子",
    email: "yoko@example.com",
    circleRole: CircleRole.CircleOwner,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-1",
        role: CircleSessionRole.CircleSessionOwner,
      },
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionOwner,
      },
    ],
  },
  {
    id: "user-10",
    name: "井上 翔",
    email: "sho@example.com",
    circleRole: CircleRole.CircleManager,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-1",
        role: CircleSessionRole.CircleSessionManager,
      },
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionManager,
      },
    ],
  },
  {
    id: "user-11",
    name: "木村 蓮",
    email: "ren@example.com",
    circleRole: CircleRole.CircleMember,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-1",
        role: CircleSessionRole.CircleSessionMember,
      },
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-12",
    name: "林 あかり",
    email: "akari@example.com",
    circleRole: CircleRole.CircleMember,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-13",
    name: "清水 悠人",
    email: "yuto@example.com",
    circleRole: CircleRole.CircleMember,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-14",
    name: "森 結衣",
    email: "yui@example.com",
    circleRole: CircleRole.CircleMember,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-15",
    name: "池田 拓海",
    email: "takumi@example.com",
    circleRole: CircleRole.CircleMember,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-16",
    name: "山本 七海",
    email: "nanami@example.com",
    circleRole: CircleRole.CircleMember,
    sessionRoles: [
      {
        circleSessionId: "osaka-session-2",
        role: CircleSessionRole.CircleSessionMember,
      },
    ],
  },
  {
    id: "user-17",
    name: "石田 颯太",
    email: "sota-i@example.com",
    circleRole: CircleRole.CircleMember,
  },
  {
    id: "user-18",
    name: "渡辺 彩花",
    email: "ayaka@example.com",
    circleRole: CircleRole.CircleMember,
  },
];

const users = [
  ...demoUsers.map(({ id, name, email, passwordHash }) => ({
    id,
    name,
    email,
    passwordHash,
  })),
  ...osakaUsers.map(({ id, name, email }) => ({
    id,
    name,
    email,
    passwordHash: demoPassHash,
  })),
];

const circles = [
  { id: "demo", name: "さくら将棋研究会" },
  { id: "demo-osaka", name: "あおば将棋研究会" },
];

const circleMemberships = [
  ...demoUsers
    .filter((user) => user.circleRole)
    .map((user, index) => ({
      circleId: "demo" as string,
      userId: user.id,
      role: user.circleRole!,
      createdAt: new Date(Date.UTC(2024, 0, 1 + index)),
    })),
  ...osakaUsers.map((user, index) => ({
    circleId: "demo-osaka" as string,
    userId: user.id,
    role: user.circleRole,
    createdAt: new Date(Date.UTC(2024, 3, 1 + index)),
  })),
];

const sessions = [
  {
    id: "demo-session-40",
    circleId: "demo",
    title: "冬季対局会",
    startsAt: new Date("2025-02-11T18:00:00+09:00"),
    endsAt: new Date("2025-02-11T21:00:00+09:00"),
    location: "さくらホール A",
    note: "",
  },
  {
    id: "demo-session-41",
    circleId: "demo",
    title: "第41回 週末研究会",
    startsAt: new Date("2025-02-26T18:00:00+09:00"),
    endsAt: new Date("2025-02-26T21:00:00+09:00"),
    location: "さくらホール A",
    note: "",
  },
  {
    id: "demo-session-42",
    circleId: "demo",
    title: "第42回 週末研究会",
    startsAt: new Date("2025-03-12T18:00:00+09:00"),
    endsAt: new Date("2025-03-12T21:00:00+09:00"),
    location: "オンライン",
    note: "進行表は開始10分前に共有",
  },
  {
    id: "demo-session-43",
    circleId: "demo",
    title: "第43回 週末研究会",
    startsAt: new Date("2026-03-26T18:00:00+09:00"),
    endsAt: new Date("2026-03-26T21:00:00+09:00"),
    location: "オンライン",
    note: "",
  },
  // 阪大 セッション（3人参加）
  {
    id: "osaka-session-1",
    circleId: "demo-osaka",
    title: "第1回 練習会",
    startsAt: new Date("2026-03-05T18:00:00+09:00"),
    endsAt: new Date("2026-03-05T21:00:00+09:00"),
    location: "あおばセンター B棟",
    note: "少人数での練習会",
  },
  // 阪大 セッション（8人参加）
  {
    id: "osaka-session-2",
    circleId: "demo-osaka",
    title: "春季大会",
    startsAt: new Date("2026-03-19T13:00:00+09:00"),
    endsAt: new Date("2026-03-19T18:00:00+09:00"),
    location: "あおばセンター 大会議室",
    note: "総当たり戦を予定",
  },
];

const sessionMemberships = [
  ...demoUsers.flatMap((user) =>
    (user.sessionRoles ?? []).map((sessionRole) => ({
      circleSessionId: sessionRole.circleSessionId,
      userId: user.id,
      role: sessionRole.role,
    })),
  ),
  ...osakaUsers.flatMap((user) =>
    (user.sessionRoles ?? []).map((sessionRole) => ({
      circleSessionId: sessionRole.circleSessionId,
      userId: user.id,
      role: sessionRole.role,
    })),
  ),
];

const matchBaseTime = new Date("2026-01-15T10:00:00Z");
const matches = [
  {
    id: "match-1",
    circleSessionId: "demo-session-42",
    player1Id: "user-1",
    player2Id: "user-5",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 0 * 60_000),
  },
  {
    id: "match-2",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-1",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 1 * 60_000),
  },
  {
    id: "match-3",
    circleSessionId: "demo-session-42",
    player1Id: "user-1",
    player2Id: "user-6",
    outcome: MatchOutcome.P2_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 2 * 60_000),
  },
  {
    id: "match-4",
    circleSessionId: "demo-session-42",
    player1Id: "user-1",
    player2Id: "user-7",
    outcome: MatchOutcome.DRAW,
    createdAt: new Date(matchBaseTime.getTime() + 3 * 60_000),
  },
  {
    id: "match-5",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-6",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 4 * 60_000),
  },
  {
    id: "match-6",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-6",
    outcome: MatchOutcome.P2_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 5 * 60_000),
  },
  {
    id: "match-7",
    circleSessionId: "demo-session-42",
    player1Id: "user-6",
    player2Id: "user-5",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 6 * 60_000),
  },
  {
    id: "match-8",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-4",
    outcome: MatchOutcome.P2_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 7 * 60_000),
  },
  {
    id: "match-9",
    circleSessionId: "demo-session-42",
    player1Id: "user-6",
    player2Id: "user-8",
    outcome: MatchOutcome.P2_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 8 * 60_000),
  },
  {
    id: "match-10",
    circleSessionId: "demo-session-42",
    player1Id: "user-7",
    player2Id: "user-4",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 9 * 60_000),
  },
  {
    id: "match-11",
    circleSessionId: "demo-session-42",
    player1Id: "user-7",
    player2Id: "user-4",
    outcome: MatchOutcome.DRAW,
    createdAt: new Date(matchBaseTime.getTime() + 10 * 60_000),
  },
  {
    id: "match-12",
    circleSessionId: "demo-session-42",
    player1Id: "user-4",
    player2Id: "user-7",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 11 * 60_000),
  },
  {
    id: "match-13",
    circleSessionId: "demo-session-42",
    player1Id: "user-4",
    player2Id: "user-8",
    outcome: MatchOutcome.DRAW,
    createdAt: new Date(matchBaseTime.getTime() + 12 * 60_000),
  },
  // 阪大 セッション1（3人）の対局
  {
    id: "osaka-match-1",
    circleSessionId: "osaka-session-1",
    player1Id: "user-9",
    player2Id: "user-10",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 20 * 60_000),
  },
  {
    id: "osaka-match-2",
    circleSessionId: "osaka-session-1",
    player1Id: "user-10",
    player2Id: "user-11",
    outcome: MatchOutcome.P2_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 21 * 60_000),
  },
  {
    id: "osaka-match-3",
    circleSessionId: "osaka-session-1",
    player1Id: "user-9",
    player2Id: "user-11",
    outcome: MatchOutcome.DRAW,
    createdAt: new Date(matchBaseTime.getTime() + 22 * 60_000),
  },
  // 阪大 セッション2（8人）の対局
  {
    id: "osaka-match-4",
    circleSessionId: "osaka-session-2",
    player1Id: "user-9",
    player2Id: "user-12",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 30 * 60_000),
  },
  {
    id: "osaka-match-5",
    circleSessionId: "osaka-session-2",
    player1Id: "user-10",
    player2Id: "user-13",
    outcome: MatchOutcome.P2_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 31 * 60_000),
  },
  {
    id: "osaka-match-6",
    circleSessionId: "osaka-session-2",
    player1Id: "user-11",
    player2Id: "user-14",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 32 * 60_000),
  },
  {
    id: "osaka-match-7",
    circleSessionId: "osaka-session-2",
    player1Id: "user-15",
    player2Id: "user-16",
    outcome: MatchOutcome.P2_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 33 * 60_000),
  },
  {
    id: "osaka-match-8",
    circleSessionId: "osaka-session-2",
    player1Id: "user-9",
    player2Id: "user-15",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 34 * 60_000),
  },
  {
    id: "osaka-match-9",
    circleSessionId: "osaka-session-2",
    player1Id: "user-12",
    player2Id: "user-16",
    outcome: MatchOutcome.DRAW,
    createdAt: new Date(matchBaseTime.getTime() + 35 * 60_000),
  },
  {
    id: "osaka-match-10",
    circleSessionId: "osaka-session-2",
    player1Id: "user-13",
    player2Id: "user-14",
    outcome: MatchOutcome.P1_WIN,
    createdAt: new Date(matchBaseTime.getTime() + 36 * 60_000),
  },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
      },
      create: user,
    });
  }

  for (const circle of circles) {
    await prisma.circle.upsert({
      where: { id: circle.id },
      update: { name: circle.name },
      create: circle,
    });
  }

  for (const membership of circleMemberships) {
    const existing = await prisma.circleMembership.findFirst({
      where: {
        userId: membership.userId,
        circleId: membership.circleId,
        deletedAt: null,
      },
    });
    if (existing) {
      await prisma.circleMembership.update({
        where: { id: existing.id },
        data: { role: membership.role },
      });
    } else {
      await prisma.circleMembership.create({
        data: membership,
      });
    }
  }

  for (const session of sessions) {
    const { circleId, ...sessionData } = session;
    await prisma.circleSession.upsert({
      where: { id: session.id },
      update: {
        title: sessionData.title,
        startsAt: sessionData.startsAt,
        endsAt: sessionData.endsAt,
        location: sessionData.location,
        note: sessionData.note,
      },
      create: { ...sessionData, circleId },
    });
  }

  for (const membership of sessionMemberships) {
    const existing = await prisma.circleSessionMembership.findFirst({
      where: {
        userId: membership.userId,
        circleSessionId: membership.circleSessionId,
        deletedAt: null,
      },
    });
    if (existing) {
      await prisma.circleSessionMembership.update({
        where: { id: existing.id },
        data: { role: membership.role },
      });
    } else {
      await prisma.circleSessionMembership.create({
        data: membership,
      });
    }
  }

  for (const match of matches) {
    await prisma.match.upsert({
      where: { id: match.id },
      update: {
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        outcome: match.outcome,
        deletedAt: null,
      },
      create: match,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
