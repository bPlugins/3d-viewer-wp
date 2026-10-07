import { __, sprintf } from '@wordpress/i18n';

const slug = '3d-viewer';
// Freemius IDs; Compare reads freemius.product_id and Pricing reads pricingInfo, so both shapes stay.
const productId = 8795;
const proPlanId = 14970;

const newViewerUrl = (adminUrl: string) => `${adminUrl}/post-new.php?post_type=bp3d-model-viewer`;

/** Guided-setup state, mirroring BP3D\Base\Onboarding::state(). */
interface OnboardingState {
    completed: boolean;
    percent: number;
}

export interface ExtensionItem {
    id: string;
    name: string;
    version: string;
    status: 'active' | 'disabled' | 'incompatible' | 'missing_dependency' | 'unlicensed' | 'error';
    installed: boolean;
    enabled: boolean;
    compatible: boolean;
    plugin_present?: boolean;
    plugin_active?: boolean;
    missing_plugins: { name: string; slug: string; installed: boolean; action: 'activate' | 'install' | ''; url: string }[];
    is_paid: boolean;
    premium_host_only: boolean;
    licensed: boolean;
    max_plan: boolean;
    reload: '' | 'notice' | 'auto';
    // An empty object serialises as [] from PHP.
    checkout: { plugin_id?: string; public_key?: string; plan_id?: string; pricing_id?: number } | [];
    meta: { icon_url?: string; short_description?: string; homepage_url?: string; author?: string; author_url?: string };
    available: { installable: boolean; price_label: string };
}

export interface ExtensionsData {
    items: ExtensionItem[];
    restPath: string;
    ajaxUrl: string;
    ajaxNonce: string;
    licenseAction: string;
    isMaxPlan: boolean;
    canInstall: boolean;
    checkoutEnabled: boolean;
    buyer: { email: string; first: string; last: string };
}

interface DashboardInfoInput {
    version: string;
    isPremium?: boolean;
    adminUrl?: string;
    canManageOptions?: boolean;
    canInstallPlugins?: boolean;
    canActivatePlugins?: boolean;
    extensions?: ExtensionsData | null;
    setupUrl?: string;
    onboarding?: OnboardingState;
}

export interface DashboardInfo {
    name: string;
    slug: string;
    version: string;
    isPremium: boolean;
    pages: {
        docs: string;
        support: string;
        community: string;
        review: string;
    };
    links: {
        newViewer: string;
        viewers: string;
        settings: string;
        extensions: string;
    };
    freemius: {
        product_id: number;
    };
    canManageOptions: boolean;
    canInstallPlugins: boolean;
    canActivatePlugins: boolean;
    extensions: ExtensionsData | null;
    adminUrl: string;
    setupUrl: string;
    onboarding: OnboardingState;
}

export const dashboardInfo = (info: DashboardInfoInput): DashboardInfo => {
    const { version, isPremium = false, adminUrl = '', canManageOptions = false, canInstallPlugins = false, canActivatePlugins = false, extensions = null, setupUrl = '', onboarding } = info;
    const cleanAdminUrl = adminUrl.replace(/\/+$/, '');

    return {
        name: '3D Viewer',
        slug,
        version,
        isPremium,
        pages: {
            docs: `https://bplugins.com/docs/${slug}/`,
            support: 'https://bplugins.com/support/',
            community: 'https://facebook.com/groups/1828495198556137',
            review: `https://wordpress.org/support/plugin/${slug}/reviews/#new-post`,
        },
        links: {
            newViewer: newViewerUrl(cleanAdminUrl),
            viewers: `${cleanAdminUrl}/edit.php?post_type=bp3d-model-viewer`,
            settings: `${cleanAdminUrl}/edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings`,
            extensions: `${cleanAdminUrl}/edit.php?post_type=bp3d-model-viewer&page=bpem-3d-viewer-extensions`,
        },
        freemius: {
            product_id: productId
        },
        canManageOptions,
        canInstallPlugins,
        canActivatePlugins,
        extensions,
        adminUrl: cleanAdminUrl,
        setupUrl,
        // Treated as done when the page didn't say, so the nav never nags without cause.
        onboarding: onboarding || { completed: true, percent: 100 }
    }
};

// Takes dashboardInfo's adminUrl, which is already trimmed.
export const welcomeInfo = (cleanAdminUrl: string) => {
    return {
        gettingStarted: {
            tabs: [
                {
                    key: 'gutenberg',
                    label: 'Gutenberg',
                    steps: [
                        { title: __('Add the Block', '3d-viewer'), body: __('In the block editor, click <strong>+</strong> or type <strong>/3D Model Viewer</strong> to insert the block.', '3d-viewer'), link: { url: `${cleanAdminUrl}/post-new.php?post_type=page`, label: __('Open Editor', '3d-viewer') } },
                        { title: __('Upload & Configure', '3d-viewer'), body: __('Add your 3D file (<code>.glb</code>, <code>.gltf</code>, <code>.obj</code>, and more) and adjust size, camera controls, auto-rotate, and lighting right in the block sidebar.', '3d-viewer') },
                        { title: __('Publish', '3d-viewer'), body: __('Preview the interactive model, then publish your post or page.', '3d-viewer') }
                    ]
                },
                {
                    key: 'elementor',
                    label: 'Elementor',
                    steps: [
                        { title: __('Add the Widget', '3d-viewer'), body: __('Edit any page with Elementor, search the widget panel for <strong>Model Viewer</strong>, and drag it onto your layout.', '3d-viewer') },
                        { title: __('Upload & Configure', '3d-viewer'), body: __('Add your 3D file (<code>.glb</code>, <code>.gltf</code>, <code>.obj</code>, and more) and adjust size, camera controls, and auto-rotate in the widget settings.', '3d-viewer') },
                        { title: __('Publish', '3d-viewer'), body: __('Fine-tune the layout, then click <strong>Publish</strong>.', '3d-viewer') }
                    ]
                },
                {
                    key: 'shortcode',
                    label: __('Shortcode', '3d-viewer'),
                    steps: [
                        { title: __('Create a 3D Model', '3d-viewer'), body: __('Go to <strong>3D Viewer &rsaquo; Add New</strong>, upload your file, and publish the model.', '3d-viewer'), link: { url: newViewerUrl(cleanAdminUrl), label: __('Add New Model', '3d-viewer') } },
                        { title: __('Copy the Shortcode', '3d-viewer'), body: __('Use the <strong>Copy Shortcode</strong> button on the model edit screen (or the <strong>ShortCode</strong> column in the models list) to grab its <code>[3d_viewer id="…"]</code> code.', '3d-viewer') },
                        { title: __('Paste & Publish', '3d-viewer'), body: __('Paste the shortcode into any post, page, or widget, then update to view your interactive 3D model.', '3d-viewer') }
                    ]
                }
            ]
        },
        // Newest first; the Welcome tab shows these rows as they are.
        changelogs: [
            { version: '1.9.4', date: '2026-09-26', tag: 'plugin', text: __('Redesigned the guided setup as a three-step onboarding', '3d-viewer') },
            { version: '1.9.4', date: '2026-09-26', tag: 'plugin', text: __('Added a Monthly billing cycle to the Pricing page', '3d-viewer') },
            { version: '1.9.3', date: '2026-09-09', tag: 'viewer', text: __('Environment Image and HDR Skybox Image are now free', '3d-viewer') },
            { version: '1.9.3', date: '2026-09-09', tag: 'viewer', text: __('A missing or broken model file now shows a message instead of a spinner', '3d-viewer') }
        ],
        changelogsUrl: `https://wordpress.org/plugins/${slug}/#developers`,
        // Pro-only in source (hotspots, galleries, per-variation models); AR and lighting are free.
        proFeatures: [
            __('Interactive hotspots and annotations', '3d-viewer'),
            __('Multiple models in one viewer gallery', '3d-viewer'),
            __('A 3D model for each WooCommerce variation', '3d-viewer')
        ]
    };
};

type DemoGroup = 'camera' | 'lighting' | 'hotspots' | 'variants' | 'performance' | 'more';
export type DemoTone = 'blue' | 'green' | 'violet' | 'orange' | 'red';

export interface DemoItem {
    title: string;
    desc: string;
    tag: string;
    url: string;
    image: string;
    tone: DemoTone;
    group: DemoGroup;
    pro: boolean;
}

interface DemoInfo {
    demos: DemoItem[];
}

const demoUrl = (path: string) => `https://3d-viewer.bplugins.com/${path}/`;

// Mirrors https://3d-viewer.bplugins.com/3d-viewer-demos/ (order, titles, Free/Pro).
export const demoInfo: DemoInfo = {
    demos: [
        { title: __('Add a 3D Model Viewer to WordPress with One Block', '3d-viewer'), desc: __('Add one block, pick one model file, and visitors can spin it right away.', '3d-viewer'), tag: __('Getting started', '3d-viewer'), url: demoUrl('3d-model-viewer-for-wordpress'), image: 'getting-started', tone: 'green', group: 'more', pro: false },
        { title: __('Camera Controls: Starting View, Reset and Lock', '3d-viewer'), desc: __('Choose the angle a model opens on and stop visitors flipping it upside down.', '3d-viewer'), tag: __('Camera & controls', '3d-viewer'), url: demoUrl('3d-viewer-camera-controls'), image: 'camera-controls', tone: 'blue', group: 'camera', pro: true },
        { title: __('Customise Your 3D Viewer Control Layout', '3d-viewer'), desc: __('Rename, resize, reorder and move all seven viewer buttons.', '3d-viewer'), tag: __('Camera & controls', '3d-viewer'), url: demoUrl('3d-viewer-controls'), image: 'viewer-controls', tone: 'blue', group: 'camera', pro: true },
        { title: __('HDR Lighting for 3D Models: Compare Four Setups', '3d-viewer'), desc: __('See one toy car under four lighting setups, from default light to studio HDR.', '3d-viewer'), tag: __('Lighting', '3d-viewer'), url: demoUrl('3d-model-lighting'), image: 'hdr-lighting', tone: 'orange', group: 'lighting', pro: true },
        { title: __('Choose a Style for Your 3D Model Hotspots', '3d-viewer'), desc: __('Compare four hotspot styles on the same chair, from plain text tags to hover cards.', '3d-viewer'), tag: __('Hotspots', '3d-viewer'), url: demoUrl('3d-model-hotspots'), image: 'hotspots', tone: 'violet', group: 'hotspots', pro: true },
        { title: __('Show Image and Video Hotspots on a 3D Model', '3d-viewer'), desc: __('Click pins on a watch to open a close-up photo, play a video or follow a link.', '3d-viewer'), tag: __('Hotspots', '3d-viewer'), url: demoUrl('image-and-video-hotspots'), image: 'media-hotspots', tone: 'violet', group: 'hotspots', pro: true },
        { title: __('Create an Interactive 3D Product Tour in WordPress', '3d-viewer'), desc: __('Click numbered stops and the camera glides to each close-up in the order you set.', '3d-viewer'), tag: __('Hotspots', '3d-viewer'), url: demoUrl('interactive-3d-product-tour'), image: 'product-tour', tone: 'violet', group: 'hotspots', pro: true },
        { title: __('AR Product Viewer for WordPress: See It in Your Room', '3d-viewer'), desc: __('Check the sofa’s size with a ruler, then place it true to size on your floor.', '3d-viewer'), tag: __('Augmented reality', '3d-viewer'), url: demoUrl('ar-product-viewer'), image: 'ar', tone: 'blue', group: 'more', pro: true },
        { title: __('3D Product Configurator for WordPress With 5 Colourways', '3d-viewer'), desc: __('Switch a sofa between five colourways with no page reloads, all from one 3.1 MB file.', '3d-viewer'), tag: __('Variants & textures', '3d-viewer'), url: demoUrl('3d-product-configurator'), image: 'configurator', tone: 'red', group: 'variants', pro: true },
        { title: __('Play Animated 3D Models With Clickable Pins', '3d-viewer'), desc: __('Watch a bee animate, switch its animations from a dropdown, or click a pin to play one.', '3d-viewer'), tag: __('Variants & textures', '3d-viewer'), url: demoUrl('animated-3d-models-wordpress'), image: 'animated', tone: 'red', group: 'variants', pro: true },
        { title: __('Change 3D Model Colours Without Re-exporting the File', '3d-viewer'), desc: __('Give one model three different colours from inside WordPress, with no Blender needed.', '3d-viewer'), tag: __('Variants & textures', '3d-viewer'), url: demoUrl('change-3d-model-colours'), image: 'colours', tone: 'red', group: 'variants', pro: true },
        { title: __('3D Model Gallery for WordPress: Many Models, One Viewer', '3d-viewer'), desc: __('Browse a lamp, a chair and a sofa in one viewer using thumbnails or arrows.', '3d-viewer'), tag: __('Galleries', '3d-viewer'), url: demoUrl('3d-model-gallery'), image: 'gallery', tone: 'violet', group: 'more', pro: true },
        { title: __('Fast-Loading 3D Models on Mobile With a Poster Image', '3d-viewer'), desc: __('Phones get a light 322 KB poster image instead of a 9.6 MB 3D model.', '3d-viewer'), tag: __('Performance & mobile', '3d-viewer'), url: demoUrl('3d-models-on-mobile'), image: 'mobile', tone: 'green', group: 'performance', pro: true },
        { title: __('Show Real-World 3D Model Dimensions in WordPress', '3d-viewer'), desc: __('See width, height and depth measured live, and how to fix a file made off-scale.', '3d-viewer'), tag: __('Performance & mobile', '3d-viewer'), url: demoUrl('3d-model-dimensions'), image: 'dimensions', tone: 'green', group: 'performance', pro: true },
        { title: __('A WordPress STL Viewer for CAD and 3D Printing Files', '3d-viewer'), desc: __('Show STL, STEP, OBJ and FBX files for free, with no conversion, in the Advanced viewer.', '3d-viewer'), tag: __('Formats', '3d-viewer'), url: demoUrl('wordpress-stl-viewer'), image: 'stl', tone: 'orange', group: 'more', pro: false },
        { title: __('Build a Full-Width 3D Hero Section for WordPress', '3d-viewer'), desc: sprintf(/* translators: 1: viewer height as a share of the screen, 2: viewer height in pixels. */ __('Fill the top of a page at %1$s of the screen height, or sit at %2$s beside text.', '3d-viewer'), '70%', '380px'), tag: __('Styling & embedding', '3d-viewer'), url: demoUrl('3d-hero-section'), image: 'hero', tone: 'blue', group: 'more', pro: false },
        { title: __('Environment & Skybox Images for 3D Models in WordPress', '3d-viewer'), desc: __('Light a model with an HDR photo, then show it as the background. Both settings are in the free plugin.', '3d-viewer'), tag: __('Lighting', '3d-viewer'), url: demoUrl('3d-model-environment-skybox'), image: 'skybox', tone: 'orange', group: 'lighting', pro: false }
    ]
};

interface PricingInfo {
    logo: string;
    pluginId: number;
    planIds: number[];
    licenses: (number | null)[];
}

export const pricingInfo: PricingInfo = {
    logo: `https://ps.w.org/${slug}/assets/icon-128x128.png`,
    pluginId: productId,
    planIds: [proPlanId, 52950],
    licenses: [1, 3, null]
};
