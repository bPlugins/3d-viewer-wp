import type { FindingId } from './types';

/**
 * Finding → troubleshooting anchor, copied from Pro (which lints the slugs against the docs build).
 * Slugs are the live bDocs Toc ids, i.e. the slug of the heading text, never the repo's `id="troubleshooting-*"`.
 */

/** Live URL unverified until Phase 0 pulls the bDocs REST tree. */
export const TROUBLESHOOTING_URL = 'https://bplugins.com/docs/3d-viewer/troubleshooting/';

export interface Anchor {
    /** Heading text in docs/src/pages/33-troubleshooting.html. */
    title: string;
    slug: string;
}

const NOT_GLTF: Anchor = { title: 'If the file is not GLB or glTF', slug: 'if-the-file-is-not-glb-or-gltf' };
const HTTP: Anchor = { title: 'If the link starts with http://', slug: 'if-the-link-starts-with-http' };
const NO_DOWNLOAD: Anchor = { title: 'If the file does not download', slug: 'if-the-file-does-not-download' };

export const ANCHORS: Record<FindingId, Anchor> = {
    H01: NOT_GLTF,
    H01b: NOT_GLTF,
    H02: NOT_GLTF,
    H03: HTTP,
    H03n: HTTP,
    H04: NO_DOWNLOAD,
    H05: { title: 'If the link opens a web page instead of a file', slug: 'if-the-link-opens-a-web-page-instead-of-a-file' },
    H06: {
        title: 'If you are uploading a .gltf file with separate .bin or texture files',
        slug: 'if-you-are-uploading-a-gltf-file-with-separate-bin-or-texture-files',
    },
    H07: { title: 'If the file is on another website', slug: 'if-the-file-is-on-another-website' },
    H07u: NO_DOWNLOAD,
    H09: { title: 'If the file is very large', slug: 'if-the-file-is-very-large' },
    H11: { title: 'If the viewer box stays empty', slug: 'if-the-viewer-box-stays-empty' },
    H12: { title: 'If the model is compressed with meshopt', slug: 'if-the-model-is-compressed-with-meshopt' },
    H13: {
        title: 'If the model is compressed (Draco or KTX2) or is a STEP file',
        slug: 'if-the-model-is-compressed-draco-or-ktx2-or-is-a-step-file',
    },
    H14: { title: 'The model shows up white, with no colors', slug: 'the-model-shows-up-white-with-no-colors' },
};

export const anchorUrl = (id: FindingId): string => {
    const anchor = ANCHORS[id];
    return anchor ? `${TROUBLESHOOTING_URL}#${anchor.slug}` : TROUBLESHOOTING_URL;
};
