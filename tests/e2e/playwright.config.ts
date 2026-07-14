import path from 'path';
import { defineConfig, devices } from '@playwright/test';

/**
 * E2E release-test config for the 3D Viewer plugin, running against the
 * WordPress Studio site that hosts this repo (see tests/e2e/README.md).
 *
 * Override via env vars when the site/credentials differ:
 *   WP_BASE_URL, WP_USERNAME, WP_PASSWORD
 */
process.env.WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8881';
process.env.WP_USERNAME = process.env.WP_USERNAME || 'admin';
process.env.WP_PASSWORD = process.env.WP_PASSWORD || 'password';
process.env.STORAGE_STATE_PATH =
    process.env.STORAGE_STATE_PATH || path.join(__dirname, 'artifacts', 'storage-state.json');

export default defineConfig({
    testDir: path.join(__dirname, 'specs'),
    outputDir: path.join(__dirname, 'artifacts', 'test-results'),
    globalSetup: path.join(__dirname, 'global-setup.ts'),

    // The suite runs against ONE shared WordPress install and several specs
    // mutate global state (settings, seeded content), so keep a single worker.
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
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
