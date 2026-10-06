<?php

namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Upload checks for marketplace vendors (H4).
 *
 * Applies only while the Dokan module is enabled: extension narrowing, GLB/USDZ content
 * checks and the size cap. Other uploads, and every upload with the module off, are untouched.
 */
final class VendorUploadGuard
{
    public const FIXED_MAX_BYTES = 20 * 1024 * 1024;

    public const VENDOR_EXTENSIONS = ['glb', 'usdz'];

    private const MAX_JSON_BYTES = 4 * 1024 * 1024;

    private const SNIFF_BYTES = 1024;

    public function register(): void
    {
        add_filter('upload_mimes', [$this, 'filterMimes'], 20, 2);
        add_filter('wp_handle_upload_prefilter', [$this, 'prefilter']);
        add_filter('wp_handle_sideload_prefilter', [$this, 'prefilter']);
        // XML-RPC media uploads go through wp_upload_bits() and skip both prefilters.
        add_filter('wp_upload_bits', [$this, 'filterUploadBits']);
    }

    /**
     * Effective per-file cap; a stored Pro limit can only lower it (fail-closed).
     */
    public static function maxBytes(): int
    {
        $max = self::FIXED_MAX_BYTES;

        $wp_max = function_exists('wp_max_upload_size') ? (int) wp_max_upload_size() : 0;
        if ($wp_max > 0 && $wp_max < $max) {
            $max = $wp_max;
        }

        $settings = Marketplace::settings();
        $free_scope = isset($settings['free_scope']) && $settings['free_scope'] === '1';
        $stored_mb = $settings['max_file_mb'] ?? null;

        if (!$free_scope && is_numeric($stored_mb) && (float) $stored_mb > 0) {
            $stored = (int) floor((float) $stored_mb * 1048576);
            if ($stored > 0 && $stored < $max) {
                $max = $stored;
            }
        }

        return $max;
    }

    /**
     * Inspect a GLB/USDZ file on disk.
     *
     * @return string|null Null when the file passes, otherwise a translated error message.
     */
    public static function inspectFile(string $path, string $ext): ?string
    {
        $ext = strtolower($ext);

        if (!in_array($ext, self::VENDOR_EXTENSIONS, true)) {
            return __('This file type is not allowed for vendors.', '3d-viewer');
        }

        if ($path === '' || !is_file($path) || !is_readable($path)) {
            return __('The uploaded file could not be read.', '3d-viewer');
        }

        $handle = fopen($path, 'rb'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- binary header read of an upload.
        if ($handle === false) {
            return __('The uploaded file could not be read.', '3d-viewer');
        }

        try {
            $head = fread($handle, self::SNIFF_BYTES); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fread -- see above.
            $head = is_string($head) ? $head : '';

            foreach (['<html', '<script', '<?xml', '<?php'] as $needle) {
                if (stripos($head, $needle) !== false) {
                    return __('This file contains HTML or script content and cannot be uploaded.', '3d-viewer');
                }
            }

            if ($ext === 'usdz') {
                return strncmp($head, "PK\x03\x04", 4) === 0
                    ? null
                    : __('This file is not a valid USDZ model.', '3d-viewer');
            }

            return self::inspectGlb($handle, $head, $path);
        } finally {
            fclose($handle); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- see above.
        }
    }

    /**
     * @param resource $handle
     */
    private static function inspectGlb($handle, string $head, string $path): ?string
    {
        $invalid = __('This file is not a valid GLB model.', '3d-viewer');

        if (strlen($head) < 20 || strncmp($head, 'glTF', 4) !== 0 || substr($head, 16, 4) !== 'JSON') {
            return $invalid;
        }

        $header = unpack('Vversion/Vlength/Vchunk', substr($head, 4, 12));
        if (!is_array($header) || !isset($header['version'], $header['length'], $header['chunk'])) {
            return $invalid;
        }

        $total = (int) $header['length'];
        $json_length = (int) $header['chunk'];
        $file_size = (int) filesize($path);

        if ((int) $header['version'] !== 2 || $total < 20 || $total > $file_size || $json_length <= 0 || $json_length + 20 > $total) {
            return $invalid;
        }

        if ($json_length > self::MAX_JSON_BYTES) {
            return __('The GLB model header is too large to check.', '3d-viewer');
        }

        if (fseek($handle, 20) !== 0) {
            return $invalid;
        }

        $json = '';
        while (strlen($json) < $json_length && !feof($handle)) {
            $chunk = fread($handle, $json_length - strlen($json)); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fread -- binary header read of an upload.
            if (!is_string($chunk) || $chunk === '') {
                break;
            }
            $json .= $chunk;
        }

        if (strlen($json) !== $json_length) {
            return $invalid;
        }

        $gltf = json_decode(rtrim($json, " \0"), true);
        if (!is_array($gltf)) {
            return $invalid;
        }

        foreach (['buffers', 'images'] as $list) {
            if (!isset($gltf[$list])) {
                continue;
            }

            if (!is_array($gltf[$list])) {
                return $invalid;
            }

            foreach ($gltf[$list] as $item) {
                if (!is_array($item) || !array_key_exists('uri', $item)) {
                    continue;
                }

                if (!is_string($item['uri']) || strncasecmp($item['uri'], 'data:', 5) !== 0) {
                    return __('This GLB model links to external files. Upload a self-contained GLB instead.', '3d-viewer');
                }
            }
        }

        return null;
    }

    /**
     * Vendors keep only GLB/USDZ among the 3D types this plugin adds (module enabled only).
     *
     * @param array<string, string> $mimes
     * @param \WP_User|int|null     $user
     * @return array<string, string>
     */
    public function filterMimes($mimes, $user = null)
    {
        if (!is_array($mimes) || !Marketplace::moduleEnabled() || !Marketplace::isMarketplaceVendor($user)) {
            return $mimes;
        }

        $ours = self::supportedExtensions();
        if (!$ours) {
            return $mimes;
        }

        foreach (array_keys($mimes) as $key) {
            $exts = array_filter(explode('|', strtolower((string) $key)), 'strlen');
            if (!$exts || array_intersect($exts, self::VENDOR_EXTENSIONS)) {
                continue;
            }

            if (!array_diff($exts, $ours)) {
                unset($mimes[$key]);
            }
        }

        return $mimes;
    }

    /**
     * @param array<string, mixed> $file
     * @return array<string, mixed>
     */
    public function prefilter($file)
    {
        if (!is_array($file) || !empty($file['error']) || !Marketplace::moduleEnabled() || !Marketplace::isMarketplaceVendor()) {
            return $file;
        }

        $name = isset($file['name']) && is_string($file['name']) ? $file['name'] : '';
        $tmp = isset($file['tmp_name']) && is_string($file['tmp_name']) ? $file['tmp_name'] : '';
        $size = is_file($tmp) ? (int) filesize($tmp) : (int) ($file['size'] ?? 0);

        $error = self::checkVendorFile(self::extension($name), $tmp, $size);
        if ($error !== null) {
            $file['error'] = $error;
        }

        return $file;
    }

    /**
     * Same checks as prefilter() for wp_upload_bits() (XML-RPC uploads).
     *
     * @param array<string, mixed>|string $upload
     * @return array<string, mixed>|string Error message string on failure.
     */
    public function filterUploadBits($upload)
    {
        if (!is_array($upload) || !isset($upload['name']) || !is_string($upload['name'])) {
            return $upload;
        }

        if (!Marketplace::moduleEnabled() || !Marketplace::isMarketplaceVendor()) {
            return $upload;
        }

        $ext = self::extension($upload['name']);
        if (!in_array($ext, self::VENDOR_EXTENSIONS, true)) {
            $error = self::checkVendorFile($ext, '', 0);
            return $error === null ? $upload : $error;
        }

        $bits = isset($upload['bits']) && is_string($upload['bits']) ? $upload['bits'] : '';

        if (!function_exists('wp_tempnam') && defined('ABSPATH') && is_file(ABSPATH . 'wp-admin/includes/file.php')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        $tmp = function_exists('wp_tempnam') ? (string) wp_tempnam($upload['name']) : '';
        if ($tmp === '') {
            return __('The uploaded file could not be read.', '3d-viewer');
        }

        try {
            // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- temp copy of the upload for inspection.
            if (file_put_contents($tmp, $bits) !== strlen($bits)) {
                return __('The uploaded file could not be read.', '3d-viewer');
            }

            $error = self::checkVendorFile($ext, $tmp, strlen($bits));
        } finally {
            if (is_file($tmp)) {
                unlink($tmp); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink -- our own temp file; must not be skipped by a filter.
            }
        }

        return $error === null ? $upload : $error;
    }

    /**
     * Vendor checks for one upload; the caller has already confirmed the module is enabled.
     */
    private static function checkVendorFile(string $ext, string $path, int $size): ?string
    {
        if ($ext === '') {
            return null;
        }

        if (!in_array($ext, self::VENDOR_EXTENSIONS, true)) {
            return in_array($ext, self::supportedExtensions(), true)
                ? __('This file type is not allowed for vendors.', '3d-viewer')
                : null;
        }

        $error = self::inspectFile($path, $ext);
        if ($error !== null) {
            return $error;
        }

        $max = self::maxBytes();
        if ($size > $max) {
            return sprintf(
                /* translators: %s: maximum file size in megabytes */
                __('This file is larger than the %s MB limit for vendor uploads.', '3d-viewer'),
                self::formatMb($max)
            );
        }

        return null;
    }

    private static function extension(string $name): string
    {
        $dot = strrpos($name, '.');

        return $dot === false ? '' : strtolower(substr($name, $dot + 1));
    }

    /**
     * Extensions this plugin adds to the upload list.
     *
     * @return array<int, string>
     */
    private static function supportedExtensions(): array
    {
        if (!class_exists('BP3D\Helper\Utils') || !defined('BP3D\Helper\Utils::SUPPORTED_MIME_TYPES')) {
            return [];
        }

        return array_map('strtolower', array_keys(\BP3D\Helper\Utils::SUPPORTED_MIME_TYPES));
    }

    private static function formatMb(int $bytes): string
    {
        $mb = round($bytes / 1048576, 1);
        $decimals = floor($mb) == $mb ? 0 : 1;
        if ($mb <= 0) {
            $mb = round($bytes / 1048576, 2);
            $decimals = 2;
        }

        return function_exists('number_format_i18n') ? number_format_i18n($mb, $decimals) : number_format($mb, $decimals);
    }
}
