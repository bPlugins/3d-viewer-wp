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
    /**
     * Register Elementor hooks.
     */
    public function register(): void
    {
        add_action('elementor/widgets/register', [$this, 'registerWidgets']);
        add_action('elementor/frontend/after_register_scripts', [$this, 'registerFrontendScripts']);
        add_action('elementor/editor/before_enqueue_scripts', [$this, 'enqueueEditorScripts']);
        add_action('elementor/editor/after_enqueue_styles', [$this, 'enqueueEditorStyles']);
        add_action('admin_init', [$this, 'refreshElementorCss']);
        add_action('elementor/preview/enqueue_scripts', [$this, 'enqueuePreviewScripts']);
    }

    /**
     * Register frontend scripts and styles for Elementor.
     *
     * Every handle is guarded on its own. The block integration registers
     * `bp3d-public` on `init` (priority 0), so a single early return here would
     * silently skip the remaining handles — including the script module the
     * widget renders with, whose only other registration lives on
     * `enqueue_block_assets`.
     */
    public function registerFrontendScripts()
    {
        if (!wp_script_is('bp3d-lib-model-viewer', 'registered')) {
            wp_register_script('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION, true);
        }

        if (!wp_script_is('bp3d-lib-o3dviewer', 'registered')) {
            wp_register_script('bp3d-lib-o3dviewer', BP3D_DIR . 'public/js/o3dv.min.js', [], BP3D_VERSION, true);
        }

        // Registering an already-registered module id is a no-op, so this is
        // safe next to the block integration's own registration.
        if (function_exists('wp_register_script_module')) {
            wp_register_script_module('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION);
        }

        if (!wp_style_is('bp3d-frontend', 'registered')) {
            wp_register_style('bp3d-frontend', BP3D_DIR . 'build/frontend.css', [], \BP3D\Base\EnqueueAssets::styleVersion('build/frontend.css'), 'all');
        }

        if (!wp_script_is('bp3d-public', 'registered')) {
            $deps = ['react', 'react-dom', 'jquery', 'wp-i18n'];

            // Editor documents have no `elementor-frontend`, and a missing
            // dependency would stop the bundle from printing at all.
            if (wp_script_is('elementor-frontend', 'registered')) {
                $deps[] = 'elementor-frontend';
            }

            wp_register_script('bp3d-public', BP3D_DIR . 'build/frontend.js', $deps, \BP3D\Base\EnqueueAssets::buildVersion('frontend'), true);
            wp_set_script_translations('bp3d-public', '3d-viewer', BP3D_PATH . 'languages');
        }
    }

    /**
     * Make the public bundle load after Elementor's frontend script.
     *
     * `elementor/frontend/init` is dispatched once, from inside
     * `elementorFrontend.init()`. When the block integration wins the
     * registration race the bundle carries no Elementor dependency, so its
     * print position is left to the queue and on sites that reorder or defer
     * scripts it can run after the event has already fired.
     *
     * Called only from Elementor contexts so non-Elementor pages that use the
     * block or the shortcode never pull in `elementor-frontend`.
     */
    public static function ensureElementorDependencies(): void
    {
        $script = wp_scripts()->query('bp3d-public', 'registered');

        if (!$script) {
            return;
        }

        foreach (['jquery', 'elementor-frontend'] as $handle) {
            // An unregistered dependency would stop the bundle from printing
            // at all, so only add handles that actually exist.
            if (wp_script_is($handle, 'registered') && !in_array($handle, $script->deps, true)) {
                $script->deps[] = $handle;
            }
        }
    }

    /**
     * Enqueue the model viewer library for the given viewer type.
     *
     * Prefers the script module API and passes the source along, so the
     * library still resolves when `enqueue_block_assets` — the hook the block
     * integration registers the module on — never fired for this request.
     */
    public static function enqueueViewerLibrary(string $viewer = 'modelViewer'): void
    {
        if ($viewer === 'O3DViewer') {
            wp_enqueue_script('bp3d-lib-o3dviewer');

            return;
        }

        if (function_exists('wp_enqueue_script_module')) {
            wp_enqueue_script_module('bp3d-lib-model-viewer', BP3D_DIR . 'public/js/model-viewer.latest.min.js', [], BP3D_VERSION);

            return;
        }

        // Older WordPress: the classic handle is turned into a module tag by
        // EnqueueAssets::addModuleTypeAttribute().
        wp_enqueue_script('bp3d-lib-model-viewer');
    }

    /**
     * 2.0.0 changed the widget's width selectors; regenerate Elementor's cached CSS once.
     */
    public function refreshElementorCss(): void
    {
        if (get_option('bp3d_elementor_css_ver') === '2.0.0' || !class_exists('\\Elementor\\Plugin')) {
            return;
        }

        \Elementor\Plugin::$instance->files_manager->clear_cache();
        update_option('bp3d_elementor_css_ver', '2.0.0');
    }

    /**
     * Cube icon for the widgets in the Elementor panel (Elementor has no 3D eicon).
     */
    public function enqueueEditorStyles(): void
    {
        $svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'/><path d='m3.3 7 8.7 5 8.7-5'/><path d='M12 22V12'/></svg>";
        $mask = 'url("data:image/svg+xml,' . rawurlencode($svg) . '") center / contain no-repeat';

        wp_register_style('bp3d-elementor-editor', false, [], BP3D_VERSION);
        wp_enqueue_style('bp3d-elementor-editor');
        wp_add_inline_style('bp3d-elementor-editor', ".bp3d-eicon-cube{display:inline-block;width:1em;height:1em;background-color:currentColor;-webkit-mask:{$mask};mask:{$mask}}");
    }

    /**
     * Register Elementor widgets.
     */
    public function registerWidgets()
    {
        require_once __DIR__ . '/ModelViewer.php';
        require_once __DIR__ . '/BP3DProductModel.php';

        \Elementor\Plugin::instance()->widgets_manager->register(new ModelViewer());
        \Elementor\Plugin::instance()->widgets_manager->register(new BP3DProductModel());
    }

    /**
     * Enqueue editor scripts (libraries for the editor panel document).
     */
    public function enqueueEditorScripts()
    {
        $this->registerFrontendScripts();

        wp_enqueue_script('bp3d-lib-o3dviewer', BP3D_DIR . 'public/js/o3dv.min.js', [], BP3D_VERSION, true);
        self::enqueueViewerLibrary();
    }

    /**
     * Enqueue scripts and styles inside the editor preview iframe.
     *
     * Widgets dropped in while editing are rendered over AJAX, where enqueues
     * are discarded — so the preview has to carry the bundle and both
     * libraries up front, whatever the document contained on load.
     */
    public function enqueuePreviewScripts()
    {
        $this->registerFrontendScripts();
        self::ensureElementorDependencies();

        wp_enqueue_style('bp3d-frontend');
        wp_enqueue_script('bp3d-public');
        wp_enqueue_script('bp3d-lib-o3dviewer');
        self::enqueueViewerLibrary();
    }
}
