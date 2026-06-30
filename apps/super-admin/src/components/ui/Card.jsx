export const Card = ({ children, className = '', ...props }) => (
    <div className={`premium-card ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ children, className = '', style = {}, ...props }) => (
    <div
        className={`card-header-modern ${className}`}
        style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', ...style }}
        {...props}
    >
        {children}
    </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-semibold ${className}`} style={{ margin: 0 }} {...props}>
        {children}
    </h3>
);

export const CardContent = ({ children, className = '', style = {}, ...props }) => (
    <div className={`card-content ${className}`} style={style} {...props}>
        {children}
    </div>
);
