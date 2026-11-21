<?php

namespace BP3D\Compat;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Speed-plugin compatibility (plan RELEASE-2.4.0 §2.3, item 17).
 *
 * Adds our viewer scripts, their dependency closure and their inline data to the exclusion lists of known optimizers,
 * only on requests that print a viewer. Saves nothing and touches no other plugin's settings.
 * Shared with the free plugin as is: it must not reference Pro classes; those add handles through `bp3d_optimizer_exclusions`.
 */
class OptimizerCompat
{
    const MODULE_ID = 'bp3d-lib-model-viewer';
    const MODULE_ACTION = 'bp3d_script_module_enqueued';
    const BLOCK_NAME = 'b3dviewer/modelviewer';

    const HANDLES = ['bp3d-public', 'bp3d-lib-model-viewer', 'bp3d-lib-o3dviewer'];
    // Defer is excluded for O3DV only (D6).
    const DEFER_HANDLES = ['bp3d-lib-o3dviewer'];
    // Plugin-specific only: never a generic global such as `var assetsUrl` (bp3dBlock and assetsUrl print in one tag).
    const INLINE_NEEDLES = ['var bp3dBlock =', 'bp3d_backup_view'];

    const LOOPBACK_OPTION = 'bp3d_optimizer_loopback';
    const LOOPBACK_MAX_AGE = 30 * DAY_IN_SECONDS;
    const NOTICE_CLASS = 'bp3d-optimizer-notice';
    const DISMISS_ACTION = 'bp3d_optimizer_notice_dismiss';
    const DISMISS_NONCE = 'bp3d_optimizer_notice';
    const USER_META_DISMISSED = 'bp3d_optimizer_notice_dismissed';
    const HELP_URL = 'https://bplugins.com/docs/3d-viewer/troubleshooting/#if-you-use-a-speed-plugin';
    const PRIORITY = 999;

    /**
     * Detection by constant only (never another plugin's options). Perfmatters and FlyingPress are left out:
     * their constants could not be confirmed (plan R1), though their filters are documented and stay hooked.
     */
    const OPTIMIZERS = [
        'autoptimize' => ['name' => 'Autoptimize', 'constant' => 'AUTOPTIMIZE_PLUGIN_VERSION'],
        'wp-rocket' => ['name' => 'WP Rocket', 'constant' => 'WP_ROCKET_VERSION'],
        'litespeed' => ['name' => 'LiteSpeed Cache', 'constant' => 'LSCWP_V'],
        'siteground' => ['name' => 'SiteGround Optimizer', 'constant' => 'SiteGround_Optimizer\\VERSION'],
        'w3tc' => ['name' => 'W3 Total Cache', 'constant' => 'W3TC_VERSION'],
        'perfmatters' => ['name' => 'Perfmatters', 'constant' => ''],
        'jetpack-boost' => ['name' => 'Jetpack Boost', 'constant' => 'JETPACK_BOOST_VERSION'],
        'flyingpress' => ['name' => 'FlyingPress', 'constant' => ''],
        'hummingbird' => ['name' => 'Hummingbird', 'constant' => 'WPHB_VERSION'],
        'wp-optimize' => ['name' => 'WP-Optimize', 'constant' => 'WPO_VERSION'],
        'breeze' => ['name' => 'Breeze', 'constant' => 'BREEZE_VERSION'],
        'nitropack' => ['name' => 'NitroPack', 'constant' => 'NITROPACK_VERSION'],
    ];

    /**
     * hook => [optimizer, kind, input, scope, timing, args].
     * input: handles | urls | jsurls (no directory needle that also matches CSS) | inline | csv (string or array)
     *        | pipe (string or array) | ao | w3tc (bool per tag) | wphb (bool per handle) | concat (bool per handle).
     * scope: all | defer (O3DV only) | defer-delay (one list for both: everything when delay is allowed, else O3DV).
     * timing: buffer (finished page, plain gate) | early (before content renders, adds the D22 pre-check)
     *         | init (read once at init, before the request is known: inline needles only, see litespeedNoDefer()).
     */
    const FILTERS = [
        'autoptimize_filter_js_exclude' => ['autoptimize', 'combine', 'ao', 'all', 'buffer', 1],
        'rocket_exclude_js' => ['wp-rocket', 'combine', 'urls', 'all', 'buffer', 1],
        'rocket_exclude_defer_js' => ['wp-rocket', 'defer', 'urls', 'defer', 'buffer', 1],
        'rocket_delay_js_exclusions' => ['wp-rocket', 'delay', 'urls', 'all', 'buffer', 1],
        'rocket_defer_inline_exclusions' => ['wp-rocket', 'defer', 'pipe', 'all', 'buffer', 1],
        'litespeed_optimize_js_excludes' => ['litespeed', 'combine', 'urls', 'all', 'buffer', 1],
        'litespeed_optm_js_defer_exc' => ['litespeed', 'delay', 'inline', 'defer-delay', 'init', 1],
        'litespeed_optm_gm_js_exc' => ['litespeed', 'delay', 'inline', 'all', 'init', 1],
        'sgo_js_minify_exclude' => ['siteground', 'minify', 'handles', 'all', 'early', 1],
        'sgo_javascript_combine_exclude' => ['siteground', 'combine', 'handles', 'all', 'early', 1],
        'sgo_js_async_exclude' => ['siteground', 'defer', 'handles', 'defer', 'early', 1],
        'sgo_javascript_combine_excluded_inline_content' => ['siteground', 'combine', 'inline', 'all', 'early', 1],
        'w3tc_minify_js_do_tag_minification' => ['w3tc', 'combine', 'w3tc', 'all', 'buffer', 3],
        'perfmatters_delay_js_exclusions' => ['perfmatters', 'delay', 'urls', 'all', 'early', 1],
        'perfmatters_minify_js_exclusions' => ['perfmatters', 'minify', 'urls', 'all', 'early', 1],
        'perfmatters_defer_js_exclusions' => ['perfmatters', 'defer', 'urls', 'defer', 'early', 1],
        'jetpack_boost_render_blocking_js_exclude_handles' => ['jetpack-boost', 'defer', 'handles', 'defer', 'early', 1],
        'js_do_concat' => ['jetpack-boost', 'combine', 'concat', 'all', 'early', 2],
        'flying_press_exclude_from_minify:js' => ['flyingpress', 'minify', 'urls', 'all', 'early', 1],
        'flying_press_exclude_from_defer:js' => ['flyingpress', 'defer', 'urls', 'defer', 'early', 1],
        'flying_press_exclude_from_delay:js' => ['flyingpress', 'delay', 'urls', 'all', 'early', 1],
        'wphb_minify_resource' => ['hummingbird', 'minify', 'wphb', 'all', 'early', 4],
        'wphb_combine_resource' => ['hummingbird', 'combine', 'wphb', 'all', 'early', 4],
        'wphb_defer_resource' => ['hummingbird', 'defer', 'wphb', 'defer', 'early', 4],
        'wphb_delay_js_exclusions' => ['hummingbird', 'delay', 'urls', 'all', 'early', 1],
        'wp-optimize-minify-default-exclusions' => ['wp-optimize', 'combine', 'jsurls', 'all', 'early', 1],
        'breeze_filter_js_exclude' => ['breeze', 'combine', 'csv', 'all', 'buffer', 1],
    ];

    // LiteSpeed applies its defer/delay lists at init:5; tags are marked just before its optimizer runs (priority 20).
    const LITESPEED_FINALIZE_PRIORITY = 19;
    // Notice placeholder when the loopback names no plugin and none is detected.
    const NOTICE_UNNAMED = '-';

    /** @var bool */
    private $moduleEnqueued = false;

    /** @var bool Only "viewer present" is remembered; a "no viewer yet" answer is recomputed on every call (H2). */
    private $viewerSeen = false;

    /** @var array<int, bool> Content pre-check per queried post (a content fact, not the gate). */
    private $contentChecked = [];

    /** @var array<string, mixed>|null */
    private $set = null;

    /** @var int Registered-script count the set was computed with; a later registration widens the closure. */
    private $setRegistered = -1;

    /** @var array<string, string[]>|null */
    private $raw = null;

    public function register(): void
    {
        add_action(self::MODULE_ACTION, [$this, 'markModuleEnqueued']);

        foreach (self::FILTERS as $hook => $spec) {
            $args = (int) $spec[5];
            add_filter($hook, function (...$input) use ($hook) {
                return $this->filter($hook, $input);
            }, self::PRIORITY, $args);
        }
        add_filter('litespeed_buffer_finalize', [$this, 'litespeedNoDefer'], self::LITESPEED_FINALIZE_PRIORITY);

        add_action('admin_notices', [$this, 'renderNotice']);
        add_action('wp_ajax_' . self::DISMISS_ACTION, [$this, 'dismissNotice']);
    }

    public function markModuleEnqueued(): void
    {
        $this->moduleEnqueued = true;
    }

    /**
     * Active optimizers by constant: slug => display name. Health H15/H16 reuse it.
     *
     * @return array<string, string>
     */
    public static function detected(): array
    {
        $found = [];
        foreach (self::OPTIMIZERS as $slug => $optimizer) {
            if ($optimizer['constant'] !== '' && defined($optimizer['constant'])) {
                $found[$slug] = $optimizer['name'];
            }
        }

        return $found;
    }

    /**
     * @param  array<int, mixed> $args The filter's arguments as received.
     * @return mixed
     */
    public function filter(string $hook, array $args)
    {
        $value = $args[0] ?? null;
        $spec = self::FILTERS[$hook] ?? null;

        if (!$spec) {
            return $value;
        }

        list($optimizer, $kind, $input, $scope, $timing) = $spec;

        // Init-time lists can't see the request; plugin-specific inline needles match nothing on other pages.
        if ($timing === 'init') {
            return did_action('init') && $this->resolveScope($optimizer, $kind, $scope) === 'all'
                ? self::appendList($value, $this->inlineNeedles())
                : $value;
        }

        if (!$this->viewerOnPage($timing === 'early')) {
            return $value;
        }

        $scope = $this->resolveScope($optimizer, $kind, $scope);
        if ($scope === '') {
            return $value;
        }

        $set = $this->exclusionSet();

        switch ($input) {
            case 'handles':
                return self::appendList($value, $set[$scope]['handles']);
            case 'urls':
                return self::appendList($value, $set[$scope]['needles']);
            case 'jsurls':
                return self::appendList($value, $set[$scope]['jsNeedles']);
            case 'inline':
                return self::appendList($value, $set['inline']);
            case 'pipe':
                return self::appendString($value, $set['inline'], '|');
            case 'csv':
                return self::appendString($value, $set[$scope]['needles'], ', ');
            case 'ao':
                return self::appendAutoptimize($value, $set[$scope]['needles']);
            case 'w3tc':
                return $value && self::matchesAny((string) ($args[1] ?? '') . ' ' . (string) ($args[2] ?? ''), $set[$scope]['needles']) ? false : $value;
            case 'wphb':
                return self::hummingbird($value, $args, $set[$scope]['handles']);
            case 'concat':
                return $value && in_array((string) ($args[1] ?? ''), $set[$scope]['handles'], true) ? false : $value;
        }

        return $value;
    }

    /**
     * LiteSpeed defer/delay and Guest Mode: its lists were fixed at init, so on a viewer page our closure's tags get
     * `data-no-defer`, which LiteSpeed honours. Only `<script src>` tags are touched; inline data matches by needle.
     *
     * @param  mixed $buffer
     * @return mixed
     */
    public function litespeedNoDefer($buffer)
    {
        if (!is_string($buffer) || $buffer === '' || !class_exists('\WP_HTML_Tag_Processor') || !$this->viewerOnPage(false)) {
            return $buffer;
        }

        $scope = defined('LITESPEED_GUEST_OPTM')
            ? $this->resolveScope('litespeed', 'delay', 'all')
            : $this->resolveScope('litespeed', 'delay', 'defer-delay');
        if ($scope === '') {
            return $buffer;
        }

        $needles = $this->exclusionSet()[$scope]['needles'];
        $tags = new \WP_HTML_Tag_Processor($buffer);
        $changed = false;

        while ($tags->next_tag('script')) {
            $src = $tags->get_attribute('src');
            if (!is_string($src) || $src === '' || $tags->get_attribute('data-no-defer') !== null) {
                continue;
            }

            if (self::matchesAny((string) wp_parse_url($src, PHP_URL_PATH), $needles)) {
                $tags->set_attribute('data-no-defer', '1');
                $changed = true;
            }
        }

        return $changed ? $tags->get_updated_html() : $buffer;
    }

    /**
     * Which set a filter gets after the opt-outs, or '' when it is switched off.
     * `bp3d_optimizer_compat( bool $enabled, string $optimizer, string $kind )`, kind = minify|combine|defer|delay.
     */
    private function resolveScope(string $optimizer, string $kind, string $scope): string
    {
        if ($scope === 'defer-delay') {
            if ($this->enabled($optimizer, 'delay')) {
                return 'all';
            }

            return $this->enabled($optimizer, 'defer') ? 'defer' : '';
        }

        return $this->enabled($optimizer, $kind) ? $scope : '';
    }

    private function enabled(string $optimizer, string $kind): bool
    {
        return (bool) apply_filters('bp3d_optimizer_compat', true, $optimizer, $kind);
    }

    /**
     * Request gate: one of our handles is enqueued or printed, or our script module was enqueued.
     * Early filters also accept a content pre-check on singular pages, and exclude on every other page (D22).
     */
    private function viewerOnPage(bool $early): bool
    {
        if ($this->viewerSeen) {
            return true;
        }

        if (!did_action('init')) {
            return false;
        }

        if ($this->moduleEnqueued || $this->handlesInUse()) {
            $this->viewerSeen = true;
            return true;
        }

        if (!$early || is_admin() || !did_action('wp')) {
            return false;
        }

        if (!is_singular()) {
            return true;
        }

        $post = get_queried_object();
        if (!$post instanceof \WP_Post) {
            return false;
        }

        if (!isset($this->contentChecked[$post->ID])) {
            $this->contentChecked[$post->ID] = self::contentHasViewer($post);
        }

        return $this->contentChecked[$post->ID];
    }

    private function handlesInUse(): bool
    {
        foreach ($this->ownHandles() as $handle) {
            if (wp_script_is($handle, 'enqueued') || wp_script_is($handle, 'done')) {
                return true;
            }
        }

        return false;
    }

    /** Blocks, shortcodes, the Elementor widgets or a product with a 3D model. */
    public static function contentHasViewer(\WP_Post $post): bool
    {
        if (has_block(self::BLOCK_NAME, $post) || has_block('tdvb/td-viewer', $post)) {
            return true;
        }

        if (has_shortcode($post->post_content, '3d_viewer') || has_shortcode($post->post_content, '3d_viewer_product')) {
            return true;
        }

        $elementor = get_post_meta($post->ID, '_elementor_data', true);
        if (is_string($elementor) && (strpos($elementor, '3dModelViewer') !== false || strpos($elementor, 'BP3DProductModel') !== false)) {
            return true;
        }

        if ($post->post_type !== 'product') {
            return false;
        }

        $meta = get_post_meta($post->ID, '_bp3d_product_', true);
        if (!is_array($meta)) {
            return false;
        }

        // Pro declares the free plugin's flat keys reader; free reads the same flat keys below.
        if (is_callable(['\\BP3D\\Woocommerce\\Product', 'withLegacyFreeModel'])) {
            $meta = \BP3D\Woocommerce\Product::withLegacyFreeModel($meta);
        }

        foreach ((array) ($meta['bp3d_models'] ?? []) as $row) {
            if (is_array($row) && !empty($row['model_src'])) {
                return true;
            }
        }

        return !empty($meta['bp3d_model_src']);
    }

    /** @return string[] */
    private function ownHandles(): array
    {
        $raw = $this->rawSet();

        return $raw['handles'];
    }

    /**
     * Base set before the closure, after `bp3d_optimizer_exclusions`. Pro classes append their front handles here.
     *
     * @return array{handles: string[], deps: string[], defer: string[], paths: string[], inline: string[], modules: string[]}
     */
    private function rawSet(): array
    {
        if ($this->raw !== null) {
            return $this->raw;
        }

        $handles = self::HANDLES;
        $deps = [];
        $block = class_exists('\WP_Block_Type_Registry') ? \WP_Block_Type_Registry::get_instance()->get_registered(self::BLOCK_NAME) : null;
        // The view handle is generated (`…-view-script-3`), never hardcoded. Its sibling handles (react, react-dom) only
        // widen the closure: they aren't ours, so they never open the gate.
        foreach ($block ? (array) $block->view_script_handles : [] as $handle) {
            if (strpos((string) $handle, str_replace('/', '-', self::BLOCK_NAME) . '-') === 0) {
                $handles[] = $handle;
            } else {
                $deps[] = $handle;
            }
        }

        $base = (string) wp_parse_url(BP3D_DIR, PHP_URL_PATH);
        $base = $base === '' ? '/' : trailingslashit($base);

        $set = (array) apply_filters('bp3d_optimizer_exclusions', [
            'handles' => $handles,
            'deps' => $deps,
            'defer' => self::DEFER_HANDLES,
            'paths' => [$base . 'build/', $base . 'public/js/'],
            'inline' => self::INLINE_NEEDLES,
            'modules' => [self::MODULE_ID],
        ]);

        $clean = static function ($list): array {
            return array_values(array_unique(array_filter(array_map('strval', (array) $list), 'strlen')));
        };

        $raw = [
            'handles' => $clean($set['handles'] ?? []),
            'deps' => $clean($set['deps'] ?? []),
            'defer' => $clean($set['defer'] ?? []),
            'paths' => $clean($set['paths'] ?? []),
            'inline' => $clean($set['inline'] ?? []),
            'modules' => $clean($set['modules'] ?? []),
        ];

        // An init-time read comes before the block registers its view handle, so it is not kept.
        if (did_action('wp_loaded')) {
            $this->raw = $raw;
        }

        return $raw;
    }

    /**
     * Inline needles plus the script-module tag ids (`{id}-js-module`). Needs no registered scripts.
     *
     * @return string[]
     */
    private function inlineNeedles(): array
    {
        $raw = $this->rawSet();
        $module_tags = array_map(static function ($id) {
            return $id . '-js-module';
        }, $raw['modules']);

        return array_values(array_unique(array_merge($raw['inline'], $module_tags)));
    }

    /**
     * Handles plus their recursive dependencies, and the same as full `src` paths (never a bare handle such as `react`
     * in a URL filter). Inline needles and the script-module tag ids (`{id}-js-module`) join every needle list.
     *
     * @return array{all: array{handles: string[], needles: string[], jsNeedles: string[]}, defer: array{handles: string[], needles: string[], jsNeedles: string[]}, inline: string[]}
     */
    private function exclusionSet(): array
    {
        $scripts = wp_scripts();
        $registered = count($scripts->registered);

        if ($this->set !== null && $this->setRegistered === $registered) {
            return $this->set;
        }

        $raw = $this->rawSet();
        $inline = $this->inlineNeedles();

        $all = self::closure(array_merge($raw['handles'], $raw['deps']), $scripts);
        $defer = self::closure($raw['defer'], $scripts);
        $all_src = self::srcPaths($all, $scripts);
        $defer_src = self::srcPaths($defer, $scripts);
        // For lists shared with CSS: only directories that hold scripts alone, never build/.
        $js_dirs = array_filter($raw['paths'], static function ($path) {
            return substr($path, -4) === '/js/';
        });

        $this->set = [
            'all' => [
                'handles' => $all,
                'needles' => array_values(array_unique(array_merge($raw['paths'], $all_src, $inline))),
                'jsNeedles' => array_values(array_unique(array_merge($js_dirs, $all_src, $inline))),
            ],
            // A defer list must not hold our directory paths, which would also keep model-viewer and the bundle out.
            'defer' => [
                'handles' => $defer,
                'needles' => $defer_src,
                'jsNeedles' => $defer_src,
            ],
            'inline' => $inline,
        ];
        $this->setRegistered = $registered;

        return $this->set;
    }

    /**
     * @param  string[] $handles
     * @return string[]
     */
    private static function closure(array $handles, \WP_Scripts $scripts): array
    {
        $seen = [];
        $stack = $handles;

        while ($stack) {
            $handle = (string) array_pop($stack);
            if ($handle === '' || isset($seen[$handle])) {
                continue;
            }
            $seen[$handle] = true;

            if (isset($scripts->registered[$handle])) {
                foreach ((array) $scripts->registered[$handle]->deps as $dep) {
                    $stack[] = (string) $dep;
                }
            }
        }

        return array_keys($seen);
    }

    /**
     * Path part of each handle's `src`, e.g. /wp-includes/js/dist/vendor/react.min.js.
     *
     * @param  string[] $handles
     * @return string[]
     */
    private static function srcPaths(array $handles, \WP_Scripts $scripts): array
    {
        $paths = [];
        foreach ($handles as $handle) {
            $src = isset($scripts->registered[$handle]) ? $scripts->registered[$handle]->src : '';
            if (!is_string($src) || $src === '') {
                continue;
            }

            $path = (string) wp_parse_url($src, PHP_URL_PATH);
            if ($path !== '' && $path !== '/') {
                $paths[] = $path;
            }
        }

        return array_values(array_unique($paths));
    }

    /**
     * @param  mixed    $value
     * @param  string[] $ours
     * @return mixed
     */
    private static function appendList($value, array $ours)
    {
        if ($value === null || $value === '' || $value === false) {
            $value = [];
        }
        if (!is_array($value)) {
            return $value;
        }

        return array_values(array_unique(array_merge($value, $ours)));
    }

    /**
     * Plugins that accept a joined string or an array.
     *
     * @param  mixed    $value
     * @param  string[] $ours
     * @return mixed
     */
    private static function appendString($value, array $ours, string $separator)
    {
        if (is_array($value)) {
            return self::appendList($value, $ours);
        }
        if ($value !== null && !is_string($value)) {
            return $value;
        }

        $current = array_filter(array_map('trim', explode(trim($separator) ?: $separator, (string) $value)), 'strlen');
        $missing = array_diff($ours, $current);

        if (!$missing) {
            return $value;
        }

        return trim((string) $value) === '' ? implode($separator, $missing) : rtrim((string) $value) . $separator . implode($separator, $missing);
    }

    /**
     * Autoptimize takes a comma-separated string, or an array of needle => '' (a value of 'remove' drops the script).
     *
     * @param  mixed    $value
     * @param  string[] $ours
     * @return mixed
     */
    private static function appendAutoptimize($value, array $ours)
    {
        if (is_array($value)) {
            foreach ($ours as $needle) {
                if (!array_key_exists($needle, $value)) {
                    $value[$needle] = '';
                }
            }

            return $value;
        }

        return self::appendString($value, $ours, ', ');
    }

    /**
     * Hummingbird asks per handle: minify/combine default true (false skips), defer default false (true defers).
     *
     * @param  mixed             $value
     * @param  array<int, mixed> $args  ($value, $handle, $type, $url)
     * @param  string[]          $handles
     * @return mixed
     */
    private static function hummingbird($value, array $args, array $handles)
    {
        $handle = (string) ($args[1] ?? '');
        $type = (string) ($args[2] ?? '');

        if (!$value || $type !== 'scripts' || !in_array($handle, $handles, true)) {
            return $value;
        }

        return false;
    }

    /** @param string[] $needles */
    private static function matchesAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle !== '' && strpos($haystack, $needle) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Shown when NitroPack is active (no filters at all), or when the last loopback (Pro H15, under 30 days old)
     * found our scripts removed, aggregated or delayed (D5).
     *
     * @return string[] Names for the notice; empty when it should not show.
     */
    public static function noticePlugins(): array
    {
        $detected = self::detected();
        $names = [];

        if (isset($detected['nitropack'])) {
            $names[] = $detected['nitropack'];
        }

        $loopback = get_option(self::LOOPBACK_OPTION, null);
        if (
            is_array($loopback)
            && in_array($loopback['status'] ?? '', ['removed', 'aggregated', 'delayed'], true)
            && time() - (int) ($loopback['checkedAt'] ?? 0) < self::LOOPBACK_MAX_AGE
        ) {
            $found = array_filter(array_map('strval', (array) ($loopback['plugins'] ?? [])), 'strlen');
            $names = array_merge($names, $found ?: array_values($detected));

            if (!$names) {
                $names[] = self::NOTICE_UNNAMED;
            }
        }

        return array_values(array_unique($names));
    }

    /** @param string[] $names */
    private static function noticeHash(array $names): string
    {
        sort($names);

        return md5(implode('|', $names));
    }

    public function renderNotice(): void
    {
        if (!current_user_can('manage_options') || !self::isNoticeScreen()) {
            return;
        }

        $names = self::noticePlugins();
        if (!$names) {
            return;
        }

        // A newly found optimizer changes the hash, so the notice comes back.
        if (get_user_meta(get_current_user_id(), self::USER_META_DISMISSED, true) === self::noticeHash($names)) {
            return;
        }
        ?>
        <div class="notice notice-warning is-dismissible <?php echo esc_attr(self::NOTICE_CLASS); ?>"
             data-nonce="<?php echo esc_attr(wp_create_nonce(self::DISMISS_NONCE)); ?>">
            <p>
                <strong><?php esc_html_e('3D Viewer:', '3d-viewer'); ?></strong>
                <?php
                if ($names === [self::NOTICE_UNNAMED]) {
                    esc_html_e('A speed or caching plugin is changing 3D Viewer\'s scripts on the live page. If a 3D model shows in the editor but not on the live page, its JavaScript settings (combine, minify, delay) are a possible cause.', '3d-viewer');
                } else {
                    echo esc_html(sprintf(
                        /* translators: %s: name(s) of the active speed or caching plugin, e.g. "WP Rocket" */
                        __('Speed plugin detected: %s. If a 3D model shows in the editor but not on the live page, this plugin\'s JavaScript settings (combine, minify, delay) are a possible cause.', '3d-viewer'),
                        implode(', ', $names)
                    ));
                }
                ?>
                <a href="<?php echo esc_url(self::HELP_URL); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('How to check', '3d-viewer'); ?> →</a>
            </p>
        </div>
        <?php
        wp_print_inline_script_tag(
            'document.addEventListener("click",function(e){' .
            'var b=e.target.closest&&e.target.closest(".' . self::NOTICE_CLASS . ' .notice-dismiss");' .
            'if(!b)return;' .
            'var n=b.closest(".' . self::NOTICE_CLASS . '");' .
            'window.fetch(window.ajaxurl,{method:"POST",credentials:"same-origin",' .
            'body:new URLSearchParams({action:"' . self::DISMISS_ACTION . '",_wpnonce:n.dataset.nonce})});' .
            '});',
            ['id' => 'bp3d-optimizer-notice-dismiss']
        );
    }

    public function dismissNotice(): void
    {
        if (!check_ajax_referer(self::DISMISS_NONCE, '_wpnonce', false) || !current_user_can('manage_options')) {
            wp_send_json_error(null, 403);
        }

        $names = self::noticePlugins();
        if ($names) {
            update_user_meta(get_current_user_id(), self::USER_META_DISMISSED, self::noticeHash($names));
        }

        wp_send_json_success();
    }

    /** 3D Viewer list, edit and submenu screens, the Dashboard included; never the rest of wp-admin. */
    private static function isNoticeScreen(): bool
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if (!$screen) {
            return false;
        }

        if (in_array($screen->post_type, ['bp3d-model-viewer', 'bp3d-preset'], true) && in_array($screen->base, ['edit', 'post'], true)) {
            return true;
        }

        return strpos((string) $screen->id, 'bp3d-model-viewer_page_') === 0;
    }
}
