<?php

namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Keeps marketplace vendors from writing or reading this plugin's product meta
 * through the REST API or the product CSV importer (M1, R-read, Import).
 */
final class RestMetaGuard
{
    private const KEY_PATTERN = '/^_(bp3d|wc3d)/i';

    /** @var array<string, array{post_id: int, rows: array<int, array{key: string, value: string}>}> */
    private static array $snapshots = [];

    public function register(): void
    {
        foreach (['product', 'product_variation'] as $type) {
            add_filter("woocommerce_rest_pre_insert_{$type}_object", [$this, 'snapshot'], 999, 3);
            add_action("woocommerce_rest_insert_{$type}_object", [$this, 'restore'], 5, 3);
            // Dokan v1/v2 controllers (Abstracts/DokanRESTController) fire this after save.
            add_action("dokan_rest_insert_{$type}_object", [$this, 'restore'], 5, 3);
            add_filter("woocommerce_rest_prepare_{$type}_object", [$this, 'stripResponse'], 999, 3);
        }

        add_filter('dokan_rest_prepare_product_object', [$this, 'stripResponse'], 999, 3);

        add_filter('woocommerce_product_import_pre_insert_product_object', [$this, 'importSnapshot'], 999, 2);
        add_action('woocommerce_product_import_inserted_product_object', [$this, 'importRestore'], 5, 2);

        // Duplicate and variation-generate routes skip the pre_insert/insert pair above.
        add_action('woocommerce_product_duplicate_before_save', [$this, 'sanitizeDuplicate'], 999, 2);
        add_filter('rest_request_before_callbacks', [$this, 'filterGenerateRequest'], 10, 3);
    }

    /**
     * @param \WC_Data|mixed   $object
     * @param \WP_REST_Request $request
     * @param bool             $creating
     * @return \WC_Data|mixed
     */
    public function snapshot($object, $request = null, $creating = false)
    {
        try {
            if (!is_object($object) || !method_exists($object, 'get_id') || !Marketplace::isMarketplaceVendor()) {
                return $object;
            }

            $post_id = (int) $object->get_id();
            if ($post_id > 0) {
                $rows = self::readRows($post_id);
                if ($rows !== null) {
                    self::$snapshots['id:' . $post_id] = ['post_id' => $post_id, 'rows' => $rows];
                }
            } elseif (is_object($request)) {
                self::$snapshots['new:' . spl_object_hash($request)] = ['post_id' => 0, 'rows' => []];
            }
        } catch (\Throwable $e) {
            self::log($e);
        }

        return $object;
    }

    /**
     * @param \WC_Data|mixed   $object
     * @param \WP_REST_Request $request
     * @param bool             $creating
     */
    public function restore($object, $request = null, $creating = false): void
    {
        try {
            if (!is_object($object) || !method_exists($object, 'get_id')) {
                return;
            }

            $post_id = (int) $object->get_id();
            if ($post_id <= 0) {
                return;
            }

            $key = 'id:' . $post_id;
            if (!isset(self::$snapshots[$key]) && $creating && is_object($request)) {
                $key = 'new:' . spl_object_hash($request);
            }

            if (!isset(self::$snapshots[$key])) {
                return;
            }

            $snapshot = self::$snapshots[$key];
            unset(self::$snapshots[$key]);

            if ($snapshot['post_id'] !== 0 && $snapshot['post_id'] !== $post_id) {
                return;
            }

            if (self::applySnapshot($post_id, $snapshot['rows']) && method_exists($object, 'read_meta_data')) {
                $object->read_meta_data(true);
            }
        } catch (\Throwable $e) {
            self::log($e);
        }
    }

    /**
     * Remove our meta from REST responses unless the caller may edit that product.
     *
     * @param \WP_REST_Response|mixed $response
     * @param \WC_Data|mixed          $object
     * @param \WP_REST_Request|null   $request
     * @return \WP_REST_Response|mixed
     */
    public function stripResponse($response, $object = null, $request = null)
    {
        try {
            if (!$response instanceof \WP_REST_Response) {
                return $response;
            }

            $data = $response->get_data();
            if (!is_array($data) || empty($data['meta_data']) || !is_array($data['meta_data'])) {
                return $response;
            }

            $post_id = is_object($object) && method_exists($object, 'get_id') ? (int) $object->get_id() : (int) ($data['id'] ?? 0);
            if ($post_id > 0 && current_user_can('edit_post', $post_id)) {
                return $response;
            }

            $kept = [];
            $removed = false;
            foreach ($data['meta_data'] as $meta) {
                $key = null;
                if (is_object($meta)) {
                    $key = isset($meta->key) ? $meta->key : null;
                } elseif (is_array($meta)) {
                    $key = $meta['key'] ?? null;
                }

                if (is_string($key) && preg_match(self::KEY_PATTERN, $key)) {
                    $removed = true;
                    continue;
                }
                $kept[] = $meta;
            }

            if ($removed) {
                $data['meta_data'] = $kept;
                $response->set_data($data);
            }
        } catch (\Throwable $e) {
            self::log($e);
        }

        return $response;
    }

    /**
     * @param \WC_Product|mixed    $object
     * @param array<string, mixed> $data
     * @return \WC_Product|mixed
     */
    public function importSnapshot($object, $data = [])
    {
        try {
            if (!is_object($object) || !method_exists($object, 'get_id') || !Marketplace::isMarketplaceVendor()) {
                return $object;
            }

            $post_id = (int) $object->get_id();
            $rows = $post_id > 0 ? self::readRows($post_id) : [];
            if ($rows !== null) {
                self::$snapshots['import:' . spl_object_hash($object)] = ['post_id' => $post_id, 'rows' => $rows];
            }
        } catch (\Throwable $e) {
            self::log($e);
        }

        return $object;
    }

    /**
     * @param \WC_Product|mixed    $object
     * @param array<string, mixed> $data
     */
    public function importRestore($object, $data = []): void
    {
        try {
            if (!is_object($object) || !method_exists($object, 'get_id')) {
                return;
            }

            $key = 'import:' . spl_object_hash($object);
            if (!isset(self::$snapshots[$key])) {
                return;
            }

            $snapshot = self::$snapshots[$key];
            unset(self::$snapshots[$key]);

            $post_id = (int) $object->get_id();
            if ($post_id <= 0 || ($snapshot['post_id'] !== 0 && $snapshot['post_id'] !== $post_id)) {
                return;
            }

            if (self::applySnapshot($post_id, $snapshot['rows']) && method_exists($object, 'read_meta_data')) {
                $object->read_meta_data(true);
            }
        } catch (\Throwable $e) {
            self::log($e);
        }
    }

    /**
     * Vendor duplicates copy our meta from the source's stored rows, never the in-memory object.
     *
     * @param \WC_Product|mixed $duplicate
     * @param \WC_Product|mixed $product
     */
    public function sanitizeDuplicate($duplicate, $product = null): void
    {
        try {
            if (!is_object($duplicate) || !method_exists($duplicate, 'get_meta_data') || !method_exists($duplicate, 'delete_meta_data') || !method_exists($duplicate, 'add_meta_data')) {
                return;
            }

            if (!Marketplace::isMarketplaceVendor()) {
                return;
            }

            $ours = [];
            foreach ($duplicate->get_meta_data() as $meta) {
                $key = is_object($meta) && isset($meta->key) ? $meta->key : null;
                if (is_string($key) && preg_match(self::KEY_PATTERN, $key)) {
                    $ours[$key] = true;
                }
            }
            foreach (array_keys($ours) as $key) {
                $duplicate->delete_meta_data($key);
            }

            $source_id = is_object($product) && method_exists($product, 'get_id') ? (int) $product->get_id() : 0;
            if ($source_id <= 0) {
                return;
            }
            unset(self::$snapshots['id:' . $source_id]);

            $parent_id = method_exists($product, 'get_parent_id') ? (int) $product->get_parent_id() : 0;
            if (!current_user_can('edit_post', $parent_id > 0 ? $parent_id : $source_id)) {
                return;
            }

            $rows = self::readRows($source_id);
            if ($rows === null) {
                return;
            }
            ksort($rows);

            foreach ($rows as $row) {
                if (in_array($row['key'], Marketplace::META_KEYS_PRIVATE, true)) {
                    continue;
                }
                $duplicate->add_meta_data($row['key'], maybe_unserialize($row['value']));
            }
        } catch (\Throwable $e) {
            self::log($e);
        }
    }

    /**
     * Drop our keys from vendor meta_data on POST .../variations/generate (no insert hooks fire there).
     *
     * @param mixed                 $response
     * @param array<string, mixed>  $handler
     * @param \WP_REST_Request|null $request
     * @return mixed
     */
    public function filterGenerateRequest($response, $handler = [], $request = null)
    {
        try {
            if (!$request instanceof \WP_REST_Request || !preg_match('#/variations/generate$#', (string) $request->get_route())) {
                return $response;
            }

            $meta_data = $request->get_param('meta_data');
            if (!is_array($meta_data) || !Marketplace::isMarketplaceVendor()) {
                return $response;
            }

            $kept = [];
            $removed = false;
            foreach ($meta_data as $meta) {
                $key = null;
                if (is_array($meta)) {
                    $key = $meta['key'] ?? null;
                } elseif (is_object($meta)) {
                    $key = isset($meta->key) ? $meta->key : null;
                }

                if (is_string($key) && preg_match(self::KEY_PATTERN, $key)) {
                    $removed = true;
                    continue;
                }
                $kept[] = $meta;
            }

            if ($removed) {
                $request->set_param('meta_data', $kept);
            }
        } catch (\Throwable $e) {
            self::log($e);
        }

        return $response;
    }

    /**
     * Our meta rows for a post, keyed by meta_id. Null when the query fails.
     *
     * @return array<int, array{key: string, value: string}>|null
     */
    private static function readRows(int $post_id): ?array
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- meta_id level snapshot; the meta API cannot see renamed or deleted rows.
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT meta_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND (meta_key LIKE %s OR meta_key LIKE %s)",
                $post_id,
                $wpdb->esc_like('_bp3d') . '%',
                $wpdb->esc_like('_wc3d') . '%'
            ),
            ARRAY_A
        );

        if (!is_array($results) || $wpdb->last_error !== '') {
            return null;
        }

        $rows = [];
        foreach ($results as $row) {
            $key = (string) $row['meta_key'];
            if (preg_match(self::KEY_PATTERN, $key)) {
                $rows[(int) $row['meta_id']] = ['key' => $key, 'value' => (string) $row['meta_value']];
            }
        }

        return $rows;
    }

    /**
     * Put the post's prefixed rows back exactly as snapshotted (same meta_id, raw value).
     *
     * @param array<int, array{key: string, value: string}> $snapshot
     * @return bool True when rows were changed.
     */
    private static function applySnapshot(int $post_id, array $snapshot): bool
    {
        global $wpdb;

        $current = self::readRows($post_id);
        if ($current === null) {
            return false;
        }

        $changed = false;

        foreach ($current as $meta_id => $row) {
            if (isset($snapshot[$meta_id]) && $snapshot[$meta_id]['key'] === $row['key'] && $snapshot[$meta_id]['value'] === $row['value']) {
                continue;
            }
            // Set mid-save by the Dokan module's publish tracker; an added '1' only ever tightens vendor rights.
            if (!isset($snapshot[$meta_id]) && $row['key'] === '_bp3d_vendor_published_once' && $row['value'] === '1') {
                continue;
            }
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- see readRows().
            $wpdb->delete($wpdb->postmeta, ['meta_id' => $meta_id, 'post_id' => $post_id], ['%d', '%d']);
            $changed = true;
        }

        foreach ($snapshot as $meta_id => $row) {
            if (isset($current[$meta_id]) && $current[$meta_id]['key'] === $row['key'] && $current[$meta_id]['value'] === $row['value']) {
                continue;
            }
            // A row renamed to a foreign key keeps its meta_id; free the id before re-inserting.
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- see readRows().
            $wpdb->delete($wpdb->postmeta, ['meta_id' => $meta_id, 'post_id' => $post_id], ['%d', '%d']);
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- see readRows().
            $wpdb->insert(
                $wpdb->postmeta,
                ['meta_id' => $meta_id, 'post_id' => $post_id, 'meta_key' => $row['key'], 'meta_value' => $row['value']],
                ['%d', '%d', '%s', '%s']
            );
            $changed = true;
        }

        if ($changed) {
            wp_cache_delete($post_id, 'post_meta');
            clean_post_cache($post_id);
            if (class_exists('WC_Cache_Helper') && method_exists('WC_Cache_Helper', 'invalidate_cache_group')) {
                \WC_Cache_Helper::invalidate_cache_group('object_' . $post_id);
            }
        }

        return $changed;
    }

    private static function log(\Throwable $e): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[3d-viewer] RestMetaGuard: ' . $e->getMessage()); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- debug only.
        }
    }
}
