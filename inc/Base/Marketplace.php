<?php

namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Marketplace (vendor) helpers shared by the core guards and the optional Dokan module.
 *
 * Works whether or not Dokan is active: vendor capabilities persist on the user.
 */
final class Marketplace
{
    public const META_KEYS_PRIVATE = ['_bp3d_vendor_written', '_bp3d_admin_lock', '_bp3d_vendor_pending_', '_bp3d_vendor_published_once', '_bp3d_trusted_hash'];

    public const OPTION = 'bp3d_dokan_settings';

    private static array $vendorCache = [];

    private static ?array $settingsCache = null;

    private static bool $moduleActive = false;

    public function register(): void
    {
        add_filter('woocommerce_duplicate_product_exclude_meta', [$this, 'excludeFromDuplicate'], 10, 1);
        add_action('add_option_' . self::OPTION, [self::class, 'resetCache']);
        add_action('update_option_' . self::OPTION, [self::class, 'resetCache']);
        add_action('delete_option_' . self::OPTION, [self::class, 'resetCache']);
    }

    /**
     * @param array<int, string> $exclude
     * @return array<int, string>
     */
    public function excludeFromDuplicate($exclude): array
    {
        $exclude = is_array($exclude) ? $exclude : [];

        return array_values(array_unique(array_merge($exclude, self::META_KEYS_PRIVATE)));
    }

    /**
     * Whether the user is a marketplace vendor (seller or vendor staff) and not a shop manager/admin.
     *
     * @param \WP_User|int|null $user Defaults to the current user.
     */
    public static function isMarketplaceVendor($user = null): bool
    {
        if ($user instanceof \WP_User) {
            $user_id = (int) $user->ID;
        } elseif ($user === null) {
            $user_id = (int) get_current_user_id();
        } else {
            $user_id = is_numeric($user) ? (int) $user : 0;
        }

        if ($user_id <= 0) {
            return false;
        }

        if (array_key_exists($user_id, self::$vendorCache)) {
            return self::$vendorCache[$user_id];
        }

        $is_vendor = (user_can($user_id, 'dokandar') || user_can($user_id, 'vendor_staff'))
            && !user_can($user_id, 'manage_woocommerce');

        $is_vendor = (bool) apply_filters('bp3d_is_marketplace_vendor', $is_vendor, $user_id);
        self::$vendorCache[$user_id] = $is_vendor;

        return $is_vendor;
    }

    public static function isVendorScope(int $post_id): bool
    {
        if ($post_id <= 0) {
            return false;
        }

        $author = (int) get_post_field('post_author', $post_id);
        if ($author > 0 && self::isMarketplaceVendor($author)) {
            return true;
        }

        return get_post_meta($post_id, '_bp3d_vendor_written', true) === '1';
    }

    /**
     * Author of an attachment, 0 when the ID is not an attachment.
     */
    public static function attachmentOwner(int $attachment_id): int
    {
        if ($attachment_id <= 0 || get_post_type($attachment_id) !== 'attachment') {
            return 0;
        }

        return (int) get_post_field('post_author', $attachment_id);
    }

    /**
     * Ownership check for an attachment a vendor wants to use (plan §2.6 step 1-2).
     */
    public static function isOwnAttachment(int $attachment_id, int $vendor_id): bool
    {
        if ($attachment_id <= 0 || get_post_type($attachment_id) !== 'attachment') {
            return false;
        }

        $author = (int) get_post_field('post_author', $attachment_id);

        if ($vendor_id > 0 && $author > 0) {
            if ($author === $vendor_id) {
                return true;
            }

            if (user_can($author, 'vendor_staff') && (int) get_user_meta($author, '_vendor_id', true) === $vendor_id) {
                return true;
            }
        }

        return current_user_can('edit_post', $attachment_id);
    }

    /**
     * Switcher truth table: Codestar writes '1', a Codestar reset writes PHP true.
     */
    public static function isOn($value): bool
    {
        return in_array($value, ['1', 1, true, 'true', 'yes'], true);
    }

    /**
     * @return array<string, mixed>
     */
    public static function settings(): array
    {
        if (self::$settingsCache === null) {
            $settings = get_option(self::OPTION, []);
            self::$settingsCache = is_array($settings) ? $settings : [];
        }

        return self::$settingsCache;
    }

    /**
     * Called by the Dokan module once it boots; without it the vendor restrictions stay off.
     */
    public static function markModuleActive(): void
    {
        self::$moduleActive = true;
    }

    public static function moduleEnabled(): bool
    {
        if (!self::$moduleActive) {
            return false;
        }

        $settings = self::settings();

        return isset($settings['enabled']) && $settings['enabled'] === '1' && function_exists('dokan');
    }

    public static function resetCache(): void
    {
        self::$vendorCache = [];
        self::$settingsCache = null;
    }
}
