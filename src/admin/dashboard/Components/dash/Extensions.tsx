import { createInterpolateElement, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { HeroArt, SearchField, Tag, openInNewTab, useModalFocus } from './shared';
import { ArrowRight, Box, CircleCheck, CircleX, Cuboid, ExternalLink, Lightbulb, Power, Puzzle, RefreshCw, ShoppingCart, X, Zap } from './icons';
import type { ExtensionItem, ExtensionsData } from '../../utils/data';
import './screens.scss';
import './Extensions.scss';

/*
 * The design's Extensions tab, driven by the bundled extension manager (vendor/bp-extension-manager):
 * the list, enable/disable, install, extension licences and checkout, without leaving the dashboard.
 */

type Notice = { id: number; kind: 'success' | 'warning' | 'error'; text: string; reload?: boolean };
type Filter = 'all' | 'active' | 'inactive' | 'available';

// The last list the server sent; a return visit to the tab starts from it, not from the page-load copy.
let latestItems: ExtensionItem[] | null = null;

// BPEM's own extraction: the key sits in different places depending on the checkout version.
const purchasedKey = (response: any): string => {
    for (const source of [response?.license, response?.purchase?.license, response?.purchase, response]) {
        for (const field of ['secret_key', 'license_key', 'key']) {
            const value = source?.[field];
            if (typeof value === 'string' && value.trim()) return value.trim();
        }
    }
    return '';
};

const isActive = (e: ExtensionItem) => (e.installed && e.status === 'active') || (!e.installed && Boolean(e.plugin_active));

const MATCH: Record<Filter, (e: ExtensionItem) => boolean> = {
    all: () => true,
    active: isActive,
    inactive: (e) => e.installed && e.status !== 'active',
    available: (e) => !e.installed && !e.plugin_active,
};

// Freemius' overlay script loads on the first Buy click instead of with the page.
let checkoutScript: Promise<void> | null = null;
const loadCheckout = () => {
    checkoutScript = checkoutScript || new Promise<void>((resolve, reject) => {
        const el = document.createElement('script');
        el.src = 'https://checkout.freemius.com/checkout.min.js';
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => {
            checkoutScript = null;
            el.remove();
            reject(new Error('checkout'));
        };
        document.head.appendChild(el);
    });
    return checkoutScript;
};

const checkoutOf = (e: ExtensionItem) => (Array.isArray(e.checkout) ? null : (e.checkout?.plugin_id && e.checkout?.public_key ? e.checkout : null));

// Only http(s) or root-relative links from the catalogue reach an href or src.
const safeUrl = (url?: string) => {
    if (!url) return '';
    try {
        const parsed = new URL(url, window.location.origin);
        return /^https?:$/.test(parsed.protocol) ? parsed.href : '';
    } catch (_e) {
        return '';
    }
};

const badge = (e: ExtensionItem, isMaxPlan: boolean): { label: string; tone: string } => {
    if (!e.installed) {
        if (e.plugin_active) return { label: __('Active', '3d-viewer'), tone: 'success' };
        if (e.plugin_present) return { label: __('Installed', '3d-viewer'), tone: 'muted' };
        if (e.premium_host_only) return { label: __('Pro', '3d-viewer'), tone: 'pro' };
        return e.is_paid ? { label: __('Premium', '3d-viewer'), tone: 'pro' } : { label: __('Free', '3d-viewer'), tone: 'free' };
    }
    if (e.max_plan || isMaxPlan) {
        if (e.status === 'active') return { label: __('Active', '3d-viewer'), tone: 'success' };
    }
    return ({
        active: { label: __('Active', '3d-viewer'), tone: 'success' },
        disabled: { label: __('Inactive', '3d-viewer'), tone: 'muted' },
        incompatible: { label: __('Incompatible', '3d-viewer'), tone: 'error' },
        missing_dependency: { label: __('Missing dependency', '3d-viewer'), tone: 'warning' },
        unlicensed: e.premium_host_only ? { label: __('Inactive', '3d-viewer'), tone: 'muted' } : { label: __('Unlicensed', '3d-viewer'), tone: 'warning' },
        error: { label: __('Error', '3d-viewer'), tone: 'error' },
    } as Record<string, { label: string; tone: string }>)[e.status] || { label: e.status, tone: 'muted' };
};

const message = (e: any, fallback: string) => e?.message || fallback;

const Extensions = ({ extensions, pages }: any) => {
    const data = extensions as ExtensionsData;
    const [items, setItemsState] = useState<ExtensionItem[]>(latestItems || data.items || []);
    const setItems = (next: ExtensionItem[] | ((list: ExtensionItem[]) => ExtensionItem[])) => setItemsState((list) => {
        const value = typeof next === 'function' ? next(list) : next;
        latestItems = value;
        return value;
    });
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState<Record<string, string>>({});
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [notices, setNotices] = useState<Notice[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reloadPrompt, setReloadPrompt] = useState<string | null>(null);
    const noticeId = useRef(0);
    // Only the newest list request may write; an older one would undo a toggle saved after it started.
    const listRequest = useRef(0);

    const notify = (kind: Notice['kind'], text: string, reload = false) => {
        const id = ++noticeId.current;
        setNotices((list) => [...list.filter((n) => !(reload && n.reload)), { id, kind, text, reload }].slice(-4));
        if (kind === 'success' && !reload) window.setTimeout(() => setNotices((list) => list.filter((n) => n.id !== id)), 5000);
    };

    const setBusyFor = (id: string, what: string) => setBusy((b) => {
        const next = { ...b };
        if (what) next[id] = what; else delete next[id];
        return next;
    });

    const refetch = async () => {
        const id = ++listRequest.current;
        setRefreshing(true);
        try {
            const list = await apiFetch<ExtensionItem[]>({ path: `${data.restPath}/extensions` });
            if (id === listRequest.current) setItems(list);
        } catch (e) {
            if (id === listRequest.current) notify('error', message(e, __('Could not load the extensions list.', '3d-viewer')));
        } finally {
            if (id === listRequest.current) setRefreshing(false);
        }
    };

    // The page-load list paints first; the server's current one replaces it.
    useEffect(() => { refetch(); }, []);

    const reloadNotice = (ext: ExtensionItem, enabled: boolean) => {
        if (!ext.reload) return;
        const text = enabled
            ? sprintf(/* translators: %s: extension name. */ __('%s enabled. Reload the page for this to take effect.', '3d-viewer'), ext.name)
            : sprintf(/* translators: %s: extension name. */ __('%s disabled. Reload the page for this to take effect.', '3d-viewer'), ext.name);
        if (ext.reload === 'auto') setReloadPrompt(text);
        else notify('warning', text, true);
    };

    const toggle = async (ext: ExtensionItem) => {
        const enabled = !ext.enabled;
        listRequest.current++;
        setRefreshing(false);
        setBusyFor(ext.id, 'toggle');
        setItems((list) => list.map((e) => (e.id === ext.id ? { ...e, enabled } : e)));
        try {
            const row = await apiFetch<ExtensionItem>({ path: `${data.restPath}/extensions/${ext.id}/toggle`, method: 'POST', data: { enabled } });
            setItems((list) => list.map((e) => (e.id === ext.id ? row : e)));
            reloadNotice(row, enabled);
        } catch (e) {
            setItems((list) => list.map((x) => (x.id === ext.id ? { ...x, enabled: !enabled } : x)));
            notify('error', message(e, __('The change could not be saved.', '3d-viewer')));
        } finally {
            setBusyFor(ext.id, '');
        }
    };

    // POST /install also activates a plugin that is already on disk; a fresh download needs a second call.
    const install = async (ext: ExtensionItem, licenseKey?: string, fromPurchase = false) => {
        setBusyFor(ext.id, ext.plugin_present ? 'activate' : 'install');
        try {
            const call = () => apiFetch<{ success: boolean; status: string; message?: string }>({
                path: `${data.restPath}/extensions/${ext.id}/install`,
                method: 'POST',
                data: licenseKey ? { license_key: licenseKey } : {},
            });
            let res = await call();
            if (!res.success) throw new Error(res.message);
            if (res.status === 'installed' && fromPurchase) res = await call();
            notify(res.status === 'active' ? 'success' : 'warning', res.status === 'active'
                ? sprintf(/* translators: %s: extension name. */ __('%s is installed and active.', '3d-viewer'), ext.name)
                : res.message || sprintf(/* translators: %s: extension name. */ __('%s is installed. Activate it to use it.', '3d-viewer'), ext.name), res.status === 'active');
            await refetch();
        } catch (e) {
            notify('error', message(e, sprintf(/* translators: %s: extension name. */ __('%s could not be installed.', '3d-viewer'), ext.name)));
        } finally {
            setBusyFor(ext.id, '');
        }
    };

    const license = async (ext: ExtensionItem, op: 'activate' | 'deactivate' | 'sync', licenseKey = '') => {
        setBusyFor(ext.id, `license-${op}`);
        try {
            const body = new FormData();
            body.append('action', data.licenseAction);
            body.append('_wpnonce', data.ajaxNonce);
            body.append('ext_id', ext.id);
            body.append('op', op);
            if (licenseKey) body.append('license_key', licenseKey);
            const res = await fetch(data.ajaxUrl, { method: 'POST', credentials: 'same-origin', body });
            const json = await res.json().catch(() => null);
            if (!json?.success) throw new Error(json?.data?.message || __('The license request failed.', '3d-viewer'));
            const status = json.data?.status;
            if (op === 'deactivate') notify('success', __('License deactivated.', '3d-viewer'));
            else if (status === 'licensed') notify('success', __('License activated.', '3d-viewer'));
            else if (status === 'expired') notify('warning', __('This license has expired. Renew it to activate the extension.', '3d-viewer'));
            else if (op === 'activate') notify('error', __('That key could not be activated. Check it and try again.', '3d-viewer'));
            else notify('warning', json.data?.message || __('The license is not active yet. Reload if it does not appear.', '3d-viewer'));
            // A rejected key stays in the field so it can be corrected.
            if (op === 'deactivate' || status === 'licensed') setKeys((k) => ({ ...k, [ext.id]: '' }));
            await refetch();
        } catch (e) {
            notify('error', message(e, __('The license request failed.', '3d-viewer')));
        } finally {
            setBusyFor(ext.id, '');
        }
    };

    // Freemius' overlay, as on the extension manager's own page.
    const buy = async (ext: ExtensionItem) => {
        const params = checkoutOf(ext);
        let awaited = false;
        if (data.checkoutEnabled && params && data.canInstall && !(window as any).FS?.Checkout) {
            awaited = true;
            setBusyFor(ext.id, 'buy');
            await loadCheckout().catch(() => null);
            setBusyFor(ext.id, '');
        }
        const FS = (window as any).FS;
        if (!data.checkoutEnabled || !params || !FS?.Checkout) {
            const url = safeUrl(ext.meta?.homepage_url);
            if (!url) {
                notify('error', __('Checkout is unavailable.', '3d-viewer'));
            } else if (!awaited) {
                window.open(url, '_blank', 'noopener');
            } else {
                // After the await the click no longer counts as a user gesture, so a new tab may be blocked.
                const tab = window.open(url, '_blank');
                if (tab) tab.opener = null;
                else window.location.assign(url);
            }
            return;
        }
        let finished = false;
        const cfg = { plugin_id: params.plugin_id, public_key: params.public_key, ...(params.plan_id ? { plan_id: params.plan_id } : {}), ...(params.pricing_id ? { pricing_id: params.pricing_id } : {}) };
        const complete = (response: any) => {
            if (finished) return;
            finished = true;
            const key = purchasedKey(response);
            if (ext.installed) {
                if (key) license(ext, 'activate', key); else license(ext, 'sync');
            } else {
                install(ext, key || undefined, true);
            }
        };
        try {
            const handler = typeof FS.Checkout.configure === 'function' ? FS.Checkout.configure(cfg) : new FS.Checkout(cfg);
            setBusyFor(ext.id, 'buy');
            handler.open({
                name: ext.name,
                licenses: 1,
                user_email: data.buyer?.email,
                user_firstname: data.buyer?.first,
                user_lastname: data.buyer?.last,
                purchaseCompleted: complete,
                success: complete,
                cancel: () => setBusyFor(ext.id, ''),
            });
            window.setTimeout(() => setBusyFor(ext.id, ''), 1500);
        } catch (_e) {
            setBusyFor(ext.id, '');
            notify('error', __('Checkout failed to open.', '3d-viewer'));
        }
    };

    const counts = useMemo(() => ({
        all: items.length,
        active: items.filter(MATCH.active).length,
        inactive: items.filter(MATCH.inactive).length,
        available: items.filter(MATCH.available).length,
    }), [items]);

    const list = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((e) => MATCH[filter](e) && (!q || e.name.toLowerCase().includes(q) || (e.meta?.short_description || '').toLowerCase().includes(q)));
    }, [items, filter, search]);

    const installedCount = items.filter((e) => e.installed).length;
    const countChip = sprintf(/* translators: %d: number of extensions. */ _n('%d Extension', '%d Extensions', counts.all, '3d-viewer'), counts.all);
    const anyBusy = Object.keys(busy).length > 0;

    const chips: { id: Filter; label: string; width: number }[] = [
        { id: 'all', label: __('All', '3d-viewer'), width: 73 },
        { id: 'active', label: __('Active', '3d-viewer'), width: 90 },
        { id: 'inactive', label: __('Inactive', '3d-viewer'), width: 97 },
        { id: 'available', label: __('Available', '3d-viewer'), width: 104 },
    ];

    return <>
        <section className='bp3d-dash-hero bp3d-dash-hero--wide bp3d-dash-hero--extensions'>
            <div className='bp3d-dash-hero__copy'>
                <span className='bp3d-dash-hero__eyebrow bp3d-dash-title'>{__('Extensions', '3d-viewer')}</span>
                <div className='bp3d-dash-hero__lede'>
                    <h1>{__('Supercharge Your 3D Viewer', '3d-viewer')}</h1>
                    <div>
                        <p className='bp3d-dash-text'>
                            {__('Extend 3D Viewer with powerful add-ons. Each extension manages its own license independently.', '3d-viewer')}
                        </p>
                        <div className='bp3d-dash-chips'>
                            <span className='bp3d-dash-chip' style={{ minWidth: 128 }}><Cuboid size={14} weight={1.5} /> {countChip}</span>
                            <span className='bp3d-dash-chip' style={{ minWidth: 122.5 }}><Zap size={14} weight={1.5} /> {__('One-Click Install', '3d-viewer')}</span>
                            <span className='bp3d-dash-chip' style={{ minWidth: 138.67 }}><CircleCheck size={14} weight={1.5} /> {data.isMaxPlan ? __('Included in Max', '3d-viewer') : __('Own License Each', '3d-viewer')}</span>
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
                <div className='bp3d-dash-stats'>
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
                </div>
            </HeroArt>
        </section>

        <div className='bp3d-dash-ext bp3d-dash-ext--extensions'>
            <div className='bp3d-dash-subnav'>
                <div className='bp3d-dash-subnav__tabs'>
                    <span className='bp3d-dash-subnav__tab bp3d-dash-subnav__tab--on'><Puzzle size={13.17} weight={1.5} /> {__('Extensions', '3d-viewer')}</span>
                    <button type='button' className='bp3d-dash-subnav__tab bp3d-ext__refresh' onClick={refetch} disabled={refreshing || anyBusy} aria-busy={refreshing}>
                        {refreshing ? <span className='bp3d-x-spinner' /> : <RefreshCw size={13.17} weight={1.5} />} {__('Refresh', '3d-viewer')}
                    </button>
                </div>
                <SearchField placeholder={__('Search extensions...', '3d-viewer')} label={__('Search extensions', '3d-viewer')} iconSize={13.17} weight={1.65} value={search} onChange={setSearch} />
            </div>

            <div className='bp3d-x-notices' aria-live='polite'>
                {notices.map((n) => <div key={n.id} className={`bp3d-x-notice bp3d-x-notice--${n.kind}`} role={n.kind === 'error' ? 'alert' : 'status'}>
                    {n.kind === 'error' ? <CircleX size={16} weight={1.75} /> : <CircleCheck size={16} weight={1.75} />}
                    <span>{n.text}</span>
                    {n.reload && <button type='button' className='bp3d-x-notice__action' onClick={() => window.location.reload()}>{__('Reload now', '3d-viewer')}</button>}
                    <button type='button' className='bp3d-x-notice__close' aria-label={__('Dismiss', '3d-viewer')} onClick={() => setNotices((l) => l.filter((x) => x.id !== n.id))}><X size={14} weight={2} /></button>
                </div>)}
            </div>

            <section className='bp3d-dash-shelf'>
                <div className='bp3d-dash-shelf__chips' role='group' aria-label={__('Filter extensions', '3d-viewer')}>
                    {chips.map((f) => (
                        <button
                            key={f.id}
                            type='button'
                            aria-pressed={f.id === filter}
                            className={f.id === filter ? 'bp3d-dash-count bp3d-dash-count--on' : 'bp3d-dash-count'}
                            style={{ minWidth: f.width }}
                            onClick={() => setFilter(f.id)}
                        >
                            {f.label} <span>{counts[f.id]}</span>
                        </button>
                    ))}
                </div>

                <div className='bp3d-dash-shelf__grid'>
                    {refreshing && !items.length && [0, 1, 2].map((i) => <div key={i} className='bp3d-ext__skel' aria-hidden='true'>
                        <span className='bp3d-x-skel bp3d-ext__skel-shot' />
                        <span className='bp3d-x-skel' style={{ width: '60%', height: 16 }} />
                        <span className='bp3d-x-skel' style={{ width: '90%', height: 12 }} />
                        <span className='bp3d-x-skel' style={{ height: 38, marginTop: 'auto' }} />
                    </div>)}
                    {!refreshing && !list.length && <p className='bp3d-dash-text bp3d-dash-loading'>
                        {items.length ? __('No extensions match. Try a different filter or keyword.', '3d-viewer') : __('No extensions are available yet.', '3d-viewer')}
                    </p>}
                    {list.map((ext) => <ExtensionCard
                        key={ext.id}
                        ext={ext}
                        data={data}
                        busy={busy[ext.id] || ''}
                        licenseKey={keys[ext.id] || ''}
                        onKey={(v) => setKeys((k) => ({ ...k, [ext.id]: v }))}
                        onToggle={() => toggle(ext)}
                        onInstall={() => install(ext)}
                        onBuy={() => buy(ext)}
                        onLicense={(op) => license(ext, op, op === 'activate' ? (keys[ext.id] || '').trim() : '')}
                    />)}
                </div>
            </section>

            <aside className='bp3d-dash-exthelp'>
                <div className='bp3d-dash-exthelp__info'>
                    <span className='bp3d-dash-exthelp__lamp'><Lightbulb size={14.81} weight={1.65} /></span>
                    <div>
                        <h3 className='bp3d-dash-title'>{__('Need help with extensions?', '3d-viewer')}</h3>
                        <p className='bp3d-dash-text'>
                            {createInterpolateElement(__('Check out our <a>documentation</a> or contact our support team for assistance.', '3d-viewer'), {
                                a: <a href={pages?.docs} {...openInNewTab} />,
                            })}
                        </p>
                    </div>
                </div>
                <a href={pages?.docs} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--ghost'>
                    <span className='bp3d-dash-title'>{__('View Docs', '3d-viewer')}</span> <ExternalLink size={14} weight={1.5} />
                </a>
            </aside>
        </div>

        {reloadPrompt && <ReloadDialog
            text={reloadPrompt}
            onLater={() => { notify('warning', reloadPrompt, true); setReloadPrompt(null); }}
        />}
    </>;
};

const ReloadDialog = ({ text, onLater }: { text: string; onLater: () => void }) => {
    const panel = useRef<HTMLDivElement>(null);
    const reloadButton = useRef<HTMLButtonElement>(null);
    useModalFocus(panel, onLater, reloadButton);

    return <div className='bp3d-x-modal' role='presentation'>
        <div ref={panel} className='bp3d-x-confirm bp3d-x-modal__panel' role='dialog' aria-modal='true' aria-labelledby='bp3d-ext-reload-title'>
            <strong id='bp3d-ext-reload-title'>{__('Reload required', '3d-viewer')}</strong>
            <p>{text}</p>
            <div className='bp3d-x-confirm__actions'>
                <button type='button' className='bp3d-x-btn bp3d-x-btn--sm' onClick={onLater}>{__('Later', '3d-viewer')}</button>
                <button type='button' ref={reloadButton} className='bp3d-x-btn bp3d-x-btn--sm bp3d-x-btn--primary' onClick={() => window.location.reload()}>{__('Reload now', '3d-viewer')}</button>
            </div>
        </div>
    </div>;
};

interface CardProps {
    ext: ExtensionItem;
    data: ExtensionsData;
    busy: string;
    licenseKey: string;
    onKey: (value: string) => void;
    onToggle: () => void;
    onInstall: () => void;
    onBuy: () => void;
    onLicense: (op: 'activate' | 'deactivate') => void;
}

const ExtensionCard = ({ ext, data, busy, licenseKey, onKey, onToggle, onInstall, onBuy, onLicense }: CardProps) => {
    const { label, tone } = badge(ext, data.isMaxPlan);
    const icon = safeUrl(ext.meta?.icon_url);
    const learn = safeUrl(ext.meta?.homepage_url);
    const author = ext.meta?.author;
    const authorUrl = safeUrl(ext.meta?.author_url);
    const blocked = ext.premium_host_only && !ext.licensed;
    const missing = ext.missing_plugins || [];
    const description = ext.meta?.short_description
        || (ext.premium_host_only ? __('Requires a Pro license.', '3d-viewer') : ext.is_paid ? __('Premium add-on.', '3d-viewer') : __('Free add-on.', '3d-viewer'));
    const licensePanel = ext.installed && ext.is_paid && !ext.max_plan && !data.isMaxPlan;
    const isBusy = Boolean(busy);

    const learnMore = learn && <a href={learn} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--ghost'>
        <ExternalLink size={14} weight={1.75} /> {__('Learn More', '3d-viewer')}
    </a>;

    let cta = null;
    if (!ext.installed) {
        if (ext.plugin_active) {
            cta = <span className='bp3d-dash-btn bp3d-ext__done'><CircleCheck size={14} weight={1.75} /> {__('Active', '3d-viewer')}</span>;
        } else if (ext.plugin_present) {
            cta = <button type='button' className='bp3d-dash-btn bp3d-dash-btn--primary bp3d-dash-extcard__cta' disabled={isBusy || blocked || missing.length > 0} onClick={onInstall}>
                {busy === 'activate' ? <><span className='bp3d-x-spinner' /> {__('Activating…', '3d-viewer')}</> : __('Activate', '3d-viewer')}
            </button>;
        } else if (ext.is_paid && !ext.licensed) {
            const price = ext.available?.price_label;
            cta = <button type='button' className='bp3d-dash-btn bp3d-dash-btn--primary bp3d-dash-extcard__cta' disabled={isBusy} onClick={onBuy}>
                {busy ? <><span className='bp3d-x-spinner' /> {__('Processing…', '3d-viewer')}</> : <><ShoppingCart size={14} weight={1.75} /> {price
                    ? sprintf(/* translators: %s: price, e.g. $49. */ __('Buy Now · %s', '3d-viewer'), price) : __('Buy Now', '3d-viewer')} <ArrowRight size={14} weight={1.75} /></>}
            </button>;
        } else if (data.canInstall) {
            cta = <button type='button' className='bp3d-dash-btn bp3d-dash-btn--primary bp3d-dash-extcard__cta' disabled={isBusy || blocked || missing.length > 0} onClick={onInstall}>
                {busy === 'install' ? <><span className='bp3d-x-spinner' /> {__('Installing…', '3d-viewer')}</> : <>{__('Install', '3d-viewer')} <ArrowRight size={14} weight={1.75} /></>}
            </button>;
        }
    }

    return <article className='bp3d-dash-extcard'>
        <div className='bp3d-dash-extcard__shot'>
            {icon ? <img src={icon} alt='' /> : <span className='bp3d-ext__glyph'><Puzzle size={44} weight={1.25} /></span>}
            <Tag className={`bp3d-ext__badge bp3d-ext__badge--${tone}`}>{label}</Tag>
        </div>

        <div className='bp3d-dash-extcard__body'>
            <div className='bp3d-dash-extcard__head'>
                <span className='bp3d-dash-extcard__icon'><Box size={20} weight={1.75} /></span>
                <div>
                    <h3 className='bp3d-dash-title'>{ext.name}</h3>
                    <div className='bp3d-dash-extcard__by'>
                        {ext.version && <span className='bp3d-dash-extcard__ver'>v{ext.version}</span>}
                        {author && <span className='bp3d-dash-extcard__author'>
                            {createInterpolateElement(sprintf(/* translators: %s: extension author, e.g. bPlugins. */ __('by %s', '3d-viewer'), '<author/>'), {
                                author: authorUrl ? <a href={authorUrl} {...openInNewTab}>{author} <ExternalLink size={12} weight={1.75} /></a> : <>{author}</>,
                            })}
                        </span>}
                    </div>
                </div>
            </div>
            <p className='bp3d-dash-text'>{description}</p>

            {missing.length > 0 && <p className='bp3d-ext__warn'>
                {__('Requires:', '3d-viewer')}{' '}
                {missing.map((m, i) => <span key={m.slug || m.name}>
                    {i > 0 && ', '}
                    {m.name}{m.action && safeUrl(m.url) && <> (<a href={safeUrl(m.url)}>{m.action === 'activate' ? __('Activate', '3d-viewer') : __('Install', '3d-viewer')}</a>)</>}
                </span>)}
            </p>}
            {blocked && <p className='bp3d-ext__warn'>{__('Available with a 3D Viewer Pro license.', '3d-viewer')}</p>}

            {ext.installed ? <div className='bp3d-ext__manage'>
                <div className='bp3d-ext__switchrow'>
                    <span>{ext.enabled ? __('Enabled', '3d-viewer') : __('Disabled', '3d-viewer')}</span>
                    <button
                        type='button'
                        role='switch'
                        aria-checked={ext.enabled}
                        aria-label={sprintf(/* translators: %s: extension name. */ __('Enable %s', '3d-viewer'), ext.name)}
                        className={`bp3d-x-switch${busy === 'toggle' ? ' is-busy' : ''}`}
                        disabled={isBusy || (!ext.enabled && (!ext.compatible || missing.length > 0 || !ext.licensed))}
                        onClick={onToggle}
                    >
                        {busy === 'toggle' && <span className='bp3d-x-spinner' />}
                    </button>
                </div>

                {licensePanel && (ext.licensed ? <div className='bp3d-dash-extcard__actions'>
                    {learnMore}
                    <button type='button' className='bp3d-x-btn bp3d-x-btn--danger bp3d-ext__btn' disabled={isBusy} onClick={() => onLicense('deactivate')}>
                        {busy === 'license-deactivate' && <span className='bp3d-x-spinner' />} {__('Deactivate license', '3d-viewer')}
                    </button>
                </div> : <div className='bp3d-ext__license'>
                    <form className='bp3d-ext__keyrow' onSubmit={(e) => { e.preventDefault(); if (licenseKey.trim()) onLicense('activate'); }}>
                        <div className='bp3d-x-field bp3d-x-field--sm'>
                            <input
                                type='text'
                                aria-label={sprintf(/* translators: %s: extension name. */ __('License key for %s', '3d-viewer'), ext.name)}
                                placeholder={__('Enter license key', '3d-viewer')}
                                autoComplete='off'
                                value={licenseKey}
                                readOnly={isBusy}
                                onChange={(e) => onKey(e.target.value)}
                            />
                        </div>
                        <button type='submit' className='bp3d-x-btn bp3d-x-btn--primary bp3d-x-btn--sm bp3d-ext__activate' disabled={isBusy || !licenseKey.trim()}>
                            {busy === 'license-activate' ? <span className='bp3d-x-spinner' /> : __('Activate', '3d-viewer')}
                        </button>
                    </form>
                    <div className='bp3d-dash-extcard__actions'>
                        {learnMore}
                        {checkoutOf(ext) && <button type='button' className='bp3d-dash-btn bp3d-dash-btn--primary bp3d-dash-extcard__cta' disabled={isBusy} onClick={onBuy}>
                            {busy === 'buy' ? <><span className='bp3d-x-spinner' /> {__('Processing…', '3d-viewer')}</> : <><ShoppingCart size={14} weight={1.75} /> {__('Buy license', '3d-viewer')}</>}
                        </button>}
                    </div>
                </div>)}

                {!licensePanel && learnMore && <div className='bp3d-dash-extcard__actions'>{learnMore}</div>}
                {!licensePanel && ext.max_plan && ext.is_paid && <p className='bp3d-ext__note'><CircleCheck size={13} weight={1.75} /> {__('Included in your Max plan.', '3d-viewer')}</p>}
            </div> : (learnMore || cta) && <div className='bp3d-dash-extcard__actions'>
                {learnMore}
                {cta}
            </div>}
        </div>
    </article>;
};

export default Extensions;
