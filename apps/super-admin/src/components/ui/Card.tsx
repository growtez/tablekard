import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`card ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`card-header ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={`card-title ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`card-content ${className}`} {...props}>
            {children}
        </div>
    );
}
