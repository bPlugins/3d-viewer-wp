/**
 * Copies the given text string to the clipboard.
 * Uses the modern Clipboard API with a fallback for older browsers.
 * @param text - The text to copy.
 * @returns Whether the operation succeeded.
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        return successful;
    } catch (err) {
        console.error('Copy failed:', err);
        return false;
    }
};

export default copyToClipboard;
