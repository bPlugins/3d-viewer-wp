<?php
/**
 * Catalog Definition
 *
 * Defines the extensions and modules available for the 3D Viewer plugin.
 */

defined('ABSPATH') || exit;

return array(
	// Schema version (must be 1)
	'schema' => 1,
	// The host plugin slug
	'host' => '3d-viewer',
	// Available extensions (add-ons)
	'extensions' => array(
		array(
			'id' => 'wc-3d-model-viewer-pro',
			'name' => '3D Product Configurator for WooCommerce',
			'version' => '1.0.0',
			'is_paid' => true,
			// No longer sold on its own: it comes with 3D Viewer Pro, so the host's license unlocks it.
			'premium_host_only' => true,
			'price_label' => '', // Optional pricing label shown in UI
			'plugin_file' => 'wc-3d-model-viewer-pro/wc-3d-model-viewer.php',
			'download_url' => '',
			'homepage_url' => 'https://bplugins.com/products/woocommerce-3d-model-viewer',
			// Optional display metadata
			'icon_url' => BP3D_DIR .'public/images/logo/wc-3d-model-viewer.png',
			'short_description' => 'Customize a 3D model per WooCommerce product variation.',
			'author' => 'bPlugins',
			'author_url' => 'https://bplugins.com',
			// Checkout sells 3D Viewer Premium (Pro plan), not the retired standalone WC3D product.
			'freemius' => array(
				'plugin_id' => '8795',
				'public_key' => 'pk_5e6ce3f226c86e3b975b59ed84d6a',
				'plan_id' => '14970',
			)
		)
	)
);
