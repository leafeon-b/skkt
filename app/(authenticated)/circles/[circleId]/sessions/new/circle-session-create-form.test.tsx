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

  it("mutate が呼ばれない: title が未入力", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("mutate が呼ばれない: startsAt が未入力", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("mutate が呼ばれない: endsAt が未入力", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("全フィールド入力済みで mutate が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    expect(mutateMock).toHaveBeenCalledOnce();
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        circleId,
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

    expect(screen.getByLabelText("開始日時")).toHaveValue("2025-06-15T14:00");
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

    expect(screen.getByLabelText("タイトル")).toHaveValue("複製テスト");
    expect(screen.getByLabelText("開始日時")).toHaveValue("2025-06-15T10:00");
    expect(screen.getByLabelText("終了日時")).toHaveValue("2025-06-15T17:00");
    expect(screen.getByLabelText("場所（任意）")).toHaveValue("将棋会館");
    expect(screen.getByLabelText("備考（任意）")).toHaveValue("テストメモ");
  });

  it("defaultStartsAt が日付のみの場合 T10:00 が付与される", () => {
    render(
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt="2025-06-15"
      />,
    );

    expect(screen.getByLabelText("開始日時")).toHaveValue("2025-06-15T10:00");
  });

  it("defaultEndsAt が日付のみの場合 T18:00 が付与される", () => {
    render(
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt="2025-06-15"
        defaultEndsAt="2025-06-15"
      />,
    );

    expect(screen.getByLabelText("終了日時")).toHaveValue("2025-06-15T18:00");
  });

  it("defaultStartsAt / defaultEndsAt 未指定の場合、当日の 10:00 / 18:00 が設定される", () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    render(<CircleSessionCreateForm circleId={circleId} />);

    expect(screen.getByLabelText("開始日時")).toHaveValue(`${today}T10:00`);
    expect(screen.getByLabelText("終了日時")).toHaveValue(`${today}T18:00`);
  });

  it("defaultEndsAt 未指定の場合、startsAt と同日の T18:00 が設定される", () => {
    render(
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt="2025-08-20"
      />,
    );

    expect(screen.getByLabelText("終了日時")).toHaveValue("2025-08-20T18:00");
  });

  it("空白のみのタイトルで送信するとエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const titleInput = screen.getByLabelText("タイトル");
    await user.type(titleInput, "   ");

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("タイトルを入力してください");
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("全角スペースのみのタイトルで送信するとエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const titleInput = screen.getByLabelText("タイトル");
    await user.type(titleInput, "\u3000\u3000\u3000");

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("タイトルを入力してください");
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("タイトル入力時にエラーメッセージがクリアされる", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const titleInput = screen.getByLabelText("タイトル");
    await user.type(titleInput, "   ");
    await user.click(screen.getByRole("button", { name: /予定を作成/ }));
    expect(screen.getByRole("alert")).toBeTruthy();

    await user.type(titleInput, "テスト");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
