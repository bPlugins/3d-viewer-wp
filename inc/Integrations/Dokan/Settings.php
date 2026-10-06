<?php

namespace BP3D\Integrations\Dokan;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Owner screen "Marketplace (Dokan)" (option `bp3d_dokan_settings`).
 *
 * Registered whenever Dokan is active so the owner can switch vendor authoring on.
 * Saves overlay only the declared keys, so restrictions stored by 3D Viewer Pro survive.
 */
class Settings
{
    public const OPTION = 'bp3d_dokan_settings';

    protected Dokan $module;

    public function __construct(Dokan $module)
    {
        $this->module = $module;
    }

    public function register(): void
    {
        if (!is_admin()) {
            return;
        }

        add_filter('csf_' . self::OPTION . '_save', [$this, 'preserve'], 10, 2);

        if (did_action('init')) {
            $this->init();
        } else {
            add_action('init', [$this, 'init'], 0);
        }
    }

    public function init(): void
    {
        if (!class_exists('CSF')) {
            return;
        }

        \CSF::createOptions(self::OPTION, [
            'menu_title' => __('Marketplace (Dokan)', '3d-viewer'),
            'menu_slug' => 'bp3d-dokan',
            'menu_type' => 'submenu',
            'menu_parent' => 'edit.php?post_type=bp3d-model-viewer',
            'menu_capability' => 'manage_options',
            'menu_position' => 91,
            'theme' => 'light',
            'framework_title' => __('3D Viewer for Dokan marketplaces', '3d-viewer'),
            'footer' => false,
            'show_reset_all' => false,
            'show_reset_section' => false,
            'show_search' => false,
            'show_bar_menu' => false,
            // Nothing is written until the owner saves; a missing option means off.
            'save_defaults' => false,
        ]);

        \CSF::createSection(self::OPTION, [
            'title' => __('Vendors', '3d-viewer'),
            'icon' => 'fas fa-store',
            'fields' => $this->fields(),
        ]);
    }

    /**
     * Stored option overlaid with the declared keys only (premium Field\Settings::overlayDeclared).
     *
     * @param mixed $data
     * @param mixed $instance CSF options instance.
     * @return array<string, mixed>
     */
    public function preserve($data, $instance = null): array
    {
        if (!is_array($data)) {
            $data = [];
        }

        $stored = get_option(self::OPTION, []);
        if (!is_array($stored) || empty($stored)) {
            return $data;
        }

        $declared = [];
        foreach ((is_object($instance) && !empty($instance->pre_fields)) ? $instance->pre_fields : [] as $field) {
            if (!empty($field['id'])) {
                $declared[] = $field['id'];
            }
        }
        if (!$declared) {
            $declared = array_keys($data);
        }

        foreach ($declared as $key) {
            if (array_key_exists($key, $data)) {
                $stored[$key] = $data[$key];
            }
        }

        return $stored;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function fields(): array
    {
        $policy = $this->module->policy();
        $fields = $this->notices();

        $fields[] = [
            'id' => 'enabled',
            'type' => 'switcher',
            'title' => __('Allow vendors to add 3D models', '3d-viewer'),
            'desc' => __('Vendors can add a GLB model, a poster image, an optional USDZ file for iOS AR, a viewer position and a background color to their own products in the Dokan dashboard. Off by default.', '3d-viewer'),
            'text_on' => __('Yes', '3d-viewer'),
            'text_off' => __('No', '3d-viewer'),
            'default' => false,
        ];

        $limits = [
            __('GLB and USDZ files only.', '3d-viewer'),
            /* translators: %s: size in MB. */
            sprintf(__('Maximum file size: %s MB.', '3d-viewer'), $policy->maxMegabytes()),
            __('Vendors can only use files they uploaded themselves.', '3d-viewer'),
            __('One 3D model per product.', '3d-viewer'),
            __('Products with advanced 3D settings stay read-only for vendors.', '3d-viewer'),
        ];

        $fields[] = [
            'type' => 'content',
            'title' => __('Safety limits', '3d-viewer'),
            'content' => $this->listHtml($limits),
        ];

        $stored = $policy->storedProKeys();
        if ($stored) {
            $fields[] = [
                'type' => 'content',
                'title' => __('Saved restrictions', '3d-viewer'),
                'content' => '<p>' . esc_html__('These vendor restrictions were saved earlier and still apply:', '3d-viewer') . '</p>' . $this->listHtml($this->describe($stored)),
            ];

            $fields[] = [
                'id' => 'free_scope',
                'type' => 'switcher',
                'title' => __('Use free defaults', '3d-viewer'),
                'desc' => __('Ignore the saved restrictions above and use the free defaults for every enabled vendor. This deletes nothing.', '3d-viewer'),
                'text_on' => __('Yes', '3d-viewer'),
                'text_off' => __('No', '3d-viewer'),
                'default' => false,
            ];
        }

        $fields[] = [
            'type' => 'content',
            'content' => '<p>' . esc_html__('More vendor controls are available in 3D Viewer Pro.', '3d-viewer') . '</p>',
        ];

        return $fields;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function notices(): array
    {
        $notices = [];

        $settings = get_option('_bp3d_settings_', []);
        if (is_array($settings) && array_key_exists('allowed_mime_types', $settings) && is_array($settings['allowed_mime_types'])) {
            $missing = array_values(array_diff(['glb', 'usdz'], $settings['allowed_mime_types']));
            if ($missing) {
                $notices[] = [
                    'type' => 'notice',
                    'style' => 'warning',
                    'content' => esc_html(sprintf(
                        /* translators: %s: file types, e.g. "GLB, USDZ". */
                        __('%s uploads are turned off in 3D Viewer Settings (Allowed Mime Types), so vendors cannot upload them.', '3d-viewer'),
                        strtoupper(implode(', ', $missing))
                    )),
                ];
            }
        }

        if (!ProductEditor::supported()) {
            $notices[] = [
                'type' => 'notice',
                'style' => 'warning',
                'content' => esc_html(sprintf(
                    /* translators: %s: Dokan version number. */
                    __('The 3D Model field needs Dokan %s or newer in the new product editor. Vendors can still use it in the classic editor.', '3d-viewer'),
                    ProductEditor::MIN_DOKAN
                )),
            ];
        }

        $stripped = get_transient(ProductEditor::STRIPPED_TRANSIENT);
        if ($stripped) {
            $notices[] = [
                'type' => 'notice',
                'style' => 'warning',
                'content' => esc_html__('Dokan did not show the 3D Model field in its new product editor recently. Vendors can still use the classic editor. Updating 3D Viewer and Dokan usually fixes this.', '3d-viewer'),
            ];
        }

        return $notices;
    }

    /**
     * @param array<string, mixed> $stored Output of VendorPolicy::storedProKeys().
     * @return string[]
     */
    protected function describe(array $stored): array
    {
        $lines = [];
        $labels = [
            'model' => __('3D model', '3d-viewer'),
            'poster' => __('Poster image', '3d-viewer'),
            'usdz' => __('USDZ model', '3d-viewer'),
            'ar' => __('AR', '3d-viewer'),
            'position' => __('Viewer position', '3d-viewer'),
            'background' => __('Background', '3d-viewer'),
        ];

        if (isset($stored['access'])) {
            if ($stored['access'] === 'selected') {
                $count = count((array) ($stored['vendors'] ?? []));
                /* translators: %d: number of vendors. */
                $lines[] = sprintf(_n('Only %d selected vendor may add 3D models.', 'Only %d selected vendors may add 3D models.', $count, '3d-viewer'), $count);
            } else {
                $lines[] = __('Vendor access uses a rule this version cannot apply, so no vendor can add 3D models.', '3d-viewer');
            }
        }

        if (isset($stored['fields'])) {
            $names = array_map(function ($field) use ($labels) {
                return $labels[$field] ?? $field;
            }, (array) $stored['fields']);
            $lines[] = $names
                /* translators: %s: comma-separated field names. */
                ? sprintf(__('Vendors may edit only: %s.', '3d-viewer'), implode(', ', $names))
                : __('Vendors may not edit any 3D field.', '3d-viewer');
        }

        if (isset($stored['max_file_mb'])) {
            $mb = (float) $stored['max_file_mb'];
            /* translators: %s: size in MB. */
            $lines[] = sprintf(__('Lower maximum file size: %s MB.', '3d-viewer'), number_format_i18n($mb, floor($mb) == $mb ? 0 : 1));
        }

        if (isset($stored['quota_mb'])) {
            /* translators: %s: size in MB. */
            $lines[] = sprintf(__('Storage limit per vendor: %s MB.', '3d-viewer'), number_format_i18n((float) $stored['quota_mb']));
        }

        if (!empty($stored['approve_live'])) {
            $lines[] = __('Published products are read-only for vendors.', '3d-viewer');
        }

        if (isset($stored['default_position'])) {
            $position = (string) $stored['default_position'];
            foreach ($this->module->policy()->positionOptions() as $option) {
                if ($option['value'] === $position) {
                    $position = $option['label'];
                }
            }
            /* translators: %s: viewer position name. */
            $lines[] = sprintf(__('Default viewer position for a first model: %s.', '3d-viewer'), $position);
        }

        if ($this->module->policy()->freeScope()) {
            $lines[] = __('Free defaults are on, so these restrictions are currently ignored.', '3d-viewer');
        }

        return $lines;
    }

    /**
     * @param string[] $items
     */
    private function listHtml(array $items): string
    {
        $html = '<ul style="list-style:disc;margin:0 0 0 18px;">';
        foreach ($items as $item) {
            $html .= '<li>' . esc_html($item) . '</li>';
        }

        return $html . '</ul>';
    }
}
