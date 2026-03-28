import { expect, test } from "@playwright/test";

test("home page renders primary navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Library/i);
  await expect(page.getByRole("link", { name: "Колекція" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Автори" })).toBeVisible();
});
