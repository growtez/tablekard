export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'success': return 'bg-emerald-500/10 text-emerald-700';
            case 'error': return 'bg-red-500/10 text-red-700';
            case 'warning': return 'bg-amber-500/10 text-amber-700';
            case 'info': return 'bg-blue-500/10 text-blue-700';
            default: return 'bg-surface-hover text-text-main';
        }
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center justify-center ${getVariantClasses()} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};
