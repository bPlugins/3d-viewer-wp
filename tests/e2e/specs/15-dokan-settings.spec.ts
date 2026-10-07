import { test, expect } from '../admin-ui';
import { WP_3D_DOKAN, adminUi, saveSettings } from '../helpers/wp-admin';
import { captureRaw, diffRaw, restoreRaw, showDiff, type Raw } from '../helpers/records';
import { wp } from '../wp';

/**
 * Marketplace (Dokan) owner screen (`bp3d_dokan_settings`) in the project's interface.
 *
 * The option is never created here: with no stored row (a site that never saved this screen)
 * the save tests are skipped, since putting that state back would mean deleting the row.
 * When a row exists its bytes are captured first and written back afterwards.
 */

const OPTION = 'bp3d_dokan_settings';
const MARKER_KEY = 'e2e_3dv_undeclared';
const TARGET = { options: [OPTION] };

const dokanActive = () => wp(['plugin', 'is-active', 'dokan-lite'], { allowFail: true, retries: 0 }) !== null;

test.describe('Marketplace (Dokan) settings', () => {
    let start: Raw | null = null;

    test.beforeAll(() => {
        if (dokanActive()) start = captureRaw(TARGET);
    });

    test.afterAll(() => {
        if (start?.options[OPTION]) expect(restoreRaw(TARGET, start), 'captured bytes written back').toBe(true);
    });

    test('renders in the expected interface', async ({ page, adminUi: mode }) => {
        test.skip(!dokanActive(), 'Dokan is not active');
        await page.goto(WP_3D_DOKAN);
        await expect(page.locator('#wpadminbar')).toBeVisible();
        const ui = await adminUi(page);
        if (mode) expect(ui, 'Dokan screen interface').toBe(mode);
        if (ui === 'modern') {
            await expect(page.locator(`.bfields-root[data-unique="${OPTION}"]`)).toBeAttached();
        } else {
            await expect(page.locator('.csf-options').first()).toBeAttached();
        }
    });

    test('an untouched save keeps the stored bytes', async ({ page }) => {
        test.skip(!dokanActive(), 'Dokan is not active');
        test.skip(!start?.options[OPTION], `${OPTION} has no stored row; a save would create one`);

        await page.goto(WP_3D_DOKAN);
        await adminUi(page);
        await page.waitForTimeout(800);
        await saveSettings(page, OPTION);

        const now = captureRaw(TARGET);
        const diffs = diffRaw(start!.options[OPTION]!, now.options[OPTION]!);
        expect(now.options[OPTION], `bytes identical\n    ${diffs.map(showDiff).join('\n    ')}`).toBe(start!.options[OPTION]);
    });

    test('keys the screen does not declare survive a save', async ({ page }) => {
        test.skip(!dokanActive(), 'Dokan is not active');
        test.skip(!start?.options[OPTION], `${OPTION} has no stored row; a save would create one`);

        // An undeclared key stands in for the vendor restrictions 3D Viewer Pro stores here.
        wp(['option', 'patch', 'insert', OPTION, MARKER_KEY, 'kept']);
        await page.goto(WP_3D_DOKAN);
        await adminUi(page);
        await page.waitForTimeout(800);
        await saveSettings(page, OPTION);

        const stored = JSON.parse(wp(['option', 'get', OPTION, '--format=json']) || '{}');
        expect(stored[MARKER_KEY], 'undeclared key kept').toBe('kept');
        // Drops the marker again (afterAll does the same if this test stops early).
        expect(restoreRaw(TARGET, start!), 'captured bytes written back').toBe(true);
    });
});
