import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { formatDateShort } from '@restaurant-saas/types';
import {
    QrCode, Download, RefreshCw, Plus, Search, Filter,
    Loader2, CheckCircle, AlertCircle, Unlink, Link,
    ChevronLeft, ChevronRight, X, Copy, Check, Trash2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QrToken {
    id: string;
    token: string;
    status: 'available' | 'assigned';
    table_number: number | null;
    capacity: number | null;
    assigned_restaurant_id: string | null;
    assigned_table_id: string | null;
    assigned_at: string | null;
    created_at: string;
    restaurants?: { name: string } | null;
    restaurant_tables?: { table_number: number } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CUSTOMER_APP_URL = (import.meta.env.VITE_CUSTOMER_APP_URL || 'https://app.tablekard.com').replace(/\/$/, '');
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
const CARD_W = 384;
const CARD_H = 576;
const QR_SIZE = 240;
export const CARD_MM_W = 101.6;
export const CARD_MM_H = 152.4;

// ─── Token generator ─────────────────────────────────────────────────────────

function generateTokenCode(prefix: string): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return `${prefix}${code}`;
}

// ─── Canvas QR card painter (generic, no table number) ───────────────────────

async function paintGenericQrCard(svgId: string, tokenCode: string, tableNumber?: number | null, capacity?: number | null): Promise<HTMLCanvasElement> {
    const SCALE = 3;
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W * SCALE;
    canvas.height = CARD_H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    const DARK = '#61270e';
    const ACCENT = '#2D6A4F';
    const WHITE = '#FFFFFF';
    const BORDER = '#E2E8F0';
    const GRAY = '#718096';

    // Background
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Header bar
    ctx.fillStyle = DARK;
    ctx.fillRect(0, 0, CARD_W, 80);
    ctx.fillStyle = WHITE;
    ctx.font = `700 20px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('TABLEKARD', CARD_W / 2, 42);
    ctx.font = `400 11px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Scan · Order · Enjoy', CARD_W / 2, 62);

    let tokenBadgeY = 145;

    if (tableNumber != null && !isNaN(tableNumber)) {
        const tableBadgeW = 200, tableBadgeH = 44, tableBadgeX = (CARD_W - tableBadgeW) / 2, tableBadgeY = 105;
        ctx.fillStyle = ACCENT;
        ctx.beginPath();
        (ctx as any).roundRect(tableBadgeX, tableBadgeY, tableBadgeW, tableBadgeH, 22);
        ctx.fill();
        ctx.fillStyle = WHITE;
        ctx.font = `700 24px "Segoe UI", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`TABLE ${tableNumber}`, CARD_W / 2, tableBadgeY + 31);

        if (capacity != null && !isNaN(capacity)) {
            ctx.fillStyle = GRAY;
            ctx.font = `600 14px "Segoe UI", Arial, sans-serif`;
            ctx.fillText(`👥 Capacity: ${capacity}`, CARD_W / 2, tableBadgeY + tableBadgeH + 20);
            tokenBadgeY = 195;
        } else {
            tokenBadgeY = 175;
        }
    } else {
        // "GENERIC" label
        ctx.fillStyle = ACCENT;
        ctx.font = `700 28px "Segoe UI", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('TABLE QR', CARD_W / 2, 128);
    }

    // Token code badge
    const badgeW = 240, badgeH = 44, badgeX = (CARD_W - badgeW) / 2, badgeY = tokenBadgeY;
    ctx.fillStyle = '#F7FAFC';
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = DARK;
    ctx.font = `700 18px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(tokenCode, CARD_W / 2, badgeY + 30);

    // Load QR SVG
    const svgEl = document.getElementById(svgId) as unknown as SVGElement | null;
    if (!svgEl) throw new Error(`SVG element #${svgId} not found`);
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });

    // QR box
    const qrPad = 12;
    const qrBoxW = QR_SIZE + qrPad * 2;
    const qrBoxH = QR_SIZE + qrPad * 2;
    const qrBoxX = (CARD_W - qrBoxW) / 2;
    const qrBoxY = tokenBadgeY + 44 + 20;

    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    (ctx as any).roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    (ctx as any).roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 12);
    ctx.stroke();
    ctx.drawImage(qrImage, qrBoxX + qrPad, qrBoxY + qrPad, QR_SIZE, QR_SIZE);

    // SCAN TO ORDER text
    const textY = qrBoxY + qrBoxH + 60;
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const arrowX = CARD_W / 2;
    const arrowTip = textY - 54;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowTip);
    ctx.lineTo(arrowX, arrowTip + 18);
    ctx.moveTo(arrowX - 7, arrowTip + 8);
    ctx.lineTo(arrowX, arrowTip);
    ctx.lineTo(arrowX + 7, arrowTip + 8);
    ctx.stroke();
    ctx.fillStyle = DARK;
    ctx.font = `800 28px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO ORDER', CARD_W / 2, textY);

    // Footnote: link status
    ctx.fillStyle = GRAY;
    ctx.font = `400 10px "Segoe UI", Arial, sans-serif`;
    ctx.fillText('Link this QR to a table in the admin panel', CARD_W / 2, textY + 22);

    // Bottom bar
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, CARD_H - 8, CARD_W, 8);

    return canvas;
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <button
            onClick={copy}
            className="p-1 rounded text-text-muted hover:text-accent-primary transition-colors"
            title="Copy token"
        >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QrTokens({ setSyncAction }: { setSyncAction?: (s: any) => void }) {
    const [tokens, setTokens] = useState<QrToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Generate modal
    const [showGenModal, setShowGenModal] = useState(false);
    const [genQuantity, setGenQuantity] = useState(10);
    const [genPrefix, setGenPrefix] = useState('TK-');
    const [genTableNum, setGenTableNum] = useState('');
    const [genCapacity, setGenCapacity] = useState('');
    const [generating, setGenerating] = useState(false);

    // Filter / search
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;

    // Download state
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Unlink confirm
    const [unlinkTarget, setUnlinkTarget] = useState<QrToken | null>(null);
    const [unlinking, setUnlinking] = useState(false);

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<QrToken | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchTokens = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: e } = await supabase
                .from('qr_code_tokens')
                .select(`
                    id, token, status, table_number, capacity, assigned_restaurant_id, assigned_table_id, assigned_at, created_at,
                    restaurants (name),
                    restaurant_tables (table_number)
                `)
                .order('created_at', { ascending: false });
            if (e) throw e;
            const formatted = ((data || []) as any[]).map(item => ({
                ...item,
                restaurants: Array.isArray(item.restaurants) ? item.restaurants[0] || null : item.restaurants,
                restaurant_tables: Array.isArray(item.restaurant_tables) ? item.restaurant_tables[0] || null : item.restaurant_tables,
            }));
            setTokens(formatted as QrToken[]);
        } catch (err: any) {
            setError('Failed to load tokens: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTokens();
        if (setSyncAction) setSyncAction({ onSync: fetchTokens, loading });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Filtered + paginated tokens ──
    const filtered = tokens.filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (search && !t.token.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalCount = tokens.length;
    const availableCount = tokens.filter(t => t.status === 'available').length;
    const assignedCount = tokens.filter(t => t.status === 'assigned').length;

    // ── Generate tokens ──
    const handleGenerate = async () => {
        if (genQuantity < 1 || genQuantity > 500) return;
        setGenerating(true);
        try {
            const existing = new Set(tokens.map(t => t.token));
            const newTokens: any[] = [];
            let attempts = 0;
            let currentTableNum = genTableNum ? parseInt(genTableNum) : null;
            const parsedCap = genCapacity ? parseInt(genCapacity) : null;

            while (newTokens.length < genQuantity && attempts < genQuantity * 10) {
                attempts++;
                const code = generateTokenCode(genPrefix);
                if (!existing.has(code) && !newTokens.some(nt => nt.token === code)) {
                    newTokens.push({ 
                        token: code, 
                        status: 'available',
                        table_number: !isNaN(currentTableNum as number) ? currentTableNum : null,
                        capacity: !isNaN(parsedCap as number) ? parsedCap : null
                    });
                    if (currentTableNum !== null && !isNaN(currentTableNum)) {
                        currentTableNum++;
                    }
                }
            }
            const { error: insertErr } = await supabase
                .from('qr_code_tokens')
                .insert(newTokens);
            if (insertErr) throw insertErr;
            await fetchTokens();
            setShowGenModal(false);
        } catch (err: any) {
            setError('Failed to generate tokens: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    // ── Download single QR ──
    const downloadQR = async (token: QrToken, format: 'png' | 'pdf') => {
        setDownloadingId(token.id);
        try {
            const qrUrl = `${CUSTOMER_APP_URL}/q/${token.token}`;
            const svgId = `qr-svg-${token.id}`;
            const canvas = await paintGenericQrCard(svgId, token.token, token.table_number, token.capacity);

            if (format === 'png') {
                const link = document.createElement('a');
                link.download = `tablekard-qr-${token.token}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            } else {
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [CARD_MM_W, CARD_MM_H] });
                pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, CARD_MM_W, CARD_MM_H);
                pdf.save(`tablekard-qr-${token.token}.pdf`);
            }
        } catch (err) {
            console.error('QR download failed:', err);
            setError('Failed to generate QR download.');
        } finally {
            setDownloadingId(null);
        }
    };

    // ── Unlink token ──
    const handleUnlink = async () => {
        if (!unlinkTarget) return;
        setUnlinking(true);
        try {
            // Clear qr_token on the table row
            if (unlinkTarget.assigned_table_id) {
                await supabase
                    .from('restaurant_tables')
                    .update({ qr_token: null })
                    .eq('id', unlinkTarget.assigned_table_id);
            }
            // Reset the token
            await supabase
                .from('qr_code_tokens')
                .update({ status: 'available', assigned_restaurant_id: null, assigned_table_id: null, assigned_at: null })
                .eq('id', unlinkTarget.id);
            await fetchTokens();
            setUnlinkTarget(null);
        } catch (err: any) {
            setError('Failed to unlink token: ' + err.message);
        } finally {
            setUnlinking(false);
        }
    };

    // ── Delete token ──
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            // Clear qr_token on table row if assigned
            if (deleteTarget.assigned_table_id) {
                await supabase
                    .from('restaurant_tables')
                    .update({ qr_token: null })
                    .eq('id', deleteTarget.assigned_table_id);
            }
            // Delete the token row
            const { error: delErr } = await supabase
                .from('qr_code_tokens')
                .delete()
                .eq('id', deleteTarget.id);
            if (delErr) throw delErr;

            await fetchTokens();
            setDeleteTarget(null);
        } catch (err: any) {
            setError('Failed to delete token: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-text-main">QR Tokens</h1>
                    <p className="text-sm text-text-muted mt-0.5">Generate and manage generic pre-printed QR codes for restaurants.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={fetchTokens}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface border border-border text-text-muted rounded-lg hover:bg-surface-hover transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowGenModal(true)}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors font-semibold shadow-[0_2px_8px_rgba(5,150,105,0.3)]"
                    >
                        <Plus size={16} />
                        Generate Batch
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Generated', value: totalCount, color: 'text-text-main' },
                    { label: 'Available', value: availableCount, color: 'text-accent-primary' },
                    { label: 'Assigned', value: assignedCount, color: 'text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle size={16} />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)}><X size={14} /></button>
                </div>
            )}

            {/* ── Filter bar ── */}
            <div className="flex gap-3 items-center flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search token..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-8 pr-4 py-2 text-sm bg-surface border border-border rounded-lg text-text-main placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
                    />
                </div>
                <div className="flex gap-1">
                    {(['all', 'available', 'assigned'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors capitalize ${statusFilter === s ? 'bg-accent-primary text-white' : 'bg-surface border border-border text-text-muted hover:bg-surface-hover'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted gap-3">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm">Loading tokens...</span>
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
                        <QrCode size={48} className="opacity-30" />
                        <p className="text-sm">{tokens.length === 0 ? 'No tokens generated yet. Click "Generate Batch" to start.' : 'No tokens match your filter.'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Token</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Table Info</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide hidden md:table-cell">Assigned To</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide hidden lg:table-cell">Created</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(token => {
                                const qrUrl = `${CUSTOMER_APP_URL}/q/${token.token}`;
                                const isDownloading = downloadingId === token.id;
                                return (
                                    <tr key={token.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors last:border-0">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold text-text-main tracking-wide">{token.token}</span>
                                                <CopyButton value={token.token} />
                                                {/* Hidden QR SVG for download */}
                                                <div className="sr-only">
                                                    <QRCodeSVG
                                                        id={`qr-svg-${token.id}`}
                                                        value={qrUrl}
                                                        size={QR_SIZE}
                                                        bgColor="#ffffff"
                                                        fgColor="#1A202C"
                                                        level="H"
                                                        includeMargin
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {token.table_number != null ? (
                                                <div className="flex flex-col">
                                                    <span className="text-text-main text-xs font-medium">Table {token.table_number}</span>
                                                    {token.capacity != null && (
                                                        <span className="text-text-muted text-[10px]">Cap: {token.capacity}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-text-muted text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${token.status === 'available' ? 'bg-accent-primary/15 text-accent-primary' : 'bg-blue-500/15 text-blue-400'}`}>
                                                {token.status === 'available' ? <CheckCircle size={10} /> : <Link size={10} />}
                                                {token.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            {token.status === 'assigned' && token.restaurants ? (
                                                <div className="text-text-muted text-xs">
                                                    <span className="text-text-main font-medium">{token.restaurants.name}</span>
                                                    {token.restaurant_tables && (
                                                        <span className="ml-1.5 px-1.5 py-0.5 bg-surface-hover rounded text-[10px]">
                                                            Table {token.restaurant_tables.table_number}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-text-muted text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                                            {formatDateShort(token.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => downloadQR(token, 'png')}
                                                    disabled={isDownloading}
                                                    className="px-2.5 py-1.5 text-xs rounded-lg bg-surface-hover border border-border text-text-muted hover:text-text-main hover:bg-border transition-colors disabled:opacity-50"
                                                    title="Download PNG"
                                                >
                                                    {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                                </button>
                                                <button
                                                    onClick={() => downloadQR(token, 'pdf')}
                                                    disabled={isDownloading}
                                                    className="px-2.5 py-1.5 text-xs rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 transition-colors disabled:opacity-50"
                                                    title="Download PDF"
                                                >
                                                    PDF
                                                </button>
                                                {token.status === 'assigned' && (
                                                    <button
                                                        onClick={() => setUnlinkTarget(token)}
                                                        className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
                                                        title="Unlink from table"
                                                    >
                                                        <Unlink size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteTarget(token)}
                                                    className="px-2.5 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                                                    title="Delete token"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>{filtered.length} tokens</span>
                    <div className="flex gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-40"><ChevronLeft size={16} /></button>
                        <span className="px-3 py-1 text-xs">{page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-40"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* ── Generate Modal ── */}
            {showGenModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4" onClick={() => setShowGenModal(false)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="font-bold text-text-main text-lg">Generate QR Token Batch</h2>
                            <button onClick={() => setShowGenModal(false)} className="text-text-muted hover:text-text-main"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Token Prefix</label>
                                    <input
                                        type="text"
                                        value={genPrefix}
                                        onChange={e => setGenPrefix(e.target.value.toUpperCase())}
                                        maxLength={5}
                                        className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main font-mono focus:outline-none focus:border-accent-primary/50"
                                        placeholder="TK-"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Quantity</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={genQuantity}
                                        onChange={e => setGenQuantity(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-surface-hover rounded-xl border border-border space-y-4">
                                <h3 className="text-sm font-medium text-text-main">Pre-configure Table Info (Optional)</h3>
                                <p className="text-xs text-text-muted">If provided, table numbers will automatically increment for each token in the batch.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-text-muted mb-1.5">Starting Table Number</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={genTableNum}
                                            onChange={e => setGenTableNum(e.target.value)}
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                            placeholder="e.g. 1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-muted mb-1.5">Seat Capacity</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={genCapacity}
                                            onChange={e => setGenCapacity(e.target.value)}
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                            placeholder="e.g. 4"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-border">
                            <button onClick={() => setShowGenModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 py-2 rounded-lg bg-accent-primary text-white text-sm font-semibold hover:bg-accent-secondary transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {generating ? <><Loader2 size={14} className="animate-spin" />Generating...</> : `Generate ${genQuantity} Tokens`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Unlink Confirm Modal ── */}
            {unlinkTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4" onClick={() => setUnlinkTarget(null)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                                    <Unlink size={18} className="text-amber-400" />
                                </div>
                                <h2 className="font-bold text-text-main">Unlink Token</h2>
                            </div>
                            <p className="text-sm text-text-muted mb-1">
                                Are you sure you want to unlink <span className="font-mono font-semibold text-text-main">{unlinkTarget.token}</span>?
                            </p>
                            {unlinkTarget.restaurants && (
                                <p className="text-sm text-text-muted">
                                    Currently assigned to <strong className="text-text-main">{unlinkTarget.restaurants.name}</strong>
                                    {unlinkTarget.restaurant_tables && ` — Table ${unlinkTarget.restaurant_tables.table_number}`}.
                                </p>
                            )}
                            <p className="text-xs text-amber-400/90 mt-3">The QR sticker will stop working until it is linked to another table.</p>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-border">
                            <button onClick={() => setUnlinkTarget(null)} className="flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                            <button
                                onClick={handleUnlink}
                                disabled={unlinking}
                                className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {unlinking ? <><Loader2 size={14} className="animate-spin" />Unlinking...</> : 'Unlink Token'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                                    <Trash2 size={18} className="text-red-400" />
                                </div>
                                <h2 className="font-bold text-text-main">Delete Token</h2>
                            </div>
                            <p className="text-sm text-text-muted mb-1">
                                Are you sure you want to permanently delete token <span className="font-mono font-semibold text-text-main">{deleteTarget.token}</span>?
                            </p>
                            {deleteTarget.restaurants && (
                                <p className="text-sm text-text-muted mt-2">
                                    This token is currently assigned to <strong className="text-text-main">{deleteTarget.restaurants.name}</strong>
                                    {deleteTarget.restaurant_tables && ` — Table ${deleteTarget.restaurant_tables.table_number}`}.
                                </p>
                            )}
                            <p className="text-xs text-red-400 mt-3">This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-border">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {deleting ? <><Loader2 size={14} className="animate-spin" />Deleting...</> : 'Delete Token'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
