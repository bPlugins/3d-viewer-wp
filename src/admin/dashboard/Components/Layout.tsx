import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from '../../../../../bpl-tools/Admin/Header';

import { DashboardInfo, OnboardingState } from '../utils/data';

interface NavigationItem {
    name: string;
    href: string;
    external?: boolean;
    badge?: string;
}

const getNavigation = (adminUrl: string, setupUrl: string, onboarding: OnboardingState): NavigationItem[] => {
    const items: NavigationItem[] = [
        { name: 'Welcome', href: '/welcome' },
        { name: 'Demos', href: '/demos' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Feature Comparison', href: '/feature-comparison' },
        { name: 'Extensions', href: `${adminUrl}/edit.php?post_type=bp3d-model-viewer&page=bpem-3d-viewer-extensions`, external: true, badge: 'New' }
    ];

    // A half-finished setup is the one case where the wizard is worth a
    // permanent nav entry — it disappears for good once it has been run to
    // the end. The badge is dropped at 0% because "Guided Setup · 0%" reads
    // like a broken counter rather than an invitation.
    if (setupUrl && !onboarding.completed) {
        items.push({
            name: 'Guided Setup',
            href: setupUrl,
            external: true,
            badge: onboarding.percent > 0 ? `${onboarding.percent}%` : undefined
        });
    }

    return items;
};

interface LayoutProps extends DashboardInfo {
    [key: string]: any;
}

const Layout: React.FC<LayoutProps> = (props) => {
    const { adminUrl = '', setupUrl = '', onboarding } = props;
    const location = useLocation();
    const navigation = getNavigation(
        adminUrl.replace(/\/+$/, ''),
        setupUrl,
        onboarding || { completed: true, percent: 0 }
    );

    return <div className='bPlDashboard'>
        <Header {...props}>
            <nav className='bPlDashboardNav'>
                {navigation
                    ?.map((item, index) => item.external
                        ? <a
                            key={index}
                            href={item.href}
                            className='navLink'
                        >
                            {item.name}
                            {item.badge && <span className='navBadge'>{item.badge}</span>}
                        </a>
                        : <Link
                            key={index}
                            to={item.href}
                            className={`navLink ${location.pathname === item.href || (item.href === '/welcome' && location.pathname === '/') ? 'active' : ''}`}
                        >
                            {item.name}
                            {item.badge && <span className='navBadge'>{item.badge}</span>}
                        </Link>)}
            </nav>
        </Header>

        <main className='bPlDashboardMain'>
            <Outlet />
        </main>
    </div>
};

export default Layout;
