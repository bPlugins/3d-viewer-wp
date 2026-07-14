import React from 'react';

const slug = '3d-viewer';

interface DashboardInfoInput {
    version: string;
    adminUrl?: string;
    isPremium?: boolean;
    licenseActiveNonce?: string;
}

export interface DashboardInfo {
    name: string;
    displayName: string;
    description: string;
    slug: string;
    version: string;
    adminUrl: string;
    isPremium: boolean;
    displayOurPlugins: boolean;
    media: {
        logo: string;
        banner: string;
        thumbnail: string;
        video: string;
        isYoutube: boolean;
    };
    pages: {
        org: string;
        landing: string;
        docs: string;
        pricing: string;
    };
    freemius: {
        product_id: number;
        plan_id: number;
        // public_key: string;
    };
    licenseActiveNonce?: string;
    startButton: {
        label: string;
        url: string;
    };
}

export const dashboardInfo = (info: DashboardInfoInput): DashboardInfo => {
    const { version, adminUrl = '', isPremium = false, licenseActiveNonce } = info;

    return {
        name: `3D Viewer`,
        displayName: `3D Viewer – Display Interactive 3D Models`,
        description: 'Easily display interactive 3D models on the web. Supported File type .glb, .gltf, .obj, .3ds, .stl, .ply, .off, .3dm, .fbx, .dae, .wrl, .3mf, .amf, .ifc, .brep, .step, .iges, .fcstd, .bim',
        slug,
        version,
        adminUrl,
        isPremium,
        displayOurPlugins: true,
        media: {
            logo: `https://ps.w.org/${slug}/assets/icon-128x128.png`,
            banner: `https://ps.w.org/${slug}/assets/banner-772x250.png`,
            thumbnail: window.bp3dDashboard?.dir + '/admin/images/3d-viewer.png',
            video: 'https://youtu.be/ofC8XbdAuVE',
            isYoutube: true
        },
        pages: {
            org: `https://wordpress.org/plugins/${slug}/`,
            landing: `https://bplugins.com/products/${slug}/`,
            docs: `https://bplugins.com/docs/${slug}/`,
            pricing: `https://bplugins.com/products/${slug}/pricing`,
        },
        freemius: {
            product_id: 8795,
            plan_id: 14970,
            // public_key: 'pk_5e6ce3f226c86e3b975b59ed84d6a'
        },
        licenseActiveNonce,
        startButton: {
            label: 'Start Now',
            url: `${adminUrl}/post-new.php?post_type=bp3d-model-viewer`
        }
    }
};

// ── Welcome page icons ─────────────────────────────────────────────────
const gutenbergTabIcon = <svg xmlns='http://www.w3.org/2000/svg' width="18" viewBox='0 0 512 512'><path d='M448 96V416H192V320l-64 64L64 320v96H32c-17.7 0-32-14.3-32-32V128c0-17.7 14.3-32 32-32H448zM192 96V224h96V96H192z' /></svg>;
const shortcodeTabIcon = <svg xmlns='http://www.w3.org/2000/svg' width="18" viewBox='0 0 640 512'><path d='M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z' /></svg>;
const elementorTabIcon = <svg xmlns='http://www.w3.org/2000/svg' width="18" viewBox='0 0 448 512'><path d='M427 0H21C9.4 0 0 9.4 0 21v470c0 11.6 9.4 21 21 21h406c11.6 0 21-9.4 21-21V21c0-11.6-9.4-21-21-21zM147 355h-38V157h38v198zm113 0h-38V157h38v198zm113 0h-38V157h38v198z' /></svg>;

/**
 * Welcome-only data — spread onto <Welcome /> alongside dashboardInfo props.
 * Called with adminUrl so Getting Started steps can build dynamic editor links.
 */
export const welcomeInfo = (adminUrl: string = '') => ({

    // ── Hero card keyword chips ────────────────────────────────────────
    keywords: ['GLB', 'GLTF', 'OBJ', 'STL', 'FBX', 'PLY', '3DS'],
    keywordsLabel: 'Formats',

    // ── Getting Started tabbed steps ───────────────────────────────────
    gettingStarted: {
        tabs: [
            {
                key: 'gutenberg',
                label: 'Gutenberg',
                icon: gutenbergTabIcon,
                steps: [
                    {
                        num: 1,
                        title: 'Add the Block',
                        body: 'In the block editor, click <strong>+</strong> or type <strong>/3D Model Viewer</strong> to insert the block.',
                        link: { url: `${adminUrl}/post-new.php?post_type=page`, label: 'Open Editor' }
                    },
                    { num: 2, title: 'Upload & Configure', body: 'Add your 3D file (<code>.glb</code>, <code>.gltf</code>, <code>.obj</code>, and more) and adjust size, camera controls, auto-rotate, and lighting right in the block sidebar.' },
                    { num: 3, title: 'Publish', body: 'Preview the interactive model, then publish your post or page.' }
                ]
            },
            {
                key: 'elementor',
                label: 'Elementor',
                icon: elementorTabIcon,
                steps: [
                    { num: 1, title: 'Add the Widget', body: 'Edit any page with Elementor, search the widget panel for <strong>Model Viewer</strong>, and drag it onto your layout.' },
                    { num: 2, title: 'Upload & Configure', body: 'Add your 3D file (<code>.glb</code>, <code>.gltf</code>, <code>.obj</code>, and more) and adjust size, camera controls, and auto-rotate in the widget settings.' },
                    { num: 3, title: 'Publish', body: 'Fine-tune the layout, then click <strong>Publish</strong>.' }
                ]
            },
            {
                key: 'shortcode',
                label: 'Shortcode',
                icon: shortcodeTabIcon,
                steps: [
                    {
                        num: 1,
                        title: 'Create a 3D Model',
                        body: 'Go to <strong>3D Viewer &rsaquo; Add New</strong>, upload your file, and publish the model.',
                        link: { url: `${adminUrl}/post-new.php?post_type=bp3d-model-viewer`, label: 'Add New Model' }
                    },
                    { num: 2, title: 'Copy the Shortcode', body: 'Use the <strong>Copy Shortcode</strong> button on the model edit screen (or the <strong>ShortCode</strong> column in the models list) to grab its <code>[3d_viewer id="…"]</code> code.' },
                    { num: 3, title: 'Paste & Publish', body: 'Paste the shortcode into any post, page, or widget, then update to view your interactive 3D model.' }
                ]
            }
        ]
    },

    // ── Changelogs (badge-prefixed list items) ─────────────────────────
    changelogs: [
        {
            version: '1.9.0 - 15 July, 2026',
            type: 'new',
            list: [
                '<strong>New:</strong> Added Augmented Reality (AR) support with WebXR, Scene Viewer, and Quick Look modes, including QR code access to view models in AR from mobile devices.',
                '<strong>New:</strong> Added an iOS-specific (.usdz) model source for AR Quick Look on Apple devices.',
                '<strong>New:</strong> Added Exposure and Shadow Intensity controls for the Model Viewer.',
                '<strong>New:</strong> Added a live 3D model preview panel to the editor metabox.',
                '<strong>New:</strong> Added an Extensions catalog and manager to the admin dashboard.',
                '<strong>Update:</strong> Refactored the admin dashboard with section icons and an improved layout.',
                '<strong>Fixed:</strong> Resolved 3D viewer resize and preview crash issues.',
            ]
        }
    ],
    changelogsLimit: 6,
    changelogsReadMoreLabel: 'View More Changelogs',

    // ── Pro upsell bullets (free users only) ───────────────────────────
    proFeatures: [
        'Adjust lighting, shadow intensity, and exposure.',
        'Enable or disable auto-rotate, fullscreen, and autoplay.',
        'Set Initial View.',
        'Display Hotspots/Annotations on 3D model.',
        'Lock X/Y Axis Rotation.',
        'AR Feature'
    ],
});

interface DemoItem {
    title: string;
    url: string;
    icon: React.ReactNode;
    type: string;
}

interface DemoInfo {
    demos: DemoItem[];
}

const cubeIcon = <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 512 512'><path d='M234.5 5.7c13.9-5 29.1-5 43.1 0l192 68.6C495 83.4 512 107.5 512 134.6V377.4c0 27-17 51.2-42.5 60.3l-192 68.6c-13.9 5-29.1 5-43.1 0l-192-68.6C17 428.6 0 404.5 0 377.4V134.6c0-27 17-51.2 42.5-60.3l192-68.6zM256 66L82.3 128 256 190l173.7-62L256 66zm32 368.6l160-57.1v-188L288 246.6v188z' /></svg>;

export const demoInfo: DemoInfo = {
    demos: [
        {
            title: "WooCommerce Product 3D view",
            url: "https://3d-viewer.bplugins.com/product/relaxation-chair/",
            icon: cubeIcon,
            type: 'iframe'
        },
        {
            title: "Default",
            url: "https://3d-viewer.bplugins.com/demo/demo-1-default/",
            icon: cubeIcon,
            type: 'iframe'
        },
        {
            title: "Custom Width",
            url: "https://3d-viewer.bplugins.com/demo/demo-2-custom-width/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 448 512'><path d='M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z' /></svg>,
            type: 'iframe'
        },
        {
            title: "Disable Zoom",
            url: "https://3d-viewer.bplugins.com/demo/demo-3-disable-zoom/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 512 512'><path d='M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM136 184c-13.3 0-24 10.7-24 24s10.7 24 24 24H280c13.3 0 24-10.7 24-24s-10.7-24-24-24H136z' /></svg>,
            type: 'iframe'
        },
        {
            title: "Disable Auto Rotate",
            url: "https://3d-viewer.bplugins.com/demo/demo-4-disable-auto-rotate/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 512 512'><path d='M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z' /></svg>,
            type: 'iframe'
        },
        {
            title: "Lazy Loading",
            url: "https://3d-viewer.bplugins.com/demo/demo-5-lazy-loading/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 512 512'><path d='M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z' /></svg>,
            type: 'iframe'
        },
        {
            title: "Eager Loading",
            url: "https://3d-viewer.bplugins.com/demo/demo-6-eager-loading/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 512 512'><path d='M18.4 445c11.2 5.3 24.5 3.6 34.1-4.4L224 297.7V416c0 12.4 7.2 23.7 18.4 29s24.5 3.6 34.1-4.4L448 297.7V416c0 17.7 14.3 32 32 32s32-14.3 32-32V96c0-17.7-14.3-32-32-32s-32 14.3-32 32V214.3L276.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S224 83.6 224 96V214.3L52.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S0 83.6 0 96V416c0 12.4 7.2 23.7 18.4 29z' /></svg>,
            type: 'iframe'
        },
        {
            title: "Multiple",
            url: "https://3d-viewer.bplugins.com/demo/demo-7-gallery/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 576 512'><path d='M290.8 48.6l78.4 29.7L288 109.5 206.8 78.3l78.4-29.7c1.8-.7 3.8-.7 5.7 0zM136 92.5V204.7c-1.3 .4-2.6 .8-3.9 1.3l-96 36.4C14.4 250.6 0 271.5 0 294.7V413.9c0 22.2 13.1 42.3 33.5 51.3l96 42.2c14.4 6.3 30.7 6.3 45.1 0L288 457.5l113.5 49.9c14.4 6.3 30.7 6.3 45.1 0l96-42.2c20.3-8.9 33.5-29.1 33.5-51.3V294.7c0-23.3-14.4-44.1-36.1-52.4l-96-36.4c-1.3-.5-2.6-.9-3.9-1.3V92.5c0-23.3-14.4-44.1-36.1-52.4l-96-36.4c-12.8-4.8-26.9-4.8-39.7 0l-96 36.4C150.4 48.4 136 69.3 136 92.5zM392 210.6l-82.4 31.2V152.6L392 121v89.6zM154.8 250.9l78.4 29.7L152 311.7 70.8 280.6l78.4-29.7c1.8-.7 3.8-.7 5.7 0zm18.8 204.4V354.8L256 323.2v95.9l-82.4 36.2zM421.2 250.9c1.8-.7 3.8-.7 5.7 0l78.4 29.7L424 311.7l-81.2-31.1 78.4-29.7zM523.2 421.2l-77.6 34.1V354.8L528 323.2v90.7c0 3.2-1.9 6-4.8 7.3z' /></svg>,
            type: 'iframe'
        },
        {
            title: "WooCommerce- Top of the image",
            url: "https://3d-viewer.bplugins.com/demo/demo-8-woocommerce-top-of-the-image/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 16 16' id='align-top'><rect width='4' height='12' rx='1' transform='matrix(1 0 0 -1 6 15)' /><path d='M1.5 2a.5.5 0 0 1 0-1zm13-1a.5.5 0 0 1 0 1zm-13 0h13v1h-13z' /></svg>,
            type: 'iframe'
        },
        {
            title: "WooCommerce- Bottom of the image",
            url: "https://3d-viewer.bplugins.com/demo/demo-9-woocommerce-bottom-of-the-image/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 16 16' id='align-bottom'><rect width='4' height='12' x='6' y='1' rx='1' /><path d='M1.5 14a.5.5 0 0 0 0 1zm13 1a.5.5 0 0 0 0-1zm-13 0h13v-1h-13z' /></svg>,
            type: 'iframe'
        },
        {
            title: "WooCommerce- Replace product image",
            url: "https://3d-viewer.bplugins.com/demo/demo-10-woocommerce-replace-product-image/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 512 512'><path d='M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160H352c-17.7 0-32 14.3-32 32s14.3 32 32 32H463.5c0 0 0 0 0 0h.4c17.7 0 32-14.3 32-32V80c0-17.7-14.3-32-32-32s-32 14.3-32 32v35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1V432c0 17.7 14.3 32 32 32s32-14.3 32-32V396.9l17.6 17.5 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H48.4c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z' /></svg>,
            type: 'iframe'
        },
        {
            title: "WooCommerce- Variants",
            url: "https://3d-viewer.bplugins.com/demo/demo-11-woocommerce-variants/",
            icon: <svg xmlns='http://www.w3.org/2000/svg' width="20" viewBox='0 0 576 512'><path d='M264.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 149.8C37.4 145.8 32 137.3 32 128s5.4-17.9 13.9-21.8L264.5 5.2zM476.9 209.6l53.2 24.6c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 277.8C37.4 273.8 32 265.3 32 256s5.4-17.9 13.9-21.8l53.2-24.6 152 70.2c23.4 10.8 50.4 10.8 73.8 0l152-70.2zm-152 198.2l152-70.2 53.2 24.6c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 405.8C37.4 401.8 32 393.3 32 384s5.4-17.9 13.9-21.8l53.2-24.6 152 70.2c23.4 10.8 50.4 10.8 73.8 0z' /></svg>,
            type: 'iframe'
        }
    ]
};

interface PricingInfo {
    logo: string;
    pluginId: number;
    planIds: number[];
    licenses: (number | null)[];
    button: { label: string };
    featured: { selected: number };
}

export const pricingInfo: PricingInfo = {
    logo: `https://ps.w.org/${slug}/assets/icon-128x128.png`,
    pluginId: 8795,
    planIds: [14970, 52950],
    licenses: [1, 3, null],
    button: {
        label: 'Buy Now ➜'
    },
    featured: {
        selected: 3,
    }
};
