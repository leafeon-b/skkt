// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("title 未入力ではバリデーションエラーにより送信されない", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    const titleInput = screen.getByLabelText("タイトル") as HTMLInputElement;
    expect(titleInput.validity.valid).toBe(false);
  });

  it("startsAt 未入力ではバリデーションエラーにより送信されない", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);
    await user.type(endsAtInput, "2025-04-01T12:00");

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    expect((startsAtInput as HTMLInputElement).validity.valid).toBe(false);
  });

  it("endsAt 未入力ではバリデーションエラーにより送信されない", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    await user.type(screen.getByLabelText("タイトル"), "テスト研究会");
    const startsAtInput = screen.getByLabelText("開始日時");
    await user.clear(startsAtInput);
    await user.type(startsAtInput, "2025-04-01T10:00");
    const endsAtInput = screen.getByLabelText("終了日時");
    await user.clear(endsAtInput);

    await user.click(screen.getByRole("button", { name: /予定を作成/ }));

    expect((endsAtInput as HTMLInputElement).validity.valid).toBe(false);
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
      expect.objectContaining({
        onSuccess: expect.any(Function),
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

  it("タイトル・開始日時・終了日時に required 属性が付与されている", () => {
    render(<CircleSessionCreateForm circleId={circleId} />);

    expect(screen.getByLabelText("タイトル")).toBeRequired();
    expect(screen.getByLabelText("開始日時")).toBeRequired();
    expect(screen.getByLabelText("終了日時")).toBeRequired();
  });

  it("空白のみのタイトルを入力すると customValidity が設定される", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const titleInput = screen.getByLabelText("タイトル");
    await user.type(titleInput, "   ");

    expect(
      (titleInput as HTMLInputElement).validationMessage,
    ).toBe("タイトルを入力してください");
  });

  it("全角スペースのみのタイトルを入力すると customValidity が設定される", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const titleInput = screen.getByLabelText("タイトル");
    await user.type(titleInput, "\u3000\u3000\u3000");

    expect(
      (titleInput as HTMLInputElement).validationMessage,
    ).toBe("タイトルを入力してください");
  });

  describe("タイムゾーン境界", () => {
    beforeEach(() => {
      // JST 2025-01-02 03:00 = UTC 2025-01-01 18:00
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-02T03:00:00+09:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("JST 深夜帯（UTC では前日）でもローカル日付がデフォルト値に使用される", () => {
      render(<CircleSessionCreateForm circleId={circleId} />);

      expect(screen.getByLabelText("開始日時")).toHaveValue(
        "2025-01-02T10:00",
      );
      expect(screen.getByLabelText("終了日時")).toHaveValue(
        "2025-01-02T18:00",
      );
    });
  });

  it("空白のみから有効なタイトルに変更すると customValidity がクリアされる", async () => {
    const user = userEvent.setup();
    render(<CircleSessionCreateForm circleId={circleId} />);

    const titleInput = screen.getByLabelText("タイトル");
    await user.type(titleInput, "   ");
    expect(
      (titleInput as HTMLInputElement).validationMessage,
    ).toBe("タイトルを入力してください");

    await user.clear(titleInput);
    await user.type(titleInput, "テスト");
    expect((titleInput as HTMLInputElement).validationMessage).toBe("");
  });
});
