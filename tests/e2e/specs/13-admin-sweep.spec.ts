import type { Locator, Page } from '@playwright/test';
import { readState } from '../fixtures';
import { test, expect } from '../admin-ui';
import {
    WC_PRODUCT_NEW,
    WP_3D_DASHBOARD,
    WP_3D_DOKAN,
    WP_3D_MODEL_NEW,
    WP_3D_MODELS_LIST,
    WP_3D_SETTINGS,
    adminUi as screenUi,
    captureConsoleErrors,
    editUrl,
    getFieldValue,
    pluginConsoleErrors,
    useGutenbergDisabled,
} from '../helpers/wp-admin';
import { createProduct, deleteProduct, seedViewers } from '../helpers/records';
import { wp } from '../wp';

/**
 * Every 3D Viewer admin screen, opened in the project's interface: no uncaught exception, no
 * console error from our code, no 4xx/5xx for a plugin or bfields file, and no PHP notice from
 * our files in the page. Every framework tab is clicked once.
 *
 * Seeds an E2E-3DV viewer (free classic shape) and, with Woo, an E2E-3DV product (Pro keys).
 */

// PHP's html_errors format, limited to notices raised in our files.
const OUR_PHP_NOTICE = /<b>(?:Fatal error|Parse error|Warning|Notice|Deprecated)<\/b>:(?:(?!<br)[\s\S]){0,600}?\/wp-content\/plugins\/(?:3d-viewer[\w-]*|bfields)\//i;

async function settle(page: Page) {
    // Heartbeat or a model download can keep the network busy; idle is a best effort.
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(500);
}

async function open(page: Page, url: string, label: string) {
    const response = await page.goto(url, { waitUntil: 'load' });
    expect(response?.status() ?? 0, `${label}: HTTP status`).toBeLessThan(400);
    await expect(page.locator('#wpadminbar'), `${label}: an admin screen, not an error page`).toBeVisible({ timeout: 30_000 });
    await settle(page);
}

async function expectClean(page: Page, errors: string[], label: string) {
    expect.soft(pluginConsoleErrors(errors), `${label}: page errors from our code`).toEqual([]);
    const notice = (await page.content()).match(OUR_PHP_NOTICE);
    expect.soft(notice?.[0] ?? null, `${label}: PHP notice from our files`).toBeNull();
}

/** Click every visible tab in turn, checking the page after each one. */
async function sweepTabs(page: Page, tabs: Locator, errors: string[], label: string) {
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        if (!(await tab.isVisible())) continue;
        const name = (await tab.innerText()).trim().replace(/\s+/g, ' ');
        await tab.click();
        await page.waitForTimeout(500);
        expect.soft(pluginConsoleErrors(errors), `${label} › ${name}: page errors from our code`).toEqual([]);
    }
    return count;
}

/** The section tabs of one of our framework boxes, in whichever interface is showing. */
function frameworkTabs(page: Page, unique: string, ui: 'classic' | 'modern', optionsPage = false): Locator {
    if (ui === 'modern') return page.locator(`.bfields-root[data-unique="${unique}"] .bfields-tab`);
    return optionsPage ? page.locator('.csf-nav a[href^="#tab="]') : page.locator(`[id="${unique}"] .csf-nav a`);
}

test.describe('Admin screen sweep', () => {
    useGutenbergDisabled();

    let viewerId = 0;
    let productId = 0;

    test.beforeAll(() => {
        const state = readState();
        [viewerId] = seedViewers(1, 'sweep', state.glb.url);
        if (state.wooActive) productId = createProduct('pro', state.glb.url, 'sweep');
    });

    test.afterAll(() => {
        // The viewer is left for global-setup's E2E-3DV cleanup; the product is removed now.
        deleteProduct(productId);
    });

    test('3D Viewer list', async ({ page }) => {
        const errors = captureConsoleErrors(page);
        await open(page, WP_3D_MODELS_LIST, 'List');
        await expect(page.locator(`#post-${viewerId}`)).toBeVisible();
        await expectClean(page, errors, 'List');
    });

    test('Add New viewer', async ({ page, adminUi: mode }) => {
        const errors = captureConsoleErrors(page);
        await open(page, WP_3D_MODEL_NEW, 'Add New');
        const ui = await screenUi(page);
        if (mode) expect(ui, 'Add New interface').toBe(mode);
        await sweepTabs(page, frameworkTabs(page, '_bp3dimages_', ui), errors, 'Add New');
        await expectClean(page, errors, 'Add New');
    });

    test('Edit an existing viewer', async ({ page, state, adminUi: mode }) => {
        const errors = captureConsoleErrors(page);
        await open(page, editUrl(viewerId), 'Edit viewer');
        const ui = await screenUi(page);
        if (mode) expect(ui, 'Edit viewer interface').toBe(mode);
        const src = await getFieldValue(page, ui === 'modern' ? '_bp3dimages_[bp_3d_src]' : '_bp3dimages_[bp_3d_src][url]');
        expect(typeof src === 'object' ? src?.url : src, 'Edit viewer: the stored model').toBe(state.glb.url);
        await sweepTabs(page, frameworkTabs(page, '_bp3dimages_', ui), errors, 'Edit viewer');
        await expectClean(page, errors, 'Edit viewer');
    });

    test('Settings, every tab', async ({ page, adminUi: mode }) => {
        const errors = captureConsoleErrors(page);
        await open(page, WP_3D_SETTINGS, 'Settings');
        const ui = await screenUi(page);
        if (mode) expect(ui, 'Settings interface').toBe(mode);
        const count = await sweepTabs(page, frameworkTabs(page, '_bp3d_settings_', ui, true), errors, 'Settings');
        expect(count, 'Settings has tabs').toBeGreaterThan(1);
        await expectClean(page, errors, 'Settings');
    });

    test('Help & Demos', async ({ page }) => {
        const errors = captureConsoleErrors(page);
        await open(page, WP_3D_DASHBOARD, 'Help & Demos');
        await expect(page.locator('#bp3dAdminDashboard')).toBeAttached();
        // The redesigned dashboard has hash tabs; sweep them when present.
        const tabs = page.locator('a.bp3d-dash-tab[href^="#"]');
        const hrefs = await tabs.evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''));
        for (const href of hrefs) {
            await page.locator(`a.bp3d-dash-tab[href="${href}"]`).click();
            await settle(page);
            expect.soft(pluginConsoleErrors(errors), `Help & Demos ${href}: page errors from our code`).toEqual([]);
        }
        await expectClean(page, errors, 'Help & Demos');
    });

    test('Marketplace (Dokan)', async ({ page, adminUi: mode }) => {
        test.skip(wp(['plugin', 'is-active', 'dokan-lite'], { allowFail: true, retries: 0 }) === null, 'Dokan is not active');
        const errors = captureConsoleErrors(page);
        await open(page, WP_3D_DOKAN, 'Dokan');
        const ui = await screenUi(page);
        if (mode) expect(ui, 'Dokan screen interface').toBe(mode);
        await expectClean(page, errors, 'Dokan');
    });

    test('Add New product', async ({ page, state, adminUi: mode }) => {
        test.skip(!state.wooActive, 'WooCommerce is not active');
        const errors = captureConsoleErrors(page);
        await open(page, WC_PRODUCT_NEW, 'Add New product');
        const ui = await screenUi(page);
        if (mode) expect(ui, 'Add New product interface').toBe(mode);
        await expectClean(page, errors, 'Add New product');
    });

    test('Edit a product with Pro keys', async ({ page, adminUi: mode }) => {
        test.skip(!productId, 'WooCommerce is not active');
        const errors = captureConsoleErrors(page);
        await open(page, editUrl(productId), 'Edit product');
        const ui = await screenUi(page);
        if (mode) expect(ui, 'Edit product interface').toBe(mode);
        await expectClean(page, errors, 'Edit product');
    });
});
