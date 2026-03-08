// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SignOutPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const mockGetCsrfToken = vi.fn<() => Promise<string | undefined>>();
vi.mock("next-auth/react", () => ({
  getCsrfToken: (...args: unknown[]) => mockGetCsrfToken(...(args as [])),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SignOutPage", () => {
  describe("getCsrfToken 成功時", () => {
    it("フォームの action が /api/auth/signout である", async () => {
      mockGetCsrfToken.mockResolvedValue("test-csrf-token");
      render(<SignOutPage />);
      const button = await screen.findByRole("button", { name: "ログアウト" });
      const form = button.closest("form");
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute("action", "/api/auth/signout");
    });

    it("callbackUrl hidden input の value が '/' である", async () => {
      mockGetCsrfToken.mockResolvedValue("test-csrf-token");
      render(<SignOutPage />);
      const button = await screen.findByRole("button", { name: "ログアウト" });
      const form = button.closest("form");
      expect(form).toBeInTheDocument();
      const callbackInput = form!.querySelector('input[name="callbackUrl"]');
      expect(callbackInput).toBeInTheDocument();
      expect(callbackInput).toHaveValue("/");
    });

    it("csrfToken hidden input がフォーム内に存在する", async () => {
      mockGetCsrfToken.mockResolvedValue("test-csrf-token");
      render(<SignOutPage />);
      const button = await screen.findByRole("button", { name: "ログアウト" });
      const form = button.closest("form");
      expect(form).toBeInTheDocument();
      const csrfInput = form!.querySelector('input[name="csrfToken"]');
      expect(csrfInput).toBeInTheDocument();
      expect(csrfInput).toHaveValue("test-csrf-token");
    });

    it("ログアウトボタンが有効である", async () => {
      mockGetCsrfToken.mockResolvedValue("test-csrf-token");
      render(<SignOutPage />);
      const button = await screen.findByRole("button", { name: "ログアウト" });
      expect(button).toBeEnabled();
    });
  });

  describe("getCsrfToken エラー時", () => {
    it("エラーメッセージを表示する", async () => {
      mockGetCsrfToken.mockRejectedValue(new Error("fetch failed"));
      render(<SignOutPage />);
      expect(
        await screen.findByText(
          "トークンの取得に失敗しました。ページを再読み込みしてください。",
        ),
      ).toBeInTheDocument();
    });

    it("ログアウトボタンが disabled である", async () => {
      mockGetCsrfToken.mockRejectedValue(new Error("fetch failed"));
      render(<SignOutPage />);
      await screen.findByText(
        "トークンの取得に失敗しました。ページを再読み込みしてください。",
      );
      expect(screen.getByRole("button", { name: "ログアウト" })).toBeDisabled();
    });
  });

  describe("getCsrfToken が undefined を resolve した場合", () => {
    it("ログアウトボタンが disabled である", async () => {
      mockGetCsrfToken.mockResolvedValue(undefined);
      render(<SignOutPage />);
      await act(async () => {});
      expect(
        screen.getByRole("button", { name: "ログアウト" }),
      ).toBeDisabled();
    });

    it("エラーメッセージが表示されない", async () => {
      mockGetCsrfToken.mockResolvedValue(undefined);
      render(<SignOutPage />);
      await act(async () => {});
      expect(
        screen.queryByText(
          "トークンの取得に失敗しました。ページを再読み込みしてください。",
        ),
      ).not.toBeInTheDocument();
    });
  });

  it("キャンセルリンクが href='/' で表示される", async () => {
    mockGetCsrfToken.mockResolvedValue("test-csrf-token");
    render(<SignOutPage />);
    const link = screen.getByRole("link", { name: "キャンセル" });
    expect(link).toHaveAttribute("href", "/");
  });
});
