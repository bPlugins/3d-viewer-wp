import { test as setup, expect } from "@playwright/test";

setup("authenticate", async ({ page, context, baseURL }) => {
    const url = new URL(baseURL!);

    // WordPress checks for this cookie at login — set it for all possible domains
    await context.addCookies([
        {
            name: "wordpress_test_cookie",
            value: "WP%20Cookie%20check",
            domain: url.hostname,
            path: "/",
        },
    ]);

    // Navigate to login and fill credentials
    await page.goto("/wp-login.php");
    await page.locator("#user_login").fill("dev");
    await page.locator("#user_pass").fill("dev");
    await page.locator("#rememberme").check();

    // Submit login
    await Promise.all([
        page.waitForNavigation({ timeout: 60_000 }),
        page.locator("#wp-submit").click(),
    ]);

    // Confirm dashboard loaded
    await expect(page.locator("#wp-admin-bar-my-account")).toBeVisible({
        timeout: 30_000,
    });

    // Save session
    await page.context().storageState({ path: "playwright/.auth/user.json" });
});