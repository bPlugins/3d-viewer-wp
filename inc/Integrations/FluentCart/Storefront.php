<?php

namespace BP3D\Integrations\FluentCart;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Puts the viewer on the FluentCart product page. Every FluentCart render path ends in
 * ProductRenderer::renderGallery(), so the module edits that HTML: a wrap for top/bottom/replace,
 * or a thumbnail slot inside the gallery for `thumb`. `inject()` is a pure string function.
 */
final class Storefront
{
    /** FluentCart's gallery DOM, in one place. Not a stable API; covered by the harness and e2e. */
    public const SELECTORS = [
        'wrapper' => 'fct-product-gallery-wrapper',
        'thumb' => 'fct-product-gallery-thumb',
        'controls' => 'fct-gallery-thumb-controls',
        'button' => 'fct-gallery-thumb-control-button',
        'main_image' => 'data-fluent-cart-single-product-page-product-thumbnail',
    ];

    public const MARK = 'data-bp3d-fct';

    private const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/></svg>';

    public function register(): void
    {
        add_filter('render_block_fluent-cart/product-gallery', [$this, 'filterGalleryBlock'], 20, 2);
        add_filter('the_content', [$this, 'filterContent'], 1000);
        add_filter('do_shortcode_tag', [$this, 'filterFluentShortcode'], 20, 3);
        add_filter('pre_do_shortcode_tag', [$this, 'productShortcode'], 10, 3);
        // The slot's stylesheet before the gallery paints; shortcode pages get it from apply().
        add_action('wp_enqueue_scripts', [$this, 'enqueueEarly'], 20);
    }

    /** Quick-view modals and REST payloads keep FluentCart's own markup. */
    private static function skip(): bool
    {
        return is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST);
    }

    private static function currentProductId(): int
    {
        $product = function_exists('fluent_cart_get_current_product') ? fluent_cart_get_current_product() : null;

        return is_object($product) && isset($product->ID) ? (int) $product->ID : 0;
    }

    public function enqueueEarly(): void
    {
        if (!is_singular(FluentCart::POST_TYPE)) {
            return;
        }
        $id = (int) get_queried_object_id();
        if (ProductModel::hasModel($id) && ProductModel::summary(ProductModel::read($id))['position'] !== 'none') {
            FluentCart::enqueue('fluentcart-storefront', FluentCart::FRONT_HANDLE);
        }
    }

    /**
     * @param mixed $html
     * @param mixed $block
     * @return mixed
     */
    public function filterGalleryBlock($html, $block = null)
    {
        if (self::skip() || !is_string($html) || $html === '') {
            return $html;
        }

        $attrs = is_array($block) && isset($block['attrs']) && is_array($block['attrs']) ? $block['attrs'] : [];
        $id = ($attrs['query_type'] ?? 'default') !== 'default' ? (int) ($attrs['product_id'] ?? 0) : 0;

        return self::apply($html, $id ?: self::currentProductId());
    }

    /**
     * @param mixed $content
     * @return mixed
     */
    public function filterContent($content)
    {
        if (self::skip() || !is_string($content) || !is_singular(FluentCart::POST_TYPE)) {
            return $content;
        }

        // Only the product's own content: related products on the same page run the_content too.
        $id = (int) get_queried_object_id();
        if (get_the_ID() !== $id) {
            return $content;
        }

        return self::apply($content, $id);
    }

    /**
     * @param mixed $output
     * @param mixed $tag
     * @param mixed $attr
     * @return mixed
     */
    public function filterFluentShortcode($output, $tag, $attr = [])
    {
        if ($tag !== 'fluent_cart_single_product' || self::skip() || !is_string($output)) {
            return $output;
        }

        // FluentCart accepts id, product_id and productId; WordPress lowercases attribute names.
        $id = is_array($attr) ? (int) ($attr['id'] ?? $attr['product_id'] ?? $attr['productid'] ?? 0) : 0;

        return self::apply($output, $id ?: self::currentProductId());
    }

    /**
     * `[3d_viewer_product id=N]` for a FluentCart ID; the core shortcode only answers Woo products.
     *
     * @param mixed $return
     * @param mixed $tag
     * @param mixed $attr
     * @return mixed
     */
    public function productShortcode($return, $tag, $attr = [])
    {
        if ($tag !== '3d_viewer_product' || $return !== false) {
            return $return;
        }

        $id = is_array($attr) && isset($attr['id']) ? (int) $attr['id'] : (int) get_the_ID();
        // A draft, private or password-protected product shows only to someone who may read it, as viewers do.
        if (!ProductModel::isProduct($id) || !\BP3D\Shortcode\Shortcode::isViewable($id)) {
            return $return;
        }

        return ProductModel::html($id, 'shortcode');
    }

    /** One product's viewer into one HTML fragment. A no-op without a model, with position `none`, or without a gallery. */
    public static function apply(string $html, int $id): string
    {
        if ($id <= 0 || strpos($html, self::MARK) !== false || !ProductModel::isProduct($id) || !ProductModel::hasModel($id)) {
            return $html;
        }

        $summary = ProductModel::summary(ProductModel::read($id));
        if ($summary['position'] === 'none') {
            return $html;
        }

        if (strpos($html, self::SELECTORS['wrapper']) === false) {
            return $html;
        }

        $viewer = ProductModel::html($id, 'shortcode');
        if ($viewer === '') {
            return $html;
        }

        $active = $summary['position'] === 'thumb' && $summary['showFirst'];
        $out = self::inject($html, $summary['position'], $viewer, self::thumbButton($summary['poster'], $active), $active);

        if ($out === $html) {
            FluentCart::debugLog("product {$id}: gallery markup not recognised, viewer not placed");

            return $html;
        }

        FluentCart::enqueue('fluentcart-storefront', FluentCart::FRONT_HANDLE);

        return $out;
    }

    public static function thumbButton(string $poster, bool $active): string
    {
        $inner = $poster !== ''
            ? '<img class="fct-gallery-control-thumb" src="' . esc_url($poster) . '" alt="" />'
            : self::ICON;

        return '<button type="button" class="' . self::SELECTORS['button'] . ' bp3d-fct-thumb' . ($active ? ' active' : '') . '"'
            . ' data-bp3d-fct-thumb aria-label="' . esc_attr__('View the 3D model', '3d-viewer') . '"'
            . ' aria-pressed="' . ($active ? 'true' : 'false') . '" tabindex="0">' . $inner . '</button>';
    }

    /**
     * Pure: place `$viewer` relative to the first `.fct-product-gallery-wrapper` in `$html`.
     * Unchanged input means the markup was not recognised.
     */
    public static function inject(string $html, string $position, string $viewer, string $thumb, bool $showFirst): string
    {
        $open = self::classTag($html, 'div', self::SELECTORS['wrapper']);
        if ($open === null) {
            return $html;
        }
        [$start, $openEnd] = $open;
        $end = self::elementEnd($html, $openEnd);
        if ($end === null) {
            return $html;
        }

        $gallery = substr($html, $start, $end - $start);

        switch ($position) {
            case 'top':
                $replacement = '<div class="bp3d-fct-gallery bp3d-fct-position-top" ' . self::MARK . '>' . $viewer . $gallery . '</div>';
                break;
            case 'bottom':
                $replacement = '<div class="bp3d-fct-gallery bp3d-fct-position-bottom" ' . self::MARK . '>' . $gallery . $viewer . '</div>';
                break;
            case 'replace':
                $replacement = '<div class="bp3d-fct-gallery bp3d-fct-position-replace" ' . self::MARK . '>' . $viewer
                    . '<div class="bp3d-fct-replaced" hidden>' . $gallery . '</div></div>';
                break;
            case 'thumb':
                $replacement = self::injectThumb($gallery, $viewer, $thumb, $showFirst);
                if ($replacement === null) {
                    // No recognisable thumb area: above the gallery is the nearest thing.
                    $replacement = '<div class="bp3d-fct-gallery bp3d-fct-position-top" ' . self::MARK . '>' . $viewer . $gallery . '</div>';
                }
                break;
            default:
                return $html;
        }

        return substr($html, 0, $start) . $replacement . substr($html, $end);
    }

    /** The slot after the main image, the button at the front of the thumb strip (made when FluentCart printed none). */
    private static function injectThumb(string $gallery, string $viewer, string $thumb, bool $showFirst): ?string
    {
        $area = self::classTag($gallery, 'div', self::SELECTORS['thumb']);
        if ($area === null) {
            return null;
        }
        [$areaStart, $areaOpenEnd] = $area;
        $areaEnd = self::elementEnd($gallery, $areaOpenEnd);
        if ($areaEnd === null) {
            return null;
        }

        $openTag = substr($gallery, $areaStart, $areaOpenEnd - $areaStart);
        $inner = substr($gallery, $areaOpenEnd, $areaEnd - $areaOpenEnd);

        if ($showFirst) {
            $openTag = (string) preg_replace('/\bclass="([^"]*)"/', 'class="$1 is-bp3d-active"', $openTag, 1);
            $openTag = str_replace(' is-video-active', '', $openTag);
        }

        $slot = '<div class="bp3d-fct-slot" data-bp3d-fct-slot ' . self::MARK . ($showFirst ? '' : ' hidden') . '>' . $viewer . '</div>';
        if (preg_match('/<img\b[^>]*' . self::SELECTORS['main_image'] . '[^>]*>/i', $inner, $m, PREG_OFFSET_CAPTURE)) {
            $at = $m[0][1] + strlen($m[0][0]);
            $inner = substr($inner, 0, $at) . $slot . substr($inner, $at);
        } else {
            $inner = (string) preg_replace('/<\/div\s*>$/i', $slot . '</div>', $inner, 1);
        }

        $gallery = substr($gallery, 0, $areaStart) . $openTag . $inner . substr($gallery, $areaEnd);

        $controls = self::classTag($gallery, 'div', self::SELECTORS['controls']);
        if ($controls !== null) {
            return substr($gallery, 0, $controls[1]) . $thumb . substr($gallery, $controls[1]);
        }

        $strip = '<div class="' . self::SELECTORS['controls'] . ' bp3d-fct-controls" role="toolbar" ' . self::MARK . '>' . $thumb . '</div>';

        return (string) preg_replace('/<\/div\s*>$/i', $strip . '</div>', $gallery, 1);
    }

    /**
     * The first `<$tag … class="… $class …">`: [start, end of the open tag]. Whole-class match, so
     * `fct-product-gallery-thumb` never matches `fct-product-gallery-thumb-controls`.
     *
     * @return array{0: int, 1: int}|null
     */
    private static function classTag(string $html, string $tag, string $class): ?array
    {
        $pattern = '/<' . $tag . '\b[^>]*\bclass="[^"]*(?<![\w-])' . preg_quote($class, '/') . '(?![\w-])[^"]*"[^>]*>/i';
        if (!preg_match($pattern, $html, $m, PREG_OFFSET_CAPTURE)) {
            return null;
        }

        return [$m[0][1], $m[0][1] + strlen($m[0][0])];
    }

    /** Offset just past the `</div>` that closes the element whose open tag ends at `$from`. */
    private static function elementEnd(string $html, int $from): ?int
    {
        $depth = 1;
        $pos = $from;
        while (preg_match('/<div\b|<\/div\s*>/i', $html, $m, PREG_OFFSET_CAPTURE, $pos)) {
            $pos = $m[0][1] + strlen($m[0][0]);
            $depth += $m[0][0][1] === '/' ? -1 : 1;
            if ($depth === 0) {
                return $pos;
            }
        }

        return null;
    }
}
