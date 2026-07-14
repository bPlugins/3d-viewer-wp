import path from 'path';
import { test, expect } from '../fixtures';

const FIXTURES = path.join(__dirname, '..', 'fixtures');

test.describe('3D model uploads (extended mime types)', () => {
    test('.glb upload is accepted with the correct mime type', async ({ requestUtils }) => {
        const media = await requestUtils.uploadMedia(path.join(FIXTURES, 'e2e-cube.glb'));
        expect(media.mime_type).toBe('model/gltf-binary');
        expect(media.source_url).toMatch(/\.glb$/);
        await requestUtils.deleteMedia(media.id);
    });

    test('.stl upload is accepted', async ({ requestUtils }) => {
        const media = await requestUtils.uploadMedia(path.join(FIXTURES, 'e2e-cube.stl'));
        expect(media.source_url).toMatch(/\.stl$/);
        await requestUtils.deleteMedia(media.id);
    });

    test('.obj upload is accepted', async ({ requestUtils }) => {
        const media = await requestUtils.uploadMedia(path.join(FIXTURES, 'e2e-cube.obj'));
        expect(media.source_url).toMatch(/\.obj$/);
        await requestUtils.deleteMedia(media.id);
    });

    test('double-extension file (evil.php.glb) can never execute as PHP', async ({
        requestUtils,
    }) => {
        // The hardening in ExtendMimeType refuses to whitelist *.php.* names;
        // WordPress core then stores it defused (e.g. "evil.php_.glb") with the
        // safe model mime. Whatever the path, the stored file must not be
        // servable as PHP.
        let media = null;
        try {
            media = await requestUtils.uploadMedia(path.join(FIXTURES, 'e2e-evil.php.glb'));
        } catch {
            return; // outright rejection is also a pass
        }
        expect(media.mime_type).toBe('model/gltf-binary');
        expect(media.source_url).not.toMatch(/\.php(\.|$)/i);
        await requestUtils.deleteMedia(media.id);
    });

    test('a .php upload is REJECTED', async ({ requestUtils }) => {
        // Depending on the utils version this either throws or returns the REST
        // error payload — both count as a rejection, as long as no attachment
        // with a usable URL was created.
        let result: any = null;
        try {
            result = await requestUtils.uploadMedia(path.join(FIXTURES, 'e2e-evil.glb.php'));
        } catch {
            return; // thrown = rejected = pass
        }
        expect(result?.id).toBeFalsy();
        expect(result?.code || '').toMatch(/rest_upload|not_allowed|error/i);
    });
});
