<?php
if (!defined('ABSPATH'))
    exit;
/**
 * Fired when the plugin is uninstalled.
 *
 * @link  https://developer.wordpress.org/plugins/plugin-basics/uninstall-methods/
 * @since 1.0.0
 */

// Exit if not called by WordPress.
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

if (!function_exists('is_plugin_active')) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

if (is_plugin_active('3d-viewer-premium/3d-viewer-premium.php')) {
    return;
}

// Bail early if the user hasn't opted in to data removal.
$bp3d_settings = get_option('_bp3d_settings_', []);
$bp3d_should_delete = isset($bp3d_settings['delete_data_on_uninstall']) && $bp3d_settings['delete_data_on_uninstall'] === '1';

if (!$bp3d_should_delete) {
    return;
}

// ── 1. Delete all 3D Viewer posts (and their meta / terms) ──────────
$bp3d_posts = get_posts([
    'post_type' => 'bp3d-model-viewer',
    'posts_per_page' => -1,
    'post_status' => 'any',
    'fields' => 'ids',
]);

foreach ($bp3d_posts as $post_id) {
    wp_delete_post($post_id, true);
}

// ── 2. Delete plugin options ─────────────────────────────────────────
$bp3d_option_keys = [
    '_bp3d_settings_',            // Main settings (CSF)
    'bp3d_setup_wizard_completed', // Setup wizard flag
    'bp3d_onboarding_completed',  // Guided setup run to the end
    'bp3d_onboarding_exited',     // Guided setup left before the last step
    'bp3d_onboarding_progress',   // Guided setup progress percentage
    'bp3d_onboarding_redirect',   // Guided setup one-time redirect flag
    'bp3d_imported',              // Import migration flag
    'bp3d_mime_defaults_widened', // One-time upload whitelist widening flag
    'model_viewer_import_ver',    // Import version tracker
];

foreach ($bp3d_option_keys as $bp3d_key) {
    delete_option($bp3d_key);
}

// ── 2b. Per-user guided setup notice dismissals ──────────────────────
delete_metadata('user', 0, 'bp3d_dismissed_onboarding_notice', '', true);

// ── 3. Clean up any CSF framework transients ─────────────────────────
delete_transient('csf_remote_stylesheets');