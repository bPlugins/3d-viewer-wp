import React, { useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { CloseIcon } from './icons';

interface VideoModalProps {
    embedUrl: string;
    onClose: () => void;
}

// Accepts youtu.be, youtube.com/watch?v= and /embed/ links; null means "just open the link".
export const youtubeEmbedUrl = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0` : null;
};

const VideoModal: React.FC<VideoModalProps> = ({ embedUrl, onClose }) => {
    const ref = useRef<HTMLDialogElement>(null);

    // showModal() puts it in the top layer: Esc, focus trap and inert page come free.
    useEffect(() => {
        ref.current?.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            className="bp3d-ob-video"
            aria-label={__('3D Viewer tutorial video', '3d-viewer')}
            onClose={onClose}
            onClick={(e) => e.target === ref.current && ref.current.close()}
        >
            <button
                type="button"
                className="bp3d-ob-video__close"
                onClick={() => ref.current?.close()}
                aria-label={__('Close video', '3d-viewer')}
            >
                <CloseIcon />
            </button>
            <div className="bp3d-ob-video__frame">
                <iframe
                    src={embedUrl}
                    title={__('3D Viewer tutorial video', '3d-viewer')}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            </div>
        </dialog>
    );
};

export default VideoModal;
