export interface ModelItem {
    modelUrl: string;
    poster?: string;
    product_variant?: string;
    variations?: Record<string, string>;
    [key: string]: unknown;
}

/**
 * Finds the model matching the selected WooCommerce variants.
 * Falls back to a model with 'all' variant, then to the first model.
 * @param models - Array of model items with variant info.
 * @param selectedVariants - The currently selected variant key/value pairs.
 * @returns The matching model item, or undefined.
 */
const getModelBasedOnVariants = (
    models: ModelItem[],
    selectedVariants: Record<string, string> | null
): ModelItem | undefined => {
    if (!selectedVariants || typeof selectedVariants !== 'object') return;

    let modelItem = models.find((item) => {
        const firstVariant = Object.keys(selectedVariants)[0];

        // Handle legacy version without variations object
        if (!item?.variations?.[firstVariant]) {
            return [selectedVariants[firstVariant], 'all'].includes(item.product_variant ?? '');
        }

        let isMatched = true;

        Object.keys(selectedVariants).forEach((key) => {
            const selectedVariant = selectedVariants[key] || 'all';
            if (item?.variations?.[key] !== selectedVariant && item?.variations?.[key] !== 'all') {
                isMatched = false;
            }
        });

        return isMatched;
    });

    // Fallback to model with 'all' variant
    if (!modelItem) {
        modelItem = models.find((item) => {
            return Object.keys(selectedVariants).find((key) => {
                return item.variations?.[key] === 'all';
            });
        });
    }

    return modelItem;
};

export default getModelBasedOnVariants;
