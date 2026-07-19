import { test, expect, expectNoFatal } from '../fixtures';

/**
 * Baseline WooCommerce shopping flows with the plugin active — the plugin
 * replaces the single-product gallery, so the whole purchase path is where a
 * regression would surface.
 */
test.describe('WooCommerce core flows', () => {
    test('shop page lists the seeded product', async ({ page, state, pageErrors }) => {
        test.skip(!state.wooActive || !state.wooPages, 'WooCommerce is not active on this site');

        // The site ships a full demo store, so sort by latest to keep the
        // just-seeded product on page 1 of the catalog.
        await page.goto(`${state.wooPages!.shop}?orderby=date`);
        await expectNoFatal(page);
        await expect(page.getByText('E2E-3DV Product').first()).toBeVisible();
        expect(pageErrors).toHaveLength(0);
    });

    test('add to cart, check out with cash on delivery, receive the order', async ({
        page,
        state,
    }) => {
        test.skip(
            !state.wooActive || !state.wooPages || !state.product,
            'WooCommerce is not active on this site'
        );

        // Add the product to the cart from its single product page.
        await page.goto(state.product!.link);
        await page.locator('button[name="add-to-cart"], .single_add_to_cart_button').first().click();
        await expect(
            page.locator('.woocommerce-message, .wc-block-components-notice-banner.is-success').first()
        ).toBeVisible({ timeout: 20_000 });

        // Check out (works with the classic shortcode checkout or the block
        // checkout; billing is prefilled from the customer profile seeded in
        // global-setup — fill anything still empty).
        await page.goto(state.wooPages!.checkout);
        await expectNoFatal(page);
        const placeOrder = page
            .locator('.wc-block-components-checkout-place-order-button, #place_order')
            .first();
        await expect(placeOrder).toBeVisible({ timeout: 30_000 });

        const fillIfEmpty = async (selector: string, value: string) => {
            const field = page.locator(selector);
            if ((await field.count()) && (await field.first().inputValue().catch(() => 'x')) === '') {
                await field.first().fill(value);
            }
        };
        // Block checkout ids, then their classic checkout equivalents.
        await fillIfEmpty('#email, #billing_email', 'admin@localhost.com');
        await fillIfEmpty('#billing-first_name, #billing_first_name', 'E2E');
        await fillIfEmpty('#billing-last_name, #billing_last_name', 'Tester');
        await fillIfEmpty('#billing-address_1, #billing_address_1', '123 Main St');
        await fillIfEmpty('#billing-city, #billing_city', 'New York');
        await fillIfEmpty('#billing-postcode, #billing_postcode', '10001');

        await placeOrder.click();

        // Order received page (classic or block confirmation markup)
        await expect(
            page
                .locator('.woocommerce-thankyou-order-received, .wc-block-order-confirmation-status')
                .first()
        ).toBeVisible({ timeout: 45_000 });
        await expect(page.getByText('E2E-3DV Product').first()).toBeVisible();
        await expectNoFatal(page);
    });
});
