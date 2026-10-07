import type { Page, Request } from '@playwright/test';
import { readState } from '../fixtures';
import { test, expect } from '../admin-ui';
import {
    WP_3D_MODEL_NEW,
    adminUi as screenUi,
    clickPublish,
    clickUpdate,
    editUrl,
    fillPostTitle,
    getFieldValue,
    inPlaceUpdate,
    openMetaboxTab,
    setSwitch,
    settled,
    useGutenbergDisabled,
} from '../helpers/wp-admin';
import { captureRaw, postField, postMeta, seedViewers } from '../helpers/records';
import { wp } from '../wp';

/**
 * Update without reload. In Modern, Update on a published viewer sends the same #post form to
 * post.php in the background; anything unusual falls back to the full-page save. Classic is not
 * opted in and always reloads.
 *
 * Viewers are seeded fresh per run in the free classic shape (helpers/viewer-seed.php) and left
 * for global-setup's E2E-3DV cleanup.
 */

const MARKER = 'bfields_in_place';
// Both live on the viewer's Settings tab and have no dependency.
const DOWNLOAD = '_bp3dimages_[bp_3d_download_btn]';
const FULLSCREEN = '_bp3dimages_[bp_3d_fullscreen]';

const seed = (count: number, tag: string, status: 'publish' | 'draft' | 'private' = 'publish') =>
    seedViewers(count, `ajax-save ${tag}`, readState().glb.url, status);

const isOn = (v: unknown) => !!v && v !== '0';

/** POSTs to post.php, with their decoded bodies. */
function recordPosts(page: Page): { request: Request; body: URLSearchParams }[] {
    const posts: { request: Request; body: URLSearchParams }[] = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && /\/wp-admin\/post\.php(\?|$)/.test(request.url())) {
            posts.push({ request, body: new URLSearchParams(request.postData() ?? '') });
        }
    });
    return posts;
}

function countLoads(page: Page): () => number {
    let loads = 0;
    page.on('domcontentloaded', () => loads++);
    return () => loads;
}

/** Whether any beforeunload listener (core's or bfields') would hold the page right now. */
const leaveGuarded = (page: Page) =>
    page.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
    });

async function openViewer(page: Page, id: number, mode: 'classic' | 'modern') {
    await page.goto(editUrl(id));
    expect(await screenUi(page), 'viewer screen interface').toBe(mode);
}

const saveChange = (page: Page) => page.locator('.bfields-publish .bfields-btn--save, .bfields-btn--save').filter({ visible: true });

test.describe('Update without reload – Modern', () => {
    test.skip(({ adminUi }) => adminUi !== 'modern', 'Modern project only');
    useGutenbergDisabled();

    test('Update on a published viewer saves without a page load', async ({ page }) => {
        const [id] = seed(1, 'in-place');
        await openViewer(page, id, 'modern');
        expect(await inPlaceUpdate(page), 'the viewer screen opts in').toBe(true);

        const before = captureRaw({ viewer: id });
        const loads = countLoads(page);
        const posts = recordPosts(page);
        const url = page.url();

        await page.evaluate(() => ((window as any).__bp3dAlive = 'alive'));
        await openMetaboxTab(page, 'Settings');
        await setSwitch(page, DOWNLOAD, true);
        await expect(saveChange(page), 'an edit shows Save Change').toHaveCount(1);

        await page.waitForTimeout(1_100); // post_modified has one-second resolution
        const result = await clickUpdate(page);
        expect(result.kind, 'Update saved in place').toBe('saved');

        expect(loads(), 'no page load').toBe(0);
        expect(page.url(), 'URL unchanged').toBe(url);
        expect(await page.evaluate(() => (window as any).__bp3dAlive), 'window state survives').toBe('alive');

        await expect(page.locator('.bfields-toast'), 'success is a toast').toHaveText(/Model Updated/);
        await expect(page.locator('#message, .bfields-update-notice'), 'no success notice').toHaveCount(0);
        await expect(saveChange(page), 'the store is clean').toHaveCount(0);

        expect(posts.length, 'one POST').toBe(1);
        expect(posts[0].body.get(MARKER), 'it carries the marker').toBe('_bp3dimages_');

        const after = captureRaw({ viewer: id });
        expect(after.modified, 'the post was saved').not.toBe(before.modified);
        expect(after.rows).toBe(1);
        expect(isOn(postMeta(id, '_bp3dimages_').bp_3d_download_btn), 'the edit is stored').toBe(true);

        expect((await settled(page)).ok, 'background reload of the edit screen').toBe(true);
        expect(await leaveGuarded(page), 'no leave-page prompt after the save').toBe(false);
    });

    test('the stored row equals what a native submit stores for the same edit', async ({ page }) => {
        const [a, b] = seed(2, 'bytes');
        const posts = recordPosts(page);

        await openViewer(page, a, 'modern');
        await openMetaboxTab(page, 'Settings');
        await setSwitch(page, DOWNLOAD, true);
        expect((await clickUpdate(page)).kind, 'A saves in place').toBe('saved');
        await settled(page);
        const inPlace = posts.at(-1)!;

        // B: a reply without the protocol makes the page go native for its next Update.
        await openViewer(page, b, 'modern');
        await openMetaboxTab(page, 'Settings');
        await setSwitch(page, DOWNLOAD, true);
        await page.route('**/wp-admin/post.php', (route) =>
            route.request().method() === 'POST' ? route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>no protocol</body></html>' }) : route.continue()
        );
        const unclear = await clickUpdate(page);
        await page.unroute('**/wp-admin/post.php');
        expect(unclear.kind === 'update' && unclear.detail.outcome, 'an unclear reply keeps the page').toBe('failed');

        const native = await clickUpdate(page);
        expect(native.kind, 'the next Update is the native submit').toBe('loaded');
        const nativePost = posts.at(-1)!;
        expect(nativePost.body.has(MARKER), 'native POST has no marker').toBe(false);

        expect(captureRaw({ viewer: a }).viewer, 'same _bp3dimages_ bytes').toBe(captureRaw({ viewer: b }).viewer);

        // Same form, field for field, apart from the marker.
        const names = (body: URLSearchParams) => [...body.keys()].filter((k) => k !== MARKER);
        expect(names(inPlace.body)).toEqual(names(nativePost.body));
        expect(JSON.parse(inPlace.body.get('bfields_values[_bp3dimages_]') ?? 'null')).toEqual(JSON.parse(nativePost.body.get('bfields_values[_bp3dimages_]') ?? 'null'));

        for (const id of [a, b]) {
            expect(postField(id, 'post_status'), `post ${id} status`).toBe('publish');
        }
    });

    test('first Publish of a new viewer still reloads', async ({ page }) => {
        const posts = recordPosts(page);
        await page.goto(WP_3D_MODEL_NEW);
        expect(await screenUi(page)).toBe('modern');
        expect(await inPlaceUpdate(page), 'a new post never saves in place').toBe(false);

        await fillPostTitle(page, `E2E-3DV ajax-save first publish ${Date.now()}`);

        const loaded = page.waitForEvent('domcontentloaded', { timeout: 60_000 });
        await clickPublish(page);
        await loaded;
        await page.waitForURL(/[?&]post=\d+/, { waitUntil: 'domcontentloaded' });

        expect(posts.length).toBeGreaterThan(0);
        expect(posts.some((p) => p.body.has(MARKER)), 'no POST carries the marker').toBe(false);
        expect(await inPlaceUpdate(page), 'once published, Update saves in place').toBe(true);
    });

    test('a private viewer saves in place too', async ({ page }) => {
        const [id] = seed(1, 'private', 'private');
        await openViewer(page, id, 'modern');
        const loads = countLoads(page);

        await openMetaboxTab(page, 'Settings');
        await setSwitch(page, DOWNLOAD, true);
        expect((await clickUpdate(page)).kind, 'Update saved in place').toBe('saved');
        expect(loads(), 'no page load').toBe(0);
        expect(isOn(postMeta(id, '_bp3dimages_').bp_3d_download_btn), 'the edit is stored').toBe(true);
        expect(postField(id, 'post_status'), 'still private').toBe('private');
    });

    test('a stale nonce keeps the edit, reports it, and the next Update saves it', async ({ page }) => {
        const [id] = seed(1, 'nonce');
        await openViewer(page, id, 'modern');
        const before = JSON.stringify(postMeta(id, '_bp3dimages_'));
        const loads = countLoads(page);

        await openMetaboxTab(page, 'Settings');
        await setSwitch(page, DOWNLOAD, true);
        await page.evaluate(() => {
            const nonce = document.getElementById('bfields_metabox_nonce__bp3dimages_') as HTMLInputElement;
            nonce.value = '0000000000';
        });

        const stale = await clickUpdate(page);
        expect(stale.kind === 'update' && stale.detail.outcome, 'the box was refused').toBe('renewed');
        await expect(saveChange(page), 'the edit is kept').toHaveCount(1);
        expect(JSON.stringify(postMeta(id, '_bp3dimages_')), 'settings not written').toBe(before);
        await settled(page);

        expect((await clickUpdate(page)).kind, 'the next Update saves').toBe('saved');
        expect(isOn(postMeta(id, '_bp3dimages_').bp_3d_download_btn), 'the edit is stored').toBe(true);
        expect(loads(), 'no page load').toBe(0);
    });

    test('a failed Update keeps the edit guarded', async ({ page }) => {
        const [id] = seed(1, 'failed');
        await openViewer(page, id, 'modern');

        await openMetaboxTab(page, 'Settings');
        await setSwitch(page, DOWNLOAD, true);
        expect((await clickUpdate(page)).kind).toBe('saved');
        await settled(page);

        await setSwitch(page, FULLSCREEN, !isOn(await getFieldValue(page, FULLSCREEN)));
        await page.route('**/wp-admin/post.php', (route) => (route.request().method() === 'POST' ? route.abort() : route.continue()));
        const failed = await clickUpdate(page);
        await page.unroute('**/wp-admin/post.php');
        expect(failed.kind === 'update' && failed.detail.outcome, 'the save could not be confirmed').toBe('failed');
        expect(await leaveGuarded(page), 'the unsaved edit guards a leave').toBe(true);

        expect((await clickUpdate(page)).kind, 'the next Update saves in place').toBe('saved');
        expect(await leaveGuarded(page), 'no guard once saved').toBe(false);
    });

    test('the bp3d_update_in_place kill switch is wired to bfields', async () => {
        // Read-only: the filter chain answers for the viewer box only.
        const out = wp([
            'eval',
            "add_filter('bp3d_update_in_place', '__return_false'); echo wp_json_encode([apply_filters('bfields_update_in_place', true, 0, '_bp3dimages_'), apply_filters('bfields_update_in_place', true, 0, '_bp3d_product_')]);",
        ]);
        expect(JSON.parse(out || '[]')).toEqual([false, true]);
    });
});

test.describe('Update without reload – Classic', () => {
    test.skip(({ adminUi }) => adminUi !== 'classic', 'Classic project only');

    test('Update reloads and never sends the marker', async ({ page }) => {
        const [id] = seed(1, 'classic');
        await openViewer(page, id, 'classic');
        expect(await inPlaceUpdate(page)).toBe(false);
        const posts = recordPosts(page);

        await openMetaboxTab(page, 'Settings');
        await setSwitch(page, DOWNLOAD, true);
        await page.evaluate(() => ((window as any).__bp3dAlive = 'alive'));

        const loaded = page.waitForEvent('domcontentloaded', { timeout: 60_000 });
        await clickPublish(page);
        await loaded;
        await page.waitForURL(/[?&]post=\d+/, { waitUntil: 'domcontentloaded' });
        expect(await page.evaluate(() => (window as any).__bp3dAlive), 'a new document').toBeUndefined();

        expect(posts.length).toBe(1);
        expect(posts[0].body.has(MARKER), 'no marker').toBe(false);
        expect((await posts[0].request.response())?.headers()['location'] ?? '', "core's redirect").toMatch(/[?&]message=1/);
        expect(isOn(postMeta(id, '_bp3dimages_').bp_3d_download_btn), 'the edit is stored').toBe(true);
    });
});
