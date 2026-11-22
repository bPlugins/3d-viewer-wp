<?php


namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Asset enqueue handler.
 *
 * Registers and enqueues all frontend and backend scripts/styles
 * for the 3D Viewer plugin.
 */
class EnqueueAssets
{
    /**
     * Register WordPress hooks for asset enqueuing.
     */
    public function register(): void
    {
        add_action('admin_enqueue_scripts', [$this, 'enqueueBackendFiles']);
        add_filter('script_loader_tag', [$this, 'addModuleTypeAttribute'], 10, 3);
        add_action('wp_print_footer_scripts', [$this, 'printMeshoptDecoder'], 9);
        add_action('admin_print_footer_scripts', [$this, 'printMeshoptDecoder'], 9);
    }

    /**
     * Add type="module" attribute to the model-viewer script tag.
     */
    public function addModuleTypeAttribute($tag, $handle, $src)
    {
        if ($handle !== 'bp3d-lib-model-viewer') {
            return $tag;
        }

        // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- Modifying tag of an already enqueued script.
        return '<script type="module" id="bp3d-lib-model-viewer-js" src="' . esc_url($src) . '"></script>';
    }



    /**
     * Register and enqueue backend admin scripts and styles.
     */
    public function enqueueBackendFiles($hook_suffix)
    {
        global $post;

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $post_type = isset($post->post_type) ? $post->post_type : (isset($_GET['post_type']) ? sanitize_text_field(wp_unslash($_GET['post_type'] ?? '')) : null);

        $is_editor_screen = in_array($post_type, ['bp3d-model-viewer', 'product'], true);
        $ui = $is_editor_screen ? AdminUi::mode(AdminUi::screenSurface()) : '';

        // Admin script & styles
        wp_register_script('bp3d-admin-script', BP3D_DIR . 'build/admin.js', ['jquery'], self::buildVersion('admin'), true);
        wp_register_style('bp3d-admin-common-style', BP3D_DIR . 'admin/css/admin-common.css', [], self::styleVersion('admin/css/admin-common.css'));
        wp_register_style('bp3d-admin-style', BP3D_DIR . 'admin/css/admin-style.css', ['bp3d-admin-common-style'], self::styleVersion('admin/css/admin-style.css'));
        if ($is_editor_screen) {
            wp_enqueue_style('bp3d-admin-common-style');
            // Codestar-only rules; Modern draws no Codestar markup.
            if (AdminUi::CLASSIC === $ui) {
                wp_enqueue_style('bp3d-admin-style');
            } else {
                wp_enqueue_style('bp3d-admin-modern-style', BP3D_DIR . 'admin/css/admin-modern.css', ['bp3d-admin-common-style'], self::styleVersion('admin/css/admin-modern.css'));
            }
            wp_enqueue_script('bp3d-admin-script');
        }

        // Modern viewer list: the table in the 2.0.0 look.
        if (PostTypeModelViewer::isModernList() && file_exists(BP3D_PATH . 'build/admin-list.js')) {
            wp_enqueue_script('bp3d-admin-list', BP3D_DIR . 'build/admin-list.js', [], self::buildVersion('admin-list'), true);
            wp_enqueue_style('bp3d-admin-list', BP3D_DIR . 'build/admin-list.css', [], self::styleVersion('build/admin-list.css'));
        }

        // Classic viewer list: only the shortcode chip's copy handler (its look is in admin-style.css).
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if ($screen && 'edit' === $screen->base && 'bp3d-model-viewer' === $screen->post_type && !PostTypeModelViewer::isModernList() && file_exists(BP3D_PATH . 'build/admin-list.js')) {
            wp_enqueue_script('bp3d-admin-list', BP3D_DIR . 'build/admin-list.js', [], self::buildVersion('admin-list'), true);
        }

        // Live model preview inside the metabox (bp3d-model-viewer edit screen only).
        if ($post_type === 'bp3d-model-viewer' && in_array($hook_suffix, ['post.php', 'post-new.php'], true)) {
            if (!wp_script_is('bp3d-lib-model-viewer', 'registered')) {
                wp_register_script('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION, true);
            }
            if (!wp_script_is('bp3d-lib-o3dviewer', 'registered')) {
                wp_register_script('bp3d-lib-o3dviewer', BP3D_DIR . 'public/js/o3dv.min.js', [], BP3D_VERSION, true);
            }
            wp_enqueue_script('bp3d-lib-model-viewer');
            wp_enqueue_script('bp3d-lib-o3dviewer');

            // The build hash, not only BP3D_VERSION: a cached copy of the previous bundle would miss the new interface's data path.
            $preview_asset = self::buildAsset('admin-preview');
            $preview_version = BP3D_VERSION . (isset($preview_asset['version']) ? '-' . $preview_asset['version'] : '');

            wp_enqueue_style('bp3d-admin-preview', BP3D_DIR . 'build/admin-preview.css', [], self::styleVersion('build/admin-preview.css'));
            wp_enqueue_script(
                'bp3d-admin-preview',
                BP3D_DIR . 'build/admin-preview.js',
                array_values(array_unique(array_merge(['react', 'react-dom', 'wp-i18n'], $preview_asset['dependencies'] ?? []))),
                $preview_version,
                true
            );
            wp_set_script_translations('bp3d-admin-preview', '3d-viewer', BP3D_PATH . 'languages');
            wp_localize_script('bp3d-admin-preview', 'bp3dPreview', [
                // 'modern': the meta box is drawn by bfields, so the preview reads window.bfields, not Codestar's inputs.
                'ui' => AdminUi::mode('viewer'),
                'shortcode' => '[3d_viewer id="' . (int) get_the_ID() . '"]',
                'hint' => __('Copy and paste this shortcode into your posts, pages and widget', '3d-viewer'),
            ]);
        }

    }

    /** Busts the browser cache when the file changes, so a stylesheet never lags the bundle that relies on it. */
    public static function styleVersion(string $file): string
    {
        $mtime = @filemtime(BP3D_PATH . $file);

        return BP3D_VERSION . ($mtime ? '-' . $mtime : '');
    }

    /** BP3D_VERSION plus the build hash from build/<entry>.asset.php. */
    public static function buildVersion(string $entry): string
    {
        $asset = self::buildAsset($entry);

        return BP3D_VERSION . (!empty($asset['version']) ? '-' . $asset['version'] : '');
    }

    /**
     * The wp-scripts manifest build/<entry>.asset.php (dependencies, version), or [] when missing.
     *
     * @return array<string, mixed>
     */
    public static function buildAsset(string $entry): array
    {
        static $assets = [];

        if (!isset($assets[$entry])) {
            $file = BP3D_PATH . 'build/' . $entry . '.asset.php';
            $asset = is_readable($file) ? require $file : [];
            $assets[$entry] = is_array($asset) ? $asset : [];
        }

        return $assets[$entry];
    }

    /**
     * Points model-viewer at the meshopt decoder only once its WebAssembly is ready: model-viewer awaits the
     * decoder for every model, so a blocked file or a CSP without 'wasm-unsafe-eval' must leave it unset.
     */
    public function printMeshoptDecoder(): void
    {
        $screen = is_admin() && function_exists('get_current_screen') ? get_current_screen() : null;
        $product_screen = $screen && $screen->base === 'post' && $screen->post_type === 'product';

        if (
            !$product_screen
            && !wp_script_is('bp3d-lib-model-viewer', 'enqueued')
            && !wp_script_is('bp3d-lib-model-viewer', 'done')
            && !did_action('bp3d_script_module_enqueued')
        ) {
            return;
        }

        $url = esc_url_raw(\BP3D\Helper\Utils::meshoptDecoderUrl());
        if ($url === '') {
            return;
        }

        wp_print_inline_script_tag(
            '(function (url) {'
            . 'var w = window, cfg = w.ModelViewerElement;'
            // A site's own setting wins.
            . 'if (!url || (cfg && cfg.meshoptDecoderLocation)) return;'
            . 'var s = document.createElement("script");'
            . 's.async = true;'
            . 's.src = url;'
            . 's.onload = function () {'
            // onload fires even when the file's own code fails, so wait for its WebAssembly to compile.
            . 'var d = w.MeshoptDecoder;'
            . 'if (!d || !d.supported || !d.ready || typeof d.ready.then !== "function") return;'
            . 'd.ready.then(function () { whenBody(apply); }, function () {});'
            . '};'
            . 'function apply() {'
            . 'w.ModelViewerElement = Object.assign(w.ModelViewerElement || {}, { meshoptDecoderLocation: url });'
            // Already defined: the static setter.
            . 'var MV = w.customElements && w.customElements.get("model-viewer");'
            . 'if (MV && !MV.meshoptDecoderLocation) MV.meshoptDecoderLocation = url;'
            . '}'
            // model-viewer appends the decoder to document.body; the block editor iframe has none until React mounts it.
            . 'function whenBody(cb) {'
            . 'var doc = document, done = false, mo;'
            . 'function check() {'
            . 'if (done || doc.readyState === "loading" || !doc.body) return;'
            . 'done = true;'
            . 'if (mo) mo.disconnect();'
            . 'cb();'
            . '}'
            . 'if (w.MutationObserver) { mo = new MutationObserver(check); mo.observe(doc.documentElement, { childList: true }); }'
            . 'doc.addEventListener("DOMContentLoaded", check);'
            . 'check();'
            . '}'
            . '(document.head || document.documentElement).appendChild(s);'
            . '})(' . wp_json_encode($url) . ');',
            ['id' => 'bp3d-meshopt-decoder-js']
        );
    }
}
