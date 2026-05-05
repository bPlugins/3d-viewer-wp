import type { Dispatch, SetStateAction } from 'react';

/**
 * Sets up WooCommerce Swatchly variation swatch listeners.
 * @param setSelectedVariants - React state setter for selected variant values.
 */
export const handleWoocommerceVariantUpdateForSwatchly = (
    setSelectedVariants: Dispatch<SetStateAction<Record<string, string>>>
): void => {
    const parentEl = document.querySelector('table.variations');
    if (!parentEl) return;

    const labels = parentEl.querySelectorAll('.label label');
    const variations: Record<string, string> = {};

    labels?.forEach((label) => {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
            variations[`attribute_${forAttr}`] = '';
        }
    });

    setSelectedVariants(variations);

    parentEl.querySelectorAll('tr')?.forEach((row) => {
        const attr = row?.querySelector('.label label')?.getAttribute('for');
        if (!attr) return;

        let variationsEl = row.querySelectorAll('.swatchly-swatch');
        if (variationsEl.length <= 0) {
            variationsEl = row.querySelectorAll('li');
        }

        variationsEl?.forEach((el) => {
            el.addEventListener('click', () => {
                const value = el.getAttribute('data-attr_value') || el.getAttribute('data-value') || '';
                setSelectedVariants((oldData) => ({
                    ...oldData,
                    [`attribute_${attr}`]: value,
                }));
            });
        });
    });
};

/**
 * Sets up default WooCommerce variation select listeners.
 * @param setSelectedVariants - React state setter for selected variant values.
 */
export const handleWoocommerceVariantUpdateDefault = (
    setSelectedVariants: Dispatch<SetStateAction<Record<string, string>>>
): void => {
    document.querySelectorAll<HTMLSelectElement>('.variations_form .variations select')?.forEach((select) => {
        const variations: Record<string, string> = {};
        variations[select.name] = select.value;

        const updateVariations = (): void => {
            setSelectedVariants((oldData) => ({
                ...oldData,
                [select.name]: select.value,
            }));
        };

        select.addEventListener('change', updateVariations);
        setSelectedVariants(variations);
    });
};
