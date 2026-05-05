const Title = ({ Icon, title, badgeText }: { Icon: any, title: string, badgeText?: string }) => {
    return (
        <>
            <div className="bp3d-panel-icon">
                {Icon ? <Icon size={16} /> : ""} {title}
                {badgeText ? <span className="bp3d-panel-pro-badge">{badgeText}</span> : ""}
            </div>
        </>
    );
};

export default Title;