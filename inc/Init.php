<?php
namespace BP3D;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin initialization and service container.
 *
 * Handles bootstrapping all plugin services
 * and managing the singleton lifecycle.
 */
class Init
{
    private static ?self $instance = null;

    private function __construct()
    {
        add_action('woocommerce_after_register_post_type', [$this, 'load_woocommerce_files']);
    }

    public static function instance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Get the list of core service classes to register.
     *
     */
    public static function get_services()
    {
        return [
            Base\EnqueueAssets::class,
            Base\Import::class,
            Shortcode\Shortcode::class,
            Base\ExtendMimeType::class,
            Field\Viewer::class,
            Field\Settings::class,
            Woocommerce\SingleProduct::class,
            Helper\Utils::class,
            Helper\Block::class,
            Addons\Blocks::class,
            Addons\Addons::class,
            Addons\Controls\Controls::class
        ];
    }

    /**
     * Get WooCommerce-specific service classes.
     *
     * @return array<int, class-string>
     */
    public static function get_woocommerce_services()
    {
        return [
            Woocommerce\ProductMeta::class,
        ];
    }

    /**
     * Register custom post types.
     */
    public static function register_post_type()
    {
        self::instantiate('BP3D\\Base\\PostTypeModelViewer')->register();

    }

    /**
     * Initialize all registered services.
     */
    public static function init()
    {
        foreach (self::get_services() as $class) {
            $resolved_class = self::require_file($class);

            if ($resolved_class === false) {
                continue;
            }

            $service = self::instantiate($resolved_class);

            if (method_exists($service, 'register')) {
                $service->register();
            }
        }
    }

    /**
     * Load WooCommerce-dependent service files.
     */
    public function load_woocommerce_files()
    {
        foreach (self::get_woocommerce_services() as $class) {
            $resolved_class = self::require_file($class);

            if ($resolved_class === false) {
                continue;
            }

            $service = self::instantiate($resolved_class);

            if (method_exists($service, 'register')) {
                $service->register();
            }
        }
    }

    /**
     * Resolve and require the file for a given class.
     *
     */
    public static function require_file($class)
    {
        $file = str_replace('\\', '/', $class);
        $free_file = BP3D_PATH . str_replace('BP3D', 'inc', $file) . '.php';


        if (file_exists($free_file)) {
            require_once $free_file;
            return $class;
        }

        return false;
    }

    /**
     * Instantiate a class if it exists.
     *
     */
    private static function instantiate($class)
    {
        if (class_exists($class)) {
            return new $class();
        }

        return new \stdClass();
    }
}
