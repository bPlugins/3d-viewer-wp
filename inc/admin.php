<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin dashboard handler.
 *
 * Manages admin menus, dashboard pages, and admin-specific
 * script/style enqueuing for the 3D Viewer plugin.
 */
if (!class_exists('BP3DAdmin')) {
    class BP3DAdmin
    {
        /** Slug of the hidden guided-setup screen, shared with Pro. */
        const SETUP_SLUG = 'bp3d-setup-wizard';

        /** Slug used up to 1.9.3, redirected to SETUP_SLUG. */
        const LEGACY_SETUP_SLUG = '3d-viewer-setup';

        public function __construct()
        {
            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
            add_action('admin_menu', [$this, 'register_admin_menus'], 15);
            add_action('admin_page_access_denied', [$this, 'redirect_legacy_setup_url']);
            // Last hook before admin-header.php prints the notices.
            add_action('in_admin_header', [$this, 'suppress_setup_notices'], PHP_INT_MAX);
            add_action('admin_head', [$this, 'render_admin_styles']);
        }

        /**
         * Output admin head styles for the Freemius Upgrade menu link.
         */
        public function render_admin_styles()
        {
            ?>
            <style>
                .fs-submenu-item.\33 d-viewer.pricing.upgrade-mode {
                    background: #146ef5;
                    border-radius: 3px;
                    color: #fff;
                    display: inline-block;
                    padding: 9px 20px 9px 18px;
                }
            </style>
            <?php
        }

        /**
         * Keep the setup screen to our own content: no notices from WordPress,
         * Freemius or other plugins.
         */
        public function suppress_setup_notices()
        {
            if (!self::onboarding_available() || !$this->is_setup_screen()) {
                return;
            }

            foreach (['admin_notices', 'all_admin_notices', 'network_admin_notices', 'user_admin_notices'] as $action) {
                remove_all_actions($action);
            }
        }

        /**
         * Admin URL of the guided-setup screen.
         */
        public static function setupUrl()
        {
            return admin_url('edit.php?post_type=bp3d-model-viewer&page=' . self::SETUP_SLUG);
        }

        /**
         * Whether the setup screen exists; the class is absent when an older
         * build is running. A licensed site can open it, but is never sent there.
         */
        private static function onboarding_available()
        {
            return class_exists('\BP3D\Base\Onboarding');
        }

        /**
         * Whether the current request is the guided-setup screen.
         */
        private function is_setup_screen()
        {
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen check, no state change.
            return isset($_GET['page']) && self::SETUP_SLUG === sanitize_key(wp_unslash($_GET['page']));
        }

        /**
         * Send the pre-1.9.4 slug and the admin.php form of the URL (used by Pro
         * and old docs) to the real screen instead of WordPress' access error.
         */
        public function redirect_legacy_setup_url()
        {
            global $pagenow;

            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only redirect, no state change.
            $page = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : '';
            $is_legacy = self::LEGACY_SETUP_SLUG === $page;
            $is_admin_php = self::SETUP_SLUG === $page && 'admin.php' === $pagenow;

            if (!self::onboarding_available() || !($is_legacy || $is_admin_php) || !current_user_can('manage_options')) {
                return;
            }

            wp_safe_redirect(self::setupUrl());
            exit;
        }

        /**
         * Enqueue dashboard scripts and styles on relevant admin pages.
         */
        public function enqueue_admin_scripts($hook)
        {
            // Checked before the slug guard below: the setup screen's hook also
            // contains '3d-viewer', but it loads its own bundle.
            if (self::onboarding_available() && $this->is_setup_screen()) {
                $this->enqueue_setup_scripts();
                return;
            }

            if (strpos($hook, '3d-viewer') === false) {
                return;
            }

            wp_enqueue_style(
                'bp3d-dashboard',
                BP3D_DIR . 'build/dashboard.css',
                [],
                BP3D_VERSION
            );

            wp_enqueue_script(
                'bp3d-admin-script',
                BP3D_DIR . 'build/dashboard.js',
                [
                    'react',
                    'react-dom',
                    'wp-components',
                    'wp-i18n',
                    'wp-api',
                    'wp-util',
                    'lodash',
                    'wp-media-utils',
                    'wp-data',
                    'wp-core-data',
                    'wp-api-request',
                ],
                BP3D_VERSION,
                true
            );

            wp_localize_script('bp3d-admin-script', 'bp3dDashboard', [
                'dir' => BP3D_DIR,
            ]);
        }

        /**
         * Assets for the guided-setup screen.
         *
         * A separate bundle from the dashboard so the wizard doesn't pull in
         * demos, pricing, and the router it never uses.
         */
        private function enqueue_setup_scripts()
        {
            // Build hash busts the browser cache between releases, not just on a version bump.
            $asset_file = BP3D_PATH . 'build/onboarding.asset.php';
            $asset = file_exists($asset_file) ? include $asset_file : [];
            $version = $asset['version'] ?? BP3D_VERSION;

            wp_enqueue_style(
                'bp3d-onboarding',
                BP3D_DIR . 'build/onboarding.css',
                [],
                $version
            );

            // Fallback for notices injected after load (JS or late hooks) that suppress_setup_notices() can't reach.
            // The footer goes too, with the padding wp-admin reserves for it.
            wp_add_inline_style('bp3d-onboarding', '#wpbody-content > :not(#bp3dOnboarding), #wpfooter { display: none !important; } #wpbody-content { padding-bottom: 0; }');

            wp_enqueue_script(
                'bp3d-onboarding-script',
                BP3D_DIR . 'build/onboarding.js',
                ['react', 'react-dom', 'wp-i18n', 'wp-util'],
                $version,
                true
            );

            wp_set_script_translations('bp3d-onboarding-script', '3d-viewer', BP3D_PATH . 'languages');
        }

        /**
         * Register admin submenu pages.
         */
        public function register_admin_menus()
        {


            add_submenu_page(
                'edit.php?post_type=bp3d-model-viewer',
                __('Demo and Help - 3D Viewer', '3d-viewer'),
                '<span style="color: #f18500;">' . __('Help & Demos', '3d-viewer') . '</span>',
                'edit_posts',
                '3d-viewer',
                [$this, 'render_dashboard_page'],
                9
            );

            if (!self::onboarding_available()) {
                return;
            }

            // Registered so the screen is reachable by URL, then hidden from the
            // menu. add_submenu_page( null, ... ) would do the same but is
            // deprecated as of PHP 8.1.
            $setup_hook = add_submenu_page(
                'edit.php?post_type=bp3d-model-viewer',
                __('Guided Setup - 3D Viewer', '3d-viewer'),
                __('Guided Setup', '3d-viewer'),
                'manage_options',
                self::SETUP_SLUG,
                [$this, 'render_setup_page']
            );
            remove_submenu_page('edit.php?post_type=bp3d-model-viewer', self::SETUP_SLUG);

            // get_admin_page_title() derives $title by scanning the $submenu
            // global, and we just removed our entry from it. Without this the
            // global stays null and admin-header.php trips PHP 8.1's
            // "strip_tags(): passing null" deprecation.
            if ($setup_hook) {
                add_action("load-{$setup_hook}", function () {
                    $GLOBALS['title'] = __('Guided Setup - 3D Viewer', '3d-viewer');
                });
            }
        }

        /**
         * Render the main dashboard/help page.
         */
        public function render_dashboard_page()
        {
            $info = wp_json_encode([
                'version' => BP3D_VERSION,
                'adminUrl' => rtrim(admin_url(), '/'),
                'setupUrl' => self::setupUrl(),
                // Drives the "Guided Setup" nav entry: shown with the progress
                // so far until the wizard has been run to the end.
                'onboarding' => class_exists('\BP3D\Base\Onboarding')
                    ? \BP3D\Base\Onboarding::state()
                    : ['completed' => true, 'percent' => 100],
            ]);
            ?>
            <div id="bp3dAdminDashboard" data-info="<?php echo esc_attr($info); ?>"></div>
            <?php
        }

        /**
         * Render the guided setup wizard.
         */
        public function render_setup_page()
        {
            if (!self::onboarding_available()) {
                return;
            }

            $info = wp_json_encode([
                'isPremium' => !\BP3D\Base\Onboarding::is_available(),
                'ajaxAction' => \BP3D\Base\Onboarding::AJAX_ACTION,
                // Must be created for the same action the handler verifies.
                'nonce' => wp_create_nonce(\BP3D\Base\Onboarding::AJAX_ACTION),
                'dir' => BP3D_DIR,
                'userName' => wp_get_current_user()->display_name,
                'hasElementor' => did_action('elementor/loaded') > 0,
                'urls' => [
                    'addModel' => admin_url('post-new.php?post_type=bp3d-model-viewer'),
                    'addPage' => admin_url('post-new.php?post_type=page'),
                    'dashboard' => admin_url('edit.php?post_type=bp3d-model-viewer&page=3d-viewer'),
                    'upgrade' => admin_url('edit.php?post_type=bp3d-model-viewer&page=3d-viewer#/pricing'),
                    'tutorial' => 'https://youtu.be/Tno8LiebxaI',
                ],
            ]);
            ?>
            <div id="bp3dOnboarding" data-info="<?php echo esc_attr($info); ?>"></div>
            <?php
        }
    }

    new BP3DAdmin();
}