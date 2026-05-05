import { test, expect } from "@playwright/test";

test("WordPress dashboard loads", async ({ page }) => {
    await page.goto("/wp-admin/");
    await expect(page.locator("#wp-admin-bar-my-account")).toBeVisible();
    await page.getByRole('link', { name: 'Add Page' }).click();
    await page.getByRole('textbox', { name: 'Add title' }).click();
    await page.getByRole('textbox', { name: 'Add title' }).fill('heading');
    await page.getByRole('document', { name: 'Empty block; start writing or' }).fill('/headin');
    await page.getByRole('document', { name: 'Block: Heading' }).fill('Nothing to hide tao hide koro keno');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByLabel('Editor publish').getByRole('button', { name: 'Publish', exact: true }).click();
    await page.pause();
});