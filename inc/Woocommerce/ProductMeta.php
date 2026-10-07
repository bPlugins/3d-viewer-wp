<?php



namespace BP3D\Woocommerce;

use BP3D\Helper\Registrar;
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

    /** Form-only keys mirrored into row 0 of bp3d_models and never stored top-level. */
    private const TRANSPORT_KEYS = ['bp3d_enable_ar' => 'enable_ar', 'bp3d_model_iso_src' => 'model_iso_src'];

    /**
     * Register the metabox.
     */
    public function register(): void
    {
        if (!is_admin()) {
            return;
        }

        add_filter('csf_' . $this->prefix . '_save', [$this, 'preserveProData'], 10, 3);

        $settings = get_option('_bp3d_settings_', ['3d_woo_switcher' => '']);

        if (($settings['3d_woo_switcher'] ?? '') === '0') {
            return;
        }

        Registrar::createMetabox($this->prefix, [
            'title' => esc_html__('3D Product Settings', '3d-viewer'),
            'post_type' => 'product',
            'show_restore' => false,
        ]);

        Registrar::createSection($this->prefix, [
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
        // The save request carries post_ID only; the AR fields must be declared there too or CSF drops them.
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Only selects which fields to declare; CSF verifies its nonce before saving.
        if (!$post_id && isset($_POST['post_ID'])) {
            $post_id = absint(wp_unslash($_POST['post_ID'])); // phpcs:ignore WordPress.Security.NonceVerification.Missing
        }
        $meta = Utils::getPostMeta($post_id, '_bp3d_product_');
        $models = $meta('bp3d_models', [], false);
        $row0 = is_array($models) && isset($models[0]) && is_array($models[0]) ? $models[0] : null;

        $model_src = '';
        if (isset($models[0]['model_src'])) {
            $model_src = $models[0]['model_src'];
        } else {
            $meta_raw = get_post_meta($post_id, '_bp3d_product_', true);
            $model_src = isset($meta_raw['bp3d_model_src']) ? (is_array($meta_raw['bp3d_model_src']) ? ($meta_raw['bp3d_model_src']['url'] ?? '') : $meta_raw['bp3d_model_src']) : '';
        }

        $allowed_mimes = Utils::getAllowedMimeTypes();

        $fields = [];

        $show_notice = false;
        $notice_content = '';

        if (empty($allowed_mimes)) {
            $show_notice = true;
            $notice_content = sprintf(
                /* translators: %s: URL to the settings page. */
                __('<strong>Notice:</strong> All 3D file formats are currently disabled for upload. Please enable the formats you need in the <a href="%s" target="_blank">3D Viewer Settings</a>.', '3d-viewer'),
                admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
            );
        } elseif (!empty($model_src)) {
            $ext = strtolower(pathinfo($model_src, PATHINFO_EXTENSION));
            $supported = Utils::getSupportedMimeTypes();
            if (in_array($ext, $supported, true) && !in_array($ext, $allowed_mimes, true)) {
                $show_notice = true;
                $notice_content = sprintf(
                    /* translators: 1: 3D file extension, 2: URL to the settings page. */
                    __('<strong>Warning:</strong> The uploaded 3D model format (.%1$s) is currently disabled. Please enable it in the <a href="%2$s" target="_blank">3D Viewer Settings</a> to ensure it loads properly.', '3d-viewer'),
                    strtoupper($ext),
                    admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
                );
            }
        }

        if ($show_notice) {
            $fields[] = [
                'type'    => 'notice',
                'style'   => 'danger',
                'content' => $notice_content,
            ];
        } else {
            $fields[] = [
                'type'    => 'notice',
                'style'   => 'info',
                'content' => sprintf(
                    /* translators: %s: URL to the settings page. */
                    __('All supported 3D formats (GLB, GLTF, OBJ, STL, FBX, HDR, etc.) are enabled for upload by default. You can turn any of them off in the <a href="%s" target="_blank">3D Viewer Settings</a>.', '3d-viewer'),
                    admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
                ),
            ];
        }

        $fields = array_merge($fields, [
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
                'desc' => esc_html__('Upload / Paste Model url. Supported file types: glb, gltf, obj, stl, fbx, dae, 3ds, 3mf, step, wrl, usdz.', '3d-viewer'),
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
        ]);

        // Only products that already have a model row (Pro or vendor data) get the AR fields.
        if ($row0 !== null) {
            $fields[] = [
                'id' => 'bp3d_enable_ar',
                'type' => 'switcher',
                'title' => esc_html__('Enable AR', '3d-viewer'),
                'desc' => esc_html__('Let visitors view the model in their own space on supported devices.', '3d-viewer'),
                'default' => in_array($row0['enable_ar'] ?? '', ['1', 1, true, 'true', 'yes'], true),
            ];
            $fields[] = [
                'id' => 'bp3d_model_iso_src',
                'type' => 'upload',
                'title' => esc_html__('USDZ model (iOS AR)', '3d-viewer'),
                'desc' => esc_html__('Optional .usdz file used for AR on iPhone and iPad.', '3d-viewer'),
                'default' => is_string($row0['model_iso_src'] ?? null) ? $row0['model_iso_src'] : '',
                'dependency' => ['bp3d_enable_ar', '==', '1'],
            ];
        }

        $fields = array_merge($fields, [
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

        ]);

        return $fields;
    }

    /**
     * Rebuild the saved meta on top of what is stored, so keys this box does not declare
     * (Pro, vendor, future) survive a save from it.
     *
     * Codestar passes slashed data (re-slashed here for update_post_meta()); bfields passes it unslashed and slashes itself.
     *
     * @param  mixed     $data     Sanitized declared fields from the form
     * @param  int|mixed $post_id
     * @param  mixed     $instance CSF_Metabox (Classic) or \BFields\Compat\Instance (Modern)
     * @return array<string, mixed>
     */
    public function preserveProData($data, $post_id = 0, $instance = null): array
    {
        if (!is_array($data)) {
            $data = [];
        }

        $slashed = !($instance instanceof \BFields\Compat\Instance);
        $unslash = $slashed ? 'wp_unslash' : static function ($value) {
            return $value;
        };

        $stored = get_post_meta((int) $post_id, $this->prefix, true);

        if (!is_array($stored) || !$stored) {
            return array_diff_key($data, self::TRANSPORT_KEYS);
        }

        $merged = $slashed ? wp_slash($stored) : $stored;
        $row0 = isset($stored['bp3d_models'][0]) && is_array($stored['bp3d_models'][0]) ? $stored['bp3d_models'][0] : null;

        if (array_key_exists('bp_model_bg', $data)) {
            $merged['bp_model_bg'] = $data['bp_model_bg'];
        }

        foreach (['bp3d_model_src' => 'model_src', 'bp3d_poster_src' => 'poster_src'] as $flat => $field) {
            if (!array_key_exists($flat, $data)) {
                continue;
            }

            // The field showed the stored flat value, or row 0's value when the flat key was unset.
            $shown = isset($stored[$flat]) ? $stored[$flat] : ($row0[$field] ?? '');
            $changed = !$this->sameValue($unslash($data[$flat]), $shown);

            // With row 0, an unchanged flat key stays byte-identical so it keeps matching row 0.
            if ($row0 === null || (array_key_exists($flat, $stored) && $changed)) {
                $merged[$flat] = $data[$flat];
            }

            if ($row0 !== null && $changed) {
                $merged['bp3d_models'][0][$field] = $data[$flat];
            }
        }

        // An explicit free choice always applies; an untouched radio posts '' and keeps a value it cannot show (Pro 'tab', custom_selector).
        $free_positions = ['none', 'top', 'bottom', 'replace', 'merge_with_first_image'];
        $posted_position = $data['viewer_position'] ?? '';
        if (is_string($posted_position) && in_array($posted_position, $free_positions, true)) {
            $merged['viewer_position'] = $posted_position;
        }

        if ($row0 !== null && $this->transportPosted($data, $slashed)) {
            if (array_key_exists('bp3d_enable_ar', $data)) {
                $ar_on = $unslash($data['bp3d_enable_ar']) === '1';
                if ($ar_on !== in_array($row0['enable_ar'] ?? '', ['1', 1, true, 'true', 'yes'], true)) {
                    $merged['bp3d_models'][0]['enable_ar'] = $ar_on ? '1' : '';
                }
            }

            if (array_key_exists('bp3d_model_iso_src', $data)
                && !$this->sameValue($unslash($data['bp3d_model_iso_src']), $row0['model_iso_src'] ?? '')) {
                $merged['bp3d_models'][0]['model_iso_src'] = $data['bp3d_model_iso_src'];
            }
        }

        return array_diff_key($merged, self::TRANSPORT_KEYS);
    }

    /**
     * Whether the AR fields were on the submitted form (not just declared at save time).
     */
    private function transportPosted(array $data, bool $classic): bool
    {
        // bfields posts every declared field, and getFields() declares these two only when row 0 exists.
        if (!$classic) {
            return array_key_exists('bp3d_enable_ar', $data) && array_key_exists('bp3d_model_iso_src', $data);
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Runs inside the CSF save filter, after CSF verified its nonce.
        $request = isset($_POST[$this->prefix]) && is_array($_POST[$this->prefix]) ? $_POST[$this->prefix] : [];

        return isset($request['bp3d_enable_ar'], $request['bp3d_model_iso_src']);
    }

    /**
     * Compare a posted URL with a stored one, ignoring what the CSF round trip changes (kses entities, whitespace).
     *
     * @param mixed $posted  Unslashed posted value
     * @param mixed $current Stored value (string or media array)
     */
    private function sameValue($posted, $current): bool
    {
        $normalize = function ($value): string {
            if (is_array($value)) {
                $value = $value['url'] ?? '';
            }
            if (!is_scalar($value)) {
                return '';
            }

            return trim(html_entity_decode(wp_kses_post((string) $value), ENT_QUOTES, 'UTF-8'));
        };

        return $normalize($posted) === $normalize($current);
    }
}
