import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("カレンダー Tab キーナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // onDateClick が有効な研究会ページに遷移（オーナー権限あり）
    await page.goto("/circles/demo");
    // カレンダーのセルに tabindex が適用されるまで待機
    await page
      .locator('[role="region"][aria-label="開催カレンダー"]')
      .waitFor();
    await page
      .locator(".fc-daygrid-day[tabindex='0']")
      .first()
      .waitFor({ timeout: 10_000 });
  });

  test("Tab キーでカレンダーグリッド内の tabindex=0 セルにフォーカスが移る", async ({
    page,
  }) => {
    const calendar = page.locator(
      '[role="region"][aria-label="開催カレンダー"]',
    );
    const focusableCell = calendar.locator(".fc-daygrid-day[tabindex='0']");

    // tabindex="0" のセルが存在することを確認
    await expect(focusableCell).toHaveCount(1);

    // Tab キーを繰り返し押してカレンダーセルにフォーカスが移るまで試行
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(".fc-daygrid-day:focus");
      if ((await focused.count()) > 0) {
        await expect(focused).toHaveAttribute("tabindex", "0");
        return;
      }
    }

    expect(false, "Tab キーでカレンダーセルにフォーカスが移りませんでした").toBe(
      true,
    );
  });

  test("Shift+Tab でカレンダーグリッドからフォーカスが離れる", async ({
    page,
  }) => {
    const calendar = page.locator(
      '[role="region"][aria-label="開催カレンダー"]',
    );

    // まずカレンダーセルにフォーカスを移す
    const focusableCell = calendar.locator(".fc-daygrid-day[tabindex='0']");
    await focusableCell.focus();
    await expect(focusableCell).toBeFocused();

    // Shift+Tab でフォーカスがグリッド外に移ることを検証
    await page.keyboard.press("Shift+Tab");
    const stillFocused = calendar.locator(".fc-daygrid-day:focus");
    await expect(stillFocused).toHaveCount(0);
  });

  test("月切り替え後もフォーカス管理が正常に動作する", async ({ page }) => {
    const calendar = page.locator(
      '[role="region"][aria-label="開催カレンダー"]',
    );

    // 現在の月のヘッダーテキストを取得
    const currentTitle =
      await calendar.locator(".fc-toolbar-title").textContent();

    // 次月ボタンをクリック
    await calendar.locator(".fc-next-button").click();

    // 月が切り替わったことを確認
    await expect(calendar.locator(".fc-toolbar-title")).not.toHaveText(
      currentTitle!,
    );

    // MutationObserver による tabindex 再適用を待機
    await page
      .locator(".fc-daygrid-day[tabindex='0']")
      .first()
      .waitFor({ timeout: 10_000 });

    // tabindex="0" のセルが1つだけ存在することを確認
    const focusableCell = calendar.locator(".fc-daygrid-day[tabindex='0']");
    await expect(focusableCell).toHaveCount(1);

    // Tab キーでフォーカスが移ることを検証
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(".fc-daygrid-day:focus");
      if ((await focused.count()) > 0) {
        await expect(focused).toHaveAttribute("tabindex", "0");
        return;
      }
    }

    expect(
      false,
      "月切り替え後、Tab キーでカレンダーセルにフォーカスが移りませんでした",
    ).toBe(true);
  });
});
