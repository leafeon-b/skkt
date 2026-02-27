// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import SignupForm from "./signup-form";

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
      "利用規約に同意してください。",
    );
  });

  it("チェックボックスにチェック後、送信するとfetchが呼ばれる", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    signInMock.mockResolvedValue({ error: null, url: "/home" });

    const user = userEvent.setup();
    render(<SignupForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", {
      name: "アカウントを作成",
    });
    await user.click(submitButton);

    expect(screen.queryByText("利用規約に同意してください。")).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"agreedToTerms":true'),
      }),
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
