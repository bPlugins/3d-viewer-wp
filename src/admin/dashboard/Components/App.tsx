import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Our Plugins reads installed plugins from the 'core' store; this makes wp-core-data a script dependency.
import '@wordpress/core-data';

import Layout from './Layout';
import Welcome from './dash/Welcome';
import Demos from './dash/Demos';
import Pricing from './dash/Pricing';
import Compare from './dash/Compare';
import OurPlugins from './dash/OurPlugins';
import Extensions from './dash/Extensions';
import { demoInfo, pricingInfo, welcomeInfo, DashboardInfo } from '../utils/data';

interface AppProps extends DashboardInfo {
    [key: string]: any;
}

const App = (props: AppProps) => {
    const { isPremium, adminUrl, extensions } = props;
    const welcome = <Welcome {...props} {...welcomeInfo(adminUrl)} />;

    return <Router>
        <Routes>
            <Route path='/' element={<Layout {...props} />}>
                <Route index element={welcome} />
                <Route path='welcome' element={welcome} />
                <Route path='demos' element={<Demos demoInfo={demoInfo} {...props} />} />

                {!isPremium && <Route path='pricing' element={<Pricing pricingInfo={pricingInfo} {...props} />} />}
                {!isPremium && <Route path='feature-comparison' element={<Compare {...props} />} />}
                {extensions && <Route path='extensions' element={<Extensions {...props} />} />}

                <Route path='our-plugins' element={<OurPlugins {...props} />} />
                <Route path='*' element={<Navigate to='/welcome' replace />} />
            </Route>
        </Routes>
    </Router>;
};

export default App;
