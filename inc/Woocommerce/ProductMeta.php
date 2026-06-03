<?php



namespace BP3D\Woocommerce;

use BP3D\Helper\Utils;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce product meta box.
 *
 * Registers the 3D product settings metabox on WooCommerce product
 * edit screens using the CSF framework. Defines model source, poster,
 * AR, hotspot, and positioning options.
 */
class ProductMeta
{
    protected string $prefix = '_bp3d_product_';

    /**
     * Register the metabox.
     */
    public function register(): void
    {
        $settings = get_option('_bp3d_settings_', ['3d_woo_switcher' => '']);

        if (($settings['3d_woo_switcher'] ?? '') === '0') {
            return;
        }

        \CSF::createMetabox($this->prefix, [
            'title' => esc_html__('3D Product Settings', '3d-viewer'),
            'post_type' => 'product',
            'show_restore' => true,
        ]);

        \CSF::createSection($this->prefix, [
            'fields' => $this->getFields(),
        ]);
    }

    /**
     * Build and return the metabox field definitions.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getFields(): array
    {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading post ID to render the metabox, no form data is processed.
        $post_id = isset($_GET['post']) ? absint(wp_unslash($_GET['post'])) : get_the_ID();
        $meta = Utils::getPostMeta($post_id, '_bp3d_product_');
        $models = $meta('bp3d_models', [], false);
        return [
            // Support link header
            [
                'id' => 'meta_heading',
                'type' => 'content',
                'title' => 'Support',
                'content' => 'Please leave a message if you encounter any issues on the product page. '
                    . '<a href="https://bplugins.com/support" target="_blank"><b>Support Center</b></a><br />'
                    . '<cite style="color:#2271b1; font-weight: bold">The premium version also supports the following formats: obj, stl, 3dm, 3ds, 3mf, amf, bim, brep, dae, fbx, fcstd, gltf, ifc, iges, step, off, ply, and wrl.</cite>',
            ],

            [
                'id' => 'bp3d_model_src',
                'type' => 'upload',
                'title' => esc_html__('3D Source', '3d-viewer'),
                'subtitle' => esc_html__('Upload Model Or Input Valid Model url', '3d-viewer'),
                'desc' => esc_html__('Upload / Paste Model url. Supported file type: glb, glTF', '3d-viewer'),
                'placeholder' => esc_html__('You Can Paste here Model url', '3d-viewer'),
                'default' => $models[0]['model_src'] ?? '',
            ],
            [
                'id' => 'bp3d_poster_src',
                'type' => 'upload',
                'title' => __('3D Poster', '3d-viewer'),
                'subtitle' => __('Upload Poster Or Input Valid poster/image url', '3d-viewer'),
                'placeholder' => 'You Can Paste here Poster/image url',
                'desc' => __('This image will display until the model is either loaded or fails to load.', '3d-viewer'),
                'default' => $models[0]['poster_src'] ?? '',
            ],

            // Viewer position
            [
                'id' => 'viewer_position',
                'type' => 'radio',
                'title' => esc_html__('3D Viewer Position', '3d-viewer'),
                'desc' => __('Select the position of the viewer', '3d-viewer'),
                'options' => [
                    'none' => esc_html__('None', '3d-viewer'),
                    'top' => esc_html__('Top of the product image', '3d-viewer'),
                    'bottom' => esc_html__('Bottom of the product image', '3d-viewer'),
                    'replace' => esc_html__('Replace Product Image with 3D', '3d-viewer'),
                    'merge_with_first_image' => 'Show 3D on First Image of Woocommerce Gallery',
                ],
                'default' => 'none',
            ],


            // Background color
            [
                'id' => 'bp_model_bg',
                'type' => 'color',
                'title' => __('Background', '3d-viewer'),
                'desc' => __('Set Background color', '3d-viewer'),
                'default' => 'transparent',
            ],

        ];
    }
}
