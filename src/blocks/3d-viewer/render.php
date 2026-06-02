<?php
if (!defined('ABSPATH'))
    exit;

$id = wp_unique_id('bp3d-viewer-');

if ($attributes['currentViewer'] == 'modelViewer') {
    wp_enqueue_script_module('bp3d-lib-model-viewer');
} else if ($attributes['currentViewer'] == 'O3DViewer') {
    wp_enqueue_script('bp3d-lib-o3dviewer');
}

$bp3d_attributes = apply_filters('bp3d_gutenberg_model_attribute', $attributes);

?>

<div id="<?php echo esc_attr($id) ?>" data-attributes="<?php echo esc_attr(wp_json_encode($bp3d_attributes)) ?>"
    class="wp-block-b3dviewer-modelviewer">
    <div class="bp3d_backup_view" style="display: none;height:350px;">
        <model-viewer camera-controls src="<?php echo esc_url($bp3d_attributes['model']['modelUrl'] ?? '') ?>"
            style="height: 350px;"></model-viewer>
    </div>
</div>