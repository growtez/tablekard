import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: React.ReactNode;
    icon: LucideIcon;
    color?: string; // e.g., 'purple', 'green', 'orange', 'blue'
    className?: string;
}

export function StatCard({ label, value, icon: Icon, color = 'purple', className = '' }: StatCardProps) {
    return (
        <div className={`stat-card glass-card ${className}`}>
            <div className={`stat-icon ${color}`}>
                <Icon size={22} />
            </div>
            <div className="stat-info">
                <div className="stat-label uppercase text-[10px] font-bold tracking-widest">{label}</div>
                <div className="stat-value text-2xl">{value}</div>
            </div>
        </div>
    );
}
