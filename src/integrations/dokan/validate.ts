import type { EditorState, Envelope, EnvelopeChanges, EnvelopeId, FileField, FileRef, PositionOption } from './types';

export const FILE_FIELDS: FileField[] = ['model', 'poster', 'usdz'];

export const DEFAULT_EXTENSIONS: Record<FileField, string[]> = {
    model: ['glb'],
    usdz: ['usdz'],
    poster: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
};

export const extOf = (name: string): string => {
    const clean = String(name || '').split(/[?#]/)[0];
    const base = clean.substring(clean.lastIndexOf('/') + 1);
    const dot = base.lastIndexOf('.');
    return dot > 0 ? base.substring(dot + 1).toLowerCase() : '';
};

export const isAllowedExt = (name: string, exts: string[]): boolean => {
    const ext = extOf(name);
    return ext !== '' && exts.map((e) => e.toLowerCase()).includes(ext);
};

/* Mirrors VendorModel::BG_PATTERN. */
export const isVendorColor = (value: string): boolean => /^(?:transparent|#[0-9a-f]{3}|#[0-9a-f]{6})$/i.test(value);

export const withinSize = (bytes: number, max: number): boolean => !(max > 0) || !(bytes > 0) || bytes <= max;

export const formatMB = (bytes: number): string => {
    const mb = bytes / 1048576;
    return Number.isInteger(mb) ? String(mb) : mb.toFixed(1);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/* First source that has the key wins; with allowNull a stored null (e.g. a removed file) still counts. */
const pick = (sources: Record<string, unknown>[], keys: string[], allowNull = false): unknown => {
    for (const source of sources) {
        for (const key of keys) {
            const value = source[key];
            if (value !== undefined && (allowNull || value !== null)) {
                return value;
            }
        }
    }
    return undefined;
};

const toFileRef = (value: unknown): FileRef | null => {
    if (typeof value === 'string') {
        return value ? { id: 0, url: value, name: value.substring(value.lastIndexOf('/') + 1) } : null;
    }
    if (!isObject(value)) {
        return null;
    }
    const url = typeof value.url === 'string' ? value.url : '';
    const id = Number(value.id) > 0 ? Number(value.id) : 0;
    if (!url && !id) {
        return null;
    }
    const name = typeof value.name === 'string' && value.name ? value.name : url.substring(url.lastIndexOf('/') + 1);
    return { id, url, name };
};

const toPositions = (value: unknown): PositionOption[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => (isObject(item) ? { value: String(item.value ?? ''), label: String(item.label ?? item.value ?? '') } : { value: String(item), label: String(item) }))
            .filter((item) => item.value !== '');
    }
    if (isObject(value)) {
        return Object.keys(value).map((key) => ({ value: key, label: String(value[key]) }));
    }
    return [];
};

const toStringList = (value: unknown): string[] | null => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).toLowerCase()).filter(Boolean);
    }
    if (typeof value === 'string' && value) {
        return value.toLowerCase().split(/[\s,|]+/).filter(Boolean);
    }
    return null;
};

const toLockMessage = (lock: unknown, message: unknown, liveReadOnly: unknown, fallback: string): string => {
    if (typeof message === 'string' && message) {
        return message;
    }
    if (isObject(lock)) {
        if (typeof lock.message === 'string' && lock.message) {
            return lock.message;
        }
        return lock.code ? fallback : '';
    }
    if ((typeof lock === 'string' && lock) || lock === true || liveReadOnly === true || liveReadOnly === '1') {
        return fallback;
    }
    return '';
};

/* Accepts the server's prepare()/clientConfig payloads (snake or camel keys) and this module's own output. */
export const normalizeState = (sources: unknown[], lockFallback: string): EditorState => {
    const list = sources.filter(isObject);
    const ext = pick(list, ['extensions']);
    const extensions = { ...DEFAULT_EXTENSIONS };
    if (isObject(ext)) {
        FILE_FIELDS.forEach((field) => {
            const exts = toStringList(ext[field]);
            if (exts && exts.length) {
                extensions[field] = exts;
            }
        });
    }
    const allowed = toStringList(pick(list, ['allowedFields', 'allowed_fields', 'fields']));
    const positionValue = pick(list, ['position', 'viewer_position'], true);

    const ownLock = pick(list, ['lockMessage']);
    const bgValue = pick(list, ['bgColor', 'bg_color']);

    return {
        model: toFileRef(pick(list, ['model'], true)),
        poster: toFileRef(pick(list, ['poster'], true)),
        usdz: toFileRef(pick(list, ['usdz'], true)),
        enableAr: [true, 1, '1', 'true', 'yes'].includes(pick(list, ['enableAr', 'enable_ar'], true) as never),
        position: typeof positionValue === 'string' && positionValue !== 'keep' ? positionValue : '',
        bgColor: typeof bgValue === 'string' && bgValue !== '' ? bgValue.toLowerCase() : 'transparent',
        bgLocked: [true, 1, '1'].includes(pick(list, ['bgLocked', 'bg_locked']) as never),
        lockMessage: typeof ownLock === 'string'
            ? ownLock
            : toLockMessage(pick(list, ['lock']), pick(list, ['notice', 'lock_message']), pick(list, ['liveReadOnly', 'live_read_only']), lockFallback),
        allowedFields: allowed ?? ['model', 'poster', 'usdz', 'ar', 'position', 'background'],
        positions: toPositions(pick(list, ['positions'])),
        defaultPosition: String(pick(list, ['defaultPosition', 'default_position']) ?? 'top'),
        maxBytes: Math.max(0, Number(pick(list, ['maxBytes', 'max_bytes'])) || 0),
        extensions,
    };
};

export const isAllowedField = (state: EditorState, field: string): boolean => state.allowedFields.includes(field);

export const isTierPosition = (state: EditorState, value: string): boolean => state.positions.some((p) => p.value === value);

/* The value the position control shows: stored tier value, else the default for a product without one. */
export const shownPosition = (state: EditorState): string => (state.position ? state.position : state.defaultPosition);

/* What the server holds after a save: without a model it stores no row fields, position or background (R5/R6). */
export const savedBaseline = (latest: EditorState, previous: EditorState): EditorState =>
    latest.model ? latest : { ...latest, poster: null, usdz: null, enableAr: false, position: '', bgColor: previous.bgColor };

const sameFile = (a: FileRef | null, b: FileRef | null): boolean =>
    a === b || (!!a && !!b && a.id === b.id && a.url === b.url);

const fileOp = (base: FileRef | null, next: FileRef | null | undefined): EnvelopeId => {
    if (next === undefined || sameFile(base, next)) {
        return 'keep';
    }
    if (next === null) {
        return base ? 0 : 'keep';
    }
    return next.id > 0 ? next.id : 'keep';
};

/* Unchanged or disallowed fields are 'keep'; a removal is 0; a new pick is its attachment id. */
export const buildEnvelope = (base: EditorState, changes: EnvelopeChanges): Envelope => {
    const fileId = (field: FileField): EnvelopeId => (isAllowedField(base, field) ? fileOp(base[field], changes[field]) : 'keep');

    let enableAr: Envelope['enable_ar'] = 'keep';
    if (isAllowedField(base, 'ar') && changes.enableAr !== undefined && changes.enableAr !== base.enableAr) {
        enableAr = changes.enableAr ? '1' : '';
    }

    let position = 'keep';
    const basePosition = shownPosition(base);
    const editable = !base.position || isTierPosition(base, base.position);
    if (isAllowedField(base, 'position') && editable && changes.position && changes.position !== basePosition && isTierPosition(base, changes.position)) {
        position = changes.position;
    }

    let bgColor = 'keep';
    const nextBg = changes.bgColor?.toLowerCase();
    if (isAllowedField(base, 'background') && !base.bgLocked && nextBg && nextBg !== base.bgColor && isVendorColor(nextBg)) {
        bgColor = nextBg;
    }

    return {
        v: 1,
        model_id: fileId('model'),
        poster_id: fileId('poster'),
        usdz_id: fileId('usdz'),
        enable_ar: enableAr,
        viewer_position: position,
        bg_color: bgColor,
    };
};
