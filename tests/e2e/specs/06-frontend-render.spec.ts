import { test, expect, expectNoFatal, waitModelLoaded } from '../fixtures';

test.describe('Frontend rendering (seeded pages)', () => {
    test('block page renders the model with default controls', async ({
        page,
        state,
        pageErrors,
    }) => {
        await page.goto(state.pages.block.link);
        await expectNoFatal(page);

        const wrapper = page.locator('.wp-block-b3dviewer-modelviewer').first();
        await expect(wrapper).toBeAttached();

        // The hydration script consumes data-attributes, so assert on the live
        // viewer element: it must load exactly the uploaded model.
        const mv = await waitModelLoaded(page, '.wp-block-b3dviewer-modelviewer');
        expect(await mv.evaluate((el: any) => el.src)).toBe(state.glb.url);
        await expect(mv).toHaveAttribute('camera-controls', ''); // mouseControl default true
        expect(pageErrors).toHaveLength(0);
    });

    test('controls page shows camera, zoom and fullscreen buttons; fullscreen toggles', async ({
        page,
        state,
    }) => {
        await page.goto(state.pages.controls.link);
        await waitModelLoaded(page, '.wp-block-b3dviewer-modelviewer');

        await expect(page.locator('.control-btn.cameraBtn').first()).toBeVisible();
        await expect(page.locator('.control-btn.fullscreen-open').first()).toBeVisible();
        expect(await page.locator('.control-btn:visible').count()).toBeGreaterThanOrEqual(2);

        // Fullscreen toggle swaps the open/close button state
        await page.locator('.control-btn.fullscreen-open').first().click();
        await expect(page.locator('.control-btn.fullscreen-close').first()).toBeVisible();
        await page.locator('.control-btn.fullscreen-close').first().click();
        await expect(page.locator('.control-btn.fullscreen-open').first()).toBeVisible();
    });

    test('the exposure block setting reaches the model-viewer element', async ({
        page,
        state,
    }) => {
        // The controls page was seeded with exposure: 2 (new 1.9.0 setting).
        await page.goto(state.pages.controls.link);
        const mv = await waitModelLoaded(page, '.wp-block-b3dviewer-modelviewer');
        await expect(mv).toHaveAttribute('exposure', '2');
    });

    test('advanced (O3DV) viewer renders a WebGL canvas', async ({ page, state }) => {
        await page.goto(state.pages.advanced.link);
        await expectNoFatal(page);
        const wrapper = page.locator('.wp-block-b3dviewer-modelviewer').first();
        await expect(wrapper).toBeAttached();
        await expect(wrapper.locator('.online_3d_viewer').first()).toBeAttached({
            timeout: 30_000,
        });
        await expect(wrapper.locator('canvas').first()).toBeVisible({ timeout: 45_000 });
    });

    test('[3d_viewer] shortcode renders a block-built model', async ({ page, state }) => {
        await page.goto(state.pages.shortcodeBlock.link);
        await expectNoFatal(page);
        // Gutenberg-built models are re-rendered through the block renderer
        await expect(page.locator('.wp-block-b3dviewer-modelviewer').first()).toBeAttached();
        await waitModelLoaded(page, '.wp-block-b3dviewer-modelviewer');
    });

    test('[3d_viewer] shortcode renders a classic (metabox) model', async ({ page, state }) => {
        await page.goto(state.pages.shortcodeClassic.link);
        await expectNoFatal(page);

        const wrapper = page.locator('.modelViewerBlock').first();
        await expect(wrapper).toBeAttached();
        const mv = await waitModelLoaded(page, '.modelViewerBlock');
        expect(await mv.evaluate((el: any) => el.src)).toBe(state.glb.url);
    });

    test('[3d_viewer] with an invalid id fails gracefully', async ({ page, state }) => {
        const response = await page.goto(state.pages.shortcodeInvalid.link);
        expect(response!.status()).toBeLessThan(400);
        await expectNoFatal(page);
        await expect(page.locator('.modelViewerBlock')).toHaveCount(0);
        await expect(page.locator('.wp-block-b3dviewer-modelviewer')).toHaveCount(0);
    });
});
