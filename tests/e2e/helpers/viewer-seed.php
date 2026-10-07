<?php
/**
 * New 3D Viewer posts with the `_bp3dimages_` row a free classic-editor save writes.
 *
 *   count=<n> url=<glb> tag=<label> [status=publish|draft|private]  → JSON [id, …]
 *
 * Titles start with "E2E-3DV" so global-setup's cleanup removes them on the next run.
 * Creates new posts only; never touches existing ones.
 */

if (!defined('ABSPATH') || !defined('WP_CLI') || !WP_CLI) {
	exit;
}

$bp3d_seed_args = array();
foreach (isset($args) && is_array($args) ? $args : array() as $bp3d_seed_arg) {
	if (false !== strpos((string) $bp3d_seed_arg, '=')) {
		$bp3d_seed_kv = explode('=', (string) $bp3d_seed_arg, 2);
		$bp3d_seed_args[$bp3d_seed_kv[0]] = $bp3d_seed_kv[1];
	}
}

$count  = max(1, (int) ($bp3d_seed_args['count'] ?? 1));
$url    = (string) ($bp3d_seed_args['url'] ?? '');
$tag    = (string) ($bp3d_seed_args['tag'] ?? 'seed');
$status = in_array($bp3d_seed_args['status'] ?? '', array('publish', 'draft', 'private'), true) ? $bp3d_seed_args['status'] : 'publish';

$media = static function (string $src): array {
	return array_merge(array_fill_keys(array('url', 'id', 'width', 'height', 'thumbnail', 'alt', 'title', 'description'), ''), array('url' => $src));
};

$row = array(
	'currentViewer'         => 'modelViewer',
	'bp_3d_src'             => $media($url),
	'bp_3d_poster'          => $media(''),
	'bp_camera_control'     => '1',
	'bp_3d_zooming'         => '1',
	'bp_3d_fullscreen'      => '1',
	'bp_3d_zoom_in_out_btn' => '1',
	'bp_3d_camera_btn'      => '0',
	'bp_3d_download_btn'    => '0',
	'bp_3d_loading'         => 'auto',
	'bp_3d_progressbar'     => '1',
	'3d_exposure'           => '1',
	'3d_shadow_intensity'   => '1',
	'bp_3d_width'           => array('width' => '100', 'unit' => '%'),
	'bp_3d_height'          => array('height' => '320', 'unit' => 'px'),
	'bp_3d_align'           => 'center',
	'bp_model_bg'           => 'transparent',
);

$ids = array();
for ($i = 1; $i <= $count; $i++) {
	$id = wp_insert_post(array('post_type' => 'bp3d-model-viewer', 'post_status' => $status, 'post_title' => "E2E-3DV {$tag} #{$i}"), true);
	if (is_wp_error($id)) {
		WP_CLI::error($id->get_error_message());
	}
	// The classic (meta box) editor, as global-setup's classic model.
	update_post_meta($id, '_bp3d_is_gutenberg', '0');
	update_post_meta($id, 'isGutenberg', '0');
	update_post_meta($id, '_bp3dimages_', wp_slash($row));
	$ids[] = (int) $id;
}

echo wp_json_encode($ids);
