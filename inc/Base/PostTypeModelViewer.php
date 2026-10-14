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
        add_action('add_meta_boxes_' . $this->post_type, [$this, 'addLivePreviewMetaBox']);
        add_filter('post_row_actions', [$this, 'removeRowActions'], 10, 2);
        add_action('admin_init', [$this, 'setMetaData']);
        add_action('use_block_editor_for_post', [$this, 'useBlockEditorForPost'], 999, 2);
        add_filter('filter_block_editor_meta_boxes', [$this, 'removeMetabox']);
        add_filter('admin_body_class', [$this, 'addListBodyClass']);
    }

    /** The viewer list screen in the Modern interface; Classic keeps WordPress's table. */
    public static function isModernList(): bool
    {
        // Quick Edit re-renders the row over AJAX, where there is no current screen.
        if (wp_doing_ajax()) {
            // phpcs:ignore WordPress.Security.NonceVerification.Missing -- read-only check; core verifies the nonce.
            return isset($_POST['action'], $_POST['screen']) && 'inline-save' === $_POST['action'] && 'edit-bp3d-model-viewer' === $_POST['screen']
                && AdminUi::MODERN === AdminUi::mode('viewer');
        }

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        return $screen && 'edit' === $screen->base && 'bp3d-model-viewer' === $screen->post_type
            && AdminUi::MODERN === AdminUi::mode('viewer');
    }

    /** Spaces on both sides: other plugins append without one. */
    public function addListBodyClass($classes)
    {
        return self::isModernList() ? $classes . ' bp3d-list-modern ' : $classes;
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
        // Keep core's translated Date label.
        $date = $defaults['date'] ?? __('Date', '3d-viewer');
        unset($defaults['date']);
        $defaults['shortcode'] = __('Shortcode', '3d-viewer');
        $defaults['date'] = $date;

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

        $shortcode = '[3d_viewer id="' . (int) $post_id . '"]';

        // Same chip as the Modern editor's title row; src/admin/list copies it.
        if (self::isModernList()) {
            printf(
                '<button type="button" class="bp3d-list-shortcode" data-clipboard-text="%1$s" aria-label="%2$s" title="%3$s"><code>%4$s</code><span class="bp3d-list-shortcode__icon" aria-hidden="true">'
                . '<svg class="bp3d-list-shortcode__copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
                . '<svg class="bp3d-list-shortcode__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
                . '</span></button>',
                esc_attr($shortcode),
                /* translators: %s: the viewer's shortcode. */
                esc_attr(sprintf(__('Copy shortcode: %s', '3d-viewer'), $shortcode)),
                esc_attr__('Copy To Clipboard', '3d-viewer'),
                esc_html($shortcode)
            );
            return;
        }

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
     * Remove the "View" row action; the post type has no front-end page.
     *
     * @return array<string, string>
     */
    public function removeRowActions($actions)
    {
        global $post;

        if ($post->post_type === $this->post_type) {
            unset($actions['view']);
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

        // Modern's page frame shows its own shortcode chip.
        if (AdminUi::MODERN === AdminUi::mode('viewer')) {
            return;
        }

        global $post;
        $shortcode = '[3d_viewer id="' . (int) $post->ID . '"]';
        ?>
        <div class="bp3d_shortcode_area_after_title">
            <label><?php esc_html_e('Copy and paste this shortcode into your posts, pages and widget', '3d-viewer'); ?></label>
            <div class="shortcode_area">
                <button type="button" class="button button-bplugins button-large bp3d_shortcode_copy_btn"
                    data-clipboard-text="<?php echo esc_attr($shortcode); ?>">
                    <?php echo esc_html($shortcode); ?>
                </button>
                <svg class="bp3d_shortcode_copy_icon"
                    data-clipboard-text="<?php echo esc_attr($shortcode); ?>" width="22px"
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

    /**
     * Register the "Live Preview" meta box in the sidebar.
     *
     * Uses the `default` priority so it renders directly beneath the core
     * `submitdiv` (Publish/Save) meta box. Its body provides the mount point
     * (#bp3d-preview-btn-root) for the React "Live Preview" trigger button.
     */
    public function addLivePreviewMetaBox(): void
    {
        // Modern draws the editor as one page, with Live Preview in its own side card.
        if (AdminUi::MODERN === AdminUi::mode('viewer')) {
            return;
        }

        add_meta_box(
            'bp3d_live_preview',
            __('Live Preview', '3d-viewer'),
            [$this, 'renderLivePreviewMetaBox'],
            $this->post_type,
            'side',
            'default'
        );
    }

    /**
     * Render the Live Preview meta box body.
     */
    public function renderLivePreviewMetaBox(): void
    {
        echo '<div id="bp3d-preview-btn-root"></div>';
    }


}
