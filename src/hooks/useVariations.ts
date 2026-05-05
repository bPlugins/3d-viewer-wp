import { useEffect, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { handleWoocommerceVariantUpdateDefault, handleWoocommerceVariantUpdateForSwatchly } from '../utils/woocommerce';

interface ModelItem {
    modelUrl: string;
    product_variant?: string;
    [key: string]: unknown;
}

interface UseVariationsReturn {
    selectedVariants: Record<string, string> | null;
    setSelectedVariants: Dispatch<SetStateAction<Record<string, string> | null>>;
}

/**
 * Custom hook that manages WooCommerce variation selection
 * and syncs with 3D model switching.
 * @param woo - Whether WooCommerce is active.
 * @param models - Array of model items with variant info.
 * @param containerRef - React ref to the container element.
 * @param setModelSrc - Setter for the current model source URL.
 */
const useVariations = (
    woo: boolean,
    models: ModelItem[],
    containerRef: RefObject<HTMLElement>,
    setModelSrc: Dispatch<SetStateAction<string>>
): UseVariationsReturn => {
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        if (woo) {
            // WooCommerce default template
            handleWoocommerceVariantUpdateDefault(setSelectedVariants as Dispatch<SetStateAction<Record<string, string>>>);

            // Change model when variation changes | Swatchly plugin support
            if (containerRef.current) {
                const slickItem = document.querySelector('.wl-single-slider:not(.slick-cloned)');
                if (slickItem && !slickItem.querySelector('.modelViewerBlock')) {
                    const parent = containerRef.current.parentElement;
                    if (parent) {
                        slickItem.append(parent);
                        parent.style.display = 'none';
                    }
                }

                // Swatchly plugin support
                handleWoocommerceVariantUpdateForSwatchly(setSelectedVariants as Dispatch<SetStateAction<Record<string, string>>>);
            }

            // Select2 variation observer
            setTimeout(() => {
                const targetElement = document.querySelector('.select2-selection__rendered');

                const observer = new MutationObserver(function (mutationsList) {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList' && mutation.target === targetElement) {
                            const text = (targetElement as HTMLElement)?.innerText;
                            const modelItem =
                                models.find((item) => item.product_variant === text) ||
                                models.find((item) => item.product_variant === 'all') ||
                                models?.[0];
                            if (modelItem) {
                                setModelSrc(modelItem.modelUrl);
                            }
                        }
                    }
                });

                if (targetElement) {
                    const config: MutationObserverInit = { childList: true, subtree: true };
                    observer.observe(targetElement, config);
                }
            }, 1000);
        }

        return () => {
            // Cleanup placeholder
        };
    }, [woo]);

    return { selectedVariants, setSelectedVariants };
};

export default useVariations;
