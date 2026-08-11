<?php

namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Tracks how far through the guided-setup wizard the user got.
 *
 * The wizard itself ships as a shared bpl-tools component; this class is the
 * plugin-side half of the contract — a plain `wp_ajax_` handler plus the
 * one-time activation redirect.
 *
 * The wizard shows no plugin settings, so nothing it posts is written to
 * `_bp3d_settings_`. Progress is all that is persisted: how far the user got,
 * and whether they reached the end. That leaves the wizard incapable of
 * changing an existing site's behaviour, however it is entered or left.
 *
 * The guided setup is a free-plugin feature, so every entry point is gated on
 * is_available().
 */
class Onboarding
{
    /** AJAX action the wizard posts to. */
    const AJAX_ACTION = 'bp3d_save_onboarding';

    /** Option recording that the wizard was run to the end. */
    const COMPLETED_KEY = 'bp3d_onboarding_completed';

    /** Option recording how far through the wizard the user got, 0-100. */
    const PROGRESS_KEY = 'bp3d_onboarding_progress';

    /** Option recording that the user left the wizard before the last step. */
    const EXITED_KEY = 'bp3d_onboarding_exited';

    /** Option set at activation, consumed by the one-time redirect. */
    const REDIRECT_KEY = 'bp3d_onboarding_redirect';

    /** Capability required to reach the wizard. */
    const CAPABILITY = 'manage_options';

    public function register(): void
    {
        if (!self::is_available()) {
            return;
        }

        add_action('wp_ajax_' . self::AJAX_ACTION, [$this, 'handle']);
        add_action('admin_init', [$this, 'maybe_redirect']);
    }

    /**
     * Whether the guided setup applies to this install.
     *
     * It teaches the basics and points at Pro, so showing it to someone who
     * already bought Pro would be both redundant and an upsell they have
     * already answered.
     */
    public static function is_available(): bool
    {
        return !(function_exists('bp3d_fs') && bp3d_fs()->can_use_premium_code());
    }

    /**
     * AJAX entry point: verify, then record progress.
     */
    public function handle(): void
    {
        check_ajax_referer(self::AJAX_ACTION, 'nonce');

        if (!current_user_can(self::CAPABILITY)) {
            wp_send_json_error('403 Forbidden', 403);
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Verified by check_ajax_referer() above.
        wp_send_json_success($this->save(wp_unslash($_POST)));
    }

    /**
     * Record how far the user got. Nothing else is persisted — the wizard owns
     * no settings, so any other key in the payload is ignored outright.
     *
     * @param  array<string, mixed> $params Unslashed request data.
     * @return array{completed: bool, finished: bool, percent: int}
     */
    public function save($params = []): array
    {
        $completed = isset($params['completed']) && rest_sanitize_boolean($params['completed']);

        // `completed` is sent however the user leaves; `finished` is what says
        // they reached the last step. Without it we cannot tell "walked out at
        // step 2" from "saw the whole thing", and the dashboard's resume entry
        // would disappear for people who most need it. Absent (an older
        // bpl-tools build) means falling back to treating any exit as done.
        $finished = isset($params['finished']) ? rest_sanitize_boolean($params['finished']) : $completed;

        $this->record_progress($params, $completed, $finished);

        if ($finished) {
            $this->complete();
        } elseif ($completed) {
            // Still stop the activation redirect and the notice from dragging
            // them back to a wizard they deliberately left.
            update_option(self::EXITED_KEY, 1);
            delete_option(self::REDIRECT_KEY);
        }

        return [
            'completed' => $completed,
            'finished' => $finished,
            'percent' => self::progress(),
        ];
    }

    /**
     * Remember how far through the wizard the user got.
     *
     * The step count can vary per site, so the wizard posts its own position
     * rather than us assuming a fixed list.
     *
     * A step the user clicked Next on is done; the step they exited from is
     * not. Progress only ever climbs, so walking Back and leaving cannot
     * rewind it.
     *
     * @param array<string, mixed> $params
     */
    private function record_progress(array $params, bool $completed, bool $finished): void
    {
        if ($finished) {
            update_option(self::PROGRESS_KEY, 100);
            return;
        }

        if (!isset($params['stepTotal'], $params['stepIndex'])) {
            return;
        }

        $total = absint($params['stepTotal']);
        $index = absint($params['stepIndex']);

        if ($total < 1) {
            return;
        }

        $done = $completed ? $index : $index + 1;
        $percent = (int) min(100, round($done / $total * 100));

        if ($percent > self::progress()) {
            update_option(self::PROGRESS_KEY, $percent);
        }
    }

    /**
     * Mark the wizard as run to the end. Stores the version so a future
     * release can decide to re-run onboarding after a major change.
     */
    public function complete(): void
    {
        update_option(self::COMPLETED_KEY, (string) BP3D_VERSION);
        update_option(self::PROGRESS_KEY, 100);
        delete_option(self::EXITED_KEY);
        delete_option(self::REDIRECT_KEY);
    }

    /**
     * Whether the user reached the end of the wizard.
     *
     * This is what hides the dashboard's setup entry — an unfinished run keeps
     * it, so there is always a way back in.
     */
    public static function is_completed(): bool
    {
        return (bool) get_option(self::COMPLETED_KEY, '');
    }

    /**
     * Whether the wizard has been seen at all — finished or walked out of.
     *
     * Both mean "stop pushing them towards it", which is what the activation
     * redirect and the admin notice care about.
     */
    public static function is_seen(): bool
    {
        return self::is_completed() || (bool) get_option(self::EXITED_KEY, '');
    }

    /**
     * How far through the wizard the user got, as a percentage.
     */
    public static function progress(): int
    {
        return min(100, max(0, (int) get_option(self::PROGRESS_KEY, 0)));
    }

    /**
     * Wizard state for the dashboard app.
     *
     * @return array{completed: bool, percent: int}
     */
    public static function state(): array
    {
        // Reported as done where the wizard does not apply, so the dashboard's
        // "Guided Setup" entry stays hidden for Pro customers.
        if (!self::is_available()) {
            return ['completed' => true, 'percent' => 100];
        }

        return [
            'completed' => self::is_completed(),
            'percent' => self::progress(),
        ];
    }

    /**
     * Send a freshly activated site to the wizard, once.
     *
     * Gated on an option written by the activation hook rather than on the
     * absence of settings, so it can't fire again after an update.
     */
    public function maybe_redirect(): void
    {
        if (!get_option(self::REDIRECT_KEY)) {
            return;
        }

        if (wp_doing_ajax() || (defined('DOING_CRON') && DOING_CRON)) {
            return;
        }

        // Freemius shows its opt-in screen on activation, and the flag outlives
        // the request, so there is no need to race it — leave the flag alone
        // until the user has answered rather than redirecting over the top of
        // the opt-in.
        if (function_exists('bp3d_fs')) {
            $fs = bp3d_fs();

            if (!$fs->is_registered() && !$fs->is_anonymous()) {
                return;
            }
        }

        delete_option(self::REDIRECT_KEY);

        // Never hijack a bulk activation — WP.org guideline.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only presence check, no state change.
        if (isset($_GET['activate-multi'])) {
            return;
        }

        if (!current_user_can(self::CAPABILITY) || self::is_seen()) {
            return;
        }

        // method_exists rather than class_exists: an older premium build ships
        // its own BP3DAdmin without a setup screen, so the class being present
        // is not on its own proof that there is anywhere to redirect to.
        if (!method_exists('BP3DAdmin', 'setupUrl')) {
            return;
        }

        wp_safe_redirect(\BP3DAdmin::setupUrl());
        exit;
    }
}
