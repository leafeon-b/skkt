// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircleSessionCreateForm } from "./circle-session-create-form";

const mutateMock = vi.fn();

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circleSessions: {
      create: {
        useMutation: () => ({
          mutate: mutateMock,
          isPending: false,
          data: null,
          error: null,
        }),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  mutateMock.mockClear();
});

describe("CircleSessionCreateForm", () => {
  const circleId = "test-circle-id";

  it("mutate が呼ばれない: sequence が未入力", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    // startsAt
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    // endsAt
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /開催回を作成/ }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("mutate が呼ばれない: title が未入力", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("回数（第N回）"), "1");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /開催回を作成/ }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("mutate が呼ばれない: startsAt が未入力", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("回数（第N回）"), "1");
    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /開催回を作成/ }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("mutate が呼ばれない: endsAt が未入力", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("回数（第N回）"), "1");
    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");

    await user.click(screen.getByRole("button", { name: /開催回を作成/ }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("全フィールド入力済みで mutate が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("回数（第N回）"), "1");
    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /開催回を作成/ }));

    expect(mutateMock).toHaveBeenCalledOnce();
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        circleId,
        sequence: 1,
        title: "テスト研究会",
      }),
    );
  });

  it("defaultStartsAt が datetime-local 形式の場合そのまま設定される", () => {
    render(
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt="2025-06-15T14:00"
      />,
    );

    const startsAtInput = screen.getByLabelText("開始日時") as HTMLInputElement;
    expect(startsAtInput.value).toBe("2025-06-15T14:00");
  });

  it("プリフィル props が設定されるとフォームにデフォルト値が入る", () => {
    render(
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt="2025-06-15T10:00"
        defaultTitle="複製テスト"
        defaultEndsAt="2025-06-15T17:00"
        defaultLocation="将棋会館"
        defaultNote="テストメモ"
      />,
    );

    expect(
      (screen.getByLabelText("タイトル") as HTMLInputElement).value,
    ).toBe("複製テスト");
    expect(
      (screen.getByLabelText("開始日時") as HTMLInputElement).value,
    ).toBe("2025-06-15T10:00");
    expect(
      (screen.getByLabelText("終了日時") as HTMLInputElement).value,
    ).toBe("2025-06-15T17:00");
    expect(
      (screen.getByLabelText("場所（任意）") as HTMLInputElement).value,
    ).toBe("将棋会館");
    expect(
      (screen.getByLabelText("備考（任意）") as HTMLTextAreaElement).value,
    ).toBe("テストメモ");
  });

  it("defaultStartsAt が設定されると startsAt にデフォルト値が入る", async () => {
    const user = userEvent.setup();
    render(
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt="2025-06-15"
      />,
    );

    const startsAtInput = screen.getByLabelText("開始日時") as HTMLInputElement;
    expect(startsAtInput.value).toBe("2025-06-15T00:00");

    await user.type(screen.getByLabelText("回数（第N回）"), "2");
    await user.type(screen.getByLabelText("タイトル"), "研究会");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-06-15T17:00");

    await user.click(screen.getByRole("button", { name: /開催回を作成/ }));

    expect(mutateMock).toHaveBeenCalledOnce();
  });
});
