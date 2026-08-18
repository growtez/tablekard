import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import {
    Download,
    RefreshCw,
    QrCode,
    Table2,
    CheckCircle,
    AlertCircle,
    Plus,
    Edit3,
    Trash2,
    X,
    Save,
    Users,
    ExternalLink,
    MoreVertical,
    Link as LinkIcon,
    Unlink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    createRestaurantTable,
    updateRestaurantTable,
    deleteRestaurantTable,
    getRestaurantById
} from '../services/supabaseService';
import type { RestaurantTable } from '../services/supabaseService';
import { useRestaurantTables, useInvalidateQueries } from '../hooks/useSupabaseQuery';
import { paintQrTemplate, CARD_MM_W, CARD_MM_H } from '../utils/qrTemplatePainter';



const BASE_URL = import.meta.env.VITE_CUSTOMER_APP_URL || window.location.origin;

interface TableFormData {
    table_number: number;
    capacity: number;
    active: boolean;
}

const TableManagementPage: React.FC = () => {
    const { activeRestaurantId } = useAuth();
    const CUSTOMER_APP_URL = (import.meta.env.VITE_CUSTOMER_APP_URL || 'https://app.tablekard.com').replace(/\/$/, '');
    const [restaurantName, setRestaurantName] = useState<string>('Restaurant');

    // React Query: cached, auto-retries, refetches on tab focus
    const { data: tables = [], isLoading: loading, error: queryError, refetch } = useRestaurantTables(activeRestaurantId);
    const { invalidateTables } = useInvalidateQueries();
    const [error, setError] = useState<string | null>(null);
    const displayError = error || (queryError ? 'Failed to load tables. Please try again.' : null);

    useEffect(() => {
        if (activeRestaurantId) {
            getRestaurantById(activeRestaurantId)
                .then(r => { if (r?.name) setRestaurantName(r.name); })
                .catch(() => { /* silently fallback to 'Restaurant' */ });
        }
    }, [activeRestaurantId]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentTable, setCurrentTable] = useState<RestaurantTable | null>(null);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    // QR Linking state removed: auto-linking is handled by the backend
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setShowActionsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Form states
    const [formData, setFormData] = useState<TableFormData>({
        table_number: 1,
        capacity: 4,
        active: true
    });
    const [formErrors, setFormErrors] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const buildQrUrl = (_tableId: string, _tableNumber: number, qrToken?: string | null) =>
        qrToken
            ? `${CUSTOMER_APP_URL}/q/${qrToken}`
            : `${BASE_URL}?restaurant_id=${activeRestaurantId}&table_id=${_tableId}`;

    const downloadQR = async (tableId: string, tableNumber: number, qrToken?: string | null) => {
        const url = buildQrUrl(tableId, tableNumber, qrToken);
        try {
            const canvas = await paintQrTemplate({
                qrSvgElementId: `qr-svg-${tableId}`,
                restaurantName,
                tableNumber,
                qrUrl: url,
                qrSize: 180,
            });
            const link = document.createElement('a');
            link.download = `table-${tableNumber}-qr.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('QR download failed:', err);
            setError('Failed to generate QR download. Please try again.');
        }
    };

    const downloadPDF = async (tableId: string, tableNumber: number, qrToken?: string | null) => {
        const url = buildQrUrl(tableId, tableNumber, qrToken);
        try {
            const canvas = await paintQrTemplate({
                qrSvgElementId: `qr-svg-${tableId}`,
                restaurantName,
                tableNumber,
                qrUrl: url,
                qrSize: 180,
            });
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [CARD_MM_W, CARD_MM_H]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, CARD_MM_W, CARD_MM_H);
            pdf.save(`${restaurantName.replace(/\s+/g, '-')}-table-${tableNumber}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            setError('Failed to generate PDF. Please try again.');
        }
    };

    const downloadAll = () => {
        tables.forEach((t: RestaurantTable, i: number) => {
            setTimeout(() => downloadQR(t.id, t.table_number, t.qr_token), i * 300);
        });
    };

    // Add Table
    const handleAddTable = async () => {
        setFormData({
            table_number: tables.length > 0 ? Math.max(...tables.map((t: RestaurantTable) => t.table_number)) + 1 : 1,
            capacity: 4,
            active: true
        });
        setFormErrors(null);
        setShowAddModal(true);
    };

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRestaurantId) return;

        if (formData.table_number < 1) {
            setFormErrors('Table number must be at least 1');
            return;
        }
        if (formData.capacity < 1) {
            setFormErrors('Capacity must be at least 1');
            return;
        }
        if (tables.some((t: RestaurantTable) => t.table_number === formData.table_number)) {
            setFormErrors(`Table ${formData.table_number} already exists`);
            return;
        }

        setSubmitting(true);
        setFormErrors(null);
        try {
            await createRestaurantTable(activeRestaurantId, {
                ...formData
            });
            invalidateTables(activeRestaurantId);
            setShowAddModal(false);
        } catch (err: any) {
            console.error('Failed to create table:', err);
            setFormErrors(err.message || 'Failed to create table. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit Table
    const handleEditTable = async (table: RestaurantTable) => {
        setCurrentTable(table);
        setFormData({
            table_number: table.table_number,
            capacity: table.capacity,
            active: table.active
        });
        setFormErrors(null);
        setShowEditModal(true);
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTable || !activeRestaurantId) return;

        if (formData.table_number < 1) {
            setFormErrors('Table number must be at least 1');
            return;
        }
        if (formData.capacity < 1) {
            setFormErrors('Capacity must be at least 1');
            return;
        }
        if (tables.some((t: RestaurantTable) => t.id !== currentTable.id && t.table_number === formData.table_number)) {
            setFormErrors(`Table ${formData.table_number} already exists`);
            return;
        }

        setSubmitting(true);
        setFormErrors(null);
        try {
            await updateRestaurantTable(currentTable.id, formData);
            invalidateTables(activeRestaurantId);
            setShowEditModal(false);
            setCurrentTable(null);
        } catch (err: any) {
            console.error('Failed to update table:', err);
            setFormErrors(err.message || 'Failed to update table. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Table
    const handleDeleteTable = (table: RestaurantTable) => {
        setCurrentTable(table);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!currentTable || !activeRestaurantId) return;

        setSubmitting(true);
        try {
            await deleteRestaurantTable(currentTable.id);
            invalidateTables(activeRestaurantId);
            setShowDeleteModal(false);
            setCurrentTable(null);
        } catch (err: any) {
            console.error('Failed to delete table:', err);
            setError('Failed to delete table. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (table: RestaurantTable) => {
        if (!activeRestaurantId) return;
        try {
            await updateRestaurantTable(table.id, { active: !table.active });
            invalidateTables(activeRestaurantId);
        } catch (err: any) {
            console.error('Failed to toggle table status:', err);
            setError('Failed to update table status.');
        }
    };

    const handlePreviewStore = () => {
        const tableId = tables.length > 0 ? tables[0].table_number : 1;
        const url = `${CUSTOMER_APP_URL}/order/${activeRestaurantId}/${tableId}?preview=true`;
        window.open(url, 'PreviewStore', 'width=390,height=844,resizable=yes,scrollbars=yes,status=no,location=no');
    };

    return (
        <>
                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 max-md:-mt-[52px] max-md:mb-[8px] flex-nowrap mb-7">
                    <div className="max-md:ml-[56px]">
                        <h1 className="text-[18px] sm:text-[22px] font-semibold text-[#1A202C] m-0 mb-1 dark:text-tk-text whitespace-nowrap">Table<span className="hidden sm:inline"> Management</span></h1>
                    </div>
                    {/* Desktop Actions */}
                    <div className="hidden md:flex gap-2 items-center shrink-0 flex-nowrap overflow-x-auto hide-scrollbar w-full lg:w-auto max-md:pb-1 max-md:justify-start">
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-[1.5px] border-[#E2E8F0] rounded-xl text-sm font-medium text-[#4A5568] cursor-pointer transition-all duration-200 hover:bg-[#F7FAFC] hover:border-[#CBD5E0] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-hover shrink-0 whitespace-nowrap" onClick={() => refetch()} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'spin' : ''} />
                            Refresh
                        </button>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-tk-burgundy border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(139,58,30,0.3)] hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(139,58,30,0.4)] shrink-0 whitespace-nowrap" onClick={handleAddTable}>
                            <Plus size={16} />
                            Add Table
                        </button>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#805AD5] border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(128,90,213,0.3)] hover:bg-[#6B46C1] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(128,90,213,0.4)] shrink-0 whitespace-nowrap" onClick={handlePreviewStore}>
                            <ExternalLink size={16} />
                            Preview Store
                        </button>
                        {tables.length > 0 && (
                            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2B6CB0] border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(43,108,176,0.3)] hover:bg-[#2C5282] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(43,108,176,0.4)] shrink-0 whitespace-nowrap" onClick={downloadAll}>
                                <Download size={16} />
                                Download All QR
                            </button>
                        )}
                    </div>

                    {/* Mobile Actions (3-dot menu) */}
                    <div className="md:hidden relative shrink-0 z-[60]" ref={actionsMenuRef}>
                        <button 
                            className="flex items-center justify-center w-10 h-10 bg-white border-[1.5px] border-[#E2E8F0] rounded-xl text-[#4A5568] cursor-pointer transition-all duration-200 hover:bg-[#F7FAFC] hover:border-[#CBD5E0] dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-hover" 
                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                            title="More Actions"
                        >
                            <MoreVertical size={20} />
                        </button>
                        
                        {showActionsMenu && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-[200px] bg-white rounded-xl border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-2 z-50 dark:bg-tk-bg-elevated dark:border-tk-border dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1A202C] hover:bg-[#F7FAFC] dark:text-tk-text dark:hover:bg-tk-bg-hover transition-colors" onClick={() => { setShowActionsMenu(false); handleAddTable(); }}>
                                    <Plus size={16} className="text-tk-burgundy" />
                                    Add Table
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1A202C] hover:bg-[#F7FAFC] dark:text-tk-text dark:hover:bg-tk-bg-hover transition-colors" onClick={() => { setShowActionsMenu(false); handlePreviewStore(); }}>
                                    <ExternalLink size={16} className="text-[#805AD5]" />
                                    Preview Store
                                </button>
                                {tables.length > 0 && (
                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1A202C] hover:bg-[#F7FAFC] dark:text-tk-text dark:hover:bg-tk-bg-hover transition-colors" onClick={() => { setShowActionsMenu(false); downloadAll(); }}>
                                        <Download size={16} className="text-[#2B6CB0]" />
                                        Download All QR
                                    </button>
                                )}
                                <div className="h-[1px] bg-[#E2E8F0] dark:bg-tk-border my-1"></div>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4A5568] hover:bg-[#F7FAFC] disabled:opacity-50 dark:text-tk-text-secondary dark:hover:bg-tk-bg-hover transition-colors" onClick={() => { setShowActionsMenu(false); refetch(); }} disabled={loading}>
                                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                                    Refresh
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between gap-6 mb-7 bg-white rounded-2xl px-6 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex-wrap max-md:flex-col max-md:items-stretch dark:bg-tk-bg-card dark:border-tk-border">
                    <div className="flex gap-3 flex-wrap max-md:w-full max-md:justify-between">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#EDF2F7] text-[#4A5568] rounded-full text-sm font-semibold shrink-0 dark:bg-tk-bg-elevated dark:text-tk-text-secondary">
                            <Table2 size={16} />
                            {loading ? '...' : `${tables.length} Tables`}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#EDF2F7] text-[#4A5568] rounded-full text-sm font-semibold shrink-0 dark:bg-tk-bg-elevated dark:text-tk-text-secondary bg-[#C6F6D5] text-[#22543D] dark:bg-[rgba(198,246,213,0.15)] dark:text-[#68D391]">
                            <CheckCircle size={16} />
                            {loading ? '...' : `${tables.filter((t: RestaurantTable) => t.active).length} Active`}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {displayError && (
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-[#FFF5F5] border border-[#FEB2B2] rounded-xl text-[#C53030] mb-5 text-sm">
                        <AlertCircle size={18} />
                        <span>{displayError}</span>
                        <button onClick={() => setError(null)}><X size={16} /></button>
                    </div>
                )}

                {/* States */}
                {loading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-[#4A5568] text-center">
                        <div className="w-10 h-10 border-4 border-[#E2E8F0] border-t-tk-burgundy rounded-full animate-spin"></div>
                        <p>Loading tables...</p>
                    </div>
                )}

                {!loading && tables.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-[#4A5568] text-center">
                        <QrCode size={64} color="#CBD5E0" />
                        <p className="text-xl font-semibold text-[#4A5568] m-0 dark:text-tk-text">No tables found</p>
                        <p className="text-sm text-[#718096] max-w-[300px] m-0 dark:text-tk-text-secondary">Add your first table to get started with QR code generation.</p>
                        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-tk-burgundy border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(139,58,30,0.3)] hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(139,58,30,0.4)] max-md:flex-1" onClick={handleAddTable}>
                            <Plus size={16} />
                            Add First Table
                        </button>
                    </div>
                )}

                {/* Tables Grid */}
                {!loading && tables.length > 0 && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 max-md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] max-sm:grid-cols-1">
                        {tables.map((table: RestaurantTable) => {
                            const url = buildQrUrl(table.id, table.table_number, table.qr_token);
                            const autoUrl = `${BASE_URL}?restaurant_id=${activeRestaurantId}&table_id=${table.id}`;
                            return (
                                <div key={table.id} className={`bg-white rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#E2E8F0] flex flex-col items-center gap-4 transition-all duration-200 relative hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] dark:bg-tk-bg-card dark:border-tk-border ${!table.active ? 'opacity-60 border-dashed' : ''}`}>
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-lg font-bold text-[#1A202C] dark:text-tk-text">Table {table.table_number}</span>
                                        <div className="flex gap-1.5">
                                            <button
                                                className="w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer transition-all duration-200 bg-[#F7FAFC] p-0 dark:bg-tk-bg-elevated text-[#2B6CB0] hover:bg-[#EBF8FF] hover:text-[#2C5282] dark:text-[#90CDF4] dark:bg-[rgba(144,205,244,0.15)] dark:hover:bg-[rgba(144,205,244,0.25)]"
                                                onClick={() => handleEditTable(table)}
                                                title="Edit table"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                className="w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer transition-all duration-200 bg-[#F7FAFC] p-0 dark:bg-tk-bg-elevated text-[#E53E3E] hover:bg-[#FFF5F5] hover:text-[#C53030] dark:text-[#FC8181] dark:bg-[rgba(252,129,129,0.15)] dark:hover:bg-[rgba(252,129,129,0.25)]"
                                                onClick={() => handleDeleteTable(table)}
                                                title="Delete table"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 items-center flex-wrap">
                                        <div
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 select-none hover:scale-105 ${table.active ? 'bg-[#C6F6D5] text-[#22543D] dark:bg-[rgba(198,246,213,0.15)] dark:text-[#68D391]' : 'bg-[#FED7D7] text-[#742A2A] dark:bg-[rgba(254,215,215,0.15)] dark:text-[#FC8181]'}`}
                                            onClick={() => handleToggleActive(table)}
                                            title="Click to toggle status"
                                        >
                                            {table.active ? (
                                                <><CheckCircle size={12} /> Active</>
                                            ) : (
                                                <><AlertCircle size={12} /> Inactive</>
                                            )}
                                        </div>
                                        {table.qr_token ? (
                                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EBF8FF] text-[#2B6CB0] border border-[#BEE3F8] dark:bg-[rgba(43,108,176,0.2)] dark:text-[#90CDF4]" title={`Linked to token ${table.qr_token}`}>
                                                <LinkIcon size={11} /> {table.qr_token}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-[#A0AEC0] bg-[#F7FAFC] border border-[#E2E8F0] dark:bg-[rgba(255,255,255,0.02)] dark:border-tk-border dark:text-tk-text-muted" title="No token linked">
                                                <Unlink size={11} /> Unlinked
                                            </span>
                                        )}
                                    </div>
                                    {table.qr_token ? (
                                        <>
                                            <div className="bg-white rounded-xl p-2 border border-[#E2E8F0] flex items-center justify-center dark:bg-tk-bg-card dark:border-tk-border">
                                                <QRCodeSVG
                                                    id={`qr-svg-${table.id}`}
                                                    value={url}
                                                    size={180}
                                                    bgColor="#ffffff"
                                                    fgColor="#1A202C"
                                                    level="H"
                                                    includeMargin
                                                />
                                            </div>

                                            <div className="w-full flex flex-col gap-2.5 items-center">
                                                <p className="text-[10px] text-[#718096] break-all text-center m-0 leading-relaxed dark:text-tk-text-secondary">{autoUrl}</p>
                                                <div className="flex gap-3 text-[13px] text-[#4A5568] font-medium dark:text-tk-text-secondary">
                                                    <span className="flex items-center gap-1.5">
                                                        <Users size={14} />
                                                        {table.capacity} seats
                                                    </span>
                                                </div>
                                                <div className="flex gap-2.5 w-full">
                                                    <button
                                                        className="flex items-center justify-center gap-1.5 px-2 py-2 border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 flex-1 min-w-0 whitespace-nowrap bg-[#EDF2F7] text-[#4A5568] border border-[#E2E8F0] hover:bg-[#E2E8F0] hover:-translate-y-0.5 dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-hover"
                                                        onClick={() => downloadQR(table.id, table.table_number, table.qr_token)}
                                                        title="Download as PNG"
                                                    >
                                                        <Download size={14} />
                                                        PNG
                                                    </button>
                                                    <button
                                                        className="flex items-center justify-center gap-1.5 px-2 py-2 border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 flex-1 min-w-0 whitespace-nowrap bg-tk-burgundy text-white shadow-[0_4px_12px_rgba(139,58,30,0.2)] hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(139,58,30,0.3)]"
                                                        onClick={() => downloadPDF(table.id, table.table_number, table.qr_token)}
                                                        title="Download as PDF"
                                                    >
                                                        <Download size={14} />
                                                        PDF
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 bg-[#F7FAFC] rounded-xl border border-dashed border-[#CBD5E0] dark:bg-tk-bg-elevated dark:border-tk-border h-full gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#EDF2F7] dark:bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#A0AEC0] dark:text-[#718096]">
                                                <LinkIcon size={24} />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="text-sm font-semibold text-[#2D3748] dark:text-[#E2E8F0] mb-1">Unlinked Table</h4>
                                                <p className="text-xs text-[#718096] dark:text-[#A0AEC0] max-w-[200px]">
                                                    This table requires a QR token to be linked before it can be used.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            {/* Add Table Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm p-5" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-[20px] w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[modalSlideIn_0.3s_ease-out] dark:bg-tk-bg-card dark:border-tk-border dark:border max-md:max-w-full max-md:mx-5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-[#E2E8F0] dark:border-tk-border shrink-0">
                            <h2 className="text-xl font-bold text-tk-text m-0 tracking-tight font-sans">Add New Table</h2>
                            <button className="bg-transparent border-none text-[#4A5568] cursor-pointer p-1 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-[#F7FAFC] hover:text-[#1A202C] dark:text-tk-text-secondary dark:hover:bg-tk-bg-elevated" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAdd} className="flex flex-col flex-1 overflow-hidden min-h-0">
                            <div className="p-6 overflow-y-auto flex-1">
                                {formErrors && (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-[#FFF5F5] border border-[#FEB2B2] rounded-lg text-[#C53030] text-[13px] mb-5">
                                        <AlertCircle size={16} />
                                        {formErrors}
                                    </div>
                                )}

                                <div className="mb-5 last:mb-0">
                                    <label className="block text-sm font-medium text-tk-text-secondary mb-1.5">Table Number *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.table_number}
                                        onChange={(e) => setFormData({ ...formData, table_number: parseInt(e.target.value) || 1 })}
                                        className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_3px_rgba(139,58,30,0.1)] placeholder:text-tk-text-muted"
                                        required
                                    />
                                </div>
                                <div className="mb-5 last:mb-0">
                                    <label className="block text-sm font-medium text-tk-text-secondary mb-1.5">Capacity (Seats) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                        className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_3px_rgba(139,58,30,0.1)] placeholder:text-tk-text-muted"
                                        required
                                    />
                                </div>
                                <div className="mb-5 last:mb-0 flex items-center gap-2.5 cursor-pointer font-medium">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative inline-block w-11 h-6 shrink-0">
                                            <input
                                                type="checkbox"
                                                className="peer opacity-0 w-0 h-0"
                                                checked={formData.active}
                                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            />
                                            <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 before:shadow-[0_1px_3px_rgba(0,0,0,0.2)] peer-checked:before:translate-x-[20px]" style={{ backgroundColor: formData.active ? '#38A169' : '#E53E3E' }}></span>
                                        </div>
                                        <span className="text-sm font-medium text-tk-text">Active (available for customers)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 px-7 py-5 border-t border-[#E2E8F0] justify-end dark:border-tk-border max-md:flex-col-reverse shrink-0">
                                <button
                                    type="button"
                                    className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 border-none max-md:w-full bg-[#F7FAFC] text-[#4A5568] border-[1.5px] border-[#E2E8F0] hover:bg-[#EDF2F7] hover:border-[#CBD5E0] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-hover"
                                    onClick={() => setShowAddModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 border-none max-md:w-full bg-tk-burgundy text-white hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(139,58,30,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creating...' : 'Create Table'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Table Modal */}
            {showEditModal && currentTable && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm p-5" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-[20px] w-full max-w-[500px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[modalSlideIn_0.3s_ease-out] dark:bg-tk-bg-card dark:border-tk-border dark:border max-md:max-w-full max-md:mx-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-[#E2E8F0] dark:border-tk-border">
                            <h2 className="text-xl font-bold text-tk-text m-0 tracking-tight font-sans">Edit Table {currentTable.table_number}</h2>
                            <button className="bg-transparent border-none text-[#4A5568] cursor-pointer p-1 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-[#F7FAFC] hover:text-[#1A202C] dark:text-tk-text-secondary dark:hover:bg-tk-bg-elevated" onClick={() => setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitEdit}>
                            <div className="p-6">
                                {formErrors && (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-[#FFF5F5] border border-[#FEB2B2] rounded-lg text-[#C53030] text-[13px] mb-5">
                                        <AlertCircle size={16} />
                                        {formErrors}
                                    </div>
                                )}
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-tk-text-secondary mb-1.5">Table Number *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.table_number}
                                        onChange={(e) => setFormData({ ...formData, table_number: parseInt(e.target.value) || 1 })}
                                        className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_3px_rgba(139,58,30,0.1)] placeholder:text-tk-text-muted"
                                        required
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-tk-text-secondary mb-1.5">Capacity (Seats) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                        className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_3px_rgba(139,58,30,0.1)] placeholder:text-tk-text-muted"
                                        required
                                    />
                                </div>

                                <div className="mb-5 flex items-center gap-2.5 cursor-pointer font-medium">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative inline-block w-11 h-6 shrink-0">
                                            <input
                                                type="checkbox"
                                                className="peer opacity-0 w-0 h-0"
                                                checked={formData.active}
                                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            />
                                            <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 before:shadow-[0_1px_3px_rgba(0,0,0,0.2)] peer-checked:before:translate-x-[20px]" style={{ backgroundColor: formData.active ? '#38A169' : '#E53E3E' }}></span>
                                        </div>
                                        <span className="text-sm font-medium text-tk-text">Active (available for customers)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 px-7 py-5 border-t border-[#E2E8F0] justify-end dark:border-tk-border max-md:flex-col-reverse">
                                <button
                                    type="button"
                                    className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 border-none max-md:w-full bg-[#F7FAFC] text-[#4A5568] border-[1.5px] border-[#E2E8F0] hover:bg-[#EDF2F7] hover:border-[#CBD5E0] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-hover"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 border-none max-md:w-full bg-tk-burgundy text-white hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(139,58,30,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={submitting}
                                >
                                    <Save size={16} />
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && currentTable && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm p-5" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-[20px] w-full max-w-[500px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[modalSlideIn_0.3s_ease-out] dark:bg-tk-bg-card dark:border-tk-border dark:border max-md:max-w-full max-md:mx-5 max-w-[400px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-[#E2E8F0] dark:border-tk-border">
                            <h2 className="text-xl font-bold text-tk-text m-0 tracking-tight font-sans">Delete Table</h2>
                            <button className="bg-transparent border-none text-[#4A5568] cursor-pointer p-1 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-[#F7FAFC] hover:text-[#1A202C] dark:text-tk-text-secondary dark:hover:bg-tk-bg-elevated" onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-[15px] text-[#2D3748] m-0 mb-3 dark:text-tk-text-secondary">
                                Are you sure you want to delete <strong>Table {currentTable.table_number}</strong>?
                            </p>
                            <p className="text-[13px] text-[#4A5568] m-0 dark:text-tk-text-secondary">
                                This action cannot be undone. All associated QR codes will no longer work.
                            </p>
                        </div>
                        <div className="flex gap-3 px-7 py-5 border-t border-[#E2E8F0] justify-end dark:border-tk-border max-md:flex-col-reverse">
                            <button
                                type="button"
                                className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 border-none max-md:w-full bg-[#F7FAFC] text-[#4A5568] border-[1.5px] border-[#E2E8F0] hover:bg-[#EDF2F7] hover:border-[#CBD5E0] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-hover"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 border-none max-md:w-full bg-[#E53E3E] text-white hover:bg-[#C53030] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(229,62,62,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                                onClick={handleConfirmDelete}
                                disabled={submitting}
                            >
                                <Trash2 size={16} />
                                {submitting ? 'Deleting...' : 'Delete Table'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TableManagementPage;
