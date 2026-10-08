<?php



namespace BP3D\Addons;

if (!defined('ABSPATH')) {
    exit;
}

use BP3D\Base\EnqueueAssets;
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
            EnqueueAssets::styleVersion('build/frontend.css'),
            'all'
        );

        // Frontend script
        wp_register_script(
            'bp3d-public',
            BP3D_DIR . 'build/frontend.js',
            ['react', 'react-dom', 'wp-i18n'],
            EnqueueAssets::buildVersion('frontend'),
            true
        );

        wp_set_script_translations('bp3d-public', '3d-viewer', BP3D_PATH . 'languages');

        $settings = Utils::getSettings('_bp3d_settings_', []);

        wp_localize_script('bp3d-public', 'bp3dBlock', [
            'modelViewerSrc' => BP3D_DIR . 'public/js/model-viewer.latest.min.js',
            'o3dviewerSrc' => BP3D_DIR . 'public/js/o3dv.min.js',
            'selectors' => [
                'gallery' => $this->get_default_selector($settings('gallery', $settings('product_gallery_selector')), '.woocommerce-product-gallery'),
                'gallery_trigger' => $this->get_default_selector($settings('gallery_trigger'), '.woocommerce-product-gallery__trigger'),
            ]
        ]);
    }

    /**
     * Register block types from build directory.
     */
    public function init()
    {
        if (file_exists(BP3D_PATH . 'build/blocks/3d-viewer/block.json')) {
            register_block_type(BP3D_PATH . 'build/blocks/3d-viewer');
        }
        if (file_exists(BP3D_PATH . '3d-viewer-block/build/block.json')) {
            register_block_type(BP3D_PATH . '3d-viewer-block/build');
        }
    }


    /**
     * Enqueue block editor assets with localized data.
     */
    public function enqueueEditorAssets()
    {
        wp_localize_script('b3dviewer-modelviewer-editor-script', 'bp3dBlock', [
            'admin_url' => admin_url(),
            'allowedMimeTypes' => Utils::getAllowedMimeTypes(),
            'supportedMimes' => Utils::SUPPORTED_MIME_TYPES
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