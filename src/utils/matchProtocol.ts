/**
 * Match a media URL's protocol to the page's.
 *
 * On an https page any http URL is upgraded (the browser would block it, and older
 * versions upgraded it too). Downgrading is limited to this site's own URLs, since a
 * third-party host may refuse http. Custom schemes (dropbox:) are left alone.
 */
export default function matchProtocol(url?: string): string {
    // Meta written by an older schema can arrive as an array; returning '' beats
    // taking the whole React render down on `url.replace`.
    if (typeof url !== 'string' || !url) return '';

    try {
        const parsed = new URL(url, window.location.href);
        if (!/^https?:$/.test(parsed.protocol)) return url;
        if (parsed.protocol === 'http:' && window.location.protocol === 'https:') return url.replace(/^http:/, 'https:');
        if (parsed.host !== window.location.host) return url;
    } catch {
        return url;
    }

    return url.replace(/^https?:/, window.location.protocol);
}
