import path from 'path';
import { readState } from '../fixtures';
import { test, expect, writeAdminUiOption, type AdminUiMode } from '../admin-ui';
import { WP_3D_SETTINGS, adminUi, clickPublish, editUrl, isPageFrame, openSettingsTab } from '../helpers/wp-admin';
import { seedViewers } from '../helpers/records';
import { wpEvalFile } from '../wp';

/**
 * The New/Classic switch (Base\AdminUi): the row at the top of Settings › General, the line in
 * the editor's Publish box, the one-time notice, and the notice for a save the switch dropped.
 *
 * Switching writes only `bp3d_admin_ui`; the project's pin puts it back. The "nobody chose yet"
 * notice is rendered through helpers/admin-ui-notice.php, which reads the option as unset
 * without deleting it.
 */

const LABEL: Record<AdminUiMode, string> = { modern: 'New', classic: 'Classic' };
const other = (mode: AdminUiMode): AdminUiMode => (mode === 'modern' ? 'classic' : 'modern');

function renderNotice(screen: string, nodata = false): { html: string; ready: boolean; siteMode: string } {
    const args: Record<string, string> = { user: process.env.WP_USERNAME || 'admin', screen };
    if (nodata) args.nodata = '1';
    return JSON.parse(wpEvalFile(path.join(__dirname, '..', 'helpers', 'admin-ui-notice.php'), args) || '{}');
}

test.describe('Admin interface switch', () => {
    test('Settings › General opens with the switch row, and it switches both ways', async ({ page, adminUi: mode }) => {
        test.skip(!mode, 'Needs a pinned interface');
        await page.goto(WP_3D_SETTINGS);
        expect(await adminUi(page)).toBe(mode);
        await openSettingsTab(page, 'general-settings');

        const row = page.locator('.bp3d-admin-ui-switch').locator('visible=true').first();
        await expect(row).toBeVisible();
        await expect(row.locator('.bp3d-admin-ui-switch__opt.is-current')).toHaveText(LABEL[mode!]);

        const to = other(mode!);
        const link = row.locator('a.bp3d-admin-ui-switch__opt', { hasText: LABEL[to] });
        await expect(link).toHaveAttribute('href', new RegExp(`action=bp3d_switch_admin_ui.*ui=${to}|ui=${to}.*action=bp3d_switch_admin_ui`));

        try {
            await link.click();
            await page.waitForURL(new RegExp(`bp3d_admin_ui_switched=${to}`));
            expect(await adminUi(page), 'the Settings screen redraws in the other interface').toBe(to);

            await openSettingsTab(page, 'general-settings');
            const back = page.locator('.bp3d-admin-ui-switch').locator('visible=true').first().locator('a.bp3d-admin-ui-switch__opt', { hasText: LABEL[mode!] });
            await back.click();
            await page.waitForURL(new RegExp(`bp3d_admin_ui_switched=${mode}`));
            expect(await adminUi(page)).toBe(mode);
        } finally {
            writeAdminUiOption(mode!);
        }
    });

    test('the viewer editor shows the interface line in its Publish box', async ({ page, adminUi: mode }) => {
        test.skip(!mode, 'Needs a pinned interface');
        const [id] = seedViewers(1, 'switch line', readState().glb.url);
        await page.goto(editUrl(id));
        expect(await adminUi(page)).toBe(mode);

        const line = page.locator('#submitdiv .bp3d-admin-ui-row');
        await expect(line).toBeAttached();
        await expect(line).toContainText(LABEL[mode!]);
        await expect(line.locator('a.bp3d-admin-ui-link')).toHaveAttribute('href', new RegExp(`ui=${other(mode!)}`));

        if (mode === 'modern') {
            // The page frame hides #submitdiv; the preview script clones the line into the side card.
            await expect(page.locator('.bp3d-admin-ui-row--side')).toBeAttached({ timeout: 30_000 });
        } else {
            await expect(line).toBeVisible();
        }
    });

    test('the one-time notice shows only while nobody has chosen, on screens with earlier data', async ({ page }) => {
        // The option is pinned, so the real screens never show it.
        await page.goto('/wp-admin/edit.php?post_type=bp3d-model-viewer');
        await expect(page.locator('.bp3d-admin-ui-notice')).toHaveCount(0);

        const list = renderNotice('edit-bp3d-model-viewer');
        test.skip(!list.ready, 'bfields did not load in wp-cli, so the notice never shows');
        expect(list.siteMode, 'an unset option resolves to the default').toBe('modern');
        expect(list.html).toContain('bp3d-admin-ui-notice');
        expect(list.html).toContain('ui=modern');
        expect(list.html).toContain('ui=classic');

        expect(renderNotice('bp3d-model-viewer_page_3dviewer-settings').html, 'Settings carries the switch row instead').toBe('');
        expect(renderNotice('edit-bp3d-model-viewer', true).html, 'a fresh install has nothing to go back to').toBe('');
    });

    test('a form opened before a switch reports that its save was dropped', async ({ page, adminUi: mode }) => {
        test.skip(!mode, 'Needs a pinned interface');
        // A draft, so a Modern Update does not save in place.
        const [id] = seedViewers(1, 'dropped save', readState().glb.url, 'draft');
        await page.goto(editUrl(id));
        expect(await adminUi(page)).toBe(mode);

        try {
            writeAdminUiOption(other(mode!));
            const navigated = page.waitForEvent('framenavigated', { predicate: (f) => f === page.mainFrame(), timeout: 45_000 });
            await clickPublish(page);
            await navigated;
            await page.waitForURL(/[?&]post=\d+/, { waitUntil: 'domcontentloaded' });

            // In the page frame bfields restyles notices into one-line bars, so match the text.
            await expect(page.getByText(/were not saved: the admin interface was switched/).first()).toBeVisible();
            expect(await isPageFrame(page)).toBe(other(mode!) === 'modern');
        } finally {
            writeAdminUiOption(mode!);
        }
    });
});
