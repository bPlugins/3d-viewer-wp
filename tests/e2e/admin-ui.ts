/**
 * Admin interface pinning for the per-mode projects (admin-classic / admin-modern).
 *
 * A project sets the worker option `adminUi`; `adminUiPin` writes `bp3d_admin_ui` before
 * the worker's first test and puts the recorded value back afterwards. The restore never
 * deletes the option: when it was unset at the start, it is set to the interface the site
 * resolved then and reported (deleting it needs the site owner's consent).
 */
import { test as base, expect } from './fixtures';
import { wp } from './wp';

export type AdminUiMode = 'classic' | 'modern';

export const ADMIN_UI_OPTION = 'bp3d_admin_ui';

/** The stored `bp3d_admin_ui` value, or null when the option does not exist. */
export function adminUiOption(): string | null {
    return wp(['option', 'get', ADMIN_UI_OPTION], { allowFail: true, retries: 0 });
}

/** Writes the option (update only; this suite never deletes it). */
export function writeAdminUiOption(value: string) {
    if (adminUiOption() !== value) wp(['option', 'update', ADMIN_UI_OPTION, value]);
}

/**
 * Puts back what `adminUiOption()` returned earlier. Returns a note when the option was unset
 * then: instead of deleting it, it is set to `resolvedAtStart` (the interface the unset option
 * gave), or left at its current value without one.
 */
export function restoreAdminUiOption(previous: string | null, resolvedAtStart = ''): string | null {
    if (previous === null) {
        if (resolvedAtStart) writeAdminUiOption(resolvedAtStart);
        const now = adminUiOption();
        return now === null ? null : `bp3d_admin_ui was unset before the run and is left at "${now}" (deleting it needs consent)`;
    }
    writeAdminUiOption(previous);
    return null;
}

/** The interface the site resolves for a screen (constant, filter and bfields fallback included). */
export function effectiveAdminUi(surface = 'settings'): string {
    return wp(['eval', `echo \\BP3D\\Base\\AdminUi::mode('${surface}');`]) ?? '';
}

let unsetAtStart = false;

export const test = base.extend<{ adminUiGuard: void }, { adminUi: AdminUiMode | undefined; adminUiPin: void }>({
    adminUi: [undefined, { option: true, scope: 'worker' }],

    adminUiPin: [
        async ({ adminUi }, use) => {
            if (!adminUi) {
                await use();
                return;
            }
            const previous = adminUiOption();
            unsetAtStart = previous === null;
            // Otherwise the last per-mode project's pin would stay, e.g. Classic after a full run.
            const resolvedAtStart = unsetAtStart ? effectiveAdminUi() : '';
            writeAdminUiOption(adminUi);
            const resolved = effectiveAdminUi();
            if (resolved !== adminUi) {
                restoreAdminUiOption(previous, resolvedAtStart);
                throw new Error(
                    `bp3d_admin_ui is pinned to "${adminUi}" but the site resolves "${resolved}": ` +
                        'a BP3D_ADMIN_UI constant or bp3d_admin_ui filter locks it, or bfields did not load.'
                );
            }
            await use();
            const note = restoreAdminUiOption(previous, resolvedAtStart);
            if (note) console.warn(`[admin-ui] ${note}`);
        },
        { scope: 'worker', auto: true },
    ],

    // The site may be shared with other sessions; re-pin if something switched the UI mid-run.
    adminUiGuard: [
        async ({ adminUi }, use, testInfo) => {
            if (adminUi) {
                const now = adminUiOption();
                if (now !== adminUi) {
                    testInfo.annotations.push({
                        type: 'warning',
                        description: `bp3d_admin_ui was ${now ?? 'unset'} before this test; re-pinned to ${adminUi}`,
                    });
                    writeAdminUiOption(adminUi);
                }
                if (unsetAtStart) {
                    testInfo.annotations.push({
                        type: 'notice',
                        description: 'bp3d_admin_ui was unset when this run started; it is set to the interface the site showed then, not deleted (deleting it needs consent)',
                    });
                }
            }
            await use();
        },
        { auto: true },
    ],
});

export { expect };
