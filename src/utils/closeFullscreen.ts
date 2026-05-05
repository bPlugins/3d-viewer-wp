/**
 * Exits fullscreen mode using the appropriate browser API.
 * Falls back to removing a CSS class if Fullscreen API is unavailable.
 */
function closeFullscreen(): void {
    const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
    };

    if (doc.exitFullscreen) {
        doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
    } else {
        const wrapper = document.querySelector('.b3dviewer-wrapper.fullscreen');
        if (wrapper) {
            wrapper.classList.remove('fullscreen');
        }
    }
}

export default closeFullscreen;
