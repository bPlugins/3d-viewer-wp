import { __ } from '@wordpress/i18n';

/**
 * Can the Advanced (O3DViewer) renderer work out this model's format?
 *
 * It picks its importer from the file extension in the URL and nothing else, so
 * a reference carrying no file name is unusable to it. Google Drive addresses
 * files by id (`/file/d/{id}/view`), so its links never carry one. Dropbox is
 * fine: `dropbox:/Folder/Robot.glb` keeps the name, and the renderer is handed
 * that name alongside the signed URL.
 */

const DRIVE_HOSTS = ['drive.google.com', 'www.googleapis.com'];

/** Mirrors OV.GetFileExtension so the warning matches what the renderer will do. */
export const modelExtension = (url?: string): string => {
    if (!url) return '';

    let name = url.split('?')[0];
    const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
    if (slash !== -1) name = name.slice(slash + 1);

    const dot = name.lastIndexOf('.');
    return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
};

export const isGoogleDriveUrl = (url?: string): boolean => {
    if (!url) return false;

    try {
        return DRIVE_HOSTS.includes(new URL(url, window.location.href).host.toLowerCase());
    } catch {
        return false;
    }
};

/** True when the Advanced viewer will fail on this model for want of a file name. */
export const advancedViewerCannotRead = (url?: string, currentViewer?: string): boolean =>
    currentViewer === 'O3DViewer' && !!url && !modelExtension(url);

export const advancedViewerWarning = (url?: string): string =>
    isGoogleDriveUrl(url)
        ? __('Google Drive links identify a file by ID, so the Advanced viewer cannot tell what format this model is and will fail to load it. Switch to the Lite viewer, or use a link that ends in the file name.', '3d-viewer')
        : __('This link does not end in a file name, so the Advanced viewer cannot tell what format this model is and will fail to load it. Switch to the Lite viewer, or use a link that ends in the file name.', '3d-viewer');
