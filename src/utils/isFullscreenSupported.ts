/**
 * Checks if the browser supports the Fullscreen API.
 * Looks for the `requestFullscreen` method or its vendor-prefixed versions.
 * @returns True if fullscreen is supported, otherwise false.
 */
function isFullscreenSupported(): boolean {
    const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
    };

    return !!(
        document.fullscreenEnabled ||
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen
    );
}

export default isFullscreenSupported;
