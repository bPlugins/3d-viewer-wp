interface ModifyUrlOptions {
    /** Key-value pairs to add as query parameters. */
    add?: Record<string, string>;
    /** Array of parameter keys to remove. */
    remove?: string[];
    /** Key-value pairs to update (same as add, sets the value). */
    update?: Record<string, string>;
}

/**
 * Modifies URL query parameters by adding, updating, or removing them.
 * @param url - The URL string to modify.
 * @param options - An object specifying which params to add, update, or remove.
 * @returns The modified URL string.
 */
function modifyUrlParams(url: string, options: ModifyUrlOptions = {}): string {
    const {
        add = {},
        remove = [],
        update = {},
    } = options;

    try {
        const urlObj = new URL(url);

        Object.entries(add).forEach(([key, value]) => {
            urlObj.searchParams.set(key, value);
        });

        Object.entries(update).forEach(([key, value]) => {
            urlObj.searchParams.set(key, value);
        });

        remove.forEach((key) => {
            urlObj.searchParams.delete(key);
        });

        return urlObj.toString();
    } catch (error) {
        console.error('Invalid URL:', error);
        return url;
    }
}

export default modifyUrlParams;
