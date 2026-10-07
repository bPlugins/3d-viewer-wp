import type { CSSProperties, ReactNode, RefObject } from 'react';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { RefreshCw, ZoomIn, ZoomOut, Search, IconProps } from './icons';

export const imageUrl = (name: string): string =>
    `${(window as any).bp3dDashboard?.dir || ''}admin/images/dashboard/${name}.webp`;

export const openInNewTab = { target: '_blank', rel: 'noopener noreferrer' } as const;

interface HeroArtProps {
    blobs: [CSSProperties, CSSProperties];
    model: CSSProperties;
    degree: CSSProperties;
    large?: boolean;
    children?: ReactNode;
}

/* The decorative right half of every hero, positioned in the file's frame. */
export const HeroArt = ({ blobs, model, degree, large = false, children }: HeroArtProps) => (
    <div className='bp3d-dash-hero__art' aria-hidden='true'>
        <span className='bp3d-dash-hero__blob bp3d-dash-hero__blob--a' style={blobs[0]} />
        <span className='bp3d-dash-hero__blob bp3d-dash-hero__blob--b' style={blobs[1]} />
        <div className='bp3d-dash-hero__model' style={model}>
            <img src={imageUrl('headphones')} alt='' />
        </div>
        <span className={large ? 'bp3d-dash-degree bp3d-dash-degree--lg' : 'bp3d-dash-degree'} style={degree}>
            360°
        </span>
        {children}
    </div>
);

/* Pictures of viewer controls, not controls: the art is aria-hidden, so they are spans. */
export const ViewerControls = ({ style, icons, large = false }: { style: CSSProperties; icons: IconProps[]; large?: boolean }) => {
    const [r, zi, zo] = icons;
    return <div className={large ? 'bp3d-dash-ctrls bp3d-dash-ctrls--lg' : 'bp3d-dash-ctrls'} style={style}>
        <span className='bp3d-dash-ctrl'><RefreshCw {...r} /></span>
        <span className='bp3d-dash-ctrl'><ZoomIn {...zi} /></span>
        <span className='bp3d-dash-ctrl'><ZoomOut {...zo} /></span>
    </div>;
};

export const Tag = ({ children, bg, color, className = '' }: { children: ReactNode; bg?: string; color?: string; className?: string }) => (
    <span className={`bp3d-dash-tag ${className}`} style={{ background: bg, color }}>
        {children}
    </span>
);

interface SearchFieldProps {
    placeholder: string;
    label: string;
    iconSize: number;
    weight: number;
    value: string;
    onChange: (value: string) => void;
}

export const SearchField = ({ placeholder, label, iconSize, weight, value, onChange }: SearchFieldProps) => (
    <label className='bp3d-dash-search'>
        <Search size={iconSize} weight={weight} />
        <input
            type='text'
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
        />
    </label>
);

/* The two pills every hero banner opens with. */
export const PlanTags = ({ isPremium }: { isPremium: boolean }) => (
    <div className='bp3d-dash-tags'>
        <Tag className='bp3d-dash-tag--pill' color='#047857'>{__('Plugin Active', '3d-viewer')}</Tag>
        <Tag className='bp3d-dash-tag--pill' color='#475569'>{isPremium ? __('Pro Plan', '3d-viewer') : __('Free Plan', '3d-viewer')}</Tag>
    </div>
);

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/* Modal focus: moves in on mount only, Tab stays inside, Escape closes, focus returns to the opener on unmount. */
export const useModalFocus = (panel: RefObject<HTMLElement | null>, onClose: () => void, initial?: RefObject<HTMLElement | null>) => {
    const close = useRef(onClose);
    close.current = onClose;

    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) || []).filter((el) => el.getClientRects().length > 0);
        (initial?.current || items()[0])?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close.current();
                return;
            }
            if (e.key !== 'Tab' || !panel.current) return;
            const list = items();
            if (!list.length) return;
            const active = document.activeElement;
            const outside = !panel.current.contains(active);
            if (e.shiftKey && (outside || active === list[0])) {
                e.preventDefault();
                list[list.length - 1].focus();
            } else if (!e.shiftKey && (outside || active === list[list.length - 1])) {
                e.preventDefault();
                list[0].focus();
            }
        };
        const onFocusIn = (e: FocusEvent) => {
            if (panel.current && !panel.current.contains(e.target as Node)) items()[0]?.focus();
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener('focusin', onFocusIn);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('focusin', onFocusIn);
            if (opener && document.contains(opener)) opener.focus();
        };
    }, []);
};
