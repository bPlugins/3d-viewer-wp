import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Welcome from '../../../../../bpl-tools/Admin/Welcome';
import Demos from '../../../../../bpl-tools/Admin/Demos';
import MultiPlanPricing from '../../../../../bpl-tools/Admin/MultiPlanPricing';
import FeatureCompare from '../../../../../bpl-tools/Admin/FeatureCompare';
import OurPlugins from '../../../../../bpl-tools/Admin/OurPlugins';

import Layout from './Layout';
import { demoInfo, pricingInfo, welcomeInfo, DashboardInfo } from '../utils/data';

interface AppProps extends DashboardInfo {
    [key: string]: any;
}

const App: React.FC<AppProps> = (props) => {
    const { adminUrl } = props;

    return <Router>
        <Routes>
            <Route path='/' element={<Layout {...props} />}>
                <Route index element={<Welcome {...props} {...welcomeInfo(adminUrl)} />} />
                <Route path='welcome' element={<Welcome {...props} {...welcomeInfo(adminUrl)} />} />
                <Route path='demos' element={<Demos demoInfo={demoInfo} {...props} />} />
                <Route path='pricing' element={<MultiPlanPricing pricingInfo={pricingInfo} options={{}} {...props} />} />
                <Route path='feature-comparison' element={<FeatureCompare plans={['free', 'pro']} {...props} />} />
                <Route path='our-plugins' element={<OurPlugins {...props} />} />
                <Route path='*' element={<Navigate to='/welcome' replace />} />
            </Route>
        </Routes>
    </Router>
};

export default App;
