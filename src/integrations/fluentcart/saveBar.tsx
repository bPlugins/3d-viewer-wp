import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/*
 * FluentCart's own "Unsaved Changes" bar (its markup and classes, so its stylesheet slides it in, themes it and
 * places it beside the admin menu), with the same Cmd/Ctrl+S shortcut. Rendered always; `is-active` shows it.
 */

interface SaveBarProps {
    active: boolean;
    saving: boolean;
    canSave: boolean;
    onDiscard: () => void;
    onSave: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const SaveBar = ({ active, saving, canSave, onDiscard, onSave }: SaveBarProps) => {
    const latest = useRef({ active, saving, canSave, onSave });
    latest.current = { active, saving, canSave, onSave };

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's' || !latest.current.active) return;
            event.preventDefault();
            if (latest.current.canSave && !latest.current.saving) latest.current.onSave();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const tab = active ? 0 : -1;

    return (
        <div className={`fct-save-bar bp3d-fct-save-bar${active ? ' is-active' : ''}`} aria-hidden={!active} data-testid="bp3d-fct-save-bar">
            <div className="fct-save-bar-inner">
                <div className="fct-save-bar-left">
                    <div className="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M3.43472 7.06927C5.44611 3.51015 6.45181 1.73059 7.83184 1.2725C8.59105 1.02049 9.40887 1.02049 10.1681 1.2725C11.5481 1.73059 12.5538 3.51015 14.5652 7.06927C16.5766 10.6284 17.5823 12.4079 17.2806 13.858C17.1146 14.6557 16.7057 15.3792 16.1125 15.9249C15.0342 16.9168 13.0228 16.9168 8.99996 16.9168C4.97717 16.9168 2.96577 16.9168 1.88743 15.9249C1.29419 15.3792 0.885284 14.6557 0.719312 13.858C0.417621 12.4079 1.42332 10.6284 3.43472 7.06927Z" stroke="currentColor" strokeWidth="1.25" />
                            <path d="M9.20174 13.1667V9.83333C9.20174 9.4405 9.20174 9.24408 9.0797 9.12204C8.95766 9 8.76125 9 8.36841 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8.99325 6.5H9.00073" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h4 className="title">{__('Unsaved Changes', '3d-viewer')}</h4>
                </div>
                <div className="fct-save-bar-right">
                    <div className="fct-btn-group">
                        <button type="button" className="el-button el-button--info" {...{ soft: '' }} tabIndex={tab} disabled={saving} onClick={onDiscard}>
                            <span>{__('Discard', '3d-viewer')}</span>
                        </button>
                        <button
                            type="button"
                            className={`el-button el-button--primary${saving ? ' is-loading' : ''}${!canSave ? ' is-disabled' : ''}`}
                            tabIndex={tab}
                            disabled={saving || !canSave}
                            onClick={onSave}
                        >
                            <span>
                                <span className="cmd">{isMac ? '⌘s' : 'Ctrl+S'}</span> {saving ? __('Updating…', '3d-viewer') : __('Update', '3d-viewer')}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
