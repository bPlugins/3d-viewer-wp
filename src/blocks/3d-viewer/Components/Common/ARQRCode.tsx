import QRCode from 'qrcode'
import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { ARQROPenerIcon, Close } from './icons';
import modifyUrlParams from '../../../../utils/modifyUrlParams';
import getUrlParams from '../../../../utils/getUrlParams';
import ControlButton from './ControlButton';


interface ARQRCodeProps {
    viewerRef: any;
    arLink: string;
    placement: string;
}

const ARQRCode = ({ viewerRef, arLink, placement }: ARQRCodeProps) => {
    const [qrSrc, setQrSrc] = useState('');
    const [qrVisible, setQrVisible] = useState(false);
    const params = getUrlParams();


    useEffect(() => {
        const generateQR = async (text: string) => {
            try {
                // @ts-ignore
                setQrSrc(await QRCode.toDataURL(modifyUrlParams(text, { add: { 'bp3d-action': 'view-ar' } })), { width: 100 })
            } catch (err) {
                console.error(err)
            }
        }
        generateQR(arLink || window.location.href);


    }, []);

    useEffect(() => {
        if (viewerRef.current?.loaded) {
            if (params['bp3d-action'] === 'view-ar' && viewerRef.current?.canActivateAR) {
                viewerRef.current?.activateAR();
            }
        }
    }, [viewerRef.current])

    return <>
        <div className={`ar-qrcode ${qrVisible ? 'active' : ''}`} >
            <div className="qr-content">
                <strong>{__('QR Code', '3d-viewer')}</strong>
                {placement !== 'shop-loop-item' && <p>{__('Scan QR code to view in AR on mobile', '3d-viewer')}</p>}
                <img src={qrSrc} width="100%" alt={__('QR code to view in AR', '3d-viewer')} />
            </div>
            <ControlButton className="ar-qr-opener" label={__('View in AR', '3d-viewer')} aria-expanded={qrVisible} onClick={() => {
                if (viewerRef.current?.canActivateAR) {
                    viewerRef.current?.activateAR();
                } else {
                    setQrVisible(true);
                }
            }}><ARQROPenerIcon /></ControlButton>
            <ControlButton className="close" label={__('Close QR code', '3d-viewer')} onClick={() => setQrVisible(false)}><Close /></ControlButton>
        </div>


    </>
}

export default ARQRCode;
