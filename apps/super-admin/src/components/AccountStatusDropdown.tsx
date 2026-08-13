import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccountStatusDropdownProps {
    status: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    size?: 'sm' | 'md';
}

export default function AccountStatusDropdown({
    status,
    disabled = false,
    onChange,
    size = 'md',
}: AccountStatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Detect if dropdown should open upward
    const handleToggle = useCallback(() => {
        if (disabled) return;
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUpward(spaceBelow < 220);
        }
        setIsOpen(!isOpen);
    }, [disabled, isOpen]);

    const getDisplayLabel = () => {
        if (!status) return 'PENDING';
        return status.toUpperCase();
    };

    const getStatusColor = () => {
        if (status === 'active') return 'text-green-600 bg-green-500/10';
        if (status === 'pending') return 'text-amber-600 bg-amber-500/10';
        return 'text-red-600 bg-red-500/10'; // suspended or rejected
    };

    const handleSelect = (value: string) => {
        onChange(value);
        setIsOpen(false);
    };

    const isSm = size === 'sm';

    return (
        <div ref={containerRef} className="relative inline-block">
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={handleToggle}
                className={`${isSm ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1'} font-bold rounded border border-border/40 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:opacity-50 flex items-center gap-1 whitespace-nowrap ${getStatusColor()}`}
            >
                {getDisplayLabel()}
                <ChevronDown size={isSm ? 10 : 12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={`absolute left-0 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[150px] py-1 ${
                        openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                    {/* PENDING */}
                    <button
                        type="button"
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center gap-2 ${
                            status === 'pending' ? 'text-amber-500 bg-surface-hover' : 'text-text-main'
                        }`}
                        onClick={() => handleSelect('pending')}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Pending
                    </button>

                    {/* ACTIVE */}
                    <button
                        type="button"
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center gap-2 ${
                            status === 'active' ? 'text-green-500 bg-surface-hover' : 'text-text-main'
                        }`}
                        onClick={() => handleSelect('active')}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        Active
                    </button>

                    {/* SUSPENDED */}
                    <button
                        type="button"
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center gap-2 ${
                            status === 'suspended' ? 'text-red-500 bg-surface-hover' : 'text-text-main'
                        }`}
                        onClick={() => handleSelect('suspended')}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        Suspended
                    </button>

                    {/* REJECTED */}
                    <button
                        type="button"
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-surface-hover transition-colors flex items-center gap-2 ${
                            status === 'rejected' ? 'text-red-500 bg-surface-hover' : 'text-text-main'
                        }`}
                        onClick={() => handleSelect('rejected')}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        Rejected
                    </button>
                </div>
            )}
        </div>
    );
}
