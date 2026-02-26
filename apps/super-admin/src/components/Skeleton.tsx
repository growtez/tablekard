interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    circle?: boolean;
}

export function Skeleton({ className = '', width, height, circle = false }: SkeletonProps) {
    return (
        <div
            className={`bg-[var(--color-bg-tertiary)] animate-pulse ${circle ? 'rounded-full' : 'rounded-md'
                } ${className}`}
            style={{ width, height }}
        />
    );
}

// Pre-built layout skeletons for common patterns
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="w-full bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-tertiary)]">
                <Skeleton width={200} height={36} className="rounded-lg" />
            </div>
            <div className="p-4 flex gap-4 border-b border-[var(--color-border)]">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} height={20} className="flex-1" />
                ))}
            </div>
            <div className="divide-y divide-[var(--color-border)]">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                        {Array.from({ length: columns }).map((_, j) => (
                            <Skeleton key={j} height={24} width={j === 0 ? '40%' : '100%'} className="flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DetailedCardSkeleton() {
    return (
        <div className="p-6 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Skeleton width={64} height={64} circle />
                <div className="flex flex-col gap-2">
                    <Skeleton width={150} height={24} />
                    <Skeleton width={100} height={16} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Skeleton height={60} className="w-full" />
                <Skeleton height={60} className="w-full" />
            </div>
            <div className="flex flex-col gap-3">
                <Skeleton height={20} width="80%" />
                <Skeleton height={20} width="60%" />
                <Skeleton height={20} width="90%" />
            </div>
        </div>
    );
}
