/**
 * Triggers a browser download of an image from a Data URL.
 * @param dataUrl - The Data URL of the image.
 * @param filename - The filename for the downloaded file.
 */
function downloadImageFromDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default downloadImageFromDataUrl;
