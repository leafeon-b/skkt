// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MutationBehavior,
  makeMutationMock,
} from "@/test-helpers/trpc-mutation-mock";
import { MemberRoleDropdown } from "./member-role-dropdown";

let updateRoleBehavior: MutationBehavior = "idle";

const useMutationHolder = vi.hoisted(() => {
  const noop = (): unknown => ({});
  return { current: noop as (...args: unknown[]) => unknown };
});

const { useMutation } = makeMutationMock(
  () => updateRoleBehavior,
  { hasReset: false },
);
useMutationHolder.current =
  useMutation as unknown as typeof useMutationHolder.current;

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circles: {
      memberships: {
        updateRole: {
          useMutation: (...args: unknown[]) =>
            useMutationHolder.current(...args),
        },
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  updateRoleBehavior = "idle";
});

const defaultProps = {
  circleId: "circle-1",
  userId: "user-1",
  currentRole: "manager" as const,
};

describe("MemberRoleDropdown", () => {
  let toastModule: {
    toast: { error: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    toastModule = (await import("sonner")) as unknown as typeof toastModule;
    toastModule.toast.error.mockClear();
  });

  it("編集アイコンボタンが表示される", () => {
    render(<MemberRoleDropdown {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "ロールを変更" }),
    ).toBeInTheDocument();
  });

  it("編集ボタンをクリックするとマネージャーとメンバーの選択肢が表示される", async () => {
    const user = userEvent.setup();
    render(<MemberRoleDropdown {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "ロールを変更" }));

    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("マネージャー");
    expect(items[1]).toHaveTextContent("メンバー");
  });

  it("現在のロールと同じメニュー項目は disabled", async () => {
    const user = userEvent.setup();
    render(<MemberRoleDropdown {...defaultProps} currentRole="manager" />);

    await user.click(screen.getByRole("button", { name: "ロールを変更" }));

    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items[0]).toHaveAttribute("data-disabled");
  });

  it("異なるロールを選択するとメニューが閉じる", async () => {
    updateRoleBehavior = "success";
    const user = userEvent.setup();
    render(<MemberRoleDropdown {...defaultProps} currentRole="manager" />);

    await user.click(screen.getByRole("button", { name: "ロールを変更" }));

    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    await user.click(items[1]);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("ロール変更失敗時に toast.error が呼ばれる", async () => {
    updateRoleBehavior = "error";
    const user = userEvent.setup();
    render(<MemberRoleDropdown {...defaultProps} currentRole="manager" />);

    await user.click(screen.getByRole("button", { name: "ロールを変更" }));

    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    await user.click(items[1]);

    expect(toastModule.toast.error).toHaveBeenCalledWith(
      "ロールの変更に失敗しました",
      { description: "時間をおいて再度お試しください" },
    );
  });

  it("isPending 中は編集ボタンが disabled になる", () => {
    updateRoleBehavior = "pending";
    render(<MemberRoleDropdown {...defaultProps} />);

    const trigger = screen.getByRole("button", { name: "ロールを変更" });
    expect(trigger).toBeDisabled();
  });
});
