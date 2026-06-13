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
  }

  /**
   * Initialize all settings sections.
   */
  public function init(): void
  {
    \CSF::createOptions($this->prefix, array(
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
    \CSF::createSection($this->prefix, array(
      'title' => __('General Settings', '3d-viewer'),
      'fields' => array(
        array(
          'id' => 'allowed_mime_types',
          'type' => 'checkbox',
          'title' => __('Allowed Mime Types', '3d-viewer'),
          'desc' => __('Select which 3D model file types can be uploaded to the media library. By default, all extended mime types are disabled.', '3d-viewer'),
          'options' => array(
            'glb' => 'GLB (.glb)',
            'gltf' => 'GLTF (.gltf)',
            'obj' => 'OBJ (.obj)',
            '3ds' => '3DS (.3ds)',
            'step' => 'STEP (.step)',
            'stl' => 'STL (.stl)',
            'fbx' => 'FBX (.fbx)',
            '3dml' => '3DML (.3dml)',
            'dae' => 'DAE (.dae)',
            'wrl' => 'WRL (.wrl)',
            '3mf' => '3MF (.3mf)',
            'mtl' => 'MTL (.mtl)',
            'hdr' => 'HDR (.hdr)',
            'usdz' => 'USDZ (.usdz)',
          ),
          'default' => array(),
        ),
        // Delete data on uninstall
        array(
          'id' => 'delete_data_on_uninstall',
          'type' => 'switcher',
          'title' => __('Delete data on uninstall', '3d-viewer'),
          'desc' => __('Delete data on uninstall', '3d-viewer'),
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


    \CSF::createSection($this->prefix, array(
      'title' => __('Woocommerce Settings', '3d-viewer'),
      'fields' => array(
        array(
          'id' => '3d_woo_switcher',
          'type' => 'switcher',
          'title' => __('Woocommerce', '3d-viewer'),
          'subtitle' => __('Enable / Disable Woocommerce Feature for 3D Viewer.', '3d-viewer'),
          'desc' => __('Enable / Disable. Default is Enable.', '3d-viewer'),
          'default' => true,
        ),
        array(
          'id' => 'is_not_compatible',
          'type' => 'switcher',
          'title' => __('3D Viewer is not Compatible with this Theme', '3d-viewer'),
          'desc' => __('Enable if 3D Viewer is not compatible with this theme', '3d-viewer'),
          'default' => false,
        ),
        // array(
        //   'id'       => 'product_gallery_selector',
        //   'type'      => 'text',
        //   'title'    => __('Product Gallery Class or ID or Valid CSS Selector', '3d-viewer'),
        //   'desc'     => __('Write here the product gallery class or id or any valid CSS selector', '3d-viewer'),
        //   'default' => '.woocommerce-product-gallery',
        //   'dependency' => array('is_not_compatible', '==', '1'),
        // ),
        array(
          'id' => 'bp_camera_control',
          'type' => 'switcher',
          'title' => __('Moving Controls', '3d-viewer'),
          'desc' => __('Use The Moving controls to enable user interaction', '3d-viewer'),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'default' => true,
        ),
        array(
          'id' => 'bp_3d_zooming',
          'type' => 'switcher',
          'title' => __('Enable Zoom', '3d-viewer'),
          'subtitle' => __('Enable or Disable Zoom Behaviour', '3d-viewer'),
          'desc' => __('If you wish to disable zooming behaviour please choose No.', '3d-viewer'),
          'text_on' => __('Yes', '3d-viewer'),
          'text_off' => __('No', '3d-viewer'),
          'text_width' => 60,
          'default' => true,
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
        ),


      ) // End fields
    ));
  }

  public function woocommerce_selectors()
  {
    \CSF::createSection($this->prefix, array(
      'title' => __('Woocommerce Selectors', '3d-viewer'),
      'fields' => array(
        // 3D Model Options
        array(
          'id' => 'gallery',
          'type' => 'text',
          'title' => __('Gallery Selector', '3d-viewer'),
          'desc' => __('Write here the gallery selector', '3d-viewer'),
          'placeholder' => '.woocommerce-product-gallery',
        ),
        array(
          'id' => 'gallery_item',
          'type' => 'text',
          'title' => __('Gallery Item Selector', '3d-viewer'),
          'desc' => __('Write here the gallery item selector', '3d-viewer'),
          'placeholder' => '.woocommerce-product-gallery__image',
        ),
        array(
          'id' => 'gallery_item_active',
          'type' => 'text',
          'title' => __('Gallery Item Active Selector', '3d-viewer'),
          'desc' => __('Write here the gallery item active selector', '3d-viewer'),
          'placeholder' => '.woocommerce-product-gallery__image.flex-active-slide',
        ),
        array(
          'id' => 'gallery_thumbnail_item',
          'type' => 'text',
          'title' => __('Gallery Thumbnail Item Selector', '3d-viewer'),
          'desc' => __('Write here the gallery thumbnail item selector', '3d-viewer'),
          'placeholder' => '.flex-control-thumbs li',
        ),
        array(
          'id' => 'gallery_trigger',
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
    \CSF::createSection($this->prefix, array(
      'title' => __('Shortcode Generator', '3d-viewer'),
      'fields' => array(
        // 3D Model Options
        array(
          'id' => 'gutenberg_enabled',
          'type' => 'switcher',
          'title' => __('Enable Gutenberg', '3d-viewer'),
          'subtitle' => __('Enable / Disable Gutenberg Shortcode Generator.', '3d-viewer'),
          'default' => false,
        ),
      ) // End fields
    ));
  }
}
