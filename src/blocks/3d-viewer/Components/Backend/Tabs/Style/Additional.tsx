import React from 'react';
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { Notice } from '../../../../../../../../bpl-tools/Components';

interface AdditionalData {
    ID?: string;
    Class?: string;
    CSS?: string;
}

interface AdditionalAttributes {
    additional: AdditionalData;
    [key: string]: unknown;
}

interface AdditionalProps {
    attributes: AdditionalAttributes;
    setAttributes: (attrs: Partial<AdditionalAttributes>) => void;
    setOpen: (open: boolean) => void;
}

const Additional: React.FC<AdditionalProps> = () => {
    return (
        <>
            <PanelBody title={__('Additional', "3d-viewer")} initialOpen={false}>
                <Notice status="premium">
                    {__('add custom ID, Class and CSS is available in premium version.', '3d-viewer')}
                </Notice>

            </PanelBody>
        </>
    );
};

export default Additional;
