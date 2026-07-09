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
        public function __construct()
        {
            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
            add_action('admin_menu', [$this, 'register_admin_menus'], 15);
        }

        /**
         * Enqueue dashboard scripts and styles on relevant admin pages.
         */
        public function enqueue_admin_scripts($hook)
        {

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
        }

        /**
         * Render the main dashboard/help page.
         */
        public function render_dashboard_page()
        {
            $info = wp_json_encode([
                'version'   => BP3D_VERSION,
                'adminUrl'  => rtrim(admin_url(), '/'),
                'isPremium' => function_exists('bp3d_fs') && bp3d_fs()->can_use_premium_code(),
            ]);
            ?>
            <div id="bp3dAdminDashboard" data-info="<?php echo esc_attr($info); ?>"></div>
            <?php
        }
    }

    new BP3DAdmin();
}