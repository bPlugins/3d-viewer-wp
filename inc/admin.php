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
        /** Slug of the hidden guided-setup screen. */
        const SETUP_SLUG = '3d-viewer-setup';

        public function __construct()
        {
            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
            add_action('admin_menu', [$this, 'register_admin_menus'], 15);
            add_filter('admin_body_class', [$this, 'setup_body_class']);
        }

        /**
         * Admin URL of the guided-setup screen.
         */
        public static function setupUrl()
        {
            return admin_url('edit.php?post_type=bp3d-model-viewer&page=' . self::SETUP_SLUG);
        }

        /**
         * Whether the guided setup applies to this install. It is a free-plugin
         * feature, and the class is absent when an older build is running.
         */
        private static function onboarding_available()
        {
            return class_exists('\BP3D\Base\Onboarding') && \BP3D\Base\Onboarding::is_available();
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
            wp_enqueue_style(
                'bp3d-onboarding',
                BP3D_DIR . 'build/onboarding.css',
                [],
                BP3D_VERSION
            );

            wp_enqueue_script(
                'bp3d-onboarding-script',
                BP3D_DIR . 'build/onboarding.js',
                ['react', 'react-dom', 'wp-i18n', 'wp-util'],
                BP3D_VERSION,
                true
            );

            wp_localize_script('bp3d-onboarding-script', 'bp3dDashboard', [
                'dir' => BP3D_DIR,
            ]);

            wp_set_script_translations('bp3d-onboarding-script', '3d-viewer', BP3D_PATH . 'languages');
        }

        /**
         * Hide the WordPress admin chrome on the wizard screen.
         *
         * @param  string $classes
         * @return string
         */
        public function setup_body_class($classes)
        {
            if (self::onboarding_available() && $this->is_setup_screen()) {
                // Trailing space too: a later filter that forgets its leading
                // space (Tutor LMS does) would otherwise fuse onto this class.
                $classes .= ' bpl-onboarding-fullscreen ';
            }

            return $classes;
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
         * Render the full-screen guided setup wizard.
         */
        public function render_setup_page()
        {
            if (!self::onboarding_available()) {
                return;
            }

            $info = wp_json_encode([
                'version' => BP3D_VERSION,
                'adminUrl' => rtrim(admin_url(), '/'),
                'dashboardUrl' => admin_url('edit.php?post_type=bp3d-model-viewer&page=3d-viewer'),
                'ajaxAction' => \BP3D\Base\Onboarding::AJAX_ACTION,
                // Must be created for the same action the handler verifies.
                'nonce' => wp_create_nonce(\BP3D\Base\Onboarding::AJAX_ACTION),
            ]);
            ?>
            <div id="bp3dOnboarding" data-info="<?php echo esc_attr($info); ?>"></div>
            <?php
        }
    }

    new BP3DAdmin();
}