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
        // Has its own one-time flag, so it runs whether or not the model migration is done.
        $this->migrateAllowedMimeTypes();

        if (version_compare((string) get_option('bp3d_imported', '0'), BP3D_IMPORT_VER, '>=')) {
            return;
        }

        if ($this->migrateModelData(100)) {
            update_option('bp3d_imported', BP3D_IMPORT_VER);
            delete_option('bp3d_import_offset');
        }
    }

    /**
     * Widen the upload whitelist left behind by the old GLB/GLTF-only default.
     *
     * Runs once. A stored list that is exactly the old default came from a
     * site that never touched the checkboxes, so it is replaced with the new
     * all-formats default; any other selection is a deliberate choice and is
     * left alone.
     */
    private function migrateAllowedMimeTypes(): void
    {
        if (get_option('bp3d_mime_defaults_widened')) {
            return;
        }

        update_option('bp3d_mime_defaults_widened', 1);

        $settings = get_option('_bp3d_settings_', []);

        if (!is_array($settings) || !isset($settings['allowed_mime_types']) || !is_array($settings['allowed_mime_types'])) {
            return;
        }

        $stored = $settings['allowed_mime_types'];
        sort($stored);
        $legacy = ['glb', 'gltf'];

        if ($stored !== $legacy) {
            return;
        }

        $settings['allowed_mime_types'] = \BP3D\Helper\Utils::getSupportedMimeTypes();
        update_option('_bp3d_settings_', $settings);
    }

    /**
     * Migrate legacy model source data to the new format.
     *
     * Copies old `model_src.url` references into each row's `model_link`
     * in the `_bp3dimages_` post meta for all model viewer posts. Processes
     * up to $limit posts per request (offset kept in the `bp3d_import_offset`
     * option) so large catalogs can't exhaust memory; the completion flag is
     * only set once every post is done. The transform is idempotent, so
     * concurrent requests running the same batch are harmless.
     *
     * @return bool True when no posts remain to migrate.
     */
    private function migrateModelData(int $limit): bool
    {
        $offset = (int) get_option('bp3d_import_offset', 0);

        $post_ids = get_posts([
            'post_type' => 'bp3d-model-viewer',
            'post_status' => 'any',
            'posts_per_page' => $limit,
            'offset' => $offset,
            'fields' => 'ids',
        ]);

        foreach ($post_ids as $post_id) {
            $viewers = get_post_meta($post_id, '_bp3dimages_', true);

            if (!is_array($viewers) || !isset($viewers['bp_3d_models']) || !is_array($viewers['bp_3d_models'])) {
                continue;
            }

            $models = $viewers['bp_3d_models'];

            // In place: only model_link changes; every other per-model key is kept.
            foreach ($models as $index => $item) {
                if (
                    is_array($item)
                    && isset($item['model_src']['url'])
                    && $item['model_src']['url'] !== ''
                ) {
                    $models[$index]['model_link'] = $item['model_src']['url'];
                }
            }

            if ($models !== $viewers['bp_3d_models']) {
                $viewers['bp_3d_models'] = $models;
                update_post_meta($post_id, '_bp3dimages_', $viewers);
            }
        }

        update_option('bp3d_import_offset', $offset + count($post_ids), false);

        return count($post_ids) < $limit;
    }
}