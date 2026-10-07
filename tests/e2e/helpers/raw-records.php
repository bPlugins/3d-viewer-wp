<?php
/**
 * Raw bytes of the records the crossmode/Dokan specs round-trip, read and written with $wpdb.
 * Copied from 3D Viewer Pro's suite; the option list is configurable (BP3D_RAW_OPTIONS).
 *
 *   action=get  [viewer=<id>] [product=<id>] [options=a,b]   → JSON {settings, options, viewer, …} (base64)
 *   action=set  [viewer=<id>] [options=a,b] in=<file>         → writes those bytes back (existing rows only)
 *   action=diff in=<file {a, b} base64>                       → JSON list of differences
 *
 * Each key can also come from the environment (BP3D_RAW, BP3D_RAW_VIEWER, BP3D_RAW_PRODUCT,
 * BP3D_RAW_OPTIONS, BP3D_RAW_IN). `set` never inserts or deletes a row.
 */

// WP-CLI only: a direct web hit gets nothing.
if (!defined('ABSPATH') || !defined('WP_CLI') || !WP_CLI) {
	exit;
}

global $wpdb;

$bp3d_raw_args = array();
foreach (isset($args) && is_array($args) ? $args : array() as $bp3d_raw_arg) {
	if (false !== strpos((string) $bp3d_raw_arg, '=')) {
		$bp3d_raw_kv = explode('=', (string) $bp3d_raw_arg, 2);
		$bp3d_raw_args[$bp3d_raw_kv[0]] = $bp3d_raw_kv[1];
	}
}
$arg = static function (string $key, string $env) use ($bp3d_raw_args): string {
	return isset($bp3d_raw_args[$key]) ? (string) $bp3d_raw_args[$key] : (string) getenv($env);
};

$action  = $arg('action', 'BP3D_RAW');
$viewer  = (int) $arg('viewer', 'BP3D_RAW_VIEWER');
$product = (int) $arg('product', 'BP3D_RAW_PRODUCT');
$options = array_values(array_filter(array_map('trim', explode(',', $arg('options', 'BP3D_RAW_OPTIONS') ?: '_bp3d_settings_'))));

$read = static function () use ($wpdb, $viewer, $product, $options): array {
	$out = array('options' => array());
	foreach ($options as $name) {
		$value = $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $name));
		$out['options'][$name] = null === $value ? null : base64_encode($value);
	}
	$out['settings'] = $out['options']['_bp3d_settings_'] ?? null;

	if ($viewer) {
		$meta = $wpdb->get_col($wpdb->prepare("SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = %s ORDER BY meta_id", $viewer, '_bp3dimages_'));
		$out['viewer']   = 1 === count($meta) ? base64_encode($meta[0]) : null;
		$out['rows']     = count($meta);
		$out['modified'] = (string) $wpdb->get_var($wpdb->prepare("SELECT post_modified_gmt FROM {$wpdb->posts} WHERE ID = %d", $viewer));
	}

	if ($product) {
		$rows = $wpdb->get_col($wpdb->prepare("SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = %s ORDER BY meta_id", $product, '_bp3d_product_'));
		$out['product']          = 1 === count($rows) ? base64_encode($rows[0]) : null;
		$out['product_rows']     = count($rows);
		$out['product_modified'] = (string) $wpdb->get_var($wpdb->prepare("SELECT post_modified_gmt FROM {$wpdb->posts} WHERE ID = %d", $product));
	}

	return $out;
};

if ('get' === $action) {
	echo wp_json_encode($read());
	return;
}

$in = json_decode((string) file_get_contents($arg('in', 'BP3D_RAW_IN')), true);

if ('set' === $action) {
	$wanted = isset($in['options']) && is_array($in['options']) ? $in['options'] : array('_bp3d_settings_' => $in['settings'] ?? null);
	$wanted = array_intersect_key($wanted, array_flip($options));
	foreach ($wanted as $name => $b64) {
		if (null !== $b64) {
			$wpdb->update($wpdb->options, array('option_value' => base64_decode($b64)), array('option_name' => $name));
			wp_cache_delete($name, 'options');
		}
	}
	wp_cache_delete('alloptions', 'options');

	if ($viewer && isset($in['viewer'])) {
		$wpdb->update($wpdb->postmeta, array('meta_value' => base64_decode($in['viewer'])), array('post_id' => $viewer, 'meta_key' => '_bp3dimages_'));
		wp_cache_delete($viewer, 'post_meta');
	}

	$now = $read();
	$ok  = true;
	foreach ($wanted as $name => $b64) {
		$ok = $ok && (null === $b64 || $now['options'][$name] === $b64);
	}
	if ($viewer && isset($in['viewer'])) {
		$ok = $ok && $now['viewer'] === $in['viewer'] && 1 === $now['rows'];
	}
	echo wp_json_encode($ok);
	return;
}

if ('diff' !== $action) {
	exit(1);
}

function bp3d_raw_show($v): string
{
	return gettype($v) . ' ' . str_replace("\n", '', var_export($v, true));
}

/** The shape a Codestar form post gives an untouched stored value, or ''. */
function bp3d_raw_rule($a, $b): string
{
	if (is_bool($a) && $b === ($a ? '1' : '')) {
		return 'switcher: seeded/Reset bool posted as its string';
	}
	if ((is_int($a) || is_float($a)) && is_string($b) && (string) $a === $b) {
		return 'number: raw authored default posted as a string';
	}
	if (is_array($a) && 1 <= count($a) && is_string($b) && array_keys($a) === range(0, count($a) - 1) && array_values($a)[0] === $b) {
		return 'button_set: Reset array posted as its string';
	}
	if (array() === $a && '' === $b) {
		return "checkbox/group: empty list posted as ''";
	}

	return '';
}

function bp3d_raw_diff($a, $b, string $path = ''): array
{
	if (is_array($a) && is_array($b)) {
		$out = array();
		if (array_keys($a) !== array_keys($b) && array() === array_diff_key($a, $b) && array() === array_diff_key($b, $a)) {
			$out[] = array('path' => $path, 'kind' => 'key-order', 'before' => implode(',', array_keys($a)), 'after' => implode(',', array_keys($b)), 'rule' => '');
		}
		foreach ($a as $k => $v) {
			$sub = '' === $path ? (string) $k : $path . '.' . $k;
			if (!array_key_exists($k, $b)) {
				$out[] = array('path' => $sub, 'kind' => 'removed', 'before' => bp3d_raw_show($v), 'after' => '(absent)', 'rule' => '');
				continue;
			}
			$out = array_merge($out, bp3d_raw_diff($v, $b[$k], $sub));
		}
		foreach ($b as $k => $v) {
			if (!array_key_exists($k, $a)) {
				$out[] = array('path' => '' === $path ? (string) $k : $path . '.' . $k, 'kind' => 'added', 'before' => '(absent)', 'after' => bp3d_raw_show($v), 'rule' => '');
			}
		}
		return $out;
	}
	if ($a === $b) {
		return array();
	}
	return array(array('path' => $path, 'kind' => 'value', 'before' => bp3d_raw_show($a), 'after' => bp3d_raw_show($b), 'rule' => bp3d_raw_rule($a, $b)));
}

$raw_a = base64_decode((string) $in['a']);
$raw_b = base64_decode((string) $in['b']);
$diffs = bp3d_raw_diff(
	unserialize($raw_a, array('allowed_classes' => false)),
	unserialize($raw_b, array('allowed_classes' => false))
);

if ($raw_a !== $raw_b && array() === $diffs) {
	$diffs[] = array('path' => '(root)', 'kind' => 'bytes', 'before' => strlen($raw_a) . ' bytes', 'after' => strlen($raw_b) . ' bytes', 'rule' => '');
}

echo wp_json_encode($diffs);
