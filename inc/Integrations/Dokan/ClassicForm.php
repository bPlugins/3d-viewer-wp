<?php

namespace BP3D\Integrations\Dokan;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * "3D Model" section in Dokan's classic (legacy) product editor.
 *
 * Markup uses Dokan's own classes; pickers bind only to bp3d-* classes so Dokan's
 * delegated handlers never fire on them. The client posts attachment IDs or 'keep'.
 */
class ClassicForm
{
    protected Dokan $module;

    public function __construct(Dokan $module)
    {
        $this->module = $module;
    }

    public function register(): void
    {
        add_action('dokan_product_edit_after_inventory_variants', [$this, 'render'], 50, 2);
        add_action('dokan_process_product_meta', [$this, 'save'], 20, 1);
    }

    /**
     * @param mixed $post
     * @param mixed $post_id
     */
    public function render($post = null, $post_id = 0): void
    {
        $post_id = (int) $post_id;

        if ($post_id <= 0 || get_post_type($post_id) !== 'product' || !$this->module->policy()->currentUserMayAuthor()) {
            return;
        }

        try {
            $state = $this->module->model()->prepare($post_id, get_post_status($post_id) === 'auto-draft');
        } catch (\Throwable $e) {
            Dokan::debugLog('classic render failed for product ' . $post_id . ': ' . $e->getMessage());

            return;
        }

        $allowed = (array) $state['allowedFields'];
        ?>
        <div class="dokan-edit-row dokan-clearfix bp3d-dokan" data-bp3d-dokan>
            <div class="dokan-section-heading" data-togglehandler="bp3d_dokan">
                <h2><i class="fas fa-cube" aria-hidden="true"></i> <?php esc_html_e('3D Model', '3d-viewer'); ?></h2>
                <p><?php esc_html_e('Show an interactive 3D model on the product page.', '3d-viewer'); ?></p>
                <a href="#" class="dokan-section-toggle"><i class="fas fa-sort-down fa-flip-vertical" aria-hidden="true"></i></a>
                <div class="dokan-clearfix"></div>
            </div>
            <div class="dokan-section-content">
                <?php if ($state['notice'] !== '') : ?>
                    <div class="dokan-alert dokan-alert-info bp3d-dokan-notice"><?php echo esc_html($state['notice']); ?></div>
                <?php else : ?>
                    <input type="hidden" name="bp3d_dokan[v]" value="1">
                    <?php
                    wp_nonce_field('bp3d_dokan_vendor_' . $post_id, 'bp3d_dokan_nonce', false);

                    foreach ($this->fileFields() as $field => $spec) {
                        if (in_array($field, $allowed, true)) {
                            $this->renderFileField($field, $spec, (array) $state[$field], $state);
                        }
                    }

                    if (in_array('ar', $allowed, true)) {
                        ?>
                        <div class="dokan-form-group">
                            <label>
                                <input type="hidden" name="bp3d_dokan[enable_ar]" value="">
                                <input type="checkbox" name="bp3d_dokan[enable_ar]" value="1"<?php checked(!empty($state['enable_ar'])); ?>>
                                <?php esc_html_e('Enable AR (view in your space)', '3d-viewer'); ?>
                            </label>
                        </div>
                        <?php
                    }

                    if (in_array('position', $allowed, true)) {
                        $this->renderPosition($state);
                    }

                    if (in_array('background', $allowed, true)) {
                        $this->renderBackground($state);
                    }
                    ?>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }

    /**
     * @param mixed $post_id
     */
    public function save($post_id): void
    {
        $post_id = (int) $post_id;

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- Verified right below.
        if ($post_id <= 0 || !isset($_POST['bp3d_dokan'], $_POST['bp3d_dokan_nonce'])) {
            return;
        }

        $nonce = sanitize_text_field(wp_unslash($_POST['bp3d_dokan_nonce']));
        if (!wp_verify_nonce($nonce, 'bp3d_dokan_vendor_' . $post_id)) {
            return;
        }

        // Sanitised field by field in VendorModel::normalizeEnvelope().
        $raw = wp_unslash($_POST['bp3d_dokan']); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
        // phpcs:enable WordPress.Security.NonceVerification.Missing

        if (!is_array($raw) || !$this->module->policy()->currentUserMayAuthor()) {
            return;
        }

        try {
            $has_position = isset($raw['viewer_position']) && is_string($raw['viewer_position']);
            $has_bg = isset($raw['bg_color']) && is_string($raw['bg_color']);
            $shown = $has_position || $has_bg ? $this->module->model()->prepare($post_id, false) : [];

            // The select always posts; an untouched value means 'keep', as in the React editor.
            if ($has_position && $raw['viewer_position'] === $shown['position']) {
                $raw['viewer_position'] = 'keep';
            }

            // Same for the color input, which always posts; the checkbox wins over it.
            if ($has_bg) {
                $posted = !empty($raw['bg_transparent']) ? 'transparent' : strtolower($raw['bg_color']);
                $raw['bg_color'] = $posted === $shown['bg_color'] ? 'keep' : $posted;
            }

            $result = $this->module->model()->save($post_id, $raw, $this->module->policy()->currentVendorId());
        } catch (\Throwable $e) {
            Dokan::debugLog('classic save failed for product ' . $post_id . ': ' . $e->getMessage());

            return;
        }

        if (is_wp_error($result)) {
            global $woocommerce_errors;
            if (!is_array($woocommerce_errors)) {
                $woocommerce_errors = [];
            }
            // Dokan's error template appends its own period.
            $woocommerce_errors[] = rtrim($result->get_error_message(), '.');
        }
    }

    /**
     * @return array<string, array<string, string>>
     */
    protected function fileFields(): array
    {
        return [
            'model' => [
                'ext' => 'glb',
                'kind' => 'model',
                'label' => __('3D model (GLB)', '3d-viewer'),
                'button' => __('Upload / select GLB', '3d-viewer'),
                'help' => __('A .glb file. It is shown in an interactive viewer on the product page.', '3d-viewer'),
                'size' => '1',
            ],
            'poster' => [
                'ext' => implode(',', VendorPolicy::POSTER_EXTENSIONS),
                'kind' => 'image',
                'label' => __('Poster image', '3d-viewer'),
                'button' => __('Upload / select image', '3d-viewer'),
                'help' => __('Shown while the 3D model loads.', '3d-viewer'),
                'size' => '',
            ],
            'usdz' => [
                'ext' => 'usdz',
                'kind' => 'model',
                'label' => __('USDZ model (iOS AR)', '3d-viewer'),
                'button' => __('Upload / select USDZ', '3d-viewer'),
                'help' => __('Optional. Used for AR on iPhone and iPad.', '3d-viewer'),
                'size' => '1',
            ],
        ];
    }

    /**
     * @param array<string, string> $spec
     * @param array<string, mixed> $file
     * @param array<string, mixed> $state
     */
    protected function renderFileField(string $field, array $spec, array $file, array $state): void
    {
        $url = isset($file['url']) && is_string($file['url']) ? $file['url'] : '';
        $name = isset($file['name']) && is_string($file['name']) ? $file['name'] : '';
        $poster_url = isset($state['poster']['url']) && is_string($state['poster']['url']) ? $state['poster']['url'] : '';
        ?>
        <div class="dokan-form-group bp3d-dokan-field" data-bp3d-field="<?php echo esc_attr($field); ?>" data-bp3d-ext="<?php echo esc_attr($spec['ext']); ?>" data-bp3d-kind="<?php echo esc_attr($spec['kind']); ?>">
            <label class="form-label">
                <?php echo esc_html($spec['label']); ?>
                <?php if ($spec['size'] !== '') : ?>
                    <span><?php
                    /* translators: %s: maximum file size in MB. */
                    echo esc_html(sprintf(__('(max %s MB)', '3d-viewer'), $this->module->policy()->maxMegabytes()));
                    ?></span>
                <?php endif; ?>
            </label>
            <div class="bp3d-dokan-picker<?php echo $url !== '' ? ' has-value' : ''; ?>">
                <input type="hidden" name="bp3d_dokan[<?php echo esc_attr($field); ?>_id]" value="keep" class="bp3d-dokan-input">
                <div class="bp3d-dokan-picker__empty">
                    <i class="fas fa-cloud-upload-alt" aria-hidden="true"></i>
                    <a href="#" class="dokan-btn dokan-btn-default dokan-btn-sm bp3d-dokan-pick"><?php echo esc_html($spec['button']); ?></a>
                </div>
                <div class="bp3d-dokan-picker__value">
                    <?php if ($field === 'poster') : ?>
                        <img class="bp3d-dokan-picker__thumb" alt=""<?php echo $url !== '' ? ' src="' . esc_url($url) . '"' : ''; ?>>
                    <?php endif; ?>
                    <span class="bp3d-dokan-picker__name"><?php echo esc_html($name); ?></span>
                    <a href="#" class="bp3d-dokan-replace" aria-label="<?php
                    /* translators: %s: file field label, e.g. "Poster image". */
                    echo esc_attr(sprintf(__('Replace %s', '3d-viewer'), $spec['label']));
                    ?>"><?php esc_html_e('Replace', '3d-viewer'); ?></a>
                    <a href="#" class="bp3d-dokan-remove" aria-label="<?php
                    /* translators: %s: file field label, e.g. "Poster image". */
                    echo esc_attr(sprintf(__('Remove %s', '3d-viewer'), $spec['label']));
                    ?>">&times;</a>
                </div>
            </div>
            <?php if ($field === 'model') : ?>
                <div class="bp3d-dokan-preview" data-src="<?php echo esc_url($url); ?>" data-poster="<?php echo esc_url($poster_url); ?>"></div>
            <?php endif; ?>
            <p class="bp3d-dokan-help"><?php echo esc_html($spec['help']); ?></p>
        </div>
        <?php
    }

    /**
     * @param array<string, mixed> $state
     */
    protected function renderPosition(array $state): void
    {
        $current = is_string($state['position']) ? $state['position'] : '';
        ?>
        <div class="dokan-form-group content-half-part">
            <label class="form-label" for="bp3d_dokan_position"><?php esc_html_e('Viewer position', '3d-viewer'); ?></label>
            <?php if (!empty($state['position_locked'])) : ?>
                <p class="bp3d-dokan-help"><?php esc_html_e('Set by the marketplace admin', '3d-viewer'); ?></p>
                <input type="hidden" name="bp3d_dokan[viewer_position]" value="keep">
            <?php else : ?>
                <select class="dokan-form-control" id="bp3d_dokan_position" name="bp3d_dokan[viewer_position]">
                    <?php foreach ((array) $state['positions'] as $option) : ?>
                        <option value="<?php echo esc_attr($option['value']); ?>"<?php selected($current, $option['value']); ?>><?php echo esc_html($option['label']); ?></option>
                    <?php endforeach; ?>
                </select>
            <?php endif; ?>
        </div>
        <div class="dokan-clearfix"></div>
        <?php
    }

    /**
     * @param array<string, mixed> $state
     */
    protected function renderBackground(array $state): void
    {
        $current = is_string($state['bg_color']) ? $state['bg_color'] : 'transparent';
        $transparent = $current === 'transparent';
        ?>
        <div class="dokan-form-group bp3d-dokan-background">
            <label class="form-label" for="bp3d_dokan_bg"><?php esc_html_e('Background', '3d-viewer'); ?></label>
            <?php if (!empty($state['bg_locked'])) : ?>
                <p class="bp3d-dokan-help"><?php esc_html_e('Set by the marketplace admin', '3d-viewer'); ?></p>
            <?php else : ?>
                <div class="bp3d-dokan-background__controls">
                    <input type="color" id="bp3d_dokan_bg" class="bp3d-dokan-background__color" name="bp3d_dokan[bg_color]" value="<?php echo esc_attr($transparent ? '#ffffff' : $current); ?>">
                    <label>
                        <input type="checkbox" name="bp3d_dokan[bg_transparent]" value="1" class="bp3d-dokan-background__transparent"<?php checked($transparent); ?>>
                        <?php esc_html_e('Transparent', '3d-viewer'); ?>
                    </label>
                </div>
                <p class="bp3d-dokan-help"><?php esc_html_e('Shown behind the 3D model.', '3d-viewer'); ?></p>
            <?php endif; ?>
        </div>
        <?php
    }
}
