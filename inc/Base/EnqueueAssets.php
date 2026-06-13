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

        // Admin script & styles
        wp_register_script('bp3d-admin-script', BP3D_DIR . 'build/admin.js', ['jquery'], BP3D_VERSION, true);
        wp_register_style('bp3d-admin-style', BP3D_DIR . 'admin/css/admin-style.css', [], BP3D_VERSION);
        if (in_array($post_type, ['bp3d-model-viewer', 'product'], true)) {
            wp_enqueue_style('bp3d-admin-style');
            wp_enqueue_style('bp3d-readonly-style');
            wp_enqueue_script('bp3d-admin-script');
        }

    }

}
