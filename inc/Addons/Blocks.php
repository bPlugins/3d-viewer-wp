<?php



namespace BP3D\Addons;

if (!defined('ABSPATH')) {
    exit;
}

use BP3D\Helper\Utils;

/**
 * Gutenberg blocks handler.
 *
 * Registers and manages Gutenberg blocks for the 3D Viewer plugin,
 * including asset enqueuing, AJAX handlers, and block-specific
 * script localization.
 */
class Blocks
{
    /**
     * Register WordPress hooks for Gutenberg blocks.
     */
    public function register(): void
    {
        add_action('init', [$this, 'init'], 1);
        add_action('init', [$this, 'registerBlockAssets'], 0);
        add_action('enqueue_block_editor_assets', [$this, 'enqueueEditorAssets']);
        add_action('enqueue_block_assets', [$this, 'enqueueBlockAssets']);

    }

    /**
     * Register block-related scripts and styles on init.
     */
    public function registerBlockAssets()
    {
        // Frontend styles
        wp_register_style(
            'bp3d-frontend',
            BP3D_DIR . 'build/frontend.css',
            [],
            BP3D_VERSION,
            'all'
        );

        wp_register_style(
            'bp3d-custom-style',
            BP3D_DIR . 'public/css/custom-style.css',
            [],
            BP3D_VERSION,
            'all'
        );

        // Frontend script
        wp_register_script(
            'bp3d-public',
            BP3D_DIR . 'build/frontend.js',
            ['react', 'react-dom'],
            BP3D_VERSION,
            true
        );

        $settings = Utils::getSettings('_bp3d_settings_', []);

        wp_localize_script('bp3d-public', 'bp3dBlock', [
            'modelViewerSrc' => BP3D_DIR . 'public/js/model-viewer.latest.min.js',
            'o3dviewerSrc' => BP3D_DIR . 'public/js/o3dv.min.js',
            'selectors' => [
                'gallery' => $this->get_default_selector($settings('gallery', $settings('product_gallery_selector')), '.woocommerce-product-gallery'),
                'gallery_item' => $this->get_default_selector($settings('gallery_item'), '.woocommerce-product-gallery__image'),
                'gallery_item_active' => $this->get_default_selector($settings('gallery_item_active'), '.woocommerce-product-gallery__image.flex-active-slide'),
                'gallery_thumbnail_item' => $this->get_default_selector($settings('gallery_thumbnail_item'), '.flex-control-thumbs li'),
                'gallery_trigger' => $this->get_default_selector($settings('gallery_trigger'), '.woocommerce-product-gallery__trigger'),
            ]
        ]);
    }

    /**
     * Register block types from build directory.
     */
    public function init()
    {
        register_block_type(BP3D_PATH . 'build/blocks/3d-viewer');
        register_block_type(BP3D_PATH . '3d-viewer-block/build');
    }


    /**
     * Enqueue block editor assets with localized data.
     */
    public function enqueueEditorAssets()
    {
        $presets_raw = get_posts([
            'post_type' => 'bp3d-preset',
            'posts_per_page' => -1,
        ]);

        $presets = [];
        foreach ($presets_raw as $preset) {
            $block_content = \BP3D\Helper\Block::getBlock($preset->ID);
            $presets[] = [
                'id' => $preset->ID,
                'title' => $preset->post_title,
                'attributes' => $block_content['attrs'] ?? [],
            ];
        }

        $settings = get_option('_bp3d_settings_', []);
        $allowed_mimes = isset($settings['allowed_mime_types']) ? $settings['allowed_mime_types'] : [];
        if (!is_array($allowed_mimes)) {
            $allowed_mimes = [];
        }

        wp_localize_script('b3dviewer-modelviewer-editor-script', 'bp3dBlock', [
            'admin_url' => admin_url(),
            'allowedMimeTypes' => $allowed_mimes
        ]);

        wp_enqueue_script_module('bp3d-lib-model-viewer');

    }
    public function enqueueBlockAssets()
    {
        wp_register_script('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION, true);
        wp_register_script('bp3d-lib-o3dviewer', BP3D_DIR . 'public/js/o3dv.min.js', [], BP3D_VERSION, true);

        wp_register_script_module('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION);

        if (is_admin()) {
            wp_enqueue_script('bp3d-lib-model-viewer');
        }
    }


    public function get_default_selector($selector, $default)
    {
        if ($selector) {
            return $selector;
        }
        return $default;
    }
}