<?php

namespace BP3D\Integrations\FluentCart;

use BP3D\Helper\Utils;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * A FluentCart product's 3D data: the same `_bp3d_product_` meta and keys as a WooCommerce product, and as
 * the Pro module. This form edits row 0 of `bp3d_models`, `currentViewer`, `viewer_position` (plus `thumb`),
 * `show_model_instead_thumbnail`, `bp_model_bg` and `bp_3d_height`; every other stored key is kept on save.
 */
final class ProductModel
{
    public const META = '_bp3d_product_';

    public const POSITIONS = ['none', 'thumb', 'top', 'bottom', 'replace'];

    public const POSITION_DEFAULT = 'thumb';

    public const HEIGHT_DEFAULT = 350;

    public const HEIGHT_MIN = 100;

    public const HEIGHT_MAX = 2000;

    public static function isProduct(int $id): bool
    {
        return $id > 0 && get_post_type($id) === FluentCart::POST_TYPE;
    }

    /**
     * Who may change a product's 3D settings: WordPress's edit_post on it, plus FluentCart's own
     * product permission (`products/edit`, or manage_options), the same gate as its editor.
     */
    public static function canEdit(int $id): bool
    {
        if (!self::isProduct($id) || !current_user_can('edit_post', $id)) {
            return false;
        }
        if (current_user_can('manage_options')) {
            return true;
        }

        $manager = '\\FluentCart\\App\\Services\\Permission\\PermissionManager';

        return class_exists($manager) && method_exists($manager, 'hasPermission') && $manager::hasPermission('products/edit');
    }

    /** @return array<string, mixed> */
    public static function read(int $id): array
    {
        $meta = get_post_meta($id, self::META, true);

        return is_array($meta) ? $meta : [];
    }

    /** @param mixed $value A URL string or a media array with `url`. */
    private static function url($value): string
    {
        if (is_array($value)) {
            $value = $value['url'] ?? '';
        }

        return is_string($value) ? trim($value) : '';
    }

    /**
     * Row 0 of `bp3d_models`, or the flat `bp3d_model_src` / `bp3d_poster_src` keys when the group is empty.
     *
     * @param  array<string, mixed> $meta
     * @return array<string, mixed>
     */
    public static function row(array $meta): array
    {
        $rows = $meta['bp3d_models'] ?? null;
        if (is_array($rows) && $rows) {
            $first = reset($rows);
            if (is_array($first)) {
                return $first;
            }
        }

        $flat = self::url($meta['bp3d_model_src'] ?? '');

        return $flat !== '' ? ['model_src' => $flat, 'poster_src' => self::url($meta['bp3d_poster_src'] ?? '')] : [];
    }

    /** @param mixed $value */
    public static function position($value): string
    {
        return is_string($value) && in_array($value, self::POSITIONS, true) ? $value : self::POSITION_DEFAULT;
    }

    /** @return array<string, string> */
    public static function positionLabels(): array
    {
        return [
            'thumb' => __('In the gallery, as a thumbnail (recommended)', '3d-viewer'),
            'top' => __('Above the gallery', '3d-viewer'),
            'bottom' => __('Below the gallery', '3d-viewer'),
            'replace' => __('Instead of the gallery', '3d-viewer'),
            'none' => __('Nowhere (shortcode only)', '3d-viewer'),
        ];
    }

    /** @param mixed $value */
    public static function height($value): int
    {
        $number = is_numeric($value) ? (int) round((float) $value) : self::HEIGHT_DEFAULT;

        return max(self::HEIGHT_MIN, min(self::HEIGHT_MAX, $number));
    }

    /** A colour the viewer prints into CSS: transparent, hex, rgb()/rgba(), or nothing. */
    private static function color($value): string
    {
        $value = is_string($value) ? trim($value) : '';

        return preg_match('/^(transparent|#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i', $value) ? $value : '';
    }

    /**
     * What the admin form edits, with every default applied.
     *
     * @param  array<string, mixed> $meta
     * @return array{viewer: string, model: string, poster: string, position: string, showFirst: bool, background: string, height: int}
     */
    public static function summary(array $meta): array
    {
        $row = self::row($meta);
        $height = $meta['bp_3d_height'] ?? [];

        return [
            'viewer' => ($meta['currentViewer'] ?? '') === 'O3DViewer' ? 'O3DViewer' : 'modelViewer',
            'model' => self::url($row['model_src'] ?? ''),
            'poster' => self::url($row['poster_src'] ?? ''),
            'position' => self::position($meta['viewer_position'] ?? ''),
            'showFirst' => FluentCart::isOn($meta['show_model_instead_thumbnail'] ?? ''),
            'background' => self::color($meta['bp_model_bg'] ?? ''),
            'height' => self::height(is_array($height) ? ($height['height'] ?? '') : $height),
        ];
    }

    /**
     * Clean the form's payload. Unknown keys are dropped.
     *
     * @param  array<string, mixed> $input
     * @return array{viewer: string, model: string, poster: string, position: string, showFirst: bool, background: string, height: int}
     */
    public static function sanitize(array $input): array
    {
        $showFirst = $input['showFirst'] ?? '';

        return [
            'viewer' => ($input['viewer'] ?? '') === 'O3DViewer' ? 'O3DViewer' : 'modelViewer',
            'model' => esc_url_raw(self::url($input['model'] ?? '')),
            'poster' => esc_url_raw(self::url($input['poster'] ?? '')),
            'position' => self::position($input['position'] ?? ''),
            'showFirst' => $showFirst === true || FluentCart::isOn($showFirst),
            'background' => self::color($input['background'] ?? ''),
            'height' => self::height($input['height'] ?? ''),
        ];
    }

    /** Whether the file's extension is one the model pickers accept. An empty URL clears the model. */
    public static function modelUrlOk(string $url): bool
    {
        if ($url === '') {
            return true;
        }

        $path = (string) wp_parse_url($url, PHP_URL_PATH);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return $ext !== '' && in_array($ext, Utils::modelExtensions(), true);
    }

    /**
     * Pure: the declared keys overwrite, every other stored key stays (Pro rows, hotspots, anything).
     *
     * @param  array<string, mixed> $existing
     * @param  array{viewer: string, model: string, poster: string, position: string, showFirst: bool, background: string, height: int} $clean
     * @return array<string, mixed>
     */
    public static function merge(array $existing, array $clean): array
    {
        $rows = isset($existing['bp3d_models']) && is_array($existing['bp3d_models']) ? array_values($existing['bp3d_models']) : [];
        $row = isset($rows[0]) && is_array($rows[0]) ? $rows[0] : [];
        $row['model_src'] = $clean['model'];
        $row['poster_src'] = $clean['poster'];
        $rows[0] = $row;

        $existing['bp3d_models'] = $rows;
        $existing['currentViewer'] = $clean['viewer'];
        $existing['viewer_position'] = $clean['position'];
        $existing['show_model_instead_thumbnail'] = $clean['showFirst'] ? '1' : '0';
        $existing['bp_model_bg'] = $clean['background'];
        // An unchanged height keeps its stored value, unit and per-device sub-keys: Pro's editor also saves em/pt.
        $height = isset($existing['bp_3d_height']) && is_array($existing['bp_3d_height']) ? $existing['bp_3d_height'] : [];
        if (self::height($height['height'] ?? ($existing['bp_3d_height'] ?? '')) !== $clean['height'] || !array_key_exists('bp_3d_height', $existing)) {
            $existing['bp_3d_height'] = ['height' => (string) $clean['height'], 'unit' => 'px'] + $height;
        }

        // The flat keys follow row 0 once they exist, as the Pro and Dokan writers do.
        if (array_key_exists('bp3d_model_src', $existing)) {
            $existing['bp3d_model_src'] = $clean['model'];
        }
        if (array_key_exists('bp3d_poster_src', $existing)) {
            $existing['bp3d_poster_src'] = $clean['poster'];
        }

        return $existing;
    }

    /**
     * @param  array{viewer: string, model: string, poster: string, position: string, showFirst: bool, background: string, height: int} $clean
     * @return array<string, mixed> The saved summary.
     */
    public static function save(int $id, array $clean): array
    {
        $merged = self::merge(self::read($id), $clean);
        // update_post_meta() unslashes; without wp_slash() every stored backslash would be lost.
        update_post_meta($id, self::META, wp_slash($merged));

        return self::summary($merged);
    }

    public static function hasModel(int $id): bool
    {
        return self::url(self::row(self::read($id))['model_src'] ?? '') !== '';
    }

    /**
     * Viewer attributes through the shortcode's own map (Utils::buildViewerAttributes()): the product meta
     * supplies the model and size, the store-wide settings what they supply to a Woo product.
     *
     * @return array<string, mixed> Empty without a model.
     */
    public static function attributes(int $id, string $placement = 'shortcode'): array
    {
        $summary = self::summary(self::read($id));
        if ($summary['model'] === '') {
            return [];
        }

        $store = Utils::getSettings('_bp3d_settings_');
        $on = static fn($value): string => $value ? '1' : '0';

        $attributes = Utils::buildViewerAttributes(Utils::return_function([
            'currentViewer' => $summary['viewer'],
            'bp_3d_src' => ['url' => $summary['model']],
            'bp_3d_poster' => ['url' => $summary['poster']],
            'bp_3d_align' => 'center',
            'bp_3d_width' => ['width' => '100', 'unit' => '%'],
            'bp_3d_height' => ['height' => (string) $summary['height'], 'unit' => 'px'],
            'bp_model_bg' => $summary['background'],
            'bp_3d_zooming' => $on($store('bp_3d_zooming', '1', true)),
            'bp_camera_control' => $on($store('bp_camera_control', '1', true)),
            'bp_3d_fullscreen' => $on($store('bp_3d_fullscreen', '1', true)),
            'bp_3d_progressbar' => $on($store('bp_3d_progressbar', '1', true)),
            'bp_3d_loading' => $store('bp_3d_loading', 'lazy'),
            '3d_shadow_intensity' => $store('3d_shadow_intensity', '1'),
        ]), $id);

        $attributes['placement'] = $placement;
        $attributes['position'] = $summary['position'];
        $attributes['show_model_instead_thumbnail'] = $summary['showFirst'];
        $attributes['arLink'] = get_permalink($id);
        $attributes['fluentcart'] = true;

        /** @var array<string, mixed> $attributes */
        $attributes = apply_filters('bp3d_fluentcart_model_attribute', $attributes, $id);

        return $attributes;
    }

    /** The same `.modelViewerBlock[data-attributes]` div the shortcode prints; the public bundle mounts it. */
    public static function html(int $id, string $placement = 'shortcode'): string
    {
        $attributes = self::attributes($id, $placement);
        if (!$attributes) {
            return '';
        }

        wp_enqueue_script('bp3d-public');
        wp_enqueue_style('bp3d-frontend');
        \BP3D\Addons\Addons::enqueueViewerLibrary(($attributes['currentViewer'] ?? '') === 'O3DViewer' ? 'O3DViewer' : 'modelViewer');

        return '<div class="modelViewerBlock bp3d-fluentcart" data-attributes="' . esc_attr((string) wp_json_encode($attributes)) . '"></div>';
    }
}
