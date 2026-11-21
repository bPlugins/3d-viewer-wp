export const SPEC_GLOSS_EXTENSION = 'KHR_materials_pbrSpecularGlossiness';

export type SpecGlossVerdict = 'clean' | 'specgloss' | 'unknown';

const GLB_MAGIC = 0x46546c67;
const GLB_HEADER_BYTES = 20;
const PROBE_BYTES = 64 * 1024;
const MAX_JSON_BYTES = 4 * 1024 * 1024;
const MEMO_LIMIT = 200;

interface GlbProbe {
    jsonLength: number;
    json: Record<string, any> | null;
}

// Reads the GLB header and the JSON chunk when the buffer holds all of it.
export function parseGlbProbe(buffer: ArrayBuffer): GlbProbe | null {
    if (buffer.byteLength < GLB_HEADER_BYTES) return null;

    const view = new DataView(buffer);
    if (view.getUint32(0, true) !== GLB_MAGIC) return null;

    const jsonLength = view.getUint32(12, true);
    const available = buffer.byteLength - GLB_HEADER_BYTES;
    if (available < jsonLength) return { jsonLength, json: null };

    return { jsonLength, json: decodeJson(new Uint8Array(buffer, GLB_HEADER_BYTES, jsonLength)) };
}

/** Same as parseGlbProbe but for an in-memory GLB, without copying the buffer. */
export function parseGlbJsonFromBytes(bytes: Uint8Array): Record<string, any> | null {
    if (bytes.byteLength < GLB_HEADER_BYTES) return null;

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(0, true) !== GLB_MAGIC) return null;

    const jsonLength = view.getUint32(12, true);
    if (jsonLength <= 0 || bytes.byteLength - GLB_HEADER_BYTES < jsonLength) return null;

    return decodeJson(bytes.subarray(GLB_HEADER_BYTES, GLB_HEADER_BYTES + jsonLength));
}

export function hasSpecGloss(json: Record<string, any> | null): boolean {
    if (!json) return false;

    if (declaresSpecGloss(json)) return true;

    return Array.isArray(json.materials) && json.materials.some((m: any) => m?.extensions && SPEC_GLOSS_EXTENSION in m.extensions);
}

/** True only when the extension is listed in extensionsUsed/extensionsRequired. */
export function declaresSpecGloss(json: Record<string, any> | null): boolean {
    if (!json) return false;

    const declared = [...(json.extensionsUsed || []), ...(json.extensionsRequired || [])];

    return declared.includes(SPEC_GLOSS_EXTENSION);
}

const isGltfJsonUrl = (url: string) => /\.gltf(\?|#|$)/i.test(url);
const isGlbUrl = (url: string) => /\.glb(\?|#|$)/i.test(url);

// Bounded: a long editor session can walk through a lot of URLs.
const memo = new Map<string, Promise<SpecGlossVerdict>>();

function remember(url: string, pending: Promise<SpecGlossVerdict>) {
    if (memo.size >= MEMO_LIMIT) {
        const oldest = memo.keys().next().value;
        if (oldest !== undefined) memo.delete(oldest);
    }
    memo.set(url, pending);
}

export function detectSpecGloss(url: string, timeoutMs = 4000): Promise<SpecGlossVerdict> {
    if (!url || (!isGlbUrl(url) && !isGltfJsonUrl(url))) return Promise.resolve('clean');

    const cached = memo.get(url);
    if (cached) return cached;

    const pending = runDetection(url, timeoutMs).catch((): SpecGlossVerdict => 'unknown');
    remember(url, pending);
    // An 'unknown' verdict is transient (network hiccup), so let a later call retry.
    pending.then((verdict) => { if (verdict === 'unknown') memo.delete(url); });
    return pending;
}

/** Forgets a URL so the next check re-fetches it (used after a conversion). */
export function forgetSpecGloss(url?: string) {
    if (url) memo.delete(url);
    else memo.clear();
}

async function runDetection(url: string, timeoutMs: number): Promise<SpecGlossVerdict> {
    const json = await fetchGltfJson(url, timeoutMs);
    if (!json) return 'unknown';
    return hasSpecGloss(json) ? 'specgloss' : 'clean';
}

// No extension in the path at all, as with a Google Drive file URL.
const hasNoExtension = (url: string) => {
    try {
        return !/\.[a-z0-9]+$/i.test(new URL(url, window.location.href).pathname);
    } catch {
        return false;
    }
};

/**
 * The glTF JSON of a .gltf or .glb URL, reading only a GLB's JSON chunk; null when it cannot be read.
 * `sniff` also tries extensionless URLs as GLB (the header check rejects anything else).
 */
export async function fetchGltfJson(url: string, timeoutMs = 4000, { sniff = false } = {}): Promise<Record<string, any> | null> {
    if (!url) return null;
    if (!isGlbUrl(url) && !isGltfJsonUrl(url) && !(sniff && hasNoExtension(url))) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        if (isGltfJsonUrl(url)) {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) return null;
            return await res.json();
        }

        const head = await fetchPrefix(url, PROBE_BYTES, controller.signal);
        const probe = parseGlbProbe(head);
        if (!probe) return null;
        if (probe.json) return probe.json;
        if (probe.jsonLength > MAX_JSON_BYTES) return null;

        const full = await fetchPrefix(url, GLB_HEADER_BYTES + probe.jsonLength, controller.signal);
        return parseGlbProbe(full)?.json ?? null;
    } finally {
        clearTimeout(timer);
    }
}

// Asks for a byte range but copes with servers that ignore it by reading only what is needed.
async function fetchPrefix(url: string, bytes: number, signal: AbortSignal): Promise<ArrayBuffer> {
    const res = await fetch(url, { signal, headers: { Range: `bytes=0-${bytes - 1}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (!res.body) {
        const buf = await res.arrayBuffer();
        return buf.slice(0, bytes);
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (received < bytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
    }
    reader.cancel().catch(() => undefined);

    const out = new Uint8Array(Math.min(received, bytes));
    let offset = 0;
    for (const chunk of chunks) {
        const take = Math.min(chunk.byteLength, out.byteLength - offset);
        out.set(chunk.subarray(0, take), offset);
        offset += take;
        if (offset >= out.byteLength) break;
    }
    return out.buffer;
}

function decodeJson(bytes: Uint8Array): Record<string, any> | null {
    try {
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_e) {
        return null;
    }
}
