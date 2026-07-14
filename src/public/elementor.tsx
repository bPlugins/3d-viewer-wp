import React from 'react';
import { jsonParse } from 'bp-utils';
import FrontEnd, { FrontEndAttributes } from './Components/FrontEnd';

const { createRoot } = (window as any).ReactDOM;

declare const elementorFrontend: any;

/**
 * Elementor frontend integration.
 * Initializes the 3D viewer inside Elementor widgets.
 */
window.addEventListener('elementor/frontend/init', function () {
    elementorFrontend.hooks.addAction(
        'frontend/element_ready/3dModelViewer.default',
        function (scope: any) {
            const dom = scope[0]?.querySelector('.modelViewerBlock.elementor') as HTMLElement | null;
            initializeAddon(dom);
        }
    );

    // Backup: fire after 1 second in case the hook doesn't trigger
    setTimeout(() => {
        const doms = document.querySelectorAll<HTMLElement>('.modelViewerBlock.elementor');
        doms.forEach(initializeAddon);
    }, 1000);

    // Secondary backup: fire after 3 seconds
    setTimeout(() => {
        const doms = document.querySelectorAll<HTMLElement>('.modelViewerBlock.elementor');
        doms.forEach(initializeAddon);
    }, 3000);

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

        if (!attributes.currentViewer || attributes.currentViewer === 'modelViewer') {
            // The widget's PHP may have enqueued the library as a WP script
            // module (tag id "…-js-module"), so match any existing copy — a
            // second load would throw on customElements.define.
            const alreadyLoaded =
                !!customElements.get('model-viewer') ||
                !!document.querySelector('script[src*="model-viewer"]');
            if (!alreadyLoaded) {
                const script = document.createElement('script');
                script.type = 'module';
                script.id = 'bp3d-lib-model-viewer-js';
                script.src = (window as any)['bp3dBlock']?.modelViewerSrc || '/wp-content/plugins/3d-viewer/public/js/model-viewer.latest.min.js';
                document.head.appendChild(script);
            }
            renderViewer();
        }

        if (attributes.currentViewer === 'O3DViewer') {
            if (typeof (window as any).OV === 'undefined') {
                const Src = document.getElementById('bp3d-o3dviewer-js');
                if (!Src) {
                    const script = document.createElement('script');
                    script.id = 'bp3d-o3dviewer-js';
                    script.src = (window as any)['bp3dBlock']?.o3dviewerSrc || '/wp-content/plugins/3d-viewer/public/js/o3dv.min.js';
                    document.head.appendChild(script);
                    script.addEventListener('load', renderViewer);
                } else {
                    Src.addEventListener('load', renderViewer);
                }
            } else {
                renderViewer();
            }
        }
    };
});
