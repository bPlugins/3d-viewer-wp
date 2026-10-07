<?php

namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Modern (bfields) or Classic (Codestar) admin screens; both edit the same stored arrays.
 * The choice has its own option: inside `_bp3d_settings_` a Codestar save or Reset All could drop it.
 */
final class AdminUi
{
    const OPTION = 'bp3d_admin_ui';
    const MODERN = 'modern';
    const CLASSIC = 'classic';
    const ACTION = 'bp3d_switch_admin_ui';
    const CAPABILITY = 'manage_options';
    const DOCS_URL = 'https://bplugins.com/docs/3d-viewer/getting-started/#new-classic-interface';

    /** Storage key => screen. */
    const SURFACES = [
        '_bp3d_settings_' => 'settings',
        '_bp3dimages_' => 'viewer',
        '_bp3d_product_' => 'product',
        'bp3d_dokan_settings' => 'dokan',
    ];

    /** @var string|null The site-wide mode, resolved once per request. */
    private static $mode = null;

    /** @var bool Whether a bp3d_admin_ui filter took part when the mode was resolved. */
    private static $filtered = false;

    public function register(): void
    {
        // Added at load time: bfields caches this map the first time a schema is built.
        add_filter('bfields_type_map', [self::class, 'typeMap']);

        add_filter('bfields_fallback_url', [self::class, 'fallbackUrl'], 10, 2);

        add_action('admin_post_' . self::ACTION, [$this, 'handleSwitch']);
        add_action('admin_notices', [$this, 'notice']);
        add_action('save_post', [$this, 'flagDroppedSave'], 5, 2);
        add_action('admin_notices', [$this, 'droppedNotice']);
        // The viewer screen hides #misc-publishing-actions, so its line goes above Update.
        add_action('post_submitbox_misc_actions', [$this, 'publishBoxRow']);
        add_action('post_submitbox_start', [$this, 'publishBoxRow']);
        add_action('admin_head', [$this, 'styles']);
        add_action('admin_enqueue_scripts', [$this, 'notices']);
    }

    /** One-line notice bars on the viewer's page-frame editor only (D2); other 3D Viewer screens keep WordPress's notices. */
    public function notices(): void
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        if (!$screen || 'post' !== $screen->base || 'bp3d-model-viewer' !== $screen->post_type || !function_exists('bfields_enqueue_notices')) {
            return;
        }

        $post = get_post();
        // The block editor draws no page frame.
        if ($post && function_exists('use_block_editor_for_post') && use_block_editor_for_post($post)) {
            return;
        }

        if (self::MODERN === self::mode('viewer')) {
            bfields_enqueue_notices();
        }
    }

    /** Filter, then constant, then option, then default; per screen after that. Classic when bfields did not boot. */
    public static function mode(string $surface = ''): string
    {
        $mode = self::siteMode();

        if ('' !== $surface) {
            $mode = self::normalize(apply_filters('bp3d_admin_ui_surface', $mode, $surface)) ?: $mode;
        }

        if (self::MODERN === $mode && !self::bfieldsReady()) {
            return self::CLASSIC;
        }

        return $mode;
    }

    public static function siteMode(): string
    {
        if (null !== self::$mode) {
            return self::$mode;
        }

        $mode = self::chosen();

        if (defined('BP3D_ADMIN_UI') && self::normalize(BP3D_ADMIN_UI)) {
            $mode = self::normalize(BP3D_ADMIN_UI);
        }

        if ('' === $mode) {
            $mode = self::normalize(apply_filters('bp3d_admin_ui_default', self::MODERN)) ?: self::MODERN;
        }

        // Add bp3d_admin_ui before init: the mode is resolved once, so a later filter is neither applied nor reported as the lock.
        self::$filtered = (bool) has_filter('bp3d_admin_ui');
        $mode = self::normalize(apply_filters('bp3d_admin_ui', $mode)) ?: $mode;

        return self::$mode = $mode;
    }

    /** What an admin picked on screen, or '' when nobody has chosen yet. */
    public static function chosen(): string
    {
        return self::normalize(get_option(self::OPTION, ''));
    }

    /** Why the on-screen switch cannot change the mode, or '' when it can. */
    public static function lockedBy(): string
    {
        if (null !== self::$mode ? self::$filtered : has_filter('bp3d_admin_ui')) {
            return 'filter';
        }

        if (defined('BP3D_ADMIN_UI') && self::normalize(BP3D_ADMIN_UI)) {
            return 'constant';
        }

        return '';
    }

    public static function bfieldsReady(): bool
    {
        return did_action('bfields_loaded') > 0 && class_exists('BFields\\Compat\\Codestar', false);
    }

    /** The surface the current admin screen edits, or '' for screens without a 3D Viewer form. */
    public static function screenSurface(): string
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        if (!$screen) {
            return '';
        }

        if (false !== strpos((string) $screen->id, '3dviewer-settings')) {
            return 'settings';
        }

        if ('post' === $screen->base && in_array($screen->post_type, ['bp3d-model-viewer', 'product'], true)) {
            return 'bp3d-model-viewer' === $screen->post_type ? 'viewer' : 'product';
        }

        return '';
    }

    private static function normalize($mode): string
    {
        return in_array($mode, [self::MODERN, self::CLASSIC], true) ? $mode : '';
    }

    /** Meta boxes register only in wp-admin, so bfields' REST routes (hotspot product search) need this. */
    public static function isBfieldsRestRequest(string $unique): bool
    {
        // The route check first: it is a string match, while the mode can cost a query on every front-end request.
        return function_exists('bfields_is_rest_request')
            && bfields_is_rest_request($unique)
            && self::MODERN === self::mode(self::SURFACES[$unique] ?? '');
    }

    public static function typeMap(array $map): array
    {
        return $map + ['bp3d_responsive_dimensions' => 'dimension'];
    }

    /** The "switch to classic" button bfields shows if its screen fails to load. */
    public static function fallbackUrl($url, $unique)
    {
        if (!isset(self::SURFACES[$unique]) || !current_user_can(self::CAPABILITY) || '' !== self::lockedBy()) {
            return $url;
        }

        return self::switchUrl(self::CLASSIC, self::here());
    }

    private static function here(): string
    {
        return isset($_SERVER['REQUEST_URI']) ? (string) wp_unslash($_SERVER['REQUEST_URI']) : '';
    }

    /** `option_meta` for the Lite / Advanced mode grid; Codestar ignores the key. */
    public static function viewerModes(): array
    {
        return [
            'modelViewer' => ['icon' => 'zap', 'tag' => __('Recommended', '3d-viewer'), 'perks' => [__('GLB and glTF', '3d-viewer'), __('Augmented reality', '3d-viewer')]],
            'O3DViewer' => ['icon' => 'sliders', 'perks' => [__('OBJ, STL, FBX, STEP and more', '3d-viewer')]],
        ];
    }

    public static function switchUrl(string $to, string $redirect = ''): string
    {
        $args = ['action' => self::ACTION, 'ui' => $to];

        if ('' !== $redirect) {
            $args['redirect_to'] = rawurlencode($redirect); // PHP decodes it once into $_GET.
        }

        return wp_nonce_url(add_query_arg($args, admin_url('admin-post.php')), self::ACTION);
    }

    /** A plain nonce link, so it works with no JavaScript: exactly when a blocked bundle needs it. */
    public function handleSwitch(): void
    {
        check_admin_referer(self::ACTION);

        if (!current_user_can(self::CAPABILITY)) {
            wp_die(esc_html__('You do not have permission to change the admin interface.', '3d-viewer'), 403);
        }

        $to = self::normalize(isset($_GET['ui']) ? sanitize_key(wp_unslash($_GET['ui'])) : '');

        if ('' === $to) {
            wp_die(esc_html__('Unknown admin interface.', '3d-viewer'), 400);
        }

        update_option(self::OPTION, $to);

        // Without redirect_to or a Referer the admin would land on a blank admin-post.php.
        $fallback = admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings');
        $target = isset($_GET['redirect_to']) && is_string($_GET['redirect_to']) ? wp_unslash($_GET['redirect_to']) : (string) wp_get_referer();
        $target = '' === trim($target) ? $fallback : wp_validate_redirect($target, $fallback);

        wp_safe_redirect(add_query_arg('bp3d_admin_ui_switched', $to, $target));
        exit;
    }

    /** The Settings page's first row; a `content` field with no id, so neither framework stores it. */
    public static function switchField(): array
    {
        $modern = self::MODERN === self::mode('settings');
        $locked = self::lockedBy();

        $subtitle = __('Only changes how the screens look. Settings and viewers stay the same.', '3d-viewer');

        if ('' !== $locked) {
            $subtitle = 'constant' === $locked
                ? __('The interface is set by the BP3D_ADMIN_UI constant in wp-config.php.', '3d-viewer')
                : __('The interface is set by the bp3d_admin_ui filter.', '3d-viewer');
        } elseif (!$modern && !self::bfieldsReady()) {
            // lib/bfields/ did not load, so switching would change nothing.
            $subtitle = __('The new interface could not be loaded on this site, so the classic one is used.', '3d-viewer');
        }

        $canSwitch = '' === $locked && ($modern || self::bfieldsReady());
        $options = [
            self::MODERN => [__('New', '3d-viewer'), __('Switch to the new interface', '3d-viewer')],
            self::CLASSIC => [__('Classic', '3d-viewer'), __('Switch to the classic interface', '3d-viewer')],
        ];
        $current = $modern ? self::MODERN : self::CLASSIC;
        $segments = '';

        foreach ($options as $mode => [$label, $action]) {
            if ($mode === $current) {
                $segments .= '<span class="bp3d-admin-ui-switch__opt is-current" aria-current="true">' . esc_html($label) . '</span>';
            } elseif ($canSwitch) {
                $segments .= '<a class="bp3d-admin-ui-switch__opt" href="' . esc_url(self::switchUrl($mode, self::here())) . '" title="' . esc_attr($action) . '" aria-label="' . esc_attr($action) . '">' . esc_html($label) . '</a>';
            } else {
                $segments .= '<span class="bp3d-admin-ui-switch__opt is-disabled">' . esc_html($label) . '</span>';
            }
        }

        return [
            'type' => 'content',
            'icon' => 'monitor',
            'title' => __('Admin interface', '3d-viewer'),
            'subtitle' => $subtitle,
            'content' => '<div class="bp3d-admin-ui-switch" role="group" aria-label="' . esc_attr__('Admin interface', '3d-viewer') . '">' . $segments . '</div>',
        ];
    }

    /** One line in the Publish box of the viewer and product editors. */
    public function publishBoxRow($post): void
    {
        if (!($post instanceof \WP_Post) || !current_user_can(self::CAPABILITY)) {
            return;
        }

        $surface = 'bp3d-model-viewer' === $post->post_type ? 'viewer' : ('product' === $post->post_type ? 'product' : '');

        $slot = 'viewer' === $surface ? 'post_submitbox_start' : 'post_submitbox_misc_actions';

        if ('' === $surface || current_action() !== $slot || ('product' === $surface && self::wooOff())) {
            return;
        }

        $modern = self::MODERN === self::mode($surface);
        $link = '' === self::lockedBy() && ($modern || self::bfieldsReady())
            ? sprintf(
                ' <a href="%s" class="bp3d-admin-ui-link">%s</a>',
                esc_url(self::switchUrl($modern ? self::CLASSIC : self::MODERN, (string) get_edit_post_link($post->ID, 'raw'))),
                $modern ? esc_html__('Switch to classic', '3d-viewer') : esc_html__('Try the new interface', '3d-viewer')
            )
            : '';

        printf(
            '<div class="misc-pub-section bp3d-admin-ui-row">%s <strong>%s</strong>%s</div>',
            esc_html__('3D Viewer interface:', '3d-viewer'),
            $modern ? esc_html__('New', '3d-viewer') : esc_html__('Classic', '3d-viewer'),
            $link // Escaped above.
        );
    }

    /** Shown on 3D Viewer's screens until an admin picks an interface (either button records it). */
    public function notice(): void
    {
        if (!current_user_can(self::CAPABILITY) || '' !== self::chosen() || '' !== self::lockedBy() || self::MODERN !== self::siteMode() || !self::bfieldsReady()) {
            return;
        }

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        if (!$screen || (!in_array($screen->post_type, ['bp3d-model-viewer', 'product'], true) && false === strpos((string) $screen->id, '3dviewer-settings'))) {
            return;
        }

        if ('product' === $screen->post_type && ('post' !== $screen->base || self::wooOff())) {
            return;
        }

        // The Settings page carries the switch in its first section (switchField()).
        if (false !== strpos((string) $screen->id, '3dviewer-settings')) {
            return;
        }

        // A fresh install has no previous screens to go back to.
        if (!self::hasEarlierData()) {
            return;
        }

        printf(
            '<div class="notice notice-info bp3d-admin-ui-notice"><p><strong>%s</strong> %s <a href="%s" target="_blank" rel="noopener">%s</a></p><p><a class="button button-primary" href="%s">%s</a> <a class="button" href="%s">%s</a></p></div>',
            esc_html__('3D Viewer has a new interface.', '3d-viewer'),
            esc_html__('Your settings and viewers have not changed. If you prefer the previous screens, you can switch back now or at any time from 3D Viewer → Settings.', '3d-viewer'),
            esc_url(self::DOCS_URL),
            esc_html__('Learn more', '3d-viewer'),
            esc_url(self::switchUrl(self::MODERN, self::here())),
            esc_html__('Keep the new interface', '3d-viewer'),
            esc_url(self::switchUrl(self::CLASSIC, self::here())),
            esc_html__('Switch to the classic interface', '3d-viewer')
        );
    }

    /** A form opened before the interface was switched posts the other framework's fields, which nothing saves. */
    public function flagDroppedSave($post_id, $post): void
    {
        if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !($post instanceof \WP_Post) || wp_is_post_revision((int) $post_id)) {
            return;
        }

        $unique = array_search('bp3d-model-viewer' === $post->post_type ? 'viewer' : ('product' === $post->post_type ? 'product' : ''), self::SURFACES, true);

        if (!$unique || '_bp3d_settings_' === $unique || ('_bp3d_product_' === $unique && self::wooOff()) || !current_user_can('edit_post', (int) $post_id)) {
            return;
        }

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- read-only presence checks; core verified this save's nonce.
        $classic = isset($_POST['csf_metabox_nonce' . $unique]);
        $modern = isset($_POST['bfields_values']) && is_array($_POST['bfields_values']) && isset($_POST['bfields_values'][$unique]);
        // phpcs:enable

        $isModern = self::MODERN === self::mode(self::SURFACES[$unique]);

        if ($isModern ? ($classic && !$modern) : ($modern && !$classic)) {
            set_transient('bp3d_ui_dropped_' . get_current_user_id(), (int) $post_id, 5 * MINUTE_IN_SECONDS);
        }
    }

    public function droppedNotice(): void
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        if (!$screen || 'post' !== $screen->base || !in_array($screen->post_type, ['bp3d-model-viewer', 'product'], true)) {
            return;
        }

        $key = 'bp3d_ui_dropped_' . get_current_user_id();
        $flagged = (int) get_transient($key);
        $post = get_post();

        if (!$flagged || !$post || (int) $post->ID !== $flagged) {
            return;
        }

        delete_transient($key);

        printf(
            '<div class="notice notice-warning is-dismissible"><p>%s</p></div>',
            esc_html__('The 3D Viewer settings on this page were not saved: the admin interface was switched while the page was open. Make those changes again.', '3d-viewer')
        );
    }

    /** Same test as ProductMetaPro: only an explicit '0' turns the Woo integration off. */
    private static function wooOff(): bool
    {
        $settings = get_option('_bp3d_settings_', []);

        return is_array($settings) && ($settings['3d_woo_switcher'] ?? '') === '0';
    }

    /** A saved viewer or 3D product meta from before; the settings row is no signal, since the first run seeds it. */
    private static function hasEarlierData(): bool
    {
        global $wpdb;
        static $has = null;

        if (null === $has) {
            // phpcs:disable WordPress.DB.DirectDatabaseQuery
            $has = (bool) $wpdb->get_var($wpdb->prepare("SELECT 1 FROM {$wpdb->posts} WHERE post_type = %s AND post_status <> 'auto-draft' LIMIT 1", 'bp3d-model-viewer'))
                || (bool) $wpdb->get_var($wpdb->prepare("SELECT 1 FROM {$wpdb->postmeta} WHERE meta_key = %s LIMIT 1", '_bp3d_product_'));
            // phpcs:enable
        }

        return $has;
    }

    public function styles(): void
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        if (!$screen || (!in_array($screen->post_type, ['bp3d-model-viewer', 'product'], true) && false === strpos((string) $screen->id, '3dviewer-settings'))) {
            return;
        }

        echo '<style id="bp3d-admin-ui">'
            . '.bp3d-admin-ui-switch{display:inline-flex;gap:2px;padding:3px;border-radius:8px;background:#f3f4f6;white-space:nowrap}'
            . '.bp3d-admin-ui-switch__opt{display:inline-flex;align-items:center;min-height:30px;padding:0 14px;border-radius:6px;font-size:13px;font-weight:500;line-height:1;color:#4b5563;text-decoration:none}'
            . 'a.bp3d-admin-ui-switch__opt:hover,a.bp3d-admin-ui-switch__opt:focus{color:var(--bfields-primary,#2271b1);background:#fff;box-shadow:none}'
            . 'a.bp3d-admin-ui-switch__opt:focus-visible{outline:2px solid var(--bfields-primary,#2271b1);outline-offset:1px}'
            . '.bp3d-admin-ui-switch__opt.is-current{background:var(--bfields-primary,#2271b1);color:#fff;font-weight:600}'
            . '.bp3d-admin-ui-switch__opt.is-disabled{opacity:.5;cursor:not-allowed}'
            // bfields gives a titled content row a fixed title column; this one lays out like a toggle row.
            . '.bfields-app .bfields-row.bfields-row--titled:has(.bp3d-admin-ui-switch)>.bfields-row__main{flex:1 1 auto}'
            . '.bfields-app .bfields-row.bfields-row--titled:has(.bp3d-admin-ui-switch)>.bfields-row__control{flex:none}'
            . '#major-publishing-actions .bp3d-admin-ui-row{padding:0 0 10px;margin:0 0 10px;border-bottom:1px solid #dcdcde}'
            . '</style>';
    }
}
