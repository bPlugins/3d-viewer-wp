<?php
/**
 * Renders AdminUi::notice() as if nobody had chosen an interface yet, without touching the option.
 *
 *   user=<login> screen=<screen id> [nodata=1]  → JSON {html, ready, siteMode}
 *
 * `bp3d_admin_ui` is read as '' through pre_option_; nodata=1 makes hasEarlierData()'s two
 * queries return no rows. Nothing is written.
 */

if (!defined('ABSPATH') || !defined('WP_CLI') || !WP_CLI) {
	exit;
}

global $wpdb;

$bp3d_n_args = array();
foreach (isset($args) && is_array($args) ? $args : array() as $bp3d_n_arg) {
	if (false !== strpos((string) $bp3d_n_arg, '=')) {
		$bp3d_n_kv = explode('=', (string) $bp3d_n_arg, 2);
		$bp3d_n_args[$bp3d_n_kv[0]] = $bp3d_n_kv[1];
	}
}

$user = get_user_by('login', (string) ($bp3d_n_args['user'] ?? ''));
if ($user) {
	wp_set_current_user($user->ID);
}

add_filter('pre_option_' . \BP3D\Base\AdminUi::OPTION, '__return_empty_string');

if (!empty($bp3d_n_args['nodata'])) {
	add_filter('query', static function ($query) use ($wpdb) {
		$earlier = 0 === strpos($query, 'SELECT 1 FROM ')
			&& (false !== strpos($query, "post_type = 'bp3d-model-viewer'") || false !== strpos($query, "meta_key = '_bp3d_product_'"));
		return $earlier ? "SELECT 1 FROM {$wpdb->posts} WHERE 0" : $query;
	});
}

// The mode was resolved while the plugins loaded; resolve it again with the option unset.
foreach (array('mode' => null, 'filtered' => false) as $bp3d_n_prop => $bp3d_n_value) {
	$bp3d_n_ref = new ReflectionProperty(\BP3D\Base\AdminUi::class, $bp3d_n_prop);
	// Needed before PHP 8.1; deprecated from 8.5, where a notice would corrupt the JSON output.
	if (PHP_VERSION_ID < 80100) {
		$bp3d_n_ref->setAccessible(true);
	}
	$bp3d_n_ref->setValue(null, $bp3d_n_value);
}

require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
require_once ABSPATH . 'wp-admin/includes/screen.php';
set_current_screen((string) ($bp3d_n_args['screen'] ?? 'edit-bp3d-model-viewer'));

ob_start();
(new \BP3D\Base\AdminUi())->notice();
$html = (string) ob_get_clean();

// With a screen set, is_admin() is true: shutdown would save a Woo session and start Action Scheduler's async runner.
remove_all_actions('shutdown');

echo wp_json_encode(array(
	'html'     => $html,
	'ready'    => \BP3D\Base\AdminUi::bfieldsReady(),
	'siteMode' => \BP3D\Base\AdminUi::siteMode(),
));
