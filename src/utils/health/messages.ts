import { __, _n, sprintf } from '@wordpress/i18n';
import { advancedViewerWarning } from '../cloud/advancedViewer';
import { formatBytes } from '../formatBytes';
import { anchorUrl, TROUBLESHOOTING_URL } from './anchors';
import type { Finding, FindingId, Severity, Variant } from './types';

/**
 * Finding → words and links, the free variant of Pro's file: free's checks only, and no Pro tool links.
 * Called lazily: @wordpress/i18n only has the translations once wp-i18n has loaded.
 * The text carries names from untrusted model files: insert it as plain text (textContent / esc_html), never as HTML.
 */

export interface Link {
    href: string;
    label: string;
}

export interface HealthMessage {
    id: FindingId;
    severity: Severity;
    label: string;
    /** The label with its punctuation, e.g. "Possible cause:", translatable for locales that space it. */
    heading: string;
    text: string;
    /** Always null in free (Pro: Optimize →, Convert →); kept so the shared notice code reads the same. */
    action: Link | null;
    howToFix: Link;
}

export interface MessageContext {
    variant: Variant;
    /** Pro only; free's "+N more" opens the troubleshooting page. */
    healthUrl?: string;
}

export const SEVERITY_ORDER: Severity[] = ['cause', 'check', 'note'];

export const severityLabel = (severity: Severity): string => {
    if (severity === 'cause') return __('Possible cause', '3d-viewer');
    if (severity === 'check') return __('Worth checking', '3d-viewer');
    return __('Note', '3d-viewer');
};

const str = (value: unknown): string => (typeof value === 'string' ? value : '');
const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const names = (value: unknown): string => (Array.isArray(value) ? value.join(', ') : str(value));

function text(finding: Finding): string {
    const p = finding.params || {};

    switch (finding.id) {
        case 'H01': {
            /* translators: %s: file extension, e.g. "obj" */
            const base = sprintf(__('The Lite viewer can\'t open .%s files.', '3d-viewer'), str(p.ext));
            return p.advanced ? `${base} ${__('Switch this viewer to Advanced.', '3d-viewer')}` : base;
        }
        case 'H01b':
            if (!p.ext) return advancedViewerWarning(str(p.url));
            return sprintf(
                /* translators: %s: file extension, e.g. "php" */
                __('The Advanced viewer can\'t open .%s links. Use a link that ends in the model\'s file name, or switch to the Lite viewer.', '3d-viewer'),
                str(p.ext)
            );
        case 'H02':
            /* translators: %s: file extension, e.g. "usdz" */
            return sprintf(__('Neither viewer opens .%s files. Export the model as GLB.', '3d-viewer'), str(p.ext));
        case 'H03':
            return __('This file is on http:// and its host has no working https. Move the file to your Media Library.', '3d-viewer');
        case 'H03n':
            return __('Saved as http://. It works because the viewer switches to https. Re-save the link with https://.', '3d-viewer');
        case 'H04':
            return __('The file can\'t be found. Choose the model again and save.', '3d-viewer');
        case 'H05':
            return __('The link returns a web page, not a 3D file. A login, security plugin or hotlink rule may be in the way.', '3d-viewer');
        case 'H06': {
            const count = num(p.count);
            return sprintf(
                /* translators: %d: number of missing files */
                _n(
                    'This .gltf points to %d file that isn\'t there. Upload it to the same folder, or use a single .glb.',
                    'This .gltf points to %d files that aren\'t there. Upload them to the same folder, or use a single .glb.',
                    count,
                    '3d-viewer'
                ),
                count
            );
        }
        case 'H07':
            return sprintf(
                /* translators: %s: this site's address, e.g. "https://example.com" */
                __('The other website doesn\'t allow your site to load this file (CORS). Upload it to your Media Library, or ask the host to allow %s.', '3d-viewer'),
                str(p.origin)
            );
        case 'H07u':
            return __('Your browser couldn\'t reach this file. Check that the link opens in a new tab.', '3d-viewer');
        case 'H09':
            /* translators: %s: file size, e.g. "24.1 MB" */
            return sprintf(__('This file is %s. Large models load slowly, especially on mobile.', '3d-viewer'), formatBytes(num(p.size)));
        case 'H11':
            if (finding.severity === 'note') {
                return sprintf(
                    /* translators: %s: glTF extension names, e.g. "KHR_node_visibility" */
                    __('The model uses %s, which the viewer ignores. It is optional, so the model still loads.', '3d-viewer'),
                    names(p.exts)
                );
            }
            return sprintf(
                /* translators: %s: glTF extension names, e.g. "KHR_node_visibility" */
                __('The model uses %s, which the viewer doesn\'t support. Parts may show wrong. Re-export without it.', '3d-viewer'),
                names(p.exts)
            );
        case 'H12':
            if (p.fallback) return __('Compressed with meshopt, with an uncompressed copy inside. The viewer loads that copy.', '3d-viewer');
            return p.decoder
                ? __('Compressed with meshopt. The viewer loads a decoder for it, so ad blockers or firewalls that block it stop the model.', '3d-viewer')
                : __('Compressed with meshopt, which this version can\'t open. Re-export without meshopt.', '3d-viewer');
        case 'H13':
            /* translators: %s: glTF extension names, e.g. "KHR_draco_mesh_compression" */
            return sprintf(__('Uses %s, which needs a helper from www.gstatic.com. Ad blockers or firewalls that block it stop the model.', '3d-viewer'), names(p.exts));
        case 'H14':
            return finding.severity === 'note'
                ? __('Uses the legacy Specular-Glossiness materials, but its base colors should still show.', '3d-viewer')
                : __('Uses the legacy Specular-Glossiness materials, so it shows white.', '3d-viewer');
        default:
            return '';
    }
}

export function healthMessage(finding: Finding): HealthMessage {
    return {
        id: finding.id,
        severity: finding.severity,
        label: severityLabel(finding.severity),
        /* translators: %s: severity label, e.g. "Possible cause" */
        heading: sprintf(__('%s:', '3d-viewer'), severityLabel(finding.severity)),
        text: text(finding),
        action: null,
        howToFix: { href: anchorUrl(finding.id), label: __('How to fix →', '3d-viewer') },
    };
}

export const EDITOR_LINES = 3;

export interface EditorViewOptions extends MessageContext {
    /** Findings a sibling notice on the same surface already covers (H14: SpecGlossNotice, H01b: AdvancedViewerNotice). */
    suppress?: FindingId[];
    /** Pro only, default true: size stays with BigFileNotice and Notes with Tools › Model health. False on a lapsed licence. */
    lean?: boolean;
    max?: number;
}

export interface HealthView {
    status: 'warning' | 'info';
    lines: HealthMessage[];
    more: (Link & { count: number }) | null;
}

/**
 * The editor's inline list (§2.1 A): licensed Pro shows causes and worth-checking only (Notes live in Tools › Model health)
 * and leaves size to BigFileNotice; free and lapsed Pro also show Notes, last. At most three lines, then "+N more".
 */
export function editorView(findings: Finding[], options: EditorViewOptions): HealthView | null {
    const suppress = options.suppress || [];
    const pro = options.variant === 'pro';
    const lean = pro && options.lean !== false;
    // AdvancedViewerNotice covers only the link with no file name; the script-endpoint form (`ext`) is ours alone.
    const covered = (f: Finding): boolean => suppress.includes(f.id) && !(f.id === 'H01b' && f.params?.ext);

    const shown = findings
        .filter((f) => !covered(f))
        .filter((f) => !lean || (f.severity !== 'note' && f.id !== 'H09'))
        .map((f, index) => ({ f, index }))
        .sort((a, b) => SEVERITY_ORDER.indexOf(a.f.severity) - SEVERITY_ORDER.indexOf(b.f.severity) || a.index - b.index)
        .map(({ f }) => f);

    if (!shown.length) return null;

    const max = options.max ?? EDITOR_LINES;
    const lines = shown.slice(0, max).map((f) => healthMessage(f));
    const rest = shown.length - lines.length;

    return {
        status: lines.some((line) => line.severity !== 'note') ? 'warning' : 'info',
        lines,
        more: rest > 0
            ? {
                count: rest,
                href: (pro && options.healthUrl) || TROUBLESHOOTING_URL,
                /* translators: %d: number of further findings */
                label: sprintf(_n('+%d more', '+%d more', rest, '3d-viewer'), rest),
            }
            : null,
    };
}
