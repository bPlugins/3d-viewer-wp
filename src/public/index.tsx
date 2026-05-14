import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import jsonParse from './../../../wp-utils/v1/jsonParse';
import Viewer from './../blocks/3d-viewer/Components/Common/Viewer';
import modelRenderer from '../utils/modelRenderer';

import './product';
import { findParentUntilMultipleChildren, isImageSource, restoreOriginalImageSrc } from '../utils';
import createSetAttributes from '../utils/createSetAttributes';

declare const elementorFrontend: any;
declare const OV: any;

/**
 * Legacy entry point: handles non-React model-viewer elements
 * and the WooCommerce product popup.
 */
document.addEventListener('DOMContentLoaded', function () {
    const models = document.querySelectorAll<HTMLElement>('.b3dviewer-wrapper:not(.elementor)');

    Array.from(models).forEach((wrapper) => {
        modelRenderer({ animation: true, variant: true, wrapper });
    });

    /**
     * Modal/Popup for woocommerce product images:
     * open 3D model popup when click on the product image.
     */
    document.querySelectorAll<HTMLElement>('.bp3d-model-main')?.forEach((model) => {
        const selector = model.dataset.selector;

        if (!selector || selector === '') {
            return;
        }

        let clickableItem: HTMLElement | null = document.querySelector(
            isImageSource(selector)
                ? `img[src="${selector}"]`
                : selector.includes('#') || selector.includes('.')
                    ? selector
                    : `.${selector}`
        );

        if (isImageSource(selector)) {
            if (!clickableItem) {
                clickableItem = document.querySelector(`img[data-src="${selector}"]`);
            }
            if (!clickableItem) {
                clickableItem = document.querySelector(`img[data-src="${restoreOriginalImageSrc(selector)}"]`);
            }
            if (!clickableItem) {
                clickableItem = document.querySelector(`img[src="${restoreOriginalImageSrc(selector)}"]`);
            }
            if (!clickableItem) {
                clickableItem = document.querySelector(`a[href="${restoreOriginalImageSrc(selector)}"]`);
            }
        }

        if (clickableItem) {
            clickableItem = findParentUntilMultipleChildren(clickableItem);
            if (clickableItem?.innerHTML?.includes('<a')) {
                clickableItem.classList.add('bp3d_a_popup_opener');
            }

            if (clickableItem?.innerHTML?.includes('<img') && window.location.host === 'reintest.be') {
                clickableItem.classList.add('bp3d_play_icon');
            }

            clickableItem?.addEventListener('click', (e: Event) => {
                e.preventDefault();
                model.classList.add('model-open');
                window.dispatchEvent(new Event('resize'));
                (window as any).type = 'public';
            });

            clickableItem.style.cursor = 'pointer';

            const closeBtn = model.querySelector('.close-btn') as HTMLElement | null;
            const bgOverlay = model.querySelector('.bg-overlay') as HTMLElement | null;
            closeBtn?.addEventListener('click', () => model.classList.remove('model-open'));
            bgOverlay?.addEventListener('click', () => model.classList.remove('model-open'));
        } else {
            console.warn('clickable item is not found', selector);
        }
    });
});


interface FrontEndProps {
    attributes: Record<string, unknown>;
}

const FrontEnd: React.FC<FrontEndProps> = ({ attributes }) => {
    const [attrs, setAttrs] = useState(attributes);

    const viewerRef = useRef<any>(null);

    function __(text: string, _textdomain: string = ''): string {
        return text;
    }

    const setAttributes = createSetAttributes(setAttrs as any);
    const containerRef = useRef<HTMLElement>(null);

    if (attributes) {
        return (
            <Viewer
                attributes={attrs}
                __={__}
                viewerRef={viewerRef}
                setAttributes={setAttributes}
                containerRef={containerRef}
            />
        );
    }
    return null;
};

/**
 * Elementor integration (legacy).
 */
window.addEventListener('elementor/frontend/init', function () {
    elementorFrontend.hooks.addAction(
        'frontend/element_ready/3dModelViewer.default',
        function (scope: any) {
            const blocks = scope[0]?.querySelectorAll('.modelViewerBlock') as NodeListOf<HTMLElement> | undefined;
            blocks?.forEach((dom: HTMLElement) => {
                const dataset = { ...dom.dataset } || {};
                setTimeout(() => {
                    Object.keys(dom.dataset).forEach((key) => delete dom.dataset[key]);
                }, 10);

                const attributes = jsonParse(dataset.attributes);

                if (attributes) {
                    const selector = dataset.selector;
                    if (selector && document.querySelector(selector)) {
                        const targetDom = document.querySelector(selector) as HTMLElement;
                        targetDom.setAttribute('style', `width:${targetDom.offsetWidth}px;height:350px`);
                    }

                    if (!attributes?.currentViewer || attributes.currentViewer === 'modelViewer') {
                        dom.setAttribute('data-rendered', 'true');
                        const root = createRoot(dom);
                        root.render(<FrontEnd attributes={attributes} />);
                        const Src = document.getElementById('bp3d-lib-model-viewer-js');
                        if (!Src) {
                            const script = document.createElement('script');
                            script.type = 'module';
                            script.id = 'bp3d-lib-model-viewer-js';
                            script.src = (window as any)['bp3dBlock']?.modelViewerSrc;
                            document.head.appendChild(script);
                        }
                    }

                    if (attributes.currentViewer === 'O3DViewer') {
                        if (typeof OV === 'undefined') {
                            const Src = document.getElementById('bp3d-o3dviewer-js');
                            if (!Src) {
                                const script = document.createElement('script');
                                script.id = 'bp3d-o3dviewer-js';
                                script.src = (window as any)['bp3dBlock']?.o3dviewerSrc;
                                document.head.appendChild(script);
                                script.addEventListener('load', () => {
                                    const root = createRoot(dom);
                                    root.render(<FrontEnd attributes={attributes} />);
                                });
                            } else {
                                Src.addEventListener('load', () => {
                                    const root = createRoot(dom);
                                    root.render(<FrontEnd attributes={attributes} />);
                                });
                            }
                        } else {
                            const root = createRoot(dom);
                            root.render(<FrontEnd attributes={attributes} />);
                        }
                    }
                }
            });
        }
    );
});

(window as any).modelRenderer = modelRenderer;
