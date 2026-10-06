<?php

namespace BP3D\Integrations\Dokan;

use BP3D\Base\Marketplace;
use BP3D\Base\VendorUploadGuard;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The only writer of vendor 3D data (`_bp3d_product_`).
 *
 * Touches row-0 allow-listed keys and `viewer_position` only, never repairs or deletes
 * other data. merge() is pure so the rules can be tested without WordPress.
 */
class VendorModel
{
    public const META_KEY = '_bp3d_product_';

    public const MAX_SERIALIZED_BYTES = 65536;

    /** Row-0 keys the vendor may write (R3). */
    public const ROW_KEYS = ['model_src', 'poster_src', 'model_iso_src', 'enable_ar'];

    /** CSF defaults seeded when the module creates row 0 (R9). */
    public const ROW_SEED = [
        'exposure' => '1',
        'ar_placement' => 'floor',
        'ar_mode' => 'webxr',
        'environment_image_src' => '',
        'skybox_image_src' => '',
        'initial_view' => '[]',
    ];

    private const FILE_FIELDS = [
        'model' => ['key' => 'model_id', 'kind' => 'glb'],
        'poster' => ['key' => 'poster_id', 'kind' => 'image'],
        'usdz' => ['key' => 'usdz_id', 'kind' => 'usdz'],
    ];

    private const RESOLVED_TO_ROW = ['model' => 'model_src', 'poster' => 'poster_src', 'usdz' => 'model_iso_src'];

    /** Background values a vendor may store: rendered into CSS, so nothing looser (H1 not built yet). */
    private const BG_PATTERN = '/^(?:transparent|#[0-9a-f]{3}|#[0-9a-f]{6})$/iD';

    protected VendorPolicy $policy;

    public function __construct(VendorPolicy $policy)
    {
        $this->policy = $policy;
    }

    /**
     * Effective values as the vendor UI shows them.
     *
     * @return array<string, mixed>
     */
    public function read(int $product_id): array
    {
        $stored = $product_id > 0 ? get_post_meta($product_id, self::META_KEY, true) : '';
        $effective = self::effective(is_array($stored) ? $stored : []);

        return [
            'stored' => $stored,
            'model' => $effective['model_src'],
            'poster' => $effective['poster_src'],
            'usdz' => $effective['model_iso_src'],
            'enable_ar' => $effective['enable_ar'] === '1',
            'position' => $effective['viewer_position'],
            'bg_color' => $effective['bg_color'],
            'lock' => self::lockReason($stored, $product_id),
            'has_effective_model' => $effective['model_src'] !== '',
        ];
    }

    /**
     * R7 lock reason, or null when the vendor may edit.
     *
     * @param mixed $stored Raw `_bp3d_product_` meta.
     * @param array{admin_lock?: mixed, pending?: mixed}|null $flags Product flags; read from post meta when null.
     */
    public static function lockReason($stored, int $product_id, ?array $flags = null): ?string
    {
        if ($flags === null) {
            $flags = $product_id > 0 ? [
                'admin_lock' => get_post_meta($product_id, '_bp3d_admin_lock', true),
                'pending' => get_post_meta($product_id, '_bp3d_vendor_pending_', true),
            ] : [];
        }

        if ($stored !== '' && !is_array($stored)) {
            return 'malformed';
        }

        $data = is_array($stored) ? $stored : [];
        $models = $data['bp3d_models'] ?? '';
        if ($models !== '' && $models !== null && !is_array($models)) {
            return 'malformed';
        }
        $rows = is_array($models) ? $models : [];
        $row = [];
        if ($rows) {
            $first_key = array_key_first($rows);
            $row = $rows[$first_key];
            // A single row not at index 0 is not what free renders; writing [0] would add a second row.
            if (!is_array($row) || (count($rows) === 1 && $first_key !== 0)) {
                return 'malformed';
            }
            if (array_key_exists('initial_view', $row) && !is_string($row['initial_view'])) {
                return 'malformed';
            }
        }

        if (!empty($flags['admin_lock'])) {
            return 'admin_lock';
        }
        if (!empty($flags['pending'])) {
            return 'pending';
        }
        if (count($rows) > 1) {
            return 'multi_rows';
        }
        if (($data['currentViewer'] ?? '') === 'O3DViewer') {
            return 'o3d';
        }
        // The front end renders a set flat model over row 0's, so a different row-0 model is ambiguous.
        $flat_model = self::url($data['bp3d_model_src'] ?? '');
        $row_model = self::url($row['model_src'] ?? '');
        if ($flat_model !== '' && $row_model !== '' && $flat_model !== $row_model) {
            return 'flat_mismatch';
        }
        foreach ($row as $key => $value) {
            if (is_string($key) && strpos($key, 'attribute_') === 0 && $value !== 'all') {
                return 'variant_map';
            }
        }
        if (!empty($row['product_variant'])) {
            return 'legacy_variant';
        }
        $template = $data['bp_model_template'] ?? '';
        if ($template !== '' && $template !== null && $template !== 'none') {
            return 'preset';
        }

        return null;
    }

    public function liveReadOnly(int $product_id, ?string $status = null): bool
    {
        if (!$this->policy->approveLive()) {
            return false;
        }

        // Live if either the stored or the requested status is live, so saving as draft cannot bypass it.
        $live = ['publish', 'future', 'private'];
        if ($product_id > 0 && in_array((string) get_post_status($product_id), $live, true)) {
            return true;
        }

        if ($status !== null && in_array($status, $live, true)) {
            return true;
        }

        return $product_id > 0 && get_post_meta($product_id, '_bp3d_vendor_published_once', true) === '1';
    }

    /**
     * R1: a well-formed `{v:1, ...}` envelope, or null (silent no-op). Missing field keys mean 'keep'.
     *
     * @param mixed $raw
     * @return array<string, mixed>|null
     */
    public static function normalizeEnvelope($raw): ?array
    {
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : null;
        }

        if (!is_array($raw) || !array_key_exists('v', $raw) || ($raw['v'] !== 1 && $raw['v'] !== '1')) {
            return null;
        }

        $envelope = ['v' => 1];

        foreach (['model_id', 'poster_id', 'usdz_id'] as $key) {
            $value = array_key_exists($key, $raw) ? $raw[$key] : 'keep';

            if ($value === 'keep') {
                $envelope[$key] = 'keep';
            } elseif (is_int($value) && $value >= 0) {
                $envelope[$key] = $value;
            } elseif (is_string($value) && $value !== '' && ctype_digit($value) && strlen($value) < 19) {
                $envelope[$key] = (int) $value;
            } else {
                return null;
            }
        }

        $ar = array_key_exists('enable_ar', $raw) ? $raw['enable_ar'] : 'keep';
        if ($ar === 'keep') {
            $envelope['enable_ar'] = 'keep';
        } elseif (in_array($ar, ['1', 1, true], true)) {
            $envelope['enable_ar'] = '1';
        } elseif (in_array($ar, ['', '0', 0, false], true)) {
            $envelope['enable_ar'] = '';
        } else {
            return null;
        }

        $position = array_key_exists('viewer_position', $raw) ? $raw['viewer_position'] : 'keep';
        if (!is_string($position)) {
            return null;
        }
        $envelope['viewer_position'] = $position;

        $bg = array_key_exists('bg_color', $raw) ? $raw['bg_color'] : 'keep';
        if (!is_string($bg)) {
            return null;
        }
        $envelope['bg_color'] = $bg;

        return $envelope;
    }

    /**
     * Ownership, type and size checks; turns attachment IDs into URLs.
     *
     * @param array<string, mixed> $env Normalised envelope.
     * @return array<string, mixed>|\WP_Error
     */
    public function validate(array $env, int $product_id, int $vendor_id)
    {
        $allowed = $this->policy->allowedFields();
        $resolved = [];
        $stored = $product_id > 0 ? get_post_meta($product_id, self::META_KEY, true) : '';
        $current = self::effective(is_array($stored) ? $stored : []);

        foreach (self::FILE_FIELDS as $field => $spec) {
            $value = $env[$spec['key']] ?? 'keep';

            if ($value === 'keep' || !in_array($field, $allowed, true)) {
                $resolved[$field] = ['op' => 'keep', 'url' => ''];
                continue;
            }

            if ($value === 0) {
                $resolved[$field] = ['op' => 'remove', 'url' => ''];
                continue;
            }

            $url = $this->checkAttachment((int) $value, $field, $spec['kind'], $vendor_id, $current[self::RESOLVED_TO_ROW[$field]]);
            if (is_wp_error($url)) {
                return $url;
            }

            $resolved[$field] = ['op' => 'set', 'url' => $url];
        }

        $ar = $env['enable_ar'] ?? 'keep';
        $resolved['enable_ar'] = in_array('ar', $allowed, true) && in_array($ar, ['1', ''], true) ? $ar : 'keep';

        $position = $env['viewer_position'] ?? 'keep';
        if ($position === 'keep' || !in_array('position', $allowed, true)) {
            $resolved['viewer_position'] = 'keep';
        } elseif (in_array($position, $this->policy->positions(), true)) {
            $resolved['viewer_position'] = $position;
        } else {
            return new \WP_Error('bp3d_invalid_position', __('3D Model: this viewer position is not available.', '3d-viewer'));
        }

        $bg = $env['bg_color'] ?? 'keep';
        if ($bg === 'keep' || !in_array('background', $allowed, true)) {
            $resolved['bg_color'] = 'keep';
        } elseif (self::isVendorColor($bg)) {
            $resolved['bg_color'] = strtolower($bg);
        } else {
            return new \WP_Error('bp3d_invalid_background', __('3D Model: please choose a valid background color.', '3d-viewer'));
        }

        return $resolved;
    }

    /**
     * Pure merge of the resolved input into the stored meta (plan §2.5 R2-R6, R9, R10).
     *
     * @param mixed $stored Raw stored meta ('' or array).
     * @param array<string, mixed> $resolved Output of validate().
     * @param array{default_position?: string, positions?: string[], position_editable?: bool, bg_editable?: bool} $ctx
     * @return array{changed: string[], value: array<string, mixed>}|\WP_Error
     */
    public static function merge($stored, array $resolved, array $ctx)
    {
        $data = is_array($stored) ? $stored : [];
        $before = self::effective($data);
        $positions = array_values(array_filter((array) ($ctx['positions'] ?? []), 'is_string'));
        $had_model = $before['model_src'] !== '';

        $ops = [];
        foreach (self::RESOLVED_TO_ROW as $field => $row_key) {
            $op = $resolved[$field] ?? null;
            $ops[$row_key] = is_array($op) && in_array($op['op'] ?? '', ['set', 'remove'], true) ? $op : ['op' => 'keep', 'url' => ''];
        }
        $ar = $resolved['enable_ar'] ?? 'keep';
        $ar = in_array($ar, ['1', ''], true) ? $ar : 'keep';

        $models = $data['bp3d_models'] ?? null;
        $has_rows = is_array($models) && $models !== [];

        if ($ops['model_src']['op'] === 'remove') {
            if ($had_model) {
                if (!self::rowIsRemovable(self::row0($data))) {
                    return new \WP_Error('bp3d_locked_removal', self::lockedRemovalMessage());
                }
                if ($has_rows || array_key_exists('bp3d_models', $data)) {
                    $data['bp3d_models'] = [];
                }
                foreach (['bp3d_model_src', 'bp3d_poster_src'] as $flat) {
                    if (array_key_exists($flat, $data)) {
                        $data[$flat] = '';
                    }
                }
            }
        } else {
            $target = [];
            foreach (self::RESOLVED_TO_ROW as $row_key) {
                $op = $ops[$row_key];
                $target[$row_key] = $op['op'] === 'set' ? (string) $op['url'] : ($op['op'] === 'remove' ? '' : $before[$row_key]);
            }
            $target['enable_ar'] = $ar === 'keep' ? $before['enable_ar'] : $ar;

            $row_change = false;
            foreach (self::ROW_KEYS as $row_key) {
                if ($target[$row_key] !== $before[$row_key]) {
                    $row_change = true;
                }
            }

            // R5: no row without a model.
            if ($row_change && $target['model_src'] !== '') {
                if ($has_rows) {
                    $row = self::row0($data);
                    if (self::url($row['model_src'] ?? '') === '' && $before['model_src'] !== '') {
                        $row['model_src'] = $before['model_src'];
                        if (self::url($row['poster_src'] ?? '') === '') {
                            $row['poster_src'] = $before['poster_src'];
                        }
                    }
                } else {
                    // R9: seed from the flat keys first, then CSF defaults.
                    $row = array_merge([
                        'model_src' => $before['model_src'],
                        'poster_src' => $before['poster_src'],
                        'enable_ar' => '',
                        'model_iso_src' => '',
                    ], self::ROW_SEED);
                    if (!array_key_exists('currentViewer', $data)) {
                        $data['currentViewer'] = 'modelViewer';
                    }
                }

                // Only fields the vendor changed; a row value the flat key overrides on the front end stays as stored.
                $row_changed = [];
                foreach (self::ROW_KEYS as $row_key) {
                    if ($target[$row_key] !== $before[$row_key]) {
                        $row[$row_key] = $target[$row_key];
                        $row_changed[$row_key] = true;
                    }
                }

                if ($has_rows) {
                    $data['bp3d_models'][0] = $row;
                } else {
                    $data['bp3d_models'] = [$row];
                }

                // R4: sync an existing flat key only when its own row field changed, so a stale flat model is never swapped by a poster edit.
                foreach (['bp3d_model_src' => 'model_src', 'bp3d_poster_src' => 'poster_src'] as $flat => $row_key) {
                    if (array_key_exists($flat, $data) && isset($row_changed[$row_key])) {
                        $data[$flat] = (string) $row[$row_key];
                    }
                }
            }
        }

        // R6: only for a product that has a model after this write.
        if (self::effective($data)['model_src'] !== '') {
            $stored_position = $data['viewer_position'] ?? null;
            $absent = $stored_position === null || $stored_position === '';
            $in_tier = is_string($stored_position) && in_array($stored_position, $positions, true);
            $requested = $resolved['viewer_position'] ?? 'keep';
            $new_position = null;

            // A stored value outside the vendor's tier (tab, custom_selector) is never overwritten.
            if ($absent || $in_tier) {
                if (!empty($ctx['position_editable']) && is_string($requested) && $requested !== 'keep' && in_array($requested, $positions, true)) {
                    $new_position = $requested;
                } elseif (!$had_model) {
                    $default = (string) ($ctx['default_position'] ?? 'top');
                    $new_position = in_array($default, $positions, true) ? $default : 'top';
                }
            }

            if ($new_position !== null && $new_position !== $stored_position) {
                $data['viewer_position'] = $new_position;
            }

            // A stored value the vendor UI cannot show (rgba, admin CSS) is never overwritten.
            $requested_bg = $resolved['bg_color'] ?? 'keep';
            $stored_bg = $data['bp_model_bg'] ?? null;
            if (!empty($ctx['bg_editable']) && is_string($requested_bg) && self::isVendorColor($requested_bg)
                && ($stored_bg === null || $stored_bg === '' || (is_string($stored_bg) && self::isVendorColor($stored_bg)))
                && $requested_bg !== $stored_bg) {
                $data['bp_model_bg'] = $requested_bg;
            }
        }

        $after = self::effective($data);
        $changed = [];
        foreach ($after as $key => $value) {
            if ($value !== $before[$key]) {
                $changed[] = $key;
            }
        }

        if (!$changed) {
            return ['changed' => [], 'value' => is_array($stored) ? $stored : []];
        }

        return ['changed' => $changed, 'value' => $data];
    }

    /**
     * Checks without writing (React validates before Dokan saves, writes after).
     *
     * @param mixed $raw
     * @param array{creating?: bool, status?: string|null} $opts
     * @return array{write: bool, value: array<string, mixed>, changed: string[]}|\WP_Error
     */
    public function plan(int $product_id, $raw, int $vendor_id, array $opts = [])
    {
        $none = ['write' => false, 'value' => [], 'changed' => []];
        $creating = !empty($opts['creating']) || $product_id <= 0;

        if (!$this->policy->isEnabled() || !$this->policy->mayAuthor($vendor_id)) {
            return $none;
        }

        if ($product_id > 0 && get_post_type($product_id) !== 'product') {
            return $none;
        }

        if (!$creating && !$this->ownsProduct($product_id, $vendor_id)) {
            return $none;
        }

        $env = self::normalizeEnvelope($raw);
        if ($env === null) {
            return $none;
        }

        $stored = $product_id > 0 ? get_post_meta($product_id, self::META_KEY, true) : '';
        $flags = $product_id > 0 ? null : [];
        if (self::lockReason($stored, $product_id, $flags) !== null) {
            return $none;
        }

        if ($this->liveReadOnly($product_id, $opts['status'] ?? null)) {
            return $none;
        }

        $resolved = $this->validate($env, $product_id, $vendor_id);
        if (is_wp_error($resolved)) {
            return $resolved;
        }

        $merged = self::merge($stored, $resolved, [
            'default_position' => $this->policy->defaultPosition(),
            'positions' => $this->policy->positions(),
            'position_editable' => in_array('position', $this->policy->allowedFields(), true),
            'bg_editable' => in_array('background', $this->policy->allowedFields(), true),
        ]);
        if (is_wp_error($merged)) {
            return $merged;
        }

        if (!$merged['changed']) {
            return $none;
        }

        // M4: cap growth; existing large admin data never blocks an edit that does not grow it.
        $size = strlen(serialize($merged['value']));
        if ($size > self::MAX_SERIALIZED_BYTES && $size > strlen(serialize($stored))) {
            return new \WP_Error('bp3d_too_large', __('3D Model: these 3D settings are too large to save.', '3d-viewer'));
        }

        return ['write' => true, 'value' => $merged['value'], 'changed' => $merged['changed']];
    }

    /**
     * @param array{write?: bool, value?: array<string, mixed>, changed?: string[]} $plan
     */
    public function commit(int $product_id, array $plan): bool
    {
        if (empty($plan['write']) || $product_id <= 0 || !isset($plan['value']) || !is_array($plan['value'])) {
            return false;
        }

        update_post_meta($product_id, self::META_KEY, wp_slash($plan['value']));

        $author = (int) get_post_field('post_author', $product_id);
        if (Marketplace::isMarketplaceVendor() || ($author > 0 && Marketplace::isMarketplaceVendor($author))) {
            update_post_meta($product_id, '_bp3d_vendor_written', '1');
        }

        if (get_post_status($product_id) === 'publish') {
            update_post_meta($product_id, '_bp3d_vendor_published_once', '1');
        }

        do_action('bp3d_dokan_vendor_model_saved', $product_id, $plan['changed'] ?? []);

        return true;
    }

    /**
     * @param mixed $raw
     * @return bool|\WP_Error true when written, false for a no-op.
     */
    public function save(int $product_id, $raw, int $vendor_id)
    {
        try {
            $plan = $this->plan($product_id, $raw, $vendor_id);
            if (is_wp_error($plan)) {
                return $plan;
            }
            if (empty($plan['write'])) {
                return false;
            }

            return $this->commit($product_id, $plan);
        } catch (\Throwable $e) {
            Dokan::debugLog('save failed for product ' . $product_id . ': ' . $e->getMessage());

            return false;
        }
    }

    /**
     * Value for both vendor UIs: current files, flags, notice and the client config.
     *
     * @return array<string, mixed>
     */
    public function prepare(int $product_id, bool $is_new): array
    {
        $read = $this->read($product_id);
        $positions = $this->policy->positions();
        $stored_position = $read['position'];
        $position_locked = $stored_position !== '' && !in_array($stored_position, $positions, true);

        if ($position_locked) {
            $position = $stored_position;
        } elseif (!$read['has_effective_model'] || $stored_position === '') {
            $position = $this->policy->defaultPosition();
        } else {
            $position = $stored_position;
        }

        $bg = $read['bg_color'];
        $bg_locked = $bg !== '' && !self::isVendorColor($bg);

        $lock = $read['lock'];
        $live = $lock === null && $this->liveReadOnly($product_id);
        $notice = $lock !== null ? self::lockMessage($lock) : ($live ? self::lockMessage('live') : '');

        return array_merge([
            'model' => self::fileInfo($read['model']),
            'poster' => self::fileInfo($read['poster']),
            'usdz' => self::fileInfo($read['usdz']),
            'enable_ar' => $read['enable_ar'],
            'position' => $position,
            'position_locked' => $position_locked,
            'bg_color' => $bg_locked ? $bg : self::expandColor($bg === '' ? 'transparent' : $bg),
            'bg_locked' => $bg_locked,
            'has_model' => $read['has_effective_model'],
            'is_new' => $is_new,
            'lock' => $lock !== null ? ['code' => $lock, 'message' => self::lockMessage($lock)] : null,
            'live_read_only' => $live,
            'notice' => $notice,
        ], $this->policy->clientConfig());
    }

    /**
     * Vendor-facing explanation for a lock code. Never mentions plans or upgrades.
     */
    public static function lockMessage(string $code): string
    {
        switch ($code) {
            case 'pending':
                return __('An earlier change is awaiting review.', '3d-viewer');
            case 'live':
                return __('The 3D settings of published products are managed by the marketplace admin.', '3d-viewer');
            default:
                return __('This product\'s 3D settings are managed by the marketplace admin.', '3d-viewer');
        }
    }

    protected function ownsProduct(int $product_id, int $vendor_id): bool
    {
        if (function_exists('dokan_is_product_author')) {
            if (dokan_is_product_author($product_id)) {
                return true;
            }
        } elseif ((int) get_post_field('post_author', $product_id) === $vendor_id) {
            return true;
        }

        return current_user_can('edit_post', $product_id);
    }

    /**
     * @param string $current_url Effective stored URL of this field.
     * @return string|\WP_Error Attachment URL.
     */
    protected function checkAttachment(int $id, string $field, string $kind, int $vendor_id, string $current_url = '')
    {
        $labels = [
            'model' => __('3D model', '3d-viewer'),
            'poster' => __('Poster image', '3d-viewer'),
            'usdz' => __('USDZ model', '3d-viewer'),
        ];
        $label = $labels[$field] ?? __('3D Model', '3d-viewer');
        $fail = function (string $code, string $reason) use ($label) {
            /* translators: 1: field name, e.g. "3D model", 2: reason. */
            return new \WP_Error($code, sprintf(__('%1$s: %2$s', '3d-viewer'), $label, $reason));
        };

        if (!Marketplace::isOwnAttachment($id, $vendor_id)) {
            return $fail('bp3d_not_own', __('this file is not one of your uploads.', '3d-viewer'));
        }

        $file = get_attached_file($id);
        if (!$file || !file_exists($file)) {
            return $fail('bp3d_missing_file', __('the file could not be found.', '3d-viewer'));
        }

        $ext = strtolower((string) (wp_check_filetype($file)['ext'] ?? ''));

        if ($kind === 'image') {
            if (!wp_attachment_is_image($id) || $ext === 'svg') {
                return $fail('bp3d_wrong_type', __('please choose a JPG, PNG, WebP or GIF image.', '3d-viewer'));
            }
        } else {
            if ($ext !== $kind) {
                /* translators: %s: file extension, e.g. GLB. */
                return $fail('bp3d_wrong_type', sprintf(__('please choose a .%s file.', '3d-viewer'), $kind));
            }

            $problem = VendorUploadGuard::inspectFile($file, $ext);
            if ($problem !== null) {
                return $fail('bp3d_unsafe_file', $problem);
            }

            // The React editor resends an untouched pick on every save; size and quota limit new files only.
            if ($current_url !== '' && wp_get_attachment_url($id) === $current_url) {
                return $current_url;
            }

            if ((int) filesize($file) > $this->policy->maxBytes()) {
                /* translators: %s: size in MB. */
                return $fail('bp3d_too_big', sprintf(__('the file is larger than %s MB.', '3d-viewer'), $this->policy->maxMegabytes()));
            }

            $quota = $this->policy->quotaBytes();
            if ($quota > 0 && $this->policy->usedBytes($vendor_id) > $quota) {
                return $fail('bp3d_quota', __('your storage space for 3D files is full.', '3d-viewer'));
            }
        }

        $url = wp_get_attachment_url($id);
        if (!$url) {
            return $fail('bp3d_missing_file', __('the file could not be found.', '3d-viewer'));
        }

        return $url;
    }

    /**
     * Effective values as the free front end renders them: a set flat key wins over row 0 (Woocommerce\Product).
     *
     * @param array<string, mixed> $data
     * @return array{model_src: string, poster_src: string, model_iso_src: string, enable_ar: string, viewer_position: string, bg_color: string}
     */
    private static function effective(array $data): array
    {
        $row = self::row0($data);
        $position = $data['viewer_position'] ?? '';
        $bg = $data['bp_model_bg'] ?? '';

        return [
            'model_src' => self::url($data['bp3d_model_src'] ?? $row['model_src'] ?? ''),
            'poster_src' => self::url($data['bp3d_poster_src'] ?? $row['poster_src'] ?? ''),
            'model_iso_src' => self::url($row['model_iso_src'] ?? ''),
            'enable_ar' => Marketplace::isOn($row['enable_ar'] ?? '') ? '1' : '',
            'viewer_position' => is_string($position) ? $position : '',
            'bg_color' => is_string($bg) ? $bg : '',
        ];
    }

    /**
     * @param mixed $value
     */
    public static function isVendorColor($value): bool
    {
        return is_string($value) && preg_match(self::BG_PATTERN, $value) === 1;
    }

    /**
     * `#abc` to `#aabbcc`, which is what a color input can show.
     */
    private static function expandColor(string $color): string
    {
        $color = strtolower($color);
        if (strlen($color) === 4 && $color[0] === '#') {
            return '#' . $color[1] . $color[1] . $color[2] . $color[2] . $color[3] . $color[3];
        }

        return $color;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private static function row0(array $data): array
    {
        $models = $data['bp3d_models'] ?? null;

        return is_array($models) && isset($models[0]) && is_array($models[0]) ? $models[0] : [];
    }

    /**
     * R10: removable only when row 0 holds nothing beyond R3/R9 keys and empty values.
     *
     * @param array<string, mixed> $row
     */
    private static function rowIsRemovable(array $row): bool
    {
        $free_keys = ['model_src', 'poster_src', 'enable_ar', 'model_iso_src', 'exposure', 'ar_placement', 'ar_mode'];

        foreach ($row as $key => $value) {
            if (in_array($key, $free_keys, true)) {
                continue;
            }
            if ($key === 'initial_view') {
                if ($value === null || $value === '' || $value === '[]') {
                    continue;
                }

                return false;
            }
            if (is_string($key) && strpos($key, 'attribute_') === 0 && $value === 'all') {
                continue;
            }
            if (!self::isBlank($value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param mixed $value
     */
    private static function isBlank($value): bool
    {
        if ($value === null || $value === '' || $value === false || $value === []) {
            return true;
        }
        if (is_array($value)) {
            foreach ($value as $item) {
                if (!self::isBlank($item)) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    /**
     * @param mixed $value CSF upload value: URL string or ['url' => ...].
     */
    private static function url($value): string
    {
        if (is_array($value)) {
            $value = $value['url'] ?? '';
        }

        return is_string($value) ? trim($value) : '';
    }

    /**
     * @return array{id: int, url: string, name: string}
     */
    private static function fileInfo(string $url): array
    {
        if ($url === '') {
            return ['id' => 0, 'url' => '', 'name' => ''];
        }

        $path = (string) wp_parse_url($url, PHP_URL_PATH);

        return [
            'id' => function_exists('attachment_url_to_postid') ? (int) attachment_url_to_postid($url) : 0,
            'url' => $url,
            'name' => rawurldecode(wp_basename($path)),
        ];
    }

    private static function lockedRemovalMessage(): string
    {
        // merge() stays callable without WordPress loaded.
        if (!function_exists('__')) {
            return 'This 3D model has extra settings from the marketplace admin, so only the admin can remove it.';
        }

        return __('This 3D model has extra settings from the marketplace admin, so only the admin can remove it.', '3d-viewer');
    }
}
