<?php



namespace BP3D\Addons;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Elementor integration handler (Pro).
 *
 * Registers Elementor widgets, scripts, and editor assets
 * for the 3D Viewer plugin's Elementor integration.
 */
final class Addons
{
    private const VERSION = '1.0.0';
    private const MINIMUM_ELEMENTOR_VERSION = '2.0.0';
    private const MINIMUM_PHP_VERSION = '7.0';

    private static ?self $_instance = null;

    /**
     * Get singleton instance.
     */
    public static function instance(): self
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    /**
     * Register Elementor hooks.
     */
    public function register(): void
    {
        add_action('elementor/widgets/register', [$this, 'registerWidgets']);
        add_action('elementor/frontend/after_register_scripts', [$this, 'registerFrontendScripts']);
        add_action('elementor/editor/before_enqueue_scripts', [$this, 'enqueueEditorScripts']);
    }

    /**
     * Register frontend scripts and styles for Elementor.
     */
    public function registerFrontendScripts()
    {
        if (wp_script_is('bp3d-public', 'registered')) {
            return;
        }

        wp_register_script('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION, true);
        wp_register_script('bp3d-public', BP3D_DIR . 'build/frontend.js', ['react', 'react-dom', 'jquery', 'elementor-frontend'], BP3D_VERSION, true);
        wp_register_style('bp3d-frontend', BP3D_DIR . 'build/frontend.css', [], BP3D_VERSION, 'all');
    }

    /**
     * Register Elementor widgets.
     */
    public function registerWidgets()
    {
        require_once __DIR__ . '/ModelViewer.php';

        \Elementor\Plugin::instance()->widgets_manager->register(new ModelViewer());
        \Elementor\Plugin::instance()->widgets_manager->register(new BP3DProductModel());
    }

    /**
     * Enqueue editor scripts (model viewer libraries for editor preview).
     */
    public function enqueueEditorScripts()
    {
        wp_enqueue_script('bp3d-lib-o3dviewer', BP3D_DIR . 'public/js/o3dv.min.js', [], BP3D_VERSION, true);
        wp_enqueue_script_module('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION);
    }
}
