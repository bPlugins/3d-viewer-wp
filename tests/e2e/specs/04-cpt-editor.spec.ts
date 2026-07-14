import { test, expect, expectNoFatal } from '../fixtures';

test.describe('3D Model CPT editor', () => {
    test('Add New model opens the block editor with the viewer block pre-inserted', async ({
        page,
        admin,
        editor,
        requestUtils,
    }) => {
        await admin.createNewPost({
            postType: 'bp3d-model-viewer',
            title: 'E2E-3DV CPT Draft',
        });

        // The CPT forces a locked template containing exactly the viewer block.
        const block = editor.canvas.locator('[data-type="b3dviewer/modelviewer"]');
        await expect(block.first()).toBeVisible({ timeout: 30_000 });

        // Save as draft and make sure nothing explodes.
        await page.keyboard.press('ControlOrMeta+s');
        await expect(
            page
                .getByRole('button', { name: /Saved|Save draft|Update/i })
                .or(page.locator('.editor-post-saved-state.is-saved'))
                .first()
        ).toBeVisible({ timeout: 30_000 });
        await expectNoFatal(page);

        // Clean up the draft
        const postId = await page.evaluate(() =>
            (window as any).wp.data.select('core/editor').getCurrentPostId()
        );
        if (postId) {
            await requestUtils.rest({
                path: `/wp/v2/bp3d-model-viewer/${postId}`,
                method: 'DELETE',
                params: { force: true },
            });
        }
    });

    test('classic (CSF metabox) model edit screen renders metabox + shortcode area', async ({
        page,
        admin,
        state,
    }) => {
        // The classic-mode fixture post was seeded with _bp3d_is_gutenberg=0.
        // Its edit screen should NOT load the block editor.
        await admin.visitAdminPage('post.php', `post=${state.models.classic.id}&action=edit`);
        await expectNoFatal(page);
        await expect(page.locator('body')).not.toHaveClass(/block-editor-page/);

        // CSF metabox with the viewer fields
        await expect(page.locator('#_bp3dimages_')).toBeAttached();

        // Copyable shortcode under the title (new in 1.9.x)
        await expect(page.locator('.bp3d_shortcode_area_after_title')).toBeAttached();
        await expect(page.locator('.bp3d_shortcode_copy_btn').first()).toBeVisible();
    });

    test('live preview panel renders in the classic editor Preview section', async ({
        page,
        admin,
        state,
    }) => {
        await admin.visitAdminPage('post.php', `post=${state.models.classic.id}&action=edit`);

        // The Preview section is a CSF metabox tab — open it.
        await page
            .locator('#_bp3dimages_ .csf-nav a, #_bp3dimages_ .csf-nav .csf-tab-title')
            .filter({ hasText: /^Preview$/ })
            .first()
            .click();

        const root = page.locator('#bp3d-model-preview-root');
        await expect(root).toBeAttached();
        await expect
            .poll(async () => root.evaluate((el) => el.children.length).catch(() => 0), {
                timeout: 20_000,
                message: 'live preview React app should render',
            })
            .toBeGreaterThan(0);

        await expect(page.locator('.bp3d-model-preview__title').first()).toContainText(
            /Live Preview/i
        );
    });

    test('preview popup opens from the shortcode area button', async ({ page, admin, state }) => {
        await admin.visitAdminPage('post.php', `post=${state.models.classic.id}&action=edit`);

        const trigger = page.locator('#bp3d-preview-btn-root .bp3d-preview-popup-trigger');
        await expect(trigger).toBeVisible({ timeout: 20_000 });
        await trigger.click();

        await expect(page.locator('.bp3d-modal-overlay')).toBeVisible();
        await expect(page.locator('.bp3d-modal-title')).toContainText(/Live Preview/i);

        await page.locator('.bp3d-modal-close').click();
        await expect(page.locator('.bp3d-modal-overlay')).toBeHidden();
    });
});
