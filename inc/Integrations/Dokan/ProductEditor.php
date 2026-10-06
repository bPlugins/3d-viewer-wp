<?php

namespace BP3D\Integrations\Dokan;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * "3D Model" card in Dokan's React product editor (Dokan Lite 5.0.16+).
 *
 * The field value carries display state only; the server writes nothing unless the
 * client adds a `{v:1, ...}` envelope. Validated before Dokan saves, written after.
 */
class ProductEditor
{
    public const FIELD_ID = 'bp3d_model';

    public const SECTION_ID = 'bp3d_model_section';

    public const MIN_DOKAN = '5.0.16';

    public const STRIPPED_TRANSIENT = 'bp3d_dokan_field_stripped';

    protected Dokan $module;

    /** @var array<string, array{id: int, raw: mixed, plan: array<string, mixed>}> */
    private static array $stash = [];

    public function __construct(Dokan $module)
    {
        $this->module = $module;
    }

    public static function supported(): bool
    {
        return defined('DOKAN_PLUGIN_VERSION') && version_compare((string) DOKAN_PLUGIN_VERSION, self::MIN_DOKAN, '>=');
    }

    public function register(): void
    {
        if (!self::supported()) {
            return;
        }

        add_filter('dokan_product_editor_prepared_schema', [$this, 'schema'], 20, 2);
        add_filter('dokan_product_editor_layouts', [$this, 'layouts'], 20, 1);
        add_filter('dokan_product_editor_schema_value', [$this, 'value'], 10, 3);
        add_filter('dokan_product_editor_args', [$this, 'args'], 20, 3);
        add_filter('dokan_rest_pre_insert_product_object', [$this, 'preInsert'], 10, 3);
        add_action('woocommerce_rest_insert_product_object', [$this, 'commit'], 20, 3);
    }

    /**
     * @param mixed $items
     * @param mixed $product_id
     * @return mixed
     */
    public function schema($items, $product_id = 0)
    {
        if (!is_array($items) || !$this->applies((int) $product_id)) {
            return $items;
        }

        foreach ($items as $item) {
            if (is_array($item) && ($item['id'] ?? '') === self::FIELD_ID) {
                return $items;
            }
        }

        try {
            $product_id = (int) $product_id;
            $state = $this->module->model()->prepare($product_id, $product_id > 0 && get_post_status($product_id) === 'auto-draft');
        } catch (\Throwable $e) {
            Dokan::debugLog('schema failed for product ' . (int) $product_id . ': ' . $e->getMessage());

            return $items;
        }

        $items[] = [
            'id' => self::SECTION_ID,
            'type' => 'section',
            'section_id' => null,
            'label' => __('3D Model', '3d-viewer'),
            'description' => __('Show an interactive 3D model on the product page.', '3d-viewer'),
            'visibility' => true,
        ];

        $items[] = [
            'id' => self::FIELD_ID,
            'type' => 'field',
            'variant' => 'bp3d_model',
            'section_id' => self::SECTION_ID,
            'label' => __('Model files', '3d-viewer'),
            'visibility' => true,
            'visibilities' => ['variation' => false],
            'is_custom' => true,
            'bp3d' => $state,
        ];

        return $items;
    }

    /**
     * Card right after Inventory; Inventory and Shipping share a priority, so insert by position.
     *
     * @param mixed $layouts
     * @return mixed
     */
    public function layouts($layouts)
    {
        if (!is_array($layouts) || !$this->module->policy()->currentUserMayAuthor()) {
            return $layouts;
        }

        $layouts = array_values($layouts);
        $at = false;

        foreach ($layouts as $index => $node) {
            $id = is_array($node) ? ($node['id'] ?? '') : '';
            if ($id === self::SECTION_ID) {
                return $layouts;
            }
            if ($id === 'inventory' && $at === false) {
                $at = $index;
            }
        }

        $node = [
            'id' => self::SECTION_ID,
            'parent_id' => 'primary_column',
            'priority' => 45,
            'layout' => ['type' => 'card', 'withHeader' => true],
            'children' => [self::FIELD_ID],
        ];

        if ($at === false) {
            $layouts[] = $node;
        } else {
            $node['priority'] = $layouts[$at]['priority'] ?? 40;
            array_splice($layouts, $at + 1, 0, [$node]);
        }

        return $layouts;
    }

    /**
     * @param mixed $value
     * @param mixed $field_name
     * @param mixed $product
     * @return mixed
     */
    public function value($value, $field_name = '', $product = null)
    {
        if ($field_name !== self::FIELD_ID || !($product instanceof \WC_Product)) {
            return $value;
        }

        try {
            // Never empty (Dokan swaps empty values for the schema default) and no 'v' key: no write unless the UI adds one.
            return ['state' => $this->module->model()->prepare((int) $product->get_id(), $product->get_status() === 'auto-draft')];
        } catch (\Throwable $e) {
            Dokan::debugLog('value failed: ' . $e->getMessage());

            return $value;
        }
    }

    /**
     * Owner notice when Dokan drops our field from the editor.
     *
     * @param mixed $args
     * @param mixed $product_id
     * @param mixed $product
     * @return mixed
     */
    public function args($args, $product_id = 0, $product = null)
    {
        if (!is_array($args) || !$this->applies((int) $product_id)) {
            return $args;
        }

        foreach ((array) ($args['form_items'] ?? []) as $item) {
            if (is_array($item) && ($item['id'] ?? '') === self::FIELD_ID) {
                return $args;
            }
        }

        if (!get_transient(self::STRIPPED_TRANSIENT)) {
            set_transient(self::STRIPPED_TRANSIENT, time(), DAY_IN_SECONDS);
        }

        return $args;
    }

    /**
     * @param mixed $product
     * @param mixed $request
     * @param mixed $creating
     * @return mixed
     */
    public function preInsert($product, $request = null, $creating = false)
    {
        if (is_wp_error($product) || !is_object($product) || !($request instanceof \WP_REST_Request) || !$request->has_param(self::FIELD_ID)) {
            return $product;
        }

        try {
            $raw = $request->get_param(self::FIELD_ID);
            if (VendorModel::normalizeEnvelope($raw) === null) {
                return $product;
            }

            $creating = (bool) $creating;
            $id = $creating ? 0 : (method_exists($product, 'get_id') ? (int) $product->get_id() : 0);
            $status = method_exists($product, 'get_status') ? (string) $product->get_status() : null;

            $plan = $this->module->model()->plan($id, $raw, $this->module->policy()->currentVendorId(), [
                'creating' => $creating,
                'status' => $status,
            ]);

            if (is_wp_error($plan)) {
                return new \WP_Error($plan->get_error_code(), $plan->get_error_message(), ['status' => 400]);
            }

            if (!empty($plan['write'])) {
                self::$stash[spl_object_hash($request)] = ['id' => $id, 'raw' => $raw, 'plan' => $plan];
            }
        } catch (\Throwable $e) {
            Dokan::debugLog('pre-insert failed: ' . $e->getMessage());
        }

        return $product;
    }

    /**
     * @param mixed $object
     * @param mixed $request
     * @param mixed $creating
     */
    public function commit($object, $request = null, $creating = false): void
    {
        if (!($request instanceof \WP_REST_Request)) {
            return;
        }

        $key = spl_object_hash($request);
        if (!isset(self::$stash[$key])) {
            return;
        }

        $entry = self::$stash[$key];
        unset(self::$stash[$key]);

        try {
            if (strpos((string) $request->get_route(), '/dokan/v3/products') !== 0 || !is_object($object) || !method_exists($object, 'get_id')) {
                return;
            }

            $id = (int) $object->get_id();
            if ($id <= 0) {
                return;
            }

            $plan = $entry['plan'];
            if ($entry['id'] !== $id) {
                // Planned before the product had an ID (create): plan again against it.
                $plan = $this->module->model()->plan($id, $entry['raw'], $this->module->policy()->currentVendorId(), [
                    'creating' => (bool) $creating,
                    'status' => method_exists($object, 'get_status') ? (string) $object->get_status() : null,
                ]);
                if (is_wp_error($plan)) {
                    return;
                }
            }

            $this->module->model()->commit($id, $plan);
        } catch (\Throwable $e) {
            Dokan::debugLog('commit failed: ' . $e->getMessage());
        }
    }

    private function applies(int $product_id): bool
    {
        if ($product_id > 0 && get_post_type($product_id) !== 'product') {
            return false;
        }

        return $this->module->policy()->currentUserMayAuthor();
    }
}
