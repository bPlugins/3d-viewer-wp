/**
 * Triggers a browser download of a 3D model file from a given URL.
 * @param url - The URL of the 3D model file (.glb, .gltf, .obj, .stl, etc.).
 * @param filename - Optional custom filename. If not provided, it will be extracted from the URL.
 */
function download3DFile(url: string, filename?: string): void {
    if (!url) return;

    // Only web URLs: the fallback below navigates to the URL, so javascript:/data: must never get there.
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url, window.location.href);
    } catch {
        return;
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return;

    let derivedFilename = filename;
    if (!derivedFilename) {
        const pathname = parsedUrl.pathname;
        const nameFromPath = pathname.substring(pathname.lastIndexOf('/') + 1);
        derivedFilename = nameFromPath && nameFromPath.includes('.') ? nameFromPath : 'model.glb';
    }

    // Try fetching as blob to ensure cross-origin/forced file download
    fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = derivedFilename || 'model.glb';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        })
        .catch(() => {
            // Fallback to direct anchor navigation
            const link = document.createElement('a');
            link.href = url;
            link.download = derivedFilename || 'model.glb';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
}

export default download3DFile;
