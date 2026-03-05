import React from 'react';

interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
