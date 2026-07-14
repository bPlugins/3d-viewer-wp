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

npm run test:e2e                   # run the whole suite
npm run test:e2e:headed            # watch it run
npm run test:e2e:ui                # Playwright UI mode
npm run test:e2e:report            # open the HTML report of the last run
npm run test:e2e:gallery           # all screenshots of the last run on one page
```

The suite auto-starts the Studio site if it is stopped (requires the Studio
CLI — enable it in the Studio app under Settings → General).

## What gets tested

| Spec | Covers |
|---|---|
| `00-sanity` | Site boots, admin login works, free plugin is active |
| `01-admin-surfaces` | CPT list + ShortCode column/copy, CSF settings page, Help & Demos dashboard app + hash-router nav |
| `02-settings` | Settings save round-trip (mime checkboxes persist), Gutenberg switch |
| `03-media-upload` | `.glb`/`.stl`/`.obj` uploads accepted with correct mime; `.php.glb` double-extension stored defused; `.php` rejected outright |
| `04-cpt-editor` | Add-New model forces the locked viewer-block template; classic (CSF metabox) edit screen; live preview panel + preview popup (new in 1.9.0) |
| `05-block-editor` | Placeholder → model URL flow, sidebar Settings/Style tabs + Exposure control (new in 1.9.0), publish → model loads on frontend |
| `06-frontend-render` | Lite viewer (`<model-viewer>` `loaded === true`), controls (camera/zoom/fullscreen toggle), exposure attribute pass-through, Advanced O3DV canvas, `[3d_viewer]` shortcode for block + classic models, invalid-id graceful failure |
| `07-woocommerce` | 3D Product Settings metabox, Woo settings section, single product page renders the model above the gallery (skipped if Woo inactive) |
| `08-extensions` | Extensions submenu + BPEM app mounts and lists the catalog (new in 1.9.0) |
| `09-elementor` | Model Viewer widget renders + loads on an Elementor-built page (skipped if Elementor inactive) |
| `10-wp-core` | WP core regression with the plugin active: publish a standard post, regular image upload (upload_mimes filter), media library grid |
| `11-woocommerce-shop` | Woo core regression: shop page lists products, full purchase (add to cart → block checkout → order received with COD) |

Frontend model assertions wait for the **visible** `<model-viewer>` element to
report `loaded === true` (real WebGL render), not just for markup.

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
- wp-cli goes through `studio wp` executed from the site root (`wp.ts`).
- Tests run with **1 worker** on purpose — they share one WordPress install.

## Adding tests

Import from `../fixtures` — it extends
`@wordpress/e2e-test-utils-playwright` (so `admin`, `editor`, `requestUtils`,
`pageUtils` fixtures are available) and adds:

- `state` — seeded content ids/links + active plugin flags,
- `pageErrors` — uncaught page JS errors collected during the test,
- `expectNoFatal(page)` / `waitModelLoaded(page, scope)` helpers.

Prefix any content you create with **`E2E-3DV`** so cleanup finds it.

To wipe seeded content manually:

```bash
cd ../../../..   # site root
studio wp eval-file wp-content/plugins/3d-viewer/tests/e2e/scripts/clean-e2e-data.php
```
