#!/usr/bin/env node
/**
 * Builds a single-page screenshot gallery from the last test run.
 *
 * Every test stores a full-page screenshot in artifacts/test-results/
 * (screenshot mode "on" in playwright.config.ts). This collects them all
 * into artifacts/gallery.html — one place to eyeball the whole release.
 *
 * Run via: npm run test:e2e:gallery
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = path.join(E2E, 'artifacts', 'test-results');
const SPECS = path.join(E2E, 'specs');
const OUT = path.join(E2E, 'artifacts', 'gallery.html');

if (!existsSync(RESULTS)) {
    console.error('No artifacts/test-results directory — run the suite first: npm run test:e2e');
    process.exit(1);
}

// Spec file basenames, longest first so "01-admin-surfaces" wins over "01-admin"
const specNames = readdirSync(SPECS)
    .filter((f) => f.endsWith('.spec.ts'))
    .map((f) => f.replace('.spec.ts', ''))
    .sort((a, b) => b.length - a.length);

const entries = [];
for (const dir of readdirSync(RESULTS, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const files = readdirSync(path.join(RESULTS, dir.name));
    const shots = files.filter((f) => /^test-(finished|failed)-\d+\.png$/.test(f)).sort();
    if (!shots.length) continue;

    const failed = shots.some((f) => f.startsWith('test-failed'));
    const spec = specNames.find((s) => dir.name.startsWith(s)) || 'other';
    const label = dir.name
        .replace(new RegExp(`^${spec}-?`), '')
        .replace(/-(chromium|firefox|webkit)(-retry\d+)?$/, '')
        .replace(/-[0-9a-f]{5}-/g, ' … ') // playwright's truncation hash
        .replace(/-/g, ' ')
        .trim();

    entries.push({
        spec,
        label: label || dir.name,
        failed,
        // relative to artifacts/, where gallery.html lives
        images: shots.map((f) => path.join('test-results', dir.name, f)),
    });
}

if (!entries.length) {
    console.error('No screenshots found in artifacts/test-results — run the suite first.');
    process.exit(1);
}

entries.sort((a, b) => a.spec.localeCompare(b.spec) || a.label.localeCompare(b.label));

const bySpec = new Map();
for (const e of entries) {
    if (!bySpec.has(e.spec)) bySpec.set(e.spec, []);
    bySpec.get(e.spec).push(e);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const failedCount = entries.filter((e) => e.failed).length;

const sections = [...bySpec.entries()]
    .map(([spec, items]) => {
        const cards = items
            .map((e) =>
                e.images
                    .map(
                        (img, i) => `
      <figure class="card${e.failed ? ' failed' : ''}">
        <a href="${esc(img)}" target="_blank"><img src="${esc(img)}" loading="lazy" alt="${esc(e.label)}"></a>
        <figcaption>
          <span class="badge">${e.failed ? 'FAILED' : 'passed'}</span>
          ${esc(e.label)}${e.images.length > 1 ? ` (${i + 1}/${e.images.length})` : ''}
        </figcaption>
      </figure>`
                    )
                    .join('')
            )
            .join('');
        return `
  <section>
    <h2>${esc(spec)}</h2>
    <div class="grid">${cards}
    </div>
  </section>`;
    })
    .join('');

const html = `<!doctype html>
<meta charset="utf-8">
<title>3D Viewer e2e — screenshot gallery</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 -apple-system, system-ui, sans-serif; margin: 2rem; background: Canvas; color: CanvasText; }
  h1 { font-size: 1.4rem; }
  h1 small { font-weight: normal; opacity: .7; }
  h2 { font-size: 1.05rem; border-bottom: 1px solid color-mix(in srgb, CanvasText 20%, transparent); padding-bottom: .3rem; margin-top: 2.2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
  .card { margin: 0; border: 1px solid color-mix(in srgb, CanvasText 15%, transparent); border-radius: 8px; overflow: hidden; background: color-mix(in srgb, CanvasText 4%, Canvas); }
  .card.failed { border-color: #d63638; box-shadow: 0 0 0 2px #d6363855; }
  .card img { display: block; width: 100%; aspect-ratio: 16/10; object-fit: cover; object-position: top; background: #fff; }
  .card a:hover img { object-fit: contain; }
  figcaption { padding: .5rem .7rem; font-size: .8rem; }
  .badge { display: inline-block; font-size: .65rem; font-weight: 700; text-transform: uppercase; border-radius: 999px; padding: .1rem .5rem; margin-right: .4rem; background: #00a32a22; color: #00a32a; }
  .failed .badge { background: #d6363822; color: #d63638; }
</style>
<h1>3D Viewer e2e — screenshot gallery
  <small>· ${entries.length} tests · ${failedCount ? `${failedCount} failed` : 'all passed'} · ${new Date().toLocaleString()}</small>
</h1>
<p>Full-page screenshot of every test from the last run. Click any image to open it full size (hover to fit the whole page into the tile).</p>
${sections}
`;

writeFileSync(OUT, html);
console.log(`Gallery with ${entries.length} tests → ${OUT}`);
