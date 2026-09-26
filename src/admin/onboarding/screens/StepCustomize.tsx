import React from 'react';
import { __ } from '@wordpress/i18n';
import Stepper from '../components/Stepper';
import {
    BoxIcon,
    LayoutTemplateIcon,
    CartIcon,
    PhoneIcon,
    GlassesIcon,
    CameraIcon,
    SparklesIcon,
    CheckIcon,
    ArrowRightIcon,
    ChevronLeftIcon,
} from '../components/icons';
import { config, isPremium } from '../lib/config';

type Tone = 'blue' | 'violet' | 'mint' | 'rose' | 'lavender' | 'sky';

interface Feature {
    Icon: React.FC<{ size?: number }>;
    tone: Tone;
    title: string;
    body: string;
    /** Badge shown when the licence is not active. AR is free, so it is not Pro. */
    freeTier: 'included' | 'pro';
    /** Body used when the licence is not active, where the Pro items must be split out. */
    freeBody?: string;
}

const features = (): Feature[] => [
    {
        Icon: BoxIcon,
        tone: 'blue',
        title: __('Wide Format Support', '3d-viewer'),
        body: __('GLB, GLTF, OBJ, STL, FBX, DAE, 3DS, and more — upload the file you already have.', '3d-viewer'),
        freeTier: 'included',
    },
    {
        Icon: LayoutTemplateIcon,
        tone: 'violet',
        title: __('Gutenberg & Elementor', '3d-viewer'),
        body: __('Place a model with a block, the Elementor widget, or a shortcode anywhere.', '3d-viewer'),
        freeTier: 'included',
    },
    {
        Icon: CartIcon,
        tone: 'mint',
        title: __('WooCommerce Viewers', '3d-viewer'),
        body: __('Show a rotatable 3D model above, below, or instead of the product gallery.', '3d-viewer'),
        freeTier: 'included',
    },
    {
        Icon: PhoneIcon,
        tone: 'rose',
        title: __('Responsive & Mobile Ready', '3d-viewer'),
        body: __('Adapts to any screen, with touch controls and a poster image while loading.', '3d-viewer'),
        freeTier: 'included',
    },
    {
        Icon: GlassesIcon,
        tone: 'lavender',
        title: __('Augmented Reality', '3d-viewer'),
        body: __('View models in the room with WebXR, Scene Viewer, and iOS Quick Look.', '3d-viewer'),
        freeTier: 'included',
    },
    {
        Icon: CameraIcon,
        tone: 'sky',
        title: __('Hotspots & Initial View', '3d-viewer'),
        body: __('Annotate parts of the model and choose the exact camera angle it opens on.', '3d-viewer'),
        freeTier: 'pro',
    },
    {
        Icon: SparklesIcon,
        tone: 'mint',
        title: __('And much more', '3d-viewer'),
        body: __('Lighting, shadow and exposure control, axis locking, auto-rotate and fullscreen options.', '3d-viewer'),
        freeBody: __('Axis locking, auto-rotate, custom camera angle and hotspot annotations.', '3d-viewer'),
        freeTier: 'pro',
    },
];

interface StepCustomizeProps {
    onBack: () => void;
    onNext: () => void;
    onExit: () => void;
}

const StepCustomize: React.FC<StepCustomizeProps> = ({ onBack, onNext, onExit }) => {
    const premium = isPremium();
    const { urls } = config();

    return (
        <>
            <Stepper current={2} onExit={onExit} />

            <p className="bp3d-ob-eyebrow bp3d-ob-eyebrow--muted">{__('2nd step', '3d-viewer')}</p>
            <h2 className="bp3d-ob-title">{__("What's included with 3D Viewer?", '3d-viewer')}</h2>
            <p className="bp3d-ob-lede">
                {premium
                    ? __(
                        'Everything you need to create interactive 3D experiences on your WordPress site. Your licence is active, so every feature below is unlocked.',
                        '3d-viewer'
                    )
                    : __(
                        'Everything marked Included works right now on the free version. Pro unlocks the rest whenever you need it.',
                        '3d-viewer'
                    )}
            </p>

            <div className="bp3d-ob-features">
                {features().map(({ Icon, tone, title, body, freeBody, freeTier }) => {
                    const tier = premium ? 'included' : freeTier;
                    const text = premium ? body : freeBody ?? body;

                    return (
                        <article className="bp3d-ob-feature" key={title}>
                            <span className={`bp3d-ob-feature__icon bp3d-ob-feature__icon--${tone}`}>
                                <Icon size={20} />
                            </span>
                            <div>
                                <div className="bp3d-ob-feature__head">
                                    <h4 className="bp3d-ob-feature__title">{title}</h4>
                                    {tier === 'included' && (
                                        // Decorative: the badge below already reads "Included", and
                                        // aria-label on a roleless span is dropped by screen readers.
                                        <span className="bp3d-ob-check" aria-hidden="true">
                                            <CheckIcon />
                                        </span>
                                    )}
                                </div>
                                <p className="bp3d-ob-feature__body">{text}</p>
                                <span className={`bp3d-ob-badge bp3d-ob-badge--${tier}`}>
                                    {tier === 'included' ? __('Included', '3d-viewer') : __('Pro', '3d-viewer')}
                                </span>
                            </div>
                        </article>
                    );
                })}
            </div>

            <hr className="bp3d-ob-divider" style={{ marginTop: 37 }} />

            <div className="bp3d-ob-footer">
                <button type="button" className="bp3d-ob-btn bp3d-ob-btn--ghost" onClick={onBack}>
                    <ChevronLeftIcon />
                    {__('Back', '3d-viewer')}
                </button>

                <div className="bp3d-ob-footer__end">
                    {!premium && (
                        <a className="bp3d-ob-btn bp3d-ob-btn--link" href={urls.upgrade}>
                            {__('Upgrade to Pro', '3d-viewer')}
                        </a>
                    )}
                    <button type="button" className="bp3d-ob-btn bp3d-ob-btn--primary" onClick={onNext}>
                        {__('Next', '3d-viewer')}
                        <ArrowRightIcon />
                    </button>
                </div>
            </div>
        </>
    );
};

export default StepCustomize;
