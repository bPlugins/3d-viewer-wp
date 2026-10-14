<?php

namespace BP3D\Base;

use BP3D\Helper\Block;
use BP3D\Helper\Utils;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Viewer list screen in the Modern interface: preview, viewer and status columns plus a list/grid toggle.
 * Display only; Classic keeps WordPress's table untouched.
 */
class ViewerListModern
{
    const POST_TYPE = 'bp3d-model-viewer';
    const VIEW_META = 'bp3d_list_view';
    const VIEWS = ['list', 'grid'];

    /** @var array<int, array{poster: string, format: string, viewer: string, count: int}> */
    private static array $summaries = [];

    public function register(): void
    {
        if (!is_admin()) {
            return;
        }

        add_filter('manage_' . self::POST_TYPE . '_posts_columns', [$this, 'columns'], 20);
        add_action('manage_' . self::POST_TYPE . '_posts_custom_column', [$this, 'renderColumn'], 10, 2);
        add_filter('display_post_states', [$this, 'postStates'], PHP_INT_MAX, 2);
        add_action('load-edit.php', [$this, 'saveView']);
        add_filter('admin_body_class', [$this, 'bodyClass']);
        add_action('manage_posts_extra_tablenav', [$this, 'renderViewToggle']);
    }

    /** The saved layout for the current user; anything unknown reads as the default list. */
    public static function view(): string
    {
        $view = get_user_meta(get_current_user_id(), self::VIEW_META, true);

        return in_array($view, self::VIEWS, true) ? $view : 'list';
    }

    /**
     * What the list shows for a viewer, read from saved data only. Model URLs never leave here; only their extension does.
     *
     * @return array{poster: string, format: string, viewer: string, count: int}
     */
    public static function summary(int $post_id): array
    {
        if (isset(self::$summaries[$post_id])) {
            return self::$summaries[$post_id];
        }

        $data = self::isBlockPost($post_id) ? self::fromBlock($post_id) : self::fromMeta($post_id);
        $url = is_string($data['model']) ? $data['model'] : '';

        return self::$summaries[$post_id] = [
            'poster' => is_string($data['poster']) ? trim($data['poster']) : '',
            'format' => $url !== '' ? self::format($url) : '',
            'viewer' => $data['viewer'] === 'O3DViewer' ? 'advanced' : 'lite',
            'count' => (int) $data['count'],
        ];
    }

    /** Same check as Shortcode::renderModelViewer, including the legacy key. */
    private static function isBlockPost(int $post_id): bool
    {
        $value = get_post_meta($post_id, '_bp3d_is_gutenberg', true);
        if ($value === '') {
            $value = get_post_meta($post_id, 'isGutenberg', true);
        }

        return (bool) $value;
    }

    /** Mirrors the shortcode's classic-meta path (Utils::buildViewerAttributes): one model and its poster. */
    private static function fromMeta(int $post_id): array
    {
        $meta = Utils::getPostMeta($post_id, '_bp3dimages_');

        if (!is_array($meta('all'))) {
            return ['model' => '', 'poster' => '', 'viewer' => '', 'count' => 0];
        }

        $model = self::url(Utils::viewerModelSrc($meta));

        return [
            'model' => $model,
            'poster' => self::url(Utils::viewerPoster($meta)),
            'viewer' => $meta('currentViewer', 'modelViewer'),
            'count' => $model !== '' ? 1 : 0,
        ];
    }

    /** First block, as the shortcode renders it; the free block has one model. */
    private static function fromBlock(int $post_id): array
    {
        $block = Block::getBlock($post_id);
        $attrs = isset($block['attrs']) && is_array($block['attrs']) ? $block['attrs'] : [];
        $model = isset($attrs['model']) && is_array($attrs['model']) ? $attrs['model'] : [];
        $url = self::url($model['modelUrl'] ?? '');

        return [
            'model' => $url,
            'poster' => self::url($model['poster'] ?? ''),
            'viewer' => $attrs['currentViewer'] ?? 'modelViewer',
            'count' => $url !== '' ? 1 : 0,
        ];
    }

    /** Codestar media fields save ['url' => …]; older data may hold the plain string. */
    private static function url($value): string
    {
        if (is_array($value)) {
            $value = $value['url'] ?? '';
        }

        return is_string($value) ? trim($value) : '';
    }

    /** Upper-cased file extension of the URL's path, or '' when it doesn't look like one. */
    private static function format(string $url): string
    {
        $path = wp_parse_url($url, PHP_URL_PATH);
        $ext = is_string($path) ? strtolower(pathinfo($path, PATHINFO_EXTENSION)) : '';

        return preg_match('/^[a-z0-9]{1,6}$/', $ext) ? strtoupper($ext) : '';
    }

    /**
     * cb, Preview, Title, Viewer, Status, Shortcode, other plugins' columns, Date.
     *
     * @param  array<string, string> $columns
     * @return array<string, string>
     */
    public function columns($columns)
    {
        if (!is_array($columns) || !PostTypeModelViewer::isModernList()) {
            return $columns;
        }

        $ordered = [];
        if (isset($columns['cb'])) {
            $ordered['cb'] = $columns['cb'];
        }
        $ordered['bp3d_thumb'] = __('Preview', '3d-viewer');
        if (isset($columns['title'])) {
            $ordered['title'] = $columns['title'];
        }
        $ordered['bp3d_viewer'] = __('Viewer', '3d-viewer');
        $ordered['bp3d_status'] = __('Status', '3d-viewer');
        if (isset($columns['shortcode'])) {
            $ordered['shortcode'] = $columns['shortcode'];
        }

        foreach ($columns as $key => $label) {
            if ($key !== 'date' && !isset($ordered[$key])) {
                $ordered[$key] = $label;
            }
        }

        if (isset($columns['date'])) {
            $ordered['date'] = $columns['date'];
        }

        return $ordered;
    }

    public function renderColumn($column_name, $post_id)
    {
        if (!in_array($column_name, ['bp3d_thumb', 'bp3d_viewer', 'bp3d_status'], true) || !PostTypeModelViewer::isModernList()) {
            return;
        }

        $post_id = (int) $post_id;

        if ($column_name === 'bp3d_status') {
            $this->renderStatus($post_id);
            return;
        }

        $summary = self::summary($post_id);

        if ($column_name === 'bp3d_thumb') {
            $this->renderThumb($summary);
            return;
        }

        $this->renderViewer($summary);
    }

    /** @param array{poster: string, format: string, viewer: string, count: int} $summary */
    private function renderThumb(array $summary): void
    {
        echo '<span class="bp3d-list-thumb bp3d-list-thumb--' . esc_attr($summary['viewer']) . '">';

        if ($summary['poster'] !== '') {
            echo '<img src="' . esc_url($summary['poster']) . '" alt="" loading="lazy" decoding="async">';
        } else {
            echo '<svg class="bp3d-list-thumb__icon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"/><path d="m3 7 9 5 9-5M12 12v10"/></svg>';
        }

        if ($summary['format'] !== '') {
            echo '<span class="bp3d-list-thumb__format">' . esc_html($summary['format']) . '</span>';
        }

        echo '</span>';
    }

    /** @param array{poster: string, format: string, viewer: string, count: int} $summary */
    private function renderViewer(array $summary): void
    {
        $label = $summary['viewer'] === 'advanced' ? __('Advanced', '3d-viewer') : __('Lite', '3d-viewer');
        echo '<span class="bp3d-list-badge bp3d-list-badge--' . esc_attr($summary['viewer']) . '">' . esc_html($label) . '</span>';

        $parts = [];
        if ($summary['format'] !== '') {
            $parts[] = $summary['format'];
        }
        if ($summary['count'] > 1) {
            /* translators: %s: number of 3D models in the viewer. */
            $parts[] = sprintf(_n('%s model', '%s models', $summary['count'], '3d-viewer'), number_format_i18n($summary['count']));
        }

        if ($parts) {
            echo '<span class="bp3d-list-meta">' . esc_html(implode(' · ', $parts)) . '</span>';
        }
    }

    private function renderStatus(int $post_id): void
    {
        $post = get_post($post_id);
        if (!$post) {
            return;
        }

        $status = get_post_status_object($post->post_status);
        $label = $status && !empty($status->label) ? $status->label : $post->post_status;

        printf(
            '<span class="bp3d-list-status bp3d-list-status--%1$s">%2$s</span>',
            esc_attr(sanitize_html_class($post->post_status)),
            esc_html($label)
        );

        if ($post->post_password !== '') {
            echo '<span class="bp3d-list-status bp3d-list-status--protected">' . esc_html__('Password protected', '3d-viewer') . '</span>';
        }
    }

    /**
     * The Status column already says these; other plugins' states stay.
     *
     * @param  array<string, string> $states
     * @return array<string, string>
     */
    public function postStates($states, $post)
    {
        if (!is_array($states) || !$post instanceof \WP_Post || $post->post_type !== self::POST_TYPE || !PostTypeModelViewer::isModernList()) {
            return $states;
        }

        return array_diff_key($states, array_flip(['draft', 'pending', 'private', 'scheduled', 'protected']));
    }

    /** A display preference, so like core's `mode` it is taken from the URL without a nonce. */
    public function saveView(): void
    {
        if (!PostTypeModelViewer::isModernList() || !isset($_GET['bp3d_view'])) {
            return;
        }

        $view = sanitize_key(wp_unslash($_GET['bp3d_view']));
        $user_id = get_current_user_id();

        if ($user_id && in_array($view, self::VIEWS, true) && $view !== self::view()) {
            update_user_meta($user_id, self::VIEW_META, $view);
        }

        // Back to the clean URL, or core stops marking the current status view (All, Published…).
        wp_safe_redirect(remove_query_arg('bp3d_view'));
        exit;
    }

    /** Spaces on both sides: other plugins append without one. */
    public function bodyClass($classes)
    {
        return PostTypeModelViewer::isModernList() && self::view() === 'grid' ? $classes . ' bp3d-list-grid ' : $classes;
    }

    public function renderViewToggle($which)
    {
        if ($which !== 'top' || !PostTypeModelViewer::isModernList()) {
            return;
        }

        $current = self::view();
        $base = remove_query_arg(wp_removable_query_args());
        $icons = [
            'list' => '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
            'grid' => '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        ];
        $labels = [
            'list' => __('List view', '3d-viewer'),
            'grid' => __('Grid view', '3d-viewer'),
        ];

        echo '<div class="bp3d-list-view" role="group" aria-label="' . esc_attr__('Layout', '3d-viewer') . '">';

        foreach (self::VIEWS as $view) {
            $active = $view === $current;
            printf(
                '<a class="bp3d-list-view__btn%1$s" href="%2$s" aria-label="%3$s"%4$s><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">%5$s</svg></a>',
                $active ? ' is-active' : '',
                esc_url(add_query_arg('bp3d_view', $view, $base)),
                esc_attr($labels[$view]),
                $active ? ' aria-current="true"' : '',
                $icons[$view] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static markup above.
            );
        }

        echo '</div>';
    }
}
