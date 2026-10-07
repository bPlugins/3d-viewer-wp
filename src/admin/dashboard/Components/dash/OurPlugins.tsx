import { useEffect, useMemo, useState } from '@wordpress/element';
import { Link } from 'react-router-dom';
import { __, _n, sprintf } from '@wordpress/i18n';
import { dispatch, useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { HeroArt, SearchField, Tag, openInNewTab } from './shared';
import { Cuboid, Zap, CircleCheck, Box, Power, ExternalLink, ArrowRight, Lightbulb, Puzzle, Star, Blocks } from './icons';

/*
 * The design's Extensions tab, filled with what Our Plugins has always listed: bPlugins'
 * WordPress.org plugins, with the same one-click install/activate through the REST API.
 */
const SLUGS = [
    '3d-viewer', 'html5-video-player', 'html5-audio-player', 'pdf-poster', 'document-emberdder', 'advanced-post-block',
    'advance-custom-html', 'b-carousel-block', 'b-blocks', 'embed-lottie-player', 'b-slider',
];
const ORG_API = 'https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[author]=bplugins&request[per_page]=100&request[fields]=title,name,slug,icons,short_description,version,active_installs,rating,ratings,downloaded';

type Status = 'notfound' | 'installed' | 'activated' | 'installing' | 'activating' | 'success' | 'error';

const decode = (html = '') => {
    const el = document.createElement('textarea');
    el.innerHTML = html.replace(/<[^>]+>/g, '');
    return el.value;
};

const displayName = (name = '') => decode(name).split(/\s*[–\-—]\s*/)[0].trim();

const compact = (n = 0) => {
    const abs = Math.abs(n);
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
    return String(n);
};

interface PluginCaps { canInstall: boolean; canActivate: boolean }

const PluginCard = ({ plugin, path, initStatus, caps }: { plugin: any; path?: string; initStatus: Status; caps: PluginCaps }) => {
    const [status, setStatus] = useState<Status>(initStatus);
    useEffect(() => setStatus(initStatus), [initStatus]);

    const install = async () => {
        const wasInstalled = status === 'installed';
        setStatus(wasInstalled ? 'activating' : 'installing');
        try {
            if (wasInstalled && path) {
                await apiFetch({ path: `/wp/v2/plugins/${path}`, method: 'POST', data: { status: 'active' } });
            } else {
                await apiFetch({ path: '/wp/v2/plugins', method: 'POST', data: { slug: plugin.slug, status: 'active' } });
            }
            setStatus('success');
            setTimeout(() => setStatus('activated'), 1000);
            // A return visit to this tab must not start from the cached pre-install list.
            (dispatch('core') as any)?.invalidateResolutionForStoreSelector?.('getEntityRecords');
        } catch (_e) {
            setStatus('error');
            setTimeout(() => setStatus(wasInstalled ? 'installed' : 'notfound'), 1400);
        }
    };

    const label = {
        activated: __('Activated', '3d-viewer'),
        success: __('Activated', '3d-viewer'),
        installed: __('Activate', '3d-viewer'),
        activating: __('Activating…', '3d-viewer'),
        installing: __('Installing…', '3d-viewer'),
        error: __('Failed', '3d-viewer'),
        notfound: __('Install & Activate', '3d-viewer'),
    }[status];
    const done = status === 'activated' || status === 'success';
    const busy = status === 'installing' || status === 'activating';
    const name = displayName(plugin.name);
    const icon = plugin.icons?.['2x'] || plugin.icons?.['1x'] || plugin.icons?.svg || '';
    const rating = (plugin.rating || 0) / 20;
    const ratingLabel = sprintf(/* translators: %s: average rating out of 5, e.g. 4.8. */ __('Rated %s out of 5', '3d-viewer'), rating.toFixed(1));
    const downloads = sprintf(/* translators: %s: download count, e.g. 1.2M. */ __('%s downloads', '3d-viewer'), compact(plugin.downloaded));
    // A fresh install is activated in the same request, so it needs both capabilities.
    const allowed = done || busy || (status === 'installed' ? caps.canActivate : caps.canInstall && caps.canActivate);

    return <article className='bp3d-dash-extcard'>
        <div className='bp3d-dash-extcard__shot'>
            {icon && <img src={icon} alt='' />}
            {done && <Tag className='bp3d-dash-tag--active'>{__('Active', '3d-viewer')}</Tag>}
        </div>

        <div className='bp3d-dash-extcard__body'>
            <div className='bp3d-dash-extcard__head'>
                <span className='bp3d-dash-extcard__icon'><Box size={20} weight={1.75} /></span>
                <div>
                    <h3 className='bp3d-dash-title'>{name}</h3>
                    <div className='bp3d-dash-extcard__by'>
                        {plugin.version && <span className='bp3d-dash-extcard__ver'>v{plugin.version}</span>}
                        <span className='bp3d-dash-extcard__author' title={ratingLabel}>
                            <Star size={12} weight={1.75} /> {rating.toFixed(1)} · {downloads}
                        </span>
                    </div>
                </div>
            </div>
            <p className='bp3d-dash-text'>{decode(plugin.short_description)}</p>

            <div className='bp3d-dash-extcard__actions'>
                <a href={`https://wordpress.org/plugins/${plugin.slug}/`} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--ghost'>
                    <ExternalLink size={14} weight={1.75} /> {__('Learn More', '3d-viewer')}
                </a>
                {allowed && <button type='button' className={`bp3d-dash-btn bp3d-dash-btn--primary bp3d-dash-extcard__cta is-${status}`} disabled={done || busy} onClick={install}>
                    {label} {!done && !busy && <ArrowRight size={14} weight={1.75} />}
                </button>}
            </div>
        </div>
    </article>;
};

const OurPlugins = ({ slug, links, pages, extensions, canManageOptions, canInstallPlugins = false, canActivatePlugins = false }: any) => {
    const caps: PluginCaps = { canInstall: canInstallPlugins, canActivate: canActivatePlugins };
    // GET /wp/v2/plugins needs activate_plugins; without it nothing can be known about installed plugins.
    const installed = useSelect((select: any) => (canActivatePlugins ? select('core').getEntityRecords('root', 'plugin') : null), [canActivatePlugins]) as any[] | null | undefined;
    const [plugins, setPlugins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('popular');
    const [filter, setFilter] = useState('all');

    const slugs = useMemo(() => SLUGS.filter((s) => s !== slug), [slug]);

    useEffect(() => {
        let cancelled = false;
        fetch(ORG_API, { credentials: 'omit', mode: 'cors' })
            .then((r) => r.json())
            .then((data) => { if (!cancelled) setPlugins((data?.plugins || []).filter((p: any) => slugs.includes(p.slug))); })
            .catch(() => { if (!cancelled) setPlugins([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [slugs]);

    const withStatus = useMemo(() => plugins.map((p) => {
        const found = installed?.find((i) => typeof i?.plugin === 'string' && i.plugin.split('/')[0] === p.slug);
        const status: Status = found ? (found.status === 'active' ? 'activated' : 'installed') : 'notfound';
        return { plugin: p, path: found?.plugin as string | undefined, status };
    }), [plugins, installed]);

    const counts = {
        all: withStatus.length,
        active: withStatus.filter((p) => p.status === 'activated').length,
        inactive: withStatus.filter((p) => p.status === 'installed').length,
        available: withStatus.filter((p) => p.status === 'notfound').length,
    };

    const list = useMemo(() => {
        const q = search.trim().toLowerCase();
        const byFilter = { all: () => true, active: (s: Status) => s === 'activated', inactive: (s: Status) => s === 'installed', available: (s: Status) => s === 'notfound' } as Record<string, (s: Status) => boolean>;
        const out = withStatus.filter(({ plugin, status }) => byFilter[filter](status)
            && (!q || plugin.name.toLowerCase().includes(q) || (plugin.short_description || '').toLowerCase().includes(q)));
        if (sort === 'popular') out.sort((a, b) => (b.plugin.active_installs || 0) - (a.plugin.active_installs || 0));
        if (sort === 'rating') out.sort((a, b) => (b.plugin.rating || 0) - (a.plugin.rating || 0));
        if (sort === 'name') out.sort((a, b) => displayName(a.plugin.name).localeCompare(displayName(b.plugin.name)));
        return out;
    }, [withStatus, filter, search, sort]);

    const installedCount = counts.active + counts.inactive;
    const countChip = sprintf(/* translators: %d: number of plugins listed. */ _n('%d Plugin', '%d Plugins', counts.all, '3d-viewer'), counts.all);

    const chips = [
        { id: 'all', label: __('All', '3d-viewer'), width: 73 },
        { id: 'active', label: __('Active', '3d-viewer'), width: 90 },
        { id: 'inactive', label: __('Inactive', '3d-viewer'), width: 97 },
        { id: 'available', label: __('Available', '3d-viewer'), width: 104 },
    ];
    const sorts = [
        { id: 'popular', label: __('Popular', '3d-viewer'), Icon: Puzzle },
        { id: 'rating', label: __('Top Rated', '3d-viewer'), Icon: Star },
        { id: 'name', label: __('A–Z', '3d-viewer'), Icon: Blocks },
    ];

    return <>
        <section className='bp3d-dash-hero bp3d-dash-hero--wide bp3d-dash-hero--plugins'>
            <div className='bp3d-dash-hero__copy'>
                <span className='bp3d-dash-hero__eyebrow bp3d-dash-title'>{__('Made by bPlugins', '3d-viewer')}</span>
                <div className='bp3d-dash-hero__lede'>
                    <h1>{__('Discover more plugins from our team', '3d-viewer')}</h1>
                    <div>
                        <p className='bp3d-dash-text'>
                            {__('Hand-crafted WordPress plugins built with the same care and quality. Install any of them with a single click.', '3d-viewer')}
                        </p>
                        <div className='bp3d-dash-chips'>
                            <span className='bp3d-dash-chip' style={{ minWidth: 128 }}><Cuboid size={14} weight={1.5} /> {countChip}</span>
                            <span className='bp3d-dash-chip' style={{ minWidth: 122.5 }}><Zap size={14} weight={1.5} /> {__('One-Click Install', '3d-viewer')}</span>
                            <span className='bp3d-dash-chip' style={{ minWidth: 138.67 }}><CircleCheck size={14} weight={1.5} /> {__('Free on WordPress.org', '3d-viewer')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <HeroArt
                large
                blobs={[{ left: 477, top: -198.6 }, { left: 658.04, top: -66.11 }]}
                model={{ left: 541, top: 59.4 }}
                degree={{ left: 727.44, top: 72.04 }}
            >
                {canActivatePlugins && <div className='bp3d-dash-stats'>
                    <div className='bp3d-dash-stat'>
                        <span className='bp3d-dash-stat__icon'><Box size={20} weight={2} /></span>
                        <strong>{installedCount}</strong>
                        <span>{__('Installed', '3d-viewer')}</span>
                    </div>
                    <span className='bp3d-dash-stats__rule' />
                    <div className='bp3d-dash-stat'>
                        <span className='bp3d-dash-stat__icon bp3d-dash-stat__icon--on'><Power size={20} weight={2} /></span>
                        <strong>{counts.active}</strong>
                        <span>{__('Active', '3d-viewer')}</span>
                    </div>
                </div>}
            </HeroArt>
        </section>

        <div className='bp3d-dash-ext bp3d-dash-ext--plugins'>
            <div className='bp3d-dash-subnav'>
                <div className='bp3d-dash-subnav__tabs' role='group' aria-label={__('Sort plugins', '3d-viewer')}>
                    {sorts.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            type='button'
                            aria-pressed={sort === id}
                            className={sort === id ? 'bp3d-dash-subnav__tab bp3d-dash-subnav__tab--on' : 'bp3d-dash-subnav__tab'}
                            onClick={() => setSort(id)}
                        >
                            <Icon size={13.17} weight={1.5} /> {label}
                        </button>
                    ))}
                </div>
                <SearchField placeholder={__('Search plugins...', '3d-viewer')} label={__('Search plugins', '3d-viewer')} iconSize={13.17} weight={1.65} value={search} onChange={setSearch} />
            </div>

            <section className='bp3d-dash-shelf'>
                <div className='bp3d-dash-shelf__chips' role='group' aria-label={__('Filter plugins', '3d-viewer')}>
                    {chips.map((f) => (
                        <button
                            key={f.id}
                            type='button'
                            aria-pressed={f.id === filter}
                            className={f.id === filter ? 'bp3d-dash-count bp3d-dash-count--on' : 'bp3d-dash-count'}
                            style={{ minWidth: f.width }}
                            onClick={() => setFilter(f.id)}
                        >
                            {f.label} <span>{counts[f.id as keyof typeof counts]}</span>
                        </button>
                    ))}
                </div>

                <div className='bp3d-dash-shelf__grid'>
                    {loading && <p className='bp3d-dash-text bp3d-dash-loading' role='status'>{__('Fetching plugins from the WordPress directory…', '3d-viewer')}</p>}
                    {!loading && !list.length && <p className='bp3d-dash-text bp3d-dash-loading'>{__('No plugins match. Try a different keyword.', '3d-viewer')}</p>}
                    {list.map(({ plugin, path, status }) => <PluginCard key={plugin.slug} plugin={plugin} path={path} initStatus={status} caps={caps} />)}
                </div>
            </section>

            <aside className='bp3d-dash-exthelp'>
                <div className='bp3d-dash-exthelp__info'>
                    <span className='bp3d-dash-exthelp__lamp'><Lightbulb size={14.81} weight={1.65} /></span>
                    <div>
                        <h3 className='bp3d-dash-title'>{__('Looking for 3D Viewer extensions?', '3d-viewer')}</h3>
                        <p className='bp3d-dash-text'>
                            {__('Premium add-ons for 3D Viewer, each with its own license.', '3d-viewer')}{' '}
                            <a href={pages.docs} {...openInNewTab}>{__('Read the documentation', '3d-viewer')}</a>
                        </p>
                    </div>
                </div>
                {extensions ? (
                    <Link to='/extensions' className='bp3d-dash-btn bp3d-dash-btn--ghost'>
                        <span className='bp3d-dash-title'>{__('Open Extensions', '3d-viewer')}</span> <ArrowRight size={14} weight={1.5} />
                    </Link>
                ) : canManageOptions && (
                    <a href={links.extensions} className='bp3d-dash-btn bp3d-dash-btn--ghost'>
                        <span className='bp3d-dash-title'>{__('Open Extensions', '3d-viewer')}</span> <ArrowRight size={14} weight={1.5} />
                    </a>
                )}
            </aside>
        </div>
    </>;
};

export default OurPlugins;
