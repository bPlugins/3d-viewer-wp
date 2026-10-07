import type { Page } from '@playwright/test';
import { test, expect } from '../admin-ui';
import { WP_3D_SETTINGS, adminUi, fieldRow, openSettingsTab, saveSettings } from '../helpers/wp-admin';

/** Whether a mime type is ticked: Codestar's checkbox, or bfields' tile (role=checkbox). */
async function mimeChecked(page: Page, ext: string): Promise<boolean> {
    if ((await adminUi(page)) === 'classic') {
        return page.locator(`input[type="checkbox"][value="${ext}"]`).first().isChecked();
    }
    return (await mimeTile(page, ext).getAttribute('aria-checked')) === 'true';
}

function mimeTile(page: Page, ext: string) {
    return page
        .locator('.bfields-root[data-unique="_bp3d_settings_"] button.bfields-mime')
        .filter({ has: page.locator('strong', { hasText: new RegExp(`^${ext}$`, 'i') }) })
        .first();
}

async function setMime(page: Page, ext: string, on: boolean) {
    if ((await mimeChecked(page, ext)) === on) return;
    if ((await adminUi(page)) === 'classic') {
        const box = page.locator(`input[type="checkbox"][value="${ext}"]`).first();
        await (on ? box.check() : box.uncheck());
    } else {
        await mimeTile(page, ext).click();
    }
    expect(await mimeChecked(page, ext)).toBe(on);
}

/**
 * Toggles a mime checkbox, saves through the settings form, and verifies the value
 * survives a reload — proving the settings round-trip works end to end, in either interface.
 */
test.describe('Settings save round-trip', () => {
    test('mime type checkbox persists across save + reload', async ({ page, adminUi: mode }) => {
        await page.goto(WP_3D_SETTINGS);
        const ui = await adminUi(page);
        if (mode) expect(ui, 'Settings interface').toBe(mode);

        expect(await mimeChecked(page, 'stl')).toBe(true); // enabled by global-setup

        // Uncheck and save
        await setMime(page, 'stl', false);
        await saveSettings(page);

        await page.reload();
        expect(await mimeChecked(page, 'stl')).toBe(false);

        // Restore and save again
        await setMime(page, 'stl', true);
        await saveSettings(page);

        await page.reload();
        expect(await mimeChecked(page, 'stl')).toBe(true);
    });

    test('Gutenberg editor switch exists in Shortcode Generator settings', async ({ page }) => {
        await page.goto(WP_3D_SETTINGS);
        // gutenberg_enabled stays on the Shortcode Generator tab in both interfaces.
        await openSettingsTab(page, 'shortcode-generator');
        await expect(await fieldRow(page, '_bp3d_settings_[gutenberg_enabled]')).toBeAttached();
    });
});
