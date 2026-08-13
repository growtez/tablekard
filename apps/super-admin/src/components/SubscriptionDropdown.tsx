import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface Plan {
    id: string;
    name?: string;
    duration_days?: number;
    duration?: number;
}

interface SubscriptionDropdownProps {
    currentValue: string;
    subscriptionStatus: string;
    subscriptionPlan: string;
    trialPlans: Plan[];
    billingPlans: Plan[];
    disabled?: boolean;
    onChange: (value: string) => void;
    size?: 'sm' | 'md';
}

export default function SubscriptionDropdown({
    currentValue,
    subscriptionStatus,
    subscriptionPlan,
    trialPlans,
    billingPlans,
    disabled = false,
    onChange,
    size = 'md',
}: SubscriptionDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setHoveredGroup(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getDisplayLabel = () => {
        if (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL') {
            const matchedPlan = billingPlans.find(p => p.name?.toLowerCase() === subscriptionPlan?.toLowerCase());
            if (matchedPlan) return matchedPlan.name?.toUpperCase() || 'PLAN';
            const matchedTrial = trialPlans.find(t => t.name?.toLowerCase() === subscriptionPlan?.toLowerCase());
            if (matchedTrial) return matchedTrial.name?.toUpperCase() || 'TRIAL';
            return subscriptionPlan?.toUpperCase() || 'CUSTOM';
        }
        if (subscriptionStatus === 'SUSPENDED') return 'SUSPENDED';
        return 'INACTIVE';
    };

    const getStatusColor = () => {
        if (subscriptionStatus === 'ACTIVE') return 'text-green-500 bg-green-500/10';
        if (subscriptionStatus === 'TRIAL') return 'text-blue-500 bg-blue-500/10';
        if (subscriptionStatus === 'SUSPENDED') return 'text-red-500 bg-red-500/10';
        return 'text-zinc-400 bg-zinc-500/10';
    };

    const handleSelect = (value: string) => {
        onChange(value);
        setIsOpen(false);
        setHoveredGroup(null);
    };

    const handleGroupEnter = (group: string) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredGroup(group);
    };

    const handleGroupLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredGroup(null);
        }, 150);
    };

    const handleSubmenuEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };

    const isSm = size === 'sm';

    return (
        <div ref={containerRef} className="relative inline-block">
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
                className={`${isSm ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1'} font-bold rounded border border-border/50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary bg-surface disabled:opacity-50 flex items-center gap-1 whitespace-nowrap ${getStatusColor()}`}
            >
                {getDisplayLabel()}
                <ChevronDown size={isSm ? 10 : 12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[150px] py-1"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                    {/* INACTIVE */}
                    <button
                        type="button"
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center gap-2 ${
                            !subscriptionStatus || subscriptionStatus === 'INACTIVE' ? 'text-accent-primary' : 'text-text-main'
                        }`}
                        onClick={() => handleSelect('none')}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                        Inactive
                    </button>

                    {/* TRIAL → submenu */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleGroupEnter('trial')}
                        onMouseLeave={handleGroupLeave}
                    >
                        <button
                            type="button"
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center justify-between gap-2 ${
                                hoveredGroup === 'trial' ? 'bg-surface-hover' : ''
                            } ${subscriptionStatus === 'TRIAL' ? 'text-blue-500' : 'text-text-main'}`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                Trial
                            </span>
                            {trialPlans.length > 0 && <ChevronRight size={12} className="text-text-muted" />}
                        </button>

                        {hoveredGroup === 'trial' && trialPlans.length > 0 && (
                            <div
                                className="absolute left-full top-0 ml-0.5 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[180px] py-1 flex flex-col"
                                onMouseEnter={handleSubmenuEnter}
                                onMouseLeave={handleGroupLeave}
                            >
                                {trialPlans.map(trial => (
                                    <button
                                        key={trial.id}
                                        type="button"
                                        className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-text-main hover:bg-surface-hover hover:text-blue-500 transition-colors whitespace-nowrap"
                                        onClick={() => handleSelect(`active-trial-${trial.id}`)}
                                    >
                                        {trial.name?.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ACTIVE → submenu */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleGroupEnter('plan')}
                        onMouseLeave={handleGroupLeave}
                    >
                        <button
                            type="button"
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center justify-between gap-2 ${
                                hoveredGroup === 'plan' ? 'bg-surface-hover' : ''
                            } ${subscriptionStatus === 'ACTIVE' ? 'text-green-500' : 'text-text-main'}`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                Active
                            </span>
                            {billingPlans.length > 0 && <ChevronRight size={12} className="text-text-muted" />}
                        </button>

                        {hoveredGroup === 'plan' && billingPlans.length > 0 && (
                            <div
                                className="absolute left-full top-0 ml-0.5 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[200px] py-1 flex flex-col"
                                onMouseEnter={handleSubmenuEnter}
                                onMouseLeave={handleGroupLeave}
                            >
                                {billingPlans.map(plan => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-text-main hover:bg-surface-hover hover:text-green-500 transition-colors whitespace-nowrap"
                                        onClick={() => handleSelect(`active-plan-${plan.id}`)}
                                    >
                                        {plan.name?.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SUSPENDED */}
                    <button
                        type="button"
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center gap-2 ${
                            subscriptionStatus === 'SUSPENDED' ? 'text-red-500' : 'text-text-main'
                        }`}
                        onClick={() => handleSelect('suspended')}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        Suspended
                    </button>
                </div>
            )}
        </div>
    );
}
