# Free plugin: fixes to port from Premium 2.1.0

Written 1 Nov 2026. Premium baseline: the 2.0.0 that shipped (`aab3e81`) through the 2.1.0 working tree. Each item below was checked against this repo's current code (`main`, `7e198dd` plus uncommitted work), and free still lacks every one.

Premium paths are relative to `3d-viewer-premium/`. Free paths are relative to this repo.

## Port

### 1. Lite viewer poster is anchored to the top-left

- **Bug:** a poster whose shape differs from the viewer crops from the top-left. The Advanced viewer and the mobile image already centre theirs.
- **Free:** `src/blocks/3d-viewer/style.scss:118-125` (`#default-poster`) has no `background-position`.
- **Premium:** `src/blocks/3d-viewer/style.scss:454-462`
- **Fix:** add `background-position: center;` to `#default-poster`.
- **Note:** this is a visible change on existing sites. Ship it only if Premium 2.1.0 ships it (gate item H1a, waiting on Raju's sign-off).
- **Changelog:** `* Fixed: The Lite viewer poster is now centred like the Advanced viewer and mobile image posters, instead of anchored to the top-left.`

### 2. Advanced Viewer shrinks to a small bordered box on Tailwind pages

- **Bug:** the OV container carries Tailwind utility class names. On any page that loads Tailwind CSS, they become real styles: 18rem × 18rem with a black border.
- **Free:** `src/blocks/3d-viewer/Components/Common/Basic3DViewer.tsx:148`, the classes `relative flex flex-col items-center justify-center p-2 h-72 w-72 border-2 border-black rounded-sm`.
- **Premium:** `src/blocks/3d-viewer/Components/Common/Basic3DViewer.tsx:207`
- **Fix:** keep only the real classes:
  ```tsx
  className={`${(mouseControl && (!isBackend || hovered)) ? "" : "DMC"} ${viewerRef.current?.modelLoader?.inProgress} online_3d_viewer`}
  ```
- **Check:** look at the Advanced Viewer in the block editor and on the front end without Tailwind. `.online_3d_viewer` must already size the box by itself (it does in Premium).
- **Changelog:** `* Fixed: On pages that load Tailwind CSS, the Advanced Viewer could shrink to a small bordered box.`

### 3. New WooCommerce products start on "Show 3D on First Image"

- **Change:** a product with no `_bp3d_product_` meta yet (new, imported, or created before the plugin) now defaults to `merge_with_first_image` instead of `none`. A product that already has meta keeps `none`, so saved products don't change.
- **Free:** `inc/Woocommerce/ProductMeta.php:185` has `'default' => 'none'`. `getFields()` reads the raw meta only in the `else` branch (`:76`), so read it once at the top.
- **Premium:** `inc/Woocommerce/ProductMeta.php:173-174`, `:294`
- **Fix:**
  ```php
  $raw_meta = get_post_meta($post_id, '_bp3d_product_', true);
  $raw_meta = is_array($raw_meta) ? $raw_meta : [];
  // ...
  // Products that already have 3D meta keep the old None fallback; only a product without any starts on the first gallery image.
  'default' => $raw_meta ? 'none' : 'merge_with_first_image',
  ```
- **Why free needs it too:** both plugins write the same key. Without the port, the same new product gets a different position depending on which plugin saved it.
- **Changelog:** `* Improvement: New WooCommerce products start on the Show 3D on First Image of Woocommerce Gallery viewer position instead of None; saved products keep theirs.`

### 4. Advanced Viewer: switching models can report the old load

- **Bug:** when a model is switched while the previous one is still loading, the old OV instance finishes later. It can then report "loaded" for the new model, and its progress text can show briefly.
- **Free:** `src/blocks/3d-viewer/Components/Common/Basic3DViewer.tsx:84-97`. The old status nodes are already hidden instead of removed, which stops the throw, but the old instance still holds its callbacks.
- **Premium:** `src/blocks/3d-viewer/Components/Common/Basic3DViewer.tsx:108-122`. In cleanup it moves the leftover OV nodes into a detached `div`, sets `old.parentElement = sink`, and sets `old.parameters = {}` so the old load has nobody to report to.
- **Fix:** port the `parentElement` and `parameters` lines. Keeping free's hide-instead-of-remove is fine.
- **Check first:** reproduce it in free (a large model, then switch models before it finishes). Free's effect is structured differently from Premium's.
- **Changelog:** `* Fixed: Switching models in the Advanced Viewer could show the previous model's loading text.`

### 5. Block inspector number boxes run past the panel edge

- **Bug:** theme admin CSS that widens inputs pushes the range control's number box outside the inspector.
- **Free:** `src/blocks/3d-viewer/editor.scss` has no rule for it. Free's `Style.tsx` and `Options.tsx` use range controls inside `.bPlPanelBody`.
- **Premium:** `src/blocks/3d-viewer/editor.scss:539-545`
- **Fix:**
  ```scss
  // Theme admin CSS that widens inputs (min-width, padding) must not push the range number box past the panel edge.
  .bPlPanelBody .components-range-control__number .components-input-control__input {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  ```
- **Changelog:** `* Fixed: Theme admin CSS could push number boxes past the block inspector edge.`

## Optional

### 6. Block editor help tooltips

- **Premium:** `src/components/InfoTip.tsx` and `InfoTip.scss` (new), with `src/components/Label.tsx` switched to them. Help text wraps into a compact card instead of one screen-wide line, and opens with the keyboard or a tap.
- **Free:** `src/components/Label.tsx` still uses `<Tooltip>`.
- This is an improvement, not a bug fix. Port it if free's inspector has long help strings.

## Already in free (no action)

- Spinner stays after a failed load: free `ModelViewer.tsx:90-100` already clears it on `loadfailure`.
- Double-extension uploads (`model.php.glb`): free `inc/Base/ExtendMimeType.php:123-144` already returns `$reject`.
- Lapsed-licence save with an empty or scalar `bp3d_models`: free's `preserveProData` only writes row 0 when it is an array, so there is no string-offset fatal.
- REST meta guard module gate: already applied in both repos on 24 Oct.

## Not applicable to free (Pro-only code)

These Premium 2.1.0 fixes live in code free doesn't have:

- WooCommerce variation mapping (`src/utils/woocommerce.ts`, `useVariations.ts`)
- the hotspot popup closing on auto-rotate (`HotspotCard.tsx`)
- the model-change hotspot prompt (`confirmModelChange.ts` and the Classic, Modern, block and Elementor guards)
- the Classic save dropping the flat `bp3d_model_src` (`ProductMetaPro.php`)
- Blocksy image popups (`getClickAbleDom.ts`)
- first-image thumbnails and the popup overlap (multiple models, popups)
- dimension labels outside the viewer (`Dimensions.tsx`, the Ruler)
- product initial-view and popup shape errors (`Product.php`)
- the hotspot editor popup translations
- exploded view, thumb strip size and position, and the placement widget

Auto Rotate's new-install default (`inc/Field/Settings.php` `bp_3d_rotate`) has no field in free's Settings, so there is nothing to change.

## Not covered by this list

- Free's Dokan (`src/integrations/dokan/`) and FluentCart (uncommitted `src/integrations/fluentcart/`, `inc/Integrations/FluentCart/`) code was not compared with Premium's modules.
- This file lives in the repo root. `npm run zip` uses an explicit file list, so it never ships. The old `gulpfile.js` zip takes `**/*` and would include it.
