<?php



namespace BP3D\Field;

if (!defined('ABSPATH')) {
  exit;
}

/**
 * Plugin settings page (Free version).
 *
 * Registers the CSF options page with preset, WooCommerce,
 * shortcode generator, and selector configuration sections.
 */
class Settings
{
  protected string $prefix = '_bp3d_settings_';

  /**
   * Register init hook.
   */
  public function register(): void
  {
    add_action('init', [$this, 'init'], 0);
    add_filter('csf_' . $this->prefix . '_save', [$this, 'preserveSettings'], 10, 2);
  }

  /**
   * Keep stored keys this page does not declare (e.g. Pro settings) when saving.
   *
   * @param  mixed       $data      Declared fields from the form (already unslashed by CSF)
   * @param  object|null $instance  CSF options instance
   * @return array<string, mixed>
   */
  public function preserveSettings($data, $instance = null): array
  {
    if (!is_array($data)) {
      $data = [];
    }

    $merged = $this->overlayDeclared($data, $instance);

    // Pro offers more file types; free can't show their checkboxes, so keep those ticks as stored.
    $stored = get_option($this->prefix, []);
    $storedTypes = is_array($stored) ? ($stored['allowed_mime_types'] ?? null) : null;
    if (is_array($storedTypes) && is_array($merged['allowed_mime_types'] ?? null)) {
      $proOnly = array_diff($storedTypes, array_keys(\BP3D\Helper\Utils::SUPPORTED_MIME_TYPES));
      $merged['allowed_mime_types'] = array_values(array_unique(array_merge($merged['allowed_mime_types'], $proOnly)));
    }

    return $merged;
  }

  /**
   * Overlay the declared field values onto the stored option.
   *
   * @param  array<string, mixed> $data
   * @param  object|null          $instance
   * @return array<string, mixed>
   */
  protected function overlayDeclared(array $data, $instance): array
  {
    return \BP3D\Helper\Utils::overlayDeclared($this->prefix, $data, $instance);
  }

  /**
   * Initialize all settings sections.
   */
  public function init(): void
  {
    \BP3D\Helper\Registrar::createOptions($this->prefix, array(
      'menu_title' => 'Settings',
      'menu_slug' => '3dviewer-settings',
      'menu_type' => 'submenu',
      'menu_parent' => 'edit.php?post_type=bp3d-model-viewer',
      'theme' => 'light',
      'framework_title' => __('3D Viewer Settings', '3d-viewer'),
      'menu_position' => 90,
      'footer' => false,
      'footer_credit' => '3D Viewer',
      'footer_text' => '',

    ));
    $mime_options = array();
    foreach (\BP3D\Helper\Utils::getSupportedMimeTypes() as $ext) {
      $mime_options[$ext] = strtoupper($ext) . ' (.' . $ext . ')';
    }

    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'id' => 'general-settings',
      'title' => \BP3D\Helper\Registrar::modern($this->prefix) ? __('General', '3d-viewer') : __('General Settings', '3d-viewer'),
      'icon' => 'fas fa-cog',
      'fields' => array(
        array(
          'id' => 'allowed_mime_types',
          'layout' => 'tile-grid',
          'type' => 'checkbox',
          'title' => __('Allowed Mime Types', '3d-viewer'),
          'desc' => __('Select which 3D model and HDR file types can be uploaded to the media library. All supported formats are enabled by default; uncheck any you want to block.', '3d-viewer'),
          'options' => $mime_options,
          'default' => \BP3D\Helper\Utils::getSupportedMimeTypes(),
        ),
        // Delete data on uninstall
        array(
          'id' => 'delete_data_on_uninstall',
          'layout' => 'danger',
          'type' => 'switcher',
          'title' => __('Delete data on uninstall', '3d-viewer'),
          // Matches uninstall.php: keep the two in step.
          'desc' => __('When you delete the plugin from the Plugins screen, this removes all 3D Viewer settings and viewers. Deactivating keeps everything. Nothing is removed while the Pro version is installed.', '3d-viewer'),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'default' => false,
        ),
      ) // End fields
    ));
    $this->woocommerce();
    $this->shortcode();
    $this->woocommerce_selectors();
  }

  public function woocommerce()
  {


    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'id' => 'woocommerce-settings',
      'title' => \BP3D\Helper\Registrar::modern($this->prefix) ? __('WooCommerce', '3d-viewer') : __('Woocommerce Settings', '3d-viewer'),
      'icon' => 'fas fa-shopping-cart',
      'fields' => array(
        array(
          'id' => '3d_woo_switcher',
          'icon' => 'cart',
          'type' => 'switcher',
          'title' => __('Woocommerce', '3d-viewer'),
          'desc' => __('Adds 3D models to products and shows them on product pages.', '3d-viewer'),
          'default' => true,
        ),
        array(
          'id' => 'is_not_compatible',
          'icon' => 'warning',
          'type' => 'switcher',
          'title' => __('Theme Compatibility Mode', '3d-viewer'),
          'desc' => __('Enable if 3D Viewer is not compatible with this theme', '3d-viewer'),
          'default' => false,
        ),
        array(
          'id' => 'bp_camera_control',
          'icon' => 'move',
          'type' => 'switcher',
          'title' => __('Moving Controls', '3d-viewer'),
          'desc' => __('Lets visitors rotate and pan the model with the mouse or a finger.', '3d-viewer'),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'default' => true,
        ),
        array(
          'id' => 'bp_3d_zooming',
          'icon' => 'zoom-in',
          'type' => 'switcher',
          'title' => __('Enable Zoom', '3d-viewer'),
          'desc' => __('Lets visitors zoom with the scroll wheel or a pinch. Needs Moving Controls.', '3d-viewer'),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'text_width' => 60,
          'default' => true,
        ),

        array(
          'id' => 'bp_3d_loading',
          'icon' => 'loader',
          // Classic: a button set like its neighbours; same stored value.
          'type' => \BP3D\Helper\Registrar::modern($this->prefix) ? 'radio' : 'button_set',
          'title' => __('Loading Type', '3d-viewer'),
          'desc' => __('When the model file starts downloading: Auto lets the browser decide, Lazy waits until the viewer scrolls into view, Eager starts with the page.', '3d-viewer'),
          'options' => array(
            'auto' => __('Auto', '3d-viewer'),
            'lazy' => __('Lazy', '3d-viewer'),
            'eager' => __('Eager', '3d-viewer'),
          ),
          'default' => 'auto',
        ),


      ) // End fields
    ));
  }

  public function woocommerce_selectors()
  {
    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'id' => 'woocommerce-selectors',
      'title' => \BP3D\Helper\Registrar::modern($this->prefix) ? __('Woo Selectors', '3d-viewer') : __('WooCommerce Selectors', '3d-viewer'),
      'icon' => 'fas fa-crosshairs',
      'fields' => array(
        // 3D Model Options
        array(
          'id' => 'gallery',
          'icon' => 'image',
          'layout' => 'selector',
          'type' => 'text',
          'title' => __('Gallery Selector', '3d-viewer'),
          'desc' => __('Write here the gallery selector', '3d-viewer'),
          'placeholder' => '.woocommerce-product-gallery',
        ),
        array(
          'id' => 'gallery_item',
          'icon' => 'image',
          'layout' => 'selector',
          'type' => 'text',
          'title' => __('Gallery Item Selector', '3d-viewer'),
          'desc' => __('Write here the gallery item selector', '3d-viewer'),
          'placeholder' => '.woocommerce-product-gallery__image',
        ),
        array(
          'id' => 'gallery_item_active',
          'icon' => 'check',
          'layout' => 'selector',
          'type' => 'text',
          'title' => __('Gallery Item Active Selector', '3d-viewer'),
          'desc' => __('Write here the gallery item active selector', '3d-viewer'),
          'placeholder' => '.woocommerce-product-gallery__image.flex-active-slide',
        ),
        array(
          'id' => 'gallery_thumbnail_item',
          'icon' => 'grid',
          'layout' => 'selector',
          'type' => 'text',
          'title' => __('Gallery Thumbnail Item Selector', '3d-viewer'),
          'desc' => __('Write here the gallery thumbnail item selector', '3d-viewer'),
          'placeholder' => '.flex-control-thumbs li',
        ),
        array(
          'id' => 'gallery_trigger',
          'icon' => 'search',
          'layout' => 'selector',
          'type' => 'text',
          'title' => __('Gallery Trigger Selector', '3d-viewer'),
          'desc' => __('Write here the gallery trigger selector', '3d-viewer'),
          'placeholder' => '.woocommerce-product-gallery__trigger',
        )
      )
    ));
  }

  public function shortcode()
  {
    \BP3D\Helper\Registrar::createSection($this->prefix, array(
      'id' => 'shortcode-generator',
      'title' => __('Shortcode Generator', '3d-viewer'),
      'icon' => 'fas fa-code',
      'fields' => array(
        // 3D Model Options
        array(
          'id' => 'gutenberg_enabled',
          'icon' => 'code',
          'type' => 'switcher',
          'title' => __('Enable Gutenberg', '3d-viewer'),
          'subtitle' => __('New viewers open in the block editor. Off uses the 3D Viewer form. Existing viewers keep the editor they were made with.', '3d-viewer'),
          'default' => false,
        ),
      ) // End fields
    ));
  }
}
