<?php



namespace BP3D\Field;

if (!defined('ABSPATH')) {
  exit;
}

/**
 * Model Viewer metabox fields (Free version).
 *
 * Defines CSF metabox fields for the `bp3d-model-viewer` post type,
 * including model source, general settings, and styling options.
 */
class Viewer
{
  protected string $prefix = '_bp3dimages_';

  /**
   * Register init hook.
   */
  public function register(): void
  {
    add_action('init', [$this, 'init'], 0);
  }

  /**
   * Initialize metabox creation.
   */
  public function init(): void
  {
    $this->create_metabox();
  }

  public function create_metabox()
  {
    \CSF::createMetabox($this->prefix, array(
      'title' => __('3D Viewer Settings', '3d-viewer'),
      'post_type' => 'bp3d-model-viewer',
      'show_restore' => true,
      'theme' => 'light'
    ));

    $this->model();
    $this->settings();
    $this->style();
  }

  public function model()
  {
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading post ID to render the metabox, no form data is processed.
    $post_id = isset($_GET['post']) ? absint(wp_unslash($_GET['post'])) : get_the_ID();
    $meta = get_post_meta($post_id, '_bp3dimages_', true);

    $model_url = '';
    if (isset($meta['bp_3d_src'])) {
        $model_url = is_array($meta['bp_3d_src']) ? ($meta['bp_3d_src']['url'] ?? '') : $meta['bp_3d_src'];
    }

    $settings = get_option('_bp3d_settings_', []);
    $allowed_mimes = isset($settings['allowed_mime_types']) ? $settings['allowed_mime_types'] : [];
    if (!is_array($allowed_mimes)) {
        $allowed_mimes = [];
    }

    $fields = array();

    $show_notice = false;
    $notice_content = '';

    if (empty($allowed_mimes)) {
        $show_notice = true;
        $notice_content = sprintf(
            /* translators: %s: URL to the settings page. */
            __('<strong>Notice:</strong> All 3D file formats are currently disabled for upload. Please enable the formats you need in the <a href="%s" target="_blank">3D Viewer Settings</a>.', '3d-viewer'),
            admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
        );
    } elseif (!empty($model_url)) {
        $ext = strtolower(pathinfo($model_url, PATHINFO_EXTENSION));
        $supported = ['glb', 'gltf', 'obj', '3ds', 'step', 'stl', 'fbx', '3dml', 'dae', 'wrl', '3mf', 'mtl', 'hdr', 'usdz'];
        if (in_array($ext, $supported, true) && !in_array($ext, $allowed_mimes, true)) {
            $show_notice = true;
            $notice_content = sprintf(
                /* translators: 1: 3D file extension, 2: URL to the settings page. */
                __('<strong>Warning:</strong> The uploaded 3D model format (.%1$s) is currently disabled. Please enable it in the <a href="%2$s" target="_blank">3D Viewer Settings</a> to ensure it loads properly.', '3d-viewer'),
                strtoupper($ext),
                admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
            );
        }
    }

    if ($show_notice) {
        $fields[] = array(
            'type'    => 'notice',
            'style'   => 'danger',
            'content' => $notice_content,
        );
    } else {
        $fields[] = array(
            'type'    => 'notice',
            'style'   => 'info',
            'content' => sprintf(
                /* translators: %s: URL to the settings page. */
                __('Allowed 3D file formats are managed in the <a href="%s" target="_blank">3D Viewer Settings</a>.', '3d-viewer'),
                admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
            ),
        );
    }

    $fields = array_merge($fields, array(
        array(
          'id' => 'currentViewer',
          'type' => 'button_set',
          'title' => __('Viewer.', '3d-viewer'),
          'subtitle' => __('Choose Viewer', '3d-viewer'),
          'desc' => __("Choose between Lite and Advanced viewer modes. Lite is optimized for GLB and GLTF files with strong performance and essential features. Advanced supports almost all 3D file types but offers a more streamlined feature set.", "3d-viewer"),
          'multiple' => false,
          'options' => array(
            'modelViewer' => 'Lite',
            'O3DViewer' => 'Advanced',
          ),
          'default' => 'modelViewer'
        ),
        array(
          'id' => 'bp_3d_src',
          'type' => 'media',
          'button_title' => __('Upload Source', '3d-viewer'),
          'title' => __('3D Source', '3d-viewer'),
          'subtitle' => __('Choose 3D Model', '3d-viewer'),
          'desc' => __("Specifies the URL of the 3D model file to be displayed in the viewer.", "3d-viewer"),
        ),
        // use decoder
        array(
          'id' => 'bp_3d_decoder',
          'type' => 'select',
          'title' => __('Decoder', '3d-viewer'),
          'subtitle' => __('Choose Decoder', '3d-viewer'),
          'desc' => __("Choose Decoder to decode the 3D model.", "3d-viewer"),
          'options' => array(
            'none' => __('None', '3d-viewer'),
            'draco' => __('Draco', '3d-viewer'),
          ),
          'default' => 'none',
          'dependency' => array('currentViewer', '==', 'modelViewer'),
        ),
        // upload field if decoder is draco
        array(
          'id' => 'bp_3d_decoder_draco_file',
          'type' => 'media',
          'button_title' => __('Upload Decoder File', '3d-viewer'),
          'title' => __('Draco File', '3d-viewer'),
          'subtitle' => __('Upload Decoder File', '3d-viewer'),
          'desc' => __("Upload Decoder File to decode the 3D model.", "3d-viewer"),
          'dependency' => array('bp_3d_decoder|currentViewer', '==|==', 'draco|modelViewer'),
        ),
        array(
          'id' => 'bp_3d_poster',
          'type' => 'media',
          'button_title' => __('Upload Poster', '3d-viewer'),
          'title' => __('3D Poster Image', '3d-viewer'),
          'subtitle' => __('Display a poster until loaded', '3d-viewer'),
          'desc' => __('Upload or Select 3d Poster Image.  if you don\'t want to use just leave it empty', '3d-viewer'),
          'dependency' => array('currentViewer', '==', 'modelViewer'),
        ),
      ));

    \CSF::createSection($this->prefix, array(
      'title' => __('Model', '3d-viewer'),
      'fields' => $fields
    ));
  }

  public function settings()
  {
    \CSF::createSection($this->prefix, array(
      'title' => __('Settings', '3d-viewer'),
      'fields' => array(
        array(
          'id' => 'bp_camera_control',
          'type' => 'switcher',
          'title' => __('Moving Controls', '3d-viewer'),
          'desc' => __("Allows users to rotate, pan, and interact with the model using a mouse or touch input.", "3d-viewer"),
          'text_on' => 'Yes',
          'text_off' => 'No',
          'default' => true,

        ),
        array(
          'id' => 'bp_3d_zooming',
          'type' => 'switcher',
          'title' => __('Enable Zoom', '3d-viewer'),
          'subtitle' => __('Enable or Disable Zooming Behaviour', '3d-viewer'),
          'desc' => __("Enables zooming in and out of the 3D model using mouse scroll or touch gestures.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('NO', '3d-viewer'),
          'text_width' => 60,
          'default' => true,
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        ),
        array(
          'id' => 'bp_3d_fullscreen',
          'type' => 'switcher',
          'title' => __('Full Screen Button', '3d-viewer'),
          'subtitle' => __('Show/Hide Full Screen Button', '3d-viewer'),
          'desc' => __("Show/Hide Full Screen Button in the 3D model viewer.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('NO', '3d-viewer'),
          'default' => true,
        ),
        array(
          'id' => 'bp_3d_zoom_in_out_btn',
          'type' => 'switcher',
          'title' => __('Zoom In/Out Button', '3d-viewer'),
          'subtitle' => __('Show/Hide Zoom In/Out Button', '3d-viewer'),
          'desc' => __("Show/Hide Zoom In/Out Button in the 3D model viewer.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('NO', '3d-viewer'),
          'default' => true,
        ),
        array(
          'id' => 'bp_3d_camera_btn',
          'type' => 'switcher',
          'title' => __('Camera Button', '3d-viewer'),
          'subtitle' => __('Show/Hide Camera Button', '3d-viewer'),
          'desc' => __("Show/Hide Camera Button in the 3D model viewer.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('NO', '3d-viewer'),
          'default' => false,
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        ),

        array(
          'id' => 'bp_3d_loading',
          'type' => 'radio',
          'title' => __('Loading Type', '3d-viewer'),
          'subtitle' => __('Choose Loading type, default:  \'Auto\' ', '3d-viewer'),
          'options' => array(
            'auto' => __('Auto', '3d-viewer'),
            'lazy' => __('Lazy', '3d-viewer'),
            'eager' => __('Eager', '3d-viewer'),
          ),
          'default' => 'auto',
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        ),

        array(
          'id' => 'bp_3d_progressbar',
          'type' => 'switcher',
          'title' => __('Progressbar', '3d-viewer'),
          'subtitle' => __('Show/Hide Progressbar', '3d-viewer'),
          'desc' => __("Displays a progress bar during model loading to indicate loading status.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('NO', '3d-viewer'),
          'text_width' => 60,
          'default' => true,
          // 'class'    => 'bp3d-readonly',
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        )
      )
    ));
  }

  public function style()
  {
    \CSF::createSection($this->prefix, array(
      'title' => __('Style', '3d-viewer'),
      'fields' => array(
        array(
          'id' => 'bp_3d_width',
          'type' => 'dimensions',
          'title' => __('Width', '3d-viewer'),
          'desc' => __("Sets the width of the 3D viewer. You can use values like %, px, or vw for responsive layouts.", "3d-viewer"),
          'default' => array(
            'width' => 100,
            'unit' => '%',
          ),
          'height' => false,
        ),
        array(
          'id' => 'bp_3d_height',
          'type' => 'dimensions',
          'title' => __('Height', '3d-viewer'),
          'desc' => __("Sets the height of the 3D viewer. Adjust this to control how much vertical space the model occupies.", "3d-viewer"),
          'units' => ['px', 'em', 'pt'],
          'default' => array(
            'height' => 320,
            'unit' => 'px',
          ),
          'width' => false,
        ),

        array(
          'id' => 'bp_3d_align',
          'title' => __("Align", "3d-viewer"),
          'desc' => __("Controls the alignment of the 3D viewer within its container, such as left, center, or right.", "3d-viewer"),
          'type' => 'button_set',
          'options' => [
            'start' => 'Left',
            'center' => 'Center',
            'end' => 'Right'
          ],
          'default' => 'center',
        ),
        array(
          'id' => 'bp_model_bg',
          'type' => 'color',
          'title' => __('Background Color', '3d-viewer'),
          'subtitle' => __('Set Background Color For 3d Model.If You don\'t need just leave blank. Default : \'transparent color\'', '3d-viewer'),
          'desc' => __("Sets the background color of the 3D viewer. Use transparent or any valid CSS color value.", "3d-viewer"),
          'default' => 'transparent',
          // 'class' => 'bp3d-readonly',
        ),
      )
    ));
  }

}
