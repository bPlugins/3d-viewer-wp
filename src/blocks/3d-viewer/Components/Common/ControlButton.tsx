interface ControlButtonProps {
    className?: string;
    label: string;
    onClick?: () => void;
    children: React.ReactNode;
    [key: string]: any;
}

// Keeps the old `control-btn` classes so theme and custom CSS still match.
const ControlButton = ({ className = '', label, onClick, children, ...props }: ControlButtonProps) => (
    <button type="button" className={`control-btn ${className}`.trim()} aria-label={label} title={label} onClick={onClick} {...props}>
        {children}
    </button>
);

export default ControlButton;
