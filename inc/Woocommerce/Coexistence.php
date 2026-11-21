<?php

namespace BP3D\Woocommerce;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Lets another product viewer (the 3D Configurator) take over a product (plan RELEASE-2.4.0 §2.7).
 *
 * Filter `bp3d_product_show_3d( bool $show = true, int $product_id, string $placement )`. When it returns false,
 * 3D Viewer prints nothing for that placement and leaves the WooCommerce gallery as it is.
 * Closed placement vocabulary:
 *   automatic: `gallery` (replace/top/bottom/first image, incl. the incompatible-theme path), `tab`, `popup`, `loop`
 *   explicit:  `shortcode` (`[3d_viewer_product]`, the product widget and any other caller of get_3d_model_html())
 * Asked once per product and placement per request, so a render that passed a structural check isn't asked again.
 *
 * Filter `bp3d_product_has_3d( bool $has, int $product_id )`: whether the product has a 3D model, read from
 * `_bp3d_product_` the way this plugin renders it, so other plugins never read this plugin's meta.
 * The free plugin has no tab, popup or loop placement; the vocabulary is Pro's, unchanged.
 *
 * Feature detection: `has_filter('bp3d_product_has_3d')` is true on a host that asks `bp3d_product_show_3d`
 * (checked on or after `init`). Don't test `has_filter('bp3d_product_show_3d')`: the host only applies it.
 */
class Coexistence
{
    const SHOW_FILTER = 'bp3d_product_show_3d';
    const HAS_FILTER = 'bp3d_product_has_3d';

    const GALLERY = 'gallery';
    const TAB = 'tab';
    const POPUP = 'popup';
    const LOOP = 'loop';
    const SHORTCODE = 'shortcode';

    /** Internal placement strings => public value; anything unknown is an explicit embed. */
    const PLACEMENTS = [
        'product-gallery' => self::GALLERY,
        'product-gallery-inline' => self::GALLERY,
        'woocommerce-tab' => self::TAB,
        'popup' => self::POPUP,
        'shop-loop-item' => self::LOOP,
        'shortcode' => self::SHORTCODE,
        'block' => self::SHORTCODE,
    ];

    /** @var array<string, bool> */
    private static $memo = [];

    public static function register(): void
    {
        add_filter(self::HAS_FILTER, [self::class, 'hasModel'], 10, 2);
    }

    /** Maps an internal placement string to the public vocabulary. */
    public static function placement(string $internal): string
    {
        if (in_array($internal, self::PLACEMENTS, true)) {
            return $internal;
        }

        return self::PLACEMENTS[$internal] ?? self::SHORTCODE;
    }

    /** Whether 3D Viewer shows its viewer for this product here. Accepts internal or public placement strings. */
    public static function show(int $productId, string $placement): bool
    {
        if ($productId <= 0) {
            return true;
        }

        $placement = self::placement($placement);
        $key = $productId . '|' . $placement;

        if (!array_key_exists($key, self::$memo)) {
            self::$memo[$key] = (bool) apply_filters(self::SHOW_FILTER, true, $productId, $placement);
        }

        return self::$memo[$key];
    }

    /**
     * @param mixed $has
     * @param mixed $productId
     */
    public static function hasModel($has, $productId = 0): bool
    {
        if ($has) {
            return true;
        }

        $productId = (int) $productId;
        if ($productId <= 0) {
            return false;
        }

        $meta = get_post_meta($productId, '_bp3d_product_', true);

        // The same rule as Product::get_3d_model_html(): no model URL, no viewer.
        return is_array($meta) && trim(Product::effectiveModelUrl($meta)) !== '';
    }
}
