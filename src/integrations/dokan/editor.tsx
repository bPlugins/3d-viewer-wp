import { createElement, useState } from '@wordpress/element';
import { addAction, addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import { openPicker, pickerText } from './media';
import { bp3dGlobals } from './types';
import type { DokanFieldProps, EditorState, FileField, FileRef } from './types';
import { buildEnvelope, formatMB, isAllowedField, isTierPosition, isVendorColor, normalizeState, savedBaseline, shownPosition } from './validate';

interface Track {
    origin: unknown;
    baseline: EditorState;
    latest: EditorState;
}

/* Per product: the server state the envelope is diffed against, rebased after each successful save. */
const tracks = new Map<number, Track>();

const lockFallback = (): string => __('The 3D settings of this product are managed by the marketplace admin.', '3d-viewer');

const isObject = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value);

const CubeIcon = () => (
    <svg className="bp3d-dokan-react__svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
);

interface ButtonProps {
    variant: 'primary' | 'secondary' | 'tertiary';
    onClick: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    children: string;
}

const Button = ({ variant, onClick, disabled, ariaLabel, children }: ButtonProps) => {
    const DokanButton = bp3dGlobals().dokan?.components?.DokanButton;
    if (DokanButton) {
        return (
            <DokanButton type="button" variant={variant} className="bp3d-dokan-react__button" onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
                {children}
            </DokanButton>
        );
    }
    return (
        <button type="button" className={`bp3d-dokan-btn bp3d-dokan-btn--${variant}`} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
            {children}
        </button>
    );
};

interface ToggleProps {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
}

/* DokanSwitch is a bare switch with no text, so only the labelled variant is used. */
const Toggle = ({ id, label, description, checked, disabled, onChange }: ToggleProps) => {
    const LabeledSwitch = bp3dGlobals().dokan?.components?.LabeledSwitch;
    if (LabeledSwitch) {
        return (
            <div className="bp3d-dokan-react__row bp3d-dokan-react__row--switch">
                <LabeledSwitch id={id} label={label} description={description} checked={checked} disabled={disabled} onCheckedChange={(next: unknown) => onChange(typeof next === 'boolean' ? next : !checked)} />
            </div>
        );
    }
    return (
        <div className="bp3d-dokan-react__row bp3d-dokan-react__row--switch">
            <label className="bp3d-dokan-react__check" htmlFor={id}>
                <input type="checkbox" id={id} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
                <span>{label}</span>
            </label>
            <span className="bp3d-dokan-react__hint">{description}</span>
        </div>
    );
};

interface FileRowProps {
    name: FileField;
    label: string;
    hint: string;
    file: FileRef | null;
    disabled: boolean;
    onPick: () => void;
    onRemove: () => void;
}

const withFile = (state: EditorState, name: FileField, file: FileRef | null): EditorState => {
    const next = { ...state };
    next[name] = file;
    return next;
};

const FileRow = ({ name, label, hint, file, disabled, onPick, onRemove }: FileRowProps) => {
    /* translators: %s: field name, e.g. "3D model" */
    const removeLabel = sprintf(__('Remove %s', '3d-viewer'), label);
    /* translators: %s: field name, e.g. "3D model" */
    const replaceLabel = sprintf(__('Replace %s', '3d-viewer'), label);
    /* translators: %s: field name, e.g. "3D model" */
    const uploadLabel = sprintf(__('Upload %s', '3d-viewer'), label);

    return (
        <div className={`bp3d-dokan-react__row bp3d-dokan-react__row--${name}`}>
            <span className="bp3d-dokan-react__label">{label}</span>
            {file ? (
                <div className="bp3d-dokan-react__file">
                    {name === 'poster' && file.url ? (
                        <img className="bp3d-dokan-react__thumb" src={file.url} alt="" />
                    ) : (
                        <span className="bp3d-dokan-react__icon">
                            <CubeIcon />
                        </span>
                    )}
                    <span className="bp3d-dokan-react__name" title={file.name}>
                        {file.name}
                    </span>
                    <Button variant="secondary" onClick={onPick} disabled={disabled} ariaLabel={replaceLabel}>
                        {__('Replace', '3d-viewer')}
                    </Button>
                    <button type="button" className="bp3d-dokan-react__remove" onClick={onRemove} disabled={disabled} aria-label={removeLabel}>
                        <CloseIcon />
                    </button>
                </div>
            ) : (
                <div className="bp3d-dokan-react__empty">
                    <span className="bp3d-dokan-react__icon">
                        <CubeIcon />
                    </span>
                    <Button variant="secondary" onClick={onPick} disabled={disabled} ariaLabel={uploadLabel}>
                        {__('Upload', '3d-viewer')}
                    </Button>
                    <span className="bp3d-dokan-react__hint">{hint}</span>
                </div>
            )}
        </div>
    );
};

const Preview = ({ model, poster, bgColor }: { model: FileRef | null; poster: FileRef | null; bgColor: string }) => {
    const defined = typeof window.customElements !== 'undefined' && !!window.customElements.get('model-viewer');
    if (model?.url && defined) {
        return (
            <div className="bp3d-dokan-react__preview" style={bgColor !== 'transparent' && isVendorColor(bgColor) ? { backgroundColor: bgColor } : undefined}>
                {createElement('model-viewer', { src: model.url, poster: poster?.url || undefined, 'camera-controls': true, alt: '' })}
            </div>
        );
    }
    if (poster?.url) {
        return (
            <div className="bp3d-dokan-react__preview">
                <img src={poster.url} alt="" />
            </div>
        );
    }
    return null;
};

const Bp3dModelEdit = ({ data, field, onChange, validity }: DokanFieldProps) => {
    const [error, setError] = useState('');
    const globals = bp3dGlobals();
    const value: Record<string, any> = isObject(data?.[field.id]) ? data[field.id] : {};
    const productId = Number(data?.id) || 0;
    const config = [field.bp3d, globals.bp3dDokan];
    const state = normalizeState([value.state, ...config], lockFallback());

    const origin = value.original ?? value.state ?? field.bp3d ?? null;
    let track = tracks.get(productId);
    if (!track || track.origin !== origin) {
        track = { origin, baseline: normalizeState([origin, ...config], lockFallback()), latest: state };
        tracks.set(productId, track);
    }
    const current = track;

    const update = (next: EditorState): void => {
        current.latest = next;
        const envelope = buildEnvelope(current.baseline, {
            model: next.model,
            poster: next.poster,
            usdz: next.usdz,
            enableAr: next.enableAr,
            position: shownPosition(next),
            bgColor: next.bgColor,
        });
        onChange({ [field.id]: { ...value, original: origin, state: next, ...envelope } });
    };

    const pick = (name: FileField): void => {
        setError('');
        openPicker({
            ...pickerText(name),
            ext: state.extensions[name],
            kind: name === 'poster' ? 'image' : 'model',
            maxBytes: state.maxBytes,
            onError: setError,
        }).then((file) => {
            if (file) {
                update(withFile(state, name, { id: file.id, url: file.url, name: file.filename || file.url.substring(file.url.lastIndexOf('/') + 1) }));
            }
        });
    };

    const remove = (name: FileField): void => {
        setError('');
        update(withFile(state, name, null));
    };

    const CustomField = globals.dokan?.productEditor?.CustomField;
    const validation = globals.dokan?.productEditor?.getValidationError?.(validity);
    const disabled = !!(field.readOnly || field.disabled);
    /* translators: %s: maximum file size in MB */
    const sizeHint = state.maxBytes > 0 ? sprintf(__('GLB file, up to %s MB.', '3d-viewer'), formatMB(state.maxBytes)) : __('GLB file.', '3d-viewer');
    const position = shownPosition(state);
    const positionLocked = !!state.position && !isTierPosition(state, state.position);
    // Poster, USDZ, AR and position are only stored alongside a model (server rules R5/R6).
    const needsModel = !state.model;
    const showNeedsModel = needsModel && !disabled && ['poster', 'ar', 'usdz', 'position', 'background'].some((name) => isAllowedField(state, name));

    const body = state.lockMessage ? (
        <div className="bp3d-dokan-react__notice" role="status">
            {state.lockMessage}
        </div>
    ) : (
        <div className="bp3d-dokan-react__fields">
            {isAllowedField(state, 'model') && (
                <FileRow name="model" label={__('3D model', '3d-viewer')} hint={sizeHint} file={state.model} disabled={disabled} onPick={() => pick('model')} onRemove={() => remove('model')} />
            )}
            <Preview model={state.model} poster={state.poster} bgColor={state.bgColor} />
            {showNeedsModel && <p className="bp3d-dokan-react__hint bp3d-dokan-react__needs-model">{__('Add a 3D model first.', '3d-viewer')}</p>}
            {isAllowedField(state, 'poster') && (
                <FileRow name="poster" label={__('Poster image', '3d-viewer')} hint={__('Shown while the model loads.', '3d-viewer')} file={state.poster} disabled={disabled || needsModel} onPick={() => pick('poster')} onRemove={() => remove('poster')} />
            )}
            {isAllowedField(state, 'ar') && (
                <Toggle
                    id={`bp3d-dokan-ar-${productId}`}
                    label={__('Enable AR', '3d-viewer')}
                    description={__('Let shoppers view the model in their space.', '3d-viewer')}
                    checked={state.enableAr}
                    disabled={disabled || needsModel}
                    onChange={(checked) => update({ ...state, enableAr: checked })}
                />
            )}
            {isAllowedField(state, 'usdz') && (
                <FileRow name="usdz" label={__('USDZ model (iOS AR)', '3d-viewer')} hint={__('Optional. Used for AR on iPhone and iPad.', '3d-viewer')} file={state.usdz} disabled={disabled || needsModel} onPick={() => pick('usdz')} onRemove={() => remove('usdz')} />
            )}
            {isAllowedField(state, 'position') && (
                <div className="bp3d-dokan-react__row bp3d-dokan-react__row--position">
                    <label className="bp3d-dokan-react__label" htmlFor={`bp3d-dokan-position-${productId}`}>
                        {__('Viewer position', '3d-viewer')}
                    </label>
                    {positionLocked || !state.positions.length ? (
                        <span className="bp3d-dokan-react__hint">{__('Set by the marketplace admin', '3d-viewer')}</span>
                    ) : (
                        <select
                            id={`bp3d-dokan-position-${productId}`}
                            className="bp3d-dokan-react__select"
                            value={position}
                            disabled={disabled || needsModel}
                            onChange={(event) => update({ ...state, position: event.target.value })}
                        >
                            {state.positions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}
            {isAllowedField(state, 'background') && (
                <div className="bp3d-dokan-react__row bp3d-dokan-react__row--background">
                    <label className="bp3d-dokan-react__label" htmlFor={`bp3d-dokan-bg-${productId}`}>
                        {__('Background', '3d-viewer')}
                    </label>
                    {state.bgLocked ? (
                        <span className="bp3d-dokan-react__hint">{__('Set by the marketplace admin', '3d-viewer')}</span>
                    ) : (
                        <div className="bp3d-dokan-react__color">
                            <input
                                type="color"
                                id={`bp3d-dokan-bg-${productId}`}
                                className={`bp3d-dokan-react__swatch${state.bgColor === 'transparent' ? ' is-transparent' : ''}`}
                                value={state.bgColor === 'transparent' ? '#ffffff' : state.bgColor}
                                disabled={disabled || needsModel}
                                onChange={(event) => update({ ...state, bgColor: event.target.value.toLowerCase() })}
                            />
                            <label className="bp3d-dokan-react__check" htmlFor={`bp3d-dokan-bg-transparent-${productId}`}>
                                <input
                                    type="checkbox"
                                    id={`bp3d-dokan-bg-transparent-${productId}`}
                                    checked={state.bgColor === 'transparent'}
                                    disabled={disabled || needsModel}
                                    onChange={(event) => update({ ...state, bgColor: event.target.checked ? 'transparent' : '#ffffff' })}
                                />
                                <span>{__('Transparent', '3d-viewer')}</span>
                            </label>
                        </div>
                    )}
                    <span className="bp3d-dokan-react__hint">{__('Shown behind the 3D model.', '3d-viewer')}</span>
                </div>
            )}
            {error && (
                <p className="bp3d-dokan-react__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );

    if (CustomField) {
        return (
            <CustomField field={field} error={validation}>
                <div className="bp3d-dokan-react">{body}</div>
            </CustomField>
        );
    }
    return (
        <div className={`flex flex-col gap-1 dokan-form-field-${field.id}`}>
            <div className="bp3d-dokan-react">{body}</div>
        </div>
    );
};

export const registerEditorField = (): void => {
    addFilter('dokan_product_editor_ui_variant', 'bp3d/dokan-model', (map: Record<string, unknown>) => ({
        ...(isObject(map) ? map : {}),
        bp3d_model: () => ({ Edit: Bp3dModelEdit }),
    }));
    addAction('dokan_product_editor_after_save', 'bp3d/dokan-model', (productId: unknown) => {
        const track = tracks.get(Number(productId) || 0);
        if (track) {
            track.baseline = savedBaseline(track.latest, track.baseline);
        }
    });
};
