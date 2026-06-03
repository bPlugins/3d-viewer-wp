<?php



namespace BP3D\Woocommerce;

if (!defined('ABSPATH')) {
    exit;
}

use BP3D\Helper\Utils;

/**
 * WooCommerce product 3D model data handler.
 *
 * Manages the retrieval and formatting of 3D model configuration data
 * for WooCommerce products, including product variant support.
 */
class Product
{
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
     * Build the full model viewer attributes array for a WooCommerce product.
     *
     * @param  array<string, mixed> $modelData  Raw model data from post meta
     * @return array<string, mixed> Formatted attributes array
     */
    public static function getProductAttributes(array $modelData = []): array
    {
        if (!is_array($modelData)) {
            return [];
        }

        global $product;

        $product_id = ($product && method_exists($product, 'get_id')) ? $product->get_id() : 0;
        $meta = Utils::getPostMeta($product_id, '_bp3d_product_');

        if (!$meta('all')) {
            return [];
        }

        $get_option = Utils::getSettings('_bp3d_settings_');

        $model_src = $modelData['bp3d_model_src'] ?? $modelData['bp3d_models']['0']['model_src'] ?? '';
        $poster = $modelData['bp3d_poster_src'] ?? $modelData['bp3d_models']['0']['poster_src'] ?? '';
        

        return [
            'align' => 'center',
            'uniqueId' => 'model' . get_the_ID(),
            'O3DVSettings' => [
                'isFullscreen' => true,
                'mouseControl' => true,
                'zoom' => $meta('bp_3d_zooming', $get_option('bp_3d_zooming', '1'), true),
            ],
            'model' => [
                'modelUrl' => $model_src,
                'poster' => $poster,
            ],
            'zoom' => $meta('bp_3d_zooming', $get_option('bp_3d_zooming', '1'), true),
            'lazyLoad' => $get_option('bp_3d_loading', 'lazy') === 'lazy',
            'preload' => 'auto',
            'mouseControl' => $get_option('bp_camera_control', '1', true),
            'fullscreen' => $get_option('bp_3d_fullscreen', '1', true),
            'loadingPercentage' => false,
            'progressBar' => $get_option('bp_3d_progressbar', '1', true),
            'styles' => [
                'width' => '100%',
                'height' => $meta('bp_3d_height', '350', false, 'height') . $meta('bp_3d_height', 'px', false, 'unit'),
                'bgColor' => $meta('bp_model_bg', 'transparent'),
            ],
            'woo' => true,
            'placement' => 'shortcode',
        ];
    }

    /**
     * Extract variant attribute keys from a variable product.
     *
     * @param  \WC_Product|null $product
     * @return array<int, string>
     */
    private static function getVariantKeys($product)
    {
        $variant_keys = [];

        if (!$product || !method_exists($product, 'get_available_variations')) {
            return $variant_keys;
        }

        $variations = $product->get_available_variations();

        if (!$variations) {
            return $variant_keys;
        }

        $list = wp_list_pluck($variations, 'attributes');

        if ($list && is_array($list[0])) {
            $variant_keys = array_keys($list[0]);
        }

        return $variant_keys;
    }

    /**
     * Render the 3D model viewer HTML for a WooCommerce product.
     *
     * @param  bool   $return     True to return HTML, false to echo
     * @param  string $placement  Placement context (shortcode, product-gallery, etc.)
     * @param  bool   $popup      Whether this is a popup rendering
     * @return string Rendered HTML (when $return is true)
     */
    public function get_3d_model_html($return = true, $placement = 'block'): string
    {
        global $product;

        if (!$product || !$product->get_id()) {
            return '';
        }
        
        $meta = Utils::getPostMeta($product->get_id(), '_bp3d_product_');
        $modelData = $meta('all');
        $finalData = self::getProductAttributes($modelData);

        $class = Utils::getThemeClass();

        if ($placement === 'product-gallery-inline') {
            $class .= ' position_' . $meta('viewer_position');
        }

        $finalData['position'] = $meta('viewer_position');
        $finalData['is_not_compatible'] = !Utils::isCompatibleTheme();
        $finalData['placement'] = $placement;
        $finalData['show_model_instead_thumbnail'] = $meta('show_model_instead_thumbnail', false, true);

        /** @var array<string, mixed> $finalData */
        $finalData = apply_filters('bp3d_woocommerce_model_attribute', $finalData);

        $active_class = $meta('show_model_instead_thumbnail', false, true) ? 'active' : '';

        ob_start(); ?>
        <div class="modelViewerBlock wooCustomSelector product_<?php echo esc_attr($class); ?> <?php echo esc_attr($active_class); ?>"
            data-attributes='<?php echo esc_attr(wp_json_encode($finalData)); ?>'></div>
        <?php

        wp_enqueue_script('bp3d-public');
        wp_enqueue_style('bp3d-frontend');

        if ($meta('currentViewer') === 'O3DViewer') {
            wp_enqueue_script('bp3d-lib-o3dviewer');
        } else {
            wp_enqueue_script_module('bp3d-lib-model-viewer');
        }

        $content = ob_get_clean() ?: '';

        if ($return) {
            return $content;
        }

        echo wp_kses_post($content);
        return '';
    }

}



