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
                'modelViewerSrc' => BP3D_DIR . 'public/js/model-viewer.latest.min.js',
                'o3dviewerSrc' => BP3D_DIR . 'public/js/o3dv.min.js',
                // 'modern': the meta box is drawn by bfields, so the preview reads window.bfields, not Codestar's inputs.
                'ui' => AdminUi::mode('viewer'),
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
    private static function buildVersion(string $entry): string
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

}
