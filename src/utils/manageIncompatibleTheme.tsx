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

interface Gallery {
    /** What Replace takes over. */
    el: HTMLElement;
    /** Where Top and Bottom go inside the gallery. */
    images: HTMLElement;
    /** The gallery lays out its own children, so Top and Bottom sit outside it. */
    beside: boolean;
    /** Found by the fallback list, not the configured selector. */
    fallback: boolean;
}

// Tried only when the configured selector finds nothing, so a gallery that works today is never re-placed.
const FALLBACK_GALLERIES: Array<{ selector: string; images?: string; beside?: boolean }> = [
    { selector: '.woocommerce-product-gallery' },
    // Woostify: a flex row of thumbnails and the image box; Top and Bottom go in the image box.
    { selector: '.product-gallery', images: '.product-images' },
    // Woo's Product Gallery block (Ollie, Purple).
    { selector: '.wp-block-woocommerce-product-gallery', beside: true },
    { selector: '.wp-block-woocommerce-product-image-gallery' },
];

const findGallery = (configured: string): Gallery | null => {
    const found = document.querySelector<HTMLElement>(configured);
    if (found) return { el: found, images: found, beside: false, fallback: false };
    for (const { selector, images, beside = false } of FALLBACK_GALLERIES) {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) return { el, images: (images && el.querySelector<HTMLElement>(images)) || el, beside, fallback: true };
    }
    return null;
};

/**
 * Handles rendering the 3D viewer for incompatible WooCommerce themes.
 * Places the viewer at the top, bottom, or replaces the gallery.
 */
const manageIncompatibleTheme = (attributes: ManageIncompatibleThemeAttributes): void => {
    const selectors = (window as any).bp3dBlock?.selectors as BP3DBlockSelectors | undefined;
    if (!selectors) return;

    const gallery = findGallery(selectors.gallery);
    const { position } = attributes;

    if (!gallery) {
        console.warn('3D Viewer: no product gallery found for the 3D model. Set its selector in 3D Viewer → Settings.', selectors.gallery);
        return;
    }

    const { el: galleryEl, images, beside, fallback } = gallery;

    const container = (): HTMLDivElement => {
        const dom = document.createElement('div');
        // style.scss contains the viewer's float here, so the theme's gallery beside it keeps its width.
        if (fallback) dom.classList.add('bp3d-woo-fallback-viewer');
        return dom;
    };

    const renderFrontEnd = (targetDom: HTMLElement, attrs: ManageIncompatibleThemeAttributes = attributes): void => {
        const root = createRoot(targetDom);
        root.render(<FrontEnd attributes={attrs} />);
    };

    switch (position) {
        case 'replace': {
            renderFrontEnd(galleryEl);
            break;
        }

        case 'bottom': {
            const dom = container();
            setTimeout(() => {
                if (beside) galleryEl.after(dom);
                else images.appendChild(dom);
                renderFrontEnd(dom);
            }, 500);
            break;
        }

        // Merge needs the theme to print Woo's thumbnail hook; when it doesn't, show the model on top instead of nowhere.
        case 'merge_with_first_image':
            if (document.querySelector('.wooCustomSelector.position_merge_with_first_image')) break;
        // falls through
        case 'top': {
            const dom = container();
            // Woo's gallery block: sit above the gallery so Woo's zoom trigger stays on the image.
            // Custom containers and classic float layouts keep the old prepend.
            if (
                beside || (galleryEl.classList.contains('woocommerce-product-gallery')
                && galleryEl.parentElement?.classList.contains('wp-block-woocommerce-product-image-gallery'))
            ) {
                dom.classList.add('bp3d-woo-top-viewer');
                galleryEl.before(dom);
            } else {
                images.prepend(dom);
            }
            // Merge's viewer waits behind a "View 3D" toggle on the photo; on top it shows straight away.
            renderFrontEnd(dom, position === 'top' ? attributes : { ...attributes, position: 'top' });
            break;
        }
    }
};

export default manageIncompatibleTheme;
