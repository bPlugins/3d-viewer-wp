import { test, expect, expectNoFatal } from '../fixtures';
import { wp } from '../wp';

const SETUP_QUERY = 'post_type=bp3d-model-viewer&page=bp3d-setup-wizard';
const DASHBOARD_QUERY = 'post_type=bp3d-model-viewer&page=3d-viewer';

const START_LABEL = "Let's Get Started";
const FINISH_LABEL = 'Add Your First 3D Model';
const NEXT_LABEL = 'Next';

const SETTINGS_OPTION = '_bp3d_settings_';

const STATE_OPTIONS = [
    'bp3d_onboarding_completed',
    'bp3d_onboarding_exited',
    'bp3d_onboarding_progress',
];

/** Steps 1 → 3. */
async function walkToLastStep(page: any) {
    await page.getByRole('button', { name: START_LABEL }).click();
    await page.getByRole('button', { name: NEXT_LABEL }).click();
    await expect(page.getByRole('radiogroup')).toBeVisible();
}

/**
 * The three-step guided setup on its hidden page, and the dashboard entry that
 * leads back to an unfinished run.
 *
 * The wizard exposes no plugin setting and persists nothing but its own
 * progress, so walking it must leave `_bp3d_settings_` byte-for-byte identical.
 */
test.describe('Guided setup wizard', () => {
    // The wizard is one-shot by design — reset its state so the spec is
    // re-runnable, and leave it marked done so the notice does not follow
    // later runs around the admin.
    test.beforeAll(() => {
        STATE_OPTIONS.forEach((option) => wp(['option', 'delete', option], { allowFail: true }));
    });

    test.afterAll(() => {
        wp(['option', 'update', 'bp3d_onboarding_completed', '1'], { allowFail: true });
    });

    test('renders inside wp-admin with the three-step stepper', async ({ page, admin, pageErrors }) => {
        await admin.visitAdminPage('edit.php', SETUP_QUERY);

        await expect(page.locator('.bp3d-ob-card')).toBeVisible();
        await expect(page.locator('.bp3d-ob-brand__name')).toHaveText('3D Viewer');
        await expect(page.locator('#adminmenu')).toBeVisible();
        await expect(page.locator('body')).not.toHaveClass(/bpl-onboarding-fullscreen/);

        await expect(page.locator('.bp3d-ob-stepper__label')).toHaveText(['Model', 'Customize', 'Publish']);
        await expect(page.locator('.bp3d-ob-title')).toHaveCSS('font-family', /^Inter/);

        // Exit Setup lives on step 2 only.
        await expect(page.locator('.bp3d-ob-exit')).toHaveCount(0);

        await expectNoFatal(page);
        expect(pageErrors).toEqual([]);
    });

    test('step 2 badges AR as included and links to pricing', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        await page.getByRole('button', { name: START_LABEL }).click();

        const badge = (title: string) =>
            page.locator('.bp3d-ob-feature', { hasText: title }).locator('.bp3d-ob-badge');

        await expect(badge('Augmented Reality')).toHaveText('Included');
        await expect(badge('Hotspots & Initial View')).toHaveText('Pro');
        await expect(page.locator('#bp3dOnboarding').getByRole('link', { name: 'Upgrade to Pro' })).toHaveAttribute('href', /bplugins\.com\/products\/3d-viewer\/pricing/);
    });

    test('Need help opens the tutorial in a modal', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        const dialog = page.locator('dialog.bp3d-ob-video');

        await page.locator('.bp3d-ob-help').click();
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/Tno8LiebxaI/);

        await page.locator('.bp3d-ob-video__close').click();
        await expect(dialog).toHaveCount(0);
    });

    test('walking the whole wizard leaves plugin settings untouched', async ({ page, admin }) => {
        const before = wp(['option', 'get', SETTINGS_OPTION, '--format=json'], { allowFail: true });

        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        await walkToLastStep(page);

        // Make a choice too — the one field the wizard has must not leak into
        // the settings array either.
        await page.getByRole('radio', { name: /Shortcode/ }).click();
        await page.getByRole('button', { name: FINISH_LABEL }).click();
        await page.waitForURL(/post-new\.php\?post_type=bp3d-model-viewer/, { timeout: 30_000 });

        const after = wp(['option', 'get', SETTINGS_OPTION, '--format=json'], { allowFail: true });
        expect(after).toEqual(before);
    });

    test('exiting early leaves a resume entry on the dashboard', async ({ page, admin }) => {
        STATE_OPTIONS.forEach((option) => wp(['option', 'delete', option], { allowFail: true }));

        // The dashboard nav collapses behind a hamburger below 1800px.
        await page.setViewportSize({ width: 1920, height: 1080 });
        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        await page.getByRole('button', { name: START_LABEL }).click();

        await page.locator('.bp3d-ob-exit').click();
        await page.waitForURL(/page=3d-viewer(&|$)/, { timeout: 30_000 });

        const resume = page.locator('.bPlDashboardNav').getByRole('link', { name: /Guided Setup/ });
        await expect(resume).toBeVisible();
        await expect(resume.locator('.navBadge')).toHaveText('33%');

        // And it goes back to the wizard. Followed by href: Playwright's click
        // stability check stalls on this page under the suite's tracing.
        await expect(resume).toHaveAttribute('href', new RegExp(SETUP_QUERY));
        await page.goto((await resume.getAttribute('href')) as string);
        await expect(page.locator('.bp3d-ob-card')).toBeVisible();
    });

    test('the method picker is one tab stop and rewrites the instructions', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        await walkToLastStep(page);

        const highlights = page.locator('.bp3d-ob-highlights');
        const height = (await highlights.boundingBox())?.height;

        await page.getByRole('radio', { name: /Gutenberg/ }).focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('radio', { name: /Elementor/ })).toHaveAttribute('aria-checked', 'true');
        await expect(highlights).toContainText('Model Viewer');

        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('radio', { name: /Shortcode/ })).toBeFocused();
        await expect(highlights).toContainText('shortcode');

        // Copy changes must never reflow the footer.
        expect((await highlights.boundingBox())?.height).toBe(height);
    });

    test('finishing drops the dashboard entry', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        await walkToLastStep(page);

        await page.getByRole('button', { name: FINISH_LABEL }).click();
        await page.waitForURL(/post-new\.php\?post_type=bp3d-model-viewer/, { timeout: 30_000 });

        // A completed run takes its dashboard entry with it.
        await admin.visitAdminPage('edit.php', DASHBOARD_QUERY);
        await expect(page.locator('.bPlDashboardNav')).toBeAttached();
        await expect(page.locator('.bPlDashboardNav').getByRole('link', { name: /Guided Setup/ })).toHaveCount(0);
    });
});
