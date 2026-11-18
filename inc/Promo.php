<?php

namespace BP3D;

if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( ! class_exists( __NAMESPACE__ . '\Promo' ) ) {

    class Promo {
        const DISMISSED_KEY   = 'bp3d_promo_banner_dismissed_permanent_2026';
        const EXPIRATION_DATE = '2026-12-05 23:59:59';

        /** Target landing URL */
        const COUPON_URL      = 'https://bplugins.com/products/3d-viewer/pricing/?utm_source=admin&utm_medium=dashboard&utm_campaign=bfcm2026';

        public function __construct() {
            add_action( 'admin_notices',                     [ $this, 'render' ] );
            add_action( 'admin_enqueue_scripts',             [ $this, 'enqueue_assets' ] );
            add_action( 'wp_ajax_bp3d_dismiss_promo_banner', [ $this, 'ajax_dismiss' ] );
            add_filter( 'plugin_action_links_3d-viewer/3d-viewer.php', [ $this, 'action_links' ] );
        }

        /* ------------------------------------------------------------------ */
        /*  Screen, Expiration, Dismissal & Pro Helpers                       */
        /* ------------------------------------------------------------------ */

        /**
         * Check if the current admin screen belongs to 3D Viewer or the WP Dashboard.
         *
         * Matches:
         * 1. WP main dashboard (index.php / screen id 'dashboard')
         * 2. CPT list, Add New / Edit screens
         * 3. Submenu pages registered under edit.php?post_type=bp3d-model-viewer
         */
        private function is_plugin_screen(): bool {
            $screen = get_current_screen();

            if ( $screen ) {
                // WordPress main dashboard (http://dev.local/wp-admin/index.php).
                if ( 'dashboard' === $screen->id || 'dashboard' === $screen->base ) {
                    return true;
                }

                // CPT list & editor screens (post_type is set directly).
                if ( ! empty( $screen->post_type ) && 'bp3d-model-viewer' === $screen->post_type ) {
                    return true;
                }

                // Submenu pages: screen id is like "bp3d-model-viewer_page_3d-viewer".
                if ( ! empty( $screen->id ) && false !== strpos( $screen->id, 'bp3d-model-viewer' ) ) {
                    return true;
                }

                // parent_file is "edit.php?post_type=bp3d-model-viewer" for all submenu pages.
                if ( ! empty( $screen->parent_file ) && false !== strpos( $screen->parent_file, 'bp3d-model-viewer' ) ) {
                    return true;
                }
            }
            
            // Fallback: direct URL query parameter.
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen check.
            if ( isset( $_GET['post_type'] ) && 'bp3d-model-viewer' === sanitize_key( wp_unslash( $_GET['post_type'] ) ) ) {
                return true;
            }

            return false;
        }

        /**
         * Check if current date is past December 5, 2026
         */
        private function is_expired(): bool {
            $expiry_timestamp = strtotime( self::EXPIRATION_DATE );
            $current_time     = time();
            return ( $current_time > $expiry_timestamp );
        }

        /**
         * Check if current user has permanently dismissed the banner
         */
        private function is_dismissed(): bool {
            return (bool) get_user_meta( get_current_user_id(), self::DISMISSED_KEY, true );
        }

        /**
         * Determine if the banner should be omitted
         */
        private function should_skip(): bool {
            // 0. Admins only; other roles can't buy the upgrade.
            if ( ! current_user_can( 'manage_options' ) ) {
                return true;
            }

            // 1. Only show inside 3D Viewer admin menu / screens
            if ( ! $this->is_plugin_screen() ) {
                return true;
            }
            
            // 2. Automatically remove after Dec 5, 2026
            if ( $this->is_expired() ) {
                return true;
            }
            
            // 3. Never display again once dismissed by the user
            if ( $this->is_dismissed() ) {
                return true;
            }
            
            // 4. Hide for Pro / Premium users
            if ( bp3d_fs()->can_use_premium_code() ) {
                return true;
            }

            return false;
        }

        /* ------------------------------------------------------------------ */
        /*  Plugin Action Links (Plugins Page)                                */
        /* ------------------------------------------------------------------ */

        /**
         * Add a promo action link on the Plugins list table.
         *
         * @param  array $links Existing action links.
         * @return array
         */
        public function action_links( array $links ): array {
            // Only show during the promo window and for free users.
            if ( ! current_user_can( 'manage_options' ) || $this->is_expired() || bp3d_fs()->can_use_premium_code() ) {
                return $links;
            }

            $links['bp3d_bfcm'] = sprintf(
                '<a href="%s" target="_blank" rel="noopener noreferrer" style="color:#d63638;font-weight:700;">%s</a>',
                esc_url( self::COUPON_URL ),
                esc_html__( 'Upgrade to Pro & Save 45% This Black Friday!', '3d-viewer' )
            );

            return $links;
        }

        /* ------------------------------------------------------------------ */
        /*  Assets: inline CSS + dismiss script                               */
        /* ------------------------------------------------------------------ */

        public function enqueue_assets(): void {
            if ( $this->should_skip() ) { return; }

            wp_register_style( 'bp3d-promo-banner', false, [], BP3D_VERSION );
            wp_enqueue_style( 'bp3d-promo-banner' );
            wp_add_inline_style( 'bp3d-promo-banner', $this->styles() );

            wp_register_script( 'bp3d-promo-banner', false, [], BP3D_VERSION, true );
            wp_enqueue_script( 'bp3d-promo-banner' );
            wp_add_inline_script( 'bp3d-promo-banner', $this->script() );
        }

        private function styles(): string {
            return <<<'CSS'
            #bp3d-promo-banner,
            #bp3d-promo-banner *,
            #bp3d-promo-banner *::before,
            #bp3d-promo-banner *::after {
                box-sizing: border-box;
            }

            #bp3d-promo-banner {
                --bp3d-primary:       #1863dc;
                --bp3d-primary-hover: #1251b8;

                background: #ffffff !important;
                border: 1px solid #dcdcde !important;
                border-radius: 6px !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
                display: flex !important;
                align-items: stretch !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 15px 0 !important;
                padding: 0 !important;
                position: relative !important;
                overflow: hidden !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                animation: bp3dBannerSlide .3s ease both;
            }
            @keyframes bp3dBannerSlide {
                from { opacity: 0; transform: translateY(-4px); }
                to   { opacity: 1; transform: translateY(0); }
            }

            /* Left Brand Block */
            #bp3d-promo-banner .bp3d-brand-block {
                width: 110px;
                min-width: 110px;
                background: linear-gradient(160deg, #F5F8FF 0%, #E8F0FE 100%);
                color: #0F1B3D;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 14px 10px !important;
                gap: 8px !important;
                flex-shrink: 0 !important;
            }

            #bp3d-promo-banner .bp3d-logo-icon-wrap {
                width: 48px;
                height: 48px;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 8px;
            }

            #bp3d-promo-banner .bp3d-logo-icon-wrap img {
                width: 44px;
                height: 44px;
                object-fit: contain;
                display: block;
                filter: drop-shadow(0 8px 20px rgba(40, 100, 220, 0.25));
            }

            #bp3d-promo-banner .bp3d-brand-text {
                font-size: 10px !important;
                font-weight: 800 !important;
                letter-spacing: 0.6px !important;
                text-transform: uppercase !important;
                color: #0F1B3D !important;
                text-align: center !important;
                line-height: 1.2 !important;
                margin: 0 !important;
            }

            /* Main Zone (Content + Button) */
            #bp3d-promo-banner .bp3d-content-zone {
                flex: 1 1 auto;
                min-width: 0;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 14px 44px 14px 20px !important;
                gap: 20px !important;
            }

            /* Text Zone */
            #bp3d-promo-banner .bp3d-text-stack {
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
                min-width: 0;
                text-align: left !important;
                align-items: start !important;
            }

            #bp3d-promo-banner .bp3d-headline {
                display: block !important;
            }

            #bp3d-promo-banner .bp3d-headline span {
                font-weight: bold;
                font-size: 17px;
            }

            #bp3d-promo-banner .bp3d-discount-chip {
                background: #ffebd8 !important;
                color: #e65100 !important;
               
                padding: 2px 8px !important;
                border-radius: 10px !important;
            }

            #bp3d-promo-banner .bp3d-headline p {
                font-size: 12px !important;
                color: #555d66 !important;
                margin: 4px 0 0 !important;
                line-height: 1.45 !important;
            }

            /* Features Checkmarks */
            #bp3d-promo-banner .bp3d-feature-chips {
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 14px !important;
                margin-top: 2px !important;
                font-size: 11.5px !important;
                color: #4a5568 !important;
            }

            #bp3d-promo-banner .bp3d-feature-chips span {
                display: inline-flex !important;
                align-items: center !important;
                gap: 5px !important;
                white-space: nowrap !important;
            }

            #bp3d-promo-banner .check-icon {
                font-size: 11px;
                font-weight: bold;
                color: green;
            }

            /* CTA Action Button */
            #bp3d-promo-banner .bp3d-btn-unlock {
                background: var(--bp3d-primary) !important;
                color: #ffffff !important;
                padding: 10px 20px !important;
                border-radius: 5px !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                text-decoration: none !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                box-shadow: 0 2px 4px rgba(24, 99, 220, 0.25) !important;
                transition: background-color .15s ease, transform .15s ease !important;
            }

            #bp3d-promo-banner .bp3d-btn-unlock:hover {
                background: var(--bp3d-primary-hover) !important;
                color: #ffffff !important;
                transform: translateY(-1px);
            }

            /* Close Button (×) */
            #bp3d-promo-banner .bp3d-banner-close-btn {
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;
                background: transparent !important;
                border: none !important;
                color: #8c8f94 !important;
                cursor: pointer !important;
                padding: 4px !important;
                width: 24px !important;
                height: 24px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 18px !important;
                line-height: 1 !important;
                border-radius: 4px !important;
                transition: color .15s ease, background-color .15s ease !important;
                z-index: 10 !important;
            }

            #bp3d-promo-banner .bp3d-banner-close-btn:hover {
                color: #1d2327 !important;
                background: rgba(0, 0, 0, 0.05) !important;
            }

            /* Responsive */
            @media (max-width: 960px) {
                #bp3d-promo-banner .bp3d-brand-block {
                    width: 95px;
                    min-width: 95px;
                }
            }
            @media (max-width: 782px) {
                #bp3d-promo-banner {
                    flex-direction: column !important;
                }
                #bp3d-promo-banner .bp3d-brand-block {
                    width: 100% !important;
                    flex-direction: row !important;
                    justify-content: flex-start !important;
                    padding: 8px 16px !important;
                }
                #bp3d-promo-banner .bp3d-content-zone {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    padding: 14px 16px !important;
                }
            }
            CSS;
        }

        /** Permanent dismiss: fade out, then save via AJAX. */
        private function script(): string {
            $config = wp_json_encode(
                [
                    'ajaxUrl' => admin_url( 'admin-ajax.php' ),
                    'nonce'   => wp_create_nonce( 'bp3d_dismiss_promo' ),
                ]
            );

            return 'var bp3dPromo = ' . $config . ';' . <<<'JS'
            (function () {
                var btn = document.getElementById('bp3d-banner-close');
                if (!btn) return;
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    var banner = document.getElementById('bp3d-promo-banner');
                    if (banner) {
                        banner.style.transition = 'opacity .25s ease, transform .25s ease';
                        banner.style.opacity    = '0';
                        banner.style.transform  = 'translateY(-6px)';
                        setTimeout(function() { banner.remove(); }, 260);
                    }
                    var fd = new FormData();
                    fd.append('action', 'bp3d_dismiss_promo_banner');
                    fd.append('nonce',  bp3dPromo.nonce);
                    fetch(bp3dPromo.ajaxUrl, {
                        method: 'POST',
                        credentials: 'same-origin',
                        body: fd
                    });
                });
            })();
            JS;
        }

        /* ------------------------------------------------------------------ */
        /*  Render Single Banner                                              */
        /* ------------------------------------------------------------------ */

        public function render(): void {
            if ( $this->should_skip() ) { return; }

            $icon_url = BP3D_DIR . 'admin/images/logo.svg';
            $chip     = '<span class="bp3d-discount-chip">' . esc_html__( 'FLAT 45% OFF!', '3d-viewer' ) . '</span>';
            ?>
            <div id="bp3d-promo-banner" class="notice">

                <!-- Left Brand Block -->
                <div class="bp3d-brand-block">
                    <div class="bp3d-logo-icon-wrap">
                        <img src="<?php echo esc_url( $icon_url ); ?>" alt="3D Viewer" />
                    </div>
                    <span class="bp3d-brand-text">3D Viewer</span>
                </div>

                <!-- Main Content Zone -->
                <div class="bp3d-content-zone">
                    <div class="bp3d-text-stack">
                        <div class="bp3d-headline">
                            <span class="title"><?php
                                /* translators: %s: discount badge, e.g. "FLAT 45% OFF!" */
                                echo wp_kses( sprintf( __( '3D Viewer\'s Biggest Black Friday Sale is Live – %s', '3d-viewer' ), $chip ), [ 'span' => [ 'class' => [] ] ] );
                            ?></span>
                            <br />
                            <p><?php esc_html_e( 'The biggest deal of the year just arrived early! This is your once-a-year opportunity to upgrade to 3D Viewer Premium at an exclusive price.', '3d-viewer' ); ?></p>
                        </div>
                        <div class="bp3d-feature-chips">
                            <span><strong class="check-icon">✓</strong> <?php esc_html_e( 'Hotspots & Annotations', '3d-viewer' ); ?></span>
                            <span><strong class="check-icon">✓</strong> <?php esc_html_e( 'Real-Time 3D Product Configuration', '3d-viewer' ); ?></span>
                            <span><strong class="check-icon">✓</strong> <?php esc_html_e( 'WooCommerce 3D Gallery', '3d-viewer' ); ?></span>
                            <span><strong class="check-icon">✓</strong> <?php esc_html_e( 'More 3D Formats', '3d-viewer' ); ?></span>
                            <span><strong class="check-icon">✓</strong> <?php esc_html_e( 'AR on Product Pages', '3d-viewer' ); ?></span>
                        </div>
                    </div>

                    <!-- Right CTA Button -->
                    <a href="<?php echo esc_url( self::COUPON_URL ); ?>" target="_blank" rel="noopener noreferrer" class="bp3d-btn-unlock">
                        <?php esc_html_e( 'Unlock PRO Features →', '3d-viewer' ); ?>
                    </a>
                </div>

                <!-- Dismiss Button (×) -->
                <button type="button" id="bp3d-banner-close" class="bp3d-banner-close-btn" title="<?php esc_attr_e( 'Dismiss', '3d-viewer' ); ?>" aria-label="<?php esc_attr_e( 'Dismiss', '3d-viewer' ); ?>">
                    &times;
                </button>

            </div>
            <?php
        }

        /* ------------------------------------------------------------------ */
        /*  AJAX Handler: Permanent Dismissal                                 */
        /* ------------------------------------------------------------------ */

        public function ajax_dismiss(): void {
            check_ajax_referer( 'bp3d_dismiss_promo', 'nonce' );
            update_user_meta( get_current_user_id(), self::DISMISSED_KEY, 1 );
            wp_send_json_success();
        }
    }
}
