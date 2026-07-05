import { useEffect, useRef, useState } from 'react';

import Viewer from '../../blocks/3d-viewer/Components/Common/Viewer';

// Use WordPress's bundled ReactDOM (React 18) rather than importing
// `react-dom/client`, which would bundle the incompatible React 19 copy from
// node_modules and crash against WP's window.React. Mirrors frontend.tsx.
const { createRoot } = (window as any).ReactDOM;

const META_PREFIX = '_bp3dimages_';

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
        },
        align: fieldVal('bp_3d_align') || 'center',
        uniqueId: 'bp3dPreview',
        isBackend: true,
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
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLElement>(null);

    const __ = (text: string): string => text;
    const setAttributes = (next: Record<string, any>) => setAttrs((prev) => ({ ...prev, ...next }));

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

    return (
        <div className="bp3d-model-preview">
            <span className="bp3d-model-preview__label">{__('Live Preview')}</span>
            <div className="bp3d-model-preview__stage">
                {attrs?.model?.modelUrl ? (
                    <Viewer
                        attributes={attrs}
                        __={__}
                        viewerRef={viewerRef}
                        setAttributes={setAttributes}
                        containerRef={containerRef}
                    />
                ) : (
                    <p className="bp3d-model-preview__empty">
                        {__('Select a 3D source in the Model tab to see a live preview.')}
                    </p>
                )}
            </div>
        </div>
    );
};

const LOG = '[3D Viewer preview]';

/**
 * Locate the best container to inject the preview into. Prefers the CSF
 * metabox wrapper, then the surrounding postbox, then the fields' parent.
 */
function findContainer(): HTMLElement | null {
    const anchor = document.querySelector(`[name^="${META_PREFIX}"]`);
    if (!anchor) {
        return null;
    }
    return (
        anchor.closest('.csf-metabox') ||
        anchor.closest('.postbox') ||
        (anchor.closest('.csf-wrapper') as HTMLElement | null) ||
        (anchor.parentElement as HTMLElement | null)
    );
}

/**
 * Inject an always-visible preview panel at the top of the metabox so it stays
 * in view no matter which settings tab/section is active.
 */
function mountPreview(): boolean {
    if (document.getElementById('bp3d-model-preview-root')) {
        return true;
    }

    const container = findContainer();
    if (!container) {
        return false;
    }

    const mount = document.createElement('div');
    mount.id = 'bp3d-model-preview-root';
    container.insertBefore(mount, container.firstChild);

    try {
        createRoot(mount).render(<PreviewApp />);
        // eslint-disable-next-line no-console
        console.log(`${LOG} mounted into`, container.className || container.id);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`${LOG} failed to render`, err);
        mount.textContent = 'Model preview failed to load — see console.';
    }
    return true;
}

function init() {
    if (mountPreview()) {
        return;
    }

    // Metabox markup may not be ready yet on some screens — retry briefly.
    let tries = 0;
    const timer = window.setInterval(() => {
        tries += 1;
        if (mountPreview() || tries > 40) {
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
