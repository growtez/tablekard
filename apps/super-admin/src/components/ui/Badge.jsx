export const Badge = ({ children, variant = 'default', style = {}, ...props }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return { backgroundColor: 'hsla(150, 100%, 50%, 0.1)', color: 'hsl(150, 100%, 50%)' };
            case 'error':
                return { backgroundColor: 'hsla(0, 100%, 65%, 0.1)', color: 'hsl(0, 100%, 65%)' };
            case 'warning':
                return { backgroundColor: 'hsla(35, 100%, 60%, 0.1)', color: 'hsl(35, 100%, 60%)' };
            case 'info':
                return { backgroundColor: 'hsla(200, 100%, 60%, 0.1)', color: 'hsl(200, 100%, 60%)' };
            default:
                return { backgroundColor: 'var(--surface-hover)', color: 'var(--text-muted)' };
        }
    };

    return (
        <span
            className="role-badge"
            style={{ ...getVariantStyles(), ...style }}
            {...props}
        >
            {children}
        </span>
    );
};
