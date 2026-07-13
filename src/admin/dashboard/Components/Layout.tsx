import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from '../../../../../bpl-tools/Admin/Header';

interface NavigationItem {
    name: string;
    href: string;
}

const navigation: NavigationItem[] = [
    { name: 'Welcome', href: '/welcome' },
    { name: 'Demos', href: '/demos' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Feature Comparison', href: '/feature-comparison' }
];

import { DashboardInfo } from '../utils/data';

interface LayoutProps extends DashboardInfo {
    [key: string]: any;
}

const Layout: React.FC<LayoutProps> = (props) => {
    const location = useLocation();

    return <div className='bPlDashboard'>
        <Header {...props}>
            <nav className='bPlDashboardNav'>
                {navigation
                    ?.map((item, index) => <Link
                        key={index}
                        to={item.href}
                        className={`navLink ${location.pathname === item.href || (item.href === '/welcome' && location.pathname === '/') ? 'active' : ''}`}
                    >
                        {item.name}
                    </Link>)}
            </nav>
        </Header>

        <main className='bPlDashboardMain'>
            <Outlet />
        </main>
    </div>
};

export default Layout;
