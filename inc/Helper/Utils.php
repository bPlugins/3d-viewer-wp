<?php



namespace BP3D\Helper;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * General utility functions for the 3D Viewer plugin.
 *
 * Provides helper methods for post meta access, settings retrieval,
 * color conversion, theme compatibility, and CSS class generation.
 */
class Utils
{
    public static ?string $theme_name = null;

    public function __construct()
    {
        self::$theme_name = wp_get_theme()->name;
    }

    /**
     * Safely get a value from an array by key.
     *
     * @param  array<string, mixed>  $array
     * @param  string                $key
     * @param  mixed                 $default
     * @return mixed
     */
    public static function isset($array, $key, $default = false)
    {
        return $array[$key] ?? $default;
    }

    /**
     * Safely get a nested value from a two-level array.
     *
     * @param  array<string, mixed>  $array
     * @param  string                $key1
     * @param  string                $key2
     * @param  mixed                 $default
     * @return mixed
     */
    public static function isset2($array, $key1, $key2, $default = false)
    {
        return $array[$key1][$key2] ?? $default;
    }

    /**
     * Convert a hex color string to an RGB array.
     *
     * @param  string      $hex    Hex color (with or without #)
     * @param  float|false $alpha  Optional alpha value
     * @return array{r: int, g: int, b: int, a?: float}
     */
    public static function hexToRGB($hex, $alpha = false)
    {
        $hex = str_replace('#', '', $hex);
        $length = strlen($hex);

        $rgb = [
            'r' => hexdec($length === 6 ? substr($hex, 0, 2) : ($length === 3 ? str_repeat(substr($hex, 0, 1), 2) : '0')),
            'g' => hexdec($length === 6 ? substr($hex, 2, 2) : ($length === 3 ? str_repeat(substr($hex, 1, 1), 2) : '0')),
            'b' => hexdec($length === 6 ? substr($hex, 4, 2) : ($length === 3 ? str_repeat(substr($hex, 2, 1), 2) : '0')),
        ];

        if ($alpha !== false) {
            $rgb['a'] = $alpha;
        }

        return $rgb;
    }

    /**
     * Get the WooCommerce product gallery CSS selector for a given theme.
     *
     * @param  string $theme  Theme name
     * @return string CSS selector
     */
    public static function getCustomSelector(string $theme): string
    {
        $theme = str_replace(' Child', '', $theme);

        $selectors = [
            'Woostify' => '.product-gallery',
        ];

        return $selectors[$theme] ?? '.woocommerce-product-gallery';
    }

    /**
     * Convert a theme name to a CSS-safe class string.
     *
     * @param  string|null $string  Theme name (defaults to current theme)
     * @return string Lowercase, underscored class name
     */
    public static function getThemeClass($string = null)
    {
        if ($string === null) {
            $string = wp_get_theme()->name;
        }

        return strtolower(str_replace(' ', '_', $string));
    }

    /**
     * Get a list of themes known to be incompatible with the plugin.
     *
     * @return array<int, string>
     */
    public static function getNotCompatibleThemes(): array
    {
        $settings = get_option('_bp3d_settings_');
        $is_not_compatible = $settings['is_not_compatible'] ?? false;

        $themes = [
            'Twenty Twenty-Four',
            'Twenty Twenty Three',
            'Woostify',
            'Raft',
            'eStore',
            'Customify',
            'B Technologies',
        ];

        if ($is_not_compatible) {
            return wp_parse_args([wp_get_theme()->name], $themes);
        }

        return $themes;
    }

    /**
     * Check if the current theme is compatible with the plugin.
     */
    public static function isCompatibleTheme(): bool
    {
        if (
            in_array(wp_get_theme()->name, self::getNotCompatibleThemes(), true)
            || (function_exists('wp_is_block_theme') && wp_is_block_theme())
        ) {
            return false;
        }

        return true;
    }

    /**
     * Get a callable accessor for post meta values.
     *
     * Returns a closure that provides convenient access to meta fields
     * with support for default values, boolean casting, and nested keys.
     *
     * @param  int    $id   Post ID
     * @param  string $key  Meta key
     * @return \Closure(string, mixed=, bool=, string|null=): mixed
     */
    public static function getPostMeta($id, $key)
    {
        $meta = get_post_meta($id, $key, true);

        return self::return_function($meta);
    }

    /**
     * Create a closure accessor for an associative array.
     *
     * @param  mixed $meta  The data array (or other value)
     * @return \Closure(string, mixed=, bool=, string|null=): mixed
     */
    public static function return_function($meta)
    {
        return function ($key, $default = null, $is_boolean = false, $key2 = null) use ($meta) {
            if ($key === 'all') {
                return $meta;
            }

            $value = $key2
                ? ($meta[$key][$key2] ?? $default)
                : ($meta[$key] ?? $default);

            if ($is_boolean) {
                return $value == '1';
            }

            return $value;
        };
    }

    /**
     * Get a callable accessor for a plugin option.
     *
     * @param  string     $key      Option key
     * @param  mixed|null $default  Default value
     * @return \Closure
     */
    public static function getSettings($key, $default = null)
    {
        $settings = get_option($key, $default);

        return self::return_function($settings);
    }

    /**
     * Build the full viewer attributes array from a meta accessor.
     *
     * Shared between the frontend renderer (shortcode/block) and the
     * editor preview so both stay in sync.
     *
     * @param  \Closure    $meta  Meta accessor closure (see getPostMeta)
     * @param  string|int  $id    Post ID
     * @return array<string, mixed>
     */
    public static function buildViewerAttributes(\Closure $meta, $id): array
    {
        return [
            'model' => [
                'modelUrl' => $meta('bp_3d_src', [], false, 'url'),
                'poster' => $meta('bp_3d_poster', [], false, 'url'),
                'arEnabled' => $meta('bp_3d_enable_ar', '0', true),
                'arMode' => $meta('ar_mode', 'webxr scene-viewer quick-look'),
                'arPlacement' => $meta('ar_placement', 'floor'),
                'modelISOSrc' => $meta('model_iso_src'),
            ],
            'align' => $meta('bp_3d_align', 'center'),
            'uniqueId' => 'model' . $id,
            'currentViewer' => $meta('currentViewer', 'modelViewer'),
            'O3DVSettings' => [
                'isFullscreen' => $meta('bp_3d_fullscreen', '1', true),
                'camera' => null,
                'mouseControl' => $meta('bp_camera_control', '1', true),
                'zoom' => $meta('bp_3d_zooming', '1', true),
            ],
            'lazyLoad' => $meta('bp_3d_loading', 'lazy') === 'lazy',
            'loading' => $meta('bp_3d_loading'),
            'zoom' => $meta('bp_3d_zooming', '1', true),
            'preload' => 'auto',
            'mouseControl' => $meta('bp_camera_control', '1', true),
            'fullscreen' => $meta('bp_3d_fullscreen', '1', true),
            'zoomInOutBtn' => $meta('bp_3d_zoom_in_out_btn', '0', true),
            'cameraBtn' => $meta('bp_3d_camera_btn', '0', true),
            'loadingPercentage' => $meta('bp_model_progress_percent', '0', true),
            'progressBar' => $meta('bp_3d_progressbar', '0', true),
            'exposure' => $meta('3d_exposure', '1'),
            'shadow' => (float) $meta('3d_shadow_intensity', '1', false),
            'woo' => false,
            'placement' => 'shortcode',
            'styles' => [
                'width' => $meta('bp_3d_width', '100', false, 'width') . $meta('bp_3d_width', '%', false, 'unit'),
                'height' => $meta('bp_3d_height', '100', false, 'height') . $meta('bp_3d_height', '%', false, 'unit'),
                'bgColor' => $meta('bp_model_bg'),
            ],
        ];
    }
}
