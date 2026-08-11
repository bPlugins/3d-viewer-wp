<?php

namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Dismissible notice pointing existing installs at the guided setup.
 *
 * The activation redirect only reaches new installs. Sites that already had the
 * plugin when the wizard shipped would otherwise never learn it exists.
 *
 * Dismissal is stored per user.
 */
class OnboardingNotice
{
    /** User meta key that records the dismissal for the current user. */
    const DISMISS_META_KEY = 'bp3d_dismissed_onboarding_notice';

    /** AJAX action used to persist the dismissal. */
    const DISMISS_ACTION = 'bp3d_dismiss_onboarding_notice';

    public function register(): void
    {
        if (!Onboarding::is_available()) {
            return;
        }

        add_action('admin_notices', [$this, 'render']);
        add_action('wp_ajax_' . self::DISMISS_ACTION, [$this, 'dismiss']);
    }

    /**
     * Show the notice to admins who have not run — or dismissed — the wizard.
     *
     * Someone who opened the wizard and walked out has answered the question
     * this notice asks, so `is_seen()` rather than `is_completed()`: the
     * dashboard keeps a quieter "Guided Setup · 40%" entry for them.
     */
    public function render(): void
    {
        if (!Onboarding::is_available()) {
            return;
        }

        if (!current_user_can(Onboarding::CAPABILITY)) {
            return;
        }

        if (Onboarding::is_seen()) {
            return;
        }

        if (!method_exists('BP3DAdmin', 'setupUrl')) {
            return;
        }

        if (get_user_meta(get_current_user_id(), self::DISMISS_META_KEY, true)) {
            return;
        }

        // The wizard is its own full-screen page; showing the notice on top of
        // it would be noise.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen check, no state change.
        if (isset($_GET['page']) && \BP3DAdmin::SETUP_SLUG === sanitize_key(wp_unslash($_GET['page']))) {
            return;
        }

        printf(
            '<div class="notice notice-info is-dismissible" data-bp3d-notice="%1$s" data-bp3d-nonce="%2$s"><p>%3$s</p><p><a class="button button-primary" href="%4$s">%5$s</a></p></div>',
            esc_attr(self::DISMISS_ACTION),
            esc_attr(wp_create_nonce(self::DISMISS_ACTION)),
            esc_html__('New to 3D Viewer? Take the 1-minute guided setup — it walks you through the file formats you can upload, your viewer defaults, and adding your first 3D model.', '3d-viewer'),
            esc_url(\BP3DAdmin::setupUrl()),
            esc_html__('Start Guided Setup', '3d-viewer')
        );

        $this->print_dismiss_script();
    }

    /**
     * Persist the dismissal when the user clicks the notice's close button.
     */
    public function dismiss(): void
    {
        check_ajax_referer(self::DISMISS_ACTION, 'nonce');

        if (!current_user_can(Onboarding::CAPABILITY)) {
            wp_send_json_error(null, 403);
        }

        update_user_meta(get_current_user_id(), self::DISMISS_META_KEY, 1);
        wp_send_json_success();
    }

    /**
     * Inline script that catches the core "X" dismiss click and reports it
     * back so the notice does not return on the next page load.
     */
    private function print_dismiss_script(): void
    {
        ?>
        <script>
            (function () {
                var notice = document.querySelector('[data-bp3d-notice="<?php echo esc_js(self::DISMISS_ACTION); ?>"]');
                if (!notice) {
                    return;
                }
                notice.addEventListener('click', function (event) {
                    if (!event.target.closest('.notice-dismiss')) {
                        return;
                    }
                    var data = new FormData();
                    data.append('action', notice.getAttribute('data-bp3d-notice'));
                    data.append('nonce', notice.getAttribute('data-bp3d-nonce'));
                    fetch(window.ajaxurl, { method: 'POST', body: data, credentials: 'same-origin', keepalive: true });
                });
            })();
        </script>
        <?php
    }
}
