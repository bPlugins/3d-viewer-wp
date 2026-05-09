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
    'bp3d_imported',              // Import migration flag
    'model_viewer_import_ver',    // Import version tracker
];

foreach ($bp3d_option_keys as $bp3d_key) {
    delete_option($bp3d_key);
}

// ── 3. Clean up any CSF framework transients ─────────────────────────
delete_transient('csf_remote_stylesheets');