import React from 'react';
import jsonParse from '../../../wp-utils/v1/jsonParse';

import './product';
import './scss/themes/themes.scss';
import './scss/themes/common.scss';
import FrontEnd from './Components/FrontEnd';
import manageIncompatibleTheme from '../utils/manageIncompatibleTheme';
import handleShopLoopItemPlacement from '../utils/handleShopLoopItemPlacement';
import './elementor';

const { createRoot } = (window as any).ReactDOM;

declare global {
    interface Window {
        domRendered?: boolean;
    }
}

setTimeout(() => {
    const backupModels = document.querySelectorAll('.bp3d_backup_view') as NodeListOf<HTMLElement>;
    if (backupModels.length > 0) {
        backupModels.forEach((element: HTMLElement) => {
            if (element) {
                element.style.display = 'block';
                setTimeout(() => {
                    const adminMessages = document.querySelectorAll('.bp3d_admin_message') as NodeListOf<HTMLElement>;
                    if (adminMessages.length > 0) {
                        adminMessages.forEach((adminMessage: HTMLElement) => {
                            if (adminMessage) {
                                adminMessage.style.display = 'block';
                            }
                        });
                    }
                }, 5000);
            }
        });
    }
}, 5000);

/**
 * Frontend entry point.
 * Renders all 3D viewer blocks on the page based on their placement type.
 */
document.addEventListener('DOMContentLoaded', function () {
    const models = document.querySelectorAll<HTMLElement>('.modelViewerBlock:not(.elementor)');

    if (window.domRendered) {
        return;
    }
    window.domRendered = true;

    models.forEach((dom) => {
        const dataset = { ...dom.dataset };
        setTimeout(() => {
            Object.keys(dom.dataset).forEach((key) => delete dom.dataset[key]);
        }, 10);

        const attributes = jsonParse(dataset.attributes);
        if (!attributes) return;

        const { is_not_compatible, placement } = attributes;

        if (['product-gallery'].includes(placement)) {
            if (is_not_compatible) {
                manageIncompatibleTheme(attributes);
            } else {
                const root = createRoot(dom);
                root.render(<FrontEnd attributes={attributes} />);
            }
        } else if (placement === 'product-gallery-inline') {
            const root = createRoot(dom);
            root.render(<FrontEnd attributes={attributes} />);
        } else if (placement === 'shop-loop-item') {
            const root = createRoot(dom);
            root.render(<FrontEnd attributes={attributes} />);
            handleShopLoopItemPlacement(dom);
        } else if (placement === 'shortcode') {
            const root = createRoot(dom);
            root.render(<FrontEnd attributes={attributes} />);
        } else if (placement === 'popup') {
            const root = createRoot(dom);
            root.render(<FrontEnd attributes={attributes} />);
        }
    });
});
