import { describe, expect, test, vi } from "vitest";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { userId } from "@/server/domain/common/ids";
import {
  BadRequestError,
  TooManyRequestsError,
} from "@/server/domain/common/errors";

const createMockContext = () => {
  const userService = {
    getUser: vi.fn(),
    listUsers: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    updateProfileVisibility: vi.fn(),
  };

  const context: Context = {
    actorId: userId("user-1"),
    clientIp: "1.2.3.4",
    circleService: {} as Context["circleService"],
    circleMembershipService: {} as Context["circleMembershipService"],
    circleSessionService: {} as Context["circleSessionService"],
    circleSessionMembershipService:
      {} as Context["circleSessionMembershipService"],
    matchService: {} as Context["matchService"],
    userService,
    signupService: {} as Context["signupService"],
    circleInviteLinkService: {} as Context["circleInviteLinkService"],
    accessService: {} as Context["accessService"],
    userStatisticsService: {} as Context["userStatisticsService"],
    roundRobinScheduleService: {} as Context["roundRobinScheduleService"],
    holidayProvider: {} as Context["holidayProvider"],
  };

  return { context, mocks: { userService } };
};

const callMutation = async (
  context: Context,
  procedure: string,
  input: unknown,
) => {
  const response = await fetchRequestHandler({
    endpoint: "",
    req: new Request(`http://localhost/${procedure}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    router: appRouter,
    createContext: () => context,
  });
  const body = await response.json();
  // superjson wraps the response in { json, meta }
  return body.error.json;
};

describe("error formatter", () => {
  test("Zodバリデーションエラー時にメッセージがサニタイズされ isValidationError が付与される", async () => {
    const { context } = createMockContext();

    const result = await callMutation(context, "users.changePassword", {
      json: { currentPassword: "old", newPassword: "short" },
    });

    expect(result.data.code).toBe("BAD_REQUEST");
    expect(result.message).toBe("Validation failed");
    expect(result.data.isValidationError).toBe(true);
  });

  test("DomainError（BAD_REQUEST）時に元のメッセージが保持される", async () => {
    const { context, mocks } = createMockContext();
    mocks.userService.changePassword.mockRejectedValueOnce(
      new BadRequestError("Current password is incorrect"),
    );

    const result = await callMutation(context, "users.changePassword", {
      json: { currentPassword: "oldpass12", newPassword: "newpass12" },
    });

    expect(result.data.code).toBe("BAD_REQUEST");
    expect(result.message).toBe("Current password is incorrect");
    expect(result.data.isValidationError).toBeFalsy();
  });

  test("TooManyRequestsError 時に retryAfterMs が保持される", async () => {
    const { context, mocks } = createMockContext();
    mocks.userService.changePassword.mockRejectedValueOnce(
      new TooManyRequestsError(50_000),
    );

    const result = await callMutation(context, "users.changePassword", {
      json: { currentPassword: "oldpass12", newPassword: "newpass12" },
    });

    expect(result.data.code).toBe("TOO_MANY_REQUESTS");
    expect(result.data.retryAfterMs).toBe(50_000);
    expect(result.data.isValidationError).toBeFalsy();
  });
});
