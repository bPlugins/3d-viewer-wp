import React from 'react';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { PanelBody, PanelRow } from '@wordpress/components';
import BUnitControl from '../../../../../../components/BUnitControl/BUnitControl';
import { ColorControl, Device, InlineMediaUpload, Notice } from '../../../../../../../../bpl-tools/Components';
import { produce } from 'immer';
import StyleIcon from '../../../../../../icons/StyleIcon';
import Title from '../../../../../../components/Title';
import BInfoControl from '../../../../../../components/BInfoControl';

interface ResponsiveValue {
    desktop?: string;
    tablet?: string;
    mobile?: string;
}

interface StylesConfig {
    width: ResponsiveValue | string;
    height: ResponsiveValue | string;
    bgColor?: string;
    bgImage?: string;
    progressBarColor?: string;
    thumbSize?: string;
    [key: string]: unknown;
}

interface StyleAttributes {
    styles: StylesConfig;
    woo?: boolean;
    currentViewer?: string;
    isPremium?: boolean;
    progressBar?: boolean;
    [key: string]: unknown;
}

interface StyleProps {
    attributes: StyleAttributes;
    setAttributes: (attrs: Record<string, unknown>) => void;
    device: string;
    setOpen: (open: boolean) => void;
}

const Style: React.FC<StyleProps> = ({ attributes, setAttributes, device }) => {
    const { styles, woo, currentViewer, progressBar } = attributes;
    const { width, height, bgColor, progressBarColor } = styles;

    useEffect(() => {
        if (typeof height === 'string') {
            setAttributes({
                styles: {
                    ...styles,
                    height: {
                        desktop: height,
                        tablet: height,
                        mobile: height,
                    },
                },
            });
        }
        if (typeof width === 'string') {
            setAttributes({
                styles: {
                    ...styles,
                    width: {
                        desktop: width,
                        tablet: width,
                        mobile: width,
                    },
                },
            });
        }
    }, []);

    return (
        <PanelBody className="bPlPanelBody" title={<Title title={__('Style', "3d-viewer")} Icon={StyleIcon} /> as unknown as string}>
            {!woo && (
                <>
                    <BUnitControl
                        labelPosition="left"
                        label={
                            <PanelRow className="gap5">
                                {__('Width ', "3d-viewer")} <Device />
                            </PanelRow>
                        }
                        //@ts-ignore
                        value={(width as ResponsiveValue)[device] || width}
                        onChange={(value: string) =>
                            setAttributes({ styles: { ...styles, width: { ...(styles.width as ResponsiveValue), [device]: value } } })
                        }
                        units={[
                            { value: 'px', label: 'px', default: 500 },
                            { value: '%', label: '%', default: 100 },
                        ]}
                    />
                </>
            )}
            <BUnitControl
                label={
                    <PanelRow className="gap5">
                        {__('Height ', "3d-viewer")} <Device />
                    </PanelRow>
                }
                //@ts-ignore
                value={(height as ResponsiveValue)[device] || height}
                labelPosition="side"
                onChange={(value: string) =>
                    setAttributes({ styles: { ...styles, height: { ...(styles.height as ResponsiveValue), [device]: value } } })
                }
                units={[
                    { value: 'px', label: 'px', default: 500 },
                    { value: '%', label: '%', default: 100 },
                    { value: 'vh', label: 'vh', default: 100 },
                ]}
            />
            <ColorControl
                value={bgColor || '#ffffff'}
                defaultColor="#ffffff"
                label={__('Background Color', "3d-viewer")}
                onChange={(bgColor: string) => setAttributes({ styles: { ...styles, bgColor } })}
            />

            {currentViewer === 'modelViewer' && (
                <>
                    {/* <BInfoControl
                        Component={InlineMediaUpload}
                        media={true}
                        label={__('Background Image', "3d-viewer")}
                        placeholder={__('Background Image', "3d-viewer")}
                        value={bgImage}
                        onChange={(bgImage: string) => {
                            if (isPremium) {
                                setAttributes({
                                    styles: produce(styles, (draft: StylesConfig) => {
                                        draft.bgImage = bgImage;
                                    }),
                                });
                            } else {
                                setOpen(true);
                            }
                        }}
                        isPremium={isPremium}
                        setOpen={setOpen}
                    /> */}
                    <Notice status={"info"}>
                        {__("Set background image available in premium version", "3d-viewer")}
                    </Notice>

                    {/* {progressBar && (
                        <ColorControl
                            label={__('ProgressBar Color', '3d-viewer')}
                            value={progressBarColor || '#666'}
                            defaultColor="#666"
                            onChange={(progressBarColor: string) => setAttributes({ styles: { ...styles, progressBarColor } })}
                        />
                    )} */}
                </>
            )}
        </PanelBody>
    );
};

export default compose(
    withSelect((select: any) => {
        const { getDeviceType } = select('core/editor');
        return {
            device: getDeviceType()?.toLowerCase(),
        };
    })
)(Style);
