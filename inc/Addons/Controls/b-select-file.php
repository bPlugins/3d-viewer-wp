<?php



namespace BP3D\Addons\Controls;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 3D Viewer Pro ships a control in this same namespace. Both files are pulled
 * in with require_once against different paths, so PHP would hit a fatal
 * "cannot redeclare" if the two ever loaded in one request.
 */
if (class_exists(__NAMESPACE__ . '\BP3DSelectFile')) {
    return;
}

/**
 * File select Elementor control.
 *
 * A custom Elementor control that provides a media file selector
 * for uploading or selecting 3D model files and other assets.
 *
 * The stored value is a plain URL string, unchanged from the original
 * implementation, so widgets saved by earlier versions keep working.
 *
 * @since 1.0.0
 */
class BP3DSelectFile extends \Elementor\Base_Data_Control
{
    /**
     * Get the control type identifier.
     *
     * Namespaced on purpose. Elementor keys its control registry by type name
     * and the last plugin to register a name wins. Several bPlugins products
     * (panorama-lite, HTML5 Video Player, this plugin's own Pro build) all
     * shipped a control typed `b-select-file`, so whichever loaded last
     * silently replaced this one's template and JS view — leaving one of the
     * two plugins with a dead file picker.
     *
     * The type name is not part of saved widget data (Elementor stores
     * settings by control *name*), so renaming it does not touch existing
     * content.
     *
     * @return string Control type slug
     */
    public function get_type(): string
    {
        return 'bp3d-select-file';
    }

    /**
     * Enqueue control scripts and styles.
     *
     * Registers media upload dependencies and the
     * custom control JavaScript handler.
     */
    public function enqueue(): void
    {
        wp_enqueue_media();
        wp_enqueue_style('thickbox');
        wp_enqueue_script('media-upload');
        wp_enqueue_script('thickbox');

        // Handles are plugin-specific for the same reason as the type name:
        // sibling bPlugins products register `bplugins-elementor-controls`
        // pointing at THEIR controls.js, and wp_register_script is first-wins.
        wp_register_style('bp3d-elementor-controls', plugins_url('/css/controls.css', __FILE__), [], BP3D_VERSION);
        wp_enqueue_style('bp3d-elementor-controls');

        wp_register_script('bp3d-elementor-controls', plugins_url('/js/controls.js', __FILE__), ['jquery'], BP3D_VERSION, true);
        wp_enqueue_script('bp3d-elementor-controls');
    }

    /**
     * Get the default control settings.
     *
     * @return array<string, mixed>
     */
    protected function get_default_settings(): array
    {
        return [
            'label_block' => true,
        ];
    }

    /**
     * Render the control output template in the editor.
     *
     * The markup is static: the preview, the button label and the clear button
     * are driven by controls.js from the current value. Re-rendering the whole
     * control on every keystroke would move focus out of the URL field.
     */
    public function content_template(): void
    {
        $control_uid = $this->get_control_uid();
        ?>
        <div class="elementor-control-field bp3d-file-control">
            <label for="<?php echo esc_attr($control_uid); ?>" class="elementor-control-title">{{{ data.label }}}</label>
            <div class="elementor-control-input-wrapper">
                <div class="bp3d-file is-empty">
                    <div class="bp3d-file__preview">
                        <span class="bp3d-file__thumb" aria-hidden="true">
                            <i class="eicon-preview-medium"></i>
                        </span>
                        <span class="bp3d-file__meta">
                            <span class="bp3d-file__name"></span>
                            <span class="bp3d-file__host"></span>
                        </span>
                        <span class="bp3d-file__empty"><?php esc_html_e('No file selected', '3d-viewer'); ?></span>
                    </div>

                    <div class="bp3d-file__actions">
                        <button type="button" class="bp3d-file__choose" id="select-file-<?php echo esc_attr($control_uid); ?>">
                            <i class="eicon-upload" aria-hidden="true"></i>
                            <span
                                class="bp3d-file__choose-text"
                                data-choose="<?php esc_attr_e('Choose File', '3d-viewer'); ?>"
                                data-replace="<?php esc_attr_e('Replace', '3d-viewer'); ?>"
                            ><?php esc_html_e('Choose File', '3d-viewer'); ?></span>
                        </button>
                        <button
                            type="button"
                            class="bp3d-file__clear"
                            title="<?php esc_attr_e('Remove', '3d-viewer'); ?>"
                            aria-label="<?php esc_attr_e('Remove', '3d-viewer'); ?>"
                        >&times;</button>
                    </div>

                    <?php // Kept as a text field so a CDN or external URL can still be pasted directly. ?>
                    <input type="text" class="bp3d-file__url" id="<?php echo esc_attr($control_uid); ?>"
                        data-setting="{{ data.name }}" placeholder="{{ data.placeholder }}">
                </div>
            </div>
        </div>
        <# if ( data.description ) { #>
            <div class="elementor-control-field-description">{{{ data.description }}}</div>
        <# } #>
        <?php
    }
}
