import React, { useRef } from 'react';
import { __ } from '@wordpress/i18n';
import Stepper from '../components/Stepper';
import Highlights, { methodHighlights } from '../components/Highlights';
import { LayoutGridIcon, MenuIcon, CodeIcon, ArrowRightIcon, CheckIcon } from '../components/icons';
import { config, type Method } from '../lib/config';

interface MethodRow {
    id: Method;
    tone: 'neutral' | 'pink' | 'green';
    Icon: React.FC<{ size?: number }>;
    title: string;
    sub: string;
}

const methods = (): MethodRow[] => [
    {
        id: 'shortcode',
        tone: 'green',
        Icon: CodeIcon,
        title: __('Shortcode', '3d-viewer'),
        sub: __('Paste [3d_viewer id="…"] into any post or widget', '3d-viewer'),
    },
    {
        id: 'gutenberg',
        tone: 'neutral',
        Icon: LayoutGridIcon,
        title: __('Gutenberg', '3d-viewer'),
        sub: __('Insert the 3D Model Viewer block in the editor', '3d-viewer'),
    },
    {
        id: 'elementor',
        tone: 'pink',
        Icon: MenuIcon,
        title: __('Elementor', '3d-viewer'),
        sub: __('Drag the Model Viewer widget into a section', '3d-viewer'),
    }
];

interface StepPublishProps {
    value: Method;
    onChange: (method: Method) => void;
    onBack: () => void;
    onDashboard: () => void;
    onFinish: () => void;
}

const StepPublish: React.FC<StepPublishProps> = ({ value, onChange, onBack, onDashboard, onFinish }) => {
    const { urls } = config();
    const rows = methods();
    const refs = useRef<Array<HTMLButtonElement | null>>([]);

    // A radiogroup is one tab stop, and the arrows move the selection inside it.
    // Without this the three rows are three tab stops and the arrows do nothing.
    const onKeyDown = (event: React.KeyboardEvent, index: number) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!step) return;

        event.preventDefault();
        const next = (index + step + rows.length) % rows.length;
        onChange(rows[next].id);
        refs.current[next]?.focus();
    };

    return (
        <>
            <Stepper current={3} />

            <p className="bp3d-ob-eyebrow">{__('Last step', '3d-viewer')}</p>
            <h2 className="bp3d-ob-title">{__('How will you add models?', '3d-viewer')}</h2>
            <p className="bp3d-ob-lede bp3d-ob-lede--mid">
                {__(
                    'Pick how you usually build pages and the steps below will match. You can still use any of the other methods later.',
                    '3d-viewer'
                )}
            </p>

            <p className="bp3d-ob-section-label" style={{ marginTop: 37 }}>
                {__('Preferred method', '3d-viewer')}
            </p>

            <div className="bp3d-ob-methods" role="radiogroup" aria-label={__('Preferred method', '3d-viewer')}>
                {rows.map(({ id, tone, Icon, title, sub }, index) => (
                    <button
                        type="button"
                        key={id}
                        role="radio"
                        aria-checked={value === id}
                        tabIndex={value === id ? 0 : -1}
                        ref={(el) => { refs.current[index] = el; }}
                        onClick={() => onChange(id)}
                        onKeyDown={(event) => onKeyDown(event, index)}
                        className={`bp3d-ob-method${tone === 'neutral' ? '' : ` bp3d-ob-method--${tone}`}`}
                    >
                        <span className="bp3d-ob-method__icon">
                            <Icon size={20} />
                        </span>
                        <span>
                            <span className="bp3d-ob-method__title">{title}</span>
                            <span className="bp3d-ob-method__sub">{sub}</span>
                        </span>
                        {value === id && (
                            <span className="bp3d-ob-method__check" aria-hidden="true">
                                <CheckIcon size={13} />
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <p className="bp3d-ob-note">
                {__('Three ways to add a model — pick one above for step-by-step instructions:', '3d-viewer')}
            </p>

            <Highlights items={methodHighlights(value)} />

            <hr className="bp3d-ob-divider" style={{ marginTop: 36 }} />

            <div className="bp3d-ob-footer">
                <button type="button" className="bp3d-ob-btn bp3d-ob-btn--ghost" onClick={onBack}>
                    {'< '}
                    {__('Back', '3d-viewer')}
                </button>

                <div className="bp3d-ob-footer__end">
                    <a
                        className="bp3d-ob-btn bp3d-ob-btn--link"
                        href={urls.dashboard}
                        onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                            e.preventDefault();
                            onDashboard();
                        }}
                    >
                        {__('Go to Dashboard', '3d-viewer')}
                    </a>
                    <button type="button" className="bp3d-ob-btn bp3d-ob-btn--primary" onClick={onFinish}>
                        {__('Add Your First 3D Model', '3d-viewer')}
                        <ArrowRightIcon />
                    </button>
                </div>
            </div>
        </>
    );
};

export default StepPublish;
