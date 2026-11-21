import { advancedViewerCannotRead, modelExtension } from '../cloud/advancedViewer';
import { SPEC_GLOSS_EXTENSION } from '../specGloss/detect';
import type { Finding, ProbeFacts, Variant } from './types';

// model-viewer sniffs the bytes, so script endpoints (get.php?f=x.glb) and VRM (a GLB) load fine; no extension = no verdict.
export const LITE_OK = ['glb', 'gltf', 'vrm', 'php', 'asp', 'aspx', 'ashx', 'jsp', 'cgi'];
export const ADVANCED_OK = ['obj', '3ds', 'stl', 'ply', 'off', '3dm', 'fbx', 'dae', 'wrl', '3mf', 'amf', 'ifc', 'brep', 'step', 'stp', 'iges', 'igs', 'fcstd', 'bim'];

/** Everything Online3DViewer imports (CanImportExtension in o3dv.min.js), archives included. */
export const ADVANCED_READS = [...ADVANCED_OK, 'glb', 'gltf', 'brp', 'svg', 'zip'];

/** H02: files neither engine opens. Not .zip: the Advanced viewer unpacks archives. */
export const NEITHER_OK = ['usdz', 'usd', 'usda', 'usdc', 'blend', 'skp', 'max', 'c4d', 'ma', 'mb', 'rar', '7z'];

/** Same list as src/utils/optimize/guards.ts, kept here so the editors don't bundle glTF-Transform (unit test pins both). */
export const COMPRESSION_EXTENSIONS = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'];

/** glTF extensions the bundled model-viewer (public/js/model-viewer.latest.min.js) reads; a unit test greps the bundle. */
export const MV_SUPPORTED_EXTENSIONS = [
    'KHR_binary_glTF',
    'KHR_draco_mesh_compression',
    'KHR_lights_punctual',
    'KHR_materials_anisotropy',
    'KHR_materials_clearcoat',
    'KHR_materials_dispersion',
    'KHR_materials_emissive_strength',
    'KHR_materials_ior',
    'KHR_materials_iridescence',
    'KHR_materials_sheen',
    'KHR_materials_specular',
    'KHR_materials_transmission',
    'KHR_materials_unlit',
    'KHR_materials_variants',
    'KHR_materials_volume',
    'KHR_mesh_quantization',
    'KHR_texture_basisu',
    'KHR_texture_transform',
    'EXT_materials_bump',
    'EXT_mesh_gpu_instancing',
    'EXT_meshopt_compression',
    'EXT_texture_avif',
    'EXT_texture_webp',
];

/** Known extensions the bundle lacks (the test asserts each is absent). H11 flags anything outside the supported list. */
export const MV_UNSUPPORTED_EXTENSIONS = [
    'KHR_materials_diffuse_transmission',
    'KHR_node_visibility',
    'KHR_accessor_float16',
    'KHR_accessor_float64',
    'KHR_mesh_primitive_restart',
    'KHR_animation_pointer',
    SPEC_GLOSS_EXTENSION,
];

const DRACO = 'KHR_draco_mesh_compression';
const MESHOPT = 'EXT_meshopt_compression';
const BASISU = 'KHR_texture_basisu';

export const HEAVY_BYTES = 10 * 1024 * 1024;

/** File extension, lowercase, with query and hash stripped (ModelLinks.php:142); '' when the URL has none. */
export const extOf = (url?: unknown): string => (typeof url === 'string' ? modelExtension(url.split('#')[0]) : '');

export const isLite = (currentViewer?: string): boolean => (currentViewer || 'modelViewer') === 'modelViewer';

/** Extensions of the models the Lite viewer can't show (the classic preview's LiteNotice). */
export const liteUnsupported = (attrs: Record<string, any>): string[] => {
    if (!isLite(attrs?.currentViewer)) return [];
    const urls: unknown[] = attrs?.multiple ? (attrs?.models || []).map((m: any) => m?.modelUrl) : [attrs?.model?.modelUrl];
    const exts = urls.map(extOf).filter((ext) => ext && !LITE_OK.includes(ext));
    return Array.from(new Set(exts));
};

export interface HealthContext {
    currentViewer?: string;
    variant: Variant;
    /** Defaults to 10 MB. */
    heavyBytes?: number;
    /** 2.2.1 item 10: model-viewer has a meshopt decoder wired. */
    meshoptDecoder?: boolean;
}

/** H01, H01b and H02: decided from the URL and engine alone. */
export function staticFindings(url: unknown, currentViewer?: string): Finding[] {
    if (typeof url !== 'string' || !url.trim()) return [];

    const ext = extOf(url);
    if (isLite(currentViewer)) {
        if (!ext) return [];
        if (NEITHER_OK.includes(ext)) return [{ id: 'H02', severity: 'cause', params: { ext } }];
        if (!LITE_OK.includes(ext)) return [{ id: 'H01', severity: 'cause', params: { ext, advanced: ADVANCED_OK.includes(ext) } }];
        return [];
    }

    if (advancedViewerCannotRead(url, currentViewer)) return [{ id: 'H01b', severity: 'cause', params: { url } }];
    if (NEITHER_OK.includes(ext)) return [{ id: 'H02', severity: 'cause', params: { ext } }];
    // Advanced picks its importer from the URL's extension alone, so get.php?f=x.glb fails there.
    if (currentViewer === 'O3DViewer' && ext && !ADVANCED_READS.includes(ext)) return [{ id: 'H01b', severity: 'cause', params: { url, ext } }];

    return [];
}

// glTF extension names are prefix_name identifiers; anything else in untrusted JSON is dropped.
const EXTENSION_NAME = /^[A-Za-z0-9_]{1,64}$/;
const MAX_NAMES = 5;

const unique = (value: unknown): string[] =>
    Array.isArray(value) ? Array.from(new Set(value.filter((v): v is string => typeof v === 'string' && EXTENSION_NAME.test(v)))) : [];

const capped = (exts: string[]): string[] => exts.slice(0, MAX_NAMES);

const hasSpecGlossMaterial = (material: any): boolean =>
    !!material && typeof material.extensions === 'object' && material.extensions !== null && SPEC_GLOSS_EXTENSION in material.extensions;

const DEFAULT_BASE = [1, 1, 1, 1];

// A spec/gloss material that also carries a metal/rough base color keeps its colors in model-viewer.
const keepsColor = (material: any): boolean => {
    const pbr = material?.pbrMetallicRoughness;
    if (!pbr) return false;
    if (pbr.baseColorTexture) return true;

    const factor = pbr.baseColorFactor;
    return Array.isArray(factor) && factor.some((v: unknown, i: number) => v !== DEFAULT_BASE[i]);
};

/** H11–H14 from the glTF JSON. Lite only: these are model-viewer's limits. */
export function jsonFindings(json: Record<string, any>, ctx: HealthContext): Finding[] {
    const findings: Finding[] = [];
    const required = unique(json.extensionsRequired);
    const declared = unique([...unique(json.extensionsUsed), ...required]);

    const unsupported = declared.filter((ext) => !MV_SUPPORTED_EXTENSIONS.includes(ext) && ext !== SPEC_GLOSS_EXTENSION);
    const requiredUnsupported = unsupported.filter((ext) => required.includes(ext));
    const usedUnsupported = unsupported.filter((ext) => !required.includes(ext));
    if (requiredUnsupported.length) findings.push({ id: 'H11', severity: 'cause', params: { exts: capped(requiredUnsupported) } });
    if (usedUnsupported.length) findings.push({ id: 'H11', severity: 'note', params: { exts: capped(usedUnsupported) } });

    if (ctx.meshoptDecoder && declared.includes(MESHOPT)) {
        findings.push({ id: 'H12', severity: 'note', params: { decoder: true } });
    } else if (required.includes(MESHOPT)) {
        findings.push({ id: 'H12', severity: 'cause', params: { decoder: false } });
    } else if (declared.includes(MESHOPT)) {
        // Used but not required: GLTFLoader reads the uncompressed fallback buffers.
        findings.push({ id: 'H12', severity: 'note', params: { decoder: false, fallback: true } });
    }

    const helpers = declared.filter((ext) => ext === DRACO || ext === BASISU);
    if (helpers.length) findings.push({ id: 'H13', severity: 'note', params: { exts: helpers } });

    const materials = Array.isArray(json.materials) ? json.materials : [];
    const flagged = materials.filter(hasSpecGlossMaterial);
    if (declared.includes(SPEC_GLOSS_EXTENSION) || flagged.length) {
        findings.push({ id: 'H14', severity: flagged.every(keepsColor) ? 'note' : 'cause' });
    }

    return findings;
}

const isGone = (status = 0): boolean => status === 404 || status === 410 || status >= 500;

/** H03–H09 from a browser probe, plus the JSON checks when the JSON was read. */
export function probeFindings(url: unknown, facts: ProbeFacts | null | undefined, ctx: HealthContext): Finding[] {
    if (!facts || facts.reach === 'skipped' || facts.reach === 'unknown') return [];

    if (facts.httpsUpgrade === 'fails') return [{ id: 'H03', severity: 'cause' }];

    const findings: Finding[] = [];
    if (facts.httpsUpgrade === 'works') findings.push({ id: 'H03n', severity: 'note' });

    if (facts.reach === 'unreachable') return [...findings, { id: 'H07u', severity: 'check' }];
    if (facts.reach === 'cors') {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return [...findings, { id: 'H07', severity: 'cause', params: { origin } }];
    }
    if (facts.reach === 'http-error') {
        // Most 404 pages are HTML, so the status decides; 401/403 and the like are a login or hotlink rule (H05).
        return [...findings, { id: isGone(facts.status) ? 'H04' : 'H05', severity: 'cause', params: { status: facts.status } }];
    }

    const ext = extOf(url);
    const wrongBytes = (ext === 'glb' && facts.body !== 'glb') || (ext === 'gltf' && facts.body !== 'gltf');
    if (facts.body === 'html' || (facts.body !== 'empty' && facts.body !== undefined && wrongBytes)) {
        return [...findings, { id: 'H05', severity: 'cause' }];
    }

    if (facts.missingSiblings) findings.push({ id: 'H06', severity: 'cause', params: { count: facts.missingSiblings } });

    const heavy = ctx.heavyBytes && ctx.heavyBytes > 0 ? ctx.heavyBytes : HEAVY_BYTES;
    if (facts.size && facts.size >= heavy) findings.push({ id: 'H09', severity: 'check', params: { size: facts.size } });

    if (facts.json && typeof facts.json === 'object') {
        // Malformed JSON must not cost the findings above.
        try {
            if (isLite(ctx.currentViewer)) findings.push(...jsonFindings(facts.json, ctx));
        } catch {
            // No verdict from this JSON.
        }
    }

    return findings;
}

/** Every finding for one model URL: the URL rules, then the probe's. */
export function evaluateHealth(url: unknown, facts: ProbeFacts | null | undefined, ctx: HealthContext): Finding[] {
    const fixed = staticFindings(url, ctx.currentViewer);
    // A file the engine can't open at all needs no deeper verdict on its contents.
    const probed = probeFindings(url, facts, ctx).filter((f) => !fixed.length || !['H05', 'H06', 'H09', 'H11', 'H12', 'H13', 'H14'].includes(f.id));

    return [...fixed, ...probed];
}
