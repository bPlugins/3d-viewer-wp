import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

import { gutenbergTabIcon, shortcodeTabIcon, elementorTabIcon } from '../dashboard/utils/data';

const slug = '3d-viewer';

/**
 * Wizard field ids.
 *
 * These live in component state for the duration of the run and are never
 * persisted — the wizard exposes no plugin setting, so walking it cannot change
 * how an existing site behaves. `editor` only decides which set of
 * instructions the last step shows.
 */
export interface OnboardingValues {
    editor: string;
}

type Values = Partial<OnboardingValues>;

/** Copy that reacts to an earlier answer is declared as a function of the live values. */
type Resolvable<T> = T | ((values: Values) => T);

interface OnboardingOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
    condition?: (values: Values) => boolean;
}

interface OnboardingField {
    type: 'choice' | 'color' | 'toggle';
    id: keyof OnboardingValues;
    label: string;
    description?: string;
    default?: string | boolean;
    options?: OnboardingOption[];
    help?: { title: string; body: string | string[]; example?: string };
    condition?: (values: Values) => boolean;
}

interface OnboardingStep {
    key: string;
    title: Resolvable<string>;
    subtitle?: Resolvable<string>;
    bullets?: Resolvable<string[]>;
    features?: { title: string; badge?: string; locked?: boolean; description?: string }[];
    fields?: OnboardingField[];
    tips?: Resolvable<string[]>;
    tipsLabel?: Resolvable<string>;
    nextLabel?: string;
    skipLabel?: string;
    secondaryAction?: { label: string; url: string };
    video?: {
        url: string;
        isYoutube: boolean;
        title: string;
        // The still shown before playback. Named `poster` because that is the
        // key bpl-tools' resolveVideo() reads; anything else is ignored and the
        // step silently falls back to `media.thumbnail`.
        poster?: string;
    }
}

interface StepsArgs {
    adminUrl?: string;
}

/**
 * Per-editor instructions for the final screen.
 *
 * Resolved against the live values, so picking a card immediately rewrites the
 * steps below it — that is what makes the question worth asking rather than
 * storing an answer nothing reads.
 */
const editorGuide = (editor: string = '') => {
    const guides: Record<string, { label: string; steps: string[] }> = {
        gutenberg: {
            label: __('Adding a model with Gutenberg:', '3d-viewer'),
            steps: [
                __('Edit any post or page, then click <strong>+</strong> or type <strong>/3D Model Viewer</strong> to insert the block', '3d-viewer'),
                __('Upload your model file and set size, camera controls, and auto-rotate in the block sidebar', '3d-viewer'),
                __('Preview the model, then publish', '3d-viewer')
            ]
        },
        elementor: {
            label: __('Adding a model with Elementor:', '3d-viewer'),
            steps: [
                __('Edit a page with Elementor and search the widget panel for <strong>Model Viewer</strong>', '3d-viewer'),
                __('Drag the widget onto your layout and upload your model file', '3d-viewer'),
                __('Adjust size, camera controls, and auto-rotate, then publish', '3d-viewer')
            ]
        },
        shortcode: {
            label: __('Adding a model with a shortcode:', '3d-viewer'),
            steps: [
                __('Go to <strong>3D Viewer &rsaquo; Add New</strong>, upload your file, and publish the model', '3d-viewer'),
                __('Copy its <code>[3d_viewer id="…"]</code> shortcode from the edit screen or the models list', '3d-viewer'),
                __('Paste the shortcode into any post, page, or widget', '3d-viewer')
            ]
        }
    };

    return guides[editor] || {
        label: __('Three ways to add a model — pick one above for step-by-step instructions:', '3d-viewer'),
        steps: [
            __('<strong>Gutenberg</strong> — insert the 3D Model Viewer block in any post or page', '3d-viewer'),
            __('<strong>Elementor</strong> — drag the Model Viewer widget into a section', '3d-viewer'),
            __('<strong>Shortcode</strong> — publish a model under 3D Viewer, then paste its shortcode anywhere', '3d-viewer')
        ]
    };
};

/**
 * Guided-setup wizard content.
 *
 * No step writes a plugin setting, so walking, skipping, or abandoning the
 * wizard leaves the site exactly as it was. The free/Pro tour is unconditional
 * because the screen is only registered for free installs.
 *
 * @param args.adminUrl  Admin base URL, without a trailing slash
 */
export const onboardingSteps = ({ adminUrl = '' }: StepsArgs = {}): OnboardingStep[] => {
    const steps: OnboardingStep[] = [
        {
            key: 'welcome',
            title: __('Welcome to 3D Viewer', '3d-viewer'),
            video: {
                url: 'https://youtu.be/Tno8LiebxaI',
                isYoutube: true,
                title: __('3D Viewer — short tutorial', '3d-viewer'),
                poster: `${window.bp3dDashboard?.dir || ''}admin/images/short-tutorial-thumbnail.png`,
            },
            subtitle: __('Let’s get your first 3D model on the page. It takes about a minute, and everything you set here can be changed later.', '3d-viewer'),
            bullets: [
                __('Display GLB, GLTF, OBJ, STL, FBX, DAE, and more — no conversion needed', '3d-viewer'),
                __('Add models with a Gutenberg block, the Elementor widget, or a shortcode', '3d-viewer'),
                __('Let visitors rotate, zoom, and pan the model right in the browser', '3d-viewer'),
                __('Show a 3D model in place of a WooCommerce product image', '3d-viewer')
            ],
            nextLabel: __('Let’s Get Started', '3d-viewer')
        },
        {
            key: 'features',
            title: __('What’s included with 3D Viewer', '3d-viewer'),
            subtitle: __('Everything marked Included works right now on the free version. Pro unlocks the rest whenever you need it.', '3d-viewer'),
            skipLabel: __('Skip', '3d-viewer'),
            secondaryAction: {
                label: __('Upgrade to Pro', '3d-viewer'),
                url: `https://bplugins.com/products/${slug}/pricing/`
            },
            features: [
                {
                    title: __('Wide Format Support', '3d-viewer'),
                    badge: __('Included', '3d-viewer'),
                    description: __('GLB, GLTF, OBJ, STL, FBX, DAE, 3DS, and more — upload the file you already have.', '3d-viewer')
                },
                {
                    title: __('Gutenberg, Elementor & Shortcodes', '3d-viewer'),
                    badge: __('Included', '3d-viewer'),
                    description: __('Place a model with a block, the Elementor widget, or a shortcode anywhere.', '3d-viewer')
                },
                {
                    title: __('WooCommerce Product Viewers', '3d-viewer'),
                    badge: __('Included', '3d-viewer'),
                    description: __('Show a rotatable 3D model above, below, or instead of the product gallery.', '3d-viewer')
                },
                {
                    title: __('Responsive & Mobile Ready', '3d-viewer'),
                    badge: __('Included', '3d-viewer'),
                    description: __('Adapts to any screen, with touch controls and a poster image while loading.', '3d-viewer')
                },
                {
                    title: __('Augmented Reality', '3d-viewer'),
                    badge: __('Pro', '3d-viewer'),
                    locked: true,
                    description: __('View models in the room with WebXR, Scene Viewer, and iOS Quick Look, plus QR access from mobile.', '3d-viewer')
                },
                {
                    title: __('Hotspots & Initial View', '3d-viewer'),
                    badge: __('Pro', '3d-viewer'),
                    locked: true,
                    description: __('Annotate parts of the model and choose the exact camera angle it opens on.', '3d-viewer')
                },
                {
                    title: __('And much more', '3d-viewer'),
                    badge: __('Pro', '3d-viewer'),
                    locked: true,
                    description: __('Lighting, shadow and exposure control, axis locking, auto-rotate and fullscreen options.', '3d-viewer')
                }
            ]
        },
        {
            key: 'editor',
            title: __('Last step — how will you add models?', '3d-viewer'),
            subtitle: __('Pick how you usually build pages and the steps below will match. You can still use any of the other methods later.', '3d-viewer'),
            fields: [
                {
                    type: 'choice',
                    id: 'editor',
                    label: __('Preferred method', '3d-viewer'),
                    options: [
                        {
                            value: 'gutenberg',
                            label: __('Gutenberg', '3d-viewer'),
                            icon: gutenbergTabIcon,
                            description: __('Insert the 3D Model Viewer block in the editor', '3d-viewer')
                        },
                        {
                            value: 'elementor',
                            label: __('Elementor', '3d-viewer'),
                            icon: elementorTabIcon,
                            description: __('Drag the Model Viewer widget into a section', '3d-viewer')
                        },
                        {
                            value: 'shortcode',
                            label: __('Shortcode', '3d-viewer'),
                            icon: shortcodeTabIcon,
                            description: __('Paste [3d_viewer id="…"] into any post or widget', '3d-viewer')
                        }
                    ]
                }
            ],
            tipsLabel: ({ editor }: Values) => editorGuide(editor).label,
            tips: ({ editor }: Values) => [
                ...editorGuide(editor).steps,
                sprintf(
                    /* translators: %s: URL of the Help & Demos page. */
                    __('Visit <a href="%s">3D Viewer &rsaquo; Help & Demos</a> any time for live demos and documentation', '3d-viewer'),
                    `${adminUrl}/edit.php?post_type=bp3d-model-viewer&page=3d-viewer`
                )
            ]
        }
    ];

    return steps;
};
