import { test, expect, expectNoFatal, waitModelLoaded } from '../fixtures';

test.describe('Elementor integration', () => {
    test('the Model Viewer widget renders and loads the model on the frontend', async ({
        page,
        state,
        pageErrors,
    }) => {
        test.skip(
            !state.elementorActive || !state.elementorPage,
            'Elementor is not active on this site'
        );

        await page.goto(state.elementorPage!.link);
        await expectNoFatal(page);

        // Widget server render outputs the mount node…
        const wrapper = page.locator('.modelViewerBlock.elementor').first();
        await expect(wrapper).toBeAttached();

        // …and the public script hydrates it into a live viewer.
        const mv = await waitModelLoaded(page, '.modelViewerBlock');
        expect(await mv.evaluate((el: any) => el.src)).toBe(state.glb.url);
        expect(pageErrors).toHaveLength(0);
    });
});
