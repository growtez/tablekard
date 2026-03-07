export const StatCard = ({ label, value, icon: Icon, color = 'green', change = '+0%', ...props }) => {
    const getColors = () => {
        switch (color) {
            case 'purple': return { bg: 'hsla(260, 100%, 70%, 0.1)', text: 'hsl(260, 100%, 70%)' };
            case 'blue': return { bg: 'hsla(200, 100%, 60%, 0.1)', text: 'hsl(200, 100%, 60%)' };
            case 'orange': return { bg: 'hsla(25, 100%, 60%, 0.1)', text: 'hsl(25, 100%, 60%)' };
            default: return { bg: 'hsla(150, 100%, 50%, 0.1)', text: 'hsl(150, 100%, 50%)' };
        }
    };

    const colors = getColors();

    return (
        <div
            className="premium-card"
            style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', ...props.style }}
            {...props}
        >
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: colors.bg,
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{change}</div>
                </div>
            </div>
        </div >
    );
};
