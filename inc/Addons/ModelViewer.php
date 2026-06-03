<?php



namespace BP3D\Addons;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 3D Model Viewer Elementor widget.
 *
 * Provides a full-featured Elementor widget for embedding 3D models
 * with controls for viewer type, rotation, shadows, animations,
 * dimensions, backgrounds, and more.
 */
class ModelViewer extends \Elementor\Widget_Base
{
    /**
     * Get widget name.
     */
    public function get_name(): string
    {
        return '3dModelViewer';
    }

    /**
     * Get widget title.
     */
    public function get_title(): string
    {
        return esc_html__('Model Viewer', '3d-viewer');
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
     * Get widget keywords.
     *
     * @return array<int, string>
     */
    public function get_keywords(): array
    {
        return ['3d embed', '3d viewer', 'model viewer'];
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
        return ['bp3d-frontend'];
    }

    /**
     * Register widget controls.
     */
    protected function register_controls(): void
    {
        $this->registerContentControls();
        $this->registerStyleControls();
    }

    /**
     * Register Content tab controls.
     */
    private function registerContentControls(): void
    {
        $this->start_controls_section('embedder', [
            'label' => esc_html__('Model Viewer', '3d-viewer'),
            'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
        ]);

        // Viewer type
        $this->add_control('currentViewer', [
            'label' => esc_html__('Viewer', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SELECT,
            'default' => 'modelViewer',
            'options' => [
                'modelViewer' => __('Lite', '3d-viewer'),
                'O3DViewer' => __('Advanced', '3d-viewer'),
            ],
        ]);

        // Single model controls
        $this->add_control('modelUrl', [
            'label' => esc_html__('Select Model', '3d-viewer'),
            'type' => 'b-select-file',
            'separator' => 'before',
            'placeholder' => esc_html__('Paste Model URL', '3d-viewer'),
        ]);

        $this->add_control('useDecoder', [
            'label' => esc_html__('Use Decoder', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SELECT,
            'default' => 'none',
            'options' => [
                'none' => esc_html__('None', '3d-viewer'),
                'draco' => esc_html__('Draco', '3d-viewer'),
            ],
            'condition' => ['currentViewer' => 'modelViewer'],
        ]);

        $this->add_control('bin_file', [
            'label' => esc_html__('Upload bin file', '3d-viewer'),
            'type' => 'b-select-file',
            'separator' => 'before',
            'placeholder' => esc_html__('Paste bin file URL', '3d-viewer'),
            'condition' => ['decoder' => 'draco', 'currentViewer' => 'modelViewer'],
        ]);

        $this->add_control('poster', [
            'label' => esc_html__('Select Poster', '3d-viewer'),
            'type' => 'b-select-file',
            'separator' => 'after',
            'placeholder' => esc_html__('Paste Poster URL', '3d-viewer'),
            'condition' => ['currentViewer' => 'modelViewer'],
        ]);

        // Divider
        $this->add_control('hr', [
            'type' => \Elementor\Controls_Manager::DIVIDER,
        ]);

        // Feature toggles
        $this->add_control('fullscreen', [
            'label' => esc_html__('Fullscreen Button', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default' => 'yes',
        ]);

        $this->add_control('mouseControls', [
            'label' => esc_html__('Mouse Control', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SWITCHER,
            'label_on' => esc_html__('Enable', '3d-viewer'),
            'label_off' => esc_html__('Disable', '3d-viewer'),
            'return_value' => 'yes',
            'default' => 'yes',
        ]);

        $this->add_control('lazy_load', [
            'label' => esc_html__('Lazy Load', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SWITCHER,
            'label_on' => esc_html__('Enable', '3d-viewer'),
            'label_off' => esc_html__('Disable', '3d-viewer'),
            'return_value' => 'yes',
            'default' => false,
            'condition' => ['currentViewer' => 'modelViewer'],
        ]);

        $this->add_control('progressBar', [
            'label' => esc_html__('Show Progress Bar', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default' => 'yes',
            'condition' => ['currentViewer' => 'modelViewer'],
        ]);

        $this->end_controls_section();
    }

    /**
     * Register Style tab controls.
     */
    private function registerStyleControls(): void
    {
        $this->start_controls_section('model', [
            'label' => esc_html__('Model', '3d-viewer'),
            'tab' => \Elementor\Controls_Manager::TAB_STYLE,
        ]);

        // Width
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
                '{{WRAPPER}} .b3dviewer .bp_model_parent' => 'width: {{SIZE}}{{UNIT}} !important;margin:0 auto;max-width:100%;',
            ],
        ]);

        // Height
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

        // Background color
        $this->add_control('backgroundColor', [
            'label' => esc_html__('Background Color', '3d-viewer'),
            'type' => \Elementor\Controls_Manager::COLOR,
            'selectors' => [
                '{{WRAPPER}} .b3dviewer model-viewer' => 'background: {{VALUE}}',
                '{{WRAPPER}} .b3dviewer .bp_model_parent' => 'background: {{VALUE}}',
            ],
        ]);


        $this->end_controls_section();
    }

    /**
     * Create a settings accessor closure.
     */
    public function bp3d_get_settings(): \Closure
    {
        $settings = $this->get_settings_for_display();

        return function ($key, $default = false, $is_boolean = false, $key2 = null) use ($settings) {
            if (isset($settings[$key], $settings[$key][$key2])) {
                return $is_boolean ? ($settings[$key][$key2] === 'yes') : $settings[$key][$key2];
            }

            if (isset($settings[$key])) {
                return $is_boolean ? ($settings[$key] === 'yes') : $settings[$key];
            }

            return $default;
        };
    }

    /**
     * Render the widget output.
     */
    protected function render(): void
    {
        $settings = $this->get_settings_for_display();
        $get_settings = $this->bp3d_get_settings();

        $finalData = [
            'align' => 'center',
            'uniqueId' => 'b3dviewer' . uniqid(),
            'O3DVSettings' => [
                'isFullscreen' => true,
                'camera' => null,
                'mouseControl' => true,
            ],
            'model' => [
                'modelUrl' => $settings['modelUrl'] ?? '',
                'poster' => $settings['poster'] ?? '',
                'useDecoder' => $settings['useDecoder'] ?? 'none',
            ],
            'currentViewer' => $settings['currentViewer'] ?? 'modelViewer',
            'lazyLoad' => ($settings['lazy_load'] ?? '') === 'yes',
            'zoom' => true,
            'preload' => 'auto',
            'mouseControl' => ($settings['mouseControls'] ?? '') === 'yes',
            'fullscreen' => ($settings['fullscreen'] ?? '') === 'yes',
            'loadingPercentage' => (bool) ($settings['loadingPercentage'] ?? false),
            'progressBar' => ($settings['progressBar'] ?? '') === 'yes',
            'styles' => [
                'width' => '100%',
                'height' => $get_settings('height', '500', false, 'size') . $get_settings('height', 'px', false, 'unit'),
                'bgColor' => $settings['backgroundColor'] ?? 'transparent',
                'bgImage' => $settings['backgroundImage']['url'] ?? '',
                'progressBarColor' => '#666',
            ],
        ];

        if ($finalData['currentViewer'] === 'O3DViewer') {
            wp_enqueue_script('bp3d-lib-o3dviewer');
        } else {
            wp_enqueue_script_module('bp3d-lib-model-viewer');
        }
        ?>

        <div class="modelViewerBlock elementor" data-attributes='<?php echo esc_attr(wp_json_encode($finalData)); ?>'></div>

        <?php
        if (is_admin()) {
            wp_enqueue_script('bp3d-lib-o3dviewer');
            wp_enqueue_script_module('bp3d-lib-model-viewer');
        }
    }
}
