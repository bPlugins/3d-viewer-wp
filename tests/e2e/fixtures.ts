/**
 * Shared test fixtures/helpers for the 3D Viewer e2e suite.
 */
import fs from 'fs';
import path from 'path';
import { test as baseTest, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

const STATE_PATH = path.join(__dirname, 'artifacts', 'state.json');

export type SeededState = {
    wooActive: boolean;
    elementorActive: boolean;
    baseURL: string;
    glb: { id: number; url: string };
    models: { block: { id: number }; classic: { id: number } };
    pages: Record<string, { id: number; link: string }>;
    product: { id: number; link: string } | null;
    wooPages: { shop: string; checkout: string } | null;
    elementorPage: { id: number; link: string } | null;
};

export function readState(): SeededState {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

type CustomFixtures = {
    /** Seeded content created in global-setup (ids, links, plugin flags). */
    state: SeededState;
    /** Collects uncaught JS exceptions on the page for later assertions. */
    pageErrors: Error[];
};

/**
 * True when an uncaught error is attributable to another plugin's or the
 * theme's scripts. The Studio site runs a full theme + plugin stack (Astra,
 * Spectra, WooCommerce, …) whose own JS errors are not this plugin's
 * regressions. Errors with no wp-content source in the stack (inline
 * scripts, hydration) are kept.
 */
function isThirdPartyError(error: Error): boolean {
    const sources = [...(error.stack || '').matchAll(/wp-content\/(?:plugins|themes)\/([^/]+)\//g)]
        .map((m) => m[1]);
    return sources.length > 0 && !sources.some((slug) => slug.startsWith('3d-viewer'));
}

export const test = baseTest.extend<CustomFixtures>({
    state: async ({}, use) => {
        await use(readState());
    },
    pageErrors: async ({ page }, use) => {
        const errors: Error[] = [];
        page.on('pageerror', (error) => {
            if (!isThirdPartyError(error)) errors.push(error);
        });
        await use(errors);
    },
});

export { expect };

/** The page must not show a PHP fatal / WP critical error. */
export async function expectNoFatal(page: Page) {
    const body = (await page.locator('body').innerText().catch(() => '')) || '';
    expect(body).not.toMatch(/Fatal error|There has been a critical error/i);
}

/**
 * Opens the editor settings sidebar. editor.openDocumentSettingsSidebar()
 * matches the top-bar "Settings" button by substring, which collides with the
 * "Astra Settings" / "Spectra Block Settings" buttons the site's theme stack
 * adds — so match the accessible name exactly.
 */
export async function openSettingsSidebar(page: Page) {
    const toggle = page
        .getByRole('region', { name: 'Editor top bar' })
        .getByRole('button', { name: 'Settings', exact: true });
    if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
        await toggle.click();
    }
}

/** Waits until the block editor reports ready after admin.createNewPost(). */
export async function waitEditorReady(page: Page) {
    await page.waitForFunction(
        () => {
            const sel = (window as any).wp?.data?.select('core/editor');
            if (!sel) return false;
            return sel.__unstableIsEditorReady ? sel.__unstableIsEditorReady() : true;
        },
        null,
        { timeout: 30_000 }
    );
}

/**
 * Inserts a block reliably.
 *
 * admin.createNewPost() resolves before the editor finishes initializing, and
 * the editor's own content reset can silently wipe a block inserted too early
 * — so wait for the editor to report ready, insert, and re-insert if the
 * block disappears again.
 */
export async function insertBlockSafely(
    page: Page,
    editor: { insertBlock: (block: { name: string; attributes?: any }) => Promise<void> },
    name: string,
    attributes: Record<string, unknown> = {}
) {
    await waitEditorReady(page);

    const countBlocks = () =>
        page.evaluate(
            (blockName) =>
                (window as any).wp?.data
                    ?.select('core/block-editor')
                    ?.getBlocks()
                    ?.filter((b: any) => b.name === blockName).length ?? 0,
            name
        );

    await expect
        .poll(
            async () => {
                if ((await countBlocks()) === 0) {
                    await editor.insertBlock({ name, attributes });
                }
                return countBlocks();
            },
            { timeout: 30_000, message: `the ${name} block should stay inserted` }
        )
        .toBeGreaterThan(0);
}

/** Inserts the viewer block reliably (see insertBlockSafely). */
export async function insertViewerBlock(
    page: Page,
    editor: { insertBlock: (block: { name: string; attributes?: any }) => Promise<void> },
    attributes: Record<string, unknown> = {}
) {
    await insertBlockSafely(page, editor, 'b3dviewer/modelviewer', attributes);
}

/**
 * Waits for a VISIBLE <model-viewer> (ignores the hidden .bp3d_backup_view
 * fallback) and for its model to finish loading (el.loaded === true).
 */
export async function waitModelLoaded(page: Page, scope = '') {
    const mv = page.locator(`${scope} model-viewer:visible`.trim()).first();
    await mv.waitFor({ state: 'attached', timeout: 30_000 });
    await page.waitForFunction(() => !!customElements.get('model-viewer'), null, {
        timeout: 30_000,
    });
    await expect
        .poll(async () => mv.evaluate((el: any) => el.loaded === true).catch(() => false), {
            timeout: 45_000,
            message: 'the <model-viewer> element should finish loading the model',
        })
        .toBe(true);
    return mv;
}
