/**
 * wp-cli access for the e2e suite.
 *
 * By default the site is managed by WordPress Studio, so every wp command goes
 * through `studio wp …` executed from the SITE root (not the plugin dir). Set
 * E2E_WP_CLI (e.g. `E2E_WP_CLI=wp`) to run against any other install that a
 * plain wp-cli can reach — Local, Docker, a plain LAMP site.
 */
import { execFileSync } from 'child_process';
import path from 'path';

// plugin lives at <site>/wp-content/plugins/3d-viewer/tests/e2e → 5 levels up
export const SITE_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

// e.g. "studio wp" (default) or "wp"
const WP_CLI = (process.env.E2E_WP_CLI || 'studio wp').trim().split(/\s+/);
const USES_STUDIO = WP_CLI[0] === 'studio';

type WpOptions = { allowFail?: boolean; retries?: number };

export function wp(args: string[], { allowFail = false, retries = 2 }: WpOptions = {}): string | null {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return execFileSync(WP_CLI[0], [...WP_CLI.slice(1), ...args], {
                cwd: SITE_ROOT,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            }).trim();
        } catch (e) {
            lastError = e; // transient Studio daemon hiccups happen — retry
        }
    }
    if (allowFail) return null;
    throw new Error(
        `wp-cli failed: ${WP_CLI.join(' ')} ${args.join(' ')}\n${lastError?.stderr || lastError?.message}`
    );
}

/** Starts the Studio site if it is not already online. */
export function ensureSiteRunning(): void {
    // Only Studio can be started from here; any other host is expected to be up.
    if (!USES_STUDIO) return;

    let status: string | null = null;
    try {
        status = execFileSync('studio', ['status'], {
            cwd: SITE_ROOT,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch {
        // fall through to start
    }
    if (status && /Online/.test(status)) return;

    console.log('[setup] starting the Studio site…');
    execFileSync('studio', ['start', '--skip-browser'], { cwd: SITE_ROOT, stdio: 'inherit' });
}
