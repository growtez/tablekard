export const Badge = ({ children, variant = 'default', style = {}, ...props }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return { backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#065f46' };
            case 'error':
                return { backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#991b1b' };
            case 'warning':
                return { backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#92400e' };
            case 'info':
                return { backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#1e40af' };
            default:
                return { backgroundColor: 'var(--surface-hover)', color: 'var(--text-main)' };
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
