/**
 * wp-cli wrappers around the PHP helpers next to this file: raw record bytes, seeded viewers
 * and product fixtures. Everything these create is titled "E2E-3DV …".
 */
import fs from 'fs';
import path from 'path';
import { SITE_ROOT, wp, wpEvalFile } from '../wp';

const HERE = __dirname;
// Inside the site, so Studio's sandboxed PHP can read the input files too.
const TMP = path.join(HERE, '..', 'artifacts', 'tmp');

export type Raw = {
    settings: string | null;
    options: Record<string, string | null>;
    viewer?: string | null;
    rows?: number;
    modified?: string;
    product?: string | null;
    product_rows?: number;
    product_modified?: string;
};
export type Diff = { path: string; kind: string; before: string; after: string; rule: string };

type RawTarget = { viewer?: number; product?: number; options?: string[] };

function rawArgs({ viewer, product, options }: RawTarget): Record<string, string | number> {
    return {
        ...(viewer ? { viewer } : {}),
        ...(product ? { product } : {}),
        ...(options?.length ? { options: options.join(',') } : {}),
    };
}

function inputFile(name: string, body: object): string {
    fs.mkdirSync(TMP, { recursive: true });
    const file = path.join(TMP, `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
    fs.writeFileSync(file, JSON.stringify(body));
    return file;
}

/** Base64 bytes of the options, viewer meta and product meta named in `target`. */
export function captureRaw(target: RawTarget = {}): Raw {
    return JSON.parse(wpEvalFile(path.join(HERE, 'raw-records.php'), { action: 'get', ...rawArgs(target) }) || '{}');
}

/** Writes captured bytes back to rows that still exist (never inserts or deletes). */
export function restoreRaw(target: RawTarget, captured: Raw): boolean {
    const file = inputFile('set', captured);
    const out = wpEvalFile(path.join(HERE, 'raw-records.php'), { action: 'set', in: path.relative(SITE_ROOT, file), ...rawArgs(target) });
    return out === 'true';
}

/** Field-level differences between two serialized records. */
export function diffRaw(a: string, b: string): Diff[] {
    const file = inputFile('diff', { a, b });
    return JSON.parse(wpEvalFile(path.join(HERE, 'raw-records.php'), { action: 'diff', in: path.relative(SITE_ROOT, file) }) || '[]');
}

export const showDiff = (d: Diff) =>
    `${d.path} (${d.kind})\n      before: ${d.before}\n      after:  ${d.after}${d.rule ? `\n      rule:   ${d.rule}` : ''}`;

/** New published (or draft/private) viewers in the free classic shape. */
export function seedViewers(count: number, tag: string, url: string, status: 'publish' | 'draft' | 'private' = 'publish'): number[] {
    const out = wpEvalFile(path.join(HERE, 'viewer-seed.php'), { count, url, tag: `${tag} ${Date.now()}`.replace(/\s+/g, '_'), status });
    return JSON.parse(out || '[]');
}

/** A simple product with a free-shape (or Pro-keys) `_bp3d_product_`; returns its ID. */
export function createProduct(shape: 'free' | 'pro', url: string, tag: string = shape): number {
    return Number(wpEvalFile(path.join(HERE, 'product-fixture.php'), { action: 'create', shape, url, tag: tag.replace(/\s+/g, '_') })) || 0;
}

/** Deletes a product made by createProduct() (the script refuses anything not titled E2E-3DV). */
export function deleteProduct(id: number) {
    if (id) wpEvalFile(path.join(HERE, 'product-fixture.php'), { action: 'delete', id }, { allowFail: true });
}

/** A post meta value decoded from JSON ('' when absent). */
export function postMeta(id: number, key: string): any {
    const out = wp(['post', 'meta', 'get', String(id), key, '--format=json'], { allowFail: true, retries: 0 });
    return out ? JSON.parse(out) : '';
}

export function postField(id: number, field: string): string {
    return wp(['post', 'get', String(id), `--field=${field}`]) ?? '';
}
