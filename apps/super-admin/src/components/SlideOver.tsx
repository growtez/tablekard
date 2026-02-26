import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
}

export function SlideOver({
    isOpen,
    onClose,
    title,
    children,
    footer,
    width = 'max-w-md' // Default width, can be max-w-lg, max-w-xl, etc.
}: SlideOverProps) {

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className={`w-screen ${width} transform transition-transform ease-in-out duration-300 flex flex-col bg-[var(--color-bg-secondary)] shadow-2xl border-l border-[var(--color-border)]`}>

                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-white transition-colors focus:outline-none"
                        >
                            <span className="sr-only">Close panel</span>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
