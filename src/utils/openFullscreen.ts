/**
 * Requests fullscreen mode for the given element using the appropriate browser API.
 * Falls back to adding a CSS class if the Fullscreen API is unavailable.
 */
function openFullscreen(element: HTMLElement | null): void {
    if (!element) {
        return;
    }

    const el = element as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
    };

    if (el.requestFullscreen) {
        el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
    } else {
        const wrapper = el.closest('.b3dviewer-wrapper');
        if (wrapper) {
            wrapper.classList.add('fullscreen');
        }
    }
    setTimeout(() => {
        (window as any).dispatchEvent(new Event('resize'));
    }, 100);
}

export default openFullscreen;
