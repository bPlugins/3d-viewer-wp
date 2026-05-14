import React from 'react';
import FrontEnd from '../public/Components/FrontEnd';
import { findParentAnchorTag } from '../utils';
import wrapInAnchor from './wrapInAnchor';

const { createRoot } = (window as any).ReactDOM;

interface RenderModelStyles {
    height?: {
        desktop?: string;
    } & string;
    [key: string]: unknown;
}

interface RenderModelAttributes {
    placement?: string;
    position?: string;
    styles?: RenderModelStyles;
    [key: string]: unknown;
}

interface RenderModelParams {
    div: HTMLElement;
    dom: HTMLElement;
    position: string;
    styles: RenderModelStyles;
    attributes: RenderModelAttributes;
    isPagination?: boolean;
    type?: string;
}

/**
 * Renders the FrontEnd React component into a DOM element.
 * Handles different WooCommerce product page positions (top, bottom, replace, merge).
 */
export const renderModel = ({
    div,
    dom,
    position,
    styles,
    attributes,
    isPagination,
    type,
}: RenderModelParams): void => {
    let targetDom = dom;

    if (position === 'bottom') {
        setTimeout(() => {
            const root = createRoot(targetDom);
            root.render(<FrontEnd attributes={attributes} />);
        }, 100);
    } else if (position === 'top') {
        targetDom.insertBefore(div, targetDom.firstChild);
        targetDom = div;
        setTimeout(() => {
            targetDom.setAttribute(
                'style',
                `width:${targetDom.offsetWidth > 0 ? targetDom.offsetWidth + 'px' : '100%'};`
            );
            const root = createRoot(targetDom);
            root.render(<FrontEnd attributes={attributes} />);
        }, 100);
    } else if (position === 'replace') {
        targetDom.setAttribute(
            'style',
            `width:${targetDom.offsetWidth > 0 ? targetDom.offsetWidth + 'px' : '100%'};`
        );
        const root = createRoot(targetDom);
        root.render(<FrontEnd attributes={attributes} />);
    } else if (position === 'merge_with_first_image') {
        setTimeout(() => {
            const imageEl = document.querySelector('.woocommerce-product-gallery__image') as HTMLElement | null;
            const wrapperEl = targetDom.querySelector('.b3dviewer-wrapper') as HTMLElement | null;
            if (imageEl && wrapperEl) {
                wrapperEl.style.cssText = `width:${imageEl.offsetWidth}px;height:${imageEl.offsetHeight}px;`;
            }
        }, 0);
        const root = createRoot(targetDom);
        root.render(<FrontEnd attributes={attributes} />);
    } else {
        const root = createRoot(targetDom);
        root.render(<FrontEnd attributes={attributes} />);
    }

    // Configure the model on shop loop product items
    if (targetDom.classList.contains('productListItem')) {
        const height = (targetDom.previousElementSibling as HTMLElement)?.offsetHeight;

        const anchorTag = targetDom.closest('a') as HTMLAnchorElement | null;
        if (anchorTag) {
            const href = anchorTag.getAttribute('href') || '';
            const title = anchorTag.querySelector('.woocommerce-loop-product__title');
            const price = anchorTag.querySelector('.price');
            if (title) wrapInAnchor(title as HTMLElement, href);
            if (price) wrapInAnchor(price as HTMLElement, href);
            anchorTag.removeAttribute('href');
        }

        if (height) {
            targetDom.style.height = height + 'px';
            const timeout = setTimeout(() => {
                const modelBlock = targetDom.querySelector('.modelViewerBlock') as HTMLElement | null;
                if (modelBlock) {
                    clearTimeout(timeout);
                    modelBlock.style.height = height + 'px';
                    const parent = targetDom.querySelector('.bp_model_parent') as HTMLElement | null;
                    parent?.setAttribute('style', `height:${height}px;min-width: 100%`);
                    const parentAnchor = findParentAnchorTag(targetDom);

                    parentAnchor.addEventListener('click', function (e: Event) {
                        const eventTarget = e.target as HTMLElement;
                        if (
                            eventTarget.id === 'openBtn' ||
                            eventTarget.id === 'closeBtn' ||
                            eventTarget.tagName === 'MODEL-VIEWER'
                        ) {
                            e.preventDefault();
                        }
                    });
                }
            }, 500);
        }
    }
};

export default renderModel;
