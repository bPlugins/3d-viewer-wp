export type FileField = 'model' | 'poster' | 'usdz';
export type PickKind = 'model' | 'image';
export type EnvelopeId = 'keep' | number;

export interface FileRef {
    id: number;
    url: string;
    name: string;
}

export interface PositionOption {
    value: string;
    label: string;
}

export interface EditorState {
    model: FileRef | null;
    poster: FileRef | null;
    usdz: FileRef | null;
    enableAr: boolean;
    position: string;
    bgColor: string;
    bgLocked: boolean;
    lockMessage: string;
    allowedFields: string[];
    positions: PositionOption[];
    defaultPosition: string;
    maxBytes: number;
    extensions: Record<FileField, string[]>;
}

export interface EnvelopeChanges {
    model?: FileRef | null;
    poster?: FileRef | null;
    usdz?: FileRef | null;
    enableAr?: boolean;
    position?: string;
    bgColor?: string;
}

export interface Envelope {
    v: 1;
    model_id: EnvelopeId;
    poster_id: EnvelopeId;
    usdz_id: EnvelopeId;
    enable_ar: 'keep' | '1' | '';
    viewer_position: string;
    bg_color: string;
}

export interface MediaPick {
    id: number;
    url: string;
    filename: string;
    filesizeInBytes: number;
    subtype: string;
    mime: string;
}

export interface PickerOptions {
    title: string;
    button: string;
    ext: string[];
    kind: PickKind;
    maxBytes?: number;
    onError?: (message: string) => void;
}

export interface MediaSelection {
    first(): { toJSON(): Record<string, unknown> } | undefined;
}

export interface MediaFrame {
    on(event: string, callback: () => void): MediaFrame;
    open(): MediaFrame | void;
    state(): { get(key: 'selection'): MediaSelection | undefined };
}

export interface MediaFrameOptions {
    title: string;
    button: { text: string };
    multiple: boolean;
    library: { type?: string | string[] };
}

export type HookCallback = (...args: any[]) => any;

/* Globals other scripts own; read through bp3dGlobals() so nothing is declared on Window. */
export interface Bp3dGlobals {
    wp?: {
        media?: (options: MediaFrameOptions) => MediaFrame;
        hooks?: {
            addFilter: (hook: string, ns: string, cb: HookCallback, priority?: number) => void;
            addAction: (hook: string, ns: string, cb: HookCallback, priority?: number) => void;
        };
    };
    dokan?: {
        components?: Record<string, any>;
        productEditor?: {
            CustomField?: any;
            getValidationError?: (validity: unknown) => string | undefined;
        };
    };
    bp3dDokan?: Record<string, unknown>;
}

export const bp3dGlobals = (): Bp3dGlobals => window as unknown as Bp3dGlobals;

export interface DokanFieldProps {
    data: Record<string, any>;
    field: Record<string, any> & { id: string };
    onChange: (next: Record<string, unknown>) => void;
    validity?: unknown;
    hideLabelFromVision?: boolean;
}
