# FluentCart integration plan

Status: proposed, not started. Branch: `feature/fluentcart`. Written 18 October 2026 against FluentCart 2.2.0 and 3D Viewer 2.0.0 (`7e198dd`).

Goal: a FluentCart store owner can attach a 3D model to a FluentCart product and have it show on the product page, with the same free-tier feature set the WooCommerce integration offers (one model, poster, position, background). Nothing about the WooCommerce integration or stored data changes.

---

## 1. What FluentCart gives us

Verified by reading `wp-content/plugins/fluent-cart` (2.2.0). Hook names are also listed in the public docs at https://dev.fluentcart.com/hooks/actions.html and https://dev.fluentcart.com/hooks/filters.html.

### Data model

| Thing | Where | Notes |
|---|---|---|
| Product | `wp_posts`, post type `fluent-products` | `custom-fields` supported, so `get_post_meta()` / `update_post_meta()` work. `FluentCart\App\Models\Product` is an ORM model over `wp_posts`. |
| Product detail | `wp_fct_product_details` | One row per product. `other_info` is a JSON column that is `array_merge`d on save (`ProductDetailResource::update()`), so foreign keys survive. FluentPlayer stores its video config here. |
| Variants | `wp_fct_product_variations` | `other_info` JSON per variant. Per-variant media lives on the variant (`variant['media']`). |
| Gallery images | post meta `fluent-products-gallery-image` | Array of `[ 'url', 'id', 'title' ]` rows. |
| Product meta table | `wp_fct_product_meta` | FluentCart's own key/value table. Not needed by us. |

### Admin editor

The product editor is a Vue 3 single page app at `admin.php?page=fluent-cart#/products/{id}`. There is no `add_meta_box()` surface.

Extension points, in order of usefulness to us:

1. `fluent_cart/product_admin_items` (filter, `AdminHelper.php`): adds an item to the product header menu (Edit Product, Upgrade Paths, Integrations). Each item is `['label' => …, 'link' => …]`. The link can be any admin URL. **Lowest cost path to a native-looking entry point.**
2. `fluent_cart/loading_app` (action, `MenuHandler.php`): fires before the SPA scripts are registered. Add-ons enqueue their admin bundle here, depending on `fluent_cart_global_admin_hooks`.
3. `window.fluent_cart_admin.hooks` (a `@wordpress/hooks` instance). The Product Gallery dialog runs `applyFilters('fluent_cart_product_gallery_tabs', [], context)`. A tab is `{ name, label, component (Vue), props, seed(product), commit(value, {product, productEditModel}), badge, previews, items, applyOrder, removeItem }`. `commit` calls `productEditModel.onChangeInputField(key, value)`, which lands in `detail.other_info[key]` on the next Update. FluentPlayer's Video tab (`app/Modules/FluentPlayer/*` and `assets/chunks/fluent-player-gallery.js`) is a complete worked example.
4. `fluent_cart/admin/module_import_map` (filter): the SPA prints an import map so add-on ES modules import `@fluent-cart/vue`, `@fluent-cart/ui`, `@fluent-cart/dayjs`, `@fluent-cart/echarts` instead of bundling their own Vue. `FLUENTCART_MODULE_API` (currently `1`) versions that surface.
5. `fluent_cart/admin_app_data` (filter): adds keys to the `fluentCartAdminApp` localized object.
6. `fluent_cart/product/get_response_data` (filter): adds keys to the product payload the editor loads.
7. `fluent_cart/show_standalone_product_menu` (filter): re-enables the classic `post.php` screen for products. A normal metabox works there. Emergency fallback only; it changes the owner's whole admin experience.

### Save path

- Full save: `POST products/{id}` → `ProductController::update()` → `ProductUpdateRequest` (rule `detail.other_info` is `nullable|array`, unknown keys pass) → `ProductResource::update()` → `ProductDetailResource::update()` merges `other_info`. Fires `fluent_cart/product_updated` with `['data' => sanitized payload, 'product' => model]`.
- Partial save (title/status only): `ProductResource::partialUpdate()`, whitelist of post fields. Also fires `fluent_cart/product_updated`.
- Duplicate: `fluent_cart/product_duplicated` after post meta is copied.
- Variants: `fluent_cart/product/variants_updated` `['post_id', 'variants']`.

### Storefront

- Block themes: FluentCart registers the `single-fluent-products` block template (`ProductPageTemplate.php`). The gallery is the `fluent-cart/product-gallery` block (`ProductGalleryBlockEditor::render()`), which calls `ProductRenderer::renderGallery()`.
- Classic themes: `TemplateLoader::initUnsupportedTheme()` → `TemplateActions::filterSingleProductContent()` on `the_content` (priority 999) renders `ProductRenderer::render()`, which also calls `renderGallery()`. Theme templates `single-fluent-products.php` are honoured via `fluent_cart/template_loader_files`.
- Shortcode `[fluent_cart_single_product id=…]` and the Bricks element `fct-product-gallery` both end in `renderGallery()`. FluentCart also ships Elementor and Divi widgets (`assets/images/elementor`, `assets/images/divi`).
- Gallery markup (`ProductRenderer::renderGallery()`, lines 373 to 770):

  ```html
  <div class="fct-product-gallery-wrapper thumb-pos-bottom thumb-mode-all"
       data-fct-product-gallery data-fluent-cart-product-gallery-wrapper data-product-id="123">
    <div class="fct-product-gallery-thumb" role="region">
      <img data-fluent-cart-single-product-page-product-thumbnail …>
      <!-- hidden video players, one per video -->
      <div class="fct-product-gallery-video is-active?" data-fct-product-gallery-video data-fct-video-media-id="45">…</div>
    </div>
    <div class="fct-gallery-thumb-controls" data-fluent-cart-single-product-page-product-thumbnail-controls
         data-all-gallery-images="[…]" data-variant-first-media-map="{…}">
      <button class="fct-gallery-thumb-control-button fct-gallery-video-thumb" data-fluent-cart-thumb-control-button
              data-variation-id="0" data-fct-video-media-id="45">…</button>
      <button class="fct-gallery-thumb-control-button" data-fluent-cart-thumb-control-button data-variation-id="0">…</button>
    </div>
  </div>
  ```

- Gallery JS (`assets/SingleProduct.js`, class `FluentCartImageGallery`): a thumb with `data-fct-video-media-id` toggles `.is-video-active` on `.fct-product-gallery-thumb` and `.is-active` on the matching `.fct-product-gallery-video`; an image thumb removes both. Lightbox and "see more" skip `[data-fct-video-media-id]` thumbs. Variation changes dispatch `fluentCartSingleProductVariationChanged` `{ productId, variationId }` on `window`.
- There is no PHP action inside the gallery. Hooks around it: `render_block` (block themes), `fluent_cart/product/show_image` and `fluent_cart/product/show_section` (RenderGate, hides the gallery), `fluent_cart/product/render_product_header` and `fluent_cart/product/after_product_content` (classic themes), `fluent_cart/product/single/before_title_block`.
- Assets: `AssetLoader::loadSingleProductAssets()`; `fluent_cart/frontend_assets/should_load_global`.

---

## 2. Scope

### In scope (free, first release)

- One model per product, poster, viewer position (`none`, `top`, `bottom`, `replace`, `thumb` = a slot in the FluentCart thumbnail strip), background colour. Same fields as `inc/Woocommerce/ProductMeta.php`.
- Rendering on block themes, classic themes, the single product shortcode, and the Bricks gallery element (all go through `renderGallery()`).
- `[3d_viewer_product id="…"]` accepting a `fluent-products` ID.
- A FluentCart switch in Settings, default on, mirroring `3d_woo_switcher`.
- Product duplication carries the model (post meta is copied by FluentCart).

### Out of scope (later, mostly Pro)

- Per-variant models driven by `fluentCartSingleProductVariationChanged`.
- Multiple models per product, tab layout, hotspots, dimensions, AR for FluentCart.
- FluentCart Pro advanced variations (`fluent_cart/product/gallery_variation_data`).
- A new Elementor or Bricks widget of our own (the Elementor-follows-Gutenberg rule applies; we have no FluentCart block).
- Shop grid / product card (`fluent_cart/product/group/*`).

---

## 3. Architecture

Follow the Dokan module layout (`inc/Integrations/Dokan/README.md`): an isolated folder, booted by one line in `Init::get_services()`, removable without touching stored data.

```
inc/Integrations/FluentCart/
  FluentCart.php      bootstrap; boots on fluent_cart_loaded (or at once if did_action)
  Compat.php          version gate (>= 2.2.0), feature detection for each hook/class used
  ProductModel.php    read/normalise `_bp3d_product_` for a fluent-products ID; attribute builder
  Storefront.php      render_block wrap, classic-theme hooks, slot/top/bottom/replace, asset enqueue
  AdminPage.php       "3D Model" screen (bfields) reached from the product header menu
  Rest.php            REST route for the admin page save (nonce + edit_post)
  Settings.php        the FluentCart section on the 3D Viewer Settings page
  README.md           same shape as the Dokan README
src/integrations/fluentcart/
  storefront.ts       thumb slot behaviour, sizing, variation event (free: no-op)
  admin.tsx           admin page glue (bfields renders the form; this handles save + preview)
  style.scss
```

Webpack entries: `fluentcart-storefront`, `fluentcart-admin`. Build outputs `build/fluentcart-*.js|css`. Add them to the zip (unlike Dokan, this ships).

### Boot sequence

1. `Init::get_services()` lists `Integrations\FluentCart\FluentCart::class`.
2. `FluentCart::register()` returns early unless `defined('FLUENTCART_VERSION')` and `Compat::ok()`.
3. On `fluent_cart_loaded` (or immediately if it already fired): register Settings section; if the switch is on, register `AdminPage`, `Rest`, `Storefront`.
4. Nothing is output for a product whose meta has no model source.

### Data

Store in post meta `_bp3d_product_`, the same key and shape as the WooCommerce integration (`bp3d_model_src`, `bp3d_poster_src`, `viewer_position`, `bp_model_bg`, `currentViewer`, and row 0 of `bp3d_models` when present). Reasons:

- `Utils::getPostMeta()`, `ProductMeta::preserveProData()` semantics, Pro's media-array format and the Dokan `VendorModel::merge()` rules all already target this shape.
- Pro can later extend the FluentCart product the way it extends the Woo product, without a second storage format.
- FluentCart duplicates post meta on product duplication.

Do not write to `fct_product_details.other_info` in phase 1. If phase 2 (native gallery tab) needs `commit()` to flow through FluentCart's own Update button, store only a pointer or the same array under `other_info['bp3d']` and keep post meta as the source of truth, synced on `fluent_cart/product_updated`.

Position values for FluentCart: reuse `none`, `top`, `bottom`, `replace`; add `thumb` (FluentCart has no "first image" to merge with, the thumbnail strip is the equivalent). Store it in the same `viewer_position` key; the Woo code never sees FluentCart products, so the extra value is harmless, but `ProductMeta::preserveProData()`'s `$free_positions` list must not be reused for FluentCart saves.

---

## 4. Admin UI

### Phase 1: product menu link to our own page

- Filter `fluent_cart/product_admin_items`: append `'bp3d_model' => ['label' => __('3D Model', '3d-viewer'), 'link' => admin_url('admin.php?page=bp3d-fluentcart-model&product=' . $productId)]`. Only when the current user can `edit_post` the product.
- Register a hidden submenu page (`add_submenu_page` with parent `null` or under `edit.php?post_type=bp3d-model-viewer` with `menu_hidden`) that renders a bfields form via `Registrar::createMetabox()`-style schema, or a small dedicated React screen if bfields' options-page mode cannot bind to a post ID. Check `lib/bfields/php/includes/Metabox.php` and `OptionsPage.php` for a post-bound page mode first.
- Fields: identical to `ProductMeta::getFields()` minus the WooCommerce wording. Position options: None, Thumbnail slot (recommended), Top of gallery, Bottom of gallery, Replace gallery.
- Save: `POST /bp3d/v1/fluentcart/product/{id}` with `X-WP-Nonce`, capability `edit_post`, `Marketplace`/`VendorUploadGuard` attachment checks for the chosen files (owner of the file, allowed mime). Merge into existing `_bp3d_product_` the way `ProductMeta::preserveProData()` does: declared keys overwrite, everything else is kept.
- Show the FluentCart product header (`fluent_cart/admin_menu` renders it on taxonomy pages; `AdminHelper::renderProductHeader()` or the `admin.admin_product_menu` view) above our form so the page feels native. If that view is not reusable, add a back link to the product.
- Preview: reuse `src/admin/preview` for a live model preview.

### Phase 2 (optional): native gallery tab

- Enqueue an ES module bundle on `fluent_cart/loading_app` with dependency `fluent_cart_global_admin_hooks`. It must be built as an ES module importing `@fluent-cart/vue` from the import map; our wp-scripts toolchain outputs classic scripts, so this needs a separate webpack `experiments.outputModule` config or a tiny hand-written module that mounts our React form inside a Vue wrapper component.
- `addFilter('fluent_cart_product_gallery_tabs', '3d-viewer/model', tabs => [...tabs, tab])` where `tab.component` is a Vue component whose `mounted()` creates a React root rendering the same form as phase 1; `seed` reads `product.detail.other_info.bp3d` or fetches our REST read endpoint; `commit` posts to our REST endpoint (post meta stays canonical) and may also call `onChangeInputField('bp3d', …)` for the badge.
- `items`/`previews` can return `{ kind: 'model', url: poster, title }` so the model appears in the gallery order list and the admin can drag it in front of images (that is how FluentPlayer positions videos). Reading `position` back gives the thumb-slot order.
- Gate on `FLUENTCART_MODULE_API === 1`; if FluentCart bumps it, fall back to phase 1 only.

---

## 5. Storefront rendering

All paths call `ProductRenderer::renderGallery()`, so hook the output rather than the template.

### Block themes and the gallery block

- `render_block_fluent-cart/product-gallery` filter (WordPress core `render_block_{name}`): receives the gallery HTML and `$block`. Resolve the product via `fluent_cart_get_current_product()` or `$block['attrs']['product_id']`. If the product has a model:
  - `replace`: return our viewer markup instead of the gallery HTML (or keep the gallery and hide it with `fluent_cart/product/show_image` returning `false`, then print ours from the same filter).
  - `top` / `bottom`: wrap: `viewer + gallery` or `gallery + viewer` inside `<div class="bp3d-fct-gallery position_top">`.
  - `thumb`: inject into the HTML with `WP_HTML_Tag_Processor` or a guarded DOMDocument pass: add a `<button class="fct-gallery-thumb-control-button bp3d-fct-thumb" data-fluent-cart-thumb-control-button data-variation-id="0" data-bp3d-model>` to `.fct-gallery-thumb-controls` and a hidden `<div class="bp3d-fct-slot" data-bp3d-slot>` next to the main `<img>` inside `.fct-product-gallery-thumb`. Our JS toggles the slot on click and deactivates it when FluentCart activates an image or video (listen for clicks on other thumbs and for `fluentCartSingleProductVariationChanged`). Do not use `data-fct-video-media-id`; FluentCart's script would look for a `media-player` element.
- Always `wp_enqueue_script('bp3d-public')`, `wp_enqueue_style('bp3d-frontend')`, and the viewer library the product uses, exactly as `Woocommerce\Product::get_3d_model_html()` does.

### Classic themes

- `TemplateActions::filterSingleProductContent()` builds the whole page HTML from `ProductRenderer::render()`. Filter `the_content` at priority 1000 on `is_singular('fluent-products')` and apply the same wrap/inject logic to the `.fct-product-gallery-wrapper` fragment. `fluent_cart/product/render_product_header` is a fallback placement if the gallery cannot be found (emit the viewer above the content, like the Woo incompatible-theme path).
- Theme-provided `single-fluent-products.php` templates that call the shortcode or `renderGallery()` directly are covered by the same `the_content` / output approach only if they go through `the_content`; otherwise document the `[3d_viewer_product]` shortcode for theme authors.

### Shortcode and Bricks

- `[fluent_cart_single_product]` runs `ProductRenderer::render()` inside the shortcode; wrap it with `pre_do_shortcode_tag` / `do_shortcode_tag` filters for `fluent_cart_single_product` to run the same injector.
- Bricks `fct-product-gallery` element: hook `bricks/element/render` (or `bricks/frontend/render_element`) for that element name and inject the same way. Low priority; verify Bricks is available for testing first.

### Attribute builder

`ProductModel::attributes(int $productId): array` mirrors `Woocommerce\Product::getProductAttributes()` but takes an ID, sets `'placement' => 'fluentcart-gallery'`, `'fluentcart' => true`, `'position' => …`, and does not read `global $product`. Apply a new filter `bp3d_fluentcart_model_attribute` (parallel to `bp3d_woocommerce_model_attribute`) for Pro.

### Frontend JS

- `src/public/frontend.tsx`: add the `fluentcart-gallery` placement; mount into `[data-bp3d-slot]` or the wrapper. Size the viewer to `.fct-product-gallery-thumb`'s box the way `Product3DViewer.tsx` sizes to `.woocommerce-product-gallery__image`.
- `src/utils/manageIncompatibleTheme.tsx`: add `{ selector: '.fct-product-gallery-wrapper', images: '.fct-product-gallery-thumb' }` to `FALLBACK_GALLERIES` so the existing top/bottom/replace DOM logic can be reused when server-side injection is not possible.
- Hide FluentCart's zoom (`xzoom`) while the 3D slot is active: add a class on the wrapper and a CSS rule.

---

## 6. Settings

Add a "FluentCart" section to `inc/Field/Settings.php` (both interfaces, via `Registrar`), shown only when FluentCart is active:

- `3d_fluentcart_switcher` (switch, default on).
- Nothing else in the first release; loading, zoom and camera control reuse the existing global keys (`bp_3d_loading`, `bp_3d_zooming`, `bp_camera_control`) so behaviour matches Woo.

Rename the existing "Woocommerce Settings" section title to "WooCommerce" and keep its ID; add a one-line note that the FluentCart section applies to FluentCart products. When both carts are active FluentCart itself relabels its product type "Product (FluentCart)", so our labels must always say which cart they mean.

---

## 7. Compatibility and safety

- **Old users:** no stored data changes; the module boots only when FluentCart is active and outputs nothing until a product has a model. New setting defaults preserve previous behaviour (nothing rendered before, nothing rendered until configured).
- **WooCommerce:** no edits to `inc/Woocommerce/*`, `Shortcode::renderProductModelViewer()` gets a sibling branch for `fluent-products`, not a change to the `product` branch. Both carts active is a supported state.
- **Pro:** Premium keys on post type `product` throughout (`inc/Woocommerce/ProductMetaPro.php`, `ShortcodePro.php`, `HotspotFields.php`). It ignores FluentCart products until it adds its own FluentCart layer; the `bp3d_fluentcart_model_attribute` filter and the shared meta shape are its entry points. Make sure free's FluentCart admin page shows Pro-only stored values read-only, like `ProductMeta` does.
- **FluentCart version drift:** pin `FLUENTCART_VERSION >= 2.2.0`; feature-detect each hook (`has_filter` is not enough, check classes/methods like `FluentPlayerBridge` does); fail closed to "no output" with a `WP_DEBUG` log line. Gallery DOM selectors are not a stable API; keep them in one place (`Storefront::SELECTORS`) and cover them in e2e.
- **Security:** REST save checks nonce, `edit_post`, post type, and attachment ownership (`Marketplace::isAttachmentOwnedBy` or equivalent) and allowed mime (`Utils::getAllowedMimeTypes()`); escape all output (`esc_attr(wp_json_encode())` for the data attribute, as today); no `the_content` filter on non-product singulars.
- **Uninstall:** `uninstall.php` already removes `_bp3d_product_` when "Delete data on uninstall" is on; FluentCart products are covered by the same meta key. Add the new option key to the uninstall list.

---

## 8. Build, QA, release

- `npm install --legacy-peer-deps`, `npx wp-scripts build`; two new entries; `npm run zip` includes `build/fluentcart-*`.
- E2E (Playwright, `tests/e2e`): new `17-fluentcart.spec.ts` covering Settings switch, admin page save (capture/restore raw meta like `15-dokan-settings.spec.ts`), storefront render in `thumb`, `top`, `replace` on a block theme and a classic theme, shortcode render, Woo product page unchanged (`07-woocommerce.spec.ts` keeps passing), product duplication keeps the model. Seed a FluentCart product with `wp eval` via `FluentCart\Api\Resource\ProductResource::create()`; none exist on dev.local today.
- Manual: Twenty Twenty-Five (block), Astra or Storefront (classic), shop quick-view modal (gallery renders via AJAX; FluentPlayer deliberately skips players there, we should skip the viewer too), lightbox, "see more" thumbs, variation switching, mobile widths.
- readme.txt: feature bullet, "Embed in a FluentCart product" how-to, FAQ "Does 3D Viewer work with FluentCart?", tag `fluentcart`, terse changelog line `* New: FluentCart product pages show a 3D model (thumbnail slot, top, bottom or replace).`
- Run the free release gate (bp3d-release-reviewer) before tagging.

---

## 9. Effort

| Work | Days |
|---|---|
| Module skeleton, Compat, Settings section, Init wiring | 1 |
| AdminPage (bfields) + REST save + product menu link | 2 |
| ProductModel attributes + Storefront injection (block, classic, shortcode) + frontend JS placement | 3 |
| `[3d_viewer_product]` for fluent-products, Bricks hook | 0.5 |
| E2E spec, manual QA on two themes, fixes | 1.5 |
| readme, release gate | 0.5 |
| **Phase 1 total** | **8.5** |
| Phase 2 native gallery tab (ES module build, Vue wrapper, seed/commit/items) | 3 to 4 |

---

## 10. Open decisions

1. Ship phase 1 only, or include the native gallery tab in the first release.
2. Target version: 2.1.0 after the 2.0.0 gate closes.
3. Whether `thumb` should be the default position for FluentCart (recommended, it matches how FluentCart adds video) or `none` like Woo.

---

## 11. Reference: FluentCart source locations (2.2.0)

| Topic | File |
|---|---|
| Post type, taxonomies, classic editor gate | `app/CPT/FluentProducts.php` |
| Product header menu filter | `app/Helpers/AdminHelper.php` (`fluent_cart/product_admin_items`) |
| Admin SPA enqueue, `loading_app`, `admin_app_data`, `admin_js_loaded` | `app/Hooks/Handlers/MenuHandler.php` |
| Import map for add-on modules | `app/Hooks/Handlers/ModuleImportMap.php` |
| Gallery tab example (PHP) | `app/Modules/FluentPlayer/FluentPlayerAdminAssets.php`, `ProductVideoSettings.php`, `ProductVideoRenderer.php` |
| Gallery tab example (JS) | `assets/chunks/fluent-player-gallery.js`, `assets/chunks/galleryTabs.js` |
| Gallery markup | `app/Services/Renderer/ProductRenderer.php` `renderGallery()`, `renderGalleryThumb()`, `renderGalleryThumbControls()` |
| Section visibility | `app/Services/Renderer/RenderGate.php` |
| Gallery block | `app/Hooks/Handlers/BlockEditors/ProductGalleryBlockEditor.php` |
| Block template | `app/Modules/Templating/BlockTemplates/ProductPageTemplate.php` |
| Classic theme rendering | `app/Modules/Templating/TemplateLoader.php`, `TemplateActions.php` |
| Shortcode | `app/Hooks/Handlers/ShortCodes/SingleProductShortCode.php` |
| Bricks element | `app/Modules/Templating/Bricks/Elements/ProductGallery.php` |
| Save path | `app/Http/Controllers/ProductController.php`, `app/Http/Requests/ProductUpdateRequest.php`, `api/Resource/ProductResource.php`, `api/Resource/ProductDetailResource.php` |
| Storefront gallery JS | `assets/SingleProduct.js` (`FluentCartImageGallery`) |
| Current product helper | `boot/globals.php` `fluent_cart_get_current_product()` |
