import { test, expect, expectNoFatal } from '../fixtures';

/**
 * The bp-extension-manager library boots with slug "3d-viewer" and the
 * catalog from public/extensions.php (new in 1.9.0).
 */
test.describe('Extensions manager', () => {
    test('Extensions submenu is registered under the 3D Viewer menu', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', 'post_type=bp3d-model-viewer');
        await expect(
            page.locator('#adminmenu a[href*="bpem-3d-viewer-extensions"]').first()
        ).toBeAttached();
    });

    test('Extensions app mounts and lists the catalog', async ({ page, admin }) => {
        await admin.visitAdminPage(
            'edit.php',
            'post_type=bp3d-model-viewer&page=bpem-3d-viewer-extensions'
        );
        await expectNoFatal(page);

        const mount = page.locator('#bpem-3d-viewer-extensions');
        await expect(mount).toBeAttached();
        await expect
            .poll(async () => mount.evaluate((el) => el.children.length).catch(() => 0), {
                timeout: 20_000,
                message: 'extensions React app should render',
            })
            .toBeGreaterThan(0);

        // The catalog (public/extensions.php) ships the WC extension card
        await expect(page.getByText('WC 3D Model Viewer').first()).toBeVisible({
            timeout: 20_000,
        });
    });
});
