import QRCode from 'qrcode'
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { __ } from '@wordpress/i18n';
import { ARQROPenerIcon, Close } from './icons';
import modifyUrlParams from '../../../../utils/modifyUrlParams';
import getUrlParams from '../../../../utils/getUrlParams';
import ControlButton from './ControlButton';

// WordPress's bundled ReactDOM, as in view.tsx: this component ships in several bundles.
const { createPortal } = (window as any).ReactDOM;


interface ARQRCodeProps {
    viewerRef: any;
    arLink: string;
    placement: string;
    uniqueId?: string;
}

const ARQRCode = ({ viewerRef, arLink, placement, uniqueId = 'bp3d' }: ARQRCodeProps) => {
    const [qrSrc, setQrSrc] = useState('');
    const [qrVisible, setQrVisible] = useState(false);
    const params = getUrlParams();
    const panelId = `${uniqueId}-qr-panel`;
    const titleId = `${uniqueId}-qr-title`;
    const openerRef = useRef<HTMLButtonElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const wasOpen = useRef(false);


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

    // Centred over the model (as in Pro), not a flyout beside the AR button. Portaled up to
    // .bp_model_parent so the overlay covers the whole viewer. Resolved during render: the
    // opener is already in the DOM, and the panel must mount in the commit that opens it.
    const portalTarget = qrVisible
        ? (wrapperRef.current?.closest('.bp_model_parent') ?? wrapperRef.current?.parentElement ?? null)
        : null;

    // Modal: Escape or a click on the backdrop closes it, and Tab stays inside. Focus moves to
    // Close on open and back to the opener on close.
    useEffect(() => {
        if (qrVisible) {
            wasOpen.current = true;
            closeRef.current?.focus();

            const onKeydown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setQrVisible(false);
                    return;
                }
                if (event.key !== 'Tab') return;

                const focusable = Array.from(
                    dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
                ).filter((node) => !node.hasAttribute('disabled'));
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                const active = document.activeElement as HTMLElement | null;

                if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
                    event.preventDefault();
                    first.focus();
                }
            };
            document.addEventListener('keydown', onKeydown);
            return () => document.removeEventListener('keydown', onKeydown);
        }

        if (wasOpen.current) openerRef.current?.focus();
    }, [qrVisible]);

    return <>
        <div className="ar-qrcode" ref={wrapperRef}>
            <ControlButton className="ar-qr-opener" label={__('View in AR', '3d-viewer')} aria-expanded={qrVisible} aria-controls={panelId} buttonRef={openerRef} onClick={() => {
                if (viewerRef.current?.canActivateAR) {
                    viewerRef.current?.activateAR();
                } else {
                    setQrVisible(true);
                }
            }}><ARQROPenerIcon /></ControlButton>
        </div>

        {qrVisible && portalTarget && createPortal(
            <div className="bp3d-qr-overlay" onClick={() => setQrVisible(false)}>
                <div className="qr-content" ref={dialogRef} id={panelId} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event: MouseEvent) => event.stopPropagation()}>
                    <ControlButton className="qr-content-close" label={__('Close QR code', '3d-viewer')} buttonRef={closeRef} onClick={() => setQrVisible(false)}><Close /></ControlButton>
                    <strong id={titleId}>{__('QR Code', '3d-viewer')}</strong>
                    {placement !== 'shop-loop-item' && <p>{__('Scan QR code to view in AR on mobile', '3d-viewer')}</p>}
                    <img src={qrSrc} width="100%" alt={__('QR code to view in AR', '3d-viewer')} />
                </div>
            </div>,
            portalTarget,
        )}
    </>
}

export default ARQRCode;
