import { useState, useRef, useEffect } from 'react';
import copyToClipboard from '../../../../utils/copyToClipboard';

interface ClipboardButtonProps {
    title?: string;
    disabled?: boolean;
    text?: string;
    onCopy?: () => void;
    onFinishCopy?: () => void;
    className?: string;
    children?: React.ReactNode;
}

const ClipboardButton = ({
    title = '',
    disabled = false,
    text = '',
    onCopy = () => { },
    onFinishCopy = () => { },
    className = '',
    children
}: ClipboardButtonProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const timeoutRef = useRef<null | NodeJS.Timeout>(null);


    const handleCopy = async (text: string | (() => string)) => {
        if (disabled) return;

        const success = await copyToClipboard(typeof text === 'function' ? text() : text);

        if (success) {
            setIsCopied(true);
            onCopy();

            // Reset after 2 seconds
            timeoutRef.current = setTimeout(() => {
                setIsCopied(false);
                onFinishCopy();
            }, 2000);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <button
            type="button"
            onClick={() => handleCopy(text)}
            disabled={disabled || isCopied}
            title={title || (isCopied ? "Copied!" : "")}
            className={className}
        >
            {children}
        </button>
    );
};

export default ClipboardButton;