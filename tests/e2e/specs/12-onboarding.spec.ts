import { test, expect, expectNoFatal } from '../fixtures';
import { wp } from '../wp';

const SETUP_QUERY = 'post_type=bp3d-model-viewer&page=3d-viewer-setup';
const DASHBOARD_QUERY = 'post_type=bp3d-model-viewer&page=3d-viewer';

const FINISH_LABEL = 'Add Your First 3D Model';

const SETTINGS_OPTION = '_bp3d_settings_';

const STATE_OPTIONS = [
    'bp3d_onboarding_completed',
    'bp3d_onboarding_exited',
    'bp3d_onboarding_progress',
];

/**
 * The dashboard header collapses its nav into a hamburger below a 1350px
 * container width, which Playwright's default 1280px viewport is under. Open
 * it so the nav's links can be asserted on like a wide desktop would show them.
 */
async function openDashboardNav(page: any) {
    const toggle = page.locator('.bplHamburger');
    if (await toggle.isVisible().catch(() => false)) {
        // Dispatched rather than clicked: the header keeps animating, so the
        // element never passes Playwright's "stable" actionability check.
        await toggle.dispatchEvent('click');
        await expect(page.locator('.bPlDashboardNav.open')).toBeVisible();
    }
}

/** Clicks Continue until the final step's CTA appears. */
async function walkToLastStep(page: any) {
    const finish = page.getByRole('button', { name: FINISH_LABEL });

    for (let i = 0; i < 8; i++) {
        if (await finish.isVisible().catch(() => false)) return;
        await page.locator('.stepFooter .onbButton.primary').click();
        await page.waitForTimeout(500); // the save is fire-and-forget
    }

    await expect(finish).toBeVisible();
}

/**
 * The guided setup wizard (bpl-tools Onboarding) on its hidden full-screen
 * page, and the dashboard entry that leads back to an unfinished run.
 *
 * The wizard exposes no plugin setting and persists nothing but its own
 * progress, so walking it must leave `_bp3d_settings_` byte-for-byte identical.
 * That is asserted directly below.
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

    test('renders full-screen with the admin chrome hidden', async ({ page, admin, pageErrors }) => {
        await admin.visitAdminPage('edit.php', SETUP_QUERY);

        await expect(page.locator('.bPlOnboarding')).toBeVisible();
        await expect(page.locator('.bPlOnboardingBar .barName')).toHaveText('3D Viewer');

        // The wizard needs the whole viewport — the body class hides WP's chrome.
        await expect(page.locator('body')).toHaveClass(/bpl-onboarding-fullscreen/);
        await expect(page.locator('#adminmenumain')).toBeHidden();
        await expect(page.locator('#wpadminbar')).toBeHidden();

        // One rail item per step, and Exit is always available.
        const items = page.locator('.bPlOnboardingProgress .progressItem');
        expect(await items.count()).toBeGreaterThanOrEqual(3);
        await expect(page.locator('.barExit')).toBeVisible();

        await expectNoFatal(page);
        expect(pageErrors).toEqual([]);
    });

    test('walking the whole wizard leaves plugin settings untouched', async ({ page, admin }) => {
        const before = wp(['option', 'get', SETTINGS_OPTION, '--format=json'], { allowFail: true });

        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        await walkToLastStep(page);

        // Make a choice too — the one field the wizard has must not leak into
        // the settings array either.
        await page.locator('.choiceCard', { hasText: 'Shortcode' }).click();
        await page.getByRole('button', { name: FINISH_LABEL }).click();
        await page.waitForURL(/post-new\.php\?post_type=bp3d-model-viewer/, { timeout: 30_000 });

        const after = wp(['option', 'get', SETTINGS_OPTION, '--format=json'], { allowFail: true });
        expect(after).toEqual(before);
    });

    test('exiting early leaves a resume entry on the dashboard', async ({ page, admin }) => {
        STATE_OPTIONS.forEach((option) => wp(['option', 'delete', option], { allowFail: true }));

        await admin.visitAdminPage('edit.php', SETUP_QUERY);

        // Advance one step, so there is real progress to report on the way
        // out. Only one: the wizard can be as short as three steps, and leaving
        // from the last one counts as finishing, which drops the entry instead.
        await page.locator('.stepFooter .onbButton.primary').click();
        await page.waitForTimeout(1000);

        await page.locator('.barExit').click();
        await page.waitForURL(/page=3d-viewer(&|$)/, { timeout: 30_000 });
        await openDashboardNav(page);

        const resume = page.getByRole('link', { name: /Guided Setup/ });
        await expect(resume).toBeVisible();
        await expect(resume.locator('.navBadge')).toHaveText(/^\d{1,3}%$/);

        // And it goes back to the wizard. Dispatched for the same reason as
        // the hamburger: the header never settles for a real click.
        await resume.dispatchEvent('click');
        await expect(page.locator('.bPlOnboarding')).toBeVisible();
    });

    test('picking a method rewrites the instructions, and finishing drops the dashboard entry', async ({ page, admin }) => {
        await admin.visitAdminPage('edit.php', SETUP_QUERY);
        await walkToLastStep(page);

        // Picking a card rewrites the instructions below it. This is live
        // component state — nothing is persisted, so re-entering starts clean.
        await page.locator('.choiceCard', { hasText: 'Shortcode' }).click();
        await expect(page.locator('.stepTips')).toContainText('3d_viewer');

        await page.locator('.choiceCard', { hasText: 'Elementor' }).click();
        await expect(page.locator('.stepTips')).toContainText('Model Viewer');

        await page.getByRole('button', { name: FINISH_LABEL }).click();
        await page.waitForURL(/post-new\.php\?post_type=bp3d-model-viewer/, { timeout: 30_000 });

        // A completed run takes its dashboard entry with it.
        await admin.visitAdminPage('edit.php', DASHBOARD_QUERY);
        await openDashboardNav(page);
        await expect(page.locator('.bPlDashboardNav')).toBeVisible();
        await expect(page.getByRole('link', { name: /Guided Setup/ })).toHaveCount(0);
    });
});
