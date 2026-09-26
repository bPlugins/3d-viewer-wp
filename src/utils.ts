
/**
 * Removes WordPress-style size suffixes (e.g., `-100x100`) from image URLs.
 */
export function restoreOriginalImageSrc(imageSrc: string): string {
    const sizePattern = /-\d{2,4}x\d{2,4}/g;
    return imageSrc.replace(sizePattern, '');
}

/**
 * Checks if a string is an image file path based on common extensions.
 */
export function isImageSource(str: string): boolean {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i;
    return imageExtensions.test(str);
}

/**
 * Walks up the DOM tree while the parent has only one child.
 * Returns the highest single-child ancestor.
 */
export function findParentUntilMultipleChildren(element: HTMLElement): HTMLElement {
    let parent = element.parentElement;

    while (parent && parent.children.length === 1) {
        element = parent;
        parent = parent.parentElement;
    }

    return element;
}
