import path from 'path';
import { test, expect, expectNoFatal, insertBlockSafely } from '../fixtures';

const FIXTURES = path.join(__dirname, '..', 'fixtures');

/**
 * Baseline WordPress functionality with the plugin active — the plugin hooks
 * into upload_mimes, the block editor, and the frontend, so core flows are
 * exactly where a regression would surface.
 */
test.describe('WordPress core (regression with plugin active)', () => {
    const created: number[] = [];

    test.afterAll(async ({ requestUtils }) => {
        for (const id of created) {
            await requestUtils
                .rest({ path: `/wp/v2/posts/${id}`, method: 'DELETE', params: { force: true } })
                .catch(() => {});
        }
    });

    test('write and publish a standard post, see it on the frontend', async ({
        page,
        admin,
        editor,
        pageErrors,
    }) => {
        const body = 'E2E-3DV core publishing still works.';

        await admin.createNewPost({ title: 'E2E-3DV Core Post' });
        await insertBlockSafely(page, editor, 'core/paragraph', { content: body });

        const postId = await editor.publishPost();
        created.push(postId!);

        await page.goto(`/?p=${postId}`);
        await expectNoFatal(page);
        await expect(page.getByText(body)).toBeVisible();
        expect(pageErrors).toHaveLength(0);
    });

    test('a regular image upload still works (upload_mimes filter regression)', async ({
        requestUtils,
    }) => {
        // The plugin filters upload_mimes to add 3D types — normal uploads
        // must remain untouched.
        const media = await requestUtils.uploadMedia(path.join(FIXTURES, 'e2e-image.png'));
        expect(media.mime_type).toBe('image/png');
        expect(media.source_url).toMatch(/\.png$/);
        await requestUtils.deleteMedia(media.id);
    });

    test('media library grid loads without errors', async ({ page, admin, pageErrors }) => {
        await admin.visitAdminPage('upload.php');
        await expectNoFatal(page);
        await expect(page.locator('.media-frame, #wp-media-grid').first()).toBeVisible();
        expect(pageErrors).toHaveLength(0);
    });
});
