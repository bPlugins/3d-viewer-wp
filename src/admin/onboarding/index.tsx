import App from './App';

// base.scss must come first: its element resets rely on losing the specificity
// tie to the component rules on source order.
import '../ui/base.scss';
import './onboarding.scss';

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('bp3dOnboarding');

    if (!el) {
        return;
    }

    (window as any).ReactDOM.createRoot(el).render(<App />);
});
