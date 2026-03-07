import { describe, test, expect, vi, beforeEach } from "vitest";
import { createNotificationService } from "@/server/application/notification/notification-service";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { EmailSender } from "@/server/domain/common/email-sender";
import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import type { User } from "@/server/domain/models/user/user";

const mockCircleRepository = {
  listMembershipsByCircleId: vi.fn(),
} as unknown as CircleRepository;

const mockUserRepository = {
  findByIds: vi.fn(),
} as unknown as UserRepository;

const mockEmailSender: EmailSender = {
  send: vi.fn().mockResolvedValue(undefined),
};

const service = createNotificationService({
  circleRepository: mockCircleRepository,
  userRepository: mockUserRepository,
  emailSender: mockEmailSender,
});

const session = createCircleSession({
  id: circleSessionId("session-1"),
  circleId: circleId("circle-1"),
  title: "第1回 研究会",
  startsAt: new Date("2024-06-01T10:00:00Z"),
  endsAt: new Date("2024-06-01T12:00:00Z"),
  location: "Tokyo",
});

const actorId = "user-1";
const circleName = "将棋研究会";

const makeMembership = (
  uid: string,
  deletedAt: Date | null = null,
): CircleMembership => ({
  circleId: circleId("circle-1"),
  userId: userId(uid),
  role: "CircleMember" as const,
  createdAt: new Date("2024-01-01"),
  deletedAt,
});

const makeUser = (uid: string, email: string | null): User => ({
  id: userId(uid),
  name: uid,
  email,
  image: null,
  profileVisibility: "public",
  createdAt: new Date("2024-01-01"),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationService", () => {
  test("メンバーにメール送信される", async () => {
    vi.mocked(mockCircleRepository.listMembershipsByCircleId).mockResolvedValue(
      [makeMembership("user-1"), makeMembership("user-2")],
    );
    vi.mocked(mockUserRepository.findByIds).mockResolvedValue([
      makeUser("user-2", "user2@example.com"),
    ]);

    await service.notifySessionCreated(session, circleName, actorId);

    expect(mockEmailSender.send).toHaveBeenCalledOnce();
    expect(mockEmailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["user2@example.com"],
        subject: `[将棋研究会] 第1回 研究会`,
      }),
    );
  });

  test("作成者自身にはメール送信されない", async () => {
    vi.mocked(mockCircleRepository.listMembershipsByCircleId).mockResolvedValue(
      [makeMembership("user-1")],
    );

    await service.notifySessionCreated(session, circleName, actorId);

    expect(mockEmailSender.send).not.toHaveBeenCalled();
    expect(mockUserRepository.findByIds).not.toHaveBeenCalled();
  });

  test("email が null のユーザーにはメール送信されない", async () => {
    vi.mocked(mockCircleRepository.listMembershipsByCircleId).mockResolvedValue(
      [makeMembership("user-1"), makeMembership("user-2")],
    );
    vi.mocked(mockUserRepository.findByIds).mockResolvedValue([
      makeUser("user-2", null),
    ]);

    await service.notifySessionCreated(session, circleName, actorId);

    expect(mockEmailSender.send).not.toHaveBeenCalled();
  });

  test("退会済みメンバーにはメール送信されない", async () => {
    vi.mocked(mockCircleRepository.listMembershipsByCircleId).mockResolvedValue(
      [makeMembership("user-1"), makeMembership("user-2", new Date())],
    );

    await service.notifySessionCreated(session, circleName, actorId);

    expect(mockEmailSender.send).not.toHaveBeenCalled();
  });
});
