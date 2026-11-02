/**
 * Only a http(s) or page-relative URL may reach model-viewer's `ios-src`: on iOS the
 * element opens that value as a Quick Look link, so a `javascript:` URL would run.
 */
export default function safeMediaUrl(url?: unknown): string {
    if (typeof url !== 'string' || !url.trim()) return '';

    try {
        const { protocol } = new URL(url, window.location.href);
        return /^https?:$/.test(protocol) ? url : '';
    } catch {
        return '';
    }
}
