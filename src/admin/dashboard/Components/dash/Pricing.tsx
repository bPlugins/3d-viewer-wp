import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Star, Check, ArrowRight, ShieldCheck, RefreshCw, Headset, Lock, ChevronUp, ChevronDown } from './icons';
import { useProduct, cyclesOf, cycleLabel, annualSaving, openCheckout, num, money, Cycle, Plan, Product } from './product';
import { planFeatures, planBlurb } from './features';

export const BillingToggle = ({ options, value, onChange, save }: { options: Cycle[]; value: Cycle; onChange: (c: Cycle) => void; save: number }) => {
    const saveLabel = save > 0 ? sprintf(/* translators: %d: percentage saved by paying yearly. */ __('Save %d%%', '3d-viewer'), save) : '';

    return <div className={`bp3d-dash-billing bp3d-dash-billing--${options.length}`} role='radiogroup' aria-label={__('Billing period', '3d-viewer')}>
        {options.map((o) => (
            <button
                key={o}
                type='button'
                role='radio'
                aria-checked={o === value}
                className={`bp3d-dash-billing__opt bp3d-dash-billing__opt--${o === 'annual' ? 'yearly' : o}${o === value ? ' bp3d-dash-billing__opt--on' : ''}`}
                onClick={() => onChange(o)}
            >
                {cycleLabel(o)}
                {o === 'annual' && saveLabel && <span className='bp3d-dash-billing__save'>{saveLabel}</span>}
            </button>
        ))}
    </div>;
};

export const sitesLabel = (licenses: number | null): string => {
    if (!licenses) return __('Unlimited Sites', '3d-viewer');
    if (licenses === 1) return __('Single Site', '3d-viewer');
    return sprintf(/* translators: %d: number of sites a licence covers. */ _n('%d Site', '%d Sites', licenses, '3d-viewer'), licenses);
};

const PlanCard = ({ product, plan, cycle, licenses, featured, logo }: { product: Product; plan: Plan; cycle: Cycle; licenses: (number | null)[]; featured: boolean; logo: string }) => {
    const [site, setSite] = useState<number | null>(licenses[0] ?? 1);
    const price = plan.pricing?.find((p) => (p.licenses ?? null) === site);
    const amount = num(price?.[cycle]);
    const monthlyYear = num(price?.monthly) * 12;
    const perSite = site && site > 1 ? amount / site : 0;
    const isMax = plan.name === 'max';

    const per = { monthly: __('/ mo', '3d-viewer'), annual: __('/ yr', '3d-viewer'), lifetime: __('one-time', '3d-viewer') }[cycle];
    const saveLabel = sprintf(/* translators: %s: amount saved, e.g. $12. */ __('Save %s', '3d-viewer'), `$${Math.round(monthlyYear - amount)}`);
    const billedYearly = sprintf(/* translators: %s: the yearly price divided by twelve, e.g. $5.00. */ __('Billed yearly • %s/mo', '3d-viewer'), `$${(amount / 12).toFixed(2)}`);
    const perSiteLabel = sprintf(/* translators: %s: price per site, e.g. $36.00. */ __('≈ %s per site', '3d-viewer'), `$${perSite.toFixed(2)}`);
    const note = {
        monthly: __('Billed monthly, cancel anytime.', '3d-viewer'),
        annual: billedYearly,
        lifetime: __('One-time payment, pay once forever.', '3d-viewer'),
    }[cycle];

    return <article className={isMax ? 'bp3d-dash-plan bp3d-dash-plan--max' : 'bp3d-dash-plan'}>
        <header className='bp3d-dash-plan__head'>
            {featured
                ? <span className='bp3d-dash-plan__flag'><Star size={11.1} weight={1.5} /> {__('Most Popular', '3d-viewer')}</span>
                : <span className='bp3d-dash-plan__flag bp3d-dash-plan__flag--blank' aria-hidden='true' />}
            <h2>{plan.title}</h2>
            <p className='bp3d-dash-text'>{planBlurb(plan)}</p>
        </header>

        {licenses.length > 1 && <div className='bp3d-dash-sites' role='radiogroup' aria-label={__('Number of sites', '3d-viewer')}>
            {licenses.map((l) => (
                <button
                    key={String(l)}
                    type='button'
                    role='radio'
                    aria-checked={l === site}
                    className={l === site ? 'bp3d-dash-sites__on' : undefined}
                    onClick={() => setSite(l)}
                >
                    {sitesLabel(l)}
                </button>
            ))}
        </div>}

        <div className='bp3d-dash-price'>
            <div className='bp3d-dash-price__main'>
                <span className='bp3d-dash-price__cur'>$</span>
                <span className='bp3d-dash-price__amt'>{Number.isFinite(amount) ? money(amount) : '—'}</span>
                <span className='bp3d-dash-price__per'>{per}</span>
            </div>
            {cycle === 'annual' && monthlyYear > amount && <div className='bp3d-dash-price__was'>
                <s>${monthlyYear.toFixed(2)}</s>
                <span>{__('if paid monthly', '3d-viewer')}</span>
                <span className='bp3d-dash-price__save'>{saveLabel}</span>
            </div>}
            <p className='bp3d-dash-text'>{note}{perSite > 0 && ` • ${perSiteLabel}`}</p>
        </div>

        <div className='bp3d-dash-plan__rule' aria-hidden='true' />

        <ul className='bp3d-dash-plan__feats'>
            {planFeatures(plan).map((f) => (
                <li key={f.key} className='bp3d-dash-text'>
                    <span className='bp3d-dash-tick'><Check size={9.25} weight={1.85} /></span>
                    {f.title}
                </li>
            ))}
        </ul>

        <button
            type='button'
            className='bp3d-dash-btn bp3d-dash-plan__buy'
            disabled={!Number.isFinite(amount)}
            onClick={() => openCheckout(product, plan, site, cycle, { image: logo || product.icon, title: product.title })}
        >
            {__('Buy Now', '3d-viewer')} <ArrowRight size={12.95} weight={1.85} />
        </button>
    </article>;
};

const Faq = ({ days }: { days: number }) => {
    const [open, setOpen] = useState(0);
    const refund = sprintf(/* translators: %d: length of the money-back guarantee in days. */ __('Absolutely. Every plan is backed by a %d days no-questions-asked money-back guarantee.', '3d-viewer'), days);
    const faq = [
        [__('Can I upgrade my plan later?', '3d-viewer'), __('Yes — you can upgrade any time from your account. We prorate the difference automatically.', '3d-viewer')],
        [__('What happens after my license expires?', '3d-viewer'), __('The plugin keeps working forever. You only lose access to premium features, updates and premium support unless you renew.', '3d-viewer')],
        [__('Do you offer refunds?', '3d-viewer'), refund],
    ];

    return <section className='bp3d-dash-faq'>
        <header className='bp3d-dash-faq__head'>
            <h2>{__('Frequently asked questions', '3d-viewer')}</h2>
            <p className='bp3d-dash-text'>{__('Find quick answers to common questions about our pricing and plans.', '3d-viewer')}</p>
        </header>
        <div className='bp3d-dash-faq__list'>
            {faq.map(([q, a], i) => (
                <div key={q} className='bp3d-dash-faq__item'>
                    <button type='button' className='bp3d-dash-faq__q' aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                        <span className='bp3d-dash-title'>{q}</span>
                        {open === i ? <ChevronUp size={16} weight={2} /> : <ChevronDown size={16} weight={2} />}
                    </button>
                    {open === i && <p className='bp3d-dash-text'>{a}</p>}
                </div>
            ))}
        </div>
    </section>;
};

export const PriceLoading = ({ loading }: { loading: boolean }) => (
    <p className='bp3d-dash-text bp3d-dash-loading' role='status'>
        {loading ? __('Loading the latest pricing…', '3d-viewer') : __('Pricing could not be loaded. Check your connection and reload this page.', '3d-viewer')}
    </p>
);

const Pricing = ({ pricingInfo }: any) => {
    const { loading, product } = useProduct(pricingInfo.pluginId);
    const plans = (pricingInfo.planIds as number[])
        .map((id) => product?.plans?.find((p) => Number(p.id) === Number(id)))
        .filter(Boolean) as Plan[];
    const cycles = cyclesOf(plans[0]);
    const [picked, setCycle] = useState<Cycle>('annual');
    const cycle: Cycle = cycles.includes(picked) ? picked : (cycles[0] || 'annual');
    const days = product?.money_back_period || 14;

    const moneyBack = sprintf(/* translators: %d: length of the money-back guarantee in days. */ __('%d days money back', '3d-viewer'), days);
    const assurances = [
        { title: moneyBack, sub: __('Risk-free purchase', '3d-viewer'), Icon: ShieldCheck },
        { title: __('Plugin updates', '3d-viewer'), sub: __('On every plan', '3d-viewer'), Icon: RefreshCw, color: '#8b5cf6' },
        { title: __('Priority support', '3d-viewer'), sub: __('Get help when you need it', '3d-viewer'), Icon: Headset },
        { title: __('Secure checkout', '3d-viewer'), sub: __('Powered by Freemius', '3d-viewer'), Icon: Lock },
    ];

    return <>
        <header className='bp3d-dash-intro'>
            <span className='bp3d-dash-intro__badge'>{__('Pricing', '3d-viewer')}</span>
            <h1>{__('Pick the plan that fits your project', '3d-viewer')}</h1>
            <p className='bp3d-dash-text'>
                {__('Unlock more features, get better control and take your 3D viewer experience to the next level. Choose a plan that works for you.', '3d-viewer')}
            </p>
            {cycles.length > 1 && <BillingToggle options={cycles} value={cycle} onChange={setCycle} save={annualSaving(plans[0])} />}
        </header>

        {product && plans.length
            ? <div className='bp3d-dash-plans'>
                {plans.map((p) => <PlanCard
                    key={p.id}
                    product={product}
                    plan={p}
                    cycle={cycle}
                    licenses={pricingInfo.licenses}
                    featured={p.name === 'pro'}
                    logo={pricingInfo.logo}
                />)}
            </div>
            : <PriceLoading loading={loading} />}

        <div className='bp3d-dash-after'>
            <div className='bp3d-dash-assure'>
                {assurances.map(({ title, sub, Icon, color }) => (
                    <div key={title} className='bp3d-dash-assure__card'>
                        <span className='bp3d-dash-assure__icon' style={color ? { color } : undefined}>
                            <Icon size={20.7} weight={2.07} />
                        </span>
                        <div>
                            <h3 className='bp3d-dash-title'>{title}</h3>
                            <p className='bp3d-dash-text'>{sub}</p>
                        </div>
                    </div>
                ))}
            </div>
            <Faq days={days} />
        </div>
    </>;
};

export default Pricing;
