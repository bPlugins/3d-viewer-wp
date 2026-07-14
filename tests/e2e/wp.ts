/**
 * wp-cli access for the e2e suite.
 *
 * This site is managed by WordPress Studio, so every wp command must go
 * through `studio wp …` executed from the SITE root (not the plugin dir).
 */
import { execFileSync } from 'child_process';
import path from 'path';

// plugin lives at <site>/wp-content/plugins/3d-viewer/tests/e2e → 5 levels up
export const SITE_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

type WpOptions = { allowFail?: boolean; retries?: number };

export function wp(args: string[], { allowFail = false, retries = 2 }: WpOptions = {}): string | null {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return execFileSync('studio', ['wp', ...args], {
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
        `wp-cli failed: studio wp ${args.join(' ')}\n${lastError?.stderr || lastError?.message}`
    );
}

/** Starts the Studio site if it is not already online. */
export function ensureSiteRunning(): void {
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
