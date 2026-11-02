<?php

namespace BP3D\Integrations\FluentCart;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Optional FluentCart module bootstrap. Mirrors the Pro module's basic tier: same data, routes and markup.
 *
 * Boots only when FluentCart 2.2.0+ is loaded. Prints nothing until a product has a model.
 * Remove the Init line, the two webpack entries and this folder to drop the module.
 */
final class FluentCart
{
    public const VERSION_MIN = '2.2.0';

    public const POST_TYPE = 'fluent-products';

    /** Switch on 3D Viewer → Settings, stored in `_bp3d_settings_`; unset means on, like `3d_woo_switcher`. */
    public const SWITCH = '3d_fluentcart_switcher';

    public const ADMIN_HANDLE = 'bp3d-fluentcart-admin';

    public const FRONT_HANDLE = 'bp3d-fluentcart-storefront';

    private static bool $booted = false;

    public function register(): void
    {
        // FluentCart fires this on plugins_loaded; the version constant exists by then.
        if (did_action('fluentcart_loaded')) {
            $this->boot();
        } else {
            add_action('fluentcart_loaded', [$this, 'boot']);
        }
    }

    public static function available(): bool
    {
        return defined('FLUENTCART_VERSION')
            && version_compare((string) FLUENTCART_VERSION, self::VERSION_MIN, '>=')
            && class_exists('\\FluentCart\\App\\Models\\Product')
            && function_exists('fluent_cart_get_current_product');
    }

    /** @param mixed $value */
    public static function isOn($value): bool
    {
        return in_array($value, ['1', 1, true, 'true', 'yes'], true);
    }

    public static function enabled(): bool
    {
        $settings = get_option('_bp3d_settings_', []);
        if (!is_array($settings) || !array_key_exists(self::SWITCH, $settings)) {
            return true;
        }

        return self::isOn($settings[self::SWITCH]);
    }

    public function boot(): void
    {
        if (self::$booted || !self::available()) {
            return;
        }
        self::$booted = true;

        (new Settings())->register();

        if (!self::enabled()) {
            return;
        }

        (new AdminPage())->register();
        (new Rest())->register();
        (new Storefront())->register();
    }

    /**
     * Enqueue a built entry (script + stylesheet). False when the build is missing.
     *
     * @param string[] $fallbackDeps
     */
    public static function enqueue(string $entry, string $handle, array $fallbackDeps = []): bool
    {
        if (!file_exists(BP3D_PATH . "build/{$entry}.js")) {
            return false;
        }

        $asset_file = BP3D_PATH . "build/{$entry}.asset.php";
        $asset = file_exists($asset_file) ? include $asset_file : [];
        $asset = is_array($asset) ? $asset : [];
        $deps = isset($asset['dependencies']) && is_array($asset['dependencies']) ? $asset['dependencies'] : $fallbackDeps;
        $version = $asset['version'] ?? BP3D_VERSION;

        wp_enqueue_script($handle, BP3D_DIR . "build/{$entry}.js", $deps, $version, true);

        if (file_exists(BP3D_PATH . "build/{$entry}.css")) {
            wp_enqueue_style($handle, BP3D_DIR . "build/{$entry}.css", [], $version);
        }

        return true;
    }

    public static function debugLog(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Debug-only diagnostics.
            error_log('[3d-viewer fluentcart] ' . $message);
        }
    }
}
