import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { HeroArt, ViewerControls, SearchField, PlanTags, imageUrl, openInNewTab, useModalFocus } from './shared';
import {
    Cuboid, Zap, CircleCheck, ChevronDown, ChevronRight, ArrowRight, CircleHelp, ExternalLink, Mail, X,
} from './icons';
import type { DemoItem, DemoTone } from '../../utils/data';

/* [tint, label]; the file's orange and red labels were 3.3 and 3.9:1 on their tints. */
const TONES: Record<DemoTone, [string, string]> = {
    blue: ['#ebf3ff', '#2f54eb'],
    green: ['#e6fffa', '#047857'],
    violet: ['#f3e8ff', '#7c3aed'],
    orange: ['#fffaf0', '#c2410c'],
    red: ['#fff5f5', '#c53030'],
};

/* `w`: the pill boxes in the file, kept as minimums so translations can grow. */
const FILTERS = [
    { id: 'all', label: __('All', '3d-viewer'), w: 49 },
    { id: 'camera', label: __('Camera & Controls', '3d-viewer'), w: 147 },
    { id: 'lighting', label: __('Lighting', '3d-viewer'), w: 88 },
    { id: 'hotspots', label: __('Hotspots', '3d-viewer'), w: 90 },
    { id: 'variants', label: __('Variants & Textures', '3d-viewer'), w: 160 },
    { id: 'performance', label: __('Performance & Mobile', '3d-viewer'), w: 170 },
];

const Hero = ({ isPremium, name, count }: { isPremium: boolean; name: string; count: number }) => {
    const title = sprintf(/* translators: %s: plugin name. */ __('See the %s in action', '3d-viewer'), name);
    const countLabel = sprintf(/* translators: %d: number of demos. */ _n('%d Demo Example', '%d Demo Examples', count, '3d-viewer'), count);

    return <section className='bp3d-dash-hero bp3d-dash-hero--wide'>
        <div className='bp3d-dash-hero__copy'>
            <PlanTags isPremium={isPremium} />
            <div className='bp3d-dash-hero__lede'>
                <h1>{title}</h1>
                <div>
                    <p className='bp3d-dash-text'>
                        {__('Browse ready-made demos - click any card to open a live, interactive preview.', '3d-viewer')}
                    </p>
                    <div className='bp3d-dash-chips'>
                        <span className='bp3d-dash-chip'><Cuboid size={14} weight={1.5} /> {countLabel}</span>
                        <span className='bp3d-dash-chip' style={{ minWidth: 133.5 }}><Zap size={14} weight={1.5} /> {__('Fully Interactive', '3d-viewer')}</span>
                        <span className='bp3d-dash-chip' style={{ minWidth: 176.67 }}><CircleCheck size={14} weight={1.5} /> {__('Works with Any Theme', '3d-viewer')}</span>
                    </div>
                </div>
            </div>
        </div>

        <HeroArt
            large
            blobs={[{ left: 742, top: -198.6 }, { left: 923.04, top: -66.11 }]}
            model={{ left: 806, top: 59.4 }}
            degree={{ left: 992.44, top: 72.04 }}
        >
            <div className='bp3d-dash-thumbs'><span /><span /><span /></div>
            <ViewerControls
                large
                style={{ left: 984, top: 182 }}
                icons={[{ size: 20.27, weight: 2 }, { size: 22.84, weight: 1.74 }, { size: 25.16, weight: 1.74 }]}
            />
        </HeroArt>
    </section>;
};

const DemoCard = ({ demo, isPremium, onPreview }: { demo: DemoItem; isPremium: boolean; onPreview: () => void }) => {
    const [bg, color] = TONES[demo.tone];
    const openLabel = sprintf(/* translators: %s: demo title. */ __('Open %s in a new tab', '3d-viewer'), demo.title);

    return <article className='bp3d-dash-demo'>
        <div>
            <div className='bp3d-dash-demo__stage'>
                <span className='bp3d-dash-demo__tag' style={{ background: bg, color }}>{demo.tag.toUpperCase()}</span>
                {demo.pro && !isPremium && <span className='bp3d-dash-demo__pro'>{__('Pro', '3d-viewer').toUpperCase()}</span>}
                <img src={imageUrl(`demo-${demo.image}`)} alt='' />
            </div>
            <div className='bp3d-dash-demo__copy'>
                <h3 className='bp3d-dash-title'>{demo.title}</h3>
                <p className='bp3d-dash-text'>{demo.desc}</p>
            </div>
        </div>
        <footer className='bp3d-dash-demo__foot'>
            <button type='button' className='bp3d-dash-demo__preview' onClick={onPreview}>
                {__('Preview', '3d-viewer')} <ArrowRight size={11.11} weight={1.85} />
            </button>
            <a href={demo.url} {...openInNewTab} className='bp3d-dash-demo__go' aria-label={openLabel}>
                <ArrowRight size={11.11} weight={1.85} />
            </a>
        </footer>
    </article>;
};

const NeedHelp = ({ pages }: any) => (
    <aside className='bp3d-dash-help'>
        <div className='bp3d-dash-help__main'>
            <div className='bp3d-dash-help__intro'>
                <span className='bp3d-dash-help__icon'><CircleHelp size={22.22} weight={1.85} /></span>
                <div>
                    <h3>{__('Need Help?', '3d-viewer')}</h3>
                    <p>{__('Check our documentation or get support from our team.', '3d-viewer')}</p>
                </div>
            </div>
            <div className='bp3d-dash-help__actions'>
                <a href={pages.docs} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--primary'>
                    {__('View Docs', '3d-viewer')} <ExternalLink size={12.96} weight={1.85} />
                </a>
                <a href={pages.support} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--ghost'>
                    <Mail size={12.96} weight={1.85} /> {__('Contact Support', '3d-viewer')}
                </a>
            </div>
        </div>
        <div className='bp3d-dash-help__art'>
            <img src={imageUrl('need-help')} alt='' />
        </div>
    </aside>
);

/* The live preview the old Demos screen opened: iframe, prev/next, Escape and arrow keys. */
const DemoModal = ({ demos, index, setIndex }: { demos: DemoItem[]; index: number; setIndex: (i: number | null) => void }) => {
    const demo = demos[index];
    const [loading, setLoading] = useState(true);
    const panelRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    useModalFocus(panelRef, () => setIndex(null), closeRef);

    useEffect(() => setLoading(true), [demo?.url]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') setIndex(Math.min(index + 1, demos.length - 1));
            if (e.key === 'ArrowLeft') setIndex(Math.max(index - 1, 0));
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [index, demos.length]);

    // The first/last demo unmounts its Prev/Next button; keep focus on the other one instead of losing it.
    useEffect(() => {
        if (panelRef.current && !panelRef.current.contains(document.activeElement)) {
            (prevRef.current || nextRef.current || closeRef.current)?.focus();
        }
    }, [index]);

    if (!demo) return null;

    const position = sprintf(/* translators: 1: position of this demo, 2: number of demos. */ __('%1$d of %2$d', '3d-viewer'), index + 1, demos.length);
    const frameTitle = sprintf(/* translators: %s: demo title. */ __('%s demo', '3d-viewer'), demo.title);

    return <div className='bp3d-dash-modal' role='dialog' aria-modal='true' aria-labelledby='bp3d-dash-modal-title'>
        <div className='bp3d-dash-modal__backdrop' onClick={() => setIndex(null)} />
        <div className='bp3d-dash-modal__panel' ref={panelRef}>
            <header className='bp3d-dash-modal__head'>
                <div className='bp3d-dash-modal__title'>
                    <h2 id='bp3d-dash-modal-title' className='bp3d-dash-title'>{demo.title}</h2>
                    <span className='bp3d-dash-text'>{position}</span>
                </div>
                <div className='bp3d-dash-modal__actions'>
                    <a href={demo.url} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--ghost'>
                        {__('Open in new tab', '3d-viewer')} <ExternalLink size={14} weight={1.75} />
                    </a>
                    <button ref={closeRef} type='button' className='bp3d-dash-modal__close' onClick={() => setIndex(null)} aria-label={__('Close demo', '3d-viewer')}>
                        <X size={18} weight={2} />
                    </button>
                </div>
            </header>
            <div className='bp3d-dash-modal__stage'>
                {loading && <div className='bp3d-dash-modal__loading bp3d-dash-text'>{__('Loading demo…', '3d-viewer')}</div>}
                <iframe
                    key={demo.url}
                    src={demo.url}
                    title={frameTitle}
                    sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
                    onLoad={() => setLoading(false)}
                />
                {index > 0 && <button ref={prevRef} type='button' className='bp3d-dash-modal__nav bp3d-dash-modal__nav--prev' onClick={() => setIndex(index - 1)} aria-label={__('Previous demo', '3d-viewer')}>
                    <ChevronRight size={20} weight={2} />
                </button>}
                {index < demos.length - 1 && <button ref={nextRef} type='button' className='bp3d-dash-modal__nav bp3d-dash-modal__nav--next' onClick={() => setIndex(index + 1)} aria-label={__('Next demo', '3d-viewer')}>
                    <ChevronRight size={20} weight={2} />
                </button>}
            </div>
        </div>
    </div>;
};

const Demos = (props: any) => {
    const { demoInfo, isPremium, name } = props;
    const demos: DemoItem[] = demoInfo.demos;
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState<number | null>(null);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return demos.filter(
            (d) => (filter === 'all' || d.group === filter)
                && (!q || `${d.title} ${d.desc} ${d.tag}`.toLowerCase().includes(q))
        );
    }, [demos, filter, query]);

    return <div className='bp3d-dash-wide'>
        <Hero isPremium={isPremium} name={name} count={demos.length} />

        <div className='bp3d-dash-filters'>
            <SearchField placeholder={__('Search demos...', '3d-viewer')} label={__('Search demos', '3d-viewer')} iconSize={16} weight={2} value={query} onChange={setQuery} />
            <div className='bp3d-dash-pills' role='group' aria-label={__('Filter demos', '3d-viewer')}>
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        type='button'
                        aria-pressed={f.id === filter}
                        className={[
                            'bp3d-dash-pill',
                            f.id === 'all' && 'bp3d-dash-pill--all',
                            f.id === filter && 'bp3d-dash-pill--on',
                        ].filter(Boolean).join(' ')}
                        style={{ minWidth: f.w }}
                        onClick={() => setFilter(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
                <button
                    type='button'
                    aria-pressed={filter === 'more'}
                    className={filter === 'more' ? 'bp3d-dash-pill bp3d-dash-pill--on' : 'bp3d-dash-pill'}
                    style={{ minWidth: 131 }}
                    onClick={() => setFilter(filter === 'more' ? 'all' : 'more')}
                >
                    {__('More Filters', '3d-viewer')} <ChevronDown size={12} weight={2} />
                </button>
            </div>
        </div>

        <div className='bp3d-dash-demos'>
            {shown.map((d, i) => <DemoCard key={d.url} demo={d} isPremium={isPremium} onPreview={() => setOpen(i)} />)}
            {!shown.length && <p className='bp3d-dash-text bp3d-dash-demos__empty'>{__('No demos match your search.', '3d-viewer')}</p>}
            <NeedHelp {...props} />
        </div>

        {open !== null && <DemoModal demos={shown} index={open} setIndex={setOpen} />}
    </div>;
};

export default Demos;
