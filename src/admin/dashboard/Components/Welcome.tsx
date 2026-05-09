import React from 'react';
import Overview from '../../../../../bpl-tools/Admin/Overview';
import Changelog from '../../../../../bpl-tools/Admin/Changelog';
import ProAds from '../../../../../bpl-tools/Admin/ProAds';

interface WelcomeProps {
    [key: string]: any;
}

const Welcome: React.FC<WelcomeProps> = (props) => {

    return <Overview {...props}>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(480px, 100%), 1fr))',
            gap: '32px'
        }}>
            {/* @ts-ignore */}
            <Changelog {...props} />
            {/* @ts-ignore */}
            <ProAds {...props} />
        </div>
    </Overview>
};

export default Welcome;
