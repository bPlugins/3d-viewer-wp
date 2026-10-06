import { __, sprintf } from '@wordpress/i18n';
import { bp3dGlobals } from './types';
import type { FileField, MediaFrame, MediaPick, PickerOptions } from './types';
import { formatMB, isAllowedExt, withinSize } from './validate';

const frames: Record<string, MediaFrame> = {};

export const pickerText = (field: FileField): { title: string; button: string } => {
    const titles: Record<FileField, string> = {
        model: __('Select a 3D model (GLB)', '3d-viewer'),
        poster: __('Select a poster image', '3d-viewer'),
        usdz: __('Select a USDZ model for iOS AR', '3d-viewer'),
    };
    return { title: titles[field], button: __('Use this file', '3d-viewer') };
};

let pending: { resolve: (pick: MediaPick | null) => void; options: PickerOptions } | null = null;

const settle = (pick: MediaPick | null): void => {
    const current = pending;
    pending = null;
    if (current) {
        current.resolve(pick);
    }
};

const check = (raw: Record<string, unknown>, options: PickerOptions): MediaPick | null => {
    const pick: MediaPick = {
        id: Number(raw.id) || 0,
        url: typeof raw.url === 'string' ? raw.url : '',
        filename: typeof raw.filename === 'string' ? raw.filename : '',
        filesizeInBytes: Number(raw.filesizeInBytes) || 0,
        subtype: typeof raw.subtype === 'string' ? raw.subtype : '',
        mime: typeof raw.mime === 'string' ? raw.mime : '',
    };
    const fail = (message: string): null => {
        options.onError?.(message);
        return null;
    };

    if (!pick.id || !pick.url) {
        return null;
    }
    const name = pick.filename || pick.url;
    const extOk = !options.ext.length || isAllowedExt(name, options.ext);
    if (!extOk || (options.kind === 'image' && pick.mime.indexOf('image/') !== 0)) {
        /* translators: %s: allowed file extensions, e.g. "GLB" */
        return fail(sprintf(__('Please choose a %s file.', '3d-viewer'), options.ext.map((e) => e.toUpperCase()).join(', ')));
    }
    // The server caps GLB/USDZ only (VendorUploadGuard); posters have no vendor size limit.
    if (options.kind !== 'image' && !withinSize(pick.filesizeInBytes, options.maxBytes || 0)) {
        /* translators: 1: file size in MB, 2: maximum size in MB */
        return fail(sprintf(__('This file is %1$s MB. The maximum size is %2$s MB.', '3d-viewer'), formatMB(pick.filesizeInBytes), formatMB(options.maxBytes || 0)));
    }
    return pick;
};

/* Our own wp.media frame: Dokan's MediaUploader cannot filter the library by type. */
export const openPicker = (options: PickerOptions): Promise<MediaPick | null> =>
    new Promise((resolve) => {
        const media = bp3dGlobals().wp?.media;
        if (typeof media !== 'function') {
            options.onError?.(__('The media library is not available on this page. Please reload and try again.', '3d-viewer'));
            resolve(null);
            return;
        }

        settle(null);
        pending = { resolve, options };

        const key = `${options.kind}|${options.ext.join(',')}|${options.title}`;
        let frame = frames[key];
        if (!frame) {
            frame = media({
                title: options.title,
                button: { text: options.button },
                multiple: false,
                library: { type: options.kind === 'image' ? 'image' : 'model' },
            });
            const own = frame;
            own.on('select', () => {
                const raw = own.state().get('selection')?.first()?.toJSON();
                settle(raw && pending ? check(raw, pending.options) : null);
            });
            // wp.media fires "close" before "select"; defer so a selection wins.
            own.on('close', () => {
                window.setTimeout(() => settle(null), 0);
            });
            frames[key] = own;
        }
        frame.open();
    });
