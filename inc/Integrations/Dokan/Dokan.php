<?php

namespace BP3D\Integrations\Dokan;

use BP3D\Base\Marketplace;
use BP3D\Base\VendorUploadGuard;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Optional Dokan module bootstrap.
 *
 * Boots only when Dokan is loaded. The owner screen is always available then;
 * everything vendor-facing stays off until the owner enables it.
 */
class Dokan
{
    public const SCRIPT_HANDLE = 'bp3d-dokan-vendor';

    protected static ?Dokan $instance = null;

    private static bool $booted = false;

    protected ?VendorPolicy $policy = null;

    protected ?VendorModel $model = null;

    protected ?Settings $settings = null;

    public static function instance(): ?Dokan
    {
        return self::$instance;
    }

    public function register(): void
    {
        if (!class_exists(Marketplace::class) || !class_exists(VendorUploadGuard::class)) {
            return;
        }

        self::$instance = $this;

        if (did_action('dokan_loaded')) {
            $this->boot();
        } else {
            add_action('dokan_loaded', [$this, 'boot']);
        }
    }

    public function boot(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;

        $this->settings()->register();

        if (!$this->policy()->isEnabled()) {
            return;
        }

        // Core's vendor upload narrowing applies only while this module is present and enabled.
        if (method_exists(Marketplace::class, 'markModuleActive')) {
            Marketplace::markModuleActive();
        }

        add_action('transition_post_status', [$this, 'trackPublished'], 10, 3);

        $woo = get_option('_bp3d_settings_', ['3d_woo_switcher' => '']);
        if (is_array($woo) && isset($woo['3d_woo_switcher']) && $woo['3d_woo_switcher'] === '0') {
            return;
        }

        (new ClassicForm($this))->register();
        (new ProductEditor($this))->register();

        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets'], 20);
    }

    public function policy(): VendorPolicy
    {
        if ($this->policy === null) {
            $this->policy = new VendorPolicy();
        }

        return $this->policy;
    }

    public function model(): VendorModel
    {
        if ($this->model === null) {
            $this->model = new VendorModel($this->policy());
        }

        return $this->model;
    }

    public function settings(): Settings
    {
        if ($this->settings === null) {
            $this->settings = new Settings($this);
        }

        return $this->settings;
    }

    /**
     * Records that a vendor product was ever live, whoever published it (approve_live read-only).
     *
     * @param mixed $new_status
     * @param mixed $old_status
     * @param mixed $post
     */
    public function trackPublished($new_status, $old_status, $post): void
    {
        if (!$post instanceof \WP_Post || $post->post_type !== 'product') {
            return;
        }

        $live = ['publish', 'future', 'private'];
        if (!in_array($new_status, $live, true) && !in_array($old_status, $live, true)) {
            return;
        }

        $post_id = (int) $post->ID;
        if (get_post_meta($post_id, '_bp3d_vendor_published_once', true) === '1') {
            return;
        }

        $author = (int) $post->post_author;
        if (Marketplace::isVendorScope($post_id) || ($author > 0 && Marketplace::isMarketplaceVendor($author))) {
            update_post_meta($post_id, '_bp3d_vendor_published_once', '1');
        }
    }

    public function enqueueAssets(): void
    {
        if (!is_user_logged_in() || !self::onVendorDashboard()) {
            return;
        }

        if (!$this->policy()->currentUserMayAuthor()) {
            return;
        }

        if (!file_exists(BP3D_PATH . 'build/dokan-vendor.js')) {
            return;
        }

        $asset_file = BP3D_PATH . 'build/dokan-vendor.asset.php';
        $asset = file_exists($asset_file) ? include $asset_file : [];
        $asset = is_array($asset) ? $asset : [];
        $deps = isset($asset['dependencies']) && is_array($asset['dependencies']) ? $asset['dependencies'] : ['wp-hooks', 'wp-element', 'wp-i18n'];
        $version = $asset['version'] ?? BP3D_VERSION;

        wp_enqueue_media();

        wp_enqueue_script(self::SCRIPT_HANDLE, BP3D_DIR . 'build/dokan-vendor.js', $deps, $version, true);

        if (file_exists(BP3D_PATH . 'build/dokan-vendor.css')) {
            wp_enqueue_style(self::SCRIPT_HANDLE, BP3D_DIR . 'build/dokan-vendor.css', [], $version);
        }

        wp_set_script_translations(self::SCRIPT_HANDLE, '3d-viewer', BP3D_PATH . 'languages');
        wp_localize_script(self::SCRIPT_HANDLE, 'bp3dDokan', $this->policy()->clientConfig());

        // The classic handle is registered together with the module of the same id (Addons\Blocks).
        if (function_exists('wp_enqueue_script_module') && wp_script_is('bp3d-lib-model-viewer', 'registered')) {
            wp_enqueue_script_module('bp3d-lib-model-viewer');
        }
    }

    public static function debugLog(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Debug-only diagnostics.
            error_log('[3d-viewer dokan] ' . $message);
        }
    }

    /**
     * Product routes only: classic edit form, or the React dashboard ('new'), which routes client-side.
     */
    private static function onVendorDashboard(): bool
    {
        global $wp;

        if (function_exists('dokan_is_seller_dashboard') && dokan_is_seller_dashboard()) {
            $vars = isset($wp->query_vars) && is_array($wp->query_vars) ? $wp->query_vars : [];

            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing check.
            if (isset($vars['new']) || (isset($vars['products']) && isset($_GET['product_id']))) {
                return true;
            }
        }

        return function_exists('dokan_is_product_edit_page') && dokan_is_product_edit_page();
    }
}
