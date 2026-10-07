# 3D Viewer — E2E Release Test Suite

Playwright end-to-end tests for the **3D Viewer** plugin, running against the
WordPress Studio site that hosts this repo (default `http://localhost:8881`,
`admin` / `password` — override with `WP_BASE_URL`, `WP_USERNAME`,
`WP_PASSWORD`).

Run this before every release.

## Quick start

```bash
# from the plugin root
npm install                        # first time only
npx playwright install chromium    # first time only

npm run test:e2e                   # run the whole suite (core + admin-classic + admin-modern)
npm run test:e2e:classic           # admin-screen specs in the Classic (Codestar) interface
npm run test:e2e:modern            # the same specs in the Modern (bfields) interface
E2E_CROSSMODE=1 npm run test:e2e:crossmode   # Modern → Classic → Modern byte round trip
npm run test:e2e:headed            # watch it run
npm run test:e2e:ui                # Playwright UI mode
npm run test:e2e:report            # open the HTML report of the last run
npm run test:e2e:gallery           # all screenshots of the last run on one page
```

The suite auto-starts the Studio site if it is stopped (requires the Studio
CLI — enable it in the Studio app under Settings → General).

Against any other install (Local, Docker, a plain LAMP site) point it at a
plain wp-cli and the site's URL/credentials; the site must already be up:

```bash
E2E_WP_CLI=wp WP_BASE_URL=http://dev.local WP_USERNAME=e2e_admin WP_PASSWORD=… npm run test:e2e
```

## What gets tested

| Spec | Covers |
|---|---|
| `00-sanity` | Site boots, admin login works, free plugin is active |
| `01-admin-surfaces` | CPT list + ShortCode column/copy, settings page (either interface), Help & Demos dashboard app + hash-router nav |
| `02-settings` | Settings save round-trip (mime checkboxes persist), Gutenberg switch |
| `03-media-upload` | `.glb`/`.stl`/`.obj` uploads accepted with correct mime; `.php.glb` double-extension stored defused; `.php` rejected outright |
| `04-cpt-editor` | Add-New model forces the locked viewer-block template; classic-editor edit screen (Codestar box + shortcode bar, or the bfields page with its shortcode chip); live preview panel / Modern side preview + preview popup |
| `05-block-editor` | Placeholder → model URL flow, sidebar Settings/Style tabs + Exposure control (new in 1.9.0), publish → model loads on frontend |
| `06-frontend-render` | Lite viewer (`<model-viewer>` `loaded === true`), controls (camera/zoom/fullscreen toggle), exposure attribute pass-through, Advanced O3DV canvas, `[3d_viewer]` shortcode for block + classic models, invalid-id graceful failure |
| `07-woocommerce` | 3D Product Settings metabox, Woo settings section, Enable AR on a Pro-shaped product (row 0, Pro keys kept), single product page renders the model above the gallery (skipped if Woo inactive) |
| `08-extensions` | Extensions submenu + BPEM app mounts and lists the catalog (new in 1.9.0) |
| `09-elementor` | Model Viewer widget renders + loads on an Elementor-built page (skipped if Elementor inactive) |
| `10-wp-core` | WP core regression with the plugin active: publish a standard post, regular image upload (upload_mimes filter), media library grid |
| `11-woocommerce-shop` | Woo core regression: shop page lists products, full purchase (add to cart → block checkout → order received with COD) |
| `12-onboarding` | Guided setup: three-step page renders in wp-admin, settings untouched, early exit keeps the 33% resume entry, method picker keyboard + copy, video modal, finish lands on Add New model |
| `13-admin-sweep` | Every 3D Viewer admin screen (list, Add New, edit, Settings tabs, Help & Demos, Dokan, products) with no JS error, failed request or PHP notice from our code |
| `14-ajax-save` | Modern: Update on a published viewer saves in place (same bytes as a native submit, private posts, stale nonce, failed request, kill switch); Classic: Update always reloads |
| `15-dokan-settings` | Marketplace (Dokan) screen renders in the pinned interface; an untouched save keeps the bytes; undeclared (Pro) keys survive |
| `16-interface-switch` | The New/Classic switch row on Settings › General, the Publish-box line, the one-time notice (only while unset, only with earlier data), the "save was dropped" notice |
| `crossmode` | Settings, a seeded viewer and seeded products saved untouched Modern → Classic → Modern; Modern must not change a byte, Classic only by known Codestar shapes |

Frontend model assertions wait for the **visible** `<model-viewer>` element to
report `loaded === true` (real WebGL render), not just for markup.

## Admin interfaces (Classic / Modern)

The plugin has two admin interfaces that edit the same stored data: **Classic**
(Codestar) and **Modern** (bfields). The site-wide choice is the option
`bp3d_admin_ui` (`classic` | `modern`; unset means Modern).

| Project | Runs | Interface |
|---|---|---|
| `core` | every spec except the ones below | whatever the site uses |
| `admin-classic` | `01`, `02`, `04`, `07`, `13`–`16` | `bp3d_admin_ui` pinned to `classic` |
| `admin-modern` | the same specs | pinned to `modern` |
| `crossmode` | `crossmode.spec.ts` | switches the option itself |

```bash
npx playwright test -c tests/e2e/playwright.config.ts --project=admin-modern 14-ajax-save
```

How the pin works (`admin-ui.ts`): before the worker's first test it records
the current `bp3d_admin_ui`, writes the project's value and checks that the
site really resolves to it (a `BP3D_ADMIN_UI` constant or `bp3d_admin_ui`
filter on the site makes it fail with a clear message). After the run it
writes the recorded value back. **The option is never deleted**: if it was
unset when the run started, it is set to the interface the site showed then
(Modern by default) and each test carries a `notice` annotation saying so.
Delete it by hand only if the site owner agrees.

On a site where the standalone `bfields` plugin is active, that copy (not the
one vendored in `lib/bfields`) serves Modern unless `BFIELDS_FORCE_PATH` is
defined in `wp-config.php`.

Example against Local's `dev.local`:

```bash
E2E_WP_CLI=wp WP_BASE_URL=http://dev.local WP_USERNAME=e2e_admin WP_PASSWORD=… npm run test:e2e:modern
```

### Consent before running

Running the suite **writes to the site's database**. Get the site owner's
agreement first, on any site that is not a throwaway:

- `global-setup.ts` deletes every post titled `E2E-3DV…` (and `e2e-cube`
  uploads), patches `_bp3d_settings_` (mime types, Enable Gutenberg),
  deactivates 3D Viewer Pro if it is active, and seeds fresh content.
- The per-mode projects write `bp3d_admin_ui` (see above), toggle Enable
  Gutenberg around some specs, save the Settings and Dokan screens (the Dokan
  spec writes the captured bytes back), and seed `E2E-3DV …` viewers and
  products (products are deleted again; viewers are removed by the next run's
  cleanup).
- `crossmode` overwrites `_bp3d_settings_` with its own untouched saves and
  writes the captured bytes back at the end. It is skipped unless
  `E2E_CROSSMODE=1` is set.

## How it works

- `global-setup.ts` runs once per invocation:
  1. Ensures the Studio site is up (`studio start --skip-browser`).
  2. Ensures the free build is active (deactivates a premium build if present).
  3. Enables all 3D mime types + the Gutenberg editor in `_bp3d_settings_`.
  4. Generates 3D fixtures (`scripts/make-fixtures.mjs` builds a valid
     glTF-2.0 cube `.glb`, plus `.stl`/`.obj`, from scratch — no binaries
     committed).
  5. Logs in and saves auth state for all tests.
  6. Deletes previous `E2E-3DV*` content, then seeds: an uploaded `.glb`, a
     block-built CPT model, a classic (CSF meta) CPT model, six frontend
     pages, a WooCommerce product (if Woo is active) and an Elementor page
     (if Elementor is active).
  7. When Woo is active, also makes the store checkout-able: coming-soon off,
     cash-on-delivery enabled, the seeded product priced/virtual/in-stock,
     and the test customer's billing profile prefilled.
- Seeded ids/links land in `artifacts/state.json` (the `state` fixture).
- wp-cli goes through `studio wp` executed from the site root (`wp.ts`), or
  whatever `E2E_WP_CLI` names.
- Tests run with **1 worker** on purpose — they share one WordPress install.

## Adding tests

Import from `../fixtures` — it extends
`@wordpress/e2e-test-utils-playwright` (so `admin`, `editor`, `requestUtils`,
`pageUtils` fixtures are available) and adds:

- `state` — seeded content ids/links + active plugin flags,
- `pageErrors` — uncaught page JS errors collected during the test,
- `expectNoFatal(page)` / `waitModelLoaded(page, scope)` helpers.

Prefix any content you create with **`E2E-3DV`** so cleanup finds it.

Specs that must run in both interfaces import `test` from `../admin-ui` (it
extends `../fixtures`, adding the `adminUi` option) and are listed in
`PER_MODE` in `playwright.config.ts`. `helpers/wp-admin.ts` has mode-neutral
helpers (`adminUi(page)`, `openSettingsTab`, `openMetaboxTab`, `setSwitch`,
`setChoice`, `setMediaUrl`, `saveSettings(page, unique)`,
`publishClassicPost`, …): name a field by its Codestar input name, e.g.
`_bp3dimages_[bp_3d_fullscreen]`, and the helper finds it on either screen.
`helpers/records.ts` wraps the wp-cli PHP helpers: raw record bytes
(`raw-records.php`), free-shape viewers (`viewer-seed.php`) and products
(`product-fixture.php`, free shape or with 3D Viewer Pro keys).

To wipe seeded content manually:

```bash
cd ../../../..   # site root
studio wp eval-file wp-content/plugins/3d-viewer/tests/e2e/scripts/clean-e2e-data.php
```
