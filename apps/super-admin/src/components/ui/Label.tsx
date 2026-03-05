import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { }

export function Label({ className = '', children, ...props }: LabelProps) {
    return (
        <label className={`form-label ${className}`} {...props}>
            {children}
        </label>
    );
}
