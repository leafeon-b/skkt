// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import SignupForm from "./signup-form";
import { SIGNUP_ERROR_MESSAGES } from "./signup-form-messages";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const pushMock = vi.fn();
const signInMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

afterEach(() => {
  cleanup();
  pushMock.mockClear();
  signInMock.mockClear();
  vi.restoreAllMocks();
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("demo1@example.com"), "test@example.com");
  const passwordInputs = screen.getAllByPlaceholderText("••••••••");
  await user.type(passwordInputs[0], "password123");
  await user.type(passwordInputs[1], "password123");
}

describe("SignupForm 利用規約チェックボックス", () => {
  it("チェックボックスが未チェックの状態で送信するとエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await fillRequiredFields(user);

    const submitButton = screen.getByRole("button", {
      name: "アカウントを作成",
    });
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent(
      SIGNUP_ERROR_MESSAGES.termsNotAgreed,
    );
  });

  it("チェックボックスにチェック後、送信するとリダイレクトする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    signInMock.mockResolvedValue({ error: null, url: "/home" });

    const user = userEvent.setup();
    render(<SignupForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", {
      name: "アカウントを作成",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/home");
    });
  });

  it("表示名超過 + パスワード短すぎのとき、表示名超過エラーが優先表示される", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    fireEvent.change(screen.getByPlaceholderText("例: 佐藤 太郎"), {
      target: { value: "あ".repeat(51) },
    });
    await user.type(screen.getByPlaceholderText("demo1@example.com"), "test@example.com");
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInputs[0], "short12");
    await user.type(passwordInputs[1], "short12");
    await user.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", {
      name: "アカウントを作成",
    });
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent(
      SIGNUP_ERROR_MESSAGES.nameTooLong,
    );
  });

  it("パスワード短すぎ + パスワード不一致のとき、パスワード短すぎエラーが優先表示される", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("demo1@example.com"), "test@example.com");
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInputs[0], "short12");
    await user.type(passwordInputs[1], "differ1");
    await user.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", {
      name: "アカウントを作成",
    });
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent(
      SIGNUP_ERROR_MESSAGES.passwordTooShort,
    );
  });

  it("パスワード不一致 + 利用規約未同意のとき、パスワード不一致エラーが優先表示される", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("demo1@example.com"), "test@example.com");
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInputs[0], "password123");
    await user.type(passwordInputs[1], "different456");

    const submitButton = screen.getByRole("button", {
      name: "アカウントを作成",
    });
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent(
      SIGNUP_ERROR_MESSAGES.passwordMismatch,
    );
  });

  it("利用規約リンクが新しいタブで開くように設定されている", () => {
    render(<SignupForm />);

    const link = screen.getByRole("link", { name: "利用規約" });
    expect(link).toHaveAttribute("href", "/terms");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
