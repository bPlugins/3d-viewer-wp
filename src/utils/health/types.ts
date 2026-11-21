/**
 * Model health check, basic editor form (copied from Pro's src/utils/health; free keeps only the checks it runs).
 */

/** "Possible cause", "Worth checking" and "Note". Never "is breaking". */
export type Severity = 'cause' | 'check' | 'note';

/** The checks free runs in the browser. H07u is the "couldn't reach" outcome of the H07 probe. */
export type FindingId =
    | 'H01' | 'H01b' | 'H02' | 'H03' | 'H03n' | 'H04' | 'H05' | 'H06' | 'H07' | 'H07u' | 'H09'
    | 'H11' | 'H12' | 'H13' | 'H14';

export type FindingParams = Record<string, string | number | boolean | string[] | undefined>;

export interface Finding {
    id: FindingId;
    severity: Severity;
    params?: FindingParams;
}

export type Variant = 'pro' | 'free';

/**
 * cors: only the no-cors fetch resolved; unreachable: both threw; unknown: timed out (no verdict);
 * skipped: not probed in the browser (custom scheme, data:).
 */
export type Reach = 'ok' | 'http-error' | 'cors' | 'unreachable' | 'unknown' | 'skipped';

export type BodyKind = 'glb' | 'gltf' | 'html' | 'other' | 'empty';

export interface ProbeFacts {
    reach: Reach;
    status?: number;
    body?: BodyKind;
    /** An http:// link on an https page: did the https variant answer? */
    httpsUpgrade?: 'works' | 'fails';
    /** Bytes, only when known (media frame or a readable Content-Length). */
    size?: number;
    /** undefined: not read; null: unknown (over the cap, unreadable or invalid). */
    json?: Record<string, any> | null;
    /** .gltf siblings (buffers/images) that answered 404/410. */
    missingSiblings?: number;
    /** A .gltf whose `size` leaves out some sibling files. */
    sizePartial?: boolean;
}
