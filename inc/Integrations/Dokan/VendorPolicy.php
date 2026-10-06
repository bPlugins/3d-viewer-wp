<?php

namespace BP3D\Integrations\Dokan;

use BP3D\Base\Marketplace;
use BP3D\Base\VendorUploadGuard;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Who may author vendor 3D data, which fields, and the limits.
 *
 * Free scope plus a fail-closed reading of restrictions saved by 3D Viewer Pro:
 * a stored restriction is honoured until the owner picks "Use free defaults".
 */
class VendorPolicy
{
    public const FIELDS = ['model', 'poster', 'usdz', 'ar', 'position', 'background'];

    public const POSITIONS = ['none', 'top', 'bottom', 'replace', 'merge_with_first_image'];

    public const POSTER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    /**
     * @return array<string, mixed>
     */
    protected function settings(): array
    {
        return Marketplace::settings();
    }

    public function isEnabled(): bool
    {
        return ($this->settings()['enabled'] ?? '') === '1';
    }

    public function freeScope(): bool
    {
        return ($this->settings()['free_scope'] ?? '') === '1';
    }

    public function mayAuthor(int $vendor_id): bool
    {
        if (!$this->isEnabled() || $vendor_id <= 0) {
            return false;
        }

        if (user_can($vendor_id, 'manage_woocommerce')) {
            return true;
        }

        if (function_exists('dokan_is_seller_enabled') && !dokan_is_seller_enabled($vendor_id)) {
            return false;
        }

        if ($this->freeScope()) {
            return true;
        }

        $settings = $this->settings();
        $access = $settings['access'] ?? 'all';

        if ($access === 'all') {
            return true;
        }

        if ($access === 'selected') {
            return in_array($vendor_id, array_map('intval', (array) ($settings['vendors'] ?? [])), true);
        }

        // Unknown scopes (e.g. Pro "packs" without its adapter) fail closed.
        return false;
    }

    public function currentVendorId(): int
    {
        return function_exists('dokan_get_current_user_id') ? (int) dokan_get_current_user_id() : (int) get_current_user_id();
    }

    public function currentUserMayAuthor(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        if (!Marketplace::isMarketplaceVendor() && !current_user_can('manage_woocommerce')) {
            return false;
        }

        $cap = function_exists('dokan_get_current_user_id') ? 'dokan_edit_product' : 'edit_products';
        if (!current_user_can($cap)) {
            return false;
        }

        return $this->mayAuthor($this->currentVendorId());
    }

    /**
     * @return string[]
     */
    public function allowedFields(): array
    {
        $settings = $this->settings();

        if ($this->freeScope() || !array_key_exists('fields', $settings)) {
            return self::FIELDS;
        }

        $stored = array_map('strval', array_filter((array) $settings['fields'], 'is_scalar'));

        return array_values(array_intersect(self::FIELDS, $stored));
    }

    /**
     * @return string[]
     */
    public function positions(): array
    {
        return self::POSITIONS;
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public function positionOptions(): array
    {
        $labels = [
            'none' => __('None', '3d-viewer'),
            'top' => __('Top of the product image', '3d-viewer'),
            'bottom' => __('Bottom of the product image', '3d-viewer'),
            'replace' => __('Replace the product image with 3D', '3d-viewer'),
            'merge_with_first_image' => __('Show 3D on the first gallery image', '3d-viewer'),
        ];

        $options = [];
        foreach ($this->positions() as $value) {
            $options[] = ['value' => $value, 'label' => $labels[$value] ?? $value];
        }

        return $options;
    }

    public function defaultPosition(): string
    {
        $stored = $this->settings()['default_position'] ?? '';

        if (!$this->freeScope() && is_string($stored) && in_array($stored, $this->positions(), true)) {
            return $stored;
        }

        return 'top';
    }

    public function maxBytes(): int
    {
        return VendorUploadGuard::maxBytes();
    }

    public function maxMegabytes(): string
    {
        $mb = $this->maxBytes() / 1048576;
        $decimals = floor($mb) == $mb ? 0 : 1;

        return function_exists('number_format_i18n') ? number_format_i18n($mb, $decimals) : number_format($mb, $decimals);
    }

    public function quotaBytes(): int
    {
        if ($this->freeScope()) {
            return 0;
        }

        $mb = $this->settings()['quota_mb'] ?? 0;

        return is_numeric($mb) && (float) $mb > 0 ? (int) round((float) $mb * 1048576) : 0;
    }

    public function approveLive(): bool
    {
        // Restrictions read loosely (any "on" value), permissions strictly: fail closed.
        return !$this->freeScope() && Marketplace::isOn($this->settings()['approve_live'] ?? '');
    }

    /**
     * Pro restrictions that are stored and would apply without "Use free defaults".
     *
     * @return array<string, mixed>
     */
    public function storedProKeys(): array
    {
        $settings = $this->settings();
        $keys = [];

        $access = $settings['access'] ?? 'all';
        if ($access !== 'all') {
            $keys['access'] = $access;
            if ($access === 'selected') {
                $keys['vendors'] = array_values(array_filter(array_map('intval', (array) ($settings['vendors'] ?? []))));
            }
        }

        if (array_key_exists('fields', $settings)) {
            $fields = array_values(array_intersect(self::FIELDS, array_map('strval', array_filter((array) $settings['fields'], 'is_scalar'))));
            if ($fields !== self::FIELDS) {
                $keys['fields'] = $fields;
            }
        }

        foreach (['max_file_mb', 'quota_mb'] as $key) {
            $value = $settings[$key] ?? 0;
            if (is_numeric($value) && (float) $value > 0) {
                $keys[$key] = (float) $value;
            }
        }

        if (Marketplace::isOn($settings['approve_live'] ?? '')) {
            $keys['approve_live'] = true;
        }

        $position = $settings['default_position'] ?? '';
        if (is_string($position) && $position !== '' && $position !== 'top' && in_array($position, $this->positions(), true)) {
            $keys['default_position'] = $position;
        }

        return $keys;
    }

    /**
     * @return array<string, mixed>
     */
    public function clientConfig(): array
    {
        return [
            'maxBytes' => $this->maxBytes(),
            'extensions' => [
                'model' => ['glb'],
                'usdz' => ['usdz'],
                'poster' => self::POSTER_EXTENSIONS,
            ],
            'allowedFields' => $this->allowedFields(),
            'positions' => $this->positionOptions(),
            'defaultPosition' => $this->defaultPosition(),
        ];
    }

    /**
     * Bytes of GLB/USDZ files uploaded by the vendor and their staff.
     */
    public function usedBytes(int $vendor_id): int
    {
        global $wpdb;

        if ($vendor_id <= 0) {
            return 0;
        }

        $authors = [$vendor_id];
        $staff = get_users(['meta_key' => '_vendor_id', 'meta_value' => $vendor_id, 'fields' => 'ID', 'number' => 1000]); // phpcs:ignore WordPress.DB.SlowDBQuery -- Staff lookup only runs when a Pro quota is stored.
        foreach ((array) $staff as $staff_id) {
            if (user_can((int) $staff_id, 'vendor_staff')) {
                $authors[] = (int) $staff_id;
            }
        }
        $authors = array_values(array_unique($authors));

        $placeholders = implode(',', array_fill(0, count($authors), '%d'));
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Placeholders are built above; live value needed for the quota.
        $ids = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_author IN ($placeholders) AND (guid LIKE %s OR guid LIKE %s OR post_mime_type LIKE %s)", array_merge($authors, ['%.glb', '%.usdz', 'model/%'])));

        $total = 0;
        foreach ((array) $ids as $id) {
            $file = get_attached_file((int) $id);
            if (!$file || !in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), VendorUploadGuard::VENDOR_EXTENSIONS, true)) {
                continue;
            }
            $size = file_exists($file) ? filesize($file) : 0;
            $total += $size ? (int) $size : 0;
        }

        return $total;
    }
}
