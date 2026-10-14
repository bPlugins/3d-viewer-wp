import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';

import Viewer from '../../blocks/3d-viewer/Components/Common/Viewer';
import '../../blocks/3d-viewer/style.scss';
import { applyModelView } from '../../utils/setView';
import openFullscreen from '../../utils/openFullscreen';

// Use WordPress's bundled ReactDOM (React 18) rather than importing
// `react-dom/client`, which would bundle the incompatible React 19 copy from
// node_modules and crash against WP's window.React. Mirrors frontend.tsx.
const { createRoot, createPortal } = (window as any).ReactDOM;

const META_PREFIX = '_bp3dimages_';
const COLLAPSE_KEY = 'bp3d_preview_collapsed';

/*
 * The new admin interface (bfields, inc/Base/AdminUi.php) draws this meta box
 * without Codestar's inputs, so there the values come from its store instead of
 * the DOM. The store holds the STORED shapes, so each reader below gets what
 * the Codestar input for the same value would hold. The Classic (Codestar)
 * paths are unchanged.
 */
const isModern = (): boolean => (window as any).bp3dPreview?.ui === 'modern';

function storeValues(): Record<string, any> {
    return (window as any).bfields?.getValues?.(META_PREFIX) || {};
}

/** A stored value as the Codestar input holding it reads (esc_attr of it). */
function asInput(value: unknown): string {
    if (value === true) return '1';
    if (value === false || value === null || value === undefined) return '';
    // A single button_set that Codestar's Reset stored as an array: its first
    // element is the checked one.
    if (Array.isArray(value)) return value.length ? asInput(value[0]) : '';
    if (typeof value === 'object') return '';
    return String(value);
}

/** Resolve a Codestar input name (`_bp3dimages_[a][b]`) against the store. */
function storeVal(name: string): string {
    const path = (name.slice(META_PREFIX.length).match(/\[([^\]]*)\]/g) || []).map((part) => part.slice(1, -1));
    let node: any = storeValues();
    for (const key of path) {
        if (node === null || typeof node !== 'object') return '';
        node = node[key];
    }
    return asInput(node);
}

// ── Inline SVG icons (small, self-contained) ──────────────────────────

const CubeIcon = () => (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path d="m262.671 40.888c-4.624-2.621-10.288-2.597-14.89.06l-121.551 70.177 129.841 74.964 129.885-75.34z" />
        <path d="m111.236 277.451c0 5.358 2.858 10.307 7.497 12.986l122.361 70.645v-149.012l-129.859-74.974z" />
        <path d="m400.942 277.451v-140.726l-129.858 75.325v149.032l122.361-70.645c4.64-2.679 7.497-7.628 7.497-12.986z" />
    </svg>
);

const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
);

const ChevronIcon = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
);

/**
 * Read a form control value by its exact Codestar `name`: from the bfields
 * store in Modern, else from the metabox DOM (a `:checked` control first).
 */
function rawVal(name: string): string {
    if (isModern()) return storeVal(name);
    const escaped = name.replace(/([[\]])/g, '\\$1');
    const checked = document.querySelector<HTMLInputElement>(`[name="${escaped}"]:checked`);
    const el = checked || document.querySelector<HTMLInputElement>(`[name="${escaped}"]`);
    return el ? el.value : '';
}

/**
 * Read a single CSF field value.
 *
 * @param id  Field id (e.g. `bp_3d_src`).
 * @param sub Optional sub-key for nested fields (e.g. `url`, `width`, `unit`).
 */
function fieldVal(id: string, sub?: string): string {
    return rawVal(sub ? `${META_PREFIX}[${id}][${sub}]` : `${META_PREFIX}[${id}]`);
}

/**
 * Mirror of Utils::resolveEnvironmentImage(): preset + custom URL → the single
 * value the viewer reads ('' neutral, 'legacy', or a URL).
 */
function resolveEnvironmentImage(preset: string, url: string): string {
    if (preset === 'legacy') return 'legacy';
    if (preset === 'custom' || preset === '') return url;
    return '';
}

/**
 * Cast a switcher/boolean field value, falling back to a default when unset.
 */
function boolVal(id: string, def: boolean): boolean {
    const v = fieldVal(id);
    return v === '' ? def : v === '1';
}

/**
 * Build the viewer attributes object from the current metabox field values.
 * Mirrors Utils::buildViewerAttributes() on the PHP side, reading live values
 * from every section so the preview reflects all settings.
 */
function readAttributes(): Record<string, any> {
    const currentViewer = fieldVal('currentViewer') || 'modelViewer';
    const loading = fieldVal('bp_3d_loading') || 'auto';

    return {
        model: {
            modelUrl: fieldVal('bp_3d_src', 'url'),
            poster: fieldVal('bp_3d_poster', 'url'),
            skyboxImage: fieldVal('bp_3d_skybox_image'),
            decoder: fieldVal('bp_3d_decoder') || 'none',
            arEnabled: boolVal('bp_3d_enable_ar', false),
            arMode: fieldVal('ar_mode') || 'webxr scene-viewer quick-look',
            arPlacement: fieldVal('ar_placement') || 'floor',
            modelISOSrc: fieldVal('model_iso_src'),
        },
        align: fieldVal('bp_3d_align') || 'center',
        uniqueId: 'bp3dPreview',
        isBackend: false,
        currentViewer,
        O3DVSettings: {
            isFullscreen: boolVal('bp_3d_fullscreen', true),
            camera: null,
            mouseControl: boolVal('bp_camera_control', true),
            zoom: boolVal('bp_3d_zooming', true),
        },
        lazyLoad: loading === 'lazy',
        loading,
        zoom: boolVal('bp_3d_zooming', true),
        preload: 'auto',
        mouseControl: boolVal('bp_camera_control', true),
        fullscreen: boolVal('bp_3d_fullscreen', true),
        zoomInOutBtn: boolVal('bp_3d_zoom_in_out_btn', false),
        cameraBtn: boolVal('bp_3d_camera_btn', false),
        downloadBtn: boolVal('bp_3d_download_btn', false),
        progressBar: boolVal('bp_3d_progressbar', false),
        environmentImage: resolveEnvironmentImage(fieldVal('bp_3d_environment_image_preset'), fieldVal('bp_3d_environment_image')),
        exposure: fieldVal('3d_exposure') || '1',
        shadow: fieldVal('3d_shadow_intensity') !== '' ? parseFloat(fieldVal('3d_shadow_intensity')) : 1,
        woo: false,
        placement: 'shortcode',
        styles: {
            width: (fieldVal('bp_3d_width', 'width') || '100') + (fieldVal('bp_3d_width', 'unit') || '%'),
            height: (fieldVal('bp_3d_height', 'height') || '320') + (fieldVal('bp_3d_height', 'unit') || 'px'),
            bgColor: fieldVal('bp_model_bg') || 'transparent',
        },
    };
}

/** The viewer attributes the form holds right now, re-read on every edit. */
function useLiveAttributes() {
    const [attrs, setAttrs] = useState<Record<string, any>>(() => readAttributes());

    useEffect(() => {
        let frame = 0;
        const sync = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                const next = readAttributes();
                setAttrs((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
            });
        };

        // CSF updates fields via jQuery .trigger('change') (media select, color,
        // sliders, switchers), which native listeners can miss — bind through
        // jQuery when available, and keep a native fallback.
        const $ = (window as any).jQuery;
        const ns = `.bp3dPreview${Math.random().toString(36).slice(2, 8)}`;
        const events = ['change', 'keyup', 'csf.change'].map((name) => name + ns).join(' ');

        if ($) {
            $(document).on(events, `[name^="${META_PREFIX}"]`, sync);
        }
        document.addEventListener('change', sync, true);
        document.addEventListener('input', sync, true);

        // The new interface: every edit lands in bfields' store.
        const unsubscribe = isModern() ? (window as any).bfields?.subscribe?.(META_PREFIX, sync) : undefined;

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
            window.cancelAnimationFrame(frame);
            if ($) {
                $(document).off(ns);
            }
            document.removeEventListener('change', sync, true);
            document.removeEventListener('input', sync, true);
        };
    }, []);

    return [attrs, setAttrs] as const;
}

const hasModelIn = (attrs: Record<string, any>): boolean => !!attrs?.model?.modelUrl;

// model-viewer sniffs the bytes, so script endpoints (get.php?f=x.glb) and VRM (a GLB) load fine; no extension = no verdict.
const LITE_OK = ['glb', 'gltf', 'vrm', 'php', 'asp', 'aspx', 'ashx', 'jsp', 'cgi'];
const ADVANCED_OK = ['obj', '3ds', 'stl', 'ply', 'off', '3dm', 'fbx', 'dae', 'wrl', '3mf', 'amf', 'ifc', 'brep', 'step', 'stp', 'iges', 'igs', 'fcstd', 'bim'];

const modelExtension = (url: string): string => {
    let name = url.split('?')[0];
    const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
    if (slash !== -1) name = name.slice(slash + 1);
    const dot = name.lastIndexOf('.');
    return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
};

/** Extensions of the models the Lite viewer can't show. */
const liteUnsupported = (attrs: Record<string, any>): string[] => {
    if ((attrs?.currentViewer || 'modelViewer') !== 'modelViewer') return [];
    const url = attrs?.model?.modelUrl;
    const ext = typeof url === 'string' ? modelExtension(url.split('#')[0]) : '';
    return ext && !LITE_OK.includes(ext) ? [ext] : [];
};

const LiteNotice: React.FC<{ exts: string[] }> = ({ exts }) => {
    if (!exts.length) return null;
    /* translators: %s: file extensions, e.g. ".obj, .fbx". */
    let text = sprintf(__('The Lite viewer opens only .glb and .gltf files, not %s.', '3d-viewer'), exts.map((ext) => `.${ext}`).join(', '));
    if (exts.every((ext) => ADVANCED_OK.includes(ext))) text += ' ' + __('Switch the 3D Viewer to Advanced.', '3d-viewer');
    return <p className="bp3d-lite-notice" role="status">{text}</p>;
};

type StageState = 'idle' | 'loading' | 'ready' | 'failed' | 'webgl';

/**
 * What the viewer under `root` is doing. model-viewer's `error` covers a load failure and a lost
 * WebGL context (detail.type); Online3DViewer keeps its canvas hidden after a failed load.
 */
function useStageState(root: React.RefObject<HTMLElement | null>, enabled: boolean, hasModel: boolean, lite: boolean): StageState {
    const [state, setState] = useState<StageState>(hasModel ? 'loading' : 'idle');

    useEffect(() => {
        const node = root.current;
        if (!enabled || !node) return undefined;
        if (!hasModel) {
            setState('idle');
            return undefined;
        }

        const errors = new WeakMap<Element, StageState>();
        let bound: Element | null = null;

        const read = () => {
            const mv = node.querySelector('model-viewer') as (HTMLElement & { loaded?: boolean }) | null;
            if (mv) {
                setState(errors.get(mv) ?? (mv.loaded ? 'ready' : 'loading'));
                return;
            }
            const canvas = node.querySelector<HTMLCanvasElement>('.online_3d_viewer canvas');
            if (!canvas || node.querySelector('.bp3d-o3dv-loading')) setState('loading');
            else setState(canvas.style.display === 'none' ? 'failed' : 'ready');
        };
        const onError = (e: Event) => {
            errors.set(e.currentTarget as Element, (e as CustomEvent).detail?.type === 'webglcontextlost' ? 'webgl' : 'failed');
            read();
        };
        const onLoad = (e: Event) => {
            errors.delete(e.currentTarget as Element);
            read();
        };
        const bind = () => {
            const mv = node.querySelector('model-viewer');
            if (mv === bound) return;
            bound?.removeEventListener('load', onLoad);
            bound?.removeEventListener('error', onError);
            bound?.removeEventListener('progress', read);
            bound = mv;
            bound?.addEventListener('load', onLoad);
            bound?.addEventListener('error', onError);
            bound?.addEventListener('progress', read);
        };

        const observer = new MutationObserver((records) => {
            records.forEach((record) => {
                if (record.attributeName === 'src') errors.delete(record.target as Element);
            });
            bind();
            read();
        });
        observer.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: lite ? ['src'] : ['style'] });
        bind();
        read();

        return () => {
            observer.disconnect();
            bound?.removeEventListener('load', onLoad);
            bound?.removeEventListener('error', onError);
            bound?.removeEventListener('progress', read);
        };
    }, [enabled, hasModel, lite]);

    return state;
}

/** The Viewer's setAttributes: a shallow merge into the local attributes. */
const mergeAttrs = (setAttrs: React.Dispatch<React.SetStateAction<Record<string, any>>>) =>
    (next: Record<string, any>) => setAttrs((prev) => ({ ...prev, ...next }));

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
    <div className="bp3d-model-preview__empty">
        <span className="bp3d-model-preview__empty-icon">
            <CubeIcon />
        </span>
        <span className="bp3d-model-preview__empty-text">
            <strong>{__('No model selected', '3d-viewer')}</strong><br />
            {text}
        </span>
    </div>
);

/** `bare`: inside the page editor's stage card, which draws its own header. */
const PreviewApp: React.FC<{ bare?: boolean }> = ({ bare = false }) => {
    const [attrs, setAttrs] = useLiveAttributes();
    const rootRef = useRef<HTMLDivElement>(null);
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
    });
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLElement>(null);

    const setAttributes = mergeAttrs(setAttrs);

    const toggleCollapse = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch { /* no-op */ }
            return next;
        });
    }, []);

    const refreshPreview = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setAttrs(readAttributes());
    }, []);

    const hasModel = hasModelIn(attrs);
    const stageState = useStageState(rootRef, bare, hasModel, (attrs.currentViewer || 'modelViewer') === 'modelViewer');

    // The stage card's pill and status band (bfields EditorShell).
    useEffect(() => {
        if (!bare) return;
        const messages: Record<StageState, string> = {
            idle: '',
            loading: __('Loading your 3D model…', '3d-viewer'),
            ready: __('Your 3D model is ready to preview. Make sure all settings are configured correctly for the best experience.', '3d-viewer'),
            failed: __('The 3D model could not be loaded. Check its file or URL on the Model tab.', '3d-viewer'),
            webgl: __('The browser stopped drawing 3D (WebGL context lost). Reload the page to restore the preview.', '3d-viewer'),
        };
        const state = stageState === 'failed' || stageState === 'webgl' ? 'error' : stageState;
        rootRef.current?.dispatchEvent(new CustomEvent('bfields:stage-status', { bubbles: true, detail: { state, message: messages[stageState] } }));
    }, [bare, stageState]);

    return (
        <div ref={rootRef} className={`bp3d-model-preview${collapsed && !bare ? ' bp3d-model-preview--collapsed' : ''}${bare ? ' bp3d-model-preview--bare' : ''}`}>
            {/* Header bar */}
            {bare ? null : <div className="bp3d-model-preview__header" onClick={toggleCollapse}>
                <span className="bp3d-model-preview__icon">
                    <CubeIcon />
                </span>
                <span className="bp3d-model-preview__title">{__('Live Preview', '3d-viewer')}</span>
                {hasModel && (
                    <span className="bp3d-model-preview__badge">{__('Live', '3d-viewer')}</span>
                )}
                <span className="bp3d-model-preview__actions">
                    <button
                        type="button"
                        className="bp3d-model-preview__btn bp3d-model-preview__btn--refresh"
                        title={__('Refresh Preview', '3d-viewer')}
                        onClick={refreshPreview}
                    >
                        <RefreshIcon />
                    </button>
                    <button
                        type="button"
                        className="bp3d-model-preview__btn bp3d-model-preview__btn--toggle"
                        title={collapsed ? __('Expand Preview', '3d-viewer') : __('Collapse Preview', '3d-viewer')}
                        onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
                    >
                        <ChevronIcon />
                    </button>
                </span>
            </div>}

            {/* Collapsible body */}
            <div className="bp3d-model-preview__body">
                <LiteNotice exts={liteUnsupported(attrs)} />
                <div className="bp3d-model-preview__stage">
                    {hasModel ? (
                        <Viewer
                            attributes={attrs}
                            __={__}
                            viewerRef={viewerRef}
                            setAttributes={setAttributes}
                            containerRef={containerRef}
                        />
                    ) : (
                        <EmptyState text={__('Upload a 3D model in the Model tab to see a live preview here.', '3d-viewer')} />
                    )}
                </div>
            </div>
        </div>
    );
};

const deviceIcon = (d: React.ReactNode) => () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

// Same frame widths as the bfields stage card's switcher.
const MODAL_DEVICES = [
    { id: 'desktop', label: __('Desktop', '3d-viewer'), width: '100%', Icon: deviceIcon(<><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8M12 17v4" /></>) },
    { id: 'tablet', label: __('Tablet', '3d-viewer'), width: '62%', Icon: deviceIcon(<><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M12 18h.01" /></>) },
    { id: 'mobile', label: __('Mobile', '3d-viewer'), width: '36%', Icon: deviceIcon(<><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" /></>) },
];

/** The viewer at its real size and with its own buttons, as visitors get it. */
const PreviewModal: React.FC<{ attributes: Record<string, any>; title: string; onClose: () => void }> = ({ attributes, title, onClose }) => {
    const [attrs, setAttrs] = useState<Record<string, any>>(attributes);
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const close = useRef(onClose);
    close.current = onClose;
    const setAttributes = mergeAttrs(setAttrs);
    const bfields = isModern() ? (window as any).bfields : undefined;
    const responsive = typeof bfields?.setDevice === 'function';
    const [device, setDevice] = useState<string>(() => bfields?.getDevice?.() || 'desktop');

    // Shares the editor's device with the stage card's switcher.
    useEffect(() => {
        if (!responsive) return undefined;
        const onDevice = () => setDevice(bfields.getDevice());
        document.addEventListener('bfields:device-change', onDevice);
        return () => document.removeEventListener('bfields:device-change', onDevice);
    }, []);

    // The Advanced viewer only re-measures on window resize.
    useEffect(() => {
        if ((attrs.currentViewer || 'modelViewer') === 'modelViewer') return undefined;
        const frame = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
        return () => cancelAnimationFrame(frame);
    }, [device]);

    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close.current();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            opener?.focus?.();
        };
    }, []);

    return createPortal(
        <div className="bp3d-modal-overlay" onClick={() => close.current()}>
            <div
                className="bp3d-modal-container"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bp3d-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bp3d-modal-header">
                    <span className="bp3d-modal-title" id="bp3d-modal-title">
                        {isModern() ? (
                            <span style={{ display: 'inline-flex', width: '24px', height: '24px', marginRight: '6px', fill: '#2377f2' }}>
                                <CubeIcon />
                            </span>
                        ) : (
                            <span className="dashicons dashicons-cube" style={{ marginRight: '8px', color: '#2377f2', fontSize: '20px', width: '20px', height: '20px' }}></span>
                        )}
                        {title}
                    </span>
                    <span className="bp3d-modal-actions">
                        {responsive ? (
                            <span className="bp3d-modal-devices" role="group" aria-label={__('Preview device', '3d-viewer')}>
                                {MODAL_DEVICES.map(({ id, label, Icon }) => (
                                    <button key={id} type="button" className="bp3d-modal-device" aria-pressed={device === id} aria-label={label} onClick={() => bfields.setDevice(id)}>
                                        <Icon /> <span className="bp3d-modal-device__label">{label}</span>
                                    </button>
                                ))}
                            </span>
                        ) : null}
                        <button type="button" className="bp3d-modal-close" ref={closeRef} aria-label={__('Close preview', '3d-viewer')} onClick={() => close.current()}>
                            &times;
                        </button>
                    </span>
                </div>
                <div className={`bp3d-modal-body${isModern() && hasModelIn(attrs) ? ' bp3d-modal-body--viewer' : ''}`}>
                    {hasModelIn(attrs) ? (
                        <div className="bp3d-modal-frame" style={responsive ? { width: MODAL_DEVICES.find((item) => item.id === device)?.width ?? '100%' } : undefined}>
                            <Viewer
                                attributes={attrs}
                                __={__}
                                viewerRef={viewerRef}
                                setAttributes={setAttributes}
                                containerRef={containerRef}
                            />
                        </div>
                    ) : (
                        <EmptyState text={__('Upload a 3D model in the Model tab to see the preview.', '3d-viewer')} />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const PreviewPopupButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [attrs, setAttrs] = useState<Record<string, any>>(() => readAttributes());

    const openPopup = () => {
        setAttrs(readAttributes());
        setIsOpen(true);
    };

    return (
        <>
            <button
                type="button"
                className="button button-large button-secondary bp3d-preview-popup-trigger"
                onClick={openPopup}
            >
                <span className="dashicons dashicons-visibility"></span>
                {__('Live Preview', '3d-viewer')}
            </button>

            {isOpen ? <PreviewModal attributes={attrs} title={__('Model Live Preview', '3d-viewer')} onClose={() => setIsOpen(false)} /> : null}
        </>
    );
};

const icon = (d: React.ReactNode) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const EyeIcon = () => icon(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
const ScanEyeIcon = () => icon(<><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="1" /><path d="M18.9 12.3a1 1 0 0 0 0-.6 7.5 7.5 0 0 0-13.8 0 1 1 0 0 0 0 .6 7.5 7.5 0 0 0 13.8 0" /></>);
const ResetIcon = () => icon(<><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></>);
const ZoomInIcon = () => icon(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></>);
const ZoomOutIcon = () => icon(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M8 11h6" /></>);
const FullIcon = () => icon(<><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></>);

/**
 * The page editor's side card (Figma "Live Preview"): the real viewer, small,
 * with the card's own view controls instead of the viewer's buttons.
 */
const SidePreview: React.FC = () => {
    const [attrs, setAttrs] = useLiveAttributes();
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const fullscreenBtn = useRef<HTMLButtonElement>(null);
    const setAttributes = mergeAttrs(setAttrs);
    const hasModel = hasModelIn(attrs);
    const lite = (attrs.currentViewer || 'modelViewer') === 'modelViewer';
    const [fullscreen, setFullscreen] = useState(false);
    const [popup, setPopup] = useState(false);

    useEffect(() => {
        const onChange = () => {
            const active = document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
            setFullscreen(!!active && !!stage.current?.contains(active));
        };
        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
        return () => {
            document.removeEventListener('fullscreenchange', onChange);
            document.removeEventListener('webkitfullscreenchange', onChange);
        };
    }, []);

    // The viewer's own opener is gone once the card shrinks back, so focus returns to the card's (after commit).
    const wasFullscreen = useRef(false);
    useEffect(() => {
        if (wasFullscreen.current && !fullscreen) fullscreenBtn.current?.focus();
        wasFullscreen.current = fullscreen;
    }, [fullscreen]);

    // A stage over 550px (a dragged-wide sidebar) has room for the viewer's own buttons.
    const [wide, setWide] = useState(false);
    useEffect(() => {
        const node = stage.current;
        if (!node || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width > 550));
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // The card has its own controls and a 337×193 stage: the viewer's buttons and set size stay out.
    // Fullscreen and a wide stage get the viewer's controls back.
    const sideAttrs = useMemo(() => (fullscreen || wide ? {
        ...attrs,
        uniqueId: 'bp3dSidePreview',
        styles: { ...attrs.styles, width: '100%', height: '100%' },
    } : {
        ...attrs,
        uniqueId: 'bp3dSidePreview',
        fullscreen: false,
        zoomInOutBtn: false,
        cameraBtn: false,
        resetViewBtn: false,
        downloadBtn: false,
        arEnabled: false,
        model: { ...attrs.model, arEnabled: false },
        O3DVSettings: { ...attrs.O3DVSettings, isFullscreen: false },
        styles: { ...attrs.styles, width: '100%', height: '100%' },
    }), [attrs, fullscreen, wide]);

    // The Advanced viewer only re-measures on window resize; dragging the sidebar resizes just the stage.
    useEffect(() => {
        const node = stage.current;
        if (lite || !hasModel || !node || typeof ResizeObserver === 'undefined') return undefined;
        let frame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
        });
        observer.observe(node);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [lite, hasModel]);

    const wheel = (deltaY: number) => {
        stage.current?.querySelector('canvas')?.dispatchEvent(new WheelEvent('wheel', { deltaY, deltaMode: 0, bubbles: true }));
    };
    const zoom = (by: number) => {
        if (lite) viewerRef.current?.zoom?.(by);
        else wheel(by > 0 ? -100 : 100);
    };
    // The Advanced viewer has no camera API reachable from here, so reset re-mounts it (the file is cached).
    const [mount, setMount] = useState(0);
    const reset = () => {
        if (!lite) {
            setMount((n) => n + 1);
            return;
        }
        if (viewerRef.current) applyModelView(viewerRef.current, undefined);
    };

    return (
        <div className="bfields-preview bp3d-side-preview">
            <div className="bfields-preview__head">
                <h3 className="bfields-preview__title">
                    <EyeIcon /> {__('Live Preview', '3d-viewer')}
                </h3>
                <button
                    type="button"
                    className="bfields-icon-btn"
                    aria-label={__('Open a larger preview', '3d-viewer')}
                    title={__('Open a larger preview', '3d-viewer')}
                    disabled={!hasModel}
                    onClick={() => setPopup(true)}
                >
                    <ScanEyeIcon />
                </button>
            </div>

            <LiteNotice exts={liteUnsupported(attrs)} />

            <div className="bfields-preview__stage bp3d-side-preview__stage" ref={stage}>
                {hasModel ? (
                    <Viewer
                        key={mount}
                        attributes={sideAttrs}
                        __={__}
                        viewerRef={viewerRef}
                        setAttributes={setAttributes}
                        containerRef={containerRef}
                    />
                ) : (
                    <span className="bp3d-side-preview__empty">
                        <CubeIcon />
                        {__('Add a 3D model on the Model tab to preview it here.', '3d-viewer')}
                    </span>
                )}
            </div>

            {wide ? null : <div className="bfields-preview__controls">
                <div>
                    <button type="button" className="bfields-icon-btn" aria-label={__('Reset view', '3d-viewer')} title={__('Reset view', '3d-viewer')} disabled={!hasModel} onClick={reset}>
                        <ResetIcon />
                    </button>
                    <button type="button" className="bfields-icon-btn" aria-label={__('Zoom in', '3d-viewer')} title={__('Zoom in', '3d-viewer')} disabled={!hasModel} onClick={() => zoom(2)}>
                        <ZoomInIcon />
                    </button>
                    <button type="button" className="bfields-icon-btn" aria-label={__('Zoom out', '3d-viewer')} title={__('Zoom out', '3d-viewer')} disabled={!hasModel} onClick={() => zoom(-2)}>
                        <ZoomOutIcon />
                    </button>
                </div>
                <button
                    ref={fullscreenBtn}
                    type="button"
                    className="bfields-icon-btn"
                    aria-label={__('Fullscreen', '3d-viewer')}
                    title={__('Fullscreen', '3d-viewer')}
                    disabled={!hasModel}
                    onClick={() => openFullscreen(stage.current?.querySelector<HTMLElement>('.bp_model_parent') ?? null)}
                >
                    <FullIcon />
                </button>
            </div>}

            {popup ? (
                <PreviewModal attributes={{ ...attrs, uniqueId: 'bp3dModalPreview' }} title={__('Live Preview', '3d-viewer')} onClose={() => setPopup(false)} />
            ) : null}
        </div>
    );
};

const LOG = '[3D Viewer preview]';

/** Render the preview panel into `node`; returns its root, or null after showing an error. */
function renderPreviewInto(node: HTMLElement, bare: boolean): any {
    try {
        const root = createRoot(node);
        root.render(<PreviewApp bare={bare} />);
        return root;
    } catch (err) {
        console.error(`${LOG} failed to render`, err);
        node.textContent = __('Model preview failed to load. See the browser console for details.', '3d-viewer');
        return null;
    }
}

/**
 * Inject the preview panel into the #bp3d-model-preview-root container
 * rendered by the CSF Preview callback field.
 */
function mountPreview(): boolean {
    const mount = document.getElementById('bp3d-model-preview-root');
    if (!mount) {
        return false;
    }

    // Prevent multiple mounts
    if (mount.dataset.mounted === 'true') {
        return true;
    }
    mount.dataset.mounted = 'true';

    renderPreviewInto(mount, false);
    return true;
}

/**
 * Inject the preview popup trigger button into the #bp3d-preview-btn-root container.
 */
function mountPreviewButton(): boolean {
    const mount = document.getElementById('bp3d-preview-btn-root');
    if (!mount) {
        return false;
    }

    // Prevent multiple mounts
    if (mount.dataset.mounted === 'true') {
        return true;
    }
    mount.dataset.mounted = 'true';

    try {
        createRoot(mount).render(<PreviewPopupButton />);
    } catch (err) {
        console.error(`${LOG} failed to render preview button`, err);
    }
    return true;
}

/**
 * Pin the whole "Live Preview" meta box (#bp3d_live_preview) to the top of the
 * viewport once it scrolls out of view, so it stays reachable on the long
 * settings screen. The entire postbox card — not just the button — switches to
 * `position: fixed`; a same-size placeholder holds its slot in the sidebar so
 * nothing shifts. Runs on the PHP-rendered postbox, independent of React.
 */
function initStickyPreviewBox(): boolean {
    const box = document.getElementById('bp3d_live_preview');
    if (!box) {
        return false;
    }
    if (box.dataset.bp3dSticky === 'true') {
        return true;
    }
    box.dataset.bp3dSticky = 'true';

    const placeholder = document.createElement('div');
    placeholder.className = 'bp3d-live-preview-placeholder';
    placeholder.style.display = 'none';
    box.parentNode?.insertBefore(placeholder, box);

    let stuck = false;

    const topOffset = (): number => {
        const bar = document.getElementById('wpadminbar');
        return (bar ? bar.offsetHeight : 0) + 8;
    };

    const stick = (offset: number) => {
        const rect = box.getBoundingClientRect();
        placeholder.style.height = box.offsetHeight + 'px';
        placeholder.style.marginBottom = window.getComputedStyle(box).marginBottom;
        placeholder.style.display = 'block';
        box.style.position = 'fixed';
        box.style.top = offset + 'px';
        box.style.left = rect.left + 'px';
        box.style.width = box.offsetWidth + 'px';
        box.style.boxSizing = 'border-box';
        box.classList.add('is-stuck');
        stuck = true;
    };

    const unstick = () => {
        box.style.position = '';
        box.style.top = '';
        box.style.left = '';
        box.style.width = '';
        box.style.boxSizing = '';
        box.classList.remove('is-stuck');
        placeholder.style.display = 'none';
        stuck = false;
    };

    const update = () => {
        const offset = topOffset();
        if (!stuck) {
            if (box.getBoundingClientRect().top < offset) {
                stick(offset);
            }
            return;
        }
        // Un-stick once the placeholder (which holds the original slot) scrolls
        // back into view; otherwise keep the fixed box aligned to the column.
        if (placeholder.getBoundingClientRect().top >= offset) {
            unstick();
        } else {
            box.style.top = offset + 'px';
            box.style.left = placeholder.getBoundingClientRect().left + 'px';
            box.style.width = placeholder.offsetWidth + 'px';
        }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return true;
}

/**
 * The new interface renders only the open tab, so `#bp3d-model-preview-root`
 * appears when the Preview tab opens and is replaced on every visit. Mount into
 * each fresh node, and unmount the root of one that has gone.
 */
function initModern() {
    const roots = new Map<HTMLElement, any>();
    let frame = 0;

    const scan = () => {
        frame = 0;
        mountPreviewButton();
        initStickyPreviewBox();

        roots.forEach((root, node) => {
            if (!node.isConnected) {
                root.unmount();
                roots.delete(node);
            }
        });

        const side = document.getElementById(`bfields-side-${META_PREFIX}`);
        if (side && side.dataset.mounted !== 'true') {
            side.dataset.mounted = 'true';
            const mount = side.appendChild(document.createElement('div'));
            const root = createRoot(mount);
            root.render(<SidePreview />);
            roots.set(side, root);

            // The frame hides #submitdiv, so its interface switch row is copied under the card.
            const row = document.querySelector('#submitdiv .bp3d-admin-ui-row');
            if (row) {
                const copy = row.cloneNode(true) as HTMLElement;
                copy.classList.add('bp3d-admin-ui-row--side');
                side.appendChild(copy);
            }
        }

        const node = document.getElementById('bp3d-model-preview-root');
        if (node && node.dataset.mounted !== 'true') {
            node.dataset.mounted = 'true';
            const root = renderPreviewInto(node, !!node.closest('.bfields-stagecard'));
            if (root) roots.set(node, root);
        }
    };

    scan();
    new MutationObserver(() => {
        if (!frame) frame = window.requestAnimationFrame(scan);
    }).observe(document.body, { childList: true, subtree: true });
}

function init() {
    if (isModern()) {
        initModern();
        return;
    }

    let tries = 0;
    const tick = (): boolean => {
        const p = mountPreview();
        const b = mountPreviewButton();
        const s = initStickyPreviewBox();
        return p && b && s;
    };

    if (tick()) {
        return;
    }

    // Metabox markup may not be ready yet on some screens — retry briefly.
    const timer = window.setInterval(() => {
        tries += 1;
        if (tick() || tries > 40) {
            window.clearInterval(timer);
            if (tries > 40) {
                console.warn(`${LOG} no metabox found for "${META_PREFIX}" fields`);
            }
        }
    }, 150);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}


