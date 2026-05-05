<?php



namespace BP3D\Addons\Controls;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Elementor custom controls manager.
 *
 * Registers custom Elementor controls for file selection
 * in the 3D Viewer widget editor.
 */
final class Controls
{
    private static ?self $_instance = null;

    public static function instance(): self
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    public function __construct()
    {
        add_action('elementor/controls/register', [$this, 'registerControls']);
    }

    /**
     * Register custom Elementor controls.
     *
     */
    public function registerControls($controls_manager)
    {
        require_once __DIR__ . '/b-select-file.php';
        $controls_manager->register(new SelectFile());
    }
}
