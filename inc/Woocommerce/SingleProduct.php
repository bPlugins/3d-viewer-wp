<?php



namespace BP3D\Woocommerce;

if (!defined('ABSPATH')) {
    exit;
}

use BP3D\Helper\Utils;

/**
 * WooCommerce single product integration.
 *
 * Manages the display of 3D model viewers on WooCommerce single product
 * pages, handling viewer positioning, gallery replacement, and theme
 * compatibility.
 */
class SingleProduct
{
    public string $theme_name = '';

    /**
     * Register WooCommerce integration hooks.
     */
    public function register(): void
    {
        $this->theme_name = wp_get_theme()->name;

        add_action('wp', [$this, 'onWoocommerceLoaded']);
        add_action('wp_footer', [$this, 'handleIncompatibleTheme']);
        add_action('bp3d_product_model_before', [$this, 'renderModel']);
        add_action('bp3d_product_model_after', [$this, 'renderModel']);
        add_action('woocommerce_product_thumbnails', [$this, 'renderGalleryThumbnail'], 40);
    }

    /**
     * Handle WooCommerce page load — conditionally replace the product gallery.
     *
     * Removes the default product images and substitutes the 3D model viewer
     * based on viewer position settings and theme compatibility.
     */
    public function onWoocommerceLoaded(): void
    {
        $meta = Utils::getPostMeta(get_the_ID(), '_bp3d_product_');
        $settings = Utils::getSettings('_bp3d_settings_');

        if (
            $meta('force_to_change_position', false, true)
            || $meta('is_custom_selector', false, true)
            || in_array($meta('viewer_position'), ['none', 'merge_with_first_image', 'custom_selector'], true)
            || !Utils::isCompatibleTheme()
        ) {
            return;
        }

        $models = $meta('bp3d_models', []);
        $model_src = $meta('bp3d_model_src') ?? $models['0']['model_src'] ?? '';

        if ($model_src === '') {
            return;
        }

        if ($settings('3d_woo_switcher') !== '0' && $settings('is_not_compatible') !== '1') {
            remove_action('woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 10);
            remove_action('woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 20);
            remove_action('woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 30);
            add_action('woocommerce_before_single_product_summary', [$this, 'renderProductModels'], 20);
        }
    }

    /**
     * Handle incompatible themes by rendering the 3D viewer in the footer.
     */
    public function handleIncompatibleTheme(): void
    {
        global $product;

        $settings = Utils::getSettings('_bp3d_settings_');
        $woo_enabled = $settings('3d_woo_switcher') !== '0';

        if (!$woo_enabled || !is_object($product) || !is_single()) {
            return;
        }

        if (!method_exists($product, 'get_id')) {
            return;
        }

        if (Utils::isCompatibleTheme()) {
            return;
        }

        Product::instance()->get_3d_model_html(false, 'product-gallery');
    }

    /**
     * Add 3D model thumbnail to WooCommerce product gallery.
     *
     * Renders the 3D model viewer inline when position is set to merge with first image.
     */
    public function renderGalleryThumbnail(): void
    {
        $meta = Utils::getPostMeta(get_the_ID(), '_bp3d_product_');

        if ($meta('viewer_position') === 'merge_with_first_image') {
            Product::instance()->get_3d_model_html(false, 'product-gallery-inline');
        }
    }

    /**
     * Render the full product model gallery with 3D support.
     *
     * Replaces or augments the WooCommerce product image gallery
     * with 3D model viewer based on the configured viewer position.
     */
    public function renderProductModels(): void
    {
        if (!function_exists('wc_get_gallery_image_html')) {
            return;
        }

        $modeview_3d = get_post_meta(get_the_ID(), '_bp3d_product_', true);
        $viewer_position = is_array($modeview_3d) ? ($modeview_3d['viewer_position'] ?? 'none') : 'none';
        $class = Utils::getThemeClass($this->theme_name);

        // Handle incompatible themes with replace position
        if (in_array($this->theme_name, Utils::getNotCompatibleThemes(), true)) {
            if ($viewer_position === 'replace') {
                $custom_selector = Utils::getCustomSelector($this->theme_name);
                ?>
                <style>
                    <?php echo esc_html($custom_selector); ?>
                    >*:not(.modelViewerBlock) {
                        display: none;
                    }
                </style>
                <?php
            }
            return;
        }

        global $product;

        wp_enqueue_script('bp3d-public');

        // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core WooCommerce hook, must keep its name for compatibility.
        $columns = apply_filters('woocommerce_product_thumbnails_columns', 4);
        $post_thumbnail_id = $product->get_image_id();
        // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core WooCommerce hook, must keep its name for compatibility.
        $wrapper_classes = apply_filters('woocommerce_single_product_image_gallery_classes',
            [
                'woocommerce-product-gallery',
                'woocommerce-product-gallery--' . ($post_thumbnail_id ? 'with-images' : 'without-images'),
                'woocommerce-product-gallery--columns-' . absint($columns),
                'images',
            ]
        );

        ?>
        <div class="product-modal-wrap <?php echo esc_attr($class); ?> position_<?php echo esc_attr($viewer_position); ?>">
            <div class="<?php echo esc_attr(implode(' ', array_map('sanitize_html_class', $wrapper_classes))); ?>"
                data-columns="<?php echo esc_attr((string) $columns); ?>">
                <?php
                if (in_array($viewer_position, ['top', 'replace'], true)) {
                    if ($viewer_position === 'replace') {
                        add_filter('woocommerce_single_product_image_thumbnail_html', '__return_empty_string', 10, 2);
                    }
                    do_action('bp3d_product_model_before');
                }
                ?>

                <figure class="woocommerce-product-gallery__wrapper">
                    <?php
                    if ($post_thumbnail_id) {
                        $html = \wc_get_gallery_image_html($post_thumbnail_id, true);
                    } else {
                        $html = '<div class="woocommerce-product-gallery__image--placeholder">';
                        $html .= sprintf(
                            '<img src="%s" alt="%s" class="wp-post-image" />',
                            esc_url(\wc_placeholder_img_src('woocommerce_single')),
                            esc_html__('Awaiting product image', '3d-viewer')
                        );
                        $html .= '</div>';
                    }

                    // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound, WordPress.Security.EscapeOutput.OutputNotEscaped -- Core WooCommerce hook; output escaped by WooCommerce.
                    echo apply_filters('woocommerce_single_product_image_thumbnail_html', $html, $post_thumbnail_id);
                    // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core WooCommerce hook, must keep its name for compatibility.
                    do_action('woocommerce_product_thumbnails');
                    ?>
                </figure>
            </div>

            <?php
            if ($viewer_position === 'bottom') {
                do_action('bp3d_product_model_after');
            }
            ?>
        </div>
        <?php
    }

    /**
     * Render the 3D model viewer for hook callbacks.
     */
    public function renderModel(): void
    {
        
        Product::instance()->get_3d_model_html(false, 'product-gallery');
    }
}
