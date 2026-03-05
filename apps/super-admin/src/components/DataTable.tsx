import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (info: { row: T; getValue: () => any }) => React.ReactNode;
    enableSorting?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchPlaceholder?: string;
    onRowAction?: (action: string, row: T) => void;
    actions?: { label: string; value: string; destructive?: boolean }[];
    itemsPerPage?: number;
    actionsOpenByDefault?: boolean;
}

export function DataTable<T>({
    data,
    columns,
    searchPlaceholder = "Search...",
    actions = [],
    onRowAction,
    itemsPerPage = 10,
    actionsOpenByDefault = false
}: DataTableProps<T>) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeActionMenus, setActiveActionMenus] = useState<Record<number, boolean>>({});





    // Filtering
    const filteredData = useMemo(() => {
        if (!globalFilter) return data;
        const lowerFilter = globalFilter.toLowerCase();
        return data.filter((row: any) =>
            Object.values(row).some(
                val => String(val).toLowerCase().includes(lowerFilter)
            )
        );
    }, [data, globalFilter]);

    // Sorting
    const sortedData = useMemo(() => {
        if (!sorting) return filteredData;
        return [...filteredData].sort((a: any, b: any) => {
            const valA = a[sorting.id];
            const valB = b[sorting.id];
            if (valA < valB) return sorting.desc ? 1 : -1;
            if (valA > valB) return sorting.desc ? -1 : 1;
            return 0;
        });
    }, [filteredData, sorting]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    // Sync open state when data changes if open by default
    useEffect(() => {
        if (actionsOpenByDefault) {
            const initial: Record<number, boolean> = {};
            paginatedData.forEach((_, idx) => {
                initial[idx] = true;
            });
            setActiveActionMenus(initial);
        }
    }, [paginatedData, actionsOpenByDefault]);

    const handleSort = (columnId: string) => {
        setSorting(prev => {
            if (prev?.id === columnId) {
                return prev.desc ? null : { id: columnId, desc: true };
            }
            return { id: columnId, desc: false };
        });
    };

    return (
        <div className="data-table-container">
            {/* Toolbar */}
            <div className="data-table-toolbar p-4 border-b border-gray-800 flex justify-between items-center bg-[var(--color-bg-card)] rounded-t-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(e) => {
                            setGlobalFilter(e.target.value);
                            setCurrentPage(1); // Reset to page 1 on search
                        }}
                        className="pl-10 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors w-64"
                    />
                </div>
            </div>

            {/* Table wrapper for horizontal scroll */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse bg-[var(--color-bg-card)]">
                    <thead>
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`p-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider ${col.enableSorting !== false ? 'cursor-pointer hover:text-[var(--color-text-primary)]' : ''}`}
                                    onClick={() => col.enableSorting !== false && handleSort(col.accessorKey as string)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.header}
                                        {col.enableSorting !== false && sorting?.id === col.accessorKey && (
                                            sorting.desc ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions.length > 0 && <th className="p-4 w-16"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="p-8 text-center text-[var(--color-text-muted)]">
                                    No results found.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="p-4 text-sm text-[var(--color-text-primary)] whitespace-nowrap">
                                            {col.cell
                                                ? col.cell({ row, getValue: () => (row as any)[col.accessorKey] })
                                                : (row as any)[col.accessorKey] as React.ReactNode}
                                        </td>
                                    ))}
                                    {actions.length > 0 && (
                                        <td className="p-4 text-right relative">
                                            <button
                                                onClick={() => setActiveActionMenus(prev => ({
                                                    ...prev,
                                                    [rowIndex]: !prev[rowIndex]
                                                }))}
                                                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {/* Action Dropdown */}
                                            {activeActionMenus[rowIndex] && (
                                                <div
                                                    className="absolute right-[calc(100%-1rem)] top-10 mt-2 w-48 bg-[var(--color-bg-card)] rounded-md shadow-lg border border-[var(--color-border)] z-50 flex flex-col py-1"
                                                    onMouseLeave={() => !actionsOpenByDefault && setActiveActionMenus(prev => ({ ...prev, [rowIndex]: false }))}
                                                >
                                                    {actions.map((action) => (
                                                        <button
                                                            key={action.value}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRowAction?.(action.value, row);
                                                                if (!actionsOpenByDefault) {
                                                                    setActiveActionMenus(prev => ({ ...prev, [rowIndex]: false }));
                                                                }
                                                            }}
                                                            className={`px-4 py-2 text-sm text-left hover:bg-[var(--color-bg-hover)] transition-colors ${action.destructive ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]'}`}
                                                        >
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    )}

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm bg-[var(--color-bg-card)] rounded-b-xl">
                    <div className="text-[var(--color-text-muted)]">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-secondary)] transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${currentPage === page
                                    ? 'bg-[var(--color-accent-gradient)] text-[var(--color-on-accent)] font-medium'
                                    : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-secondary)] transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
