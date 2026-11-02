<?php

namespace BP3D\Integrations\FluentCart;

use BP3D\Base\EnqueueAssets;
use BP3D\Helper\Utils;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The "3D Model" tab in FluentCart's product editor: a menu item in the product header (the SPA
 * fetches that menu from PHP) and a `products/:id/3d-model` route the client script adds to
 * FluentCart's router, so the tab opens inside FluentCart like Upgrade Paths and Integrations.
 */
final class AdminPage
{
    /** FluentCart marks the active tab by `li.fct_menu_{route name}`; the JS route uses the same name. */
    public const MENU_KEY = 'bp3d_model';

    public const ROUTE_PATH = '3d-model';

    public function register(): void
    {
        add_filter('fluent_cart/product_admin_items', [$this, 'menuItem'], 10, 2);
        add_action('fluent_cart/loading_app', [$this, 'enqueue']);
    }

    public static function url(int $id, string $baseUrl = ''): string
    {
        if ($baseUrl === '') {
            $baseUrl = admin_url('admin.php?page=fluent-cart#/');
        }

        return $baseUrl . 'products/' . $id . '/' . self::ROUTE_PATH;
    }

    /**
     * @param mixed $items
     * @param mixed $context
     * @return mixed
     */
    public function menuItem($items, $context = [])
    {
        $id = is_array($context) ? (int) ($context['product_id'] ?? 0) : 0;
        if (!is_array($items) || !ProductModel::canEdit($id)) {
            return $items;
        }

        $items[self::MENU_KEY] = [
            'label' => __('3D Model', '3d-viewer'),
            'link' => self::url($id, is_array($context) ? (string) ($context['base_url'] ?? '') : ''),
        ];

        return $items;
    }

    public function enqueue(): void
    {
        if (!current_user_can('edit_posts')) {
            return;
        }

        $hooks = 'fluent-cart_global_admin_hooks';
        $asset = EnqueueAssets::buildAsset('fluentcart-admin');
        $deps = isset($asset['dependencies']) && is_array($asset['dependencies']) ? $asset['dependencies'] : ['wp-element', 'wp-components', 'wp-i18n'];

        // Must run before FluentCart's app reads the `fluent_cart_routes` filter; its app is a deferred module.
        if (!FluentCart::enqueue('fluentcart-admin', FluentCart::ADMIN_HANDLE, array_merge($deps, [$hooks]))) {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_style('wp-components');
        wp_set_script_translations(FluentCart::ADMIN_HANDLE, '3d-viewer', BP3D_PATH . 'languages');

        wp_localize_script(FluentCart::ADMIN_HANDLE, 'bp3dFluentCart', [
            'tier' => 'basic',
            'routeName' => self::MENU_KEY,
            'routePath' => self::ROUTE_PATH,
            'restUrl' => rest_url(Rest::NAMESPACE . '/product/'),
            'nonce' => wp_create_nonce('wp_rest'),
            // Loaded by the tab on first open, not on every FluentCart screen.
            'modelViewerSrc' => BP3D_DIR . 'public/js/model-viewer.latest.min.js?ver=' . BP3D_VERSION,
            'positions' => ProductModel::positionLabels(),
            'modelTypes' => Utils::modelLibraryTypes(),
            'modelExtensions' => Utils::modelExtensions(),
            'heightDefault' => ProductModel::HEIGHT_DEFAULT,
            'heightMin' => ProductModel::HEIGHT_MIN,
            'heightMax' => ProductModel::HEIGHT_MAX,
        ]);
    }
}
