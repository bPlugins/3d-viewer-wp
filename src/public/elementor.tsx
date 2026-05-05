import React from 'react';
import { jsonParse } from 'bp-utils';
import FrontEnd from './Components/FrontEnd';

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
        const dataset = { ...dom.dataset } || {};
        const attributes = jsonParse(dataset.attributes);

        if (!attributes) return;
        dom.removeAttribute('data-attributes');

        const root = createRoot(dom);
        root.render(<FrontEnd attributes={attributes} />);
    };
});
