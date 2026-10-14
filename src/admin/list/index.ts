// Modern viewer list (edit.php?post_type=bp3d-model-viewer): styles + the shortcode chip's copy.
import './style.scss';

const copyText = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
    }
};

document.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.bp3d-list-shortcode');
    if (!chip) return;

    e.preventDefault();
    copyText(chip.dataset.clipboardText || '');

    chip.classList.add('is-copied');
    window.clearTimeout(Number(chip.dataset.timer));
    chip.dataset.timer = String(window.setTimeout(() => chip.classList.remove('is-copied'), 1500));
});
