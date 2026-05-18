# 3D Viewer – Display Interactive 3D Models

[![Version](https://img.shields.io/badge/version-1.8.12-blue.svg)](https://wordpress.org/plugins/3d-viewer/)
[![WordPress](https://img.shields.io/badge/WordPress-6.5%2B-21759b.svg)](https://wordpress.org/)
[![PHP](https://img.shields.io/badge/PHP-7.4%2B-777bb4.svg)](https://www.php.net/)
[![License](https://img.shields.io/badge/license-GPLv2%2B-green.svg)](https://www.gnu.org/licenses/gpl-2.0.html)

A WordPress plugin to embed interactive 3D models and 360° product views into posts, pages, widgets, and WooCommerce product pages — no code required. Supports GLB, GLTF, OBJ, STL, FBX, DAE, PLY, and 3DS files.

> This is the developer README. For the user-facing plugin description, screenshots, and changelog, see [`readme.txt`](readme.txt).

## Links

- **Product page:** https://bplugins.com/products/3d-viewer/
- **Documentation:** https://bplugins.com/docs/3d-viewer/
- **WordPress.org:** https://wordpress.org/plugins/3d-viewer/
- **Support:** https://bplugins.com/support/

## Features

- Embed 3D models via Gutenberg block, shortcode, or Elementor widget
- Two viewer engines — **Lite** (Google `<model-viewer>`) and **Advanced** (Online 3D Viewer)
- WooCommerce product integration with variant galleries
- Touch / pan / zoom / rotate controls and auto-rotation
- Reusable viewer presets
- Lazy loading for performance

## Requirements

| | Minimum |
|---|---|
| WordPress | 6.5 |
| PHP | 7.4 |
| Node.js | 18+ (for development) |
| Composer | 2+ (for development) |

## Installation

### As a user

1. Upload the plugin folder to `/wp-content/plugins/`.
2. Activate it through the **Plugins** menu in WordPress.
3. Go to **3D Viewer → Add New**, upload a model, and copy the generated shortcode — or use the **3D Viewer** Gutenberg block.

To embed in a theme template: `<?php echo do_shortcode('YOUR_SHORTCODE'); ?>`

### From source

```bash
git clone https://github.com/bPlugins/3d-viewer-wp.git 3d-viewer
cd 3d-viewer
composer install   # PHP dependencies (Freemius SDK)
npm install        # JS/TS dependencies
npm run build      # compile assets into build/
```

## Development

Install dependencies, then start the watch build:

```bash
npm start          # wp-scripts dev build with file watching
```

### npm scripts

| Script | Purpose |
|---|---|
| `npm start` | Development build with watch (`wp-scripts start`) |
| `npm run build` | Production build, generate translations, and create the release zip |
| `npm run check-types` | Type-check the TypeScript source (`tsc --noEmit`) |
| `npm run i18n` | Regenerate `.pot` / `.po` / `.json` / `.mo` translation files |
| `npm run zip` | Package the distributable into `zip/3d-viewer.zip` |
| `npm run bundle` / `npm run deploy` | Bundle and deploy via Freemius (Gulp) |


## Contributing

Issues and pull requests are welcome at https://github.com/bPlugins/3d-viewer-wp.

Before submitting a PR, run `npm run check-types` and `npx playwright test`.

## License

[GPLv2 or later](https://www.gnu.org/licenses/gpl-2.0.html) — © [bPlugins](https://bplugins.com).
