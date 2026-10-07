import { expectNoFatal } from '../fixtures';
import { test, expect } from '../admin-ui';
import { adminUi, getFieldValue } from '../helpers/wp-admin';

test.describe('Admin surfaces', () => {
    test('3D Viewer CPT list shows models and shortcode column', async ({ page, admin, state }) => {
        await admin.visitAdminPage('edit.php', 'post_type=bp3d-model-viewer');
        await expectNoFatal(page);

        // ShortCode column with a copyable [3d_viewer id=N] for the seeded model
        await expect(page.locator('#shortcode, th:has-text("ShortCode")').first()).toBeVisible();
        const input = page.locator(`input[value="[3d_viewer id=${state.models.block.id}]"]`);
        await expect(input).toHaveCount(1);
        await expect(page.locator('.bp3d_shortcode_copy_icon').first()).toBeVisible();
    });

    test('settings page renders the form with mime checkboxes', async ({ page, admin, adminUi: mode }) => {
        await admin.visitAdminPage('edit.php', 'post_type=bp3d-model-viewer&page=3dviewer-settings');
        await expectNoFatal(page);

        const ui = await adminUi(page);
        if (mode) expect(ui, 'Settings interface').toBe(mode);
        // glb mime type enabled (precondition for uploads, set in global-setup)
        if (ui === 'classic') {
            await expect(page.locator('.csf-save').first()).toBeVisible();
            await expect(page.locator('input[type="checkbox"][value="glb"]').first()).toBeChecked();
        } else {
            await expect(page.locator('.bfields-root[data-unique="_bp3d_settings_"] .bfields-btn--save').first()).toBeAttached();
            expect(await getFieldValue(page, '_bp3d_settings_[allowed_mime_types]')).toContain('glb');
        }
    });

    test('Help & Demos dashboard app mounts and navigates', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', 'post_type=bp3d-model-viewer&page=3d-viewer');
        await expectNoFatal(page);

        const mount = page.locator('#bp3dAdminDashboard');
        await expect(mount).toBeAttached();
        await expect
            .poll(async () => mount.evaluate((el) => el.children.length).catch(() => 0), {
                timeout: 20_000,
                message: 'dashboard React app should render',
            })
            .toBeGreaterThan(0);

        // The app is a HashRouter SPA — nav links switch routes client-side.
        const redesigned = page.locator('.bp3d-dash-nav');
        if (await redesigned.isVisible({ timeout: 5_000 }).catch(() => false)) {
            const demos = page.locator('.bp3d-dash-tab', { hasText: 'Demos' }).first();
            await demos.click();
            await expect(demos).toHaveClass(/bp3d-dash-tab--current/);
            expect(page.url()).toContain('#/demos');
            return;
        }

        // Pre-redesign dashboard: links live behind the header hamburger.
        await expect(page.locator('.bPlDashboard')).toBeVisible();
        await page.locator('.bplHamburger').click();
        const demosLink = page.locator('.bPlDashboardNav .navLink', { hasText: 'Demos' }).first();
        await expect(demosLink).toBeVisible();
        await demosLink.click();
        await expect(demosLink).toHaveClass(/active/);
        expect(page.url()).toContain('#/demos');
        await expect(page.locator('.bPlDashboardMain')).toBeVisible();
    });
});
