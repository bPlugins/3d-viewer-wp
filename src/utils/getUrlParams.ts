/**
 * Parses URL search params into a key-value record.
 * @param url - The URL string to parse. Defaults to the current page URL.
 * @returns An object containing the URL's query parameters.
 */
function getUrlParams(url: string = window.location.href): Record<string, string> {
    try {
        const urlObj = new URL(url);
        const params: Record<string, string> = {};

        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });

        return params;
    } catch (error) {
        console.error('Invalid URL:', error);
        return {};
    }
}

export default getUrlParams;
