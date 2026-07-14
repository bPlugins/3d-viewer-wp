<?php


/*
 * Plugin Name: 3D Viewer – Display Interactive 3D Models
 * Plugin URI:  https://bplugins.com/
 * Description: Easily display interactive 3D models on the web. Supported File type .glb, .gltf,obj 3ds stl ply off 3dm fbx dae wrl 3mf amf ifc brep step iges fcstd bim
 * Version: 1.9.0
 * Author: bPlugins
 * Author URI: https://bplugins.com
 * Requires PHP: 7.4
 * Requires at least: 6.5
 * Tested up to: 7.0
 * License: GPLv2 or later
 * Text Domain: 3d-viewer
 * Domain Path:  /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * plugin is activated, deactivate the premium build automatically.
 */
if (!function_exists('bp3d_deactivate_premium_version')) {
    function bp3d_deactivate_premium_version()
    {
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $premium = '3d-viewer-premium/3d-viewer-premium.php';

        if (is_plugin_active($premium)) {
            deactivate_plugins($premium);
        }
    }
}
register_activation_hook(__FILE__, 'bp3d_deactivate_premium_version');

if (function_exists('bp3d_fs')) {
    bp3d_fs()->set_basename(true, __FILE__);
} else {

    if (file_exists(dirname(__FILE__) . '/vendor/autoload.php')) {
        require_once(dirname(__FILE__) . '/vendor/autoload.php');
    }
    if (file_exists(dirname(__FILE__) . '/inc/admin.php')) {
        require_once(dirname(__FILE__) . '/inc/admin.php');
    }

    if (defined('WP_DEBUG') && WP_DEBUG === true) {
        define('BP3D_VERSION', time());
    } else {
        define('BP3D_VERSION', '1.9.0');
    }

    defined('BP3D_DIR') or define('BP3D_DIR', plugin_dir_url(__FILE__));
    defined('BP3D_PATH') or define('BP3D_PATH', plugin_dir_path(__FILE__));
    defined('BP3D_TEMPLATE_PATH') or define('BP3D_TEMPLATE_PATH', plugin_dir_path(__FILE__) . 'inc/Template/');
    defined('BP3D__FILE__') or define('BP3D__FILE__', __FILE__);
    define('BP3D_IMPORT_VER', '1.0.0');


    // Create a helper function for easy SDK access.
    function bp3d_fs()
    {
        global $bp3d_fs;

        if (!isset($bp3d_fs)) {
            // Include Freemius SDK.
            // SDK is auto-loaded through composer
            $bp3d_fs = fs_dynamic_init(array(
                'id' => '8795',
                'slug' => '3d-viewer',
                'type' => 'plugin',
                'public_key' => 'pk_5e6ce3f226c86e3b975b59ed84d6a',
                'is_premium' => false,
                // If your plugin is a serviceware, set this option to false.
                'has_affiliation' => 'selected',
                'menu' => array(
                    'slug' => 'edit.php?post_type=bp3d-model-viewer',
                    'first-path' => 'edit.php?post_type=bp3d-model-viewer&page=3d-viewer',
                    'support' => false,
                    'affiliation' => false,
                    'contact' => false,
                ),
            ));
        }

        return $bp3d_fs;
    }

    // Init Freemius.
    bp3d_fs();
    // Signal that SDK was initiated.
    do_action('bp3d_fs_loaded');


    // External files Inclusion
    if (file_exists(BP3D_PATH . 'vendor/codestar-framework/codestar-framework.php')) {
        require_once BP3D_PATH . 'vendor/codestar-framework/codestar-framework.php';
    }


    if (!class_exists('BP3D')) {
        class BP3D
        {
            protected static $instance = null;

            public static function get_instance()
            {
                if (null === self::$instance) {
                    self::$instance = new self();
                }
                return self::$instance;
            }

            public function __construct()
            {
                $init_file = BP3D_PATH . 'inc/Init.php';
                if (file_exists($init_file)) {
                    require_once($init_file);
                }
                if (class_exists('BP3D\\Init')) {
                    \BP3D\Init::instance()->init();
                }
                add_action('plugins_loaded', array($this, 'plugins_loaded'));
                add_action('init', [$this, 'load_plugin_textdomain']);
                add_filter('fs_is_update_check_enabled', '__return_false');

            }

            public function load_plugin_textdomain()
            {
                // Try the NEW slug first (for future translations from WordPress.org)
                $loaded = load_plugin_textdomain('3d-viewer', false, dirname(plugin_basename(__FILE__)) . '/languages');

                // If that fails, fall back to the OLD domain (for existing user translations)
                if (!$loaded) {
                    load_plugin_textdomain('model-viewer', false, dirname(plugin_basename(__FILE__)) . '/languages');
                }
            }

            function plugins_loaded()
            {
                if (class_exists('BP3D\\Init')) {
                    \BP3D\Init::register_post_type();
                }
            }
        }
        BP3D::get_instance();
    }

    $bpem_bootstrap = BP3D_PATH . 'vendor/bp-extension-manager/bootstrap.php';
    if (file_exists($bpem_bootstrap)) {
        require_once $bpem_bootstrap;
    }


    add_action('bpem_loaded', function () {
        if (class_exists('\\BPEM\\Manager')) {
            \BPEM\Manager::boot(array(
                'slug' => '3d-viewer',           // unique; namespaces everything
                'name' => '3D Viewer',
                'version' => (string) BP3D_VERSION,
                'menu_parent' => 'edit.php?post_type=bp3d-model-viewer',
                'freemius' => function_exists('bp3d_fs') ? bp3d_fs() : null,
                'max_plan_id' => 'max',
                'catalog_file' => __DIR__ . '/public/extensions.php', // Explicit PHP path
                'menu_badge' => true,
                'menu_badge_persist' => true,
                'enable_freemius_checkout' => true

            ));
        }
    });

}


