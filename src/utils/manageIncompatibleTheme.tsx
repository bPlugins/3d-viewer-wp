import React from 'react';
import FrontEnd from '../public/Components/FrontEnd';

const { createRoot } = (window as any).ReactDOM;

interface BP3DBlockSelectors {
    gallery: string;
    [key: string]: string;
}

interface ManageIncompatibleThemeAttributes {
    position?: string;
    [key: string]: unknown;
}

/**
 * Handles rendering the 3D viewer for incompatible WooCommerce themes.
 * Places the viewer at the top, bottom, or replaces the gallery.
 */
const manageIncompatibleTheme = (attributes: ManageIncompatibleThemeAttributes): void => {
    const selectors = (window as any).bp3dBlock?.selectors as BP3DBlockSelectors | undefined;
    if (!selectors) return;

    const { gallery } = selectors;
    const galleryEl = document.querySelector(gallery);
    const { position } = attributes;

    const renderFrontEnd = (targetDom: HTMLElement): void => {
        const root = createRoot(targetDom);
        root.render(<FrontEnd attributes={attributes} />);
    };

    switch (position) {
        case 'replace': {
            const dom = document.querySelector(gallery) as HTMLElement | null;
            if (dom) renderFrontEnd(dom);
            break;
        }

        case 'bottom': {
            const dom = document.createElement('div');
            setTimeout(() => {
                galleryEl?.appendChild(dom);
                renderFrontEnd(dom);
            }, 500);
            break;
        }

        case 'top': {
            const dom = document.createElement('div');
            galleryEl?.prepend(dom);
            renderFrontEnd(dom);
            break;
        }
    }
};

export default manageIncompatibleTheme;
