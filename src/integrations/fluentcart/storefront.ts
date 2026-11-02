import './storefront.scss';

/**
 * The thumb slot on a FluentCart product gallery. Our thumb
 * button carries no `data-fluent-cart-thumb-control-button`, so FluentCart's gallery script ignores
 * it; this file shows the slot on our button and hides it on any of theirs.
 */

const RESIZE_BURST = [50, 200, 450, 900];

const burst = () => RESIZE_BURST.forEach((ms) => window.setTimeout(() => window.dispatchEvent(new Event('resize')), ms));

const wire = (slot: HTMLElement) => {
    const area = slot.closest<HTMLElement>('.fct-product-gallery-thumb');
    const gallery = slot.closest<HTMLElement>('.fct-product-gallery-wrapper');
    const button = gallery?.querySelector<HTMLButtonElement>('[data-bp3d-fct-thumb]');
    if (!area || !gallery || !button || slot.dataset.bp3dWired) return;
    slot.dataset.bp3dWired = '1';

    const others = () => Array.from(gallery.querySelectorAll<HTMLElement>('.fct-gallery-thumb-control-button')).filter((el) => el !== button);

    const show = () => {
        slot.hidden = false;
        area.classList.add('is-bp3d-active');
        area.classList.remove('is-video-active');
        area.querySelectorAll('[data-fct-product-gallery-video].is-active').forEach((video) => video.classList.remove('is-active'));
        // A playing FluentPlayer video would keep its audio under the slot.
        area.querySelectorAll<HTMLElement & { pause?: () => void }>('[data-fct-product-gallery-video] media-player').forEach((player) => {
            try {
                player.pause?.();
            } catch {
                // Not every player state can pause; the slot still opens.
            }
        });
        others().forEach((el) => {
            el.classList.remove('active');
            el.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        burst();
    };

    const hide = () => {
        if (!area.classList.contains('is-bp3d-active')) return;
        slot.hidden = true;
        area.classList.remove('is-bp3d-active');
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
    };

    button.addEventListener('click', (event) => {
        event.preventDefault();
        show();
    });
    // Capture phase: FluentCart's handler runs after and sets its own image or video active.
    gallery.addEventListener(
        'click',
        (event) => {
            const target = (event.target as Element | null)?.closest('.fct-gallery-thumb-control-button');
            if (target && target !== button) hide();
        },
        true
    );
    // Only this product's variation switch; two products on one page keep their own slots.
    window.addEventListener('fluentCartSingleProductVariationChanged', (event) => {
        const detail = (event as CustomEvent<{ productId?: string | number }>).detail;
        const mine = gallery.dataset.productId;
        if (detail?.productId && mine && String(detail.productId) !== String(mine)) return;
        // With per-variant models the viewer swaps its own model, so an open slot stays open over the new photo.
        if (slot.hasAttribute('data-bp3d-fct-variants') && area.classList.contains('is-bp3d-active')) {
            window.requestAnimationFrame(() => window.requestAnimationFrame(show));
            return;
        }
        hide();
    });

    if (area.classList.contains('is-bp3d-active')) show();
};

const init = () => document.querySelectorAll<HTMLElement>('[data-bp3d-fct-slot]').forEach(wire);

// The quick view (shop.ts) adds a slot after load and asks for a new pass; wired slots are skipped.
document.addEventListener('bp3d-fct-scan', init);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
