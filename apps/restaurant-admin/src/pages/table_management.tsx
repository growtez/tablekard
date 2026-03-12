import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
    Download, 
    RefreshCw, 
    QrCode, 
    Table2, 
    CheckCircle, 
    AlertCircle, 
    Plus, 
    Edit2, 
    Trash2, 
    X, 
    Save,
    Users
} from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { 
    getRestaurantTables, 
    createRestaurantTable, 
    updateRestaurantTable, 
    deleteRestaurantTable 
} from '../services/supabaseService';
import { useTabVisibilityRefetch } from '../hooks/useTabVisibilityRefetch';
import type { RestaurantTable } from '../services/supabaseService';
import './table_management.css';

const BASE_URL = 'https://tablekard.com/menu';

interface TableFormData {
    table_number: number;
    capacity: number;
    active: boolean;
}

const TableManagementPage: React.FC = () => {
    const { activeRestaurantId } = useAuth();
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrSize, setQrSize] = useState(160);
    const [initialLoad, setInitialLoad] = useState(true);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentTable, setCurrentTable] = useState<RestaurantTable | null>(null);
    
    // Form states
    const [formData, setFormData] = useState<TableFormData>({
        table_number: 1,
        capacity: 4,
        active: true
    });
    const [formErrors, setFormErrors] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchTables = useCallback(async () => {
        if (!activeRestaurantId) return;
        if (initialLoad) setLoading(true);
        setError(null);
        try {
            const data = await getRestaurantTables(activeRestaurantId);
            setTables(data);
        } catch (err: any) {
            console.error('Failed to fetch tables:', err);
            setError('Failed to load tables. Please try again.');
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, [activeRestaurantId, initialLoad]);

    const { refetch: refetchTables, refetching } = useTabVisibilityRefetch(fetchTables, {
        enabled: !!activeRestaurantId,
        autoRefreshInterval: 30000,
        refetchOnMount: true,
    });

    useEffect(() => {
        if (activeRestaurantId) {
            refetchTables(true);
        } else {
            setLoading(false);
        }
    }, [activeRestaurantId, refetchTables]);

    const buildQrUrl = (_tableId: string, tableNumber: number) =>
        `${BASE_URL}?restaurant_id=${activeRestaurantId}&table_id=${tableNumber}`;

    const downloadQR = (tableId: string, tableNumber: number) => {
        const svgEl = document.getElementById(`qr-svg-${tableId}`) as SVGElement | null;
        if (!svgEl) return;

        const svgData = new XMLSerializer().serializeToString(svgEl);
        const canvas = document.createElement('canvas');
        const size = qrSize + 40;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 20, 20, qrSize, qrSize);
            const link = document.createElement('a');
            link.download = `table-${tableNumber}-qr.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const downloadAll = () => {
        tables.forEach((t, i) => {
            setTimeout(() => downloadQR(t.id, t.table_number), i * 300);
        });
    };

    // Add Table
    const handleAddTable = () => {
        setFormData({
            table_number: tables.length > 0 ? Math.max(...tables.map(t => t.table_number)) + 1 : 1,
            capacity: 4,
            active: true
        });
        setFormErrors(null);
        setShowAddModal(true);
    };

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRestaurantId) return;

        // Validation
        if (formData.table_number < 1) {
            setFormErrors('Table number must be at least 1');
            return;
        }
        if (formData.capacity < 1) {
            setFormErrors('Capacity must be at least 1');
            return;
        }
        if (tables.some(t => t.table_number === formData.table_number)) {
            setFormErrors(`Table ${formData.table_number} already exists`);
            return;
        }

        setSubmitting(true);
        setFormErrors(null);
        try {
            await createRestaurantTable(activeRestaurantId, formData);
            await fetchTables();
            setShowAddModal(false);
        } catch (err: any) {
            console.error('Failed to create table:', err);
            setFormErrors(err.message || 'Failed to create table. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit Table
    const handleEditTable = (table: RestaurantTable) => {
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
        if (!currentTable) return;

        // Validation
        if (formData.table_number < 1) {
            setFormErrors('Table number must be at least 1');
            return;
        }
        if (formData.capacity < 1) {
            setFormErrors('Capacity must be at least 1');
            return;
        }
        if (tables.some(t => t.id !== currentTable.id && t.table_number === formData.table_number)) {
            setFormErrors(`Table ${formData.table_number} already exists`);
            return;
        }

        setSubmitting(true);
        setFormErrors(null);
        try {
            await updateRestaurantTable(currentTable.id, formData);
            await fetchTables();
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
        if (!currentTable) return;

        setSubmitting(true);
        try {
            await deleteRestaurantTable(currentTable.id);
            await fetchTables();
            setShowDeleteModal(false);
            setCurrentTable(null);
        } catch (err: any) {
            console.error('Failed to delete table:', err);
            setError('Failed to delete table. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Quick toggle active status
    const handleToggleActive = async (table: RestaurantTable) => {
        try {
            await updateRestaurantTable(table.id, { active: !table.active });
            await refetchTables(true);
        } catch (err: any) {
            console.error('Failed to toggle table status:', err);
            setError('Failed to update table status.');
        }
    };

    return (
        <div className="tm-container">
            <Sidebar />

            <div className="tm-main-content">
                {/* Header */}
                <div className="tm-header">
                    <div>
                        <h1 className="tm-page-title">Table Management</h1>
                        <p className="tm-page-subtitle">
                            Manage your restaurant tables and generate QR codes for customer access.
                        </p>
                    </div>
                    <div className="tm-header-actions">
                        <button className="tm-refresh-btn" onClick={() => refetchTables(true)} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'spin' : ''} />
                            Refresh
                        </button>
                        <button className="tm-add-btn" onClick={handleAddTable}>
                            <Plus size={16} />
                            Add Table
                        </button>
                        {tables.length > 0 && (
                            <button className="tm-download-all-btn" onClick={downloadAll}>
                                <Download size={16} />
                                Download All QR
                            </button>
                        )}
                    </div>
                </div>

                {/* Controls Row */}
                <div className="tm-controls">
                    <div className="tm-size-control">
                        <label className="tm-size-label">QR Size: {qrSize}px</label>
                        <input
                            type="range"
                            min={100}
                            max={250}
                            step={10}
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                            className="tm-size-slider"
                        />
                    </div>
                    <div className="tm-stats">
                        <div className="tm-count-badge">
                            <Table2 size={16} />
                            {loading && !refetching ? '...' : `${tables.length} Tables`}
                        </div>
                        <div className="tm-count-badge active">
                            <CheckCircle size={16} />
                            {loading && !refetching ? '...' : `${tables.filter(t => t.active).length} Active`}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="tm-error-banner">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                        <button onClick={() => setError(null)}><X size={16} /></button>
                    </div>
                )}

                {/* States */}
                {loading && !refetching && (
                    <div className="tm-state-center">
                        <div className="tm-spinner"></div>
                        <p>Loading tables...</p>
                    </div>
                )}

                {(!loading || refetching) && tables.length === 0 && (
                    <div className="tm-state-center">
                        <QrCode size={64} color="#CBD5E0" />
                        <p className="tm-empty-title">No tables found</p>
                        <p className="tm-empty-sub">Add your first table to get started with QR code generation.</p>
                        <button className="tm-add-btn" onClick={handleAddTable}>
                            <Plus size={16} />
                            Add First Table
                        </button>
                    </div>
                )}

                {/* Tables Grid */}
                {(!loading || refetching) && tables.length > 0 && (
                    <div className="tm-grid">
                        {tables.map((table) => {
                            const url = buildQrUrl(table.id, table.table_number);
                            return (
                                <div key={table.id} className={`tm-card ${!table.active ? 'tm-card-inactive' : ''}`}>
                                    <div className="tm-card-header">
                                        <span className="tm-table-label">Table {table.table_number}</span>
                                        <div className="tm-card-actions">
                                            <button 
                                                className="tm-icon-btn edit" 
                                                onClick={() => handleEditTable(table)}
                                                title="Edit table"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                className="tm-icon-btn delete" 
                                                onClick={() => handleDeleteTable(table)}
                                                title="Delete table"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div 
                                        className={`tm-status-badge ${table.active ? 'active' : 'inactive'}`}
                                        onClick={() => handleToggleActive(table)}
                                        title="Click to toggle status"
                                    >
                                        {table.active ? (
                                            <><CheckCircle size={12} /> Active</>
                                        ) : (
                                            <><AlertCircle size={12} /> Inactive</>
                                        )}
                                    </div>

                                    <div className="tm-code-wrapper">
                                        <QRCodeSVG
                                            id={`qr-svg-${table.id}`}
                                            value={url}
                                            size={qrSize}
                                            bgColor="#ffffff"
                                            fgColor="#1A202C"
                                            level="H"
                                            includeMargin
                                        />
                                    </div>

                                    <div className="tm-card-footer">
                                        <p className="tm-url-text" title={url}>{url}</p>
                                        <div className="tm-card-meta">
                                            <span className="tm-capacity">
                                                <Users size={14} />
                                                {table.capacity} seats
                                            </span>
                                        </div>
                                        <button
                                            className="tm-download-btn"
                                            onClick={() => downloadQR(table.id, table.table_number)}
                                        >
                                            <Download size={14} />
                                            Download QR
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Table Modal */}
            {showAddModal && (
                <div className="tm-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="tm-modal-header">
                            <h2>Add New Table</h2>
                            <button className="tm-modal-close" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAdd}>
                            <div className="tm-modal-body">
                                {formErrors && (
                                    <div className="tm-form-error">
                                        <AlertCircle size={16} />
                                        {formErrors}
                                    </div>
                                )}
                                <div className="tm-form-group">
                                    <label>Table Number *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.table_number}
                                        onChange={(e) => setFormData({ ...formData, table_number: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                                <div className="tm-form-group">
                                    <label>Capacity (Seats) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                                <div className="tm-form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                        <span>Active (available for customers)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="tm-modal-footer">
                                <button 
                                    type="button" 
                                    className="tm-btn-secondary" 
                                    onClick={() => setShowAddModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="tm-btn-primary" 
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
                <div className="tm-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="tm-modal-header">
                            <h2>Edit Table {currentTable.table_number}</h2>
                            <button className="tm-modal-close" onClick={() => setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitEdit}>
                            <div className="tm-modal-body">
                                {formErrors && (
                                    <div className="tm-form-error">
                                        <AlertCircle size={16} />
                                        {formErrors}
                                    </div>
                                )}
                                <div className="tm-form-group">
                                    <label>Table Number *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.table_number}
                                        onChange={(e) => setFormData({ ...formData, table_number: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                                <div className="tm-form-group">
                                    <label>Capacity (Seats) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                                <div className="tm-form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                        <span>Active (available for customers)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="tm-modal-footer">
                                <button 
                                    type="button" 
                                    className="tm-btn-secondary" 
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="tm-btn-primary" 
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
                <div className="tm-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="tm-modal tm-modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="tm-modal-header">
                            <h2>Delete Table</h2>
                            <button className="tm-modal-close" onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="tm-modal-body">
                            <p className="tm-delete-message">
                                Are you sure you want to delete <strong>Table {currentTable.table_number}</strong>?
                            </p>
                            <p className="tm-delete-warning">
                                This action cannot be undone. All associated QR codes will no longer work.
                            </p>
                        </div>
                        <div className="tm-modal-footer">
                            <button 
                                type="button" 
                                className="tm-btn-secondary" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="tm-btn-danger" 
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
        </div>
    );
};

export default TableManagementPage;