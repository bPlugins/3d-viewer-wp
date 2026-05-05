<?php



namespace BP3D\Addons\Controls;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * File select Elementor control.
 *
 * A custom Elementor control that provides a media file selector
 * for uploading or selecting 3D model files and other assets.
 *
 * @since 1.0.0
 */
class SelectFile extends \Elementor\Base_Data_Control
{
    /**
     * Get the control type identifier.
     *
     * @return string Control type slug
     */
    public function get_type(): string
    {
        return 'b-select-file';
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

        wp_register_script(
            'bplugins-elementor-controls',
            plugins_url('/js/controls.js', __FILE__),
        ['jquery'],
            '1.0.0',
            true
        );

        wp_enqueue_script('bplugins-elementor-controls');
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
     */
    public function content_template(): void
    {
        $control_uid = $this->get_control_uid();
?>
        <div class="elementor-control-field">
            <label for="<?php echo esc_attr($control_uid); ?>" class="elementor-control-title">{{{ data.label }}}</label>
            <div class="elementor-control-input-wrapper">
                <a href="#" class="tnc-b-select-file text-center w-100 elementor-button elementor-button-default elementor-button-go-pro" id="select-file-<?php echo esc_attr($control_uid); ?>">
                    <?php echo esc_html('{{data.label}}'); ?>
                </a>
                <br />
                <input type="text" class="tnc-b-selected-fle-url" id="<?php echo esc_attr($control_uid); ?>" data-setting="{{ data.name }}" placeholder="{{ data.placeholder }}">
            </div>
        </div>
        <# if ( data.description ) { #>
        <div class="elementor-control-field-description">{{{ data.description }}}</div>
        <# } #>
        <?php
    }
}