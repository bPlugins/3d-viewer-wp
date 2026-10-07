import { __ } from '@wordpress/i18n';
import { featureKey, featureText, Plan } from './product';

/*
 * The design's cleaned-up wording for each Freemius feature title, plus the one-line
 * detail the comparison table shows. Freemius stays the source of which features
 * exist and which plan has them; a title missing here is shown as Freemius sends it.
 */
const COPY: [string, string][] = [
    [__('Gutenberg Block', '3d-viewer'), __('Add the 3D viewer using Gutenberg block.', '3d-viewer')],
    [__('Supports Popular 3D Formats (GLB, GLTF, OBJ, STL, and more)', '3d-viewer'), __('Works with all major 3D model formats.', '3d-viewer')],
    [__('Support for external model URLs', '3d-viewer'), __('Load models from any external source.', '3d-viewer')],
    [__('Show 3D product on your WooCommerce product pages', '3d-viewer'), __('Display 3D models on product pages.', '3d-viewer')],
    [__('Touch, Pan, Zoom & Rotate controls', '3d-viewer'), __('Interactive 3D viewing controls.', '3d-viewer')],
    [__('Lazy Loading for Performance', '3d-viewer'), __('Load models only when needed.', '3d-viewer')],
    [__('Add a poster image to show while the model is loading (Lite View)', '3d-viewer'), __('Show a preview image before the 3D model loads.', '3d-viewer')],
    [__('Display a progress bar until the 3D file is fully loaded', '3d-viewer'), __('Keep users informed during loading.', '3d-viewer')],
    [__('Display loading progress as a percentage', '3d-viewer'), __('Show exact loading percentage.', '3d-viewer')],
    [__('Enable/Disable moving control', '3d-viewer'), __('Turn on or off model movement.', '3d-viewer')],
    [__('Elementor Widget/Addons', '3d-viewer'), __('Use with Elementor and more add-ons.', '3d-viewer')],
    [__('Show/Hide Fullscreen Button on the Viewer', '3d-viewer'), __('Toggle fullscreen button visibility.', '3d-viewer')],
    [__('Preset to save your preferred viewer configurations', '3d-viewer'), __('Save and reuse your settings.', '3d-viewer')],
    [__('Auto-Rotation to view in 360° without interaction', '3d-viewer'), __('Enable automatic rotation.', '3d-viewer')],
    [__('Full viewer settings on Elementor widget/addons', '3d-viewer'), __('Advanced viewer settings in Elementor.', '3d-viewer')],
    [__('Add multiple 3D models into a single viewer gallery', '3d-viewer'), __('Create galleries with multiple models.', '3d-viewer')],
    [__('Add 3D models for each variant for the WooCommerce product', '3d-viewer'), __('Show different models for each variant.', '3d-viewer')],
    [__('Adjust lighting, shadow intensity, and exposure', '3d-viewer'), __('Control lighting and visual effects.', '3d-viewer')],
    [__('Enable or disable auto-rotate, and autoplay', '3d-viewer'), __('More control over viewer behavior.', '3d-viewer')],
    [__('Set a custom camera angle for the perfect first impression', '3d-viewer'), __('Create the best initial view for your audience.', '3d-viewer')],
    [__('Includes all the premium extensions', '3d-viewer'), ''],
];

// Keyed on the English text so a translated label still finds its Freemius row.
const ENGLISH = [
    'Gutenberg Block', 'Supports Popular 3D Formats (GLB, GLTF, OBJ, STL, and more)', 'Support for external model URLs',
    'Show 3D product on your WooCommerce product pages', 'Touch, Pan, Zoom & Rotate controls', 'Lazy Loading for Performance',
    'Add a poster image to show while the model is loading (Lite View)', 'Display a progress bar until the 3D file is fully loaded',
    'Display loading progress as a percentage', 'Enable/Disable moving control', 'Elementor Widget/Addons',
    'Show/Hide Fullscreen Button on the Viewer', 'Preset to save your preferred viewer configurations',
    'Auto-Rotation to view in 360° without interaction', 'Full viewer settings on Elementor widget/addons',
    'Add multiple 3D models into a single viewer gallery', 'Add 3D models for each variant for the WooCommerce product',
    'Adjust lighting, shadow intensity, and exposure', 'Enable or disable auto-rotate, and autoplay',
    'Set a custom camera angle for the perfect first impression', 'Included All the Premium Extensions',
];

const BY_KEY = new Map(ENGLISH.map((en, i) => [featureKey(en), COPY[i]]));

export interface Feature {
    key: string;
    title: string;
    desc: string;
}

export const planFeatures = (plan?: Plan): Feature[] => (plan?.features || []).map(({ title }) => {
    const key = featureKey(title);
    const copy = BY_KEY.get(key);
    return { key, title: copy ? copy[0] : featureText(title), desc: copy ? copy[1] : '' };
});

/* Plan blurbs with the design's tense fix (P4); anything else shows Freemius' own. */
export const planBlurb = (plan: Plan): string => ({
    pro: __('Includes some awesome premium features.', '3d-viewer'),
    max: __('Includes all the premium extensions.', '3d-viewer'),
} as Record<string, string>)[plan.name] || featureText(plan.description || '');
