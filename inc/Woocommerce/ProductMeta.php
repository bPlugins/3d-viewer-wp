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
            // Modern: one card per field, like the viewer Add New page; Codestar ignores it.
            'layout' => 'cards',
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
        // The save request carries post_ID only; the AR fields must be declared there too or they are dropped.
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Only selects which fields to declare; the form framework verifies its nonce before saving.
        if (!$post_id && isset($_POST['post_ID'])) {
            $post_id = absint(wp_unslash($_POST['post_ID'])); // phpcs:ignore WordPress.Security.NonceVerification.Missing
        }
        $raw_meta = get_post_meta($post_id, '_bp3d_product_', true);
        $raw_meta = is_array($raw_meta) ? $raw_meta : [];
        $meta = Utils::getPostMeta($post_id, '_bp3d_product_');
        $models = $meta('bp3d_models', [], false);

        // Pro saves media fields as ['url' => ..., 'id' => ...].
        $url = static function ($value): string {
            $value = is_array($value) ? ($value['url'] ?? '') : $value;
            return is_scalar($value) ? (string) $value : '';
        };

        if (isset($models[0]['model_src'])) {
            $model_src = $url($models[0]['model_src']);
        } else {
            $model_src = $url($raw_meta['bp3d_model_src'] ?? '');
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
                'content' => \BP3D\Helper\Utils::enabledFormatsNote() ?: sprintf(
                    /* translators: %s: URL to the settings page. */
                    __('Uploading 3D files (GLB, GLTF, OBJ, STL, FBX, HDR, etc.) is allowed by default. You can turn any format off in the <a href="%s" target="_blank">3D Viewer Settings</a>.', '3d-viewer'),
                    admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
                ),
            ];
        }

        $fields = array_merge($fields, [
            // Support link header
            [
                'id' => 'meta_heading',
                'icon' => 'info',
                'type' => 'content',
                'title' => esc_html__('Support', '3d-viewer'),
                'content' => esc_html__('Please leave a message if you encounter any issues on the product page.', '3d-viewer') . ' '
                    . '<a href="https://bplugins.com/support" target="_blank"><b>' . esc_html__('Support Center', '3d-viewer') . '</b></a><br />'
                    . '<cite style="color:#2271b1; font-weight: bold">' . esc_html__('The free product viewer displays GLB and GLTF models. Premium adds OBJ, STL, 3DM, 3DS, 3MF, AMF, BIM, BREP, DAE, FBX, FCSTD, IFC, IGES, STEP, OFF, PLY and WRL.', '3d-viewer') . '</cite>',
            ],

            [
                'id' => 'bp3d_model_src',
                'icon' => 'link',
                'type' => 'upload',
                'library' => \BP3D\Helper\Utils::modelLibraryTypes(),
                'title' => esc_html__('3D Source', '3d-viewer'),
                'subtitle' => esc_html__('Upload Model Or Input Valid Model url', '3d-viewer'),
                'desc' => esc_html__('Upload or paste a model URL. GLB and GLTF are supported; other formats need Premium.', '3d-viewer'),
                'placeholder' => esc_html__('You Can Paste here Model url', '3d-viewer'),
                'default' => $url($models[0]['model_src'] ?? ''),
            ],
            [
                'id' => 'bp3d_poster_src',
                'icon' => 'image',
                'type' => 'upload',
                'title' => __('3D Poster', '3d-viewer'),
                'subtitle' => __('Upload Poster Or Input Valid poster/image url', '3d-viewer'),
                'placeholder' => 'You Can Paste here Poster/image url',
                'desc' => __('This image will display until the model is either loaded or fails to load.', '3d-viewer'),
                'default' => $url($models[0]['poster_src'] ?? ''),
            ],
        ]);

        // Only products with a model row (Pro or Dokan vendor data) get the AR fields; the viewer reads AR from row 0.
        $row0 = isset($models[0]) && is_array($models[0]) ? $models[0] : null;
        if ($row0 !== null) {
            $fields[] = [
                'id' => 'bp3d_enable_ar',
                'icon' => 'phone',
                'type' => 'switcher',
                'title' => esc_html__('Enable AR', '3d-viewer'),
                'desc' => esc_html__('Let visitors view the model in their own space on supported devices.', '3d-viewer'),
                'default' => in_array($row0['enable_ar'] ?? '', ['1', 1, true, 'true', 'yes'], true),
            ];
            $fields[] = [
                'id' => 'bp3d_model_iso_src',
                'icon' => 'link',
                'type' => 'upload',
                'title' => esc_html__('USDZ model (iOS AR)', '3d-viewer'),
                'desc' => esc_html__('Optional .usdz file used for AR on iPhone and iPad.', '3d-viewer'),
                'default' => $url($row0['model_iso_src'] ?? ''),
                'sanitize' => [Utils::class, 'safeMediaUrl'],
                'dependency' => ['bp3d_enable_ar', '==', '1'],
            ];
        }

        $position_options = [
            'none' => esc_html__('None', '3d-viewer'),
            'top' => esc_html__('Top of the product image', '3d-viewer'),
            'bottom' => esc_html__('Bottom of the product image', '3d-viewer'),
            'replace' => esc_html__('Replace Product Image with 3D', '3d-viewer'),
            'merge_with_first_image' => esc_html__('Show 3D on First Image of Woocommerce Gallery', '3d-viewer'),
        ];

        // List a Premium-only stored value (tab, custom_selector) so the select doesn't fall back to "None"; saving keeps it.
        $stored_position = $meta('viewer_position', '');
        if (is_string($stored_position) && $stored_position !== '' && !isset($position_options[$stored_position])) {
            /* translators: %s: stored viewer position key. */
            $position_options[$stored_position] = sprintf(esc_html__('%s (Premium)', '3d-viewer'), ucwords(str_replace('_', ' ', $stored_position)));
        }

        $fields = array_merge($fields, [
            // Viewer position
            [
                'id' => 'viewer_position',
                'icon' => 'layers',
                'type' => 'select',
                'title' => esc_html__('3D Viewer Position', '3d-viewer'),
                'desc' => __('Select the position of the viewer', '3d-viewer'),
                'options' => $position_options,
                // Products that already have 3D meta keep the old None fallback; only a product without any starts on the first gallery image.
                'default' => $raw_meta ? 'none' : 'merge_with_first_image',
            ],


            // Background color
            [
                'id' => 'bp_model_bg',
                'icon' => 'palette',
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

        // An explicit free choice always applies; a Premium-only value (tab, custom_selector) or '' keeps what is stored.
        $free_positions = ['none', 'top', 'bottom', 'replace', 'merge_with_first_image'];
        $posted_position = $data['viewer_position'] ?? '';
        if (is_string($posted_position) && in_array($posted_position, $free_positions, true)) {
            $merged['viewer_position'] = $posted_position;
        }

        // AR fields write to row 0 only when the form showed them and the value changed.
        if ($row0 !== null && $this->transportPosted()) {
            if (array_key_exists('bp3d_enable_ar', $data)) {
                $ar_on = in_array($unslash($data['bp3d_enable_ar']), ['1', 1, true], true);
                if ($ar_on !== in_array($row0['enable_ar'] ?? '', ['1', 1, true, 'true', 'yes'], true)) {
                    $merged['bp3d_models'][0]['enable_ar'] = $ar_on ? '1' : '';
                }
            }

            if (array_key_exists('bp3d_model_iso_src', $data)
                && !$this->sameValue($unslash($data['bp3d_model_iso_src']), $row0['model_iso_src'] ?? '')) {
                $merged['bp3d_models'][0]['model_iso_src'] = Utils::safeMediaUrl($unslash($data['bp3d_model_iso_src']));
            }
        }

        return array_diff_key($merged, self::TRANSPORT_KEYS);
    }

    /**
     * Whether the AR fields were on the submitted form, not just declared at save time.
     */
    private function transportPosted(): bool
    {
        // phpcs:disable WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput -- Runs inside the save filter after the form framework verified its nonce; only key presence is read.
        // Classic posts the fields as an array; Modern (bfields) posts them as JSON in bfields_values.
        $request = isset($_POST[$this->prefix]) && is_array($_POST[$this->prefix]) ? $_POST[$this->prefix] : [];
        if (!$request && isset($_POST['bfields_values'][$this->prefix]) && is_string($_POST['bfields_values'][$this->prefix])) {
            $decoded = json_decode(wp_unslash($_POST['bfields_values'][$this->prefix]), true);
            $request = is_array($decoded) ? $decoded : [];
        }
        // phpcs:enable

        return array_key_exists('bp3d_enable_ar', $request) || array_key_exists('bp3d_model_iso_src', $request);
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
