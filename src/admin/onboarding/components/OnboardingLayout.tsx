import React from 'react';
import { __ } from '@wordpress/i18n';
import { asset } from '../lib/config';

interface OnboardingLayoutProps {
    children: React.ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => (
    <div className="bp3d-ob-page">
        <img
            className="bp3d-ob-blob"
            src={asset('admin/images/onboarding/onboarding-bg.webp')}
            alt=""
            aria-hidden="true"
        />
        <div className="bp3d-ob-shell">
            <div className="bp3d-ob-brand">
                <img
                    className="bp3d-ob-brand__mark"
                    src={asset('admin/images/onboarding/logo-mark.png')}
                    alt=""
                />
                <span className="bp3d-ob-brand__name">{__('3D Viewer', '3d-viewer')}</span>
            </div>
            <section className="bp3d-ob-card">{children}</section>
        </div>
    </div>
);

export default OnboardingLayout;
