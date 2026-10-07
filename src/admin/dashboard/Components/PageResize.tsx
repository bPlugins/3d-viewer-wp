import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Mirrors bfields' page handle (lib/bfields Resizable.tsx) so Help & Demos resizes like Settings.
const PAGE_MIN = 960;

function load(key: string): number | null {
    try {
        const saved = JSON.parse(window.localStorage.getItem(key) ?? 'null');
        return typeof saved === 'number' ? saved : null;
    } catch {
        return null;
    }
}

/** The dragged column width, or null for the default full width. */
export function usePageWidth(key: string) {
    const [width, setWidth] = useState<number | null>(() => load(key));

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(width));
        } catch {
            // Private windows and blocked storage: the width just won't stick.
        }
    }, [key, width]);

    return [width, setWidth] as const;
}

/** Content width of an element, padding excluded. */
function innerWidth(node: Element | null | undefined): number {
    if (!node) {
        return Infinity;
    }
    const style = window.getComputedStyle(node);
    return node.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}

interface Props {
    /** Which edge: the column is centred, so both edges move together. */
    edge: 'start' | 'end';
    value: number | null;
    /** The element the column fills at full width. */
    well: () => Element | null | undefined;
    column: () => Element | null | undefined;
    onChange: (value: number | null) => void;
}

/** One edge handle of the centred column; reaching the well's edges goes back to full width. */
export function PageHandle({ edge, value, well, column, onChange }: Props) {
    // A centred column grows by twice the pointer's travel; the start edge grows it leftwards.
    const factor = edge === 'start' ? -2 : 2;
    const drag = useRef<{ x: number; value: number; max: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('bp3d-resizing', dragging);
        return () => document.body.classList.remove('bp3d-resizing');
    }, [dragging]);

    const bounds = (): [number, number] => {
        const max = innerWidth(well());
        return [Math.min(PAGE_MIN, max), max];
    };

    const set = (next: number, min: number, max: number) => {
        const clamped = Math.round(Math.min(max, Math.max(min, next)));
        onChange(clamped >= max ? null : clamped);
    };

    const current = () => value ?? column()?.getBoundingClientRect().width ?? bounds()[1];
    const [min, max] = bounds();

    return <div
        className={`bp3d-page-handle bp3d-page-handle--${edge}${dragging ? ' bp3d-page-handle--active' : ''}`}
        role='separator'
        aria-orientation='vertical'
        aria-label={__('Page width', '3d-viewer')}
        aria-valuenow={Math.round(value ?? (Number.isFinite(max) ? max : 0)) || undefined}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? Math.round(max) : undefined}
        tabIndex={0}
        title={__('Drag to resize · double-click to reset', '3d-viewer')}
        onPointerDown={(event) => {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, value: current(), max: bounds()[1] };
            setDragging(true);
        }}
        onPointerMove={(event) => {
            const start = drag.current;
            if (start) {
                set(start.value + (event.clientX - start.x) * factor, bounds()[0], start.max);
            }
        }}
        onPointerUp={(event) => {
            drag.current = null;
            setDragging(false);
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
        }}
        onDoubleClick={() => onChange(null)}
        onKeyDown={(event) => {
            const step = event.shiftKey ? 50 : 10;
            const delta = ({ ArrowLeft: -step, ArrowRight: step } as Record<string, number>)[event.key];
            if (delta !== undefined) {
                event.preventDefault();
                const [lo, hi] = bounds();
                set(current() + delta * factor, lo, hi);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                onChange(null);
            }
        }}
    >
        <span className='bp3d-page-handle__grip' aria-hidden='true' />
    </div>;
}
