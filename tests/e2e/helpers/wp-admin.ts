/**
 * Mode-neutral wp-admin helpers: one call works on the Classic (Codestar) and the Modern
 * (bfields) screen. Ported from 3D Viewer Pro's suite (tests/e2e/helpers/wp-admin.ts), minus
 * its Pro-only pieces (merged 3D Source field, control placement, licence).
 *
 * Storage keys: `_bp3dimages_` (viewer), `_bp3d_settings_` (Settings), `_bp3d_product_`
 * (Woo product box), `bp3d_dokan_settings` (Marketplace (Dokan) screen).
 */
import { type Locator, type Page, expect } from '@playwright/test';
import { wp } from '../wp';
import { test } from '../admin-ui';

export const WP_3D_MODELS_LIST = '/wp-admin/edit.php?post_type=bp3d-model-viewer';
export const WP_3D_MODEL_NEW = '/wp-admin/post-new.php?post_type=bp3d-model-viewer';
export const WP_3D_SETTINGS = '/wp-admin/edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings';
export const WP_3D_DOKAN = '/wp-admin/edit.php?post_type=bp3d-model-viewer&page=bp3d-dokan';
export const WP_3D_DASHBOARD = '/wp-admin/edit.php?post_type=bp3d-model-viewer&page=3d-viewer';
export const WC_PRODUCT_NEW = '/wp-admin/post-new.php?post_type=product';

export const editUrl = (id: number | string) => `/wp-admin/post.php?post=${id}&action=edit`;

// ── Codestar primitives ───────────────────────────────────────────────────────

/** Switch to a section tab inside a Codestar meta box. */
export async function openCsfMetaboxTab(page: Page, metaboxId: string, tabName: string) {
    const metabox = page.locator(`[id="${metaboxId}"]`);
    // The tab's icon glyph joins its accessible name, so match the text instead of the role.
    const tab = metabox.locator('.csf-nav a').filter({ hasText: exactText(tabName) }).first();
    const visible = await tab.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    // Clicking an active tab re-initialises its fields and starts a WP autosave.
    if (visible && !(await tab.evaluate((el) => el.classList.contains('csf-active')))) {
        await tab.click();
        await page.waitForTimeout(300);
    }
}

/** Switch to a tab on a Codestar options page (`#tab=<slug>` links). */
export async function openCsfOptionTab(page: Page, tabSlug: string) {
    const tab = page.locator(`.csf-nav a[href="#tab=${tabSlug}"]`).first();
    await expect(tab).toBeVisible({ timeout: 15_000 });
    await tab.click();
    await page.waitForTimeout(300);
}

/** Save a Codestar options page and wait for its success notice. */
export async function saveCsfOptions(page: Page) {
    const saveBtn = page.locator('.csf-save').first();
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();
    await expect(page.locator('.csf-form-success, .csf-form-result.csf-form-success').first()).toBeVisible({ timeout: 25_000 });
}

export async function setCsfSwitcher(page: Page, inputName: string, on: boolean) {
    const switcher = page.locator(`.csf--switcher:has(input[name="${inputName}"])`).first();
    await expect(switcher).toBeVisible({ timeout: 15_000 });
    const isOn = await switcher.evaluate((el) => el.classList.contains('csf--active'));
    if (isOn !== on) await switcher.click();
}

/** Codestar button_set radios are visually hidden, so set them through the DOM. */
export async function setCsfButtonSet(page: Page, inputName: string, value: string) {
    await page.locator(`input[name="${inputName}"][value="${value}"]`).evaluate((el) => {
        const input = el as HTMLInputElement;
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

/** Codestar media URL inputs are readonly (the media modal fills them). */
export async function setCsfMediaUrl(page: Page, inputName: string, url: string) {
    await page.locator(`input[name="${inputName}"]`).first().evaluate((el, value) => {
        const input = el as HTMLInputElement;
        input.removeAttribute('readonly');
        input.value = value as string;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }, url);
}

// ── Enable Gutenberg (decides which editor a NEW viewer opens in) ──────────────

function readGutenbergEnabled(): boolean {
    const settings = JSON.parse(wp(['option', 'get', '_bp3d_settings_', '--format=json'], { allowFail: true }) || '{}');
    const v = settings.gutenberg_enabled;
    return v === '1' || v === 1 || v === true;
}

function writeGutenbergEnabled(enabled: boolean): boolean {
    const wasOn = readGutenbergEnabled();
    if (wasOn !== enabled) {
        // JSON so the switch is stored as the string Codestar writes, never an int.
        wp(['option', 'patch', 'update', '_bp3d_settings_', 'gutenberg_enabled', enabled ? '"1"' : '"0"', '--format=json']);
    }
    return wasOn;
}

/** Turn Enable Gutenberg off around the current describe (global-setup turns it on), restoring it afterwards. */
export function useGutenbergDisabled() {
    let wasOn = false;
    test.beforeAll(() => {
        wasOn = writeGutenbergEnabled(false);
    });
    test.afterAll(() => {
        if (wasOn) writeGutenbergEnabled(true);
    });
}

// ── Mode-neutral field helpers (Classic = Codestar, Modern = bfields) ─────────
//
// A field is named by its stored key path in Codestar's input-name form, e.g.
// "_bp3dimages_[bp_3d_fullscreen]" or "_bp3d_settings_[3d_woo_switcher]".
// None of these saves.

export type AdminUi = 'classic' | 'modern';

const BP3D_BOXES = ['_bp3d_settings_', '_bp3dimages_', '_bp3d_product_', 'bp3d_dokan_settings'];
const OUR_BFIELDS = BP3D_BOXES.map((u) => `.bfields-root[data-unique="${u}"]`).join(', ');

/** Classic or Modern, read from the screen; waits for the framework to mount. */
export async function adminUi(page: Page): Promise<AdminUi> {
    await page.locator(`${OUR_BFIELDS}, .csf-options, .csf-metabox`).first().waitFor({ state: 'attached', timeout: 60_000 });
    if ((await page.locator(OUR_BFIELDS).count()) === 0) return 'classic';
    await page.waitForFunction(
        (sel) => Array.from(document.querySelectorAll<HTMLElement>(sel)).every((r) => r.dataset.bfieldsMounted === '1'),
        OUR_BFIELDS,
        { timeout: 60_000 }
    );
    return 'modern';
}

export async function isModern(page: Page): Promise<boolean> {
    return (await adminUi(page)) === 'modern';
}

type FieldPath = { unique: string; path: Array<string | number> };

export function parseField(name: string): FieldPath {
    const m = name.match(/^([^[]+)((?:\[[^\]]*\])*)$/);
    if (!m) throw new Error(`Not a field name: ${name}`);
    const path = [...m[2].matchAll(/\[([^\]]*)\]/g)].map((s) => (/^\d+$/.test(s[1]) ? Number(s[1]) : s[1]));
    return { unique: m[1], path };
}

// A `cards` section (the page frame's Model tab) draws each root field as a card, not a row.
const CONTROL = ':scope > :is(.bfields-row__control, .bfields-card__control)';

/** The bfields row of a field, as a lazy locator (repeater rows by index, fieldset sub-rows). */
function bfieldsRow(page: Page, name: string): Locator {
    const { unique, path } = parseField(name);
    const nested = ':not(.bfields-row .bfields-row, .bfields-card[data-field] .bfields-row, .bfields-row .bfields-card, .bfields-card[data-field] .bfields-card)';
    let loc = page.locator(`.bfields-root[data-unique="${unique}"]`).locator(`:is(.bfields-row, .bfields-card)[data-field="${path[0]}"]${nested}`).first();
    for (let i = 1; i < path.length; i++) {
        const seg = path[i];
        if (typeof seg === 'number') {
            loc = loc.locator(`${CONTROL} > .bfields-repeater > .bfields-repeater__list > li.bfields-repeater-row`).nth(seg);
        } else if (typeof path[i - 1] === 'number') {
            loc = loc.locator(`:scope > .bfields-repeater-row__body .bfields-row[data-field="${seg}"]`).first();
        } else {
            loc = loc.locator(`${CONTROL} > .bfields-fieldset > .bfields-row[data-field="${seg}"]`).first();
        }
    }
    return loc;
}

/** Open the collapsed field_group card that holds a root field, if any. */
async function openFieldGroup(page: Page, name: string) {
    const { unique, path } = parseField(name);
    const toggle = page
        .locator(`.bfields-root[data-unique="${unique}"] .bfields-field-group:not(.is-open):has(:is(.bfields-row, .bfields-card)[data-field="${path[0]}"])`)
        .locator(':scope > .bfields-field-group__head .bfields-field-group__toggle')
        .first();
    if ((await toggle.count()) > 0) await toggle.click();
}

/** The field's schema entry from bfields' boot data (null when the screen does not declare it). */
async function bfieldsSchema(page: Page, name: string): Promise<any | null> {
    const { unique, path } = parseField(name);
    return page.evaluate(
        ({ unique, keys }) => {
            const boot = (window as any).bfieldsBoot?.[unique];
            if (!boot) return null;
            let fields: any[] = boot.schema.sections.flatMap((s: any) => s.fields);
            let found: any = null;
            for (const key of keys) {
                found = fields.find((f) => f.id === key) ?? null;
                if (!found) return null;
                fields = found.fields ?? [];
            }
            return found;
        },
        { unique, keys: path.filter((s) => typeof s === 'string') as string[] }
    );
}

/** The current value in stored shape (Modern: the bfields store; Classic: the form input). */
export async function getFieldValue(page: Page, name: string): Promise<any> {
    if (await isModern(page)) {
        const { unique, path } = parseField(name);
        return page.evaluate(({ unique, path }) => (window as any).bfields.getValue(unique, path), { unique, path });
    }
    const checked = page.locator(`input[name="${name}"]:checked`);
    if ((await checked.count()) > 0) return checked.first().inputValue();
    return page.locator(`[name="${name}"]`).first().inputValue();
}

/** Whether the screen declares the field at all. */
export async function fieldExists(page: Page, name: string): Promise<boolean> {
    if (await isModern(page)) return (await bfieldsSchema(page, name)) !== null;
    return (await page.locator(`[name="${name}"], [name="${name}[url]"]`).count()) > 0;
}

/** The field's row: Codestar's `.csf-field`, bfields' `.bfields-row`. */
export async function fieldRow(page: Page, name: string): Promise<Locator> {
    if (await isModern(page)) {
        await openFieldGroup(page, name);
        return bfieldsRow(page, name);
    }
    return page.locator('.csf-field').filter({ has: page.locator(`[name="${name}"], [name="${name}[url]"]`) }).last();
}

/** The field's own text/number/select control (the first one for multi-part controls). */
export async function fieldInput(page: Page, name: string): Promise<Locator> {
    if (await isModern(page)) {
        await openFieldGroup(page, name);
        return bfieldsRow(page, name).locator(CONTROL).locator('input:not([type=hidden]), textarea, select').first();
    }
    return page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`).first();
}

/** The Settings screen's tab for a `#tab=` slug: Codestar's nav link or bfields' tab button. */
export async function settingsTab(page: Page, slug: string): Promise<Locator> {
    if (!(await isModern(page))) return page.locator(`.csf-nav a[href="#tab=${slug}"]`).first();
    const title = await page.evaluate((slug) => {
        const boot = (window as any).bfieldsBoot?._bp3d_settings_;
        const id = boot?.aliases?.[slug] ?? slug;
        return boot?.schema.sections.find((s: any) => s.id === id || s.slug === slug)?.title ?? null;
    }, slug);
    expect(title, `Settings has a section for #tab=${slug}`).not.toBeNull();
    return page.locator('.bfields-root[data-unique="_bp3d_settings_"] .bfields-tab').filter({ hasText: exactText(title) }).first();
}

/** Switch to a tab on the plugin Settings screen by its `#tab=` slug. */
export async function openSettingsTab(page: Page, slug: string) {
    if (!(await isModern(page))) return openCsfOptionTab(page, slug);
    const tab = await settingsTab(page, slug);
    await expect(tab).toBeVisible({ timeout: 15_000 });
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
}

/** Switch to a section tab of a meta box by its visible title. */
export async function openMetaboxTab(page: Page, title: string, metaboxId = '_bp3dimages_') {
    if (!(await isModern(page))) return openCsfMetaboxTab(page, metaboxId, title);
    const tab = page.locator(`.bfields-root[data-unique="${metaboxId}"] .bfields-tab`).filter({ hasText: exactText(title) }).first();
    await expect(tab).toBeVisible({ timeout: 15_000 });
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
}

export async function isSwitchOn(page: Page, name: string): Promise<boolean> {
    if (await isModern(page)) {
        await openFieldGroup(page, name);
        const toggle = bfieldsRow(page, name).locator('button[role="switch"]').first();
        await expect(toggle).toBeVisible({ timeout: 15_000 });
        return (await toggle.getAttribute('aria-checked')) === 'true';
    }
    return page.locator(`.csf--switcher:has(input[name="${name}"])`).first().evaluate((el) => el.classList.contains('csf--active'));
}

export async function setSwitch(page: Page, name: string, on: boolean) {
    if (!(await isModern(page))) return setCsfSwitcher(page, name, on);
    if ((await isSwitchOn(page, name)) !== on) await bfieldsRow(page, name).locator('button[role="switch"]').first().click();
    await expect(bfieldsRow(page, name).locator('button[role="switch"]').first()).toHaveAttribute('aria-checked', String(on));
}

/** The visible switch control: Codestar's `.csf--switcher`, bfields' `role="switch"` button. */
export async function switchControl(page: Page, name: string): Promise<Locator> {
    if (await isModern(page)) return bfieldsRow(page, name).locator('button[role="switch"]').first();
    return page.locator(`.csf--switcher:has(input[name="${name}"])`).first();
}

/** The option values a choice field offers, in order, with their labels. */
export async function choiceOptions(page: Page, name: string): Promise<{ values: string[]; labels: string[] }> {
    if (await isModern(page)) {
        const field = await bfieldsSchema(page, name);
        const options = field?.props?.options ?? {};
        const entries: Array<[string, string]> = Array.isArray(options)
            ? options.map((o: any) => [String(o.value ?? o.key), String(o.label)])
            : Object.entries(options).map(([k, v]) => [k, String(v)]);
        return { values: entries.map((e) => e[0]), labels: entries.map((e) => e[1]) };
    }
    const select = page.locator(`select[name="${name}"]`);
    if ((await select.count()) > 0) {
        const opts = select.first().locator('option');
        return { values: await opts.evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value)), labels: await opts.allInnerTexts() };
    }
    const radios = page.locator(`input[name="${name}"]`);
    return {
        values: await radios.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value)),
        labels: await radios.evaluateAll((els) => els.map((e) => (e.closest('label')?.textContent ?? '').trim())),
    };
}

/** Pick one option of a button_set, radio or select by its stored value. */
export async function setChoice(page: Page, name: string, value: string) {
    if (!(await isModern(page))) {
        const select = page.locator(`select[name="${name}"]`);
        if ((await select.count()) > 0) return void (await select.first().selectOption(value));
        const input = page.locator(`input[name="${name}"][value="${value}"]`).first();
        if (await input.isVisible().catch(() => false)) return input.check();
        return setCsfButtonSet(page, name, value);
    }
    await openFieldGroup(page, name);
    const control = bfieldsRow(page, name).locator(CONTROL);
    await expect(control).toBeVisible({ timeout: 15_000 });
    const select = control.locator('select.bfields-select').first();
    if ((await select.count()) > 0 && (await control.locator('[role="radiogroup"]').count()) === 0) {
        await select.selectOption(value);
    } else {
        const { values, labels } = await choiceOptions(page, name);
        const at = values.indexOf(value);
        expect(at, `${name} offers "${value}"`).toBeGreaterThanOrEqual(0);
        const button = control
            .locator('[role="radiogroup"] button, [role="group"] button')
            .filter({ has: page.locator('.bfields-mode__name') })
            .or(control.locator('.bfields-segmented button, .bfields-radios button'))
            .filter({ hasText: labels[at] });
        const exact = button.filter({ hasText: exactText(labels[at]) });
        await ((await exact.count()) > 0 ? exact : button).first().click();
    }
    expect(String(await getFieldValue(page, name)), `${name} holds "${value}"`).toBe(value);
}

/** Type into a text, number or textarea field (the first input of a dimension). */
export async function setText(page: Page, name: string, value: string) {
    const input = await fieldInput(page, name);
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill(value);
}

/**
 * Set a media/upload field's URL. Classic writes the readonly URL input; a Modern attachment
 * control has no URL input (the Media modal fills it), so its value goes through the host API.
 */
export async function setMediaUrl(page: Page, name: string, url: string) {
    if (!(await isModern(page))) {
        const nested = page.locator(`input[name="${name}[url]"]`);
        return setCsfMediaUrl(page, (await nested.count()) > 0 ? `${name}[url]` : name, url);
    }
    await openFieldGroup(page, name);
    const input = bfieldsRow(page, name).locator('input.bfields-media__input').first();
    if (await input.isVisible().catch(() => false)) return input.fill(url);
    const { unique, path } = parseField(name);
    // Codestar `media` (presentation "attachment") stores an array, `upload` ("url") a plain string.
    const attachment = (await bfieldsSchema(page, name))?.props?.presentation === 'attachment';
    await page.evaluate(
        ({ unique, path, url, attachment }) => {
            const bf = (window as any).bfields;
            const now = bf.getValue(unique, path);
            if (attachment || (now && typeof now === 'object')) {
                const base = { url: '', id: '', width: '', height: '', thumbnail: '', alt: '', title: '', description: '' };
                bf.setValue(unique, path, { ...base, ...(now && typeof now === 'object' ? now : {}), url });
            } else {
                bf.setValue(unique, path, url);
            }
        },
        { unique, path, url, attachment }
    );
    expect(String((await getFieldValue(page, name))?.url ?? (await getFieldValue(page, name))), `${name} URL`).toBe(url);
}

/** Save an options screen (Settings by default, or the Dokan screen) and wait for the framework's success signal. */
export async function saveSettings(page: Page, unique = '_bp3d_settings_') {
    if (!(await isModern(page))) return saveCsfOptions(page);
    const save = page.locator(`.bfields-root[data-unique="${unique}"] .bfields-btn--save`).first();
    await expect(save).toBeVisible({ timeout: 10_000 });
    const [response] = await Promise.all([
        page.waitForResponse((r) => decodeURIComponent(r.url()).includes(`bfields/v1/options/${unique}`) && r.request().method() === 'POST', { timeout: 60_000 }),
        save.click(),
    ]);
    expect(response.ok(), `${unique} save answered HTTP ${response.status()}`).toBeTruthy();
    await expect(page.locator(`.bfields-root[data-unique="${unique}"] .bfields-actions__status--success`)).toBeVisible({ timeout: 25_000 });
}

function exactText(text: string): RegExp {
    return new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

// ── Publish / Update (classic editor screens: viewer and product) ─────────────

/**
 * Publish or update the open classic-editor post and wait for the edit screen. Returns the post ID.
 * On a published Modern viewer, Update saves in place (bfields `update_in_place`); the helper then
 * loads the payload's `location` itself, unless `{ stay: true }`.
 */
export async function publishClassicPost(page: Page, options: { stay?: boolean } = {}): Promise<string> {
    if (await inPlaceUpdate(page)) {
        const result = await clickUpdate(page);
        if (result.kind === 'saved') {
            await settled(page);
            if (!options.stay) await page.goto(result.detail.location, { waitUntil: 'domcontentloaded' });
            return String(result.detail.postId);
        }
        if (result.kind === 'update') {
            throw new Error(`Update in place ended "${result.detail.outcome}" instead of saving`);
        }
    } else {
        // An edit screen already matches ?post=, so wait for the save's own navigation first.
        const navigated = page.waitForEvent('framenavigated', { predicate: (f) => f === page.mainFrame(), timeout: 45_000 });
        await clickPublish(page);
        await navigated;
    }
    // Not "load": a slow poster or model on the edit screen must not hold up the save.
    await page.waitForURL(/[?&]post=\d+/, { timeout: 45_000, waitUntil: 'domcontentloaded' });
    return new URL(page.url()).searchParams.get('post') ?? '';
}

/** Click Publish/Update once WordPress's autosave lock clears (a page-frame Update in place is awaited). */
export async function clickPublish(page: Page) {
    if (await inPlaceUpdate(page)) {
        const result = await clickUpdate(page);
        if (result.kind === 'update') {
            throw new Error(`Update in place ended "${result.detail.outcome}" instead of saving`);
        }
        return;
    }
    await pressPublish(page);
}

async function pressPublish(page: Page) {
    const publish = page.locator('#publish');
    if (await isPageFrame(page)) {
        // The page frame draws its own submits; the hidden #publish still carries the autosave lock.
        const submit = page.locator('.bfields-publish button[type=submit]').first();
        await expect(submit).toBeVisible({ timeout: 15_000 });
        await expect(publish).not.toHaveClass(/\bdisabled\b/, { timeout: 30_000 });
        await submit.click();
        return;
    }
    await expect(publish).toBeVisible({ timeout: 15_000 });
    await expect(publish).not.toHaveClass(/\bdisabled\b/, { timeout: 30_000 });
    await publish.click();
}

/** `bfields:update` detail (bfields ui/layout/updateInPlace.ts). */
export type InPlaceDetail = { unique: string; postId: number; outcome: string; location: string };

/** How a page-frame Update ended: saved in place, another in-place outcome, or a page load. */
export type UpdateResult = { kind: 'saved'; detail: InPlaceDetail } | { kind: 'update'; detail: InPlaceDetail } | { kind: 'loaded' };

/** Whether the open screen's Update will try to save in place (page frame on a published post). */
export async function inPlaceUpdate(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const root = document.querySelector('.bfields-root[data-frame="page"][data-editor]');
        try {
            const editor = JSON.parse(root?.getAttribute('data-editor') || '{}');
            return !!(editor.updateInPlace && editor.published);
        } catch {
            return false;
        }
    });
}

/** Records the next `bfields:update` / `bfields:update-settled` on window, for clickUpdate() and settled(). */
export async function armUpdateEvents(page: Page) {
    await page.evaluate(() => {
        const w = window as any;
        w.__bp3dE2eUpdate = null;
        w.__bp3dE2eSettled = null;
        document.addEventListener('bfields:update', (e) => (w.__bp3dE2eUpdate = (e as CustomEvent).detail), { once: true });
        document.addEventListener('bfields:update-settled', (e) => (w.__bp3dE2eSettled = (e as CustomEvent).detail), { once: true });
    });
}

/** Click the page frame's Update and wait for the in-place outcome or a new document, whichever comes first. */
export async function clickUpdate(page: Page, click?: () => Promise<void>): Promise<UpdateResult> {
    await armUpdateEvents(page);
    const never = new Promise<never>(() => {});
    const loaded = page.waitForEvent('domcontentloaded', { timeout: 60_000 }).then(() => ({ kind: 'loaded' as const }));
    const updated = page
        .waitForFunction(() => (window as any).__bp3dE2eUpdate, null, { timeout: 60_000 })
        .then((handle) => handle.jsonValue() as Promise<InPlaceDetail>)
        // The context goes away when the page loads; `loaded` then wins.
        .catch(() => never);

    await (click ? click() : pressPublish(page));
    const first = await Promise.race([loaded, updated.then((detail) => ({ kind: 'event' as const, detail }))]);

    if (first.kind === 'loaded') return first;
    if (first.detail.outcome === 'navigate') {
        await loaded;
        return { kind: 'loaded' };
    }
    loaded.catch(() => {});
    return { kind: first.detail.outcome === 'saved' ? 'saved' : 'update', detail: first.detail };
}

/** Wait for the in-place save's background reload of the edit screen to finish. */
export async function settled(page: Page): Promise<{ ok: boolean }> {
    const handle = await page.waitForFunction(() => (window as any).__bp3dE2eSettled, null, { timeout: 45_000 });
    return (await handle.jsonValue()) as { ok: boolean };
}

// ── Viewer editor screen (Codestar meta box, or bfields' page frame in Modern) ──

/** bfields' `'frame' => 'page'` editor: the whole post screen is drawn by the framework. */
export async function isPageFrame(page: Page): Promise<boolean> {
    return (await page.locator('body.bfields-page-editor').count()) > 0;
}

/** The viewer editor's field container: Codestar's `#_bp3dimages_` box or the page-frame root. */
export function viewerEditor(page: Page, unique = '_bp3dimages_'): Locator {
    return page.locator(`[id="${unique}"], .bfields-root[data-unique="${unique}"][data-frame="page"]`).first();
}

/** The visible post title input: the page frame's own, else WordPress's `#title`. */
export function postTitleInput(page: Page): Locator {
    return page.locator('input.bfields-title-input, #title').locator('visible=true').first();
}

/** Type the post title; the page frame mirrors it into the hidden `#title`. */
export async function fillPostTitle(page: Page, title: string) {
    const input = postTitleInput(page);
    await expect(input).toBeVisible({ timeout: 30_000 });
    await input.fill(title);
}

/** The shortcode copy button on the viewer edit screen (PHP bar in Classic, the page frame's chip in Modern). */
export function shortcodeButton(page: Page): Locator {
    return page.locator('.bfields-shortcode__chip, .bp3d_shortcode_copy_btn').locator('visible=true').first();
}

// ── Page errors ───────────────────────────────────────────────────────────────

// Our own static files: this plugin (its vendored lib/bfields included) or a standalone bfields plugin.
const OUR_ASSET = /\/wp-content\/plugins\/(?:3d-viewer[\w-]*|bfields)\//i;
const OUR_TEXT = /bp3d|3d-viewer|b3dviewer|model-?viewer|bfields/i;
const NOISE = /favicon|ResizeObserver loop/i;
const WHERE = '\n    at: ';

/** Start collecting console errors, uncaught exceptions and failed requests for our files. */
export function captureConsoleErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        // Resource failures carry no URL in their text; the network listeners below record ours.
        if (/^Failed to load resource|net::ERR_/i.test(text)) return;
        errors.push(`console: ${text}${WHERE}${msg.location().url || ''}`);
    });
    page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.message}${WHERE}${error.stack || ''}`);
    });
    page.on('response', (response) => {
        if (response.status() >= 400 && OUR_ASSET.test(response.url())) {
            errors.push(`HTTP ${response.status()}: ${response.url()}`);
        }
    });
    page.on('requestfailed', (request) => {
        const failure = request.failure()?.errorText || '';
        // ERR_ABORTED is the test navigating away mid-download.
        if (OUR_ASSET.test(request.url()) && !/ERR_ABORTED/i.test(failure)) {
            errors.push(`request failed (${failure}): ${request.url()}`);
        }
    });
    return errors;
}

/** Captured errors caused by this plugin or bfields; third-party scripts and favicon noise are dropped. */
export function pluginConsoleErrors(errors: string[]): string[] {
    return errors.filter((entry) => {
        const [text, where = ''] = entry.split(WHERE);
        if (NOISE.test(text)) return false;
        return /^(?:HTTP \d|request failed)/.test(text) || OUR_TEXT.test(text) || OUR_ASSET.test(where);
    });
}
