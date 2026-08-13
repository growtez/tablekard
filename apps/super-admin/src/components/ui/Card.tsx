import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
}

export const Card = ({ children, className = '', ...props }: CardProps) => (
    <div className={`bg-surface border border-border rounded-2xl p-4 md:p-6 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ children, className = '', ...props }: CardProps) => (
    <div className={`mb-4 pb-2 border-b border-border flex items-center justify-between ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = '', ...props }: CardProps) => (
    <h3 className={`text-lg font-semibold m-0 text-text-main ${className}`} {...props}>
        {children}
    </h3>
);

export const CardContent = ({ children, className = '', ...props }: CardProps) => (
    <div className={`${className}`} {...props}>
        {children}
    </div>
);
