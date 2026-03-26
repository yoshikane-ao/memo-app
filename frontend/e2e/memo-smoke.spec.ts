import { expect, test } from "@playwright/test";

test("creates, trashes, and undoes a memo through the menu flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(10, 10, 11)");
  await expect(page.locator('[data-menu-app-id="memo"]')).toBeVisible();
  await page.locator('[data-menu-app-id="memo"]').click();

  await expect(page.locator(".sortable-list .sortable-item")).toHaveCount(1);
  await expect(page.locator("#title-1")).toHaveValue("Seed memo");
  await expect(page.locator("#content-1")).toHaveValue("Existing memo from the browser smoke test.");

  await page.locator("#memo-compose-title").fill("Browser memo");
  await page.locator("#memo-compose-content").fill("Created from Playwright.");
  await page.locator("#memo-compose-submit").click();

  await expect(page.locator(".sortable-list .sortable-item")).toHaveCount(2);
  await expect(page.locator("#title-2")).toHaveValue("Browser memo");
  await expect(page.locator("#content-2")).toHaveValue("Created from Playwright.");
  await expect(page.locator("#memo-compose-title")).toHaveValue("");
  await expect(page.locator("#memo-compose-content")).toHaveValue("");

  await page.reload();

  await expect(page.locator(".sortable-list .sortable-item")).toHaveCount(2);
  await expect(page.locator("#title-2")).toHaveValue("Browser memo");

  await page.locator('[data-memo-scope="trash"]').click();
  await expect(page).toHaveURL(/\/menu\/workspace\/memo\/trash$/);

  await page.keyboard.press("Control+KeyZ");
  await expect(page).toHaveURL(/\/menu\/workspace\/memo$/);
  await expect(page.locator(".sortable-list .sortable-item")).toHaveCount(2);

  page.once("dialog", (dialog) => dialog.accept());
  await page.locator(".delete-btn").last().click();

  await expect(page).toHaveURL(/\/menu\/workspace\/memo\/trash$/);
  await expect(page.locator(".memo-row-readonly")).toHaveCount(1);
  await expect(page.locator(".memo-row-readonly")).toContainText("Browser memo");

  await page.keyboard.press("Control+KeyZ");
  await expect(page).toHaveURL(/\/menu\/workspace\/memo$/);
  await expect(page.locator(".sortable-list .sortable-item")).toHaveCount(2);
  await expect(page.locator("#title-2")).toHaveValue("Browser memo");
});
