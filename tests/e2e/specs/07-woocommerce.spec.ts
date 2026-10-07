import { expectNoFatal, readState, waitModelLoaded } from '../fixtures';
import { test, expect } from '../admin-ui';
import {
    WP_3D_SETTINGS,
    adminUi,
    editUrl,
    fieldRow,
    isSwitchOn,
    openSettingsTab,
    publishClassicPost,
    setSwitch,
    switchControl,
} from '../helpers/wp-admin';
import { createProduct, deleteProduct, postMeta } from '../helpers/records';

const WOO_SWITCH = '_bp3d_settings_[3d_woo_switcher]';
const AR_SWITCH = '_bp3d_product_[bp3d_enable_ar]';

test.describe('WooCommerce integration', () => {
    test('product edit screen shows the 3D Product Settings metabox', async ({
        page,
        admin,
        state,
        adminUi: mode,
    }) => {
        test.skip(!state.wooActive, 'WooCommerce is not active on this site');

        await admin.visitAdminPage('post-new.php', 'post_type=product');
        await expectNoFatal(page);
        // The "_bp3d_product_" meta box (may render collapsed, so assert
        // attachment + its heading text rather than visibility of loose text).
        const metabox = page.locator('#_bp3d_product_');
        await expect(metabox).toBeAttached({ timeout: 30_000 });
        await expect(metabox.locator('.postbox-header, h2, h3').first()).toContainText(
            /3D (Product|Viewer) Settings/i
        );
        const ui = await adminUi(page);
        if (mode) expect(ui, 'product box interface').toBe(mode);
    });

    test('WooCommerce settings section exists in plugin settings', async ({ page, state }) => {
        test.skip(!state.wooActive, 'WooCommerce is not active on this site');

        await page.goto(WP_3D_SETTINGS);
        await openSettingsTab(page, 'woocommerce-settings');
        await expect(await fieldRow(page, WOO_SWITCH)).toBeAttached({ timeout: 15_000 });
        await expect(await switchControl(page, WOO_SWITCH)).toBeVisible();
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

/**
 * A product saved by 3D Viewer Pro has model row 0; the free box then shows Enable AR and
 * writes the toggle into that row, keeping every Pro key (hotspot text with `"` and `\`,
 * popup models, a Pro viewer position) byte for byte.
 */
test.describe('WooCommerce product box – AR on a Pro-shaped product', () => {
    let productId = 0;

    test.beforeAll(() => {
        const state = readState();
        if (state.wooActive) productId = createProduct('pro', state.glb.url, 'ar toggle');
    });

    test.afterAll(() => {
        deleteProduct(productId);
    });

    test('Enable AR applies to model row 0 and Pro keys survive', async ({ page, state, adminUi: mode }) => {
        test.skip(!state.wooActive, 'WooCommerce is not active on this site');
        expect(productId, 'fixture product created').toBeGreaterThan(0);
        const before = postMeta(productId, '_bp3d_product_');
        expect(before.bp3d_models[0].enable_ar).toBe('');

        for (const on of [true, false]) {
            await page.goto(editUrl(productId));
            const ui = await adminUi(page);
            if (mode) expect(ui, 'product box interface').toBe(mode);

            await expect(await fieldRow(page, AR_SWITCH)).toBeVisible({ timeout: 15_000 });
            expect(await isSwitchOn(page, AR_SWITCH)).toBe(!on);
            await setSwitch(page, AR_SWITCH, on);
            await publishClassicPost(page);

            const after = postMeta(productId, '_bp3d_product_');
            expect(after.bp3d_models[0].enable_ar, `AR ${on ? 'on' : 'off'} stored in row 0`).toBe(on ? '1' : '');
            expect(after.bp3d_enable_ar, 'the transport key is not stored').toBeUndefined();
            expect(after.bp3d_models[0].hotspots).toEqual(before.bp3d_models[0].hotspots);
            expect(after.bp3d_popup_models).toEqual(before.bp3d_popup_models);
            expect(after.viewer_position).toBe('tab');
        }
    });
});
