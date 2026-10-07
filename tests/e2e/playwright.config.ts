import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import type { AdminUiMode } from './admin-ui';

/**
 * E2E release-test config for the 3D Viewer plugin, running against the
 * WordPress Studio site that hosts this repo (see tests/e2e/README.md).
 *
 * Override via env vars when the site/credentials differ:
 *   WP_BASE_URL, WP_USERNAME, WP_PASSWORD
 *
 * Projects:
 *   core            every spec that does not depend on the admin interface
 *   admin-classic   the admin-screen specs with bp3d_admin_ui pinned to classic (Codestar)
 *   admin-modern    the same specs pinned to modern (bfields)
 *   crossmode       Modern → Classic → Modern untouched saves; needs E2E_CROSSMODE=1
 */
process.env.WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8881';
process.env.WP_USERNAME = process.env.WP_USERNAME || 'admin';
process.env.WP_PASSWORD = process.env.WP_PASSWORD || 'password';
process.env.STORAGE_STATE_PATH =
    process.env.STORAGE_STATE_PATH || path.join(__dirname, 'artifacts', 'storage-state.json');

const PER_MODE = /(01-admin-surfaces|02-settings|04-cpt-editor|07-woocommerce|13-admin-sweep|14-ajax-save|15-dokan-settings|16-interface-switch)\.spec\.ts$/;
const CROSSMODE = /crossmode\.spec\.ts$/;

export default defineConfig<{}, { adminUi: AdminUiMode | undefined }>({
    testDir: path.join(__dirname, 'specs'),
    outputDir: path.join(__dirname, 'artifacts', 'test-results'),
    globalSetup: path.join(__dirname, 'global-setup.ts'),

    // The suite runs against ONE shared WordPress install and several specs
    // mutate global state (settings, seeded content, bp3d_admin_ui), so keep a single worker.
    workers: 1,
    fullyParallel: false,
    retries: 0,
    timeout: 90_000,
    expect: { timeout: 15_000 },
    reportSlowTests: null,

    reporter: [
        ['list'],
        ['html', { outputFolder: path.join(__dirname, 'artifacts', 'report'), open: 'never' }],
    ],

    use: {
        baseURL: process.env.WP_BASE_URL,
        storageState: process.env.STORAGE_STATE_PATH,
        trace: 'retain-on-failure',
        // Full-page screenshot of every test (pass or fail) in the HTML report
        screenshot: { mode: 'on', fullPage: true },
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'core',
            testIgnore: [PER_MODE, CROSSMODE],
            use: { ...devices['Desktop Chrome'] },
        },
        ...(['classic', 'modern'] as const).map((ui) => ({
            name: `admin-${ui}`,
            testMatch: PER_MODE,
            use: { ...devices['Desktop Chrome'], adminUi: ui },
        })),
        {
            // Flips bp3d_admin_ui itself and writes captured bytes back; see README (consent).
            name: 'crossmode',
            testMatch: CROSSMODE,
            timeout: 600_000,
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
