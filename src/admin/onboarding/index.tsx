import { __ } from '@wordpress/i18n';

import './style.scss';

// @ts-expect-error -- shared bpl-tools component, plain JS with no type declarations.
import Onboarding from '../../../../bpl-tools/Admin/Onboarding';
import { dashboardInfo } from '../dashboard/utils/data';
import { onboardingSteps } from './steps';

/**
 * The wizard owns no settings, so there are no seeded values to pass — the only
 * thing it persists is how far the user got. The screen is registered for free
 * installs only, so `isPremium` is always false here.
 */
interface OnboardingPageInfo {
    version: string;
    adminUrl?: string;
    dashboardUrl?: string;
    ajaxAction?: string;
    nonce?: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('bp3dOnboarding');

    if (!el) {
        return;
    }

    const info: OnboardingPageInfo = JSON.parse(el.dataset.info || '{}');
    const { adminUrl = '', dashboardUrl = '', ajaxAction = '', nonce = '' } = info;

    (window as any).ReactDOM.createRoot(el).render(<Onboarding
        {...dashboardInfo(info)}
        steps={onboardingSteps({ adminUrl })}
        ajaxAction={ajaxAction}
        nonce={nonce}
        exitUrl={dashboardUrl}
        finishButton={{
            label: __('Add Your First 3D Model', '3d-viewer'),
            url: `${adminUrl}/post-new.php?post_type=bp3d-model-viewer`
        }}
    />);
});
