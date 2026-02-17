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
    name: "藤井 聡太",
    email: "sota@example.com",
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
    name: "羽生 善治",
    email: "hanyu@example.com",
    passwordHash:
      "scrypt$LB/WpSUVa4YAq/mw6ooWeQ==$psMSAlyc9B8JVAf/BUGzOo0gO709Ej73xiGjKIlzlRse5jEEK2i76FesK5Si/a0XRMxUZ7L3SB02oYK4V4PYnQ==",
    circleRole: CircleRole.CircleManager,
  },
  {
    id: "user-3",
    name: "渡辺 明",
    email: "watanabe@example.com",
    passwordHash:
      "scrypt$ghXg41bEALR5yYMcQ5UrPw==$5r70+5O1QPJYBlI0qHGqqaLHCAUoyahC29MBQhxDAHCdhq7N6j2DYh7FS1Sj8SWgZqCDPYnxEIVqY3K/HqrMRQ==",
    circleRole: CircleRole.CircleManager,
  },
  {
    id: "user-4",
    name: "伊藤 匠",
    email: "ito@example.com",
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
    name: "豊島 将之",
    email: "toyoshima@example.com",
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
    name: "永瀬 拓矢",
    email: "nagase@example.com",
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
    name: "佐々木 勇気",
    email: "sasaki@example.com",
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
    name: "菅井 竜也",
    email: "sugai@example.com",
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

const users = demoUsers.map(({ id, name, email, passwordHash }) => ({
  id,
  name,
  email,
  passwordHash,
}));

const circle = {
  id: "demo",
  name: "京大将棋研究会",
};

const circleMemberships = demoUsers
  .filter((user) => user.circleRole)
  .map((user, index) => ({
    userId: user.id,
    role: user.circleRole!,
    createdAt: new Date(Date.UTC(2024, 0, 1 + index)),
  }));

const sessions = [
  {
    id: "demo-session-40",

    title: "冬季対局会",
    startsAt: new Date("2025-02-11T18:00:00+09:00"),
    endsAt: new Date("2025-02-11T21:00:00+09:00"),
    location: "京都キャンパス A",
    note: "",
  },
  {
    id: "demo-session-41",

    title: "第41回 週末研究会",
    startsAt: new Date("2025-02-26T18:00:00+09:00"),
    endsAt: new Date("2025-02-26T21:00:00+09:00"),
    location: "京都キャンパス A",
    note: "",
  },
  {
    id: "demo-session-42",

    title: "第42回 週末研究会",
    startsAt: new Date("2025-03-12T18:00:00+09:00"),
    endsAt: new Date("2025-03-12T21:00:00+09:00"),
    location: "オンライン",
    note: "進行表は開始10分前に共有",
  },
  {
    id: "demo-session-43",

    title: "第43回 週末研究会",
    startsAt: new Date("2026-03-26T18:00:00+09:00"),
    endsAt: new Date("2026-03-26T21:00:00+09:00"),
    location: "オンライン",
    note: "",
  },
];

const sessionMemberships = demoUsers.flatMap((user) =>
  (user.sessionRoles ?? []).map((sessionRole) => ({
    circleSessionId: sessionRole.circleSessionId,
    userId: user.id,
    role: sessionRole.role,
  })),
);

const matches = [
  {
    id: "match-1",
    circleSessionId: "demo-session-42",
    player1Id: "user-1",
    player2Id: "user-5",
    outcome: MatchOutcome.P1_WIN,
  },
  {
    id: "match-2",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-1",
    outcome: MatchOutcome.P1_WIN,
  },
  {
    id: "match-3",
    circleSessionId: "demo-session-42",
    player1Id: "user-1",
    player2Id: "user-6",
    outcome: MatchOutcome.P2_WIN,
  },
  {
    id: "match-4",
    circleSessionId: "demo-session-42",
    player1Id: "user-1",
    player2Id: "user-7",
    outcome: MatchOutcome.DRAW,
  },
  {
    id: "match-5",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-6",
    outcome: MatchOutcome.P1_WIN,
  },
  {
    id: "match-6",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-6",
    outcome: MatchOutcome.P2_WIN,
  },
  {
    id: "match-7",
    circleSessionId: "demo-session-42",
    player1Id: "user-6",
    player2Id: "user-5",
    outcome: MatchOutcome.P1_WIN,
  },
  {
    id: "match-8",
    circleSessionId: "demo-session-42",
    player1Id: "user-5",
    player2Id: "user-4",
    outcome: MatchOutcome.P2_WIN,
  },
  {
    id: "match-9",
    circleSessionId: "demo-session-42",
    player1Id: "user-6",
    player2Id: "user-8",
    outcome: MatchOutcome.P2_WIN,
  },
  {
    id: "match-10",
    circleSessionId: "demo-session-42",
    player1Id: "user-7",
    player2Id: "user-4",
    outcome: MatchOutcome.P1_WIN,
  },
  {
    id: "match-11",
    circleSessionId: "demo-session-42",
    player1Id: "user-7",
    player2Id: "user-4",
    outcome: MatchOutcome.DRAW,
  },
  {
    id: "match-12",
    circleSessionId: "demo-session-42",
    player1Id: "user-4",
    player2Id: "user-7",
    outcome: MatchOutcome.P1_WIN,
  },
  {
    id: "match-13",
    circleSessionId: "demo-session-42",
    player1Id: "user-4",
    player2Id: "user-8",
    outcome: MatchOutcome.DRAW,
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

  await prisma.circle.upsert({
    where: { id: circle.id },
    update: { name: circle.name },
    create: circle,
  });

  for (const membership of circleMemberships) {
    await prisma.circleMembership.upsert({
      where: {
        userId_circleId: { userId: membership.userId, circleId: circle.id },
      },
      update: { role: membership.role },
      create: { ...membership, circleId: circle.id },
    });
  }

  for (const session of sessions) {
    await prisma.circleSession.upsert({
      where: { id: session.id },
      update: {
        title: session.title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        location: session.location,
        note: session.note,
      },
      create: { ...session, circleId: circle.id },
    });
  }

  for (const membership of sessionMemberships) {
    await prisma.circleSessionMembership.upsert({
      where: {
        userId_circleSessionId: {
          userId: membership.userId,
          circleSessionId: membership.circleSessionId,
        },
      },
      update: { role: membership.role },
      create: membership,
    });
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
