# Plugin Audit Report — 3D Viewer (Display Interactive 3D Models)

**Plugin version:** 1.8.12
**Audited as:** WordPress.org plugin reviewer / code auditor
**Audit date:** 2026-05-16
**Verdict:** Not ready to ship — **1 blocker** must be fixed; several guideline issues should be addressed.

---

## 1. Summary

The plugin is generally well structured: every PHP file has an `ABSPATH` guard, there is no
direct SQL, no use of `eval`/`base64`/`exec`, superglobals are sanitized, and output is
escaped in almost all paths. Third-party libraries are documented in `readme.txt`.

However there is **one hard blocker** (a PHP version-compatibility violation that causes a
fatal error) and a number of correctness / guideline issues that a WordPress.org reviewer
would flag.

| Severity | Count | Items |
|----------|-------|-------|
| 🔴 Blocker | 1 | #1 |
| 🟠 High | 1 | #2 |
| 🟡 Medium | 7 | #3–#9 |
| 🔵 Low / polish | 10 | #10–#19 |

---

## 2. 🔴 Blocker

### #1 — PHP 8.0 syntax used while `Requires PHP: 7.4` → fatal error

**File:** [inc/Addons/ModelViewer.php:261](inc/Addons/ModelViewer.php#L261)

```php
return function ($key, $default = false, $is_boolean = false, $key2 = null) use ($settings): mixed {
```

The `: mixed` return type was introduced in **PHP 8.0**. The plugin header and `readme.txt`
both declare `Requires PHP: 7.4`.

- `inc/Addons/ModelViewer.php` is `require_once`'d from `Addons::registerWidgets()` on the
  `elementor/widgets/register` hook ([inc/Addons/Addons.php:66](inc/Addons/Addons.php#L66)).
- On a **PHP 7.4 site with Elementor active**, loading this file produces
  `PHP Parse error: syntax error, unexpected 'mixed'` — a **fatal error / white screen** on
  every front-end and editor request where Elementor registers widgets.

**Fix (pick one):**
- Remove the `: mixed` return type (PHP 7.4-safe), **or**
- Bump `Requires PHP` to `8.0` in both `3d-viewer.php` and `readme.txt`.

> Note: `@return ... mixed` in the docblocks of `inc/Helper/Utils.php` is harmless (comments only).

---

## 3. 🟠 High

### #2 — Missing stylesheet `admin/css/readonly.css` → 404 on every admin edit screen

**File:** [inc/Base/EnqueueAssets.php:66](inc/Base/EnqueueAssets.php#L66) and [:70](inc/Base/EnqueueAssets.php#L70)

```php
wp_register_style('bp3d-readonly-style', BP3D_DIR . 'admin/css/readonly.css', [], BP3D_VERSION);
...
wp_enqueue_style('bp3d-readonly-style');
```

`admin/css/` contains only `admin-style.css` — **`readonly.css` does not exist**. The handle
is registered *and enqueued* whenever a `bp3d-model-viewer` or `product` post is edited,
producing a 404 request on every one of those admin screens.

**Fix:** ship the file, or remove the registration + enqueue lines.

---

## 4. 🟡 Medium

### #3 — `gettext` filter abuse for renaming the Publish button

**File:** [inc/Base/PostTypeModelViewer.php:39](inc/Base/PostTypeModelViewer.php#L39), handler [:202](inc/Base/PostTypeModelViewer.php#L202)

```php
add_filter('gettext', [$this, 'changePublishButtonText'], 10, 2);
```

The `gettext` filter runs for **every translated string on every request** (front-end *and*
admin). The callback calls `get_post_type()` on each invocation. This is a measurable
performance drag. It also returns the literal string `'Save'` (untranslated), breaking the
button label on non-English sites.

**Fix:** use a screen-scoped approach — e.g. hook `gettext_with_context`/`gettext` only on
the relevant `post.php`/`post-new.php` screens, or override the label via the post type's
`labels` array, and wrap the replacement in `__()`.

### #4 — Version strings out of sync

- [composer.json:3](composer.json#L3) → `"version": "1.8.11"`
- [build/blocks/3d-viewer/block.json](build/blocks/3d-viewer/block.json) → `"version": "1.8.11"`
- Plugin header / `readme.txt` stable tag → `1.8.12`

A reviewer cross-checks these. Bump all to `1.8.12` (ideally automate it in the build).

### #5 — `BP3D_VERSION = time()` under `WP_DEBUG`

**File:** [3d-viewer.php:34-38](3d-viewer.php#L34-L38)

```php
if (defined('WP_DEBUG') && WP_DEBUG === true) {
    define('BP3D_VERSION', time());
}
```

Using `time()` as the asset version makes every script/style URL unique on every request,
fully defeating browser and CDN caching. Many production/staging sites legitimately run with
`WP_DEBUG` enabled. Prefer `filemtime()` of the asset, or just keep the static version.

### #6 — Missing build artifact `public/css/custom-style.css`

**File:** [inc/Addons/Blocks.php:48-54](inc/Addons/Blocks.php#L48-L54)

`bp3d-custom-style` is registered against `public/css/custom-style.css`, but only the
**uncompiled source** `public/css/custom-style.scss` ships. The handle is currently only
*registered* (the enqueue in `Shortcode.php:100` is commented out), so there is no live 404 —
but it is dead/broken registration and indicates the SCSS was never compiled into the build.

**Fix:** compile the SCSS and ship the `.css`, or remove the registration.

### #7 — MIME-type override bypasses real-content verification

**File:** [inc/Base/ExtendMimeType.php:23-44](inc/Base/ExtendMimeType.php#L23-L44)

`bplugins_stp_add_allow_upload_extension_exception()` hooks `wp_check_filetype_and_ext` and,
for any of the 14 model extensions, returns a forced `ext`/`type` while **ignoring the
`$real_mime` argument** WordPress passes in, and sets `proper_filename => ''` (so WordPress is
told *not* to rename anything). Effects:

- A file's declared extension is trusted blindly regardless of actual content.
- A multi-extension upload such as `evil.php.glb` keeps its full name; on a mis-configured
  server (`AddHandler` for `.php` anywhere in the name) this is an execution vector.

Risk is moderate (the affected extensions are all non-executable model formats), but the
function should be hardened: compare against `$real_mime` where available, and let WordPress
sanitize/rename the filename rather than suppressing it.

### #8 — Two overlapping 3D-viewer blocks

`Blocks::init()` registers **two** blocks ([inc/Addons/Blocks.php:83-87](inc/Addons/Blocks.php#L83-L87)):

- `b3dviewer/modelviewer` (`build/blocks/3d-viewer`)
- `tdvb/td-viewer` (`3d-viewer-block/build`)

Both embed a 3D model and both appear in the inserter. This is confusing for users and looks
like a leftover/legacy block. The `tdvb` namespace, the `b3dviewer` namespace, the `BP3D`
PHP prefix, and the `3d-viewer` text domain are also four inconsistent prefixes for one
plugin. Consolidate to a single block, or document why both exist.

### #9 — `[3d_viewer_product]` shortcode `id` attribute is non-functional

**File:** [inc/Shortcode/Shortcode.php:118-133](inc/Shortcode/Shortcode.php#L118-L133)

`renderProductModelViewer()` validates `$attrs['id']` is a `product`, then renders via
`Product::instance()->get_3d_model_html()` which reads `global $product` and **ignores the
`id` entirely**. Using `[3d_viewer_product id=123]` outside a product loop renders nothing
(global `$product` is null). Either honor the `id` (set up the product context) or drop the
attribute.

---

## 5. 🔵 Low / polish

### #10 — Ineffective text-domain fallback
[3d-viewer.php:122-124](3d-viewer.php#L122-L124) falls back to loading the **old** `model-viewer`
text domain if `3d-viewer` fails. Translations loaded under `model-viewer` will never apply to
strings that call `__( ..., '3d-viewer' )`, so this fallback is dead code.

### #11 — `readme.txt` Installation section is template boilerplate
[readme.txt:190-199](readme.txt#L190-L199) still contains `e.g.` and the placeholder
`Upload `plugin-directory` to the /wp-content/plugins/ directory`. Replace with real steps.

### #12 — Dangling CSF dependency
`ProductMeta`'s `angle_property` field declares `'dependency' => ['bp_model_angle', '==', '1']`
([inc/Woocommerce/ProductMeta.php:130](inc/Woocommerce/ProductMeta.php#L130)), but no
`bp_model_angle` field exists in the free metabox — the dependency can never resolve.

### #13 — Unguarded `$post` access
[inc/Base/PostTypeModelViewer.php:185-187](inc/Base/PostTypeModelViewer.php#L185-L187)
`hidePublishingActions()` reads `$post->post_type` without a null check; on PHP 8 a null
`$post` raises an "Attempt to read property on null" warning. Add `if (!$post) return;`.

### #14 — Hardcoded script dependencies
`bp3d-public` is registered with hardcoded `['react','react-dom']` deps
([inc/Addons/Blocks.php:57-63](inc/Addons/Blocks.php#L57-L63)), and the dashboard script with a
long hardcoded array ([inc/admin.php:39-57](inc/admin.php#L39-L57)), instead of consuming the
generated `*.asset.php` files. WordPress also recommends depending on `wp-element` rather than
raw `react`/`react-dom` handles.

### #15 — External-services disclosure
The plugin uses the Freemius SDK (opt-in telemetry) and the bundled dashboard contacts
bPlugins / WordPress.org / Freemius. `readme.txt` mentions this only inline under the
"bpl-tools" library note. WordPress.org guidelines expect a clear, dedicated section
describing **what** data is sent, **where**, and **when** (with links to the relevant
privacy/terms pages).

### #16 — `Tested up to: 6.9`
Confirm 6.9 is an actually-released WordPress version at submission time; WordPress.org
rejects `Tested up to` values that reference unreleased versions.

### #17 — Dead singleton code
`Addons::instance()` and `Controls::instance()` are never used — `Init` instantiates these
classes with `new` ([inc/Init.php:137-144](inc/Init.php#L137-L144)). Remove the unused
singletons or route construction through them consistently.

### #18 — Shipping an `en_US` translation
`languages/3d-viewer-en_US.(po|mo)` and `3d-viewer-block/languages/3d-viewer-block-en_US.(po|mo)`
ship a translation for the source locale, which is redundant.

### #19 — Text-domain mismatch in the secondary block
`3d-viewer-block/build/block.json` declares `"textdomain": "3d-viewer"`, but its language
files are named `3d-viewer-block.pot` / `3d-viewer-block-en_US.*`. Pick one domain.

---

## 6. What is clean

These were checked and found acceptable:

- ✅ `ABSPATH` guard present in every PHP file (including `render.php` files).
- ✅ No direct SQL, no `$wpdb`, no `eval`/`base64`/`exec`/`create_function`.
- ✅ The single superglobal use (`$_GET['post_type']`) is wrapped in
  `sanitize_text_field( wp_unslash( ... ) )` ([inc/Base/EnqueueAssets.php:61](inc/Base/EnqueueAssets.php#L61)).
- ✅ Output escaping is applied consistently — `esc_attr`, `esc_url`, `esc_html`,
  `wp_json_encode` for `data-attributes`. The one unescaped `echo` in
  `SingleProduct::renderProductModels()` is core-generated WooCommerce gallery HTML and is
  the standard WooCommerce template pattern.
- ✅ `uninstall.php` correctly checks `WP_UNINSTALL_PLUGIN` and only deletes data when the
  user opted in via the `delete_data_on_uninstall` setting.
- ✅ Settings/metabox saving is delegated to the Codestar Framework (handles nonces + caps).
- ✅ All scripts/styles are bundled locally — no third-party assets loaded from a CDN.
- ✅ Third-party libraries (Codestar, Freemius, Online3DViewer, model-viewer, three.js, etc.)
  are documented with sources and licenses in `readme.txt`.
- ✅ `Stable tag` matches the plugin header `Version` (1.8.12).

---

## 7. Recommended priority order

1. **Fix #1** (blocker) — remove `: mixed` or raise `Requires PHP` to 8.0.
2. **Fix #2** — ship or remove `readonly.css`.
3. Address #3–#9 (Medium) before resubmission.
4. Clean up #10–#19 as polish.
