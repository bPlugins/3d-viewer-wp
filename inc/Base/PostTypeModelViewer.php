<?php



namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Model Viewer custom post type.
 *
 * Registers the `bp3d-model-viewer` post type and handles all
 * admin-related functionality including columns, duplicating,
 * shortcode display, and Gutenberg editor control.
 */
class PostTypeModelViewer
{
    protected string $post_type = 'bp3d-model-viewer';
    protected string $import_ver = '1.0.0';

    /**
     * Register all hooks for the post type.
     */
    public function register(): void
    {
        add_action('init', [$this, 'registerPostType'], 0);

        if (!is_admin()) {
            return;
        }

        add_action('manage_' . $this->post_type . '_posts_custom_column', [$this, 'renderShortcodeColumn'], 10, 2);
        add_filter('manage_' . $this->post_type . '_posts_columns', [$this, 'addShortcodeColumn']);
        add_filter('post_updated_messages', [$this, 'customizeUpdateMessage']);
        add_action('admin_head-post.php', [$this, 'hidePublishingActions']);
        add_action('admin_head-post-new.php', [$this, 'hidePublishingActions']);
        add_action('edit_form_after_title', [$this, 'renderShortcodeArea']);
        add_filter('post_row_actions', [$this, 'removeRowActions'], 10, 2);
        add_action('admin_init', [$this, 'setMetaData']);
        add_action('use_block_editor_for_post', [$this, 'useBlockEditorForPost'], 999, 2);
        add_filter('filter_block_editor_meta_boxes', [$this, 'removeMetabox']);
    }

    /**
     * Set isGutenberg meta for legacy posts missing it.
     */
    public function setMetaData(): void
    {
        $legacy_ver = get_option('model_viewer_import_ver');
        $import_ver = get_option('bp3d_model_viewer_import_ver', $legacy_ver ? $legacy_ver : '0');

        if ($import_ver >= $this->import_ver) {
            return;
        }

        $query = new \WP_Query([
            'post_type' => $this->post_type,
            'post_status' => 'any',
            'posts_per_page' => 500,
        ]);

        while ($query->have_posts()) {
            $query->the_post();
            $id = get_the_ID();

            $is_gutenberg_meta = get_post_meta($id, '_bp3d_is_gutenberg', true);
            if ($is_gutenberg_meta === '') {
                $legacy_meta = get_post_meta($id, 'isGutenberg', true);
                if ($legacy_meta !== '') {
                    update_post_meta($id, '_bp3d_is_gutenberg', $legacy_meta);
                } else {
                    update_post_meta($id, '_bp3d_is_gutenberg', '0');
                }
            }
        }

        wp_reset_postdata();
        update_option('bp3d_model_viewer_import_ver', $this->import_ver);
        if ($legacy_ver) {
            delete_option('model_viewer_import_ver');
        }
    }

    /**
     * Control whether to use the block editor for this post type.
     */
    public function useBlockEditorForPost($use, $post)
    {
        if ($this->post_type !== $post->post_type) {
            return $use;
        }

        $option = get_option('_bp3d_settings_', []);
        $gutenberg_enabled = $option['gutenberg_enabled'] ?? false;
        
        $is_gutenberg_meta = get_post_meta($post->ID, '_bp3d_is_gutenberg', true);
        if ($is_gutenberg_meta === '') {
            $is_gutenberg_meta = get_post_meta($post->ID, 'isGutenberg', true);
        }
        $is_gutenberg = (bool) $is_gutenberg_meta;

        if ($gutenberg_enabled && $post->post_status === 'auto-draft') {
            update_post_meta($post->ID, '_bp3d_is_gutenberg', '1');
            return true;
        }

        if ($is_gutenberg) {
            return true;
        }

        remove_post_type_support($this->post_type, 'editor');
        return false;
    }

    /**
     * Customize the "post updated" message.
     *
     * @return array<string, array<int, string>>
     */
    public function customizeUpdateMessage($messages)
    {
        $messages[$this->post_type][1] = __('Model Updated', '3d-viewer');
        return $messages;
    }

    /**
     * Add the shortcode column to the post list table.
     *
     * @return array<string, string>
     */
    public function addShortcodeColumn($defaults)
    {
        unset($defaults['date']);
        $defaults['shortcode'] = 'ShortCode';
        $defaults['date'] = 'Date';

        return $defaults;
    }

    /**
     * Render the shortcode column content.
     */
    public function renderShortcodeColumn($column_name, $post_id)
    {
        if ($column_name !== 'shortcode') {
            return;
        }

        $shortcode = '[3d_viewer id=' . esc_attr((string) $post_id) . ']';
        echo "<div class='b3dviewer_front_shortcode'>"
            . "<input value='" . esc_attr($shortcode) . "' >"
            . "<span class='htooltip'>" . esc_html__('Copy To Clipboard', '3d-viewer') . "</span>"
            . "<svg class='bp3d_shortcode_copy_icon' data-clipboard-text='" . esc_attr($shortcode) . "' width='22px' height='22px' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>"
            . "<path d='M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z' stroke='#000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>"
            . "<path d='M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8' stroke='#000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>"
            . "</svg></div>";
    }

    /**
     * Register the Model Viewer custom post type.
     */
    public function registerPostType(): void
    {
        register_post_type($this->post_type, [
            'labels' => [
                'name' => __('3D Viewer', '3d-viewer'),
                'menu_name' => __('3D Viewer', '3d-viewer'),
                'name_admin_bar' => __('3D Viewer', '3d-viewer'),
                'add_new' => __('Add New', '3d-viewer'),
                'add_new_item' => __(' Add New', '3d-viewer'),
                'new_item' => __('New 3D Viewer', '3d-viewer'),
                'edit_item' => __('Edit 3D Viewer', '3d-viewer'),
                'search_items' => __('Search Viewers', '3d-viewer'),
                'view_item' => __('View 3D Viewer', '3d-viewer'),
                'all_items' => __('All 3D Viewers', '3d-viewer'),
                'not_found' => __("Sorry, we couldn't find the Feed you are looking for.", '3d-viewer'),
            ],
            'description' => __('3D Viewer Options.', '3d-viewer'),
            'public' => false,
            'show_ui' => true,
            'menu_icon' => BP3D_DIR . 'admin/images/logo.svg',
            'query_var' => true,
            'capability_type' => 'post',
            'has_archive' => false,
            'hierarchical' => false,
            'menu_position' => 15,
            'supports' => ['title', 'editor'],
            'show_in_rest' => true,
            'template' => [['b3dviewer/modelviewer']],
            'template_lock' => 'all',
        ]);
    }

    /**
     * Hide misc/minor publishing actions via CSS.
     */
    public function hidePublishingActions(): void
    {
        global $post;

        if ($post->post_type !== $this->post_type) {
            return;
        }

        echo '<style type="text/css">
            #misc-publishing-actions,
            #minor-publishing-actions {
                display: none;
            }
        </style>';
    }



    /**
     * Remove "View" and "Quick Edit" row actions for this post type.
     *
     * @return array<string, string>
     */
    public function removeRowActions($actions)
    {
        global $post;

        if ($post->post_type === $this->post_type) {
            unset($actions['view'], $actions['inline hide-if-no-js']);
        }

        return $actions;
    }

    /**
     * Remove meta boxes from the block editor view.
     *
     * @param  mixed $metaboxes
     * @return mixed
     */
    public function removeMetabox($metaboxes)
    {
        $screen = get_current_screen();

        if ($screen && $screen->post_type === $this->post_type) {
            return [];
        }

        return $metaboxes;
    }

    /**
     * Render shortcode display area after the post title.
     */
    public function renderShortcodeArea()
    {
        if ($this->post_type !== get_post_type()) {
            return;
        }

        global $post;
        $shortcode = "[3d_viewer id='" . esc_attr((string) $post->ID) . "']";
        ?>
        <div class="bp3d_shortcode_area_after_title">
            <label><?php esc_html_e('Copy and paste this shortcode into your posts, pages and widget', '3d-viewer'); ?></label>
            <div class="shortcode_area">
                <button class="button button-bplugins button-large bp3d_shortcode_copy_btn"
                    data-clipboard-text="<?php echo esc_attr($shortcode); ?>">
                    <?php echo esc_html($shortcode); ?>
                </button>
                <svg class="bp3d_shortcode_copy_icon"
                    data-clipboard-text='[3d_viewer id="<?php echo esc_attr((string) $post->ID); ?>"]' width="22px"
                    height="22px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z"
                        stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8"
                        stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </div>
        </div>
        <?php
    }


}
