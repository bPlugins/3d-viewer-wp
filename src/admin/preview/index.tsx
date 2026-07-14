import { useCallback, useEffect, useRef, useState } from 'react';

import Viewer from '../../blocks/3d-viewer/Components/Common/Viewer';

// Use WordPress's bundled ReactDOM (React 18) rather than importing
// `react-dom/client`, which would bundle the incompatible React 19 copy from
// node_modules and crash against WP's window.React. Mirrors frontend.tsx.
const { createRoot, createPortal } = (window as any).ReactDOM;

const META_PREFIX = '_bp3dimages_';
const COLLAPSE_KEY = 'bp3d_preview_collapsed';

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
 * Read a single CSF field value from the metabox DOM.
 *
 * @param id  Field id (e.g. `bp_3d_src`).
 * @param sub Optional sub-key for nested fields (e.g. `url`, `width`, `unit`).
 */
function fieldVal(id: string, sub?: string): string {
    const name = sub ? `${META_PREFIX}[${id}][${sub}]` : `${META_PREFIX}[${id}]`;
    const escaped = name.replace(/([[\]])/g, '\\$1');
    const checked = document.querySelector<HTMLInputElement>(`[name="${escaped}"]:checked`);
    const el = checked || document.querySelector<HTMLInputElement>(`[name="${escaped}"]`);
    return el ? el.value : '';
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
        progressBar: boolVal('bp_3d_progressbar', false),
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

const PreviewApp: React.FC = () => {
    const [attrs, setAttrs] = useState<Record<string, any>>(() => readAttributes());
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
    });
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLElement>(null);

    const __ = (text: string): string => text;
    const setAttributes = (next: Record<string, any>) => setAttrs((prev) => ({ ...prev, ...next }));

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

    useEffect(() => {
        let frame = 0;
        const sync = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => setAttrs(readAttributes()));
        };

        // CSF updates fields via jQuery .trigger('change') (media select, color,
        // sliders, switchers), which native listeners can miss — bind through
        // jQuery when available, and keep a native fallback.
        const $ = (window as any).jQuery;
        const events = 'change.bp3dPreview keyup.bp3dPreview csf.change.bp3dPreview';

        if ($) {
            $(document).on(events, `[name^="${META_PREFIX}"]`, sync);
        }
        document.addEventListener('change', sync, true);
        document.addEventListener('input', sync, true);

        return () => {
            window.cancelAnimationFrame(frame);
            if ($) {
                $(document).off('.bp3dPreview');
            }
            document.removeEventListener('change', sync, true);
            document.removeEventListener('input', sync, true);
        };
    }, []);

    const hasModel = !!attrs?.model?.modelUrl;

    return (
        <div className={`bp3d-model-preview${collapsed ? ' bp3d-model-preview--collapsed' : ''}`}>
            {/* Header bar */}
            <div className="bp3d-model-preview__header" onClick={toggleCollapse}>
                <span className="bp3d-model-preview__icon">
                    <CubeIcon />
                </span>
                <span className="bp3d-model-preview__title">{__('Live Preview')}</span>
                {hasModel && (
                    <span className="bp3d-model-preview__badge">{__('Live')}</span>
                )}
                <span className="bp3d-model-preview__actions">
                    <button
                        type="button"
                        className="bp3d-model-preview__btn bp3d-model-preview__btn--refresh"
                        title={__('Refresh Preview')}
                        onClick={refreshPreview}
                    >
                        <RefreshIcon />
                    </button>
                    <button
                        type="button"
                        className="bp3d-model-preview__btn bp3d-model-preview__btn--toggle"
                        title={collapsed ? __('Expand Preview') : __('Collapse Preview')}
                        onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
                    >
                        <ChevronIcon />
                    </button>
                </span>
            </div>

            {/* Collapsible body */}
            <div className="bp3d-model-preview__body">
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
                        <div className="bp3d-model-preview__empty">
                            <span className="bp3d-model-preview__empty-icon">
                                <CubeIcon />
                            </span>
                            <span className="bp3d-model-preview__empty-text">
                                <strong>{__('No model selected')}</strong><br />
                                {__('Upload a 3D model in the Model tab to see a live preview here.')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PreviewPopupButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [attrs, setAttrs] = useState<Record<string, any>>(() => readAttributes());
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLElement>(null);

    const openPopup = () => {
        setAttrs(readAttributes());
        setIsOpen(true);
    };

    const closePopup = () => {
        setIsOpen(false);
    };

    const __ = (text: string): string => text;
    const setAttributes = (next: Record<string, any>) => setAttrs((prev) => ({ ...prev, ...next }));

    const hasModel = !!attrs?.model?.modelUrl;

    return (
        <>
            <button
                type="button"
                className="button button-large button-secondary bp3d-preview-popup-trigger"
                onClick={openPopup}
            >
                <span className="dashicons dashicons-visibility"></span>
                {__('Live Preview')}
            </button>

            {isOpen && createPortal(
                <div className="bp3d-modal-overlay" onClick={closePopup}>
                    <div className="bp3d-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="bp3d-modal-header">
                            <span className="bp3d-modal-title">
                                <span className="dashicons dashicons-cube" style={{ marginRight: '8px', color: '#2377f2', fontSize: '20px', width: '20px', height: '20px' }}></span>
                                {__('Model Live Preview')}
                            </span>
                            <button className="bp3d-modal-close" onClick={closePopup}>
                                &times;
                            </button>
                        </div>
                        <div className="bp3d-modal-body">
                            {hasModel ? (
                                <Viewer
                                    attributes={attrs}
                                    __={__}
                                    viewerRef={viewerRef}
                                    setAttributes={setAttributes}
                                    containerRef={containerRef}
                                />
                            ) : (
                                <div className="bp3d-model-preview__empty">
                                    <span className="bp3d-model-preview__empty-icon">
                                        <CubeIcon />
                                    </span>
                                    <span className="bp3d-model-preview__empty-text">
                                        <strong>{__('No model selected')}</strong><br />
                                        {__('Upload a 3D model in the Model tab to see the preview.')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

const LOG = '[3D Viewer preview]';

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

    try {
        createRoot(mount).render(<PreviewApp />);
        // eslint-disable-next-line no-console
        console.log(`${LOG} mounted inside CSF Preview section`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`${LOG} failed to render`, err);
        mount.textContent = 'Model preview failed to load — see console.';
    }
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

function init() {
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
                // eslint-disable-next-line no-console
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


