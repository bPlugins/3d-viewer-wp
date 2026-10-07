import { Outlet, Link, useLocation } from 'react-router-dom';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Box, CrownLine } from './dash/icons';
import { PageHandle, usePageWidth } from './PageResize';

interface NavTab {
    label: string;
    to?: string;
    href?: string;
    // The label's box in the Figma file; a minimum so translations can grow.
    w?: number;
    isNew?: boolean;
    badge?: string;
}

const Layout = (props: any) => {
    const { name, version, isPremium, links, extensions, canManageOptions, setupUrl, onboarding } = props;
    const { pathname } = useLocation();
    const current = pathname === '/' ? '/welcome' : pathname;
    const page = useRef<HTMLDivElement>(null);
    const column = useRef<HTMLDivElement>(null);
    const [width, setWidth] = usePageWidth('bp3d-dash-width');

    const tabs: NavTab[] = [
        { to: '/welcome', label: __('Welcome', '3d-viewer'), w: 63 },
        { to: '/demos', label: __('Demos', '3d-viewer'), w: 48 },
        ...(!isPremium ? [
            { to: '/pricing', label: __('Pricing', '3d-viewer'), w: 48 },
            { to: '/feature-comparison', label: __('Feature Comparison', '3d-viewer'), w: 138 },
        ] : []),
        { to: '/our-plugins', label: __('Our Plugins', '3d-viewer') },
        // In the dashboard when the extension manager is loaded; its own page (admins only) otherwise.
        ...(extensions || canManageOptions ? [{ ...(extensions ? { to: '/extensions' } : { href: links.extensions }), label: __('Extensions', '3d-viewer'), w: 75, isNew: true }] : []),
        // Until the wizard has been run to the end; no badge at 0%, which reads like a broken counter.
        ...(setupUrl && !onboarding?.completed ? [{ href: setupUrl, label: __('Guided Setup', '3d-viewer'), badge: onboarding?.percent > 0 ? `${onboarding.percent}%` : undefined }] : []),
    ];

    return <div className='bp3d-app bp3d-dash-page' ref={page}>
        <div className='bp3d-dash' ref={column} style={width !== null ? { maxWidth: width } : undefined}>
            {(['start', 'end'] as const).map((edge) => (
                <PageHandle key={edge} edge={edge} value={width} well={() => page.current} column={() => column.current} onChange={setWidth} />
            ))}
            <nav className='bp3d-dash-nav' aria-label={__('3D Viewer dashboard', '3d-viewer')}>
                <div className='bp3d-dash-brand'>
                    <span className='bp3d-dash-brand__mark'>
                        <Box size={14.81} weight={1.65} />
                    </span>
                    <span className='bp3d-dash-brand__name'>{name}</span>
                    {version && <span className='bp3d-dash-brand__ver'>v{version}</span>}
                </div>

                <div className='bp3d-dash-tabs'>
                    {tabs.map((t) => {
                        const inner = <>
                            <span className='bp3d-dash-tab__label' style={t.w ? { minWidth: t.w } : undefined}>{t.label}</span>
                            {t.isNew && <span className='bp3d-dash-new'>{__('NEW', '3d-viewer')}</span>}
                            {t.badge && <span className='bp3d-dash-new'>{t.badge}</span>}
                        </>;

                        if (t.href) {
                            return <a key={t.label} href={t.href} className='bp3d-dash-tab'>{inner}</a>;
                        }
                        const on = current === t.to;
                        return <Link
                            key={t.to}
                            to={t.to as string}
                            className={on ? 'bp3d-dash-tab bp3d-dash-tab--current' : 'bp3d-dash-tab'}
                            aria-current={on ? 'page' : undefined}
                        >
                            {inner}
                        </Link>;
                    })}
                </div>

                {!isPremium && <Link to='/pricing' className='bp3d-dash-upgrade'>
                    {__('Upgrade', '3d-viewer')} <CrownLine size={16} weight={1.5} />
                </Link>}
            </nav>

            <Outlet />
        </div>
    </div>;
};

export default Layout;
