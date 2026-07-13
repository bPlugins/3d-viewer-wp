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
			'download_url' => 'https://bplugins.com/wp-content/uploads/2026/06/wc-3d-model-viewer-pro.1.0.0.zip',
			'homepage_url' => 'https://bplugins.com/products/woocommerce-3d-model-viewer',
			// Optional display metadata
			'icon_url' => 'https://ps.w.org/3d-viewer/assets/icon-128x128.png',
			'short_description' => 'Customize a 3D model per WooCommerce product variation.',
			'author' => 'bPlugins',
			'author_url' => 'https://bplugins.com',
		),

	),
	'modules' => [
		array(
			'id' => 'pdf-poster',
			'name' => 'PDF Poster',
			'version' => '1.0.0',
			'is_paid' => true,
			'price_label' => '', // Optional pricing label shown in UI
			'plugin_file' => 'pdf-poster/pdf-poster.php',
			'download_url' => '',
			'homepage_url' => 'https://bplugins.com/products/pdf-poster',
			// Optional display metadata
			'icon_url' => 'https://ps.w.org/pdf-poster/assets/icon-128x128.png',
			'short_description' => 'Customize a 3D model per WooCommerce product variation.',
			'author' => 'bPlugins',
			'author_url' => 'https://bplugins.com',
			'freemius' => [
				'plugin_id' => 14261,
				'public_key' => 'pk_6e833032174d131283193892a44a2',
				'plan_id' => 23852,
				'pricing_id' => 28589
			],
		),
	]
);
