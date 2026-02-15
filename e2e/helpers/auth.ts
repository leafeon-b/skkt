import { type Page, expect } from "@playwright/test";

export async function login(
  page: Page,
  email = "sota@example.com",
  password = "demo-pass-1",
) {
  await page.goto("/");
  await page.getByPlaceholder("demo1@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "メールでログイン" }).click();
  await expect(page).toHaveURL(/\/home/);
}
