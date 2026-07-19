/**
 * Global setup for the 3D Viewer e2e suite.
 *
 * 1. Makes sure the Studio site is running.
 * 2. Makes sure the free plugin build is active (deactivates a premium build).
 * 3. Enables all 3D mime types + the Gutenberg editor in plugin settings.
 * 4. Generates 3D model fixture files.
 * 5. Logs in as the admin and stores the auth state for all tests.
 * 6. Cleans up content from previous runs and seeds fresh fixture content
 *    (uploaded .glb model, CPT models, frontend pages, a Woo product and an
 *    Elementor page when those plugins are active).
 *
 * Everything seeded here is prefixed "E2E-3DV" so it can be safely removed.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import { wp, ensureSiteRunning } from './wp';

const E2E = __dirname;
const ARTIFACTS = path.join(E2E, 'artifacts');
const FIXTURES = path.join(E2E, 'fixtures');
const STATE_FILE = path.join(ARTIFACTS, 'state.json');

const FREE = '3d-viewer';
const PREMIUM = '3d-viewer-premium';
const MIMES = ['glb', 'gltf', 'obj', 'stl', 'fbx', 'usdz', 'hdr', '3mf', 'dae', 'wrl', 'mtl', '3ds', 'step', '3dml'];

/** Full "model" attribute object — object attributes are not deep-merged with
 *  block.json defaults, so always provide every key. */
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

function viewerBlock(url: string, extra: Record<string, unknown> = {}) {
    const attrs = { model: modelObject(url), ...extra };
    return `<!-- wp:b3dviewer/modelviewer ${JSON.stringify(attrs)} /-->`;
}

/** Elementor document containing one 3dModelViewer widget. */
function elementorData(url: string) {
    return JSON.stringify([
        {
            id: 'e2e3dv01',
            elType: 'section',
            settings: [],
            elements: [
                {
                    id: 'e2e3dv02',
                    elType: 'column',
                    settings: { _column_size: 100 },
                    elements: [
                        {
                            id: 'e2e3dv03',
                            elType: 'widget',
                            widgetType: '3dModelViewer',
                            settings: {
                                currentViewer: 'modelViewer',
                                modelUrl: url,
                                fullscreen: 'yes',
                                mouseControls: 'yes',
                                zoom: 'yes',
                                progressBar: 'yes',
                            },
                            elements: [],
                        },
                    ],
                },
            ],
        },
    ]);
}

export default async function globalSetup() {
    fs.mkdirSync(ARTIFACTS, { recursive: true });

    // ---------------------------------------------------------------- 1. site
    ensureSiteRunning();

    // ---------------------------------------------------- 2. plugin variant
    const activeRaw = wp(['plugin', 'list', '--status=active', '--field=name']) || '';
    const active = activeRaw.split('\n').map((s) => s.trim());
    const wooActive = active.includes('woocommerce');
    const elementorActive = active.includes('elementor');

    if (active.includes(PREMIUM)) {
        console.log('[setup] deactivating premium build — this suite tests the free plugin');
        wp(['plugin', 'deactivate', PREMIUM], { allowFail: true });
    }
    if (!active.includes(FREE)) {
        wp(['plugin', 'activate', FREE]);
    }
    console.log(
        `[setup] woocommerce ${wooActive ? 'active' : 'inactive'}, elementor ${elementorActive ? 'active' : 'inactive'}`
    );

    // ------------------------------------------------------- 3. settings
    const mimeJson = JSON.stringify(MIMES);
    const existing = wp(['option', 'get', '_bp3d_settings_', '--format=json'], { allowFail: true });
    if (!existing || !existing.startsWith('{')) {
        wp([
            'option', 'update', '_bp3d_settings_',
            JSON.stringify({ allowed_mime_types: MIMES, gutenberg_enabled: '1' }),
            '--format=json',
        ]);
    } else {
        wp(['option', 'patch', 'update', '_bp3d_settings_', 'allowed_mime_types', mimeJson, '--format=json'], { allowFail: true });
        const check = wp(['option', 'pluck', '_bp3d_settings_', 'allowed_mime_types', '--format=json'], { allowFail: true });
        if (!check || !check.includes('glb')) {
            wp(['option', 'patch', 'insert', '_bp3d_settings_', 'allowed_mime_types', mimeJson, '--format=json']);
        }
        // New CPT posts should use the block editor (covers the mainline flow;
        // the classic metabox flow is covered by a seeded classic model).
        wp(['option', 'patch', 'update', '_bp3d_settings_', 'gutenberg_enabled', '1'], { allowFail: true });
        const gcheck = wp(['option', 'pluck', '_bp3d_settings_', 'gutenberg_enabled'], { allowFail: true });
        if (gcheck !== '1') {
            wp(['option', 'patch', 'insert', '_bp3d_settings_', 'gutenberg_enabled', '1'], { allowFail: true });
        }
    }

    // --------------------------------------------------------- 4. fixtures
    execFileSync(process.execPath, [path.join(E2E, 'scripts', 'make-fixtures.mjs')], { stdio: 'inherit' });

    // ------------------------------------------------------------ 5. login
    const requestUtils = await RequestUtils.setup({
        baseURL: process.env.WP_BASE_URL!,
        user: {
            username: process.env.WP_USERNAME!,
            password: process.env.WP_PASSWORD!,
        },
        storageStatePath: process.env.STORAGE_STATE_PATH!,
    });
    await requestUtils.setupRest();

    // Swallow any pending one-time admin redirects (Freemius) so tests don't
    // land on an opt-in screen mid-spec.
    await requestUtils.request.get(`${process.env.WP_BASE_URL}/wp-admin/index.php`).catch(() => {});

    // SureRank (the site's SEO plugin) launches a first-run driver.js tour in
    // the editor whose overlay intercepts clicks (e.g. on Publish). It is
    // gated on a browser-local localStorage flag, so bake that flag into the
    // shared storage state every test context starts from.
    const storagePath = process.env.STORAGE_STATE_PATH!;
    const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    const origin = process.env.WP_BASE_URL!.replace(/\/$/, '');
    storage.origins = storage.origins ?? [];
    let originState = storage.origins.find((o: { origin: string }) => o.origin === origin);
    if (!originState) {
        originState = { origin, localStorage: [] };
        storage.origins.push(originState);
    }
    originState.localStorage = (originState.localStorage ?? []).filter(
        (item: { name: string }) => item.name !== 'surerank_editor_tour_seen'
    );
    originState.localStorage.push({ name: 'surerank_editor_tour_seen', value: '1' });
    fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2));

    // ----------------------------------------------- 6. clean previous data
    wp(['eval-file', path.join(E2E, 'scripts', 'clean-e2e-data.php')], { allowFail: true });

    // ------------------------------------------------------------- 7. seed
    const media = await requestUtils.uploadMedia(path.join(FIXTURES, 'e2e-cube.glb'));
    const glbUrl = media.source_url;
    console.log(`[setup] uploaded model: ${glbUrl}`);

    // CPT model built with the block editor (what the shortcode renders)
    const blockModel = await requestUtils.rest({
        path: '/wp/v2/bp3d-model-viewer',
        method: 'POST',
        data: {
            title: 'E2E-3DV Model Block',
            content: viewerBlock(glbUrl),
            status: 'publish',
        },
    });
    // The shortcode reads _bp3d_is_gutenberg (legacy fallback: isGutenberg) —
    // set both like real posts have.
    wp(['post', 'meta', 'update', String(blockModel.id), '_bp3d_is_gutenberg', '1']);
    wp(['post', 'meta', 'update', String(blockModel.id), 'isGutenberg', '1']);

    // CPT model in "classic" (CSF metabox) mode
    const classicModel = await requestUtils.rest({
        path: '/wp/v2/bp3d-model-viewer',
        method: 'POST',
        data: { title: 'E2E-3DV Model Classic', content: '', status: 'publish' },
    });
    wp(['post', 'meta', 'update', String(classicModel.id), '_bp3d_is_gutenberg', '0']);
    wp(['post', 'meta', 'update', String(classicModel.id), 'isGutenberg', '0']);
    wp([
        'post', 'meta', 'update', String(classicModel.id), '_bp3dimages_',
        JSON.stringify({
            currentViewer: 'modelViewer',
            bp_3d_src: { url: glbUrl },
            bp_3d_poster: { url: '' },
            bp_camera_control: '1',
            bp_3d_zooming: '1',
            bp_3d_fullscreen: '1',
            bp_3d_zoom_in_out_btn: '1',
            bp_3d_camera_btn: '1',
            bp_3d_loading: 'auto',
            bp_3d_progressbar: '1',
            '3d_exposure': '1',
            '3d_shadow_intensity': '1',
            bp_3d_width: { width: '100', unit: '%' },
            bp_3d_height: { height: '400', unit: 'px' },
            bp_3d_align: 'center',
            bp_model_bg: 'transparent',
        }),
        '--format=json',
    ]);

    const mkPage = async (title: string, content: string) =>
        requestUtils.rest({
            path: '/wp/v2/pages',
            method: 'POST',
            data: { title, content, status: 'publish' },
        });

    const pages: Record<string, { id: number; link: string }> = {};
    pages.block = await mkPage('E2E-3DV Block Page', viewerBlock(glbUrl));
    pages.controls = await mkPage(
        'E2E-3DV Controls Page',
        viewerBlock(glbUrl, {
            zoomInOutBtn: true,
            cameraBtn: true,
            rotate: true,
            fullscreen: true,
            progressBar: true,
            exposure: 2,
        })
    );
    pages.advanced = await mkPage(
        'E2E-3DV Advanced Viewer Page',
        viewerBlock(glbUrl, { currentViewer: 'O3DViewer' })
    );
    pages.shortcodeBlock = await mkPage(
        'E2E-3DV Shortcode Block Page',
        `<!-- wp:shortcode -->[3d_viewer id=${blockModel.id}]<!-- /wp:shortcode -->`
    );
    pages.shortcodeClassic = await mkPage(
        'E2E-3DV Shortcode Classic Page',
        `<!-- wp:shortcode -->[3d_viewer id=${classicModel.id}]<!-- /wp:shortcode -->`
    );
    pages.shortcodeInvalid = await mkPage(
        'E2E-3DV Shortcode Invalid Page',
        `<!-- wp:shortcode -->[3d_viewer id=999999999]<!-- /wp:shortcode -->`
    );

    // WooCommerce product with a 3D model on top of the gallery
    let product: { id: number; link: string } | null = null;
    let wooPages: { shop: string; checkout: string } | null = null;
    if (wooActive) {
        const productId = wp([
            'post', 'create',
            '--post_type=product',
            '--post_title=E2E-3DV Product',
            '--post_status=publish',
            '--porcelain',
        ])!;
        wp([
            'post', 'meta', 'update', productId, '_bp3d_product_',
            JSON.stringify({
                bp3d_model_src: glbUrl,
                bp3d_poster_src: '',
                viewer_position: 'top',
                bp_model_bg: '#f5f5f5',
            }),
            '--format=json',
        ]);
        // Purchasable: priced, in stock, and virtual (a fresh store has no
        // shipping zones, so a shippable product would block checkout).
        wp(['post', 'meta', 'update', productId, '_regular_price', '19.99']);
        wp(['post', 'meta', 'update', productId, '_price', '19.99']);
        wp(['post', 'meta', 'update', productId, '_virtual', 'yes']);
        wp(['post', 'meta', 'update', productId, '_stock_status', 'instock']);
        const link = wp(['post', 'list', `--post__in=${productId}`, '--post_type=product', '--field=url'])!;
        product = { id: Number(productId), link };

        // Make the store checkout-able end to end: visible to visitors and
        // with one enabled payment gateway (cash on delivery).
        wp(['option', 'update', 'woocommerce_coming_soon', 'no'], { allowFail: true });
        wp([
            'option', 'update', 'woocommerce_cod_settings',
            JSON.stringify({
                enabled: 'yes',
                title: 'Cash on delivery',
                description: '',
                instructions: '',
                enable_for_methods: [],
                enable_for_virtual: 'yes',
            }),
            '--format=json',
        ]);

        // Prefill the test customer's billing profile so the block checkout
        // doesn't need fragile per-field form automation.
        const billing: Record<string, string> = {
            billing_first_name: 'E2E',
            billing_last_name: 'Tester',
            billing_address_1: '123 Main St',
            billing_city: 'New York',
            billing_postcode: '10001',
            billing_state: 'NY',
            billing_country: 'US',
            billing_phone: '5551234567',
            billing_email: 'admin@localhost.com',
        };
        for (const [key, value] of Object.entries(billing)) {
            wp(['user', 'meta', 'update', process.env.WP_USERNAME!, key, value]);
        }

        const shopId = wp(['option', 'get', 'woocommerce_shop_page_id'], { allowFail: true });
        const checkoutId = wp(['option', 'get', 'woocommerce_checkout_page_id'], { allowFail: true });
        const pageUrl = (id: string | null) =>
            id ? wp(['post', 'list', `--post__in=${id}`, '--post_type=page', '--field=url'], { allowFail: true }) : null;
        const shopUrl = pageUrl(shopId);
        const checkoutUrl = pageUrl(checkoutId);
        if (shopUrl && checkoutUrl) {
            wooPages = { shop: shopUrl, checkout: checkoutUrl };
        }
    }

    // Elementor page built with the "Model Viewer" widget
    let elementorPage: { id: number; link: string } | null = null;
    if (elementorActive) {
        const pageId = wp([
            'post', 'create',
            '--post_type=page',
            '--post_title=E2E-3DV Elementor Page',
            '--post_status=publish',
            '--porcelain',
        ])!;
        wp(['post', 'meta', 'update', pageId, '_elementor_edit_mode', 'builder']);
        wp(['post', 'meta', 'update', pageId, '_elementor_template_type', 'wp-page']);
        wp(['post', 'meta', 'update', pageId, '_elementor_version', '3.0.0']);
        wp(['post', 'meta', 'update', pageId, '_elementor_data', elementorData(glbUrl)]);
        const link = wp(['post', 'list', `--post__in=${pageId}`, '--post_type=page', '--field=url'])!;
        elementorPage = { id: Number(pageId), link };
    }

    // ------------------------------------------------------------- 8. state
    const state = {
        wooActive,
        elementorActive,
        baseURL: process.env.WP_BASE_URL,
        glb: { id: media.id, url: glbUrl },
        models: {
            block: { id: blockModel.id },
            classic: { id: classicModel.id },
        },
        pages: Object.fromEntries(
            Object.entries(pages).map(([k, p]) => [k, { id: p.id, link: p.link }])
        ),
        product,
        wooPages,
        elementorPage,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log('[setup] seeded state written to artifacts/state.json');
}
