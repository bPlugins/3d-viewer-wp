import getClickAbleDom from '../utils/getClickAbleDom';

/**
 * Sets up click-to-popup behavior for WooCommerce product 3D models.
 */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll<HTMLElement>('.bp3dv-model-main')?.forEach((model) => {
        const selector = model.dataset.selector;

        if (!selector || selector === '') {
            return;
        }

        const clickableItem = getClickAbleDom(selector);

        if (clickableItem) {
            clickableItem.addEventListener('click', (e: Event) => {
                e.preventDefault();
                (window as any).type = 'product';
                model.classList.add('model-open');

                for (let i = 1; i < 5; i++) {
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, i * 200);
                }

            });

            clickableItem.style.cursor = 'pointer';

            const closeBtn = model.querySelector('.close-btn') as HTMLElement | null;
            const bgOverlay = model.querySelector('.bg-overlay') as HTMLElement | null;
            closeBtn?.addEventListener('click', () => model.classList.remove('model-open'));
            bgOverlay?.addEventListener('click', () => model.classList.remove('model-open'));
        } else {
            console.warn('clickable item is not found', selector);
        }
    });
});
