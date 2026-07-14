import { test, expect, expectNoFatal, waitModelLoaded } from '../fixtures';

test.describe('WooCommerce integration', () => {
    test('product edit screen shows the 3D Product Settings metabox', async ({
        page,
        admin,
        state,
    }) => {
        test.skip(!state.wooActive, 'WooCommerce is not active on this site');

        await admin.visitAdminPage('post-new.php', 'post_type=product');
        await expectNoFatal(page);
        // CSF metabox with id "_bp3d_product_" (may render collapsed, so assert
        // attachment + its heading text rather than visibility of loose text).
        const metabox = page.locator('#_bp3d_product_');
        await expect(metabox).toBeAttached({ timeout: 30_000 });
        await expect(metabox.locator('.postbox-header, h2, h3').first()).toContainText(
            /3D (Product|Viewer) Settings/i
        );
    });

    test('WooCommerce settings section exists in plugin settings', async ({
        page,
        admin,
        state,
    }) => {
        test.skip(!state.wooActive, 'WooCommerce is not active on this site');

        await admin.visitAdminPage('edit.php', 'post_type=bp3d-model-viewer&page=3dviewer-settings');
        // 3d_woo_switcher field from the WooCommerce settings section
        await expect(
            page.locator('[data-depend-id="3d_woo_switcher"], input[name*="3d_woo_switcher"]').first()
        ).toBeAttached();
    });

    test('single product page renders the 3D model above the gallery', async ({
        page,
        state,
        pageErrors,
    }) => {
        test.skip(!state.wooActive || !state.product, 'WooCommerce is not active on this site');

        await page.goto(state.product!.link);
        await expectNoFatal(page);

        // Seeded with viewer_position=top on a compatible theme: the plugin
        // replaces the gallery wrapper and mounts the viewer inside it.
        const wrap = page.locator('.product-modal-wrap').first();
        await expect(wrap).toBeAttached();
        await expect(wrap).toHaveClass(/position_top/);

        const mv = await waitModelLoaded(page, '.product-modal-wrap');
        expect(await mv.evaluate((el: any) => el.src)).toBe(state.glb.url);
        expect(pageErrors).toHaveLength(0);
    });
});
