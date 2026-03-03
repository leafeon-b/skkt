// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AuthErrorPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function renderPage(searchParams: { error?: string } = {}) {
  const jsx = await AuthErrorPage({
    searchParams: Promise.resolve(searchParams),
  });
  render(jsx);
}

describe("AuthErrorPage", () => {
  it("Configuration エラーで設定問題メッセージを表示する", async () => {
    await renderPage({ error: "Configuration" });
    expect(
      screen.getByText(
        "サーバーの設定に問題があります。管理者にお問い合わせください。",
      ),
    ).toBeInTheDocument();
  });

  it("AccessDenied エラーでアクセス拒否メッセージを表示する", async () => {
    await renderPage({ error: "AccessDenied" });
    expect(screen.getByText("アクセスが拒否されました。")).toBeInTheDocument();
  });

  it("Verification エラーで認証リンク期限切れメッセージを表示する", async () => {
    await renderPage({ error: "Verification" });
    expect(
      screen.getByText(
        "認証リンクの有効期限が切れたか、既に使用されています。",
      ),
    ).toBeInTheDocument();
  });

  it("OAuthAccountNotLinked エラーで別ログイン方法メッセージを表示する", async () => {
    await renderPage({ error: "OAuthAccountNotLinked" });
    expect(
      screen.getByText(
        "このメールアドレスは別のログイン方法で登録されています。元のログイン方法でサインインしてください。",
      ),
    ).toBeInTheDocument();
  });

  it("未知のエラータイプでデフォルトメッセージを表示する", async () => {
    await renderPage({ error: "Unknown" });
    expect(
      screen.getByText("認証中にエラーが発生しました。"),
    ).toBeInTheDocument();
  });

  it("error パラメータなしでデフォルトメッセージを表示する", async () => {
    await renderPage();
    expect(
      screen.getByText("認証中にエラーが発生しました。"),
    ).toBeInTheDocument();
  });

  it("ホームに戻るリンクが href='/' で表示される", async () => {
    await renderPage();
    const link = screen.getByRole("link", { name: "ホームに戻る" });
    expect(link).toHaveAttribute("href", "/");
  });
});
