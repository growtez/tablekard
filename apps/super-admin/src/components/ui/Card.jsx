export const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-surface border border-border rounded-2xl p-4 md:p-6 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
    <div className={`mb-4 pb-2 border-b border-border flex items-center justify-between ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-semibold m-0 text-text-main ${className}`} {...props}>
        {children}
    </h3>
);

export const CardContent = ({ children, className = '', ...props }) => (
    <div className={`${className}`} {...props}>
        {children}
    </div>
);
