import { __, sprintf } from '@wordpress/i18n';
import { bp3dGlobals } from './types';
import type { FileField, MediaFrame, MediaPick, PickerOptions, Plupload, PluploadFile } from './types';
import { formatMB, isAllowedExt, withinSize } from './validate';

const frames: Record<string, MediaFrame> = {};

/* Exact library filter: type "model" alone also lists USDZ in the GLB picker. Both USDZ mimes are in use. */
const MODEL_MIMES: Record<string, string[]> = {
    glb: ['model/gltf-binary'],
    usdz: ['model/vnd.pixar.usd', 'model/vnd.usdz+zip'],
};

const libraryType = (options: PickerOptions): string | string[] => {
    if (options.kind === 'image') {
        return 'image';
    }
    const mimes = options.ext.reduce<string[]>((list, ext) => list.concat(MODEL_MIMES[ext] || []), []);
    return mimes.length ? mimes : 'model';
};

const SIZE_FILTER = 'bp3d_vendor_model_size';
let sizeFilterAdded = false;
let sizeLimit = 0;

/* wp.Uploader shows errorMap[key] for plupload[key]; FILE_SIZE_ERROR would name the site-wide limit instead. */
const sizeErrorCode = (plupload: Plupload): number => {
    const errorMap = bp3dGlobals().wp?.Uploader?.errorMap;
    if (!errorMap) {
        return plupload.FILE_SIZE_ERROR;
    }
    if (plupload.BP3D_VENDOR_FILE_SIZE_ERROR === undefined) {
        plupload.BP3D_VENDOR_FILE_SIZE_ERROR = -6601;
        errorMap.BP3D_VENDOR_FILE_SIZE_ERROR = (file: PluploadFile) =>
            /* translators: 1: file name, 2: maximum size in MB */
            sprintf(__('%1$s is larger than %2$s MB, the maximum size for 3D files.', '3d-viewer'), String(file?.name || ''), formatMB(sizeLimit));
    }
    return plupload.BP3D_VENDOR_FILE_SIZE_ERROR;
};

/* The modal footer prints the site-wide upload limit; GLB/USDZ frames show the vendor limit. */
const showSizeLimit = (frame: MediaFrame, maxBytes: number): void => {
    frame.el?.querySelectorAll('.max-upload-size').forEach((note) => {
        /* translators: %s: maximum size in MB */
        note.textContent = sprintf(__('Maximum upload file size: %s MB.', '3d-viewer'), formatMB(maxBytes));
    });
};

/* Refuses an over-size GLB/USDZ before plupload sends it; the server still checks. Images keep the site limit. */
const limitUploadSize = (frame: MediaFrame, maxBytes: number): void => {
    const plupload = bp3dGlobals().plupload;
    const uploader = frame.uploader?.uploader?.uploader;
    if (!plupload || !uploader || maxBytes <= 0) {
        return;
    }
    if (!sizeFilterAdded) {
        plupload.addFileFilter(SIZE_FILTER, function (max, file, done) {
            const name = String(file?.name || '');
            const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
            if (max > 0 && (ext === 'glb' || ext === 'usdz') && Number(file?.size) > max) {
                sizeLimit = max;
                this.trigger('Error', { code: sizeErrorCode(plupload), message: 'File size error.', file });
                done(false);
                return;
            }
            done(true);
        });
        sizeFilterAdded = true;
    }
    uploader.setOption('filters', { ...uploader.getOption('filters'), [SIZE_FILTER]: maxBytes });
    showSizeLimit(frame, maxBytes);
};

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
                library: { type: libraryType(options) },
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
            // The upload panel can render after open (tab switch, empty library).
            own.on('content:render', () => {
                if (pending && pending.options.kind !== 'image' && (pending.options.maxBytes || 0) > 0) {
                    showSizeLimit(own, pending.options.maxBytes || 0);
                }
            });
            frames[key] = own;
        }
        frame.open();
        limitUploadSize(frame, options.maxBytes || 0);
    });
