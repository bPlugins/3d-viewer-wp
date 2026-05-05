import React, { useState, useRef } from 'react';
(window as any).modelViewerMessages = [];

import createSetAttributes from '../../utils/createSetAttributes';
import Product3DViewer from './Product3DViewer';
import Viewer from '../../blocks/3d-viewer/Components/Common/Viewer';

export interface FrontEndAttributes {
    woo?: boolean;
    placement?: string;
    position?: string;
    styles?: Record<string, unknown>;
    is_not_compatible?: boolean;
    [key: string]: unknown;
}

interface FrontEndProps {
    attributes: FrontEndAttributes;
}

const FrontEnd: React.FC<FrontEndProps> = ({ attributes }) => {
    const [modelReader, setModelReader] = useState<unknown>(null);
    const [attrs, setAttrs] = useState<FrontEndAttributes>(attributes);

    function __(text: string, _textdomain: string = ''): string {
        return text;
    }

    const viewerRef = useRef<HTMLElement | null>(null);
    (window as any).modelViewerMessages.push({ attributes, viewerRef });

    const setAttributes = createSetAttributes(setAttrs as any);
    const containerRef = useRef<HTMLElement>(null);

    if (attributes.woo) {
        return (
            <Product3DViewer
                attributes={attrs}
                viewerRef={viewerRef}
                __={__}
                modelReader={modelReader}
                setModelReader={setModelReader}
                setAttributes={setAttributes}
            />
        );
    } else {
        return (
            <Viewer
                attributes={attrs}
                viewerRef={viewerRef}
                __={__}
                modelReader={modelReader}
                setModelReader={setModelReader}
                setAttributes={setAttributes}
                containerRef={containerRef}
            />
        );
    }
};

export default FrontEnd;
