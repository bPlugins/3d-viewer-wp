import React from 'react';
import { Icon, Tooltip } from '@wordpress/components';

interface LabelProps {
    info?: string;
    children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({ info = '', children }) => (
    <span className="bPlLabel">
        {children}
        {info && (
            <Tooltip text={info} placement="top">
                <Icon icon="info-outline" size={17} className="ml5" />
            </Tooltip>
        )}
    </span>
);

export default Label;
