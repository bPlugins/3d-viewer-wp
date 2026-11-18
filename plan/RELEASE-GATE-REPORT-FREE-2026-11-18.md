# Release gate: 3D Viewer FREE 2.1.1. 18 Nov 2026

## 1. Verdict

**DO NOT SHIP** until B1 is fixed. B1 is a one-line fix. After that the verdict is **SHIP WITH FIXES**, because H1 (the vendored bfields build) is still open from 12 Nov.

- **Baseline:** tag `v2.1.0` (= HEAD `54faac1`).
- **Under review:** the working tree. All 70 changed files are staged and none are untracked (`git diff HEAD --stat`: 1771+/718−). The version under review is 2.1.1.
- **Repo:** `/Users/raju/Local Sites/dev/app/public/wp-content/plugins/3d-viewer` (branch `main`).

Summary:
- Rule 1 (no data loss): **PASS**.
- Rule 2 (old models render the same): **PASS**, with one sign-off item (M1).
- Rule 3 (no errors): **FAIL**. A new code path in `Shortcode.php` throws a PHP `TypeError` for logged-in Authors and Contributors. It was reproduced on dev.local.
- Today's Promo, Plugin Check and bfields edits are correct and harmless (§9).

## 2. Blockers and highs

| Sev | file:line | Scenario | Fix |
|---|---|---|---|
| **BLOCKER** | `inc/Shortcode/Shortcode.php:40-46`, `:95` | **Fatal for logged-in Authors and Contributors.** A published classic viewer has no model, and a user with `edit_posts` but without `edit_post` on that viewer opens the page. This is every Author or Contributor viewing an admin's viewer. `:95` calls `noModelNotice()`. Its inner `current_user_can('edit_post', $id)` is false, so the function falls off the end of a `: string` method, and the page shows "There has been a critical error". Reproduced: `wp eval --user=2` (role author) with `do_shortcode("[3d_viewer id=9109]")` gives `TypeError: BP3D\Shortcode\Shortcode::noModelNotice(): Return value must be of type string, none returned`. The same TypeError occurs on PHP 7.4.30 (scratch test). Exposure: 73 of the 942 published classic viewers on dev.local have no model. Admins get the notice and visitors get `""`, so the bug only shows for these roles. | Make every path return a string. Add `return '';` after the `if` in `noModelNotice()`, or change `:95` to `return current_user_can('edit_post', (int) $id) ? self::noModelNotice((int) $id) : '';` and drop the inner check. |
| HIGH (open since 12 Nov) | `lib/bfields/build/index.css`, `index-rtl.css`; `readme.txt:363-366` | The vendored CSS md5 is still `b5cd8e5d…`. At `v2.1.0` it was `948244ea…`. It matches neither tag `v1.1.1` (`5be26975…`) nor `../bfields/build/index.css` (`795d2bc5…`, uncommitted, same as Premium's copy). The added rules (`.bfields-danger-card{flex-wrap…}`, `.bfields-settings-head__logo{margin-inline-end:-4px}`, a `≤600px` subcard padding rule) exist only in the sibling repo's uncommitted working tree. The vendored PHP is also v1.1.1 plus today's phpcs edits, which is not a tagged state. Today's PHP edits sit in `../bfields` uncommitted. That repo's `main` HEAD `04042b1` carries the tag **`v1.0.0`** but is newer than `v1.1.1`. The readme still says `lib/bfields/build/` "is compiled from that tag's `ui/` folder". wp.org source-availability risk. | Commit and tag a bfields release (e.g. `v1.1.2`) in `../bfields` and sync `build/` and `php/` from it. Bump `bootstrap.php:32` and `load.php:44`, then update `readme.txt:363-366`. Alternatively, restore both CSS files to their `v2.1.0` content. Separately, fix the misplaced `v1.0.0` tag in `../bfields`. |

## 3. Rule 1: data preservation: PASS

- **No deletes or overwrites added.** The PHP diff adds no `delete_*`, `unset(`, `update_post_meta`, `update_option`, `$wpdb` write or deactivation hook. The only new write is `update_user_meta(…, 'bp3d_promo_banner_dismissed_permanent_2026', 1)` (`inc/Promo.php:476`), which is the current user's own flag.
- **Unchanged since `v2.1.0`:**
  - `block.json`, `render.php`, `view.tsx`, `Helper/Block.php`, `uninstall.php` and `src/utils/viewerDefaults.ts`.
  - `Utils.php` changes only by adding the `'Shop Zen'` compatibility theme.
- **Premium-shared data is still preserved:**
  - `inc/Woocommerce/ProductMeta.php`: the merge-save (`:255-315`) is unchanged. The diff touches only placeholders and `'priority' => 'core'`.
  - Free never creates `bp3d_models[0]`, so free AR fields still appear only for Pro or Dokan rows.
  - `Field/Viewer.php`: `preserveProData` and `syncPremiumSource` are unchanged. Only labels changed, plus the Classic `button_set` for `bp_3d_loading`, which stores the same value.
- **bfields `Metabox.php:739-740`:** `sanitize_text_field` on the date parts (`aa`/`mm`/`jj`/`hh`/`mn`) is applied to both sides of the `!==` comparison. Values are numeric strings, so the "date changed" decision is unchanged.

## 4. Rule 2: old models render

**Default parity:** no attribute or default changed in `block.json`, TS or PHP, so there is no drift.

**Old-payload walk:**

| Path | Result |
|---|---|
| Block, Woo, Elementor, admin preview | Unchanged read paths. |
| Classic shortcode `[3d_viewer id]` | **Changed (M1).** When `modelUrl` is empty, visitors now get `""` instead of an empty `.modelViewerBlock` (scripts are no longer enqueued). Editors get an inline notice. On dev.local, 0 of the 73 no-model viewers have a poster, so nothing visible is lost there. A poster-only viewer elsewhere would now render nothing. Needs sign-off and a changelog line. |
| Gutenberg-built viewers | Return before the no-model check (`:77-79`). Unaffected. |

**Visual changes S1–S3** (round buttons, QR card, RTL) are now in the 2.1.1 changelog (`readme.txt:413-417`), so they count as accepted.

**Empirical check (curl):**
- `bp3d-vs-page-classicold`, `bp3d-vs-page-classicswatch` and two Woo products each render one `.modelViewerBlock`.
- 0 `Fatal error|Warning:|Notice:|Deprecated:` matches.
- 0 new PHP log lines.

## 5. Rule 3: errors

| Check | Result |
|---|---|
| `php -l` on all 31 changed PHP files with PHP **8.4.11** and **7.4.30** | **PASS**: 62/62 "No syntax errors detected" |
| Grep of added PHP lines for 8.0+ syntax | **PASS**: no hits. `Promo.php` uses an indented nowdoc closing marker, which needs PHP 7.3+, and 7.4 lint passes. |
| `wp eval --user=2 do_shortcode('[3d_viewer id=9109]')` | **FAIL**: the `TypeError` in B1. As an admin it returns the notice; as a visitor it returns `string(0) ""`. |
| `wp eval 'echo "boot ok";'` | **PASS** (free 2.1.1 active, Premium inactive) |
| Frontend `curl` on 2 classic pages and 2 products | **PASS**: 0 error strings, viewers present; PHP log: 0 new lines |
| `npx tsc --noEmit` | 1 error, **pre-existing**: `Style.tsx(117,17) TS2322`, the same as on 12 Nov and at `v2.1.0` (bpl-tools `ColorControl` typing) |
| `wp plugin check 3d-viewer --exclude-directories=…` | **No findings in `inc/`, `lib/`, `admin/` or `3d-viewer.php`**. Remaining findings are on files that do not ship: hidden files (`.DS_Store`, `.pcpignore`, `.eslintrc.js`, `.gitignore`) and root `*.md`. The one shipped exception: 12 `PrefixAllGlobals` warnings in `3d-viewer-block/build/render.php` (`$tdvb*`, legacy block, pre-existing; L6). |
| `wp-content/object-cache.php` after the runs | **absent** |
| Grep of added TS/TSX for `console.log`, `debugger`, `@ts-ignore`, `TODO`, `dev.local`, `localhost` | **PASS**: none |
| `bp-utils` dependency removal (`package.json`) | **PASS**: no `src` import is left. `elementor.tsx` now imports the tracked `src/utils/jsonParse.ts`. It is absent from `package-lock.json` and from `../bpl-tools`. |
| Build freshness | Every `build/*` file is dated 18 Nov 15:54, later than the newest changed `src` file (18 Nov 08:15). **But this is a dev build (M2).** |

## 6. Release hygiene

**Version:** consistent at **2.1.1**:
- `3d-viewer.php:8`
- `BP3D_VERSION` `:68`
- `readme.txt:7` Stable tag
- top changelog `= 2.1.1 - 16 November, 2026 =` (`:412`)
- Source Code tag `v2.1.1` (`:259`)

`Tested up to` was removed from the main-file header. That is harmless, because the readme's `7.1` governs.

**Readme limits:**

| Item | Result |
|---|---|
| Short description | **142** characters (150 max). OK. Wording accepted. |
| Title | Matches the `Plugin Name` header. Accepted. |
| Word cap (`wc -w`) | Description **1,123** + Source Code / External Services / Third-Party Libraries **1,284** = **2,407** of 2,500. 93 words of headroom. |
| Tags | 5. OK. |

**Zip (`package.json:11`):**
- **Ships:**
  - `inc/Promo.php` (`inc` is included whole) and `admin/images/logo.svg`.
  - `lib/bfields/languages` (`.json`, `.mo`, `.pot`); `*.po` is excluded.
- **Excluded or not listed:**
  - `.pcpignore`, `.commandcode/`, `plan/`, `src/`, `tests/` and root `*.md`.
  - `lib/bfields/{ui,node_modules,README.md,package.json,composer.json,tsconfig.json,webpack.config.js}`, `inc/Integrations/Dokan/README.md` and `*.map`.
- Nothing needed is missing.

**Readme facts checked against code:**
- Correct:
  - FluentCart 2.2.0 minimum (`FluentCart.php:17`).
  - "Marketplace (Dokan)" (`Dokan/Settings.php:54`).
  - The Elementor labels "Lazy Load" and "3D File Download Button", and the "Exposure" and "Environment Image" controls.
  - "AR on WooCommerce product pages is part of Pro": free only shows AR fields for Pro or Dokan `bp3d_models[0]` rows (`ProductMeta.php:173-174`), and the merge-save never creates that row.
- The Promo's Pro chips ("AR on Product Pages", "Real-Time 3D Product Configuration", "WooCommerce 3D Gallery") agree with the readme and with `features.ts` `COMPARE_ROWS`.
- The approved edits are present: the tracking FAQ (`:238`) starts "The free version doesn't.", and "lighting controls" no longer appears in the readme.

**Findings**

| Sev | file:line | Issue | Fix |
|---|---|---|---|
| MEDIUM | `inc/Shortcode/Shortcode.php:89-96`; `readme.txt:412-418` | **M1.** Visible behaviour change: viewers with no model now print nothing for visitors and a notice for editors. There is no changelog line. | After B1, get sign-off and add e.g. `* Changed: A [3d_viewer] viewer with no model shows nothing to visitors and a notice to editors.` |
| MEDIUM | `build/` | **M2.** `build/` is currently `wp-scripts start` output, and a watcher process is running. The files are unminified and have `.map` files: `frontend.js` is 190 KB here vs 52.6 KB in the 18 Nov 09:41 zip; `dashboard.js` is 656 KB vs 161 KB. Running `npm run zip` alone would ship dev bundles. | Stop the watcher and run `npm run build`, which builds for production and then zips. |
| MEDIUM | `readme.txt:210`, `:218`, `:234` | **M3** (open since 12 Nov). The FAQ paths say "Woocommerce Settings" and "General Settings", but the New interface (the default) names these tabs "WooCommerce" and "General" (`Settings.php:93`, `:130`). At `:210`, "Gallery Selector there" is wrong: it is on the Woo Selectors tab (`:195-204`). | This is copywriter text, so it is reported only. Raju decides. |
| MEDIUM | `readme.txt:259` | **M4.** The tag `v2.1.1` does not exist locally or on `origin` (`git ls-remote` shows only `v2.1.0`). | Tag and push before the SVN commit. |
| LOW | `readme.txt:412-418`; `src/admin/dashboard/utils/data.tsx` | **L1.** The changelog is missing: "Fixed: Shop Zen theme gallery" (`Utils.php:158`, `manageIncompatibleTheme.tsx:34`); "Fixed: Classic viewer list copies the full shortcode" (`PostTypeModelViewer.php:179`); and the Classic "(legacy)" label and "No poster" list changes. A Black Friday line is optional: it is a temporary admin notice, not a feature. The changelog date says 16 Nov, but "What's new" in `data.tsx` says `2026-11-14`. Set both to the real release date. | Add the lines. |
| LOW | `src/blocks/3d-viewer/data.ts:31` | **L2** (carry-over). "STEP and 14 more" is wrong: the readme lists 19 Advanced formats, so 15 more after naming 4. | Use "15 more" or "and more". |
| LOW | `package.json:8` | **L3** (carry-over). The `i18n` script still chains `copy`, so the build ships an empty `3d-viewer-en_US.po` and 9 empty `en_US` JSON files. They are harmless. The `.pot` itself is now fresh (18 Nov): it has "Classic (legacy)", "This 3D viewer has no model yet" and the Black Friday strings. | Drop `copy` from the `i18n` script. |
| LOW | `inc/Promo.php:11`, `:72-76`, `:474-478` | **L4.** The expiry uses UTC (WordPress forces UTC), so the banner ends 6 Dec 05:59 Dhaka time. `ajax_dismiss` has no capability check; it only writes the caller's own meta, so this is harmless. The dismiss meta is not removed by `uninstall.php`. The class becomes dead code after 5 Dec. | Remove the class in the first release after 5 Dec. |
| LOW | `inc/Promo.php:39-42` | **L5.** The banner also shows on the main WP Dashboard (`index.php`), while the docblock at `:94` says "Only show inside 3D Viewer admin menu". It is permanently dismissible, so it is within wp.org guideline 11. | Optional: drop the Dashboard match. |
| LOW | `3d-viewer-block/build/render.php:4-18` | **L6.** Plugin Check: 12 `NonPrefixedVariableFound` warnings (pre-existing). Memory says the legacy block is built in another workspace. | Write a note for that workspace; don't patch it here. |
| LOW | `readme.txt:152` | **L7** (known). The `<?php … ?>` snippet renders empty on wp.org. | Known and unresolved. |
| NOTE | `src/blocks/3d-viewer/style.scss:582` | RTL `model-viewer{direction:ltr}` is unscoped (carry-over). | |

## 7. Previous report (12 Nov) items

| 12 Nov finding | Status | Evidence |
|---|---|---|
| HIGH: version still 2.1.0, no changelog | **FIXED** | Everything says 2.1.1 (§6). |
| HIGH: short description 153 characters, "Support", free product AR | **FIXED** (142 characters). Wording **ACCEPTED** by Raju. | `readme.txt:12` |
| HIGH: bfields vendored CSS mismatch | **STILL OPEN** | H1 |
| HIGH: readme tag `v2.1.0` | **FIXED** in text (`v2.1.1`). The tag itself is not created yet (M4). | `readme.txt:259` |
| MEDIUM: custom icon colours on `.control-btn` | **FIXED** (documented) | `readme.txt:413` |
| MEDIUM: FAQ settings paths | **STILL OPEN** (copywriter text; reported only) | M3 |
| LOW: "14 more" | **STILL OPEN** | L2 |
| LOW: stale `.pot` and empty `en_US` catalogue | `.pot` **FIXED**; `en_US` **STILL OPEN** | L3 |
| NOTE: RTL rule unscoped | **STILL OPEN** (note) | `style.scss:582` |
| S1 buttons, S2 QR card, S3 RTL | **ACCEPTED** (in the changelog) | `readme.txt:413-417` |
| S4 admin changes | **ACCEPTED** in part: Reset buttons and the box move are in the changelog; the "(legacy)" label and the list changes are not (L1). | |
| S5 mixed icon styles in the Woo gallery | **STILL OPEN** (note) | `ShopLoopItemComponents.tsx:33-34` is unchanged. |
| §9 Woo AR in free | **ACCEPTED**: the readme now matches the code. | §6 |
| Port A7: Classic nav ellipsis truncates translated tabs | **STILL OPEN** | `admin/css/admin-style.css:4-9` |
| Port A8: chip unstyled when the filter pins the viewer to Classic on a Modern site | **STILL OPEN** (edge case). Classic now always prints the chip (`PostTypeModelViewer.php:179`), while its CSS is only in `admin-style.css`. | `EnqueueAssets.php:58-63` |
| Port: InfoTip tooltips (optional) | **STILL OPEN** | `src/components/Label.tsx` |

## 8. Not verified

- **The Promo banner in a browser:**
  - its layout on the full-page React screens (Help & Demos, Guided Setup);
  - the dismiss round trip;
  - the "45% OFF" figure against the real coupon or pricing page.
- **Playwright e2e:** not run. The specs changed only for labels.
- **AR on devices, STEP and 3MF loads, RTL rendering:** no device or browser QA.
- **The GitHub repository** `bPlugins/3d-viewer-wp`: not checked against this tree.
- **wp.org rendering:** how wp.org renders the new readme (only the known L7 issue).

## 9. Today's changes (18 Nov): verification

| Change | Result |
|---|---|
| **Promo:** capability | `manage_options` check at `:90` (banner and assets) and `:129` (plugin action link). OK. |
| **Promo:** assets | Registered src-less handles with `wp_add_inline_style` / `wp_add_inline_script`, on `admin_enqueue_scripts` (`:18`, `:146-156`). OK. |
| **Promo:** i18n | The headline is the one placeholder string: `%s` takes the badge, a translators comment precedes it, and `wp_kses` allows only `span[class]` (`:440-441`). The other strings are plain `esc_html_e`. OK. |
| **Promo:** expiry and Pro check | Expires `2026-12-05 23:59:59` (`:11`). Hidden when `bp3d_fs()->can_use_premium_code()` (`:110`, `:129`). OK. |
| **Promo:** dismiss | Nonce `bp3d_dismiss_promo` is created at `:385` and checked with `check_ajax_referer` at `:475`. Only `wp_ajax_` is registered, so the action is logged-in only. OK. |
| **Promo:** output and wiring | Escaped (`esc_url` / `esc_html` / `esc_attr`). `class_exists` guard. Wired at `Init.php:56` and resolves to `inc/Promo.php`. `admin/images/logo.svg` exists. The same class name exists in Premium, but only one plugin runs at a time. OK. |
| **PCP:** `AdminUi.php:189`, `:230` | `esc_url_raw` keeps a relative `/wp-admin/…` path, and `wp_validate_redirect` is unchanged. OK. |
| **PCP:** `AdminUi.php:318-319` | `wp_kses_post` keeps `<a href class>`, `<br>` and `<span class>`. OK. |
| **PCP:** `Viewer.php:38` | The sanitized `REQUEST_METHOD` still matches `'GET'`. OK. |
| **PCP:** `3d-viewer.php` | `$bp3d_bpem_bootstrap` has no other references. Both phpcs:ignore comments are in place, and the `model-viewer` fallback is kept. OK. |
| **PCP:** `ExtendMimeType.php:254`, `:272` | The disable/enable pair brackets only `fopen`/`fread`/`fclose`. OK. |
| **PCP:** ignore comments in `VendorPolicy`, `ViewerListModern`, `RestMetaGuard`, `Shortcode` (`:159`, `:161`) and `ClassicForm` | Comments only. OK. **But `Shortcode.php` also carries the unrelated no-model change: B1 and M1.** |
| **bfields:** line-2 `TextDomainMismatch` disable | Present in 9 files. OK. |
| **bfields:** `Mount.php` `(int) $safety` | Harmless: the value is already `max(60, (int) …)` (`:209-213`). OK. |
| **bfields:** `Metabox.php` | Ignore comments, and sanitized date parts (§3). OK. |
| **bfields:** `helpers.php`, `hooks.php` | Comments only. OK. |
| **bfields:** sibling `../bfields` | Has the same PHP edits, uncommitted (H1). |
| **readme** | 142 characters; title matches the header; approved edits present; word cap 2,407; L7 known. |
| **`.pcpignore`** | Not in the zip list. Plugin Check reports it as a hidden file only because the scan ran on the working folder. OK. |

## 10. Assumptions

- The release is `v2.1.0` → the staged working tree, as version 2.1.1.
- Accepted decisions, per the caller: the short description, the title, and the copywriter's verbatim Description, Installation and FAQ text.
- Nothing was edited, built, committed or deleted, and no option, post, user or plugin state was changed on dev.local. The commands that ran were `wp eval` (read-only), `wp plugin check`, `curl`, `tsc --noEmit` and `git ls-remote`.
- Files written:
  - this report;
  - scratch files in `/private/tmp/claude-501/-Users-raju-Local-Sites-dev-app-public-wp-content-plugins-3d-viewer/7d4980eb-3a0c-4e89-83c1-10985d2d313f/scratchpad/`.
- `wp-content/object-cache.php` was absent after every run.
