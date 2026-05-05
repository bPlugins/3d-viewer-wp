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
            add_action('admin_head', [$this, 'render_admin_styles']);
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
                'version' => BP3D_VERSION,
                'hasPro' => file_exists(BP3D_PATH . '/inc/Base/LicenseActivation.php')
            ]);
            ?>
            <div id="bp3dAdminDashboard" data-info="<?php echo esc_attr($info); ?>"></div>
            <?php
        }

    

        /**
         * Output admin head styles for pricing link.
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

                .menu-icon-bp3d-model-viewer ul li:has(a[href$="3d-viewer-affiliation"]) {
                    display: none;
                }
            </style>
            <?php
        }
    }

    new BP3DAdmin();
}