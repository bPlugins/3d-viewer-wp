import { findParentUntilMultipleChildren, isImageSource, restoreOriginalImageSrc } from '../utils';

/**
 * Finds a clickable DOM element based on a selector string.
 * Handles image source selectors, CSS selectors, and class names.
 * @param selector - The selector string (could be an image URL, CSS selector, or class name).
 * @returns The clickable element or null.
 */
export default function getClickAbleDom(selector: string): HTMLElement | null {
    if (!selector) return null;

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
        setTimeout(() => {
            if (clickableItem?.innerHTML?.includes('<a')) {
                clickableItem.classList.add('bp3d_a_popup_opener');
            }
        }, 500);

        if (clickableItem?.innerHTML?.includes('<img') && window.location.host === 'reintest.be') {
            clickableItem.classList.add('bp3d_play_icon');
        }
    }

    return clickableItem;
}
