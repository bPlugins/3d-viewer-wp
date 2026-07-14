import { test, expect, expectNoFatal } from '../fixtures';

test.describe('Sanity', () => {
    test('front page loads without fatal errors', async ({ page }) => {
        const response = await page.goto('/');
        expect(response!.status()).toBeLessThan(400);
        await expectNoFatal(page);
    });

    test('logged in as admin, wp-admin reachable', async ({ page }) => {
        await page.goto('/wp-admin/index.php');
        await expect(page.locator('#wpadminbar')).toBeVisible();
        await expectNoFatal(page);
    });

    test('the free 3D Viewer plugin is active', async ({ page, admin }) => {
        await admin.visitAdminPage('plugins.php');
        await expect(
            page.locator('tr.active[data-plugin="3d-viewer/3d-viewer.php"]')
        ).toHaveCount(1);
    });
});
