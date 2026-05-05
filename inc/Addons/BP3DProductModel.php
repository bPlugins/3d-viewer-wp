<?php



namespace BP3D\Addons;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce Product Model Elementor widget.
 *
 * Displays 3D product models within Elementor pages,
 * with controls for width and height styling.
 */
class BP3DProductModel extends \Elementor\Widget_Base
{
    /**
     * Get widget name.
     */
    public function get_name(): string
    {
        return 'BP3DProductModel';
    }

    /**
     * Get widget title.
     */
    public function get_title(): string
    {
        return esc_html__('Product Model', '3d-viewer');
    }

    /**
     * Get widget icon.
     */
    public function get_icon(): string
    {
        return 'eicon-preview-medium';
    }

    /**
     * Get widget categories.
     *
     * @return array<int, string>
     */
    public function get_categories(): array
    {
        return ['general'];
    }

    /**
     * Get widget keywords for search.
     *
     * @return array<int, string>
     */
    public function get_keywords(): array
    {
        return ['3d embed', '3d viewer', 'model viewer', 'product model'];
    }

    /**
     * Get widget script dependencies.
     *
     * @return array<int, string>
     */
    public function get_script_depends(): array
    {
        return ['bp3d-public'];
    }

    /**
     * Get widget style dependencies.
     *
     * @return array<int, string>
     */
    public function get_style_depends(): array
    {
        return [];
    }

    /**
     * Register widget controls.
     */
    protected function register_controls(): void
    {
        // Content Tab
        $this->start_controls_section('embedder', [
            'label' => esc_html__('Model Viewer', '3d-viewer'),
            'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
        ]);
        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section('model', [
            'label' => esc_html__('Model', '3d-viewer'),
            'tab' => \Elementor\Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control('width', [
            'label' => esc_html__('Width', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SLIDER,
            'size_units' => ['px', '%', 'vw'],
            'range' => [
                'px' => ['min' => 0, 'max' => 1000, 'step' => 5],
                '%' => ['min' => 20, 'max' => 100],
                'vw' => ['min' => 5, 'max' => 100],
            ],
            'default' => ['unit' => '%', 'size' => 100],
            'selectors' => [
                '{{WRAPPER}} .b3dviewer model-viewer' => 'width: {{SIZE}}{{UNIT}};margin:0 auto;max-width:100%;',
            ],
        ]);

        $this->add_control('height', [
            'label' => esc_html__('Height', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SLIDER,
            'size_units' => ['px', 'vh'],
            'range' => [
                'px' => ['min' => 200, 'max' => 1000, 'step' => 5],
                'vh' => ['min' => 5, 'max' => 100],
            ],
            'default' => ['unit' => 'px', 'size' => 500],
            'selectors' => [
                '{{WRAPPER}} .b3dviewer model-viewer' => 'height: {{SIZE}}{{UNIT}};',
                '{{WRAPPER}} .b3dviewer model-viewer #lazy-load-poster img' => 'height: {{SIZE}}{{UNIT}};',
            ],
        ]);

        $this->end_controls_section();
    }

    /**
     * Render the widget output.
     */
    protected function render(): void
    {
        echo do_shortcode('[3d_viewer_product]');
    }
}
