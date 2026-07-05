import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import Viewer from '../../blocks/3d-viewer/Components/Common/Viewer';

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
 * Mirrors Utils::buildViewerAttributes() on the PHP side.
 */
function readAttributes(): Record<string, any> {
    const currentViewer = fieldVal('currentViewer') || 'modelViewer';
    const loading = fieldVal('bp_3d_loading') || 'auto';

    return {
        model: {
            modelUrl: fieldVal('bp_3d_src', 'url'),
            poster: fieldVal('bp_3d_poster', 'url'),
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
            bgColor: fieldVal('bp_model_bg'),
        },
    };
}

interface PreviewAppProps {
    initial: Record<string, any>;
}

const PreviewApp: React.FC<PreviewAppProps> = ({ initial }) => {
    const [attrs, setAttrs] = useState<Record<string, any>>(initial);
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
        // sliders, switchers), which native listeners miss — bind through jQuery.
        const $ = (window as any).jQuery;
        const events = 'change.bp3dPreview input.bp3dPreview';

        if ($) {
            $(document).on(events, `[name^="${META_PREFIX}"]`, sync);
        } else {
            document.addEventListener('change', sync);
            document.addEventListener('input', sync);
        }

        return () => {
            window.cancelAnimationFrame(frame);
            if ($) {
                $(document).off(events, `[name^="${META_PREFIX}"]`);
            } else {
                document.removeEventListener('change', sync);
                document.removeEventListener('input', sync);
            }
        };
    }, []);

    if (!attrs?.model?.modelUrl) {
        return (
            <p className="bp3d-model-preview__empty">
                {__('Select a 3D source above to see a live preview.')}
            </p>
        );
    }

    return (
        <Viewer
            attributes={attrs}
            __={__}
            viewerRef={viewerRef}
            setAttributes={setAttributes}
            containerRef={containerRef}
        />
    );
};

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('bp3d-model-preview-root');
    if (!root) {
        return;
    }

    let initial: Record<string, any> = {};
    try {
        initial = JSON.parse(root.dataset.attributes || '{}');
    } catch (e) {
        initial = {};
    }
    initial = { ...initial, ...readAttributes() };

    createRoot(root).render(<PreviewApp initial={initial} />);
});
