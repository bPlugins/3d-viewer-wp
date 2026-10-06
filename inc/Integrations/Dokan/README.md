# Dokan module

Lets Dokan vendors add a 3D model to their own products from the Dokan dashboard: a GLB model, a poster image, an optional USDZ file for iOS AR, an AR switch, the viewer position and the background color (transparent or a solid hex color only, since it is rendered into CSS; an admin-set value the vendor UI cannot show, such as rgba, stays read-only). It works in both Dokan product editors (classic and the React editor in Dokan Lite 5.0.16+).

The module is **off by default**. When Dokan is active the owner gets a "Marketplace (Dokan)" screen under 3D Viewer; nothing reaches vendors until "Allow vendors to add 3D models" is switched on there.

## Files

| File | Role |
|---|---|
| `Dokan.php` | Bootstrap. Boots on `dokan_loaded`, registers the owner screen, then (only when enabled) the editor hooks and the dashboard script. |
| `VendorPolicy.php` | Who may author, which fields, size cap, default position. Honours restrictions saved by 3D Viewer Pro until the owner picks "Use free defaults". |
| `VendorModel.php` | The only writer of vendor 3D data. Envelope check, lock reasons, attachment checks, pure `merge()`, `plan()`/`commit()`. |
| `ClassicForm.php` | Section in the classic editor (`dokan_product_edit_after_inventory_variants`), saved on `dokan_process_product_meta`. |
| `ProductEditor.php` | Card and field in the React editor; validates on `dokan_rest_pre_insert_product_object`, writes on `woocommerce_rest_insert_product_object`. |
| `Settings.php` | Owner screen (Codestar), option `bp3d_dokan_settings`. |

JS and styles live in `src/integrations/dokan/` and build to `build/dokan-vendor.js|.css`.

## Hook-in points

1. `inc/Init.php`: the `Integrations\Dokan\Dokan::class` line in `get_services()`.
2. `webpack.config.js`: the `dokan-vendor` entry.
3. `src/integrations/dokan/` (client code).
4. This folder.

## Removing the module

1. Delete the `Integrations\Dokan\Dokan::class` line from `inc/Init.php`.
2. Delete the `dokan-vendor` entry from `webpack.config.js`.
3. Delete `inc/Integrations/Dokan/` and `src/integrations/dokan/`.
4. Rebuild (`npm run build`).

Stored data keeps rendering after removal; nothing is deleted.
The `bp3d_dokan_settings` option stays in the database but has no effect without the module (core's vendor upload restrictions switch off with it).

## Data written

- `_bp3d_product_` (post meta): row-0 `model_src`, `poster_src`, `model_iso_src`, `enable_ar`; top-level `viewer_position` and `bp_model_bg`; Codestar defaults when row 0 is created; `currentViewer` only if absent; existing flat `bp3d_model_src` / `bp3d_poster_src` kept in sync. Every other key is left untouched.
- `_bp3d_vendor_written`, `_bp3d_vendor_published_once` (post meta, `'1'`; the latter also set when a vendor product goes live or leaves live status).
- `bp3d_dokan_settings` (option, written only by the owner screen).
- `bp3d_dokan_field_stripped` (transient, owner notice when Dokan drops the React field).

Action `bp3d_dokan_vendor_model_saved( $product_id, $changed_keys )` fires after each vendor write.

## Core helpers used

Only `BP3D\Base\Marketplace` and `BP3D\Base\VendorUploadGuard` (always loaded, independent of this module), plus the `BP3D_DIR`, `BP3D_PATH` and `BP3D_VERSION` constants. Core never calls into this folder.
