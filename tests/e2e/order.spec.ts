import { test, expect } from '@playwright/test';

test.describe('WordPress Plugin E2E Flow', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Login to Playground (Default credentials)
        await page.goto('/wp-admin/');
        // await page.goto('/wp-admin/admin.php?page=playground-getting-started'); // Ensure session is live
    });

    // test("edit a page where block is inserted and check if it is rendered without error", async ({ page }) => {
    //     await page.goto('/wp-admin/post.php?post=129&action=edit');
    //     // await page.click('button[aria-label="Settings"]');
    //     await page.click('.modelViewerIsSelected');
    //     await page.goto('/3d-viewer/');

    //     await page.pause();
    // });

    test("order a product", async ({ page }) => {
        await page.goto('/product/test/');

        // Simulate "Add to Cart" and Checkout
        await page.click('button:has-text("Add to cart")');
        await page.goto('/checkout');

        // fill the form if it's first order (#billin-first_name field available)
        if (await page.locator('#billing-first_name').isVisible()) {
            await page.fill('#billing-first_name', 'John');
            await page.fill('#billing-last_name', 'Doe');
            await page.fill('#billing-address_1', '123 Main St');
            await page.fill('#billing-city', 'New York');
            await page.fill('#billing-postcode', '10001');
            await page.selectOption('#billing-state', 'NY');
        }

        await page.click('.wc-block-components-checkout-place-order-button');
        await page.pause();

        await expect(page.locator('.wc-block-order-confirmation-status')).toBeVisible();
        await page.pause();
    })

});