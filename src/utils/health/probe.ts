import { parseGlbProbe } from '../specGloss/detect';
import type { BodyKind, ProbeFacts } from './types';

/**
 * Browser probe for one model URL (plan §2.1). One streamed GET answers status, magic bytes, size and the glTF JSON;
 * cross-origin failures are told apart with a `no-cors` retry (Fable M3/M4). Writes nothing.
 */

/** As the PHP cap: a bigger JSON chunk or .gltf gives "unknown", never a verdict. */
export const GLTF_JSON_CAP = 4 * 1024 * 1024;
export const PROBE_TIMEOUT = 8000;

const GLB_HEADER_BYTES = 20;
const HTML_SNIFF_BYTES = 512;
const SNIFF_BYTES = 64 * 1024;
const MAX_SIBLINGS = 20;
const LOCAL_SCHEME = /^(data|blob|about|javascript|filesystem):/i;

/** Pro: returns the URL to fetch (signed when needed), or null when only the server can judge it. */
export type ProbeSigner = (url: string) => Promise<string | null>;

export interface ProbeOptions {
    sign?: ProbeSigner | null;
    /** Media frame `filesizeInBytes`, preferred over Content-Length. */
    knownSize?: number;
    timeoutMs?: number;
}

const pageUrl = (): string => (typeof window !== 'undefined' ? window.location.href : 'http://localhost/');

const parse = (url: string): URL | null => {
    try {
        return new URL(url, pageUrl());
    } catch {
        return null;
    }
};

const isSameOrigin = (url: URL): boolean => typeof window !== 'undefined' && url.origin === window.location.origin;

interface Reader {
    take(bytes: number): Promise<Uint8Array>;
    /** True once the body ended inside the bytes taken so far. */
    done(): boolean;
    cancel(): void;
}

// Reads a prefix of the body and stops; servers that ignore Range cost no more than they send before the cancel.
function bodyReader(res: Response): Reader {
    let buffered = new Uint8Array(0);
    let ended = false;
    const stream = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;

    const append = (chunk: Uint8Array) => {
        const next = new Uint8Array(buffered.byteLength + chunk.byteLength);
        next.set(buffered);
        next.set(chunk, buffered.byteLength);
        buffered = next;
    };

    return {
        async take(bytes) {
            if (!stream) {
                if (!ended) {
                    append(new Uint8Array(await res.arrayBuffer()));
                    ended = true;
                }
            }
            while (stream && !ended && buffered.byteLength < bytes) {
                const { done, value } = await stream.read();
                if (done) ended = true;
                else if (value) append(value);
            }
            return buffered.subarray(0, Math.min(bytes, buffered.byteLength));
        },
        done: () => ended,
        cancel() {
            stream?.cancel().catch(() => undefined);
        },
    };
}

const decode = (bytes: Uint8Array): string => {
    try {
        return new TextDecoder().decode(bytes);
    } catch {
        return '';
    }
};

/** glb / gltf / html from the first bytes; Content-Type only breaks a tie. */
export function sniffBody(bytes: Uint8Array, contentType = ''): BodyKind {
    if (!bytes.byteLength) return 'empty';
    if (bytes.byteLength >= 4 && decode(bytes.subarray(0, 4)) === 'glTF') return 'glb';

    const text = decode(bytes.subarray(0, HTML_SNIFF_BYTES)).replace(/^﻿/, '').trimStart().toLowerCase();
    if (text.startsWith('{')) return 'gltf';
    if (text.startsWith('<!doctype') || (text.startsWith('<') && /<(html|head|body)[\s>]/.test(text))) return 'html';
    if (/text\/html/i.test(contentType) && text.startsWith('<')) return 'html';

    return 'other';
}

const parseJson = (bytes: Uint8Array): Record<string, any> | null => {
    try {
        const json = JSON.parse(decode(bytes).replace(/^﻿/, ''));
        return json && typeof json === 'object' ? json : null;
    } catch {
        return null;
    }
};

async function readJson(reader: Reader, body: BodyKind, contentLength: number | null): Promise<Record<string, any> | null | undefined> {
    if (body === 'glb') {
        const head = await reader.take(SNIFF_BYTES);
        const probe = parseGlbProbe(head.slice().buffer);
        if (!probe) return null;
        if (probe.json) return probe.json;
        if (probe.jsonLength > GLTF_JSON_CAP) return null;

        const full = await reader.take(GLB_HEADER_BYTES + probe.jsonLength);
        return parseGlbProbe(full.slice().buffer)?.json ?? null;
    }

    if (body === 'gltf') {
        if (contentLength !== null && contentLength > GLTF_JSON_CAP) return null;

        const bytes = await reader.take(GLTF_JSON_CAP + 1);
        if (bytes.byteLength > GLTF_JSON_CAP || !reader.done()) return null;
        return parseJson(bytes);
    }

    return undefined;
}

// Untrusted JSON: only plain relative paths count, never another host or a root path such as /wp-admin/.
const isRelativeUri = (uri: string): boolean => !!uri && !/^[a-z][a-z\d+.-]*:/i.test(uri) && !/^[\\/]/.test(uri);

/** Relative `buffers[].uri` / `images[].uri` of a .gltf that resolve inside its folder; data: URIs are inline. */
export function siblingUrls(json: Record<string, any>, base: string): string[] {
    let folder: URL;
    try {
        folder = new URL('./', base);
    } catch {
        return [];
    }

    const uris = [...(Array.isArray(json.buffers) ? json.buffers : []), ...(Array.isArray(json.images) ? json.images : [])]
        .map((item: any) => item?.uri)
        .filter((uri: unknown): uri is string => typeof uri === 'string' && isRelativeUri(uri));

    const resolved = uris
        .map((uri) => {
            try {
                const url = new URL(uri, base);
                return url.origin === folder.origin && url.pathname.startsWith(folder.pathname) ? url.href : '';
            } catch {
                return '';
            }
        })
        .filter(Boolean);

    return Array.from(new Set(resolved)).slice(0, MAX_SIBLINGS);
}

/** H06, browser form (D21): a sibling only counts as missing on a definite 404/410. */
async function countMissing(urls: string[], signal: AbortSignal): Promise<number> {
    const answers = await Promise.all(
        urls.map(async (url) => {
            try {
                const res = await fetch(url, { signal, headers: { Range: 'bytes=0-0' } });
                res.body?.cancel().catch(() => undefined);
                return res.status === 404 || res.status === 410;
            } catch {
                return false;
            }
        })
    );

    return answers.filter(Boolean).length;
}

const headerNumber = (res: Response, name: string): number | null => {
    const value = Number(res.headers?.get?.(name));
    return Number.isFinite(value) && value > 0 ? value : null;
};

async function readTarget(target: URL, timeoutMs: number, siblings: boolean): Promise<ProbeFacts> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    try {
        let res: Response;
        try {
            res = await fetch(target.href, { signal: controller.signal });
        } catch {
            if (timedOut) return { reach: 'unknown' };
            // Opaque TypeError: 404, HTML, missing CORS and a dead host all look alike, so ask without CORS.
            if (isSameOrigin(target)) return { reach: 'unreachable' };
            try {
                await fetch(target.href, { mode: 'no-cors', signal: controller.signal });
                return { reach: 'cors' };
            } catch {
                return { reach: timedOut ? 'unknown' : 'unreachable' };
            }
        }

        if (!res.ok) {
            res.body?.cancel().catch(() => undefined);
            return { reach: 'http-error', status: res.status };
        }

        const reader = bodyReader(res);
        try {
            const contentType = res.headers?.get?.('content-type') || '';
            const body = sniffBody(await reader.take(HTML_SNIFF_BYTES), contentType);
            // Content-Length is CORS-safelisted; a 206 would only give the range, so trust 200s alone.
            const contentLength = res.status === 200 ? headerNumber(res, 'content-length') : null;
            const json = await readJson(reader, body, contentLength).catch(() => null);

            const facts: ProbeFacts = { reach: 'ok', status: res.status, body };
            if (contentLength) facts.size = contentLength;
            if (json !== undefined) facts.json = json;
            if (siblings && body === 'gltf' && json) {
                const urls = siblingUrls(json, target.href);
                if (urls.length) facts.missingSiblings = await countMissing(urls, controller.signal);
            }
            return facts;
        } finally {
            reader.cancel();
        }
    } catch {
        return { reach: 'unknown' };
    } finally {
        clearTimeout(timer);
        controller.abort();
    }
}

/** Probes a model URL as the viewer would load it. Never rejects. */
export async function probeModel(url: unknown, options: ProbeOptions = {}): Promise<ProbeFacts> {
    const canonical = typeof url === 'string' ? url.trim() : '';
    if (!canonical || LOCAL_SCHEME.test(canonical)) return { reach: 'skipped' };

    let fetchable: string | null = canonical;
    if (options.sign) {
        try {
            fetchable = await options.sign(canonical);
        } catch {
            fetchable = null;
        }
    }

    const target = fetchable ? parse(fetchable) : null;
    if (!target || !/^https?:$/.test(target.protocol)) return { reach: 'skipped' };

    // Both engines upgrade http to https on an https page (matchProtocol), so probe what they load (F4).
    const upgraded = target.protocol === 'http:' && typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (upgraded) target.protocol = 'https:';

    // A signed URL's siblings would carry no signature, so only unsigned .gltf files get H06.
    const facts = await readTarget(target, options.timeoutMs ?? PROBE_TIMEOUT, fetchable === canonical);

    // Any HTTP answer, even a 404, proves https works; only a failed connection means it doesn't.
    if (upgraded && facts.reach !== 'unknown') {
        if (facts.reach === 'unreachable') return { reach: facts.reach, httpsUpgrade: 'fails' };
        facts.httpsUpgrade = 'works';
    }

    if (options.knownSize && options.knownSize > 0) facts.size = options.knownSize;

    return facts;
}

// Signing parameters change on every signature; the rest of the query can name a different file (Drive id=, get.php?f=).
const SIGNING_PARAMS = ['signature', 'expires', 'token', 'awsaccesskeyid', 'key-pair-id', 'policy', 'googleaccessid'];
const SIGNING_PREFIXES = ['x-amz-', 'x-goog-'];
const AZURE_SAS = ['sv', 'ss', 'srt', 'sp', 'se', 'st', 'spr', 'sig', 'sr', 'si', 'sdd', 'skoid', 'sktid', 'skt', 'ske', 'sks', 'skv'];

/**
 * Health key source: host + path + sorted query, signing parameters stripped (step 6). PHP hashes the same string.
 * Azure SAS names are short and generic, so they are dropped only when the URL carries a `sig`.
 */
export function healthKey(url: unknown): string {
    const raw = typeof url === 'string' ? url.trim() : '';
    if (!raw) return '';

    let parsed: URL;
    try {
        parsed = new URL(raw, pageUrl());
    } catch {
        return raw;
    }
    if (!/^https?:$/.test(parsed.protocol)) return raw.split('#')[0];

    const params: [string, string][] = [];
    parsed.searchParams.forEach((value, name) => params.push([name, value]));
    const azure = params.some(([name]) => name.toLowerCase() === 'sig');
    const kept = params
        .filter(([name]) => {
            const lower = name.toLowerCase();
            if (SIGNING_PARAMS.includes(lower) || SIGNING_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;
            return !(azure && AZURE_SAS.includes(lower));
        })
        .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
        .sort();

    return parsed.host.toLowerCase() + parsed.pathname + (kept.length ? '?' + kept.join('&') : '');
}

const fileKey = (url: unknown): string =>
    String(url ?? '').trim().split(/[?#]/)[0].replace(/^([a-z][a-z\d+.-]*:)?\/\//i, '').toLowerCase();

/** The size the media frame already knows for this file (as 2.3.0's fromMediaLibrary()), else 0. */
export function mediaLibrarySize(url: unknown): number {
    const all = typeof window !== 'undefined' ? (window as any).wp?.media?.model?.Attachments?.all : null;
    if (!all || typeof all.find !== 'function') return 0;

    const key = fileKey(url);
    if (!key) return 0;

    const model = all.find((m: any) => typeof m?.get === 'function' && fileKey(m.get('url')) === key);
    const size = Number(model?.get?.('filesizeInBytes'));

    return Number.isFinite(size) && size > 0 ? size : 0;
}
