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
        add_action('wp_enqueue_scripts', [$this, 'enqueueFrontEndFiles']);
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

        return '<script type="module" id="bp3d-lib-model-viewer-js" src="' . esc_url($src) . '"></script>';
    }

    /**
     * Enqueue frontend scripts with localized data.
     */
    public function enqueueFrontEndFiles()
    {

        wp_localize_script('bp3d-public', 'assetsUrl', [
            'siteUrl' => site_url(),
            'assetsUrl' => BP3D_DIR . '/public',
        ]);

        $this->renderCustomCss();
    }

    /**
     * Register and enqueue backend admin scripts and styles.
     */
    public function enqueueBackendFiles($hook_suffix)
    {
        global $post;

        $post_type = isset($post->post_type) ? $post->post_type
            : (isset($_GET['post_type']) ? sanitize_text_field(wp_unslash($_GET['post_type'] ?? '')) : null);

        // Admin script & styles
        wp_register_script('bp3d-admin-script', BP3D_DIR . 'build/admin.js', ['jquery'], BP3D_VERSION, true);
        wp_register_style('bp3d-admin-style', BP3D_DIR . 'admin/css/admin-style.css', [], BP3D_VERSION);
        wp_register_style('bp3d-readonly-style', BP3D_DIR . 'admin/css/readonly.css', [], BP3D_VERSION);

        if (in_array($post_type, ['bp3d-model-viewer', 'product'], true)) {
            wp_enqueue_style('bp3d-admin-style');
            wp_enqueue_style('bp3d-readonly-style');
            wp_enqueue_script('bp3d-admin-script');
        }

    }

    /**
     * Output custom CSS from plugin settings in the footer.
     */
    public function renderCustomCss()
    {
        $settings = \BP3D\Helper\Utils::getSettings('_bp3d_settings_', []);

        $css = wp_strip_all_tags($settings('custom_css'));
        $css = wp_kses($css, []);
        wp_add_inline_style('bp3d-frontend', $css);
    }
}
