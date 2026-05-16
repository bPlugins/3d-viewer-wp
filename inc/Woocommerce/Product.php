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
        if (!is_array($modelData) || empty($modelData['bp3d_models']) || !is_array($modelData['bp3d_models'])) {
            return [];
        }

        global $product;

        $product_id = ($product && method_exists($product, 'get_id')) ? $product->get_id() : 0;
        $meta = Utils::getPostMeta($product_id, '_bp3d_product_');

        if (!$meta('all')) {
            return [];
        }

        $get_option = Utils::getSettings('_bp3d_settings_');

        // Gather product variant attribute keys
        $variant_keys = self::getVariantKeys($product);

        // Build models array
        $models = self::buildModelsArray($modelData['bp3d_models'], $variant_keys);

        return [
            'align' => 'center',
            'uniqueId' => 'model' . get_the_ID(),
            'O3DVSettings' => [
                'isFullscreen' => true,
                'isNavigation' => $meta('show_arrows', false, true),
                'mouseControl' => true,
                'zoom' => $meta('bp_3d_zooming', $get_option('bp_3d_zooming', '1'), true),
                'isPagination' => $meta('show_thumbs', false, true),
            ],
            'currentViewer' => $meta('currentViewer', 'modelViewer'),
            'multiple' => true,
            'model' => [
                'modelUrl' => $models[0]['modelUrl'] ?? '',
                'poster' => $models[0]['poster'] ?? '',
            ],
            'models' => [],
            'show_model_instead_thumbnail' => $meta('show_model_instead_thumbnail', false, true),
            'zoom' => $meta('bp_3d_zooming', $get_option('bp_3d_zooming', '1'), true),
            'lazyLoad' => $get_option('bp_3d_loading', 'lazy') === 'lazy',
            'autoplay' => $get_option('bp_3d_autoplay', false, true),
            'shadow' => $get_option('3d_shadow_intensity', '1', false),
            'autoRotate' => $get_option('bp_3d_rotate', false, true),
            'rotateDelay' => (int) $get_option('3d_rotate_delay', 200),
            'isPagination' => $meta('show_thumbs', false, true),
            'isNavigation' => $meta('show_arrows', false, true),
            'hotspotStyle' => $meta('hotspot_style', 'style-1'),
            'preload' => 'auto',
            'rotationPerSecond' => $get_option('3d_rotate_speed', 20),
            'mouseControl' => $get_option('bp_camera_control', '1', true),
            'fullscreen' => $get_option('bp_3d_fullscreen', '1', true),
            'variant' => false,
            'loadingPercentage' => false,
            'progressBar' => $get_option('bp_3d_progressbar', '1', true),
            'rotate' => $meta('bp_model_angle', false, true),
            'rotateAlongX' => $meta('angle_property', 0, false, 'top'),
            'rotateAlongY' => $meta('angle_property', 75, false, 'right'),
            'exposure' => 1,
            'styles' => [
                'width' => '100%',
                'height' => $meta('bp_3d_height', '350', false, 'height') . $meta('bp_3d_height', 'px', false, 'unit'),
                'bgColor' => $meta('bp_model_bg', 'transparent'),
                'progressBarColor' => '#666',
            ],
            'stylesheet' => null,
            'additional' => [
                'ID' => '',
                'Class' => '',
                'CSS' => '',
            ],
            'animation' => false,
            'woo' => true,
            'selectedAnimation' => '',
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
     * Build the formatted models array from raw model data.
     *
     * @param  array<int, array<string, mixed>> $raw_models   Raw model entries
     * @param  array<int, string>               $variant_keys Variant attribute keys
     * @return array<int, array<string, mixed>>
     */
    private static function buildModelsArray(array $raw_models, array $variant_keys): array
    {
        $models = [];

        foreach ($raw_models as $value) {
            $model = [
                'modelUrl' => $value['model_src'] ?? '',
                'poster' => $value['poster_src'] ?? '',
            ];

            $models[] = $model;
        }

        return $models;
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



