import { findParentAnchorTag } from '../utils';
import wrapInAnchor from './wrapInAnchor';

/**
 * Handles the placement of 3D models in WooCommerce shop loop items.
 * Adjusts height from the sibling element and manages anchor tag behavior.
 * @param dom - The DOM element containing the 3D model.
 */
function handleShopLoopItemPlacement(dom: HTMLElement): void {
    setTimeout(() => {
        const height = (dom.previousElementSibling as HTMLElement)?.offsetHeight;

        const anchorTag = dom.closest('a') as HTMLAnchorElement | null;
        if (anchorTag) {
            const href = anchorTag.getAttribute('href') || '';
            const title = anchorTag.querySelector('.woocommerce-loop-product__title');
            const price = anchorTag.querySelector('.price');
            if (title) wrapInAnchor(title as HTMLElement, href);
            if (price) wrapInAnchor(price as HTMLElement, href);
            anchorTag.removeAttribute('href');
        }

        if (height) {
            dom.style.height = height + 'px';
            const timeout = setTimeout(() => {
                const modelBlock = dom.querySelector('.modelViewerBlock') as HTMLElement | null;
                if (modelBlock) {
                    clearTimeout(timeout);
                    modelBlock.style.height = height + 'px';
                    const parent = dom.querySelector('.bp_model_parent') as HTMLElement | null;
                    parent?.setAttribute('style', `height:${height}px;min-width: 100%`);
                    const parentAnchor = findParentAnchorTag(dom);

                    parentAnchor?.addEventListener('click', function (e: Event) {
                        const target = e.target as HTMLElement;
                        if (target.id === 'openBtn' || target.id === 'closeBtn' || target.tagName === 'MODEL-VIEWER') {
                            e.preventDefault();
                        }
                    });
                }
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
    }, 100);
}

export default handleShopLoopItemPlacement;
