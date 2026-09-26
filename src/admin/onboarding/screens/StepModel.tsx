import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import Stepper from '../components/Stepper';
import Highlights from '../components/Highlights';
import { ArrowRightIcon, PlayIcon } from '../components/icons';
import VideoModal, { youtubeEmbedUrl } from '../components/VideoModal';
import { asset, config } from '../lib/config';

interface StepModelProps {
    onNext: () => void;
}

const StepModel: React.FC<StepModelProps> = ({ onNext }) => {
    const { userName, urls } = config();
    const embedUrl = youtubeEmbedUrl(urls.tutorial);
    const [videoOpen, setVideoOpen] = useState(false);

    // A JSX comment would be stripped before `wp i18n make-pot` scans the bundle,
    // so the translators note has to sit next to the call as a real comment.
    const greeting = sprintf(
        /* translators: %s: the display name of the logged-in user. */
        __('Hello %s 👋', '3d-viewer'),
        userName
    );

    return (
        <>
            <Stepper current={1} />

            <p className="bp3d-ob-eyebrow">{greeting}</p>
            <h2 className="bp3d-ob-title">{__('Welcome to 3D Viewer', '3d-viewer')}</h2>
            <p className="bp3d-ob-lede bp3d-ob-lede--narrow">
                {__(
                    "Bring your products to life with interactive 3D models. Let's set up your first model and get started in just a few steps.",
                    '3d-viewer'
                )}
            </p>

            <figure className="bp3d-ob-hero">
                <img
                    src={asset('admin/images/onboarding/onboarding-image.webp')}
                    alt={__(
                        'A 3D model of a lounge chair with rotate, zoom, pan and AR view controls',
                        '3d-viewer'
                    )}
                />
            </figure>

            <Highlights />

            <hr className="bp3d-ob-divider" style={{ marginTop: 29 }} />

            <div className="bp3d-ob-footer">
                <a
                    className="bp3d-ob-help"
                    href={urls.tutorial}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => {
                        // Modifier/middle clicks still open YouTube in a new tab.
                        if (!embedUrl || e.metaKey || e.ctrlKey || e.shiftKey) return;
                        e.preventDefault();
                        setVideoOpen(true);
                    }}
                >
                    <span className="bp3d-ob-help__play">
                        <PlayIcon />
                    </span>
                    <span>
                        <span className="bp3d-ob-help__title">{__('Need help?', '3d-viewer')}</span>
                        <span className="bp3d-ob-help__sub">
                            {__('Watch the 2-minute tutorial', '3d-viewer')}
                        </span>
                    </span>
                </a>

                <button type="button" className="bp3d-ob-btn bp3d-ob-btn--primary" onClick={onNext}>
                    {__("Let's Get Started", '3d-viewer')}
                    <ArrowRightIcon />
                </button>
            </div>

            {videoOpen && embedUrl && (
                <VideoModal embedUrl={embedUrl} onClose={() => setVideoOpen(false)} />
            )}
        </>
    );
};

export default StepModel;
