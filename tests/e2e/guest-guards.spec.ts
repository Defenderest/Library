import { expect, test } from "@playwright/test";

test("guest visiting cart is redirected to profile", async ({ page }) => {
  await page.goto("/cart");

  await expect(page).toHaveURL(/\/profile\?message=/);
  await expect(page.getByText("Щоб працювати з кошиком, увійдіть у профіль")).toBeVisible();
});

test("guest add-to-cart redirects to profile", async ({ page }) => {
  await page.goto("/books");

  const addButton = page.getByRole("button", { name: "Додати в кошик" }).first();
  await expect(addButton).toBeVisible();

  await addButton.click();

  await expect(page).toHaveURL(/\/profile\?message=/);
  await expect(page.getByText("Щоб додавати книги в кошик, увійдіть у профіль")).toBeVisible();
});
