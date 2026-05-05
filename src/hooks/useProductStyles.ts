import { useEffect, useState, type RefObject } from 'react';

interface BP3DSelectors {
    gallery_trigger?: string;
    [key: string]: string | undefined;
}

interface ProductStylesAttributes {
    position?: string;
    [key: string]: unknown;
}

interface UseProductStylesReturn {
    css: string | null;
}

/**
 * Custom hook that manages CSS styles for WooCommerce product 3D viewers.
 * Adjusts gallery trigger positioning based on container height.
 */
const useProductStyles = (
    viewerRef: RefObject<HTMLElement | null>,
    attributes: ProductStylesAttributes
): UseProductStylesReturn => {
    const [css, setCSS] = useState<string | null>(null);
    const selectors = (window as any).bp3dBlock?.selectors as BP3DSelectors | undefined;
    const gallery_trigger = selectors?.gallery_trigger;
    const { position } = attributes;

    useEffect(() => {
        if (!viewerRef.current) return;
        const computedCSS = '';

        const containerEl = viewerRef.current?.closest('.modelViewerBlock') as HTMLElement | null;
        if (!containerEl || !gallery_trigger) {
            return;
        }

        const triggerEl = document.querySelector(gallery_trigger) as HTMLElement | null;
        if (triggerEl && containerEl && position === 'top') {
            triggerEl.style.cssText = 'top: ' + containerEl.offsetHeight + 'px !important;';
        }

        setCSS(computedCSS);
    }, [attributes, viewerRef.current]);

    if (!viewerRef.current) return { css: null };

    return { css };
};

export default useProductStyles;
