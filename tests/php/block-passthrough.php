<?php
/**
 * 20c render check (plan RELEASE-2.4.0 §7.1): a Pro-built block rendered through free's block.json and render.php
 * logs no notice, keeps its Pro attributes, and maps lazyLoad to `loading`. Read-only; the free plugin need not be
 * active, and nothing is registered or saved.
 *
 *   wp eval-file wp-content/plugins/3d-viewer/tests/php/block-passthrough.php
 */

if (!defined('ABSPATH')) {
    exit;
}

$bp3d_dir = dirname(__DIR__, 2) . '/src/blocks/3d-viewer/';
$bp3d_meta = json_decode((string) file_get_contents($bp3d_dir . 'block.json'), true);
$bp3d_type = new WP_Block_Type('bp3d-test/free-modelviewer', ['attributes' => $bp3d_meta['attributes']]);

$bp3d_notices = [];
set_error_handler(static function ($errno, $message) use (&$bp3d_notices) {
    $bp3d_notices[] = $message;
    return true;
});
add_action('doing_it_wrong_run', static function ($function, $message) use (&$bp3d_notices) {
    $bp3d_notices[] = $function . ': ' . $message;
}, 10, 2);
// Whatever else is active must not reshape the attributes under test.
remove_all_filters('bp3d_gutenberg_model_attribute');

$bp3d_pro = [
    'uniqueId' => 'b3dviewer1a2b3c4d',
    'model' => ['modelUrl' => 'https://a.test/one.glb'],
    'multiple' => true,
    'models' => [['modelUrl' => 'https://a.test/one.glb'], ['modelUrl' => 'https://a.test/two.glb']],
    'hotspots' => [['id' => 'h1', 'text' => 'Handle']],
    'autoRotate' => true,
    'rotateAlongY' => 60,
    'zoomLevel' => 1.5,
    'mobile' => ['imageMode' => 'image', 'breakpoint' => 600],
    'variantSelector' => ['style' => 'swatches'],
    'stylesheet' => '.x{color:red}',
];

$bp3d_cases = [
    'pro eager' => [['lazyLoad' => 'eager'] + $bp3d_pro, 'eager'],
    'pro auto' => [['lazyLoad' => 'auto'] + $bp3d_pro, 'lazy'],
    'pro lazy' => [['lazyLoad' => 'lazy'] + $bp3d_pro, 'lazy'],
    'pro default' => [$bp3d_pro, 'lazy'],
    'free true' => [['lazyLoad' => true, 'model' => ['modelUrl' => 'https://a.test/m.glb']], 'lazy'],
    'free false' => [['lazyLoad' => false, 'model' => ['modelUrl' => 'https://a.test/m.glb']], 'eager'],
];

$bp3d_failed = 0;
foreach ($bp3d_cases as $bp3d_label => list($bp3d_input, $bp3d_loading)) {
    $attributes = $bp3d_type->prepare_attributes_for_render($bp3d_input);
    $content = '';
    $block = null;

    ob_start();
    include $bp3d_dir . 'render.php';
    $bp3d_html = (string) ob_get_clean();

    preg_match('/data-attributes="([^"]*)"/', $bp3d_html, $bp3d_match);
    $bp3d_data = json_decode(html_entity_decode($bp3d_match[1] ?? '', ENT_QUOTES), true) ?: [];

    $bp3d_errors = [];
    if (($bp3d_data['loading'] ?? null) !== $bp3d_loading) {
        $bp3d_errors[] = 'loading=' . var_export($bp3d_data['loading'] ?? null, true);
    }
    foreach ($bp3d_input as $bp3d_key => $bp3d_value) {
        if (($bp3d_data[$bp3d_key] ?? null) !== $bp3d_value) {
            $bp3d_errors[] = 'lost ' . $bp3d_key;
        }
    }

    $bp3d_failed += $bp3d_errors ? 1 : 0;
    echo ($bp3d_errors ? 'FAIL ' : 'ok   ') . $bp3d_label . ($bp3d_errors ? ' (' . implode(', ', $bp3d_errors) . ')' : '') . "\n";
}

restore_error_handler();

if ($bp3d_notices) {
    $bp3d_failed++;
    echo 'FAIL notices: ' . implode(' | ', array_unique($bp3d_notices)) . "\n";
} else {
    echo "ok   no notices\n";
}

echo $bp3d_failed ? "FAILED\n" : "PASSED\n";
