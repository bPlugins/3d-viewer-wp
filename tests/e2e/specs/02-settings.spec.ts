import { test, expect } from '../fixtures';

const SETTINGS_QUERY = 'post_type=bp3d-model-viewer&page=3dviewer-settings';

/**
 * Toggles a mime checkbox, saves through the CSF form, and verifies the value
 * survives a reload — proving the settings round-trip works end to end.
 */
test.describe('Settings save round-trip', () => {
    test('mime type checkbox persists across save + reload', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', SETTINGS_QUERY);

        const stl = page.locator('input[type="checkbox"][value="stl"]').first();
        await expect(stl).toBeChecked(); // enabled by global-setup

        // Uncheck and save
        await stl.uncheck();
        await page.locator('.csf-save').first().click();
        // CSF saves via ajax; wait for the button to settle
        await page.waitForTimeout(2500);

        await page.reload();
        await expect(
            page.locator('input[type="checkbox"][value="stl"]').first()
        ).not.toBeChecked();

        // Restore and save again
        const stl2 = page.locator('input[type="checkbox"][value="stl"]').first();
        await stl2.check();
        await page.locator('.csf-save').first().click();
        await page.waitForTimeout(2500);

        await page.reload();
        await expect(
            page.locator('input[type="checkbox"][value="stl"]').first()
        ).toBeChecked();
    });

    test('Gutenberg editor switch exists in Shortcode Generator settings', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', SETTINGS_QUERY);
        // gutenberg_enabled switcher field rendered by CSF
        const field = page.locator(
            '[data-depend-id="gutenberg_enabled"], input[name*="gutenberg_enabled"]'
        );
        await expect(field.first()).toBeAttached();
    });
});
