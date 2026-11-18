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
     * Inline-styled placeholder notice shown when a viewer has no model configured.
     *
     * The frontend stylesheet only loads with a rendered viewer, so styles are inline.
     *
     * @param  int $id Post ID
     * @return string
     */
    private static function noModelNotice(int $id): string
    {
        if(current_user_can('edit_post', $id)){
            return '<p class="bp3d-no-model" style="margin:0;padding:14px 16px;border:1px dashed #c3c4c7;border-radius:10px;background:#f6f7f7;color:#50575e;font-size:14px;line-height:1.5;">'
                . esc_html__('This 3D viewer has no model yet.', '3d-viewer') . '</p>';
        }

        return '';
    }

    /**
     * Render the [3d_viewer] shortcode.
     *
     * @param  array<string, string>|string $atts  Shortcode attributes
     * @return string|false Rendered HTML or false on failure
     */
    public function renderModelViewer($atts)
    {
        $atts = shortcode_atts([
            'id' => '',
        ], $atts);

        $id = absint($atts['id']);

        if (!$id) {
            return false;
        }

        $post_type = get_post_type($id);
        
        $isGutenberg = get_post_meta($id, '_bp3d_is_gutenberg', true);
        if ($isGutenberg === '') {
            $isGutenberg = get_post_meta($id, 'isGutenberg', true);
        }

        if (!in_array($post_type, ['bp3d-model-viewer', 'product'], true) || !self::isViewable((int) $id)) {
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
        $no_model =  '' === trim((string) $model_url);

        // No model: editors are told so, visitors get nothing (UI/UX 2.2 copy-no-model).
        if ($no_model) {
            ob_end_clean(); // discard the buffer opened above — never echo from a shortcode
            return current_user_can('edit_posts') ? self::noModelNotice((int) $id) : '';
        }
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
     * Visitors see published posts only. Drafts, scheduled and private posts show to users who may read them
     * (their editors), and trashed ones to no one. A password-protected one shows only to its editors, as a viewer
     * has no page to enter the password on.
     */
    public static function isViewable(int $id): bool
    {
        $status = get_post_status($id);

        if (post_password_required($id) && !current_user_can('edit_post', $id)) {
            return false;
        }

        if ('publish' === $status) {
            return true;
        }

        return $status && 'trash' !== $status && current_user_can('read_post', $id);
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

        $id = absint($attrs['id']);

        if (get_post_type($id) !== 'product' || !function_exists('wc_get_product')) {
            return false;
        }

        // The model comes from the product named by id, not from the page the shortcode sits on.
        global $product;
        $current = $product;
        $product = wc_get_product($id); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound, WordPress.WP.GlobalVariablesOverride.Prohibited -- WooCommerce's global, restored below.
        $html = Product::instance()->get_3d_model_html(true, 'shortcode');
        $product = $current; // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound, WordPress.WP.GlobalVariablesOverride.Prohibited

        return $html;
    }
}