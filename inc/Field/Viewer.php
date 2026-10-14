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
    add_filter('csf_' . $this->prefix . '_save', [$this, 'preserveProData'], 10, 3);
    add_filter('csf_' . $this->prefix . '_save', [$this, 'syncPremiumSource'], 20, 3);
    add_action('load-post.php', [$this, 'showAsRendered']);
    add_filter('bfields_update_in_place_values', [$this, 'linkInPlaceValues'], 10, 3);
  }

  /** The edit screen shows an existing row as the front end renders it, so a plain re-save changes nothing. */
  public function showAsRendered(): void
  {
    $screen = get_current_screen();
    // Edit screen render only: saves read the stored row.
    if (!$screen || 'bp3d-model-viewer' !== $screen->post_type || 'GET' !== ($_SERVER['REQUEST_METHOD'] ?? '')) {
      return;
    }
    add_filter('get_post_metadata', [$this, 'renderedRow'], 10, 4);
  }

  public function renderedRow($value, $object_id, $meta_key, $single)
  {
    if ($this->prefix !== $meta_key || null !== $value) {
      return $value;
    }
    remove_filter('get_post_metadata', [$this, 'renderedRow'], 10);
    $row = get_post_meta((int) $object_id, $meta_key, true);
    add_filter('get_post_metadata', [$this, 'renderedRow'], 10, 4);

    if (!is_array($row) || empty($row)) {
      return $value;
    }
    $shown = $row;
    // A Pro link or Cycle row renders a model the media field doesn't hold; show that one instead.
    $link = self::linkSource($row);
    if ('' !== $link) {
      $shown['bp_3d_src'] = self::mediaFromUrl($link);
    }
    // Saved before these fields existed: the front end treats them as off / the custom image, not the field default.
    $shown += ['bp_3d_zoom_in_out_btn' => '', 'bp_3d_progressbar' => ''];
    if (!array_key_exists('bp_3d_environment_image_preset', $row) && !empty($row['bp_3d_environment_image'])) {
      $shown['bp_3d_environment_image_preset'] = 'custom';
    }

    return $shown === $row ? $value : [$shown];
  }

  /** Values Modern reloads after an in-place save. */
  public function linkInPlaceValues($values, $post_id = 0, $unique = '')
  {
    if ($this->prefix !== $unique || !is_array($values)) {
      return $values;
    }
    $link = self::linkSource((array) get_post_meta((int) $post_id, $this->prefix, true));
    if ('' !== $link) {
      $values['bp_3d_src'] = self::mediaFromUrl($link);
    }
    return $values;
  }

  /** The model the front end renders when the media field doesn't show it (a Pro link or Cycle row), else ''. */
  private static function linkSource(array $row): string
  {
    $shown = trim(\BP3D\Helper\Utils::viewerModelSrc(\BP3D\Helper\Utils::return_function($row)));
    $url = is_array($row['bp_3d_src'] ?? null) ? (string) ($row['bp_3d_src']['url'] ?? '') : '';
    return $shown === $url ? '' : $shown;
  }

  private static function mediaFromUrl(string $url): array
  {
    return ['url' => $url, 'id' => '', 'width' => '', 'height' => '', 'thumbnail' => '', 'alt' => '', 'title' => '', 'description' => ''];
  }

  /** Classic saves only the fields free declares; start from the stored row so Pro-only keys survive. */
  public function preserveProData($data, $post_id = 0, $instance = null)
  {
    $stored = get_post_meta((int) $post_id, $this->prefix, true);
    if (!is_array($data) || !is_array($stored) || empty($stored)) {
      return $data;
    }

    // Codestar hands over slashed $_POST data and update_post_meta() unslashes once; bfields passes it unslashed.
    $slashed = !($instance instanceof \BFields\Compat\Instance);

    return array_merge($slashed ? wp_slash($stored) : $stored, $data);
  }

  /** Pro keys are kept (Modern, preserveProData), so a premium row would otherwise resolve its old source. */
  public function syncPremiumSource($data, $post_id = 0, $instance = null)
  {
    // A partial payload without the source has not changed it.
    if (!is_array($data) || !array_key_exists('bp_3d_src', $data)) {
      return $data;
    }
    $stored = get_post_meta((int) $post_id, $this->prefix, true);
    if (!is_array($stored) || (!array_key_exists('bp_3d_src_type', $stored) && !array_key_exists('bp_3d_src_link', $stored) && !array_key_exists('bp_3d_model_type', $stored))) {
      return $data;
    }
    $new = is_array($data['bp_3d_src']) ? (string) ($data['bp_3d_src']['url'] ?? '') : '';
    $old = is_array($stored['bp_3d_src'] ?? null) ? (string) ($stored['bp_3d_src']['url'] ?? '') : '';
    // The editor showed this model in the media field (renderedRow); posting it back changes nothing.
    $link = self::linkSource($stored);
    if ('' !== $link && trim(wp_kses_post($new)) === trim(wp_kses_post($link))) {
      if (array_key_exists('bp_3d_src', $stored)) {
        $data['bp_3d_src'] = $stored['bp_3d_src'];
      } else {
        unset($data['bp_3d_src']);
      }
      return $data;
    }
    // The posted copy is kses'd; a row written outside the form (Import) may not be.
    if (trim(wp_kses_post($new)) === trim(wp_kses_post($old))) {
      return $data;
    }
    $data['bp_3d_src_type'] = 'upload';
    if (array_key_exists('bp_3d_src_link', $stored)) {
      $data['bp_3d_src_link'] = $new;
    }
    // Free has one model: a new pick ends Cycle mode so it renders. The Cycle list stays for Pro.
    if (\BP3D\Helper\Utils::firstCycleModel(\BP3D\Helper\Utils::return_function($stored))) {
      $data['bp_3d_model_type'] = 'msimple';
    }
    return $data;
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
    \BP3D\Helper\Registrar::createMetabox($this->prefix, array(
      'title' => __('3D Viewer Settings', '3d-viewer'),
      'post_type' => 'bp3d-model-viewer',
      'show_restore' => true,
      'theme' => 'light'
    ));

    $this->model();
    $this->settings();
    $this->style();
    $this->preview();
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

    $allowed_mimes = \BP3D\Helper\Utils::getAllowedMimeTypes();

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
      $supported = \BP3D\Helper\Utils::getSupportedMimeTypes();
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
        'type' => 'notice',
        'style' => 'danger',
        'content' => $notice_content,
      );
    } else {
      $fields[] = array(
        'type' => 'notice',
        'style' => 'info',
        'content' => \BP3D\Helper\Utils::enabledFormatsNote() ?: sprintf(
          /* translators: %s: URL to the settings page. */
          __('All supported 3D formats (GLB, GLTF, OBJ, STL, FBX, HDR, etc.) are enabled for upload by default. You can turn any of them off in the <a href="%s" target="_blank">3D Viewer Settings</a>.', '3d-viewer'),
          admin_url('edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings')
        ),
      );
    }

    $fields = array_merge($fields, array(
      array(
        'id' => 'currentViewer',
        'icon' => 'layers',
        'option_meta' => \BP3D\Base\AdminUi::viewerModes(),
        'layout' => 'mode-grid',
        'type' => 'button_set',
        'title' => __('Viewer', '3d-viewer'),
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
        'icon' => 'link',
        'type' => 'media',
        'library' => \BP3D\Helper\Utils::modelLibraryTypes(),
        'button_title' => __('Upload Source', '3d-viewer'),
        // Modern (bfields 1.1.1+): URL box + button like Pro; still stored as the media array.
        'url_input' => true,
        'title' => __('3D Source', '3d-viewer'),
        'subtitle' => __('Choose 3D Model', '3d-viewer'),
        'desc' => __("Specifies the URL of the 3D model file to be displayed in the viewer.", "3d-viewer"),
      ),
      // use decoder
      array(
        'id' => 'bp_3d_decoder',
        'icon' => 'box',
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
        'icon' => 'upload',
        'type' => 'media',
        'button_title' => __('Upload Decoder File', '3d-viewer'),
        'title' => __('Draco File', '3d-viewer'),
        'subtitle' => __('Upload Decoder File', '3d-viewer'),
        'desc' => __("Upload Decoder File to decode the 3D model.", "3d-viewer"),
        'dependency' => array('bp_3d_decoder|currentViewer', '==|==', 'draco|modelViewer'),
      ),
      array(
        'id' => 'bp_3d_poster',
        'icon' => 'image',
        'type' => 'media',
        'button_title' => __('Upload Poster', '3d-viewer'),
        'url_input' => true,
        'title' => __('3D Poster Image', '3d-viewer'),
        'subtitle' => __('Display a poster until loaded', '3d-viewer'),
        'desc' => __('Upload or Select 3d Poster Image.  if you don\'t want to use just leave it empty', '3d-viewer'),
        'dependency' => array('currentViewer', '==', 'modelViewer'),
      ),
      array(
        'id' => 'bp3d_group_lighting',
        'type' => 'field_group',
        'title' => __('Lighting & Environment', '3d-viewer'),
        'icon' => 'sun',
        'collapsed' => true,
        'fields' => array(
          array(
            'id' => 'bp_3d_environment_image_preset',
            'icon' => 'sun',
            'type' => 'select',
            'title' => __('Environment Image', '3d-viewer'),
            'subtitle' => __('Lighting and reflections', '3d-viewer'),
            'desc' => __('Sets an environment image to improve lighting and reflections on the model.', '3d-viewer'),
            'options' => array(
              'neutral' => __('Neutral', '3d-viewer'),
              'legacy' => __('Legacy', '3d-viewer'),
              'custom' => __('Custom', '3d-viewer'),
            ),
            'default' => 'neutral',
            'dependency' => array('currentViewer', '==', 'modelViewer'),
          ),
          array(
            'id' => 'bp_3d_environment_image',
            'icon' => 'image',
            'type' => 'upload',
            'button_title' => __('Upload', '3d-viewer'),
            'title' => __('Custom Environment Image', '3d-viewer'),
            'subtitle' => __('Your own image', '3d-viewer'),
            'desc' => __('Upload or paste the URL of the image to use for lighting and reflections.', '3d-viewer'),
            'dependency' => array('currentViewer|bp_3d_environment_image_preset', '==|==', 'modelViewer|custom'),
          ),
          array(
            'id' => 'bp_3d_skybox_image',
            'icon' => 'image',
            'type' => 'upload',
            'button_title' => __('Upload', '3d-viewer'),
            'title' => __('HDR Skybox Image', '3d-viewer'),
            'subtitle' => __('Background and environmental lighting', '3d-viewer'),
            'desc' => __('Sets a skybox image that appears as the background and provides environmental lighting for the model. Accepts .hdr as well as JPG and PNG.', '3d-viewer'),
            'dependency' => array('currentViewer', '==', 'modelViewer'),
          ),
          // Premium's Modern order: shadow, then exposure.
          ...(\BP3D\Helper\Registrar::modern($this->prefix) ? array_reverse($this->lighting_fields()) : array()),
        ),
      ),
    ));

    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'title' => __('Model', '3d-viewer'),
      'icon' => 'fas fa-cube',
      // Modern: one card per field, as the Add New design draws the Model tab.
      'layout' => 'cards',
      'fields' => $fields
    ));
  }

  /** Exposure and shadow: Modern shows them in Lighting & Environment, Classic keeps them on the Settings tab. */
  private function lighting_fields(): array
  {
    return array(
      array(
        'id' => '3d_exposure',
        'icon' => 'sun',
        'type' => 'slider',
        'min' => 0.1,
        'max' => 5,
        'step' => 0.1,
        'title' => __('Exposure', '3d-viewer'),
        'subtitle' => __('Brightness for Model', '3d-viewer'),
        'desc' => __("Adjusts the brightness of the model scene. Higher values make the model brighter.", "3d-viewer"),
        'default' => '1',
        'dependency' => array('currentViewer', '==', 'modelViewer', 'all')
      ),
      array(
        'id' => '3d_shadow_intensity',
        'icon' => 'cloud-drizzle',
        'type' => 'slider',
        'title' => __('Shadow Intensity', '3d-viewer'),
        'subtitle' => __('Shadow Intensity for Model', '3d-viewer'),
        'desc' => __("Controls how dark or light the model’s shadow appears. Higher values create darker, more visible shadows.", "3d-viewer"),
        'min' => 0,
        'max' => 1,
        'step' => 0.1,
        'default' => 1,
        'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
      ),
    );
  }

  public function settings()
  {
    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'title' => __('Settings', '3d-viewer'),
      'icon' => 'fa fa-cog',
      'fields' => array(
        array(
          'id' => 'bp_camera_control',
          'icon' => 'move',
          'type' => 'switcher',
          'title' => __('Moving Controls', '3d-viewer'),
          'desc' => __("Allows users to rotate, pan, and interact with the model using a mouse or touch input.", "3d-viewer"),
          'text_on' => 'Yes',
          'text_off' => 'No',
          'default' => true,

        ),

        array(
          'id' => 'bp_3d_zooming',
          'icon' => 'zoom-in',
          'type' => 'switcher',
          'title' => __('Enable Zoom', '3d-viewer'),
          'subtitle' => __('Enable or Disable Zooming Behaviour', '3d-viewer'),
          'desc' => __("Enables zooming in and out of the 3D model using mouse scroll or touch gestures.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'text_width' => 60,
          'default' => true,
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        ),

        array(
          'id' => 'bp_3d_fullscreen',
          'icon' => 'maximize',
          'type' => 'switcher',
          'title' => __('Full Screen Button', '3d-viewer'),
          'subtitle' => __('Show/Hide Full Screen Button', '3d-viewer'),
          'desc' => __("Show/Hide Full Screen Button in the 3D model viewer.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'default' => true,
        ),
        array(
          'id' => 'bp_3d_zoom_in_out_btn',
          'icon' => 'zoom-out',
          'type' => 'switcher',
          'title' => __('Zoom In/Out Button', '3d-viewer'),
          'subtitle' => __('Show/Hide Zoom In/Out Button', '3d-viewer'),
          'desc' => __("Show/Hide Zoom In/Out Button in the 3D model viewer.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'default' => true,
        ),

        array(
          'id' => 'bp_3d_camera_btn',
          'icon' => 'camera',
          'type' => 'switcher',
          'title' => __('Camera Button', '3d-viewer'),
          'subtitle' => __('Show/Hide Camera Button', '3d-viewer'),
          'desc' => __("Show/Hide Camera Button in the 3D model viewer.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'default' => false,
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        ),

        array(
          'id' => 'bp_3d_download_btn',
          'icon' => 'download',
          'type' => 'switcher',
          'title' => __('3D File Download Button', '3d-viewer'),
          'subtitle' => __('Show/Hide 3D File Download Button', '3d-viewer'),
          'desc' => __("Show/Hide 3D File Download Button in the 3D model viewer.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'default' => false,
        ),

        array(
          'id' => 'bp_3d_loading',
          'icon' => 'loader',
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
          'icon' => 'sliders',
          'type' => 'switcher',
          'title' => __('Progressbar', '3d-viewer'),
          'subtitle' => __('Show/Hide Progressbar', '3d-viewer'),
          'desc' => __("Displays a progress bar during model loading to indicate loading status.", "3d-viewer"),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'text_width' => 60,
          'default' => true,
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        ),
        ...(\BP3D\Helper\Registrar::modern($this->prefix) ? array() : $this->lighting_fields()),
        array(
          'id' => 'bp_3d_enable_ar',
          'icon' => 'phone',
          'type' => 'switcher',
          'title' => __('Enable AR', '3d-viewer'),
          'desc' => __("Enables AR (Augmented Reality) so visitors can view the 3D model in their real environment on supported devices.", "3d-viewer"),
          'text_on' => 'Yes',
          'text_off' => 'No',
          'default' => false,
          'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
        ),
        array(
          'id' => 'model_iso_src',
          'icon' => 'phone',
          'type' => 'upload',
          'title' => __('3D Source for iOS (Optional)', '3d-viewer'),
          'subtitle' => __('Upload Model Or Input Valid Model url', '3d-viewer'),
          'desc' => __("Specifies the iOS-specific model file (.usdz) used for viewing the 3D model in AR on Apple devices.", "3d-viewer"),
          'placeholder' => 'You Can Paste here Model url',
          'dependency' => ['bp_3d_enable_ar|currentViewer', '==|==', '1|modelViewer', 'all']
        ),
        array(
          'id' => 'ar_placement',
          'icon' => 'phone',
          'type' => 'button_set',
          'title' => __('AR Placement', '3d-viewer'),
          'desc' => __("Defines how the model is placed in AR. Choose 'floor' to place the model on the ground or 'wall' to attach it to a vertical surface.", "3d-viewer"),
          'options' => array(
            'floor' => 'Floor',
            'wall' => 'Wall',
          ),
          'default' => 'floor',
          'dependency' => ['bp_3d_enable_ar|currentViewer', '==|==', '1|modelViewer', 'all']
        ),
        array(
          'id' => 'ar_mode',
          'icon' => 'phone',
          'type' => 'button_set',
          'title' => __('AR Mode', '3d-viewer'),
          'desc' => __("Selects the AR viewing mode. 'Quick Look' is used for iOS devices, while other modes enable AR on supported Android devices.", "3d-viewer"),
          'options' => array(
            'webxr' => 'WebXR',
            'scene-viewer' => 'Scene Viewer',
            'quick-look' => 'Quick Look',
          ),
          'default' => 'webxr',
          'dependency' => ['bp_3d_enable_ar|currentViewer', '==|==', '1|modelViewer', 'all']
        ) // End fields
      )
    ));
  }

  public function style()
  {
    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'title' => __('Style', '3d-viewer'),
      'icon' => 'fas fa-paint-brush',
      'fields' => array(
        array(
          'id' => 'bp_3d_width',
          'icon' => 'move',
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
          'icon' => 'maximize-2',
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
          'icon' => 'grid',
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
          'icon' => 'palette',
          'type' => 'color',
          'title' => __('Background Color', '3d-viewer'),
          'subtitle' => __('Set Background Color For 3d Model.If You don\'t need just leave blank. Default : \'transparent color\'', '3d-viewer'),
          'desc' => __("Sets the background color of the 3D viewer. Use transparent or any valid CSS color value.", "3d-viewer"),
          'default' => 'transparent',
        ),
      )
    ));
  }

  public function preview()
  {
    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'title' => __('Preview', '3d-viewer'),
      'icon' => 'fas fa-eye',
      'fields' => array(
        array(
          'type' => 'callback',
          'function' => function () {
            echo '<div id="bp3d-model-preview-root"></div>';
          }
        )
      )
    ));
  }

}
