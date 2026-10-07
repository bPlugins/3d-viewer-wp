<?php
/**
 * A simple product whose `_bp3d_product_` has the shape a site saved before the new interface.
 *
 *   action=create shape=free url=<glb> [tag=<label>]   → the new product ID (flat free keys only)
 *   action=create shape=pro  url=<glb> [tag=<label>]   → the same plus 3D Viewer Pro keys: model row 0
 *                                                         (AR off, hotspots with `"` and `\`), popup models,
 *                                                         viewer_position=tab
 *   action=delete id=<id>                              → deletes it, only when its title starts with E2E-3DV
 *
 * Arguments may also come from BP3D_FIXTURE, BP3D_FIXTURE_SHAPE, BP3D_FIXTURE_URL, BP3D_FIXTURE_TAG, BP3D_FIXTURE_ID.
 */

// WP-CLI only: a direct web hit gets nothing.
if (!defined('ABSPATH') || !defined('WP_CLI') || !WP_CLI) {
	exit;
}

if (!class_exists('WC_Product_Simple')) {
	fwrite(STDERR, "WooCommerce is not active\n");
	exit(1);
}

$bp3d_fx_args = array();
foreach (isset($args) && is_array($args) ? $args : array() as $bp3d_fx_arg) {
	if (false !== strpos((string) $bp3d_fx_arg, '=')) {
		$bp3d_fx_kv = explode('=', (string) $bp3d_fx_arg, 2);
		$bp3d_fx_args[$bp3d_fx_kv[0]] = $bp3d_fx_kv[1];
	}
}
$arg = static function (string $key, string $env) use ($bp3d_fx_args): string {
	return isset($bp3d_fx_args[$key]) ? (string) $bp3d_fx_args[$key] : (string) getenv($env);
};

$action = $arg('action', 'BP3D_FIXTURE');

if ('delete' === $action) {
	$product = wc_get_product((int) $arg('id', 'BP3D_FIXTURE_ID'));
	if ($product && 0 === strpos($product->get_name(), 'E2E-3DV')) {
		$product->delete(true);
	}
	echo 'true';
	return;
}

if ('create' !== $action) {
	exit(1);
}

$shape = $arg('shape', 'BP3D_FIXTURE_SHAPE') ?: 'free';
$url   = $arg('url', 'BP3D_FIXTURE_URL');
$tag   = $arg('tag', 'BP3D_FIXTURE_TAG') ?: $shape;

$product = new WC_Product_Simple();
$product->set_name("E2E-3DV {$tag} product");
$product->set_status('publish');
$product->set_regular_price('10');
$id = $product->save();

// The flat keys the free product box writes.
$meta = array(
	'bp3d_model_src'  => $url,
	'bp3d_poster_src' => '',
	'viewer_position' => 'top',
	'bp_model_bg'     => '#f5f5f5',
);

if ('pro' === $shape) {
	$meta['viewer_position'] = 'tab';
	$meta['bp3d_models']     = array(
		array(
			'model_src'     => $url,
			'poster_src'    => '',
			'exposure'      => '1',
			'enable_ar'     => '',
			'model_iso_src' => '',
			'ar_placement'  => 'floor',
			'ar_mode'       => 'webxr',
			'hotspots'      => array(
				array(
					'title'    => 'Say "hi"',
					'desc'     => 'C:\\models\\cube "v2"',
					'position' => '0.005m 0.036m 0.078m',
					'normal'   => '0m -0.112m 0.993m',
				),
			),
		),
	);
	$meta['bp3d_popup_models'] = array(
		array(
			'selector'           => 'e2e-3dv-popup',
			'popupCurrentViewer' => 'modelViewer',
			'model_src'          => $url,
			'target'             => '_blank',
		),
	);
}

update_post_meta($id, '_bp3d_product_', wp_slash($meta));

echo (int) $id;
