import type { Dispatch, SetStateAction } from 'react';

/**
 * Reads WooCommerce Swatchly variation attributes from the DOM
 * and sets up click listeners to update selected variants.
 * @param setSelectedVariants - React state setter for selected variant values.
 */
const getAttributesFromSwatchly = (
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

        row.querySelectorAll('.swatchly-swatch')?.forEach((el) => {
            el.addEventListener('click', () => {
                const value = el.getAttribute('data-attr_value') || '';
                variations[`attribute_${attr}`] = value;
                setSelectedVariants((oldData) => ({
                    ...oldData,
                    [`attribute_${attr}`]: value,
                }));
            });
        });
    });
};

export default getAttributesFromSwatchly;
