import React from 'react';
import { jsonParse } from 'bp-utils';
import FrontEnd, { FrontEndAttributes } from './Components/FrontEnd';

const { createRoot } = (window as any).ReactDOM;

const WIDGET_SELECTOR = '.modelViewerBlock.elementor';

/**
 * Resolve a library URL.
 *
 * Prefers the localized path, then derives one from this bundle's own script
 * tag — never a hardcoded `/wp-content/…`, which breaks on installs that move
 * wp-content or rename the plugin folder.
 */
const libraryUrl = (key: 'modelViewerSrc' | 'o3dviewerSrc', file: string): string => {
    const localized = (window as any)['bp3dBlock']?.[key];

    if (localized) {
        return localized;
    }

    const own = (document.getElementById('bp3d-public-js')
        || document.querySelector('script[src*="/build/frontend.js"]')) as HTMLScriptElement | null;

    return own?.src ? own.src.replace(/build\/frontend\.js.*$/, `public/js/${file}`) : '';
};

/**
 * Mount a single widget container.
 */
const initializeAddon = (dom: HTMLElement | null): void => {
    if (!dom) return;
    if (dom.getAttribute('data-rendered') === 'true') return;

    const dataset = dom.dataset;
    const attributes = dataset.attributes ? jsonParse(dataset.attributes) as FrontEndAttributes : null;

    if (!attributes) return;
    dom.removeAttribute('data-attributes');
    dom.setAttribute('data-rendered', 'true');

    const renderViewer = () => {
        const root = createRoot(dom);
        root.render(<FrontEnd attributes={attributes} />);
    };

    if (attributes.currentViewer === 'O3DViewer') {
        if (typeof (window as any).OV !== 'undefined') {
            renderViewer();
            return;
        }

        // Match by source rather than by id: the same library is printed under
        // different handles depending on which path enqueued it.
        let script = document.querySelector('script[src*="o3dv"]') as HTMLScriptElement | null;

        if (!script) {
            const src = libraryUrl('o3dviewerSrc', 'o3dv.min.js');

            if (!src) return;

            script = document.createElement('script');
            script.id = 'bp3d-lib-o3dviewer-js';
            script.src = src;
            document.head.appendChild(script);
        }

        script.addEventListener('load', renderViewer);
        return;
    }

    // The widget's PHP may have enqueued the library as a WP script module
    // (tag id "…-js-module"), so match any existing copy — a second load would
    // throw on customElements.define.
    const alreadyLoaded =
        !!customElements.get('model-viewer') ||
        !!document.querySelector('script[src*="model-viewer"]');

    if (!alreadyLoaded) {
        const src = libraryUrl('modelViewerSrc', 'model-viewer.latest.min.js');

        if (src) {
            const script = document.createElement('script');
            script.type = 'module';
            script.id = 'bp3d-lib-model-viewer-js';
            script.src = src;
            document.head.appendChild(script);
        }
    }

    renderViewer();
};

/**
 * Mount every widget currently in the document.
 */
const initializeAll = (): void => {
    document.querySelectorAll<HTMLElement>(WIDGET_SELECTOR).forEach(initializeAddon);
};

/**
 * Elementor frontend integration.
 * Initializes the 3D viewer inside Elementor widgets.
 */
const bootstrap = (): void => {
    (window as any).elementorFrontend?.hooks?.addAction(
        'frontend/element_ready/3dModelViewer.default',
        function (scope: any) {
            initializeAddon(scope?.[0]?.querySelector(WIDGET_SELECTOR) ?? null);
        }
    );

    // Widgets already in the document when Elementor initialized.
    initializeAll();
};

// `elementor/frontend/init` is dispatched once, from inside
// `elementorFrontend.init()`. A listener attached after that would never run,
// so check whether Elementor is already initialized first — `hooks` is created
// in the same method, right before the event goes out.
if ((window as any).elementorFrontend?.hooks) {
    bootstrap();
} else {
    window.addEventListener('elementor/frontend/init', bootstrap);
}

// Backups, deliberately outside the listener above so that a missed
// `elementor/frontend/init` can still recover. No-ops on pages without widgets.
setTimeout(initializeAll, 1000);
setTimeout(initializeAll, 3000);
