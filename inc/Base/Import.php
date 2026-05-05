<?php



namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Data importer.
 *
 * Handles one-time migration of legacy model data structures
 * to the current format on plugin initialization.
 */
class Import
{
    /**
     * Register the import action.
     */
    public function register(): void
    {
        add_action('init', [$this, 'init']);
    }

    /**
     * Check import version and trigger migration if needed.
     */
    public function init()
    {
        $imported = get_option('bp3d_imported', 0);

        if ($imported < BP3D_IMPORT_VER) {
            $this->migrateModelData();
            update_option('bp3d_imported', BP3D_IMPORT_VER);
        }
    }

    /**
     * Migrate legacy model source data to the new format.
     *
     * Converts old `model_src.url` references to flat `model_link` values
     * in the `_bp3dimages_` post meta for all model viewer posts.
     */
    private function migrateModelData(): void
    {
        $query = new \WP_Query([
            'post_type' => 'bp3d-model-viewer',
            'posts_per_page' => 500,
        ]);

        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();

            $viewers = get_post_meta($post_id, '_bp3dimages_', true);

            if (!is_array($viewers)) {
                $viewers = [];
            }

            $models = $viewers['bp_3d_models'] ?? [];
            $viewers['bp_3d_models'] = [];

            if (!is_array($models)) {
                continue;
            }

            foreach ($models as $item) {
                if (
                    is_array($item)
                    && isset($item['model_src']['url'])
                    && $item['model_src']['url'] !== ''
                ) {
                    $viewers['bp_3d_models'][]['model_link'] = $item['model_src']['url'];
                } else {
                    $viewers['bp_3d_models'][]['model_link'] = $item['model_link'] ?? '';
                }
            }

            update_post_meta($post_id, '_bp3dimages_', $viewers);
        }

        wp_reset_postdata();
    }
}