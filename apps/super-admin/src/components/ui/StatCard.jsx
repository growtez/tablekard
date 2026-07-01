import { useNavigate } from 'react-router-dom';

export const StatCard = ({ label, value, icon: Icon, color = 'green', change = '+0%', path, className = '', ...props }) => {
    const navigate = useNavigate();
    const isClickable = !!path;

    const getColors = () => {
        switch (color) {
            case 'purple': return 'bg-purple-500/10 text-purple-400';
            case 'blue': return 'bg-blue-500/10 text-blue-400';
            case 'orange': return 'bg-orange-500/10 text-orange-400';
            default: return 'bg-emerald-500/10 text-emerald-400';
        }
    };

    const handleClick = () => {
        if (path) {
            navigate(path);
        }
    };

    return (
        <div
            className={`bg-surface border border-border rounded-2xl p-4 md:p-6 shadow-sm flex items-center gap-5 transition-colors ${isClickable ? 'cursor-pointer hover:bg-surface-hover hover:border-accent-primary/50' : ''} ${className}`}
            onClick={handleClick}
            {...props}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getColors()}`}>
                <Icon size={24} />
            </div>
            <div className="flex flex-col min-w-0">
                <div className="text-sm text-text-muted mb-1 truncate">{label}</div>
                <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-text-main truncate">{value}</div>
                    <div className="text-xs font-semibold text-emerald-500">{change}</div>
                </div>
            </div>
        </div>
    );
};
