import React, { useEffect, useRef, type RefObject } from 'react';
import Viewer from '../../blocks/3d-viewer/Components/Common/Viewer';
import useProductStyles from '../../hooks/useProductStyles';

interface HeightValue {
    desktop?: string;
}

interface ProductStyles {
    height?: HeightValue | string;
    [key: string]: unknown;
}

interface Product3DViewerAttributes {
    placement?: string;
    position?: string;
    styles?: ProductStyles;
    is_not_compatible?: boolean;
    [key: string]: unknown;
}

interface Product3DViewerProps {
    attributes: Product3DViewerAttributes;
    viewerRef: RefObject<HTMLElement | null>;
    __: (text: string, textdomain?: string) => string;
    modelReader: unknown;
    setModelReader: (reader: unknown) => void;
    setAttributes: (attrs: Partial<Product3DViewerAttributes>) => void;
    [key: string]: unknown;
}

const Product3DViewer: React.FC<Product3DViewerProps> = ({ ...restProps }) => {
    const { viewerRef, attributes } = restProps;
    const { css } = useProductStyles(viewerRef, attributes);
    const { placement, position, styles, is_not_compatible } = attributes;

    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const setWidthHeight = (wrapperEl: HTMLElement, el: HTMLElement): void => {
            if (is_not_compatible && position === 'replace') {
                const height = typeof styles?.height === 'object'
                    ? (styles.height as HeightValue).desktop || ''
                    : styles?.height || '';
                wrapperEl.style.cssText = `width:100%;height:${height}`;
                return;
            }
            if (el.offsetHeight > 1000 || el.offsetWidth > 1000) {
                setTimeout(() => {
                    setWidthHeight(wrapperEl, el);
                }, 100);
            } else {
                wrapperEl.style.cssText = `width:${el.offsetWidth}px;height:${el.offsetHeight}px`;
                window.dispatchEvent(new Event('resize'));
            }
        };

        if (containerRef.current) {
            const wrapperEl = containerRef.current.querySelector('.b3dviewer-wrapper') as HTMLElement | null;
            if (!wrapperEl) return;

            if (['product-gallery', 'product-gallery-inline'].includes(placement || '')) {
                const galleryImgEl = document.querySelector('.woocommerce-product-gallery__image') as HTMLElement | null;
                if (galleryImgEl) {
                    setWidthHeight(wrapperEl, galleryImgEl);
                } else {
                    const height = typeof styles?.height === 'object'
                        ? (styles.height as HeightValue).desktop || ''
                        : styles?.height || '';
                    wrapperEl.style.cssText = `width:100%;height:${height}`;
                }
            } else if (placement === 'shortcode') {
                const height = typeof styles?.height === 'object'
                    ? (styles.height as HeightValue).desktop || ''
                    : styles?.height || '';
                wrapperEl.style.cssText = `width:100%;height:${height}`;
            }
        }
    }, [containerRef.current]);

    return (
        <>
            <style>{css}</style>
            <Viewer {...restProps} containerRef={containerRef} />
        </>
    );
};

export default Product3DViewer;
