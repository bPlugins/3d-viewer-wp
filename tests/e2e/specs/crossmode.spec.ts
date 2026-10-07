import type { Page } from '@playwright/test';
import { readState } from '../fixtures';
import { test, expect, adminUiOption, effectiveAdminUi, restoreAdminUiOption, writeAdminUiOption, type AdminUiMode } from '../admin-ui';
import { WP_3D_SETTINGS, adminUi, editUrl, publishClassicPost, saveSettings } from '../helpers/wp-admin';
import { captureRaw, createProduct, deleteProduct, diffRaw, restoreRaw, seedViewers, showDiff, type Diff, type Raw } from '../helpers/records';

/**
 * Cross-mode round trip: the Settings page and a seeded E2E-3DV viewer are saved untouched in
 * Modern, then Classic, then Modern, and the raw option/meta bytes are diffed after every save.
 * A Modern save must leave the bytes exactly as it found them; a Classic save may differ only by
 * the Codestar form shapes raw-records.php names (`bp3d_raw_rule`). The second suite does the
 * same for E2E-3DV products in the free shape and with 3D Viewer Pro keys.
 *
 * This spec overwrites `_bp3d_settings_` (its captured bytes are written back at the end) and
 * flips `bp3d_admin_ui` (put back, never deleted). It only runs with E2E_CROSSMODE=1.
 */

const SETTINGS = { options: ['_bp3d_settings_'] };

test.skip(process.env.E2E_CROSSMODE !== '1', 'Overwrites _bp3d_settings_ and bp3d_admin_ui: run with E2E_CROSSMODE=1 (see README)');

async function saveSettingsUntouched(page: Page, mode: AdminUiMode) {
    await page.goto(WP_3D_SETTINGS);
    expect(await adminUi(page), 'Settings screen interface').toBe(mode);
    await page.waitForTimeout(800);
    await saveSettings(page);
}

async function saveEditorUntouched(page: Page, id: number, mode: AdminUiMode, label: string) {
    await page.goto(editUrl(id));
    expect(await adminUi(page), `${label} screen interface`).toBe(mode);
    await page.waitForTimeout(800);
    await publishClassicPost(page);
    await expect(page.locator('#message.updated, #message.notice-success').first()).toBeAttached({ timeout: 30_000 });
}

function report(testInfo: { attach: (name: string, o: { body: string; contentType: string }) => Promise<void> }, name: string, diffs: Record<string, Diff[]>) {
    for (const [key, list] of Object.entries(diffs)) {
        console.log(`[crossmode] ${key}: ${list.length === 0 ? 'identical' : `${list.length} difference(s)`}`);
        for (const d of list) console.log(`    ${showDiff(d)}`);
    }
    return testInfo.attach(name, { body: JSON.stringify(diffs, null, 2), contentType: 'application/json' });
}

test.describe('Cross-mode round trip – Settings and a viewer', () => {
    let uiAtStart: string | null = null;
    let resolvedAtStart = '';
    let start: Raw | null = null;
    let viewerId = 0;

    test.beforeAll(() => {
        uiAtStart = adminUiOption();
        if (uiAtStart === null) resolvedAtStart = effectiveAdminUi();
        start = captureRaw(SETTINGS);
        [viewerId] = seedViewers(1, 'crossmode viewer', readState().glb.url);
    });

    test.afterAll(() => {
        if (start?.settings) expect(restoreRaw(SETTINGS, start), 'captured settings bytes written back').toBe(true);
        const note = restoreAdminUiOption(uiAtStart, resolvedAtStart);
        if (note) console.warn(`[crossmode] ${note}`);
    });

    test('Modern → Classic → Modern saves of Settings and the seeded viewer', async ({ page }, testInfo) => {
        expect(start?.settings, '_bp3d_settings_ exists').toBeTruthy();
        const target = { viewer: viewerId, ...SETTINGS };
        const diffs: Record<string, Diff[]> = {};
        let prev = captureRaw(target);
        expect(prev.rows, `viewer ${viewerId} has exactly one _bp3dimages_ row`).toBe(1);

        // The seed is written raw, so the first save is the Classic one a 1.9.x site last made:
        // it may add the keys of fields the seed leaves out, never drop or change a stored value.
        await test.step('0. Classic seed save of the viewer', async () => {
            writeAdminUiOption('classic');
            await page.waitForTimeout(1_100); // post_modified has one-second resolution
            await saveEditorUntouched(page, viewerId, 'classic', 'viewer');
            const now = captureRaw(target);
            const list = (diffs['0-classic-seed viewer'] = diffRaw(prev.viewer!, now.viewer!));
            const lost = list.filter((d) => d.kind !== 'added' && !d.rule);
            expect.soft(lost, `0-classic-seed: no stored value lost or changed\n    ${lost.map(showDiff).join('\n    ')}`).toEqual([]);
            prev = now;
        });

        for (const [mode, label] of [['modern', '1-modern'], ['classic', '2-classic'], ['modern', '3-modern']] as const) {
            await test.step(`${label} saves`, async () => {
                writeAdminUiOption(mode);
                await saveSettingsUntouched(page, mode);
                await page.waitForTimeout(1_100);
                await saveEditorUntouched(page, viewerId, mode, 'viewer');
                const now = captureRaw(target);
                expect(now.modified, `${label}: the viewer update was saved`).not.toBe(prev.modified);

                for (const record of ['settings', 'viewer'] as const) {
                    const list = (diffs[`${label} ${record}`] = diffRaw(prev[record]!, now[record]!));
                    if (mode === 'modern') {
                        expect.soft(now[record], `${label}: ${record} bytes identical\n    ${list.map(showDiff).join('\n    ')}`).toBe(prev[record]);
                    } else {
                        const unsanctioned = list.filter((d) => !d.rule);
                        expect.soft(unsanctioned, `${label}: ${record} differs only by Codestar form shapes\n    ${unsanctioned.map(showDiff).join('\n    ')}`).toEqual([]);
                    }
                }
                prev = now;
            });
        }

        await report(testInfo, 'crossmode-diffs.json', diffs);
    });
});

test.describe('Cross-mode round trip – products', () => {
    let uiAtStart: string | null = null;
    let resolvedAtStart = '';
    const products: Array<{ shape: 'free' | 'pro'; id: number }> = [];

    test.beforeAll(() => {
        uiAtStart = adminUiOption();
        if (uiAtStart === null) resolvedAtStart = effectiveAdminUi();
        const state = readState();
        if (state.wooActive) {
            for (const shape of ['free', 'pro'] as const) products.push({ shape, id: createProduct(shape, state.glb.url, `crossmode ${shape}`) });
        }
    });

    test.afterAll(() => {
        for (const p of products) deleteProduct(p.id);
        const note = restoreAdminUiOption(uiAtStart, resolvedAtStart);
        if (note) console.warn(`[crossmode] ${note}`);
    });

    test('Classic seed, then Modern → Classic → Modern saves of each product', async ({ page, state }, testInfo) => {
        test.skip(!state.wooActive, 'WooCommerce is not active');
        const diffs: Record<string, Diff[]> = {};

        for (const { shape, id } of products) {
            expect(id, `${shape} fixture product created`).toBeGreaterThan(0);
            let prev = captureRaw({ product: id });
            expect(prev.product_rows, `product ${id} has exactly one _bp3d_product_ row`).toBe(1);

            const save = async (mode: AdminUiMode, label: string) => {
                writeAdminUiOption(mode);
                await page.waitForTimeout(1_100);
                await saveEditorUntouched(page, id, mode, 'product');
                const now = captureRaw({ product: id });
                expect(now.product_modified, `${label}: the product update was saved`).not.toBe(prev.product_modified);
                expect(now.product_rows, `${label}: still one _bp3d_product_ row`).toBe(1);
                const list = (diffs[`${shape} ${label}`] = diffRaw(prev.product!, now.product!));
                return { now, list };
            };

            await test.step(`${shape}: 0. Classic seed save`, async () => {
                const { now, list } = await save('classic', '0-classic-seed');
                const lost = list.filter((d) => d.kind !== 'added' && !d.rule);
                expect.soft(lost, `${shape} 0-classic-seed: no stored value lost or changed\n    ${lost.map(showDiff).join('\n    ')}`).toEqual([]);
                prev = now;
            });

            for (const [mode, label] of [['modern', '1-modern'], ['classic', '2-classic'], ['modern', '3-modern']] as const) {
                await test.step(`${shape}: ${label} save`, async () => {
                    const { now, list } = await save(mode, label);
                    expect.soft(now.product, `${shape} ${label}: _bp3d_product_ bytes identical\n    ${list.map(showDiff).join('\n    ')}`).toBe(prev.product);
                    prev = now;
                });
            }
        }

        await report(testInfo, 'crossmode-product-diffs.json', diffs);
    });
});
