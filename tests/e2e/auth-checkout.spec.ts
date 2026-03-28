import { expect, test } from "@playwright/test";

const isExternalBaseUrlRun = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());

test.skip(isExternalBaseUrlRun, "Mutating auth/checkout scenario is local-only.");

test("registers, places a cash order, and logs out", async ({ page }) => {
  const id = Date.now();
  const email = `e2e.user.${id}@example.com`;

  await page.goto("/profile");

  await page.getByRole("button", { name: "Увійти в акаунт" }).click();
  await page.getByRole("button", { name: "Реєстрація" }).click();

  await page.getByPlaceholder("Ім'я").fill("Тест");
  await page.getByPlaceholder("Прізвище").fill("Користувач");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Телефон (+380XXXXXXXXX)").fill("+380671234567");
  await page.getByPlaceholder("Пароль").fill("Testpass123");
  await page.getByPlaceholder("Підтвердіть пароль").fill("Testpass123");

  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("button", { name: "Вийти з акаунта" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/books");

  const addButtons = page.getByRole("button", { name: "Додати в кошик" });
  const addButtonCount = await addButtons.count();
  expect(addButtonCount).toBeGreaterThan(0);

  let added = false;
  for (let index = 0; index < Math.min(addButtonCount, 6); index += 1) {
    const button = addButtons.nth(index);

    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/cart/items") && response.request().method() === "POST",
        { timeout: 10_000 },
      )
      .catch(() => null);

    await button.click();
    const response = await responsePromise;

    if (response?.status() === 200) {
      added = true;
      break;
    }
  }

  expect(added).toBe(true);

  await page.goto("/cart");
  await expect(page).toHaveURL(/\/cart$/);

  const openCheckoutButton = page.getByRole("button", { name: "Оформити замовлення" });
  await expect(openCheckoutButton).toBeVisible({ timeout: 15_000 });
  await openCheckoutButton.click();

  await page.getByPlaceholder("Наприклад: Київ").fill("Київ");
  await page.getByPlaceholder("Наприклад: Хрещатик").fill("Хрещатик");
  await page.getByPlaceholder("Наприклад: 12Б").fill("12Б");

  await page.getByRole("button", { name: "Підтвердити замовлення" }).click();

  await expect(page.getByText(/Замовлення #\d+ успішно оформлено/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Кошик порожній")).toBeVisible({ timeout: 20_000 });

  await page.goto("/profile");
  await page.getByRole("button", { name: "Вийти з акаунта" }).click();
  await expect(page.getByRole("heading", { name: "Увійдіть у профіль" })).toBeVisible();
});
