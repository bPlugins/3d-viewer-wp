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
			'name' => 'WC 3D Model Viewer',
			'version' => '1.0.0',
			'is_paid' => true,
			'price_label' => '', // Optional pricing label shown in UI
			'plugin_file' => 'wc-3d-model-viewer-pro/wc-3d-model-viewer.php',
			'download_url' => '',
			'homepage_url' => 'https://bplugins.com/products/woocommerce-3d-model-viewer',
			// Optional display metadata
			'icon_url' => BP3D_DIR .'public/images/logo/wc-3d-model-viewer.png',
			'short_description' => 'Customize a 3D model per WooCommerce product variation.',
			'author' => 'bPlugins',
			'author_url' => 'https://bplugins.com',
			// Freemius licensing metadata
			'freemius' => array(
				'plugin_id' => '32278',
				'public_key' => 'pk_ced5ae81eb645472719e68fb6f2ea',
				'plan_id' => '52954',
				'pricing_id' => 69663,
			)
		)
	)
);
