/**
 * Walks up the DOM tree while the parent is an `<a>` tag.
 * Returns the highest ancestor `<a>` element (or the original element).
 * @param element - The starting DOM element.
 * @returns The outermost `<a>` parent, or the original element.
 */
export function findParentAnchorTag(element: HTMLElement): HTMLElement {
    let parent = element.parentElement;

    while (parent && parent.tagName === 'A') {
        element = parent;
        parent = parent.parentElement;
    }

    return element;
}

export default findParentAnchorTag;
