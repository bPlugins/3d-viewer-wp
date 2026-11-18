import React, { useEffect, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import OnboardingLayout from './components/OnboardingLayout';
import StepModel from './screens/StepModel';
import StepCustomize from './screens/StepCustomize';
import StepPublish from './screens/StepPublish';
import { config, methodTarget, type Method } from './lib/config';
import { saveProgress } from './lib/save';

const App: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    const [method, setMethod] = useState<Method>('shortcode');
    const rootRef = useRef<HTMLDivElement>(null);
    const firstRender = useRef(true);
    const [announce, setAnnounce] = useState('');

    // UI/UX 2.2 wiz-step-focus: Next and Back remove the button that had focus, so the new step's heading takes it
    // and a status line names the step. Not on first load, where focus stays where wp-admin put it.
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const heading = rootRef.current?.querySelector<HTMLElement>('.bp3d-ob-title');
        if (!heading) return;
        heading.setAttribute('tabindex', '-1');
        heading.focus();
        /* translators: 1: step number, 2: number of steps, 3: the step's heading. */
        setAnnounce(sprintf(__('Step %1$d of %2$d: %3$s', '3d-viewer'), step, 3, heading.textContent || ''));
    }, [step]);

    const go = (url: string) => {
        if (url) window.location.assign(url);
    };

    // Leaving from step 3 counts as finished; from step 2 it keeps the dashboard's resume entry.
    const leave = (url: string) => saveProgress(step - 1, () => go(url));

    // .bp3d-app carries the design tokens and the element resets; it is the whole
    // contract with wp-admin and must stay the outermost node.
    return (
        <div className="bp3d-app" ref={rootRef}>
            <p className="screen-reader-text" role="status" aria-live="polite">{announce}</p>
            <OnboardingLayout>
                {step === 1 && <StepModel onNext={() => setStep(2)} />}

                {step === 2 && (
                    <StepCustomize
                        onBack={() => setStep(1)}
                        onNext={() => setStep(3)}
                        onExit={() => leave(config().urls.dashboard)}
                    />
                )}

                {step === 3 && (
                    <StepPublish
                        value={method}
                        onChange={setMethod}
                        onBack={() => setStep(2)}
                        onDashboard={() => leave(config().urls.dashboard)}
                        onFinish={() => leave(methodTarget(method))}
                    />
                )}
            </OnboardingLayout>
        </div>
    );
};

export default App;
