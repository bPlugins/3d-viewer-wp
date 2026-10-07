<?php



namespace BP3D\Shortcode;

if (!defined('ABSPATH')) {
    exit;
}

use BP3D\Helper\Utils;
use BP3D\Helper\Block;
use BP3D\Woocommerce\Product;

/**
 * Shortcode handler.
 *
 * Registers and renders the 
 * shortcodes for displaying 3D model viewers.
 */
class Shortcode
{
    /**
     * Register shortcodes.
     */
    public function register(): void
    {
        add_shortcode('3d_viewer', [$this, 'renderModelViewer']);
        add_shortcode('3d_viewer_product', [$this, 'renderProductModelViewer']);
    }

    /**
     * Render the  shortcode.
     *
     * @param  array<string, string>|string $atts  Shortcode attributes
     * @return string|false Rendered HTML or false on failure
     */
    public function renderModelViewer($atts)
    {
        $atts = shortcode_atts([
            'id' => '',
        ], $atts);

        $id = $atts['id'];

        if (!$id) {
            return false;
        }

        $post_type = get_post_type($id);
        
        $isGutenberg = get_post_meta($id, '_bp3d_is_gutenberg', true);
        if ($isGutenberg === '') {
            $isGutenberg = get_post_meta($id, 'isGutenberg', true);
        }

        if (!in_array($post_type, ['bp3d-model-viewer', 'product'], true)) {
            return false;
        }

        if ($isGutenberg) {
            return Block::instance()->render_block((int) $id);
        }

        ob_start();

        $meta = Utils::getPostMeta((int) $id, '_bp3dimages_');

        $finalData = Utils::buildViewerAttributes($meta, $id);

        /** @var array<string, mixed> $finalData */
        $finalData = apply_filters('bp3d_classic_model_attribute', $finalData);
        $model_url = $finalData['model']['modelUrl'] ?? '';

        ?>

        <div class="modelViewerBlock" data-attributes='<?php echo esc_attr(wp_json_encode($finalData)); ?>'>
            <div class="bp3d_backup_view" style="display: none;height:350px;">
                <model-viewer camera-controls src="<?php echo esc_url($model_url); ?>" style="height: 350px;"></model-viewer>
            </div>
        </div>

        <?php
        wp_enqueue_script('bp3d-public');
        wp_enqueue_style('bp3d-frontend');

        if ($meta('currentViewer') === 'O3DViewer') {
            wp_enqueue_script('bp3d-lib-o3dviewer');
        } else {
            wp_enqueue_script('bp3d-lib-model-viewer');
        }

        return ob_get_clean();
    }

    /**
     * Render the shortcode.
     *
     * @param  array<string, string>|string $attrs  Shortcode attributes
     * @return string|false Rendered HTML or false on failure
     */
    public function renderProductModelViewer($attrs)
    {
        $attrs = shortcode_atts([
            'id' => (string) get_the_ID(),
        ], $attrs);

        $post_type = get_post_type($attrs['id']);

        if ($post_type !== 'product') {
            return false;
        }

        return Product::instance()->get_3d_model_html(true, 'shortcode');
    }
}