interface ControlButtonProps {
    className?: string;
    label: string;
    onClick?: () => void;
    children: React.ReactNode;
    buttonRef?: React.Ref<HTMLButtonElement>;
    [key: string]: any;
}

// Keeps the old `control-btn` classes so theme and custom CSS still match.
const ControlButton = ({ className = '', label, onClick, children, buttonRef, ...props }: ControlButtonProps) => (
    <button type="button" ref={buttonRef} className={`control-btn ${className}`.trim()} aria-label={label} title={label} onClick={onClick} {...props}>
        {children}
    </button>
);

export default ControlButton;
