<?php
if ( !defined( 'ABSPATH' ) ) { exit; }

$tdvbSrcType		= $attributes['sourceType'] ?? 'upload';
$tdvbModelUrl		= 'upload' === $tdvbSrcType ? ( $attributes['model']['url'] ?? '' ) : ( $attributes['modelLink'] ?? '' );
$tdvbModelTitle		= 'upload' === $tdvbSrcType ? ( $attributes['model']['title'] ?? '' ) : '';
$tdvbIsTouchMove	= $attributes['isTouchMove'] ?? true;
$tdvbIsZoom			= $attributes['isZoom'] ?? true;
$tdvbWidth			= $attributes['width'] ?? '100%';
$tdvbHeight			= $attributes['height'] ?? '350px';

$tdvbWidthStr		= intval( $tdvbWidth ) ? $tdvbWidth : 'auto';
$tdvbHeightStr		= intval( $tdvbHeight ) ? $tdvbHeight : '350px';

$tdvbModelStyles	= sprintf( 'width: %s; height: %s;', esc_attr( $tdvbWidthStr ), esc_attr( $tdvbHeightStr ) );
$tdvbWrapperStyles	= sprintf( 'text-align: %s;', esc_attr( $attributes['alignment'] ?? 'center' ) );

$tdvbWrapperAttributes = get_block_wrapper_attributes( [
	'style' => $tdvbWrapperStyles,
] );
?>
<div <?php echo $tdvbWrapperAttributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class='tdvb3DViewerBlock'>
		<model-viewer
			src='<?php echo esc_url( $tdvbModelUrl ); ?>'
			alt='<?php echo esc_attr( $tdvbModelTitle ); ?>'
			<?php if ( $tdvbIsTouchMove ) echo 'camera-controls'; ?>
			<?php if ( ! $tdvbIsZoom ) echo 'disable-zoom'; ?>
			loading='<?php echo esc_attr( $attributes['loadingType'] ?? 'auto' ); ?>'
			auto-rotate
			style='<?php echo esc_attr( $tdvbModelStyles ); ?>'
		></model-viewer>
	</div>
</div>