import { __ } from '@wordpress/i18n';

/**
 * The legacy-material warning, free variant of Pro's file: free has no converter, so it points to the
 * troubleshooting page and to re-exporting the model. Called lazily, once wp-i18n has its translations.
 */
export const specGlossMessages = () => ({
    title: __('This model renders white.', '3d-viewer'),
    body: __('It uses the legacy Specular-Glossiness material format, which the 3D viewer no longer supports.', '3d-viewer'),
    reExport: __('Re-export it as GLB from Blender or another 3D tool, then choose the new file with the Model URL control.', '3d-viewer'),
    howToFix: __('How to fix →', '3d-viewer'),
});
