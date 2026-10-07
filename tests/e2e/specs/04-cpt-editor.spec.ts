import { expectNoFatal } from '../fixtures';
import { test, expect } from '../admin-ui';
import { adminUi, editUrl, openMetaboxTab, shortcodeButton } from '../helpers/wp-admin';

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

    test('classic-editor model edit screen renders the fields + shortcode', async ({
        page,
        state,
        adminUi: mode,
    }) => {
        // The classic-mode fixture post was seeded with _bp3d_is_gutenberg=0.
        // Its edit screen should NOT load the block editor.
        await page.goto(editUrl(state.models.classic.id));
        await expectNoFatal(page);
        await expect(page.locator('body')).not.toHaveClass(/block-editor-page/);

        const ui = await adminUi(page);
        if (mode) expect(ui, 'viewer screen interface').toBe(mode);
        const shortcode = `[3d_viewer id='${state.models.classic.id}']`;

        if (ui === 'classic') {
            // Codestar metabox + copyable shortcode under the title (new in 1.9.x)
            await expect(page.locator('#_bp3dimages_')).toBeAttached();
            await expect(page.locator('.bp3d_shortcode_area_after_title')).toBeAttached();
            await expect(page.locator('.bp3d_shortcode_copy_btn').first()).toBeVisible();
            await expect(shortcodeButton(page)).toContainText(shortcode);
            return;
        }

        // Modern: bfields draws the whole page; the shortcode is its chip, not the PHP bar.
        await expect(page.locator('.bfields-root[data-unique="_bp3dimages_"][data-frame="page"]')).toBeAttached();
        await expect(page.locator('.bfields-shortcode__chip').first()).toContainText(shortcode);
        await expect(page.locator('.bp3d_shortcode_area_after_title')).toHaveCount(0);
        // The interface line moves from the hidden Publish box into the side card.
        await expect(page.locator('#submitdiv .bp3d-admin-ui-row')).toBeAttached();
    });

    test('live preview renders for the classic-editor model', async ({ page, state, adminUi: mode }) => {
        await page.goto(editUrl(state.models.classic.id));
        const ui = await adminUi(page);
        if (mode) expect(ui, 'viewer screen interface').toBe(mode);

        if (ui === 'modern') {
            // The side card previews the model next to the fields.
            const side = page.locator('#bfields-side-_bp3dimages_');
            await expect(side).toBeAttached({ timeout: 30_000 });
            await expect(side.locator('.bp3d-side-preview__stage').first()).toBeAttached({ timeout: 30_000 });
            await expect(side.locator('model-viewer').first()).toBeAttached({ timeout: 30_000 });
        }

        // The Preview section (a Codestar tab, or bfields' stage card) mounts the React app.
        await openMetaboxTab(page, 'Preview');
        const root = page.locator('#bp3d-model-preview-root').locator('visible=true').first();
        await expect(root).toBeAttached();
        await expect
            .poll(async () => root.evaluate((el) => el.children.length).catch(() => 0), {
                timeout: 20_000,
                message: 'live preview React app should render',
            })
            .toBeGreaterThan(0);

        if (ui === 'classic') {
            await expect(page.locator('.bp3d-model-preview__title').first()).toContainText(/Live Preview/i);
        } else {
            // Inside the stage card the preview is drawn bare (no own header).
            await expect(root.locator('.bp3d-model-preview--bare').first()).toBeAttached();
        }
    });

    test('preview popup opens from the Live Preview box button', async ({ page, state, adminUi: mode }) => {
        await page.goto(editUrl(state.models.classic.id));
        const ui = await adminUi(page);
        if (mode) expect(ui, 'viewer screen interface').toBe(mode);

        if (ui === 'modern') {
            // Modern previews in the side card; the Live Preview box is not registered.
            await expect(page.locator('#bp3d_live_preview')).toHaveCount(0);
            return;
        }

        const trigger = page.locator('#bp3d-preview-btn-root .bp3d-preview-popup-trigger');
        await expect(trigger).toBeVisible({ timeout: 20_000 });
        await trigger.click();

        await expect(page.locator('.bp3d-modal-overlay')).toBeVisible();
        await expect(page.locator('.bp3d-modal-title')).toContainText(/Live Preview/i);

        await page.locator('.bp3d-modal-close').click();
        await expect(page.locator('.bp3d-modal-overlay')).toBeHidden();
    });
});
