import React, { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    ColumnDef,
    SortingState,
} from '@tanstack/react-table';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (info: { row: T; getValue: () => any }) => React.ReactNode;
    enableSorting?: boolean;
    width?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchPlaceholder?: string;
    onRowAction?: (action: string, row: T) => void;
    actions?: { label: string; value: string; icon?: React.ElementType; destructive?: boolean }[];
    itemsPerPage?: number;
    className?: string;
    title?: string;
}

export function DataTable<T>({
    data,
    columns,
    searchPlaceholder = "Search...",
    actions = [],
    onRowAction,
    itemsPerPage = 10,
    className = "",
    title
}: DataTableProps<T>) {

    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);

    const tableColumns = useMemo<ColumnDef<T, any>[]>(() => {
        return columns.map(col => ({
            header: col.header,
            accessorKey: col.accessorKey as string,
            enableSorting: col.enableSorting !== false,
            cell: (info) => {
                if (col.cell) {
                    return col.cell({
                        row: info.row.original,
                        getValue: info.getValue
                    });
                }
                return info.getValue() as React.ReactNode;
            }
        }));
    }, [columns]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: itemsPerPage } },
    });

    const gridTemplateColumns = useMemo(() => {
        const colWidths = columns.map(c => c.width || '1fr');
        if (actions.length > 0) colWidths.push(`${actions.length * 44}px`);
        return colWidths.join(' ');
    }, [columns, actions]);

    return (
        <div className={`data-table-container flex flex-col gap-4 ${className}`}>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 p-3">
                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                    {title && (
                        <>
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-bold">
                                {table.getFilteredRowModel().rows.length} Records Available
                            </span>
                        </>
                    )}
                </div>

                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-3 w-full max-w-md">
                        <Search className="text-[var(--color-text-muted)] shrink-0" size={16} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] w-full"
                        />
                    </div>
                </div>

                <div className="flex-1 hidden md:flex justify-end min-w-[200px]" />
            </div>

            {/* Table */}
            <div className="px-6 pb-6 pr-6">
                <div className="overflow-x-auto border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-secondary)] shadow-lg">
                    <div className="modern-data-table min-w-[900px]">

                        {/* Header */}
                        {table.getHeaderGroups().map(headerGroup => (
                            <div key={headerGroup.id} className="modern-table-header" style={{ gridTemplateColumns }}>
                                {headerGroup.headers.map(header => (
                                    <div
                                        key={header.id}
                                        className={`modern-header-cell ${header.column.getCanSort() ? 'sortable' : ''}`}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getCanSort() && (
                                            <div className="flex flex-col opacity-40">
                                                <ChevronUp size={10} />
                                                <ChevronDown size={10} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {actions.length > 0 && (
                                    <div className="modern-header-cell flex justify-end">Actions</div>
                                )}
                            </div>
                        ))}

                        {/* Rows */}
                        <div className="modern-table-body">
                            {table.getRowModel().rows.map(row => (
                                <div key={row.id} className="modern-table-row" style={{ gridTemplateColumns }}>
                                    {row.getVisibleCells().map(cell => (
                                        <div key={cell.id} className="modern-cell pr-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </div>
                                    ))}

                                    {actions.length > 0 && (
                                        <div className="modern-cell justify-end px-2 gap-1">
                                            {actions.map((action) => {
                                                const Icon = action.icon;
                                                return (
                                                    <button
                                                        key={action.value}
                                                        title={action.label}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRowAction?.(action.value, row.original);
                                                        }}
                                                        className={`p-2 rounded-lg transition-all bg-transparent ${
                                                            action.destructive
                                                                ? 'text-red-400 hover:text-red-500 hover:bg-red-500/10'
                                                                : 'text-[var(--color-text-primary)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10'
                                                        }`}
                                                    >
                                                        {Icon ? <Icon size={16} /> : action.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {/* Pagination */}
            {table.getPageCount() > 1 && (
                <div className="p-6 flex items-center justify-between">
                    <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

        </div>
    );
}