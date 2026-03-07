import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children: React.ReactNode;
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
    const variantClass = variant !== 'default' ? ` ${variant}` : '';
    return (
        <span className={`badge${variantClass} ${className}`} {...props}>
            {children}
        </span>
    );
}
