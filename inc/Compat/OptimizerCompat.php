<?php

namespace BP3D\Compat;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Speed-plugin compatibility, Autoptimize only (plan HOTFIX-2.2.1 §2.3, item 9); 2.4.0 replaces this file with the full one.
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

    const PRIORITY = 999;

    /**
     * hook => [optimizer, kind, input, scope, timing, args].
     * input: handles | urls | jsurls (no directory needle that also matches CSS) | inline | csv (string or array)
     *        | pipe (string or array) | ao | w3tc (bool per tag) | wphb (bool per handle) | concat (bool per handle).
     * scope: all | defer (O3DV only) | defer-delay (one list for both: everything when delay is allowed, else O3DV).
     * timing: buffer (finished page, plain gate) | early (before content renders, adds the D22 pre-check)
     */
    const FILTERS = [
        'autoptimize_filter_js_exclude' => ['autoptimize', 'combine', 'ao', 'all', 'buffer', 1],
    ];

    /** @var bool */
    private $moduleEnqueued = false;

    /** @var bool Only "viewer present" is remembered; a "no viewer yet" answer is recomputed on every call (H2). */
    private $viewerSeen = false;

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
    }

    public function markModuleEnqueued(): void
    {
        $this->moduleEnqueued = true;
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

        if (!$this->viewerOnPage($timing === 'early')) {
            return $value;
        }

        $scope = $this->resolveScope($optimizer, $kind, $scope);
        if ($scope === '') {
            return $value;
        }

        $set = $this->exclusionSet();

        switch ($input) {
            case 'ao':
                return self::appendAutoptimize($value, $set[$scope]['needles']);
        }

        return $value;
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

            return false;
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
}
