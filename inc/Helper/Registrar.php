<?php

namespace BP3D\Helper;

use BP3D\Base\AdminUi;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * `\CSF::` stand-in: sends each screen, whole, to Codestar (Classic) or bfields (Modern), from the same arrays.
 */
final class Registrar
{
    /** @var array<string, bool> unique => true when Modern owns the screen. */
    private static $modern = [];

    /** @var array<string, bool> unique => a section has been registered. */
    private static $sections = [];

    public static function createOptions(string $unique, array $args = []): void
    {
        if (self::modern($unique)) {
            // No Reset Section / Reset All in Modern; Classic keeps them.
            \BFields\Compat\Codestar::createOptions($unique, ['show_reset_section' => false, 'show_reset_all' => false] + $args + [
                // Codestar shows search unless told otherwise; bfields does not.
                'show_search' => true,
                'tabs_switcher' => true,
                'sticky_tabs' => true,
                'resizable' => true,
                'page_width' => 'full',
                'page_align' => 'start',
                'brand' => [
                    'primary' => '#1b5cf0',
                    'save' => '#3b52f6',
                    'logo' => BP3D_DIR . 'admin/images/logo.svg',
                ],
            ]);
            self::adminBarNode($args);
            return;
        }

        \CSF::createOptions($unique, $args);
    }

    /** The toolbar node Codestar adds for an options page (CSF_Options::add_admin_bar_menu()), so Modern keeps it. */
    private static function adminBarNode(array $args): void
    {
        $slug = (string) ($args['menu_slug'] ?? '');

        if ('' === $slug || (isset($args['show_bar_menu']) && empty($args['show_bar_menu'])) || !empty($args['menu_hidden'])) {
            return;
        }

        add_action('admin_bar_menu', static function ($wp_admin_bar) use ($args, $slug) {
            if (!current_user_can($args['menu_capability'] ?? 'manage_options') || is_network_admin()) {
                return;
            }

            $wp_admin_bar->add_node([
                'id' => $slug,
                'title' => esc_attr($args['menu_title'] ?? ''),
                'href' => esc_url(admin_url('admin.php?page=' . $slug)),
            ]);
        }, $args['admin_bar_menu_priority'] ?? 50);
    }

    public static function createMetabox(string $unique, array $args = []): void
    {
        if (self::modern($unique)) {
            // The viewer editor is the design's whole Add New page, not a box.
            if ('_bp3dimages_' === $unique) {
                $args += [
                    'frame' => 'page',
                    'tabs_switcher' => true,
                    'sticky_tabs' => true,
                    'resizable' => true,
                    'page_width' => 'full',
                    'page_align' => 'start',
                    'show_reset_section' => false,
                    'page' => [
                        'shortcode' => "[3d_viewer id='%d']",
                        'hint' => __('Copy and paste this shortcode into your posts, pages and widget', '3d-viewer'),
                        // Update saves without a reload (plan/AJAX-SAVE-PLAN.md); kill switch: bp3d_update_in_place.
                        'update_in_place' => true,
                    ],
                ];
                self::inPlaceSwitch();
            }
            \BFields\Compat\Codestar::createMetabox($unique, $args);
            return;
        }

        \CSF::createMetabox($unique, $args);
    }

    /** Read when bfields renders the page and on each save, not here at init 0, so a later filter still counts. */
    private static function inPlaceSwitch(): void
    {
        static $added = false;

        if ($added) {
            return;
        }
        $added = true;

        add_filter('bfields_update_in_place', static function ($on, $post_id = 0, $unique = '') {
            return '_bp3dimages_' === $unique ? (bool) apply_filters('bp3d_update_in_place', (bool) $on) : $on;
        }, 10, 3);
    }

    public static function createSection(string $unique, array $section = []): void
    {
        // The interface switch opens the Settings page, in both interfaces.
        if ('_bp3d_settings_' === $unique && empty(self::$sections[$unique])) {
            $section['fields'] = array_merge([AdminUi::switchField()], (array) ($section['fields'] ?? []));
        }

        self::$sections[$unique] = true;

        if (self::modern($unique)) {
            if (!empty($section['fields']) && is_array($section['fields'])) {
                // An older bfields copy may have won arbitration: it has no field_group.
                if (!defined('BFIELDS_VERSION') || version_compare(BFIELDS_VERSION, '1.1.0', '<')) {
                    $section['fields'] = self::unwrapGroups($section['fields']);
                }
                $section['fields'] = self::modernFields($section['fields']);
            }
            \BFields\Compat\Codestar::createSection($unique, $section);
            return;
        }

        // Codestar has no field_group: its children go back in place, so Classic gets the arrays it always had.
        if (!empty($section['fields']) && is_array($section['fields'])) {
            $section['fields'] = self::unwrapGroups($section['fields']);
        }

        \CSF::createSection($unique, $section);
    }

    /** Decided once per key per request: every section of a screen must reach the framework that owns it. */
    public static function modern(string $unique): bool
    {
        if (!isset(self::$modern[$unique])) {
            self::$modern[$unique] = AdminUi::MODERN === AdminUi::mode(AdminUi::SURFACES[$unique] ?? '');
        }

        return self::$modern[$unique];
    }

    /** Splices every bfields `field_group`'s children where the group stood; a list without groups comes back unchanged. */
    private static function unwrapGroups(array $fields): array
    {
        if (!self::hasGroup($fields)) {
            return $fields;
        }

        $out = [];
        foreach ($fields as $field) {
            if (is_array($field) && ($field['type'] ?? '') === 'field_group') {
                $children = self::inheritDependency(is_array($field['fields'] ?? null) ? $field['fields'] : [], $field['dependency'] ?? null);
                foreach (self::unwrapGroups($children) as $child) {
                    $out[] = $child;
                }
                continue;
            }

            if (is_array($field) && !empty($field['fields']) && is_array($field['fields'])) {
                $field['fields'] = self::unwrapGroups($field['fields']);
            }
            $out[] = $field;
        }

        return $out;
    }

    /** A group's rule is ANDed onto each child's own (bfields' Schema::inherit_dependency()), so Classic hides what the card would. */
    private static function inheritDependency(array $children, $dependency): array
    {
        if (!is_array($dependency) || [] === $dependency) {
            return $children;
        }

        foreach ($children as $i => $child) {
            if (!is_array($child)) {
                continue;
            }
            $children[$i]['dependency'] = empty($child['dependency']) || !is_array($child['dependency'])
                ? $dependency
                : array_merge(self::ruleList($dependency), self::ruleList($child['dependency']));
        }

        return $children;
    }

    /** A dependency as a rule list read the way CSF::field() reads it: a single rule's empty parts print as '', unset flags stay unset. */
    private static function ruleList(array $dependency): array
    {
        $single = !(isset($dependency[0]) && is_array($dependency[0]));
        $list = [];

        foreach ($single ? [$dependency] : $dependency as $rule) {
            if (!is_array($rule)) {
                continue;
            }
            $out = [];
            for ($k = 0; $k < 3; $k++) {
                $out[] = $single ? (!empty($rule[$k]) ? $rule[$k] : '') : ($rule[$k] ?? '');
            }
            foreach ([3, 4] as $k) {
                if (!empty($rule[$k])) {
                    $out[$k] = $rule[$k];
                }
            }
            $list[] = $out;
        }

        return $list;
    }

    private static function hasGroup(array $fields): bool
    {
        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }
            if (($field['type'] ?? '') === 'field_group' || (!empty($field['fields']) && is_array($field['fields']) && self::hasGroup($field['fields']))) {
                return true;
            }
        }

        return false;
    }

    /** Modern-only, at any depth: per-device sizes keep their nested {tablet, mobile}; `bp3d-readonly` rows lock as `pro`, never saved; `modern_dependency` replaces `dependency`. */
    private static function modernFields(array $fields): array
    {
        foreach ($fields as $i => $field) {
            if (!is_array($field)) {
                continue;
            }

            if (($field['type'] ?? '') === 'bp3d_responsive_dimensions') {
                $fields[$i]['responsive'] = true;
            }

            if (isset($field['class']) && is_string($field['class']) && preg_match('/(^|\s)bp3d-readonly(\s|$)/', $field['class'])) {
                $fields[$i]['pro'] = true;
            }

            if (isset($field['modern_dependency'])) {
                $fields[$i]['dependency'] = $field['modern_dependency'];
                unset($fields[$i]['modern_dependency']);
            }

            if (!empty($field['fields']) && is_array($field['fields'])) {
                $fields[$i]['fields'] = self::modernFields($field['fields']);
            }
        }

        return $fields;
    }
}
