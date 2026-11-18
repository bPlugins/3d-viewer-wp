import React from 'react';
import { __ } from '@wordpress/i18n';
import { CircleXIcon } from './icons';

interface StepperProps {
    current?: number;
    onExit?: () => void;
}

const Stepper: React.FC<StepperProps> = ({ current = 1, onExit }) => {
    // UI/UX 2.2 wiz-step-labels: named for what each step is; no step adds, customises or publishes a model.
    const steps = [__('Welcome', '3d-viewer'), __("What's included", '3d-viewer'), __('How you\'ll add models', '3d-viewer')];

    return (
        <nav className="bp3d-ob-stepper" aria-label={__('Setup progress', '3d-viewer')}>
            {steps.map((label, i) => {
                const n = i + 1;
                const active = n === current;

                return (
                    <div className="bp3d-ob-stepper__step-wrap" key={label} style={{ display: 'contents' }}>
                        {i > 0 && <span className="bp3d-ob-stepper__line" />}
                        <div
                            className={`bp3d-ob-stepper__step${active ? ' bp3d-ob-stepper__step--active' : ''}`}
                            aria-current={active ? 'step' : undefined}
                        >
                            <span className="bp3d-ob-stepper__dot">{n}</span>
                            <span className="bp3d-ob-stepper__label">{label}</span>
                        </div>
                    </div>
                );
            })}

            {onExit && (
                <>
                    <span className="bp3d-ob-stepper__spacer" />
                    <button type="button" className="bp3d-ob-exit" onClick={onExit}>
                        {__('Exit Setup', '3d-viewer')}
                        <CircleXIcon />
                    </button>
                </>
            )}
        </nav>
    );
};

export default Stepper;
