// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import UnsubscribePage from "./page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./unsubscribe-form", () => ({
  UnsubscribeForm: ({ token }: { token: string }) => (
    <div data-testid="unsubscribe-form" data-token={token} />
  ),
}));

vi.mock("@/app/components/footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

afterEach(() => {
  cleanup();
});

async function renderPage(searchParams: { token?: string } = {}) {
  const jsx = await UnsubscribePage({
    searchParams: Promise.resolve(searchParams),
  });
  render(jsx);
}

describe("UnsubscribePage", () => {
  test("トークンなしで「無効なリンクです」メッセージを表示する", async () => {
    await renderPage();

    expect(
      screen.getByText(
        "無効なリンクです。メールに記載されたリンクからアクセスしてください。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("unsubscribe-form")).not.toBeInTheDocument();
  });

  test("不正形式トークンで「無効なトークンです」エラーを表示する", async () => {
    await renderPage({ token: "short" });

    expect(screen.getByText("無効なトークンです。")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ログインしてアカウント設定" }),
    ).toHaveAttribute("href", "/account");
    expect(screen.queryByTestId("unsubscribe-form")).not.toBeInTheDocument();
  });

  test("有効形式トークンで UnsubscribeForm を表示する", async () => {
    const token = "dmFsaWQtdG9rZW4tZm9yLXRlc3Q";
    await renderPage({ token });

    const form = screen.getByTestId("unsubscribe-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("data-token", token);
    expect(screen.queryByText("無効なリンクです。")).not.toBeInTheDocument();
    expect(screen.queryByText("無効なトークンです。")).not.toBeInTheDocument();
  });
});
