import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Download, RefreshCw, QrCode, Table2, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/AuthContext';
import { useRestaurantTables } from '../hooks/useSupabaseQuery';
import { paintQrTemplate, CARD_MM_W, CARD_MM_H } from '../utils/qrTemplatePainter';
import type { RestaurantTable } from '../services/supabaseService';


// The base URL of the customer web app (e.g., http://192.168.1.16:3003)
const CUSTOMER_APP_URL = (import.meta.env.VITE_CUSTOMER_APP_URL || 'https://app.tablekard.com').replace(/\/$/, '');

const QRCodePage: React.FC = () => {
    const { activeRestaurantId, activeRestaurantName } = useAuth();
    const [qrSize, setQrSize] = useState(200);

    // React Query: cached, auto-retries, refetches on tab focus
    const { data: tables = [], isLoading: loading, error: queryError, refetch } = useRestaurantTables(activeRestaurantId);
    const error = queryError ? 'Failed to load tables. Please try again.' : null;

    const buildQrUrl = (_tableId: string, tableNumber: number) =>
        `${CUSTOMER_APP_URL}/order/${activeRestaurantId}/${tableNumber}`;

    const downloadQR = async (tableId: string, tableNumber: number) => {
        try {
            const canvas = await paintQrTemplate({
                qrSvgElementId: `qr-svg-${tableId}`,
                restaurantName: activeRestaurantName,
                tableNumber,
                qrUrl: buildQrUrl(tableId, tableNumber),
                qrSize
            });

            const link = document.createElement('a');
            link.download = `${activeRestaurantName.replace(/\s+/g, '-')}-table-${tableNumber}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (err) {
            console.error('Failed to generate QR:', err);
            alert('Failed to generate QR image');
        }
    };

    const downloadPDF = async (tableId: string, tableNumber: number) => {
        try {
            const canvas = await paintQrTemplate({
                qrSvgElementId: `qr-svg-${tableId}`,
                restaurantName: activeRestaurantName,
                tableNumber,
                qrUrl: buildQrUrl(tableId, tableNumber),
                qrSize: 300 // High resolution for PDF
            });

            const imgData = canvas.toDataURL('image/png', 1.0);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [CARD_MM_W, CARD_MM_H]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, CARD_MM_W, CARD_MM_H);
            pdf.save(`${activeRestaurantName.replace(/\s+/g, '-')}-table-${tableNumber}.pdf`);
        } catch (err) {
            console.error('Failed to generate PDF:', err);
            alert('Failed to generate PDF');
        }
    };

    const downloadAll = () => {
        tables.forEach((t: RestaurantTable, i: number) => {
            setTimeout(() => downloadQR(t.id, t.table_number), i * 300);
        });
    };

    return (
        <div className="flex min-h-screen bg-tk-bg relative font-['Outfit',sans-serif]">
            <Sidebar />

            <div className="flex-1 p-5 overflow-y-auto min-h-screen transition-all duration-300 ml-[240px] [.sidebar-collapsed_&]:ml-[80px] max-md:!ml-0 max-md:!p-4 max-md:!pt-[72px] bg-[#f7f8fa] md:rounded-l-[32px] md:shadow-[-8px_0_24px_rgba(0,0,0,0.12)]">
                {/* Header */}
                <div className="flex justify-between items-start mb-7 flex-wrap gap-4 max-md:flex-col">
                    <div>
                        <h1 className="text-[32px] font-bold text-[#1A202C] m-0 mb-1 max-md:text-2xl">QR Code Generator</h1>
                        <p className="text-sm text-[#718096] m-0">
                            Generate QR codes for your tables. Customers scan to open the menu.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center shrink-0 max-md:w-full">
                        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-[1.5px] border-[#E2E8F0] rounded-xl text-sm font-medium text-[#4A5568] cursor-pointer transition-all duration-200 hover:not-disabled:bg-[#F7FAFC] hover:not-disabled:border-[#CBD5E0] disabled:opacity-60 disabled:cursor-not-allowed max-md:flex-1" onClick={() => refetch()} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        {tables.length > 0 && (
                            <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-tk-burgundy border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(139,58,30,0.3)] hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(139,58,30,0.4)] max-md:flex-1" onClick={downloadAll}>
                                <Download size={16} />
                                Download All
                            </button>
                        )}
                    </div>
                </div>

                {/* Size Control */}
                <div className="flex items-center gap-6 mb-7 bg-white rounded-2xl py-4 px-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex-wrap">
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-[#4A5568] whitespace-nowrap min-w-[110px]">QR Size: {qrSize}px</label>
                        <input
                            type="range"
                            min={100}
                            max={250}
                            step={10}
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                            className="flex-1 h-1 accent-tk-burgundy cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#EBF8FF] text-[#2B6CB0] rounded-full text-sm font-semibold shrink-0">
                        <Table2 size={16} />
                        {loading ? '...' : `${tables.length} Tables`}
                    </div>
                </div>

                {/* States */}
                {loading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-[#718096] text-center">
                        <div className="w-10 h-10 border-4 border-[#E2E8F0] border-t-tk-burgundy rounded-full animate-spin"></div>
                        <p>Loading tables...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center gap-4 py-15 px-8 text-center text-[#E53E3E]">
                        <AlertCircle size={40} color="#E53E3E" />
                        <p>{error}</p>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border-[1.5px] border-[#E2E8F0] rounded-xl text-sm font-medium text-[#4A5568] cursor-pointer transition-all duration-200 hover:not-disabled:bg-[#F7FAFC] hover:not-disabled:border-[#CBD5E0]" onClick={() => refetch()}>Try Again</button>
                    </div>
                )}

                {!loading && !error && tables.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-[#718096] text-center">
                        <QrCode size={64} color="#CBD5E0" />
                        <p className="text-xl font-semibold text-[#4A5568] m-0">No tables found</p>
                        <p className="text-sm text-[#A0AEC0] max-w-[300px] m-0">Add tables to your restaurant to generate QR codes.</p>
                    </div>
                )}

                {/* QR Grid */}
                {!loading && !error && tables.length > 0 && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] max-md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] max-[480px]:grid-cols-1 gap-6 max-md:gap-4">
                        {tables.map((table: RestaurantTable) => {
                            const url = buildQrUrl(table.id, table.table_number);
                            return (
                                <div key={table.id} className={`bg-white rounded-[20px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#E2E8F0] flex flex-col items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] ${!table.active ? 'opacity-60 border-dashed' : ''}`}>
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-lg font-bold text-[#1A202C]">Table {table.table_number}</span>
                                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${table.active ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FED7D7] text-[#742A2A]'}`}>
                                            {table.active ? (
                                                <><CheckCircle size={12} /> Active</>
                                            ) : (
                                                <><AlertCircle size={12} /> Inactive</>
                                            )}
                                        </span>
                                    </div>

                                    <div className="bg-white rounded-xl p-2 border border-[#E2E8F0] flex items-center justify-center">
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

                                    <div className="w-full flex flex-col gap-2.5 items-center">
                                        <div className="flex gap-3 text-xs text-[#718096] font-medium">
                                            <span className="qr-capacity">👥 Capacity: {table.capacity}</span>
                                        </div>
                                        <div className="flex gap-2.5 w-full">
                                            <button
                                                className="flex items-center justify-center gap-1.5 py-2 px-2 border border-[#E2E8F0] rounded-[10px] text-xs font-semibold cursor-pointer transition-all duration-200 flex-1 min-w-0 whitespace-nowrap bg-[#EDF2F7] text-[#4A5568] hover:bg-[#E2E8F0] hover:-translate-y-0.5"
                                                onClick={() => downloadQR(table.id, table.table_number)}
                                                title="Download as PNG Image"
                                            >
                                                <Download size={14} />
                                                PNG
                                            </button>
                                            <button
                                                className="flex items-center justify-center gap-1.5 py-2 px-2 border-none rounded-[10px] text-xs font-semibold cursor-pointer transition-all duration-200 flex-1 min-w-0 whitespace-nowrap bg-tk-burgundy text-white shadow-[0_4px_12px_rgba(139,58,30,0.2)] hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(139,58,30,0.3)]"
                                                onClick={() => downloadPDF(table.id, table.table_number)}
                                                title="Generate PDF for Printing"
                                            >
                                                <Download size={14} />
                                                PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRCodePage;
