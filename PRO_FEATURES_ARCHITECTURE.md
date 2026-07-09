# 3D Viewer: Pro Features Architecture & Porting Guide

> **Purpose**: This document is designed for an AI agent to understand how pro features are implemented in the 3D Viewer Premium plugin, so it can port selected features to the free version (`3d-viewer`).

---

## 1. Architecture Overview

### 1.1 Plugin Identity

| Property | Free Plugin | Premium Plugin |
|---|---|---|
| **Slug** | `3d-viewer` | `3d-viewer-premium` |
| **Path** | `wp-content/plugins/3d-viewer/` | `wp-content/plugins/3d-viewer-premium/` |
| **Main File** | `3d-viewer.php` | `3d-viewer-premium.php` |
| **Namespace** | `BP3D\` | `BP3D\` (same) |
| **Post Type** | `bp3d-model-viewer` | `bp3d-model-viewer` + `bp3d-preset` (pro) |
| **Freemius `is_premium`** | `false` | `true` |
| **Version** | 1.8.13 | 1.9.1 |

### 1.2 Shared Architecture Pattern

Both plugins use **identical architecture** with the same namespace (`BP3D\`), same class names, same constants (`BP3D_DIR`, `BP3D_PATH`, `BP3D_VERSION`), and the same CSF (CodeStar Framework) for admin options/metaboxes.

### 1.3 The Pro File Override Pattern (Critical)

The **core mechanism** for enabling pro features is in [Init.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Init.php#L143-L164):

```php
// inc/Init.php :: require_file()
public static function require_file($class) {
    $file = str_replace('\\', '/', $class);
    $pro_file = BP3D_PATH . str_replace('BP3D', 'inc', $file . 'Pro') . '.php';
    $free_file = BP3D_PATH . str_replace('BP3D', 'inc', $file) . '.php';

    // If ProFile exists AND Freemius is premium → load Pro version
    if (file_exists($pro_file)
        && \bp3d_fs()->is__premium_only()
        && \bp3d_fs()->can_use_premium_code()
    ) {
        require_once $pro_file;
        return $class . 'Pro';
    }

    // Otherwise → load free version
    if (file_exists($free_file)) {
        require_once $free_file;
        return $class;
    }

    return false;
}
```

**How it works**: For each service class (e.g., `Viewer`), the system checks for a `ViewerPro.php` file first. If found AND the license is premium, the Pro version is loaded instead. Pro classes **extend** the free class or are standalone replacements with the same interface.

### 1.4 The `@fs_premium_only` Annotation

In `3d-viewer-premium.php` line 15:
```
@fs_premium_only /inc/Shortcode/ShortcodePro.php, /inc/Field/SettingsPro.php, /inc/Field/ViewerPro.php, /inc/Woocommerce/ProductMetaPro.php, /inc/Woocommerce/ProductViewPro.php, /inc/Woocommerce/ProductsPro.php, /inc/Base/LicenseActivation.php
```

These files are **stripped from the free zip** by Freemius deployment. They only exist in the premium download.

---

## 2. Service Registration Differences

### Free Plugin Services ([Init.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer/inc/Init.php#L36-L52))

```php
Base\EnqueueAssets, Base\Import, Shortcode\Shortcode,
Base\ExtendMimeType, Field\Viewer, Field\Settings,
Woocommerce\SingleProduct, Helper\Utils, Helper\Block,
Addons\Blocks, Addons\Addons, Addons\Controls\Controls
```

### Premium Plugin Services ([Init.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Init.php#L36-L56))

```php
Base\EnqueueAssets, Base\Import, Base\SetupWizard,           // ← Pro adds SetupWizard
Base\AdminNotice, Base\Ajax,                                  // ← Pro adds AdminNotice, Ajax
Shortcode\Shortcode,                                          // → becomes ShortcodePro via override
Base\ExtendMimeType, Field\Viewer, Field\Settings,           // → become ViewerPro, SettingsPro
Woocommerce\SingleProduct, Woocommerce\ProductsPro,          // ← Pro adds ProductsPro
Helper\Block,
Addons\Controls\Controls,
Addons\AddonsPro,                                            // ← Pro-only Elementor integration
Addons\Blocks,
Template\ModelViewer,                                        // ← Pro adds Template renderer
```

**Pro-only services**: `SetupWizard`, `AdminNotice`, `Ajax`, `ProductsPro`, `AddonsPro`, `Template\ModelViewer`

**Pro overrides** (via `require_file`): `ShortcodePro`, `ViewerPro`, `SettingsPro`, `ProductMetaPro`, `SingleProductPro`

---

## 3. Feature-by-Feature Comparison

### 3.1 Model Tab (Metabox Fields)

| Feature | Free | Pro | Pro Implementation |
|---|---|---|---|
| **Viewer Type** (Lite/Advanced) | ✅ | ✅ | Same |
| **Model Source** (Upload) | ✅ | ✅ | Same |
| **Model Source Type** (Upload/Link) | ❌ | ✅ | `bp_3d_src_type` button_set in ViewerPro |
| **Model Type** (Simple/Cycle) | ❌ | ✅ | `bp_3d_model_type` button_set, enables multi-model cycling |
| **Multiple Models (Cycle)** | ❌ | ✅ | `bp_3d_models` group field with repeater |
| **Per-model Poster** | ❌ | ✅ | Inside cycle model group |
| **Per-model Environment Image** | ❌ | ✅ | Inside cycle model group |
| **Per-model Skybox Image** | ❌ | ✅ | Inside cycle model group |
| **Per-model Exposure** | ❌ | ✅ | Inside cycle model group |
| **Per-model AR** | ❌ | ✅ | Inside cycle model group |
| **Per-model Hotspots** | ❌ | ✅ | Inside cycle model group |
| **Per-model Initial View** | ❌ | ✅ | Inside cycle model group |
| **Poster Images (deprecated group)** | ❌ | ✅ | `bp_3d_posters` group |
| **Environment Image** | ❌ | ✅ | `bp_3d_environment_image` upload field |
| **HDR Skybox Image** | ❌ | ✅ | `bp_3d_skybox_image` upload field |
| **Initial View** | ❌ | ✅ | `initial_view` text field (JSON) |
| **Draco Decoder** | ✅ | ❌ | Free has it, Pro doesn't in viewer metabox |
| **Preview Tab** | ✅ | ❌ | Free has inline preview, Pro uses Visual Editor page |

### 3.2 Settings Tab (Metabox Fields)

| Feature | Free | Pro | Pro Implementation |
|---|---|---|---|
| **Moving Controls** | ✅ | ✅ | Same |
| **Enable Zoom** | ✅ | ✅ | Same |
| **Full Screen Button** | ✅ | ✅ | Same |
| **Zoom In/Out Button** | ✅ | ✅ | Same (free added recently) |
| **Camera Button** | ✅ | ✅ | Same |
| **Loading Type** | ✅ | ✅ | Same |
| **Progressbar** | ✅ | ✅ | Same |
| **Exposure** | ✅ | ✅ | Same |
| **Autoplay** | ❌ | ✅ | `bp_3d_autoplay` switcher |
| **Auto Rotate** | ❌ | ✅ | `bp_3d_rotate` switcher |
| **Auto Rotate Speed** | ❌ | ✅ | `3d_rotate_speed` spinner |
| **Auto Rotate Delay** | ❌ | ✅ | `3d_rotate_delay` number |
| **Zoom Level** | ❌ | ✅ | `3d_zoom_level` spinner |
| **Shadow Intensity** | ❌ | ✅ | `3d_shadow_intensity` spinner |
| **Lock X-Axis Rotation** | ❌ | ✅ | `lockXAxisRotation` switcher |
| **Lock Y-Axis Rotation** | ❌ | ✅ | `lockYAxisRotation` switcher |
| **Hotspots (for simple model)** | ❌ | ✅ | `hotspots` group with title/desc/position/normal/orbit/target/fov |
| **Hotspot Styles** | ❌ | ✅ | `hotspot_style` button_set (3 styles) |
| **Visual Editor Link** | ❌ | ✅ | Button linking to admin visual editor page |
| **Show Progress Percent** | ❌ | ✅ | `bp_model_progress_percent` switcher |

### 3.3 Elements Tab (Pro Only)

This entire tab (`elements()` method) exists only in Pro:
- Show Thumbnail List (for cycle models)
- Show Arrows (for cycle models)
- Enable AR + iOS Source + AR Placement + AR Mode
- Fullscreen toggle
- Zoom In/Out Button
- Camera/Capture Button
- Progressbar
- Show Progress Percent

### 3.4 Style Tab

| Feature | Free | Pro | Pro Implementation |
|---|---|---|---|
| **Width** | ✅ | ✅ | Same |
| **Height** | ✅ | ✅ | Same |
| **Align** | ✅ | ✅ | Same |
| **Background Color** | ✅ | ✅ | Same |
| **Progressbar Color** | ❌ | ✅ | `bp_model_progressbar_color` color picker |
| **CSS Editor** | ❌ | ✅ | `css` code_editor field |
| **Additional ID** | ❌ | ✅ | `additional_id` text field |
| **Additional Class** | ❌ | ✅ | `additional_class` text field |

---

## 4. Global Settings Differences

### Free Settings Sections
- General Settings (Mime Types, Delete on uninstall)
- WooCommerce Settings (basic)
- Shortcode Generator
- WooCommerce Selectors

### Pro-Only Settings Sections
- **Preset** section (global defaults for width, height, bg, autoplay, shadow, preload, controls, zoom, progress, loading, auto-rotate, speed, delay, fullscreen)
- **Modules** section (dynamic module enable/disable from `modules/` directory)

### Pro WooCommerce Settings Additions
- Shadow Intensity
- Autoplay
- Auto Rotate + Speed + Delay
- Fullscreen

---

## 5. Pro-Only PHP Files & Features

### [PostTypePreset.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Base/PostTypePreset.php)
- Registers `bp3d-preset` post type
- Preset templates for reusable viewer configurations
- Used in WooCommerce product settings to apply preset templates

### [Presets.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Base/Presets.php)
- Helper for retrieving preset configurations by ID

### [LicenseActivation.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Base/LicenseActivation.php)
- License key activation system (14KB)

### [SetupWizard.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Base/SetupWizard.php)
- First-time setup wizard

### [AdminNotice.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Base/AdminNotice.php)
- Admin notice management

### [Ajax.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Base/Ajax.php)
- AJAX handlers

### [ModuleManager.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Helper/ModuleManager.php)
- Scans `modules/` directory, reads module headers, enables/disables modules from settings

### [Template/ModelViewer.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Template/ModelViewer.php)
- PHP-based HTML renderer for `<model-viewer>` and O3DViewer elements
- Used by WooCommerce product rendering and presets

### [SingleProductPro.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Woocommerce/SingleProductPro.php)
- Extends `SingleProduct` with popup/modal 3D model support
- `renderPopupModels()` creates modal overlays triggered by CSS selectors

### [ProductsPro.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Woocommerce/ProductsPro.php)
- Adds 3D model icons/overlays to WooCommerce shop listing thumbnails

---

## 6. WooCommerce Integration Differences

### Free WooCommerce Product Meta ([ProductMeta.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer/inc/Woocommerce/ProductMeta.php))
- Basic model source upload per product
- Viewer position selection
- Basic settings (zoom, height, bg color)

### Pro WooCommerce Product Meta ([ProductMetaPro.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/Woocommerce/ProductMetaPro.php))
- **Multiple models per product** (`bp3d_models` repeater group)
- **Product variant mapping** (auto-detects WooCommerce variations, maps models to variants)
- **Per-model settings**: poster, environment image, skybox image, exposure, AR, hotspots, initial view
- **Template/Preset selection** (select from `bp3d-preset` post type)
- **Popup models** (`bp3d_popup_models` group) with CSS selector targeting
- **Thumbnail list** for multi-model navigation
- **Navigation arrows** for multi-model
- **Hotspot styles**
- **3D icon on shop pages** (`replace_model_with_thumbnail`)
- **Display model on listings** (`show_model_instead_thumbnail`)
- **Dismissable admin notice** with AJAX

---

## 7. Frontend (React/TypeScript) Differences

### 7.1 Block Attributes (block.json / types.ts)

#### Free Block Attributes
```typescript
uniqueId, model, currentViewer, attributes, O3DVSettings,
lazyLoad, preload, zoom, zoomInOutBtn, mouseControl, fullscreen,
cameraBtn, loadingPercentage, progressBar, styles, placement, woo
```

#### Pro-Only Block Attributes
```typescript
multiple, models[],              // Multi-model support
autoplay, animation, selectedAnimation, // Playback
shadow,                          // Shadow intensity
rotate, autoRotate, rotationPerSecond, rotateAlongX, rotateAlongY, // Rotation
lockXAxisRotation, lockYAxisRotation,   // Axis locking
zoomLevel,                       // Zoom level control
variant, loadingPercentage,      // Variant selector
isPagination, isNavigation,      // Multi-model nav
exposure, environmentImage,      // Environment
useEnvironmentAsSkybox, toneMapping, // Advanced env
appliedTextures,                 // Texture editing
hotspots[], hotspotStyle,        // Hotspot annotations
additional: { ID, Class, CSS }, // Custom CSS/ID/Class
stylesheet,                      // Inline CSS
isPremium, activeIndex           // Premium flag
```

### 7.2 manageAttributes.ts

#### Free Version (69 lines)
Only manages: `zoom`, `mouseControl`, `loading`

#### Pro Version (239 lines)
Additionally manages: `exposure`, `selectedAnimation`, `autoRotate`, `rotateDelay`, `rotationPerSecond`, `preload`, `environmentImage`, `zoomLevel`, `lockXAxisRotation`, `lockYAxisRotation`, `toneMapping`, `multiple`, `useEnvironmentAsSkybox`, `autoplay`, `shadow`, `rotate`, `rotateAlongX`, `rotateAlongY`, `lazyLoad`, `skyboxImage`, `skyboxHeight`, `scale`

### 7.3 React Components

#### Free (`src/blocks/3d-viewer/Components/Common/`)
- `Basic3DViewer.tsx` (5.6KB) - Core viewer
- `ModelViewer.tsx` (5KB) - Model viewer component
- `Viewer.tsx` (4.4KB) - Main wrapper
- `FrontEnd.tsx` (798B) - Frontend entry
- `Style.tsx` (2.5KB) - Styles
- `ShopLoopItemComponents.tsx` - WooCommerce shop loop

#### Pro (`src/blocks/3d-viewer/Components/Common/`)
All of the above PLUS:
- `ARQRCode.tsx` (2KB) - AR QR code generation
- `ClicpboardButton.tsx` (1.6KB) - Copy AR link
- `Hotspots.tsx` (8.5KB) - Hotspot rendering & interaction
- `ModelPagination.tsx` (1KB) - Multi-model pagination dots
- `SliderControllder.tsx` (1KB) - Slider navigation arrows

Pro files are significantly larger:
- `Basic3DViewer.tsx`: 10.5KB (vs 5.6KB)
- `ModelViewer.tsx`: 15KB (vs 5KB)
- `Viewer.tsx`: 7.8KB (vs 4.4KB)

#### Pro Backend Components
- `ProModal.tsx` - Premium upsell modal
- `Upgrade.tsx` - Upgrade prompt
- `VisualEditorSettings.tsx` - Visual editor integration

### 7.4 utils.ts Differences

#### Free (10.9KB)
Basic utilities: URL parsing, image source detection, DOM traversal, color conversion, materials access

#### Pro (15.6KB)
All of the above PLUS:
- `createAndApplyTexture()` - Runtime texture application
- `applyTexture()` - Apply pre-configured textures
- `resetMaterialProperty()` - Reset material to defaults
- `getAllMaterialData()` - Extract all PBR material data
- Advanced color space conversions (sRGB → linear, RGBA ↔ factor)
- `merge()` deep merge utility
- `debounce()` utility

### 7.5 Preset Block (Pro Only)

Pro has `src/blocks/preset/` - An entire Gutenberg block for creating preset templates.

---

## 8. Admin Differences

### Free Admin ([admin.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer/inc/admin.php))
- Help & Demos page only

### Pro Admin ([admin.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer-premium/inc/admin.php))
- Help & Demos page
- **Visual Editor** page (hotspot placement, initial view configuration)
- Admin head styles for Freemius pricing link

---

## 9. Porting Guide: How to Add a Pro Feature to Free

### 9.1 General Steps

1. **Identify the feature** from the tables above
2. **Backend (PHP)**:
   - Add the CSF field to the appropriate free file (`Viewer.php`, `Settings.php`, or `ProductMeta.php`)
   - Add the data extraction in the shortcode's `getCommonAttributes()` method or `Utils::buildViewerAttributes()`
   - Ensure the meta key is passed through to `$finalData` in the shortcode render
3. **Frontend (TypeScript/React)**:
   - Add the attribute to `types.ts` `BlockAttributes` interface
   - Add the attribute to `block.json`
   - Add the attribute handling to `manageAttributes.ts`
   - Update the `Viewer.tsx` or `ModelViewer.tsx` component to consume the attribute
   - Update `Basic3DViewer.tsx` if it renders the `<model-viewer>` element with that attribute
4. **Build**: Run `npm run build` (or `npm start` for dev) from the free plugin directory

### 9.2 Example: Porting "Auto Rotate" to Free

#### Step 1: Backend – Add CSF Field
In [inc/Field/Viewer.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer/inc/Field/Viewer.php) `settings()` method, add:
```php
array(
  'id' => 'bp_3d_rotate',
  'type' => 'switcher',
  'title' => __('Auto Rotate', '3d-viewer'),
  'desc' => __("Enables automatic rotation of the model.", "3d-viewer"),
  'text_on' => 'Yes',
  'text_off' => 'No',
  'default' => false,
  'dependency' => ['currentViewer', '==', 'modelViewer', 'all']
),
array(
  'id' => '3d_rotate_speed',
  'type' => 'spinner',
  'title' => __('Auto Rotate Speed', '3d-viewer'),
  'min' => 0, 'max' => 180, 'default' => 30,
  'dependency' => array('bp_3d_rotate|currentViewer', '==|==', '1|modelViewer', 'all')
),
array(
  'id' => '3d_rotate_delay',
  'type' => 'number',
  'title' => __('Auto Rotation Delay (ms)', '3d-viewer'),
  'default' => 3000,
  'dependency' => array('bp_3d_rotate|currentViewer', '==|==', '1|modelViewer', 'all'),
),
```

#### Step 2: Backend – Pass Data Through
In [inc/Helper/Utils.php](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer/inc/Helper/Utils.php) `buildViewerAttributes()`, add to the returned array:
```php
'autoRotate' => $meta('bp_3d_rotate', false, true),
'rotateDelay' => (int) $meta('3d_rotate_delay', 3000),
'rotationPerSecond' => $meta('3d_rotate_speed', 30),
```

#### Step 3: Frontend – Add to TypeScript types
In [src/blocks/3d-viewer/types.ts](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer/src/blocks/3d-viewer/types.ts), add to `BlockAttributes`:
```typescript
autoRotate: boolean;
rotateDelay: number;
rotationPerSecond: number;
```

#### Step 4: Frontend – Handle in manageAttributes.ts
In [src/public/manageAttributes.ts](file:///Users/raju/Local%20Sites/dev/app/public/wp-content/plugins/3d-viewer/src/public/manageAttributes.ts), add auto-rotate logic:
```typescript
const { autoRotate, rotateDelay, rotationPerSecond } = attributes;

if (autoRotate) {
    modelViewer.setAttribute('auto-rotate', '');
    modelViewer.setAttribute('auto-rotate-delay', String(rotateDelay || 3000));
    if (rotationPerSecond) {
        modelViewer.setAttribute('rotation-per-second', rotationPerSecond + 'deg');
    }
} else {
    modelViewer.removeAttribute('auto-rotate');
}
```

#### Step 5: Build
```bash
cd /path/to/3d-viewer && npm run build
```

### 9.3 Feature Porting Complexity Guide

| Feature | Complexity | Files to Modify |
|---|---|---|
| **Auto Rotate** | 🟢 Easy | Viewer.php, Utils.php, types.ts, manageAttributes.ts |
| **Autoplay** | 🟢 Easy | Viewer.php, Utils.php, types.ts, manageAttributes.ts |
| **Shadow Intensity** | 🟢 Easy | Viewer.php, Utils.php, types.ts, manageAttributes.ts |
| **Exposure control** | 🟢 Easy | Already in free, just needs manageAttributes update |
| **Progressbar Color** | 🟢 Easy | Viewer.php, Utils.php, types.ts, Style.tsx |
| **Lock Axis Rotation** | 🟢 Easy | Viewer.php, Utils.php, types.ts, manageAttributes.ts |
| **CSS Editor** | 🟢 Easy | Viewer.php, Utils.php, render output |
| **Additional ID/Class** | 🟢 Easy | Viewer.php, Utils.php, render output |
| **Environment Image** | 🟡 Medium | Viewer.php, Utils.php, types.ts, manageAttributes.ts, ModelViewer.tsx |
| **Skybox Image** | 🟡 Medium | Viewer.php, Utils.php, types.ts, manageAttributes.ts, ModelViewer.tsx |
| **AR (Augmented Reality)** | 🟡 Medium | Viewer.php, Utils.php, types.ts, ModelViewer.tsx, Basic3DViewer.tsx |
| **Hotspots** | 🟠 Hard | Viewer.php, Utils.php, types.ts, + NEW Hotspots.tsx component, ModelViewer.tsx |
| **Multiple Models (Cycle)** | 🔴 Very Hard | Viewer.php, ShortcodePro logic, types.ts, Viewer.tsx, ModelViewer.tsx, pagination, slider components |
| **Visual Editor** | 🔴 Very Hard | New admin page, React dashboard app, model interaction |
| **Preset Templates** | 🔴 Very Hard | New post type, block, settings page section |
| **WooCommerce Popups** | 🔴 Very Hard | SingleProductPro, popup modal system, frontend JS |
| **Texture Editing** | 🔴 Very Hard | ModelReader, material APIs, utils.ts, block settings |
| **Product Variants** | 🔴 Very Hard | ProductMetaPro, Product.php, variant detection, frontend variant switching |

---

## 10. Key Meta Keys Reference

### Post Meta (`_bp3dimages_` on `bp3d-model-viewer`)

| Meta Key | Free | Pro | Description |
|---|---|---|---|
| `currentViewer` | ✅ | ✅ | 'modelViewer' or 'O3DViewer' |
| `bp_3d_src` | ✅ | ✅ | Model file (media upload) |
| `bp_3d_src_type` | ❌ | ✅ | 'upload' or 'link' |
| `bp_3d_src_link` | ❌ | ✅ | Model URL (text) |
| `bp_3d_model_type` | ❌ | ✅ | 'msimple' or 'mcycle' |
| `bp_3d_models` | ❌ | ✅ | Array of cycle models |
| `bp_3d_poster` | ✅ | ✅ | Poster image |
| `bp_3d_environment_image` | ❌ | ✅ | Environment image URL |
| `bp_3d_skybox_image` | ❌ | ✅ | Skybox HDR image URL |
| `initial_view` | ❌ | ✅ | JSON string for camera position |
| `bp_3d_autoplay` | ❌ | ✅ | Boolean |
| `bp_camera_control` | ✅ | ✅ | Boolean |
| `bp_3d_zooming` | ✅ | ✅ | Boolean |
| `bp_3d_fullscreen` | ✅ | ✅ | Boolean |
| `bp_3d_zoom_in_out_btn` | ✅ | ✅ | Boolean |
| `bp_3d_camera_btn` | ✅ | ✅ | Boolean |
| `bp_3d_loading` | ✅ | ✅ | 'auto', 'lazy', 'eager' |
| `bp_3d_progressbar` | ✅ | ✅ | Boolean |
| `bp_3d_rotate` | ❌ | ✅ | Boolean (auto rotate) |
| `3d_rotate_speed` | ❌ | ✅ | Number |
| `3d_rotate_delay` | ❌ | ✅ | Number (ms) |
| `3d_zoom_level` | ❌ | ✅ | Number |
| `3d_shadow_intensity` | ❌ | ✅ | Number |
| `3d_exposure` | ✅ | ✅ | Number (slider 0.1-5) |
| `lockXAxisRotation` | ❌ | ✅ | Boolean |
| `lockYAxisRotation` | ❌ | ✅ | Boolean |
| `hotspots` | ❌ | ✅ | Array of hotspot objects |
| `hotspot_style` | ❌ | ✅ | 'style-1', 'style-2', 'style-3' |
| `bp_3d_enable_ar` | ❌ | ✅ | Boolean |
| `model_iso_src` | ❌ | ✅ | iOS model URL (.usdz) |
| `ar_placement` | ❌ | ✅ | 'floor' or 'wall' |
| `ar_mode` | ❌ | ✅ | 'webxr', 'scene-viewer', 'quick-look' |
| `bp_model_progress_percent` | ❌ | ✅ | Boolean |
| `bp_model_progressbar_color` | ❌ | ✅ | Color string |
| `css` | ❌ | ✅ | Custom CSS code |
| `additional_id` | ❌ | ✅ | Custom HTML ID |
| `additional_class` | ❌ | ✅ | Custom CSS class |
| `show_thumbs` | ❌ | ✅ | Boolean (thumbnail list) |
| `show_arrows` | ❌ | ✅ | Boolean (nav arrows) |
| `bp_3d_decoder` | ✅ | ❌ | 'none' or 'draco' (free-only) |

### Product Meta (`_bp3d_product_` on WooCommerce `product`)

| Meta Key | Free | Pro | Description |
|---|---|---|---|
| `currentViewer` | ✅ | ✅ | Viewer type |
| `bp3d_models` | ✅ (simple) | ✅ (with variants) | Product model list |
| `viewer_position` | ✅ | ✅ | none/top/bottom/replace/merge/tab |
| `bp_3d_height` | ✅ | ✅ | Viewer height |
| `bp_model_bg` | ✅ | ✅ | Background color |
| `bp_3d_zooming` | ✅ | ✅ | Zoom enabled |
| `bp_model_template` | ❌ | ✅ | Preset template ID |
| `show_thumbs` | ❌ | ✅ | Thumbnail navigation |
| `show_arrows` | ❌ | ✅ | Arrow navigation |
| `hotspot_style` | ❌ | ✅ | Hotspot visual style |
| `replace_model_with_thumbnail` | ❌ | ✅ | 3D icon on shop pages |
| `show_model_instead_thumbnail` | ❌ | ✅ | Model replaces thumbnail |
| `bp3d_popup_models` | ❌ | ✅ | Popup model configuration |

### Global Settings (`_bp3d_settings_`)

| Key | Free | Pro | Description |
|---|---|---|---|
| `allowed_mime_types` | ✅ | ❌ | Allowed upload types |
| `delete_data_on_uninstall` | ✅ | ❌ | Cleanup on uninstall |
| `3d_woo_switcher` | ✅ | ✅ | WooCommerce on/off |
| `is_not_compatible` | ✅ | ✅ | Theme compatibility |
| `bp_camera_control` | ✅ | ✅ | WooCommerce default |
| `bp_3d_zooming` | ✅ | ✅ | WooCommerce default |
| `bp_3d_loading` | ✅ | ✅ | Loading type default |
| `gutenberg_enabled` | ✅ | ✅ | Gutenberg shortcode gen |
| `gallery` / `gallery_*` | ✅ | ✅ | WooCommerce selectors |
| `bpp_3d_width` | ❌ | ✅ | Preset width |
| `bpp_3d_height` | ❌ | ✅ | Preset height |
| `bpp_model_bg` | ❌ | ✅ | Preset bg color |
| `bpp_3d_autoplay` | ❌ | ✅ | Preset autoplay |
| `3dp_shadow_intensity` | ❌ | ✅ | Preset shadow |
| `bpp_3d_preloader` | ❌ | ✅ | Preset preload |
| `bpp_camera_control` | ❌ | ✅ | Preset controls |
| `bpp_3d_zooming` | ❌ | ✅ | Preset zoom |
| `bpp_3d_progressbar` | ❌ | ✅ | Preset progressbar |
| `bpp_3d_loading` | ❌ | ✅ | Preset loading |
| `bpp_3d_rotate` | ❌ | ✅ | Preset auto rotate |
| `3dp_rotate_speed` | ❌ | ✅ | Preset rotate speed |
| `bpp_3d_fullscreen` | ❌ | ✅ | Preset fullscreen |
| `bp_3d_rotate` / `3d_rotate_speed` / `3d_rotate_delay` | ❌ | ✅ | WooCommerce defaults |
| `bp_3d_autoplay` | ❌ | ✅ | WooCommerce autoplay |
| `bp_3d_fullscreen` | ❌ | ✅ | WooCommerce fullscreen |
| `3d_shadow_intensity` | ❌ | ✅ | WooCommerce shadow |
| `module_*` | ❌ | ✅ | Module enable/disable |
| `custom_css` | ❌ | ✅ | Global custom CSS |

---

## 11. File Structure Comparison

```
FREE PLUGIN                              PREMIUM PLUGIN
──────────                              ────────────────
3d-viewer.php                            3d-viewer-premium.php
inc/                                     inc/
├── Init.php                             ├── Init.php (+ ModuleManager, PostTypePreset, AddonsPro)
├── admin.php                            ├── admin.php (+ Visual Editor page)
├── Base/                                ├── Base/
│   ├── EnqueueAssets.php                │   ├── EnqueueAssets.php
│   ├── ExtendMimeType.php               │   ├── ExtendMimeType.php
│   ├── Import.php                       │   ├── Import.php
│   └── PostTypeModelViewer.php          │   ├── PostTypeModelViewer.php
│                                        │   ├── PostTypePreset.php ← PRO ONLY
│                                        │   ├── Presets.php ← PRO ONLY
│                                        │   ├── SetupWizard.php ← PRO ONLY
│                                        │   ├── AdminNotice.php ← PRO ONLY
│                                        │   ├── Ajax.php ← PRO ONLY
│                                        │   └── LicenseActivation.php ← PRO ONLY
├── Field/                               ├── Field/
│   ├── Viewer.php                       │   ├── Viewer.php
│   └── Settings.php                     │   ├── ViewerPro.php ← OVERRIDES Viewer
│                                        │   ├── Settings.php
│                                        │   └── SettingsPro.php ← OVERRIDES Settings
├── Shortcode/                           ├── Shortcode/
│   └── Shortcode.php                    │   ├── Shortcode.php
│                                        │   └── ShortcodePro.php ← OVERRIDES Shortcode
├── Woocommerce/                         ├── Woocommerce/
│   ├── Product.php                      │   ├── Product.php (larger, variant support)
│   ├── ProductMeta.php                  │   ├── ProductMeta.php
│   └── SingleProduct.php               │   ├── ProductMetaPro.php ← OVERRIDES ProductMeta
│                                        │   ├── SingleProduct.php
│                                        │   ├── SingleProductPro.php ← OVERRIDES SingleProduct
│                                        │   └── ProductsPro.php ← PRO ONLY (shop listings)
├── Helper/                              ├── Helper/
│   ├── Block.php                        │   ├── Block.php
│   └── Utils.php                        │   ├── Utils.php
│                                        │   └── ModuleManager.php ← PRO ONLY
├── Addons/                              ├── Addons/
│   ├── Addons.php                       │   ├── AddonsPro.php ← PRO ONLY (Elementor)
│   ├── Blocks.php                       │   ├── Blocks.php (+ preset block reg)
│   ├── Controls/                        │   ├── Controls/
│   ├── BP3DProductModel.php             │   ├── BP3DProductModel.php
│   └── ModelViewer.php                  │   └── ModelViewer.php (Elementor widget, larger)
│                                        ├── Template/ ← PRO ONLY
│                                        │   ├── ModelViewer.php
│                                        │   └── fullscreen_buttons.php
│                                        └── templates/ ← PRO ONLY

src/                                     src/
├── blocks/3d-viewer/                    ├── blocks/3d-viewer/
│   ├── block.json (3KB)                 │   ├── block.json (5KB, more attributes)
│   ├── types.ts (2KB)                   │   ├── types.ts (3KB, more fields)
│   └── Components/                      │   └── Components/
│       ├── Common/                      │       ├── Common/
│       │   ├── Basic3DViewer.tsx (5.6K)│       │   ├── Basic3DViewer.tsx (10.5K)
│       │   ├── ModelViewer.tsx (5K)      │       │   ├── ModelViewer.tsx (15K)
│       │   ├── Viewer.tsx (4.4K)        │       │   ├── Viewer.tsx (7.8K)
│       │   ├── FrontEnd.tsx             │       │   ├── FrontEnd.tsx
│       │   ├── Style.tsx                │       │   ├── Style.tsx
│       │   ├── icons.tsx                │       │   ├── icons.tsx
│       │   └── ShopLoopItemComponents   │       │   ├── ShopLoopItemComponents.tsx
│       │                                │       │   ├── ARQRCode.tsx ← PRO ONLY
│       │                                │       │   ├── ClicpboardButton.tsx ← PRO ONLY
│       │                                │       │   ├── Hotspots.tsx ← PRO ONLY
│       │                                │       │   ├── ModelPagination.tsx ← PRO ONLY
│       │                                │       │   └── SliderControllder.tsx ← PRO ONLY
│       └── Backend/                     │       └── Backend/
│           ├── Edit.tsx (2.7K)          │           ├── Edit.tsx (4K)
│           ├── settings.tsx (3.2K)      │           ├── settings.tsx (5K)
│           └── Tabs/                    │           ├── ProModal.tsx ← PRO ONLY
│                                        │           ├── Upgrade.tsx ← PRO ONLY
│                                        │           ├── VisualEditorSettings.tsx ← PRO
│                                        │           └── Tabs/
│                                        ├── blocks/preset/ ← PRO ONLY (entire block)
├── public/                              ├── public/
│   ├── index.tsx (7.5K)                 │   ├── index.tsx (7.6K)
│   ├── manageAttributes.ts (1.7K)       │   ├── manageAttributes.ts (8.5K)
│   ├── frontend.tsx (2.6K)              │   ├── frontend.tsx (2.2K)
│   └── Components/                      │   └── Components/
│       ├── FrontEnd.tsx (1.6K)          │       ├── FrontEnd.tsx (1.8K)
│       └── Product3DViewer.tsx (3.3K)   │       └── Product3DViewer.tsx (3.4K)
├── utils.ts (11K)                       ├── utils.ts (15.6K, +texture/material APIs)
```

---

## 12. Extension Manager

Both plugins use **bp-extension-manager (BPEM)** for extension support:
- Free: `vendor/bp-extension-manager/` with `bundled_modules_dir => __DIR__ . '/modules'`
- Pro: `lib/bp-extension-manager/` without bundled modules dir

---

> [!IMPORTANT]
> When porting features, always check both the PHP backend (CSF fields → shortcode data → render) AND the TypeScript/React frontend (types → manageAttributes → component). A feature is incomplete if only one side is implemented.

> [!TIP]
> Start with 🟢 Easy features (Auto Rotate, Autoplay, Shadow) to validate the porting workflow before tackling complex features.
