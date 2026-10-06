import './style.scss';
import { initClassic } from './classic';
import { registerEditorField } from './editor';

// Dokan's React editor builds its fields after an async fetch; the filter must exist before that.
registerEditorField();

const boot = (): void => {
    document.querySelectorAll<HTMLElement>('[data-bp3d-dokan]').forEach((root) => initClassic(root));
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
