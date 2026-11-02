<?php

namespace BP3D\Integrations\FluentCart;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The "FluentCart" section on 3D Viewer → Settings: one switch, declared whenever FluentCart is active
 * so the owner can turn the module off and on again.
 */
final class Settings
{
    public const PREFIX = '_bp3d_settings_';

    public function register(): void
    {
        // After Field\Settings::init (init, 0), so this tab follows the WooCommerce ones.
        add_action('init', [$this, 'section'], 1);
    }

    public function section(): void
    {
        // Same gate as Field\Settings::init: the page, and the bfields save of it.
        if (!is_admin() && !current_user_can('manage_options')) {
            return;
        }

        \BP3D\Helper\Registrar::createSection(self::PREFIX, [
            'id' => 'fluentcart-settings',
            'title' => __('FluentCart', '3d-viewer'),
            'fields' => [
                [
                    'id' => FluentCart::SWITCH,
                    'icon' => 'cart',
                    'type' => 'switcher',
                    'title' => __('FluentCart', '3d-viewer'),
                    'text_on' => __('Yes', '3d-viewer'),
                    'text_off' => __('No', '3d-viewer'),
                    'subtitle' => __('Show 3D models on FluentCart product pages.', '3d-viewer'),
                    'desc' => __('Each product picks its model under 3D Model in the FluentCart product editor. Default is Enable.', '3d-viewer'),
                    'default' => true,
                ],
            ],
        ]);
    }
}
