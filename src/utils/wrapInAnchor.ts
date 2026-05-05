/**
 * Wraps a given DOM element in a new anchor tag.
 * @param domElement - The DOM element to be wrapped.
 * @param href - The URL for the anchor tag's href attribute.
 */
function wrapInAnchor(domElement: HTMLElement | null, href: string): void {
    if (!domElement || !(domElement instanceof HTMLElement)) {
        return;
    }

    const anchorTag = document.createElement('a');
    anchorTag.href = href;

    const parent = domElement.parentNode;
    if (!parent) return;

    parent.insertBefore(anchorTag, domElement);
    anchorTag.appendChild(domElement);
}

export default wrapInAnchor;
