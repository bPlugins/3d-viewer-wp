import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from 'react-router-dom';
import { HeroArt, ViewerControls, Tag, PlanTags, openInNewTab } from './shared';
import {
    Plus, Eye, SquareCheckFilled, ArrowRight, Rotate3d, CursorSelect, CodeBrackets, Settings02, File01,
    Plug01, StarRound, SettingsRound, Grid, Rocket, Book, Check, Crown, MessageCircle, Users, Lightbulb, Heart,
} from './icons';

/* Tag labels use the -700 shade of each accent (the file's -500s fail AA on their tints). */
const LOG_TAGS: Record<string, { label: string; bg: string; color: string; icon: JSX.Element }> = {
    analytics: { label: __('Analytics', '3d-viewer'), bg: '#ecfeff', color: '#0e7490', icon: <StarRound size={21.25} weight={1.5} color='#8b5cf6' /> },
    viewer: { label: __('Viewer', '3d-viewer'), bg: '#d1fae5', color: '#047857', icon: <SettingsRound size={20.75} weight={1.5} color='#1e60f2' /> },
    plugin: { label: __('Plugin', '3d-viewer'), bg: '#ffedd5', color: '#c2410c', icon: <Grid size={20.75} weight={1.5} color='#f97316' /> },
    hotspots: { label: __('Hotspots', '3d-viewer'), bg: '#d1fae5', color: '#047857', icon: <SettingsRound size={20.75} weight={1.5} color='#1e60f2' /> },
};

// Figma's builder order; the step copy is the plugin's own (welcomeInfo).
const BUILDERS = ['gutenberg', 'elementor', 'shortcode'];

const formatDate = (iso: string) => {
    try {
        return new Intl.DateTimeFormat(document.documentElement.lang || undefined, { month: 'short', day: '2-digit', year: 'numeric' })
            .format(new Date(`${iso}T12:00:00`));
    } catch (_e) {
        return iso;
    }
};

const Hero = ({ isPremium, links }: any) => (
    <section className='bp3d-dash-hero'>
        <div className='bp3d-dash-hero__copy'>
            <PlanTags isPremium={isPremium} />

            <div className='bp3d-dash-hero__lede'>
                <h1>{__('Welcome to 3D Viewer 👋', '3d-viewer')}</h1>
                <p className='bp3d-dash-text'>
                    {__('Display interactive 3D models on your website with beautiful controls and smooth performance.', '3d-viewer')}
                </p>
            </div>

            <div className='bp3d-dash-hero__actions'>
                <a href={links.newViewer} className='bp3d-dash-btn bp3d-dash-btn--primary'>
                    <Plus size={13.17} weight={1.65} /> {__('Create 3D Viewer', '3d-viewer')}
                </a>
                <Link to='/demos' className='bp3d-dash-btn bp3d-dash-btn--ghost'>
                    <Eye size={13.17} weight={1.65} /> {__('View Demos', '3d-viewer')}
                </Link>
            </div>

            <ul className='bp3d-dash-perks'>
                {[__('Easy to use', '3d-viewer'), __('No coding required', '3d-viewer'), __('Works with any theme', '3d-viewer')].map((p) => (
                    <li key={p} className='bp3d-dash-perk'>
                        <SquareCheckFilled size={16.46} /> {p}
                    </li>
                ))}
            </ul>
        </div>

        <HeroArt
            blobs={[{ left: 422.9, top: -166.55 }, { left: 603.94, top: -34.06 }]}
            model={{ left: 503, top: 48.4 }}
            degree={{ left: 429, top: 119.4 }}
        >
            <ViewerControls
                style={{ left: 677, top: 114.4 }}
                icons={[{ size: 14.37, weight: 1.42 }, { size: 16.2, weight: 1.23 }, { size: 17.85, weight: 1.23 }]}
            />
        </HeroArt>
    </section>
);

interface QuickCard {
    title: string;
    desc: string;
    href?: string;
    to?: string;
    external?: boolean;
    Icon: (p: any) => JSX.Element;
    bg: string;
    color: string;
    descWidth?: number;
    isNew?: boolean;
}

const QuickAccess = ({ links, pages, extensions, canManageOptions }: any) => {
    // Help & Demos opens for edit_posts; Settings and the BPEM page need manage_options.
    const cards = ([
        { title: __('Create 3D Viewer', '3d-viewer'), desc: __('Build a new 3D viewer for your product or model.', '3d-viewer'), href: links.newViewer, Icon: Rotate3d, bg: '#ece4ff', color: '#8b5cf6' },
        { title: __('View Demos', '3d-viewer'), desc: __('Explore ready-made demos and templates.', '3d-viewer'), to: '/demos', Icon: CursorSelect, bg: '#f2f6ff', color: '#1e60f2', descWidth: 194 },
        { title: __('Shortcodes', '3d-viewer'), desc: __("Copy any viewer's shortcode from the 3D Viewer list.", '3d-viewer'), href: links.viewers, Icon: CodeBrackets, bg: '#b5ffe7', color: '#046143', descWidth: 208 },
        canManageOptions && { title: __('Settings', '3d-viewer'), desc: __('Configure general settings and preferences.', '3d-viewer'), href: links.settings, Icon: Settings02, bg: '#f2f6ff', color: '#1e60f2', descWidth: 197 },
        { title: __('Help & Documentation', '3d-viewer'), desc: __('Get support and find helpful guides.', '3d-viewer'), href: pages.docs, external: true, Icon: File01, bg: '#ece4ff', color: '#8b5cf6', descWidth: 184 },
        (extensions || canManageOptions) && { title: __('Extensions', '3d-viewer'), desc: __('Explore more features with premium extensions.', '3d-viewer'), ...(extensions ? { to: '/extensions' } : { href: links.extensions }), Icon: Plug01, bg: '#ffefe4', color: '#fd6700', isNew: true },
    ] as (QuickCard | false)[]).filter(Boolean) as QuickCard[];

    return <section className='bp3d-dash-quick'>
        <header className='bp3d-dash-sechead'>
            <h2>{__('Quick Access', '3d-viewer')}</h2>
            <p className='bp3d-dash-text'>{__('Jump into the most used features and start creating your 3D viewer.', '3d-viewer')}</p>
        </header>

        <div className='bp3d-dash-quick__grid'>
            {cards.map(({ title, desc, href, to, external, Icon, bg, color, descWidth, isNew }) => {
                const body = <>
                    <div className='bp3d-dash-qcard__head'>
                        <span className='bp3d-dash-qcard__icon' style={{ background: bg, color }}>
                            <Icon size={19.75} weight={1.23} />
                        </span>
                        {isNew && <span className='bp3d-dash-new'>{__('NEW', '3d-viewer')}</span>}
                    </div>
                    <div className='bp3d-dash-qcard__body'>
                        <h3 className='bp3d-dash-title'>{title}</h3>
                        <p className='bp3d-dash-text' style={descWidth ? { width: descWidth } : undefined}>{desc}</p>
                    </div>
                    <ArrowRight className='bp3d-dash-qcard__arrow' size={11.52} weight={1.65} />
                </>;

                return to
                    ? <Link key={title} to={to} className='bp3d-dash-qcard'>{body}</Link>
                    : <a key={title} href={href} className='bp3d-dash-qcard' {...(external ? openInNewTab : {})}>{body}</a>;
            })}
        </div>
    </section>;
};

const Changelog = ({ changelogs, changelogsUrl }: any) => (
    <section className='bp3d-dash-updates'>
        <header className='bp3d-dash-updates__head'>
            <div className='bp3d-dash-updates__title'>
                <h2 className='bp3d-dash-title'>{__('Latest Updates & Changelog', '3d-viewer')}</h2>
                <Tag bg='#d1fae5' color='#047857'>{__('New', '3d-viewer')}</Tag>
            </div>
            <a href={changelogsUrl} className='bp3d-dash-updates__all' {...openInNewTab}>{__('View All Updates →', '3d-viewer')}</a>
        </header>

        <ul className='bp3d-dash-log'>
            {changelogs.map((c: any, i: number) => {
                const tag = LOG_TAGS[c.tag] || LOG_TAGS.viewer;
                const versionLabel = sprintf(/* translators: %s: plugin version number, e.g. 1.10.0. */ __('Version %s', '3d-viewer'), c.version);
                return <li key={i} style={{ display: 'contents' }}>
                    {i > 0 && <span className='bp3d-dash-log__rule' aria-hidden='true' />}
                    <div className='bp3d-dash-log__item'>
                        <div className='bp3d-dash-log__what'>
                            <span className='bp3d-dash-log__icon'>{tag.icon}</span>
                            <span className='bp3d-dash-text'>{c.text}</span>
                            <Tag bg={tag.bg} color={tag.color}>{tag.label}</Tag>
                        </div>
                        <time className='bp3d-dash-log__when' dateTime={c.date} title={versionLabel}>
                            {formatDate(c.date)}
                        </time>
                    </div>
                </li>;
            })}
            <li className='bp3d-dash-log__rule' aria-hidden='true' />
        </ul>
    </section>
);

const GettingStarted = ({ gettingStarted }: any) => {
    const tabs = BUILDERS.map((key) => gettingStarted.tabs.find((t: any) => t.key === key)).filter(Boolean);
    const [builder, setBuilder] = useState(tabs[0]?.key);
    const active = tabs.find((t: any) => t.key === builder) || tabs[0];

    return <section className='bp3d-dash-steps-card'>
        <header className='bp3d-dash-steps-card__head'>
            <span className='bp3d-dash-steps-card__icon'><Rocket size={16.37} weight={1.5} /></span>
            <div>
                <h2 className='bp3d-dash-title'>{__('Getting Started', '3d-viewer')}</h2>
                <p className='bp3d-dash-text'>{__('Follow these simple setup steps.', '3d-viewer')}</p>
            </div>
        </header>

        <div className='bp3d-dash-builders' role='tablist' aria-label={__('Editor', '3d-viewer')}>
            {tabs.map((t: any) => (
                <button
                    key={t.key}
                    type='button'
                    role='tab'
                    aria-selected={t.key === builder}
                    className={t.key === builder ? 'bp3d-dash-builder bp3d-dash-builder--on' : 'bp3d-dash-builder'}
                    onClick={() => setBuilder(t.key)}
                >
                    {t.label}
                </button>
            ))}
        </div>

        <ol className='bp3d-dash-steps' role='tabpanel'>
            {active?.steps.map((s: any, i: number) => (
                <li key={s.title} className='bp3d-dash-step'>
                    <span className='bp3d-dash-step__num'>{i + 1}</span>
                    <div>
                        <h3 className='bp3d-dash-title'>{s.title}</h3>
                        {/* The step bodies are the plugin's own strings and carry <strong>/<code>. */}
                        <p className='bp3d-dash-text' dangerouslySetInnerHTML={{ __html: s.body }} />
                        {s.link && <a href={s.link.url} className='bp3d-dash-step__link'>{s.link.label} →</a>}
                    </div>
                </li>
            ))}
        </ol>
    </section>;
};

const DocsCard = ({ pages }: any) => (
    <section className='bp3d-dash-docs'>
        <h2 className='bp3d-dash-docs__title'>
            <Book size={16.37} weight={1.82} />
            <span className='bp3d-dash-title'>{__('Read the Full Documentation', '3d-viewer')}</span>
        </h2>
        <p className='bp3d-dash-text'>
            {__('Browse through our guides, settings reference, and examples for every single feature.', '3d-viewer')}
        </p>
        <a href={pages.docs} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--primary'>
            {__('Open Documentation →', '3d-viewer')}
        </a>
    </section>
);

const ProCard = ({ proFeatures }: any) => (
    <section className='bp3d-dash-pro'>
        <header className='bp3d-dash-pro__head'>
            <h2 className='bp3d-dash-title'>{__('Go 3D Viewer Pro!', '3d-viewer')}</h2>
            <Crown />
        </header>
        <p className='bp3d-dash-pro__sub'>{__('Unlock advanced rendering & custom features.', '3d-viewer')}</p>
        <ul className='bp3d-dash-pro__list'>
            {proFeatures.map((f: string) => (
                <li key={f} className='bp3d-dash-text'>
                    <Check size={10.91} weight={1.82} /> {f}
                </li>
            ))}
        </ul>
        <Link to='/pricing' className='bp3d-dash-btn bp3d-dash-btn--primary'>{__('View Pricing Plan →', '3d-viewer')}</Link>
    </section>
);

const Support = ({ pages }: any) => {
    const cols = [
        { title: __('Need Any Assistance?', '3d-viewer'), desc: __('Our Expert Support Team is always ready to help you out promptly.', '3d-viewer'), cta: __('Contact Support', '3d-viewer'), href: pages.support, icon: <MessageCircle size={20} weight={1.5} />, descWidth: 255 },
        { title: __('Join Our Community', '3d-viewer'), desc: __('Get tutorials, plugin updates, and share thoughts with other creators.', '3d-viewer'), cta: __('Join Community', '3d-viewer'), href: pages.community, icon: <Users size={20} weight={1.5} />, descWidth: 245 },
        { title: __('Request a Feature', '3d-viewer'), desc: __('Have an idea that would make this plugin better? Let us know!', '3d-viewer'), cta: __('Submit Idea', '3d-viewer'), href: pages.support, icon: <Lightbulb size={20} weight={1.5} />, descWidth: 221 },
        { title: __('Loving This Plugin?', '3d-viewer'), desc: __("We're a small team pouring our heart and soul into this plugin.", '3d-viewer'), cta: __('Leave a Review', '3d-viewer'), href: pages.review, icon: <Heart size={20.98} weight={1.5} color='#f97316' />, descWidth: 226 },
    ];

    return <section className='bp3d-dash-support'>
        {cols.map((s) => (
            <div key={s.title} className='bp3d-dash-support__col'>
                <h3 className='bp3d-dash-support__head'>
                    {s.icon}
                    <span className='bp3d-dash-title'>{s.title}</span>
                </h3>
                <p className='bp3d-dash-text' style={{ width: s.descWidth }}>{s.desc}</p>
                <a href={s.href} {...openInNewTab} className='bp3d-dash-btn bp3d-dash-btn--ghost'>{s.cta}</a>
            </div>
        ))}
    </section>;
};

const Welcome = (props: any) => {
    const { isPremium } = props;

    return <>
        <div className='bp3d-dash-home'>
            <div className='bp3d-dash-home__main'>
                <Hero {...props} />
                <QuickAccess {...props} />
                <Changelog {...props} />
            </div>
            <aside className='bp3d-dash-home__side'>
                <GettingStarted {...props} />
                <DocsCard {...props} />
                {!isPremium && <ProCard {...props} />}
            </aside>
        </div>
        <Support {...props} />
    </>;
};

export default Welcome;
