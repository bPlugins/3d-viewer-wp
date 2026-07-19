import {
    test,
    expect,
    expectNoFatal,
    waitModelLoaded,
    insertViewerBlock,
    openSettingsSidebar,
} from '../fixtures';

/** Full "model" object (object attributes are not merged with defaults). */
function modelObject(url: string) {
    return {
        modelUrl: url,
        skyboxImage: null,
        environmentImage: null,
        arEnabled: false,
        arPlacement: 'floor',
        arMode: 'quick-look',
        arScale: 'fixed',
    };
}

test.describe('Authoring in the block editor', () => {
    const created: number[] = [];

    test.afterAll(async ({ requestUtils }) => {
        for (const id of created) {
            await requestUtils
                .rest({ path: `/wp/v2/posts/${id}`, method: 'DELETE', params: { force: true } })
                .catch(() => {});
        }
    });

    test('fresh block shows the upload placeholder, then renders once a model URL is set', async ({
        admin,
        editor,
        page,
        state,
    }) => {
        await admin.createNewPost({ title: 'E2E-3DV Placeholder Post' });
        await insertViewerBlock(page, editor);

        const block = editor.canvas.locator('[data-type="b3dviewer/modelviewer"]').first();
        await expect(block).toBeVisible();
        await expect(block.locator('.upload3d')).toContainText(/Upload a 3D Model to Start/i);

        // Set the model URL through the store (the sidebar media control is a
        // custom component; the attribute contract is what render.php consumes).
        await page.evaluate(
            ([model]) => {
                const { select, dispatch } = (window as any).wp.data;
                const blocks = select('core/block-editor')
                    .getBlocks()
                    .filter((b: any) => b.name === 'b3dviewer/modelviewer');
                dispatch('core/block-editor').updateBlockAttributes(blocks[0].clientId, { model });
            },
            [modelObject(state.glb.url)]
        );

        // The editor canvas now renders the real viewer
        await expect(block.locator('model-viewer')).toBeAttached({ timeout: 30_000 });

        const postId = await editor.publishPost();
        created.push(postId!);
    });

    test('block sidebar shows Settings/Style tabs and the exposure control', async ({
        admin,
        editor,
        page,
        state,
    }) => {
        await admin.createNewPost({ title: 'E2E-3DV Sidebar Post' });
        await insertViewerBlock(page, editor, { model: modelObject(state.glb.url) });
        await editor.canvas.locator('[data-type="b3dviewer/modelviewer"]').first().click();
        await openSettingsSidebar(page);

        const tabs = page.locator('.b3dviewer-tab-panel');
        await expect(tabs).toBeVisible();
        await expect(tabs.getByRole('tab', { name: 'Settings' })).toBeVisible();
        await expect(tabs.getByRole('tab', { name: 'Style' })).toBeVisible();

        // Options panel (Lite viewer) contains the new Exposure range control
        const optionsPanel = page
            .getByLabel('Editor settings')
            .getByRole('button', { name: 'Options', exact: true });
        await expect(optionsPanel).toBeVisible();
        await optionsPanel.click();
        await expect(page.getByText('Exposure', { exact: true }).first()).toBeVisible();

        // Style tab
        await tabs.getByRole('tab', { name: 'Style' }).click();
        await expect(page.getByText('Background Color').first()).toBeVisible();

        const postId = await editor.publishPost();
        created.push(postId!);
    });

    test('insert viewer block, publish, and see the model on the frontend', async ({
        page,
        admin,
        editor,
        state,
        pageErrors,
    }) => {
        await admin.createNewPost({ title: 'E2E-3DV Editor Post' });
        await insertViewerBlock(page, editor, { model: modelObject(state.glb.url) });

        await expect(
            editor.canvas.locator('[data-type="b3dviewer/modelviewer"]').first()
        ).toBeVisible();

        const postId = await editor.publishPost();
        created.push(postId!);

        await page.goto(`/?p=${postId}`);
        const wrapper = page.locator('.wp-block-b3dviewer-modelviewer').first();
        await expect(wrapper).toBeAttached();

        // The hydration script consumes data-attributes, so assert on the live
        // viewer element instead: it must load exactly our uploaded model.
        const mv = await waitModelLoaded(page, '.wp-block-b3dviewer-modelviewer');
        expect(await mv.evaluate((el: any) => el.src)).toBe(state.glb.url);
        await expectNoFatal(page);
        expect(pageErrors).toHaveLength(0);
    });
});
