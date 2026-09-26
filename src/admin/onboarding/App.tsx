import React, { useState } from 'react';
import OnboardingLayout from './components/OnboardingLayout';
import StepModel from './screens/StepModel';
import StepCustomize from './screens/StepCustomize';
import StepPublish from './screens/StepPublish';
import { config, methodTarget, type Method } from './lib/config';
import { saveProgress } from './lib/save';

const App: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    const [method, setMethod] = useState<Method>('gutenberg');

    const go = (url: string) => {
        if (url) window.location.assign(url);
    };

    // Leaving from step 3 counts as finished; from step 2 it keeps the dashboard's resume entry.
    const leave = (url: string) => saveProgress(step - 1, () => go(url));

    // .bp3d-app carries the design tokens and the element resets; it is the whole
    // contract with wp-admin and must stay the outermost node.
    return (
        <div className="bp3d-app">
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
