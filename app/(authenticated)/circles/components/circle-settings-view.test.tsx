// @vitest-environment jsdom
import type { CircleSettingsViewModel } from "@/server/presentation/view-models/circle-settings";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircleSettingsView } from "./circle-settings-view";

vi.mock(
  "@/app/(authenticated)/circles/components/circle-notification-toggle",
  () => ({
    CircleNotificationToggle: () => (
      <div data-testid="notification-toggle">通知トグル</div>
    ),
  }),
);

vi.mock(
  "@/app/(authenticated)/circles/components/transfer-circle-ownership-dialog",
  () => ({
    TransferCircleOwnershipDialog: () => (
      <button data-testid="transfer-ownership-button">オーナーを移譲</button>
    ),
  }),
);

vi.mock(
  "@/app/(authenticated)/circles/components/circle-delete-button",
  () => ({
    CircleDeleteButton: () => (
      <button data-testid="circle-delete-button">削除</button>
    ),
  }),
);

afterEach(() => {
  cleanup();
});

function buildSettings(
  overrides: Partial<CircleSettingsViewModel> = {},
): CircleSettingsViewModel {
  return {
    circleId: "circle-1",
    circleName: "テスト研究会",
    sessionEmailNotificationEnabled: true,
    viewerUserId: "viewer-1",
    members: [],
    ...overrides,
  };
}

describe("CircleSettingsView", () => {
  it("通知トグル、オーナー移譲、削除ボタンがすべて表示される", () => {
    render(
      <CircleSettingsView
        settings={buildSettings()}
        backHref="/circles/circle-1"
      />,
    );

    expect(screen.getByTestId("notification-toggle")).toBeInTheDocument();
    expect(
      screen.getByTestId("transfer-ownership-button"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("circle-delete-button")).toBeInTheDocument();
  });

  it("研究会名が表示される", () => {
    render(
      <CircleSettingsView
        settings={buildSettings({ circleName: "将棋研究会A" })}
        backHref="/circles/circle-1"
      />,
    );

    expect(screen.getByText("将棋研究会A")).toBeInTheDocument();
  });

  it("研究会に戻るリンクが表示される", () => {
    render(
      <CircleSettingsView
        settings={buildSettings()}
        backHref="/circles/circle-1"
      />,
    );

    const backLink = screen.getByText("研究会に戻る");
    expect(backLink.closest("a")).toHaveAttribute(
      "href",
      "/circles/circle-1",
    );
  });

  it("通知設定・オーナー移譲・危険な操作の各セクション見出しが表示される", () => {
    render(
      <CircleSettingsView
        settings={buildSettings()}
        backHref="/circles/circle-1"
      />,
    );

    expect(screen.getByText("通知設定")).toBeInTheDocument();
    expect(screen.getByText("オーナー移譲")).toBeInTheDocument();
    expect(screen.getByText("危険な操作")).toBeInTheDocument();
  });

  it("設定ページの見出しが表示される", () => {
    render(
      <CircleSettingsView
        settings={buildSettings()}
        backHref="/circles/circle-1"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "設定" }),
    ).toBeInTheDocument();
  });
});
