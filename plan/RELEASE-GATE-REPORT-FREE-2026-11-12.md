# Release gate: 3D Viewer FREE, next release (2.2.0 proposed). 12 Nov 2026

## 1. Verdict

**SHIP WITH FIXES**, as long as Raju signs off S1–S4 below. If he rejects S1–S3, they count as BLOCKERS under rule 2, because they change how existing viewers look.

- **Baseline:** tag `v2.1.0` (= HEAD `54faac1`, `Stable tag: 2.1.0`).
- **Under review:** the working tree. 39 tracked files are modified and none are untracked (`git diff v2.1.0 --stat`: 837+/663−).
- **Repo:** `/Users/raju/Local Sites/dev/app/public/wp-content/plugins/3d-viewer` (branch `main`).

Rules 1 and 3:
- No saved data is lost.
- No PHP read or write path changed.
- No `block.json` or default changed.
- No PHP syntax errors on 7.4, 8.4 or 8.5.

Every finding is about release hygiene, readme accuracy, or an intentional visual change.

## 2. Must-fix (HIGH) and risks (MEDIUM)

| Sev | file:line | Scenario | Fix |
|---|---|---|---|
| HIGH | `3d-viewer.php:8`, `3d-viewer.php:69`, `readme.txt:5`, `readme.txt:360` | The version still says 2.1.0 in all three places, and there is no `= 2.2.0 =` changelog. wp.org would serve the new code as 2.1.0, so no site gets an update. | Bump all three to `2.2.0` and add a changelog block (proposed lines in §6). `Tested up to: 7.1` is correct: dev.local runs WP 7.1.4. |
| HIGH | `readme.txt:12` | The short description is **153 characters** (counted). wp.org cuts it at 150. It also says "Support" (should be "Supports") and "place products in their room with free AR", while product-page AR is described as Pro (`readme.txt:55`, `:157`). | Use a line under 150 characters that does not promise free product AR, e.g. (142 chars): `3D model viewer for WordPress and WooCommerce. Visitors rotate, zoom and view models in their room with free AR. Supports GLB, glTF, OBJ, STL.` |
| HIGH | `lib/bfields/build/index.css`, `lib/bfields/build/index-rtl.css` (modified) vs `readme.txt:317-320` | The vendored bfields CSS was edited outside the bfields repo. Its md5 `b5cd8e5d…` matches neither `../bfields/build/index.css` nor Premium's copy (both `795d2bc5…`). `lib/bfields/php/bootstrap.php:32` still declares `1.1.1`. The readme says the build is "compiled from that tag's `ui/` folder" (tag v1.1.1), which is no longer true. That is a wp.org source-availability risk. | Either restore both files to their v2.1.0 content, or ship a tagged bfields release: commit and tag in `../bfields`, bump the version, sync the whole `build/`, and update `readme.txt:317-320`. |
| HIGH | `readme.txt:213` | "this release is tag `v2.1.0`" | Change it to `v2.2.0`, and push that tag and its source to the GitHub repo before you submit. |
| MEDIUM | `src/blocks/3d-viewer/style.scss:370`; `src/blocks/3d-viewer/Components/Common/icons.tsx:7` | A site whose custom CSS recolours the viewer icons loses that colour. The 2.0.0 changelog (`readme.txt:376`) told users to target `.control-btn`. The button colour is now `#111827 !important`, and the icons draw with **inline** `fill:none; stroke:currentColor` (on the `<svg>` and the `<path>`). A rule like `.control-btn svg{fill:#fff}` (e.g. white icons on a dark viewer) no longer applies, and `.control-btn{color:…}` needs `!important`. | This is part of sign-off S1. If the redesign ships, add a changelog line saying custom icon colours now need `color: … !important` on `.control-btn`. |
| MEDIUM | `readme.txt:163`, `:178`, `:190` vs `inc/Field/Settings.php:93`, `:130`, `:195` | FAQ paths say "Settings → Woocommerce Settings" and "General Settings". The New interface (the default) now names these tabs "General", "WooCommerce" and "Woo Selectors". At `:163`, Gallery Selector is in the Selectors tab, not "there". | Give both names, e.g. "WooCommerce (Classic: Woocommerce Settings)", and point Gallery Selector at the Selectors tab. |
| LOW | `src/blocks/3d-viewer/data.ts:31` | "OBJ, STL, FBX, STEP and 14 more" is miscounted. The old label listed 17 formats (13 more); the readme lists 19 (15 more). | Pick the right number, or say "and more". |
| LOW | `package.json:8` (`i18n` chains `npm run copy`); `languages/3d-viewer.pot` dated 2 Nov | **.pot:** the .pot is stale. 0 of the new msgids were found: "Classic (legacy)", "No poster", "Capture image", "Point your phone camera at the code", "Manage in Plugins". **en_US catalogue:** `npm run build` regenerates `languages/3d-viewer-en_US.po` and 9 empty `3d-viewer-en_US-*.json`, which ship in the zip (they are already in `zip/3d-viewer.zip` 2.1.0). This is harmless today: core `wp-includes/js/dist/i18n.js:325` (`if (entry && entry[index])`) falls back to the source string for `""`. But it is dead payload, and Premium removed this step on 3 Sep. | Drop `copy` from the `i18n` chain, then run the release build. That regenerates the .pot. |
| NOTE | `src/blocks/3d-viewer/style.scss:576` | `[dir="rtl"] model-viewer{direction:ltr}` is not scoped to `.modelViewerBlock`. On RTL sites it also touches any other plugin's `<model-viewer>`. | Scope it to `.modelViewerBlock model-viewer` if that matters. |

## 3. Rule 1: data preservation: PASS

- **No changed data paths.** `git diff v2.1.0` is empty for `block.json`, `types.ts`, `view.tsx`, `render.php`, `src/public/*`, `inc/Shortcode/*`, `inc/Helper/Utils.php`, `inc/Woocommerce/Product.php` and `inc/Integrations/Dokan/VendorModel.php`.
- **No deletes or overwrites added.** The diff adds no `delete_post_meta`, `delete_option`, `delete_metadata`, `unset(`, `update_post_meta`, `update_option` or deactivation hook.
- **`inc/Field/Viewer.php`:**
  - Only labels changed.
  - `bp_3d_loading` (`:469`) is a `button_set` in Classic only. CSF `button_set` posts the same `name` and `value` as radio inputs (`vendor/codestar-framework/fields/button_set/button_set.php:46`), so the stored value is unchanged.
  - The classic preview reads `[name=…]:checked` (`src/admin/preview/index.tsx:79-82`), which still matches.
- **`inc/Field/Settings.php:175`:** the same switch for the settings option. Stored values are identical.
- **Preserve logic for Pro keys is intact and unchanged:**
  - `inc/Field/Viewer.php:98-109`: `preserveProData` merges the stored row under the posted one.
  - `:112-149`: `syncPremiumSource`.
  - `inc/Woocommerce/ProductMeta.php:250-315`: the merged rebuild. It keeps `bp3d_models`, posts Premium-only `viewer_position` values (`tab`, `custom_selector`), and writes AR to row 0 only.
- **Reading Premium data:** free reads Premium's `bp3d_models` shape through `$url()` (media array or string), at `ProductMeta.php:80-90` and `Product.php:58-77`. Unchanged.
- **`inc/Woocommerce/ProductMeta.php:49`:** `'priority' => 'core'` only moves where the box draws. CSF (`metabox-options.class.php:128`) and bfields (`Metabox.php:204`) both pass it to `add_meta_box`. A user's saved box order still wins.
- **Uninstall:**
  - `uninstall.php` is unchanged. It still bails when `3d-viewer-premium/3d-viewer-premium.php` exists, and deletes only when `delete_data_on_uninstall === '1'`.
  - The new help text (`Settings.php:112`) matches that code. It does not mention that product `_bp3d_product_` meta and `bp3d_admin_ui` are kept, which is accurate, since they are not deleted.

## 4. Rule 2: old models render

**Default parity:** no attribute, default or PHP fallback changed in this diff, so there is no new drift.

- **Block editor only:** `Style.tsx:117` changed the colour control's empty display from `#ffffff` to `transparent`, which matches `block.json:111` `"bgColor": "transparent"`. Render is unaffected.

**Old-payload walk.** Every render path reads the same keys with the same fallbacks as in 2.1.0, because no read path changed:

| Path | Result |
|---|---|
| shortcode / `getCommonAttributes` | unchanged |
| block (`render.php`, `view.tsx`) | unchanged |
| Woo (`Product.php`) | unchanged |
| Elementor (`ModelViewer.php`) | label-only changes at `:236`, `:263`; the block got the same wording, so the field sets still match |
| admin preview | unchanged except the Classic `button_set`, checked above |

Both engines share `Viewer.tsx`, whose control markup is unchanged. Only the icons and CSS changed, so the visual changes below hit both `modelViewer` and `O3DViewer`.

**Intentional visible changes that need Raju's sign-off (S-list):**

| # | What existing users see | Where | Reach |
|---|---|---|---|
| S1 | **Viewer buttons redesigned**: round translucent chips instead of white 5px squares; shadow; padding 6 instead of 4; the whole icon set swapped from filled to 1.75px outline; hover scale 1.06; a 44px invisible hit area; the focus ring moves from `#2271b1` to `#2563eb`. Custom icon colours break (MEDIUM above). | `style.scss:345-395`, `:540-571`; `icons.tsx` (all icons) | Every Lite viewer: Fullscreen is on by default (`block.json:78-80`, `Viewer.php:426`, `Utils.php:426`). Also the Advanced viewer when its fullscreen, zoom or download buttons are on. |
| S2 | **AR QR card**: width 180→240px; left-aligned; heading "QR Code" → "View in AR"; text "Scan QR code to view in AR on mobile" → "Point your phone camera at the code"; the code sits in a bordered box; bigger close button. | `ARQRCode.tsx:115-117`; `style.scss:404-480` | Every viewer with AR on, including **free Woo AR products** |
| S3 | **RTL sites**: the Lite viewer stage is forced LTR, which fixes the model sliding off the stage. | `style.scss:576-596` | RTL sites only |
| S4 | **Admin**: listed in detail below the table. | | |
| S5 | **Mixed icon styles in the Woo gallery**: the View-in-3D / View-image toggles keep their solid black icons next to the new outline set. | `ShopLoopItemComponents.tsx:33-34` | Woo "Show 3D on first image" products |

S4 admin changes:

- **Classic interface:**
  - It is labelled "Classic (legacy)" with a "kept as a fallback" note (`AdminUi.php:257`, `:260`, `:317`).
  - The viewer list shows a copy chip instead of a text input (`PostTypeModelViewer.php:180-190`).
  - Settings has **no Reset Section / Reset All buttons** any more (`Registrar.php:44`).
  - The Codestar nav font is 14px and ellipsised (`admin-style.css:4-9`).
  - Loading Type is a button set.
- **New interface:**
  - Settings tabs are renamed "General", "WooCommerce" and "Woo Selectors".
  - In the viewer list, posterless rows read "No poster", and the Preview column hides when no row on the page has a poster (`ViewerListModern.php:199-205`, `:291-321`).
- **Both interfaces:**
  - The Woo "3D Product Settings" box moves directly under Product data for users who never dragged it.
  - Labels: "Capture image", "Show progress bar", and the engine picker text (`data.ts:26-31`).
  - The dashboard drops the demo-card arrow link and the Our Plugins stat tiles.
  - The onboarding stepper labels change.
  - The readme drops the `woocommerce` and `360 product view` tags (SEO choice).

**Empirical fixture walk: not run.** The caller restricted dev.local to code reading, and Premium must stay active, so free cannot render there. No fixture was created or deleted.

## 5. Rule 3: errors

| Check | Result |
|---|---|
| `php -l` on the 11 changed PHP files with PHP **7.4.30**, **8.4.11** and **8.5.3** (Local's lightning-services binaries and Homebrew) | **PASS**: 33/33 "No syntax errors detected" |
| `php -l` (7.4.30) on every PHP file in `inc/`, `3d-viewer-block/`, `3d-viewer.php` and `uninstall.php` | **PASS**: no output other than "No syntax errors" |
| Grep of added PHP lines for 8.0+ syntax (`match(`, `?->`, `str_contains`, `str_starts_with`, `array_is_list`, `enum`, `readonly`, `mixed`, `(...)`) | **PASS**: no hits |
| `npx tsc --noEmit -p tsconfig.json` | **1 error, pre-existing**: `Style.tsx(117,17): error TS2322: Type '{ value: string; defaultColor: string; label: string; onChange: … }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'`. The same error appears on `v2.1.0`: I ran `git archive v2.1.0 src` into the scratchpad and ran the same tsc. It comes from bpl-tools `ColorControl` typing, not from this release. |
| Unit tests | none exist in free (`tests/` holds only `e2e`) |
| Build freshness | `build/frontend.js`, `build/blocks/3d-viewer/view.js` and `build/admin-list.js` are dated 12 Nov 17:09, later than the newest changed `src` file (14:19). `qr-content__code` is present in the built CSS and JS. Not rebuilt, per instruction. |
| Grep of added lines for `console.log`, `debugger`, `TODO`, `@ts-ignore`, `dev.local`, `localhost`, `error_log`, `var_dump` | **PASS**: none |
| PHP notice review of new code | **PASS**: `ViewerListModern::anyPoster()` guards `$wp_query` and object rows; `AdminUi` `$legacy` is always defined; `EnqueueAssets.php:77` guards `get_current_screen`. |
| Runtime: PHP log, frontend `curl`, Playwright | **NOT RUN**: free is inactive on dev.local (`wp plugin list`: `3d-viewer inactive 2.1.0`, `3d-viewer-premium active 2.2.0`). Live testing is assigned to the Playground agent. |

**Coexistence:**
- The `bp3d-public` handle, `window.domRendered`, `frontend.tsx`/`view.tsx` and the main-file activation hand-off (`bp3d_deactivate_premium_version`) are all unchanged.
- The e2e specs were updated for the renamed labels (`01-admin-surfaces`, `12-onboarding`, `16-interface-switch`). Not run.

## 6. Release hygiene

**Version bump to 2.2.0:**
- `3d-viewer.php:8`
- `3d-viewer.php:69`
- `readme.txt:5`
- `readme.txt:213`

**Proposed changelog lines** (terse format):
```
= 2.2.0 - <date> =
* Changed: Viewer buttons are round with new outline icons and a larger touch area; custom icon colours on `.control-btn` now need `!important`.
* Changed: The AR QR code card is larger and titled "View in AR".
* Fixed: On right-to-left sites the Lite viewer model no longer slides off the stage.
* Changed: Classic interface is now labelled "Classic (legacy)"; its Settings no longer show Reset buttons.
* Fixed: Classic viewer list shows the full shortcode in a copy button.
* Changed: Viewer list (new interface) shows "No poster" and hides the Preview column when no viewer has a poster.
* Changed: The WooCommerce 3D Product Settings box sits right below Product data.
* Improvement: Clearer labels and help text in Settings, the viewer editor, the block and the Elementor widget.
* Improvement: Help & Demos, Extensions and Guided Setup polish; Guided Setup moves focus to each step's heading.
* Improvement: The FluentCart 3D Model tab explains how changes save.
```

**Zip:** `npm run zip` (`package.json:11`) still covers every runtime directory. No new top-level directory was added. `FREE-FIXES-FROM-PREMIUM-2.1.0.md`, `temp.txt` and `todo.txt` stay out of the zip.

**Readme vs wp.org rules:**
- **Tags:** 5. OK.
- **Short description:** over the limit (HIGH above).
- **License, Requires and Tested headers:** OK.

**Readme claims checked against code:**

| Claim | Status | Evidence |
|---|---|---|
| Free AR in the block, Elementor and shortcode viewers | **true** | `block.json` `arPlacement`/`arMode`; `ModelViewer.php:343`, `:357`; `Viewer.php:518`, `:531` |
| Two Elementor widgets | **true** | `Addons.php:165-166` |
| Advanced formats including **STEP** and **3MF** | **backed by code** | **Upload:** both are in `Utils::SUPPORTED_MIME_TYPES` (`Utils.php:61-76`). **Render:** no per-format gate; `Viewer.tsx:37-44` only checks that the URL is valid. **3MF** uses O3DV's parser, with fflate bundled. **STEP** loads `occt-import-js@0.0.22` from `cdn.jsdelivr.net` inside `public/js/o3dv.min.js`. Both disclosed at `readme.txt:272-279`. Actual upload acceptance and load were **not verified live** (Playground agent). |
| Lazy loading by default | **true for the block** (`block.json:54-56`) | Shortcode viewers default to `auto` (`Viewer.php:477`), which model-viewer treats like lazy. Acceptable. |
| Woo product-page AR is Pro (`:55`, `:157`, `:160`) | **partly inaccurate** | See §9. |

## 7. Port items

### `FREE-FIXES-FROM-PREMIUM-2.1.0.md`

| Item | Status | Evidence |
|---|---|---|
| 1. Poster centred | **in v2.1.0** | `style.scss:122` `background-position: center` |
| 2. Tailwind class names on the Advanced viewer | **in v2.1.0** | `Basic3DViewer.tsx:152` keeps only the real classes |
| 3. New products start on first image | **in v2.1.0** | `ProductMeta.php:74-75`, `:220` |
| 4. Old Advanced-viewer load reporting | **in v2.1.0** | `Basic3DViewer.tsx:89-96` (`sink`, `old.parentElement`, `old.parameters = {}`) |
| 5. Range number box overflow | **in v2.1.0** | `editor.scss:187-192` |
| 6. InfoTip tooltips (optional) | **still missing** | `src/components/Label.tsx:2`, `:13` still use `<Tooltip>` |

The file's header ("free still lacks every one") is stale.

### Premium `COMPAT-REVIEW-2.2.0-2026-11-12.md` §A, checked against free

| # | Same bug in free? | Port item |
|---|---|---|
| A1 Elementor hotspot `modelNumber` | No. Free's Elementor widget has no hotspots (0 hits in `ModelViewer.php`). | — |
| A2 `.labels-inline` toggles | No. Free has no Control Labels (no `labels-inline`). | — |
| A3 fit-scroll tail vs `::before` | No. Free has no hotspots or `bp3d-fit-scroll`. | — |
| A4 44px hit areas overlapping | Not at free's settings. Free has the same `::before` (`style.scss:540-549`), but buttons are fixed at 35px with a fixed 10px gap and there is no Control Spacing option, so the areas don't overlap. | — (re-check if free ever gets Control Spacing) |
| A5 Initial Zoom hidden | No. Free has no `zoomLevel`. | — |
| A6 QR heading uses the custom AR label | No. Free's heading is a fixed `__('View in AR')` (`ARQRCode.tsx:115`). | — |
| **A7** Classic nav ellipsis truncates translated tab names | **Yes**: `admin/css/admin-style.css:4-9` has the same `white-space:nowrap; text-overflow:ellipsis`. | **PORT**: Premium's fix (wrap with a hanging indent). Hits translated sites in Classic mode. |
| **A8** Copy chip unstyled when the surface filter pins the viewer to Classic on a Modern site | **Yes**. The rules are only in `admin-style.css:23-91`, which is enqueued only when `AdminUi::mode(screenSurface())` is Classic (`EnqueueAssets.php:52-65`). On the list screen `screenSurface()` is `''`, but `isModernList()` uses `mode('viewer')` (`PostTypeModelViewer.php:60-61`). | **PORT**: move the chip rules to `admin/css/admin-common.css`, scoped `body:not(.bp3d-list-modern)`. |

## 8. Not verified

- Any runtime behaviour of free: PHP log, frontend markup, console, e2e, AR on devices, STEP/3MF upload and load. Free is not active on dev.local, and the caller forbade activating it. Assigned to the Playground agent.
- What the controls and QR card look like (S1–S5): judged from CSS and TSX only, no screenshots.
- Whether wp.org SVN `assets/` still matches the 10 screenshot captions. The captions were reworded but still map 1:1 to the old list.
- Whether the Freemius free build or the GitHub source repo matches this tree.

## 9. WooCommerce AR in free (product decision of 12 Nov 2026)

**What the pending diff does:** nothing to the AR logic.
- `ProductMeta.php:176-197` (AR fields shown only when `bp3d_models[0]` exists) and `Product.php:66-77`, `:105-107` (AR read) are unchanged.
- The only effects are cosmetic:
  - The Woo AR QR card gets the S2 restyle.
  - The model and poster placeholders change.
  - The box moves (`priority core`).
- The readme now calls product-page AR Pro (`:55`, `:157`, `:160`). The code still renders it for any product whose row 0 has `enable_ar`.

**Removing it would break:**
1. **Dokan marketplaces on free** with vendor AR allowed. `VendorModel.php:25`, `:263`, `:332` still write `enable_ar` and `model_iso_src`, and the readme sells it (`:44`, `:169`). Vendor AR would save but never render.
2. **Sites that switched from Pro to the free plugin** lose the AR button and QR on products where Pro saved `enable_ar`.
3. **Stores that turned on Enable AR in free 2.1.0's product box** (shown for products with row 0) lose it.

If AR is removed, gate only the render and the UI:
- Keep the `array_merge` in `preserveProData`.
- Never strip `enable_ar`, `model_iso_src`, `ar_mode` or `ar_placement` from row 0.
- Update the Dokan allowed-fields list and the readme in the same release.
- Treat it as a rule-2 change that needs a changelog line.

## 10. Assumptions

- The release is `v2.1.0` → working tree, and the version will be 2.2.0. Nothing in the tree names a version.
- "Intentional visual changes" are judged as sign-off items, not blockers, as the caller asked.
- No git state, source file or dev.local data was changed. The only things written:
  - this report;
  - a scratch copy of `v2.1.0:src` for the baseline tsc run, at `/private/tmp/claude-501/-Users-raju-Local-Sites-dev-app-public-wp-content-plugins-3d-viewer-premium/fa7fc13c-c53a-45f1-829c-983437b466c2/scratchpad/base`.
