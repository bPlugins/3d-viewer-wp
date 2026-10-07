import { useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { BillingToggle, PriceLoading } from './Pricing';
import { SearchField, Tag } from './shared';
import { CircleCheck, Check, X, List } from './icons';
import { useProduct, cyclesOf, annualSaving, openCheckout, num, money, Cycle, Plan, Product } from './product';
import { planFeatures, Feature } from './features';

/* "Not included" is a plain X at the check's size; the file's shrunken circle-x reads as a dot. */
const Mark = ({ yes }: { yes: boolean }) => (yes
    ? <span className='bp3d-dash-yes' role='img' aria-label={__('Included', '3d-viewer')}><Check size={9.88} weight={2.47} /></span>
    : <span className='bp3d-dash-no' role='img' aria-label={__('Not included', '3d-viewer')}><X size={9.88} weight={2.47} /></span>);

const Tiers = ({ product, pro, cycle }: { product: Product; pro: Plan; cycle: Cycle }) => {
    const one = pro.pricing?.find((p) => p.licenses === 1) || pro.pricing?.[0];
    const amount = num(one?.[cycle]);
    const monthlyYear = num(one?.monthly) * 12;
    const per = { monthly: __('/ mo', '3d-viewer'), annual: __('/ yr', '3d-viewer'), lifetime: __('one-time', '3d-viewer') }[cycle];
    const save = annualSaving(pro);
    const saveLabel = sprintf(/* translators: %d: percentage saved by paying yearly. */ __('Save %d%%', '3d-viewer'), save);

    return <div className='bp3d-dash-tiers'>
        <article className='bp3d-dash-tier'>
            <div className='bp3d-dash-tier__top'>
                <Tag className='bp3d-dash-tag--tight' bg='#e6fbf3' color='#047857'>{__('Free', '3d-viewer')}</Tag>
                <div>
                    <h2>{__('Free', '3d-viewer')}</h2>
                    <p className='bp3d-dash-text'>{__('Essential features to get you started.', '3d-viewer')}</p>
                </div>
            </div>
            <div className='bp3d-dash-tier__price'>
                <span className='bp3d-dash-tier__amt'>$0</span>
                <span className='bp3d-dash-text'>{__('/ forever', '3d-viewer')}</span>
            </div>
            <div className='bp3d-dash-tier__note'>
                <CircleCheck size={19.75} weight={1.65} />
                <span className='bp3d-dash-text'>{__('Includes core 3D viewer mechanics', '3d-viewer')}</span>
            </div>
            <div className='bp3d-dash-btn bp3d-dash-tier__cta'>
                <Check size={13.17} weight={2.47} /> {__('You Already Have It', '3d-viewer')}
            </div>
        </article>

        <article className='bp3d-dash-tier bp3d-dash-tier--pro'>
            <div className='bp3d-dash-tier__top'>
                <Tag bg='rgba(255,255,255,.1)' color='#fff' className='bp3d-dash-tag--tight'>{pro.title}</Tag>
                <div>
                    <h2>{pro.title}</h2>
                    <p className='bp3d-dash-tier__desc'>{__('Advanced features and priority support for professionals.', '3d-viewer')}</p>
                </div>
            </div>
            <div className='bp3d-dash-tier__price'>
                <span className='bp3d-dash-tier__amt'>${Number.isFinite(amount) ? money(amount) : '—'}</span>
                <span className='bp3d-dash-tier__per'>{per}</span>
                {cycle === 'annual' && monthlyYear > amount && <>
                    <s className='bp3d-dash-tier__per'>${monthlyYear.toFixed(2)}</s>
                    {save > 0 && <span className='bp3d-dash-tier__save'>{saveLabel}</span>}
                </>}
            </div>
            <div className='bp3d-dash-tier__note'>
                <CircleCheck size={19.75} weight={1.65} />
                <span className='bp3d-dash-text'>{__('Unlocks all Pro features instantly', '3d-viewer')}</span>
            </div>
            <button type='button' className='bp3d-dash-btn bp3d-dash-tier__cta' onClick={() => openCheckout(product, pro, 1, cycle)}>
                {__('Get Pro Now →', '3d-viewer')}
            </button>
        </article>
    </div>;
};

const Compare = ({ freemius }: any) => {
    const { loading, product } = useProduct(freemius.product_id);
    const free = product?.plans?.find((p) => p.name === 'free');
    const pro = product?.plans?.find((p) => p.name === 'pro');
    const cycles = cyclesOf(pro);
    const [picked, setCycle] = useState<Cycle>('annual');
    const cycle: Cycle = cycles.includes(picked) ? picked : (cycles[0] || 'annual');
    const [query, setQuery] = useState('');

    // Rows follow Pro's list, free features first, exactly as the previous table sorted them.
    const rows = useMemo(() => {
        const inFree = new Set(planFeatures(free).map((f) => f.key));
        const all: (Feature & { free: boolean })[] = planFeatures(pro).map((f) => ({ ...f, free: inFree.has(f.key) }));
        return [...all.filter((r) => r.free), ...all.filter((r) => !r.free)];
    }, [free, pro]);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? rows.filter((r) => `${r.title} ${r.desc}`.toLowerCase().includes(q)) : rows;
    }, [rows, query]);

    const proOnly = rows.filter((r) => !r.free).length;
    const lede = sprintf(
        /* translators: %d: number of features only the Pro plan has. */
        _n('See exactly what unlocks when you upgrade. %d feature is exclusive to Pro.', 'See exactly what unlocks when you upgrade. %d features are exclusive to Pro.', proOnly, '3d-viewer'),
        proOnly
    );

    return <>
        <header className='bp3d-dash-intro bp3d-dash-intro--compare'>
            <span className='bp3d-dash-intro__badge'>{__('Feature Comparison', '3d-viewer')}</span>
            <h1>{__('Free vs Pro at a glance', '3d-viewer')}</h1>
            <p className='bp3d-dash-text'>{proOnly > 0 ? lede : __('See exactly what unlocks when you upgrade.', '3d-viewer')}</p>
            {cycles.length > 1 && <BillingToggle options={cycles} value={cycle} onChange={setCycle} save={annualSaving(pro)} />}
        </header>

        {product && pro
            ? <div>
                <Tiers product={product} pro={pro} cycle={cycle} />

                <section className='bp3d-dash-matrix'>
                    <div className='bp3d-dash-matrix__meta'>
                        <div>
                            <div className='bp3d-dash-matrix__title'>
                                <span className='bp3d-dash-matrix__glyph'><List size={11.52} weight={1.65} /></span>
                                <h2>{__('Feature Breakdown', '3d-viewer')}</h2>
                            </div>
                            <p className='bp3d-dash-text'>{__("Compare what's included in Free and Pro plans.", '3d-viewer')}</p>
                        </div>
                        <SearchField placeholder={__('Search features...', '3d-viewer')} label={__('Search features', '3d-viewer')} iconSize={13.17} weight={1.65} value={query} onChange={setQuery} />
                    </div>

                    <div className='bp3d-dash-table' role='table' aria-label={__('Free vs Pro features', '3d-viewer')}>
                        <div className='bp3d-dash-table__row bp3d-dash-table__head' role='row'>
                            <span className='bp3d-dash-table__feat bp3d-dash-text' role='columnheader'>{__('FEATURE', '3d-viewer')}</span>
                            <span className='bp3d-dash-table__col bp3d-dash-text' role='columnheader'>{__('FREE', '3d-viewer')}</span>
                            <span className='bp3d-dash-table__pro bp3d-dash-text' role='columnheader'>{__('PRO', '3d-viewer')}</span>
                        </div>
                        {shown.map((r) => (
                            <div key={r.key} className='bp3d-dash-table__row' role='row'>
                                <div className='bp3d-dash-table__feat' role='cell'>
                                    <div className='bp3d-dash-table__name'>
                                        <span className='bp3d-dash-title'>{r.title}</span>
                                        {!r.free && <Tag className='bp3d-dash-tag--tight' bg='#f3f6ff' color='#1b5cf0'>{__('Pro only', '3d-viewer')}</Tag>}
                                    </div>
                                    {r.desc && <p className='bp3d-dash-text'>{r.desc}</p>}
                                </div>
                                <span className='bp3d-dash-table__col' role='cell'><Mark yes={r.free} /></span>
                                <span className='bp3d-dash-table__col' role='cell'><Mark yes /></span>
                            </div>
                        ))}
                        {!shown.length && <div className='bp3d-dash-table__row' role='row'>
                            <span className='bp3d-dash-text' role='cell'>{__('No features match your search.', '3d-viewer')}</span>
                        </div>}
                    </div>
                </section>
            </div>
            : <PriceLoading loading={loading} />}
    </>;
};

export default Compare;
