import QRCode from 'qrcode'
import { useEffect, useState } from 'react';
import { ARQROPenerIcon, Close } from './icons';
import modifyUrlParams from '../../../../utils/modifyUrlParams';
import getUrlParams from '../../../../utils/getUrlParams';


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
        // alert('AR is loaded');
        if (viewerRef.current?.loaded) {
            if (params['bp3d-action'] === 'view-ar' && viewerRef.current?.canActivateAR) {
                viewerRef.current?.activateAR();
            }
        }
    }, [viewerRef.current])

    return <>
        <div className={`ar-qrcode ${qrVisible ? 'active' : ''}`} >
            <div className="qr-content">
                <strong>QR Code</strong>
                {placement !== 'shop-loop-item' && <p>Scan QR code to view in AR on mobile</p>}
                <img src={qrSrc} width="100%" />
            </div>
            <ARQROPenerIcon className="control-btn ar-qr-opener" onClick={() => {
                if (viewerRef.current?.canActivateAR) {
                    viewerRef.current?.activateAR();
                } else {
                    setQrVisible(true);
                }
            }} />
            <Close className="control-btn close" onClick={() => setQrVisible(false)} />
        </div>


    </>
}

export default ARQRCode;
