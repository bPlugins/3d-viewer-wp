import { useEffect, useState } from '@wordpress/element';
import { mediaLibrarySize, probeModel, type ProbeSigner } from '../utils/health/probe';
import { evaluateHealth, staticFindings, type HealthContext } from '../utils/health/rules';
import type { Finding, ProbeFacts } from '../utils/health/types';

export const HEALTH_DEBOUNCE = 400;
const MEMO_LIMIT = 200;

export interface ModelHealthOptions extends HealthContext {
    delay?: number;
    /** Pro surfaces pass signForProbe (utils/health/sign); absent or null fetches as-is (free). */
    sign?: ProbeSigner | null;
}

export interface ModelHealthState {
    status: 'idle' | 'checking' | 'done';
    findings: Finding[];
}

// Per URL for the session; inconclusive answers are dropped so a later change retries them.
// On window, so two admin bundles on one screen (Classic: admin.js + admin-preview.js) probe a URL once.
const memo: Map<string, Promise<ProbeFacts>> = typeof window !== 'undefined'
    ? ((window as any).__bp3dHealthMemo ||= new Map())
    : new Map();

function remember(url: string, pending: Promise<ProbeFacts>) {
    if (memo.size >= MEMO_LIMIT) {
        const oldest = memo.keys().next().value;
        if (oldest !== undefined) memo.delete(oldest);
    }
    memo.set(url, pending);
}

export function probeOnce(url: string, sign: ProbeSigner | null): Promise<ProbeFacts> {
    const cached = memo.get(url);
    if (cached) return cached;

    const pending = probeModel(url, { sign });
    remember(url, pending);
    pending.then((facts) => {
        if (facts.reach === 'unknown' || facts.reach === 'skipped') memo.delete(url);
    });
    return pending;
}

/** Test seam, and for a re-check after the user fixed the file. */
export function forgetModelHealth(url?: string): void {
    if (url) memo.delete(url);
    else memo.clear();
}

/** One model URL or a list (multiple models), trimmed and deduped. */
export function modelTargets(urls: unknown): string[] {
    const list = (Array.isArray(urls) ? urls : [urls]).map((url) => (typeof url === 'string' ? url.trim() : '')).filter(Boolean);
    return Array.from(new Set(list));
}

/** One line per kind of problem across several models, e.g. two .obj files give one H01. */
export function mergeFindings(lists: Finding[][]): Finding[] {
    const seen = new Set<string>();
    return lists.flat().filter((finding) => {
        const key = `${finding.id}:${finding.severity}:${finding.params?.ext ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** Every finding for one URL, for the jQuery and Elementor surfaces. Never rejects. */
export async function checkModelHealth(url: unknown, options: ModelHealthOptions): Promise<Finding[]> {
    const target = typeof url === 'string' ? url.trim() : '';
    if (!target) return [];

    try {
        const facts = { ...(await probeOnce(target, options.sign ?? null)) };
        const known = mediaLibrarySize(target);
        if (known) facts.size = known;
        return evaluateHealth(target, facts, options);
    } catch {
        return staticFindings(target, options.currentViewer);
    }
}

/** Every finding for one URL or a list of them, merged. Never rejects. */
export async function checkModelsHealth(urls: unknown, options: ModelHealthOptions): Promise<Finding[]> {
    const lists = await Promise.all(modelTargets(urls).map((url) => checkModelHealth(url, options)));
    return mergeFindings(lists);
}

/** Debounced, once per URL change: the URL-only findings, then the probe's. Takes one URL or a list. */
export default function useModelHealth(urls: unknown, options: ModelHealthOptions): ModelHealthState {
    const targets = modelTargets(urls);
    const key = targets.join('\n');
    const { currentViewer, variant, heavyBytes, meshoptDecoder, sign, delay = HEALTH_DEBOUNCE } = options;
    const [state, setState] = useState<ModelHealthState>({ status: 'idle', findings: [] });

    useEffect(() => {
        if (!targets.length) {
            setState({ status: 'idle', findings: [] });
            return undefined;
        }

        // Nothing while a link is being typed, so a partial ".g" never shows.
        setState({ status: 'checking', findings: [] });

        let live = true;
        const timer = window.setTimeout(() => {
            setState({ status: 'checking', findings: mergeFindings(targets.map((url) => staticFindings(url, currentViewer))) });
            checkModelsHealth(targets, { currentViewer, variant, heavyBytes, meshoptDecoder, sign })
                .then((findings) => live && setState({ status: 'done', findings }));
        }, delay);

        return () => {
            live = false;
            window.clearTimeout(timer);
        };
        // `targets` is rebuilt every render; `key` carries it. `sign` must be a stable module function.
    }, [key, currentViewer, variant, heavyBytes, meshoptDecoder, sign, delay]);

    return state;
}
