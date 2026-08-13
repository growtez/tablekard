export function Skeleton({ className = '', style, width, height }) {
    return (
        <div
            className={`animate-pulse bg-surface-hover rounded-md ${className}`}
            style={{ width, height, ...style }}
        />
    );
}

export function TableRowsSkeleton({ rows = 8, columns = 6 }) {
    const cellWidths = ['w-24', 'w-16', 'w-20', 'w-28', 'w-16', 'w-20', 'w-24', 'w-12'];

    return [...Array(rows)].map((_, i) => (
        <tr key={i} className="border-b border-border/40 last:border-b-0">
            <td className="py-2.5 px-4 align-middle">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </td>
            {[...Array(Math.max(columns - 1, 0))].map((_, j) => (
                <td key={j} className="py-2.5 px-4 align-middle">
                    <Skeleton className={`h-4 ${cellWidths[j % cellWidths.length]}`} />
                </td>
            ))}
        </tr>
    ));
}

export function CardListSkeleton({ count = 5 }) {
    return (
        <div className="flex flex-col gap-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="premium-card bg-surface border border-border rounded-xl p-4 flex gap-4 items-start">
                    <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2.5">
                        <div className="flex justify-between gap-4">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-20 shrink-0" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DetailPageSkeleton() {
    return (
        <div className="animate-fade-in max-w-[1000px] mx-auto pb-12">
            <div className="flex gap-8 border-b border-border mb-8 pb-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-5 w-24" />
                ))}
            </div>
            <div className="space-y-6">
                <div className="bg-surface rounded-xl border border-border p-6 space-y-5">
                    <Skeleton className="h-6 w-44" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-5 w-full max-w-[200px]" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function PlansPageSkeleton() {
    return (
        <div className="animate-fade-in pb-12">
            <div className="grid grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-surface rounded-2xl border border-border p-6 min-h-[380px] flex flex-col gap-5">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-36" />
                        <div className="space-y-3 flex-1">
                            {[1, 2, 3, 4, 5].map(j => (
                                <Skeleton key={j} className="h-4 w-full" />
                            ))}
                        </div>
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AppLoadingSkeleton() {
    return (
        <div className="min-h-screen flex bg-bg">
            <div className="hidden md:flex w-64 shrink-0 bg-sidebar-bg border-r border-sidebar-border flex-col p-4 gap-3">
                <Skeleton className="h-8 w-32 mb-4" />
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
            </div>
            <div className="flex-1 flex flex-col">
                <div className="h-16 bg-surface border-b border-border px-6 flex items-center gap-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="ml-auto flex gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                </div>
                <div className="flex-1 p-6 space-y-6">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-10 flex-1 max-w-[140px] rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-72 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
