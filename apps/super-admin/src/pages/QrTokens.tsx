import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { formatDateShort } from '@restaurant-saas/types';
import {
    QrCode, Download, RefreshCw, Plus, Search, Filter,
    Loader2, CheckCircle, AlertCircle, Unlink, Link as LinkIcon,
    ChevronLeft, ChevronRight, X, Copy, Check, Trash2, Building2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { TableRowsSkeleton } from '../components/ui/Skeleton';

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
    for (let i = 0; i < 16; i++) {
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

export default function QrTokens() {
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

    // Link modal
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkTarget, setLinkTarget] = useState<QrToken | null>(null);
    const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    const [linkTokenId, setLinkTokenId] = useState<string>('');
    const [linkRestaurantId, setLinkRestaurantId] = useState<string>('');
    const [linkTableNo, setLinkTableNo] = useState<number>(1);
    const [linkSeatCapacity, setLinkSeatCapacity] = useState<number>(4);
    const [linking, setLinking] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);

    // Filter / search
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-suggest next table number when selected restaurant changes in Link modal
    useEffect(() => {
        if (!linkRestaurantId || !showLinkModal) return;
        const fetchExistingTables = async () => {
            try {
                const { data } = await supabase
                    .from('restaurant_tables')
                    .select('table_number, capacity')
                    .eq('restaurant_id', linkRestaurantId);

                if (data && data.length > 0) {
                    if (!linkTarget || !linkTarget.assigned_table_id) {
                        const existingTableNumbers = data.map((t: any) => t.table_number);
                        const nextNum = Math.max(...existingTableNumbers) + 1;
                        setLinkTableNo(nextNum);
                    }
                } else {
                    if (!linkTarget || !linkTarget.assigned_table_id) {
                        setLinkTableNo(1);
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch restaurant tables:', e);
            }
        };
        fetchExistingTables();
    }, [linkRestaurantId, showLinkModal]);

    // ── Open Link Modal ──
    const openLinkModal = async (token?: QrToken) => {
        setLinkError(null);
        if (token) {
            setLinkTarget(token);
            setLinkTokenId(token.id);
            setLinkRestaurantId(token.assigned_restaurant_id || '');
            setLinkTableNo(token.restaurant_tables?.table_number || 1);
            setLinkSeatCapacity(4);
        } else {
            setLinkTarget(null);
            const availableTok = tokens.find(t => t.status === 'available');
            setLinkTokenId(availableTok ? availableTok.id : (tokens[0]?.id || ''));
            setLinkRestaurantId('');
            setLinkTableNo(1);
            setLinkSeatCapacity(4);
        }
        setShowLinkModal(true);

        if (restaurants.length === 0) {
            setLoadingRestaurants(true);
            try {
                const { data, error: resErr } = await supabase
                    .from('restaurants')
                    .select('id, name')
                    .order('name', { ascending: true });
                if (resErr) throw resErr;
                setRestaurants(data || []);
            } catch (err: any) {
                setLinkError('Failed to load restaurants: ' + err.message);
            } finally {
                setLoadingRestaurants(false);
            }
        }
    };

    // ── Handle Link Form Submission ──
    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLinkError(null);

        const tokenObj = linkTarget || tokens.find(t => t.id === linkTokenId);
        if (!tokenObj) {
            setLinkError('Please select a valid QR token.');
            return;
        }
        if (!linkRestaurantId) {
            setLinkError('Please select a restaurant.');
            return;
        }
        if (linkTableNo < 1) {
            setLinkError('Table number must be at least 1.');
            return;
        }
        if (linkSeatCapacity < 1) {
            setLinkError('Seat capacity must be at least 1.');
            return;
        }

        setLinking(true);
        try {
            // 1. If token was previously assigned to another table, clear qr_token on that table
            if (tokenObj.assigned_table_id) {
                await supabase
                    .from('restaurant_tables')
                    .update({ qr_token: null })
                    .eq('id', tokenObj.assigned_table_id);
            }

            // 2. Check if a table with (restaurant_id, table_number) already exists
            const { data: existingTable, error: findErr } = await supabase
                .from('restaurant_tables')
                .select('id, qr_token, capacity')
                .eq('restaurant_id', linkRestaurantId)
                .eq('table_number', linkTableNo)
                .maybeSingle();

            if (findErr) throw findErr;

            let targetTableId = existingTable?.id;

            // If existing table had a DIFFERENT qr_token, free up that old token in qr_code_tokens
            if (existingTable && existingTable.qr_token && existingTable.qr_token !== tokenObj.token) {
                await supabase
                    .from('qr_code_tokens')
                    .update({
                        status: 'available',
                        assigned_restaurant_id: null,
                        assigned_table_id: null,
                        assigned_at: null
                    })
                    .eq('token', existingTable.qr_token);
            }

            if (existingTable) {
                // Update existing table with new qr_token and seat capacity
                const { error: updateTableErr } = await supabase
                    .from('restaurant_tables')
                    .update({
                        qr_token: tokenObj.token,
                        capacity: linkSeatCapacity,
                        active: true
                    })
                    .eq('id', existingTable.id);
                if (updateTableErr) throw updateTableErr;
            } else {
                // Create a new table for the restaurant
                const { data: newTable, error: createTableErr } = await supabase
                    .from('restaurant_tables')
                    .insert({
                        restaurant_id: linkRestaurantId,
                        table_number: linkTableNo,
                        capacity: linkSeatCapacity,
                        qr_token: tokenObj.token,
                        active: true
                    })
                    .select('id')
                    .single();
                if (createTableErr) throw createTableErr;
                targetTableId = newTable.id;
            }

            // 3. Update token status in qr_code_tokens
            const { error: updateTokenErr } = await supabase
                .from('qr_code_tokens')
                .update({
                    status: 'assigned',
                    assigned_restaurant_id: linkRestaurantId,
                    assigned_table_id: targetTableId,
                    assigned_at: new Date().toISOString()
                })
                .eq('id', tokenObj.id);

            if (updateTokenErr) throw updateTokenErr;

            await fetchTokens();
            setShowLinkModal(false);
            setLinkTarget(null);
        } catch (err: any) {
            setLinkError('Failed to link token: ' + err.message);
        } finally {
            setLinking(false);
        }
    };

    // ── Filtered + paginated tokens ──
    const filtered = tokens.filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (search && !t.token.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    const getPaginationPages = () => {
        if (totalPages <= 3) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safePage === totalPages) {
            return [1, '...', totalPages];
        }
        if (safePage === totalPages - 1) {
            return [safePage - 1, safePage, totalPages];
        }
        return [safePage, '...', totalPages];
    };

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
        <div className="space-y-3 w-full">

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

            {/* ── List Control ── */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
                {/* Search Box */}
                <div className="relative w-full md:max-w-[260px] shrink-0">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search tokens..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                </div>

                {/* Inline Active Filters */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
                    {(search || statusFilter !== 'all') ? (
                        <>
                            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                            {search && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    "{search}"
                                    <button onClick={() => setSearch('')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                    <button onClick={() => setStatusFilter('all')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            <button
                                onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); }}
                                className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0"
                            >
                                Clear
                            </button>
                        </>
                    ) : (
                        <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between md:justify-start gap-1 shrink-0 md:border-x md:border-border/50 px-3 py-1.5 md:py-0 w-full md:w-auto">
                    <button onClick={() => setPage(p => Math.max(1, Number(p) - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronLeft size={14} />
                    </button>
                    <div className="flex items-center justify-center gap-1 w-[80px]">
                        {getPaginationPages().map((p, i) => p === '...' ? (
                            <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
                        ) : (
                            <button key={p} onClick={() => setPage(Number(p))} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p}</button>
                        ))}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages, Number(p) + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Per-page & Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
                        {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                    </select>
                    <div className="relative group flex-1 md:flex-none">
                        <button
                            onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
                        >
                            <Filter size={14} className="text-accent-primary" /> Status
                        </button>
                        <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${isStatusFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                            }`}>
                            {[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'available', label: 'Available' },
                                { value: 'assigned', label: 'Assigned' }
                            ].map(option => (
                                <button key={option.value} onClick={() => { setStatusFilter(option.value as any); setIsStatusFilterOpen(false); setPage(1); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${statusFilter === option.value ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => openLinkModal()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-[12px] font-medium shadow-sm cursor-pointer border-none flex-1 md:flex-none"
                    >
                        <LinkIcon size={14} /> Link
                    </button>
                    <button
                        onClick={() => setShowGenModal(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover transition-colors text-[12px] font-medium shadow-sm cursor-pointer border-none flex-1 md:flex-none"
                    >
                        <Plus size={14} /> Generate
                    </button>
                </div>
            </div>

            {/* ── Tokens Table ── */}
            <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Desktop View Table */}
                <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap table-fixed">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[25%]">Token</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[12%]">Table Info</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Status</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]">Assigned To</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Created</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-right w-[23%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableRowsSkeleton rows={perPage} columns={6} />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-text-muted text-[13px]">
                                    {tokens.length === 0 ? 'No tokens generated yet. Click "Generate Batch" to start.' : 'No tokens match your filter.'}
                                </td>
                            </tr>
                        ) : (
                            <>
                                {paginated.map(token => {
                                    const qrUrl = `${CUSTOMER_APP_URL}/q/${token.token}`;
                                    const isDownloading = downloadingId === token.id;
                                    return (
                                        <tr
                                            key={token.id}
                                            className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors"
                                        >
                                            <td className="py-2.5 px-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                                                        <QrCode size={14} className="text-accent-primary" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="font-mono font-semibold text-text-main text-[13px] tracking-wide truncate max-w-[140px] group-hover:text-accent-primary transition-colors" title={token.token}>{token.token}</span>
                                                        <CopyButton value={token.token} />
                                                    </div>
                                                    <div className="sr-only">
                                                        <QRCodeSVG id={`qr-svg-${token.id}`} value={qrUrl} size={QR_SIZE} bgColor="#ffffff" fgColor="#1A202C" level="H" includeMargin />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4 align-middle">
                                                {token.table_number != null ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-text-main text-[12px] font-medium">Table {token.table_number}</span>
                                                        {token.capacity != null && (
                                                            <span className="text-text-muted text-[11px]">Cap: {token.capacity}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-text-muted text-[12px] opacity-60">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 align-middle">
                                                <span className={`text-[12px] font-bold ${token.status === 'available' ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {token.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 align-middle">
                                                {token.status === 'assigned' && token.restaurants ? (
                                                    <div className="flex items-center gap-2 text-[12px]">
                                                        <span className="font-medium text-text-main truncate max-w-[150px]" title={token.restaurants.name}>
                                                            {token.restaurants.name}
                                                        </span>
                                                        {token.restaurant_tables && (
                                                            <span className="px-1.5 py-0.5 bg-surface-hover rounded text-[10px] text-text-muted shrink-0">
                                                                Table {token.restaurant_tables.table_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-text-muted text-[12px] opacity-60">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 align-middle">
                                                <span className="text-text-muted text-[12px] font-medium">
                                                    {formatDateShort(token.created_at)}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 align-middle">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openLinkModal(token)}
                                                        className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1 font-medium"
                                                        title={token.status === 'assigned' ? 'Re-link / Edit Restaurant & Table' : 'Link QR token to a restaurant'}
                                                    >
                                                        <LinkIcon size={12} />
                                                        {token.status === 'assigned' ? 'Edit Link' : 'Link'}
                                                    </button>
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
                                {perPage - paginated.length > 0 && Array.from({ length: perPage - paginated.length }).map((_, idx) => (
                                    <tr key={`empty-${idx}`} className="border-b border-border/40 last:border-b-0 opacity-0 pointer-events-none">
                                        <td colSpan={6} className="py-2.5 px-4 align-middle">
                                            <div className="h-8"></div>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>

                {/* Mobile View Cards */}
                <div className="block md:hidden divide-y divide-border/40">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="animate-pulse flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-border/40" />
                                            <div className="h-4 bg-border/40 rounded w-28" />
                                        </div>
                                        <div className="h-4 bg-border/40 rounded w-16" />
                                    </div>
                                    <div className="space-y-2 pl-11">
                                        <div className="h-3.5 bg-border/40 rounded w-48" />
                                        <div className="h-3.5 bg-border/40 rounded w-36" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-10 text-text-muted text-[13px]">
                            {tokens.length === 0 ? 'No tokens generated yet. Click "Generate Batch" to start.' : 'No tokens match your filter.'}
                        </div>
                    ) : (
                        paginated.map(token => {
                            const qrUrl = `${CUSTOMER_APP_URL}/q/${token.token}`;
                            const isDownloading = downloadingId === token.id;
                            return (
                                <div
                                    key={token.id}
                                    className="p-4 hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors flex flex-col gap-2.5"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                                                <QrCode size={14} className="text-accent-primary" />
                                            </div>
                                            <span className="font-mono font-semibold text-text-main text-[13px] truncate" title={token.token}>
                                                {token.token}
                                            </span>
                                            <CopyButton value={token.token} />
                                        </div>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded bg-surface-hover border border-border/40 ${token.status === 'available' ? 'text-green-600' : 'text-blue-600'}`}>
                                            {token.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="sr-only">
                                        <QRCodeSVG id={`qr-svg-${token.id}`} value={qrUrl} size={QR_SIZE} bgColor="#ffffff" fgColor="#1A202C" level="H" includeMargin />
                                    </div>

                                    <div className="flex flex-col gap-1.5 pl-11">
                                        {token.table_number != null && (
                                            <div className="flex items-center gap-2 text-[12px] text-text-main">
                                                <span className="font-medium">Table {token.table_number}</span>
                                                {token.capacity != null && (
                                                    <span className="text-text-muted text-[11px]">· Cap: {token.capacity}</span>
                                                )}
                                            </div>
                                        )}

                                        {token.status === 'assigned' && token.restaurants && (
                                            <div className="flex items-center gap-2 text-[12px]">
                                                <span className="font-medium text-text-main truncate">
                                                    {token.restaurants.name}
                                                </span>
                                                {token.restaurant_tables && (
                                                    <span className="px-1.5 py-0.5 bg-surface-hover rounded text-[10px] text-text-muted">
                                                        Table {token.restaurant_tables.table_number}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[11px] text-text-muted mt-1 pt-1.5 border-t border-border/20">
                                            <span>Created</span>
                                            <span className="font-medium text-text-main">
                                                {formatDateShort(token.created_at)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <button
                                                onClick={() => openLinkModal(token)}
                                                className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1 font-medium"
                                            >
                                                <LinkIcon size={12} />
                                                {token.status === 'assigned' ? 'Edit Link' : 'Link'}
                                            </button>
                                            <button
                                                onClick={() => downloadQR(token, 'png')}
                                                disabled={isDownloading}
                                                className="px-2.5 py-1.5 text-xs rounded-lg bg-surface-hover border border-border text-text-muted hover:text-text-main hover:bg-border transition-colors disabled:opacity-50"
                                            >
                                                {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                            </button>
                                            <button
                                                onClick={() => downloadQR(token, 'pdf')}
                                                disabled={isDownloading}
                                                className="px-2.5 py-1.5 text-xs rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 transition-colors disabled:opacity-50"
                                            >
                                                PDF
                                            </button>
                                            {token.status === 'assigned' && (
                                                <button
                                                    onClick={() => setUnlinkTarget(token)}
                                                    className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
                                                >
                                                    <Unlink size={12} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDeleteTarget(token)}
                                                className="px-2.5 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

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

            {/* ── Link Token Modal ── */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4" onClick={() => setShowLinkModal(false)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                                    <LinkIcon size={18} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-text-main text-lg">Link QR Token to Restaurant</h2>
                                    <p className="text-xs text-text-muted">Assign pre-printed QR code to a table</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLinkModal(false)} className="text-text-muted hover:text-text-main"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleLinkSubmit}>
                            <div className="p-6 space-y-4">
                                {linkError && (
                                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                                        <AlertCircle size={14} className="shrink-0" />
                                        <span>{linkError}</span>
                                    </div>
                                )}

                                {/* QR Token selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5">QR Token Code *</label>
                                    {linkTarget ? (
                                        <div className="flex items-center justify-between px-3 py-2 bg-bg border border-border rounded-lg text-sm font-mono text-text-main font-semibold">
                                            <span>{linkTarget.token}</span>
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${linkTarget.status === 'available' ? 'bg-accent-primary/15 text-accent-primary' : 'bg-blue-500/15 text-blue-400'}`}>
                                                {linkTarget.status}
                                            </span>
                                        </div>
                                    ) : (
                                        <select
                                            value={linkTokenId}
                                            onChange={e => {
                                                const tid = e.target.value;
                                                setLinkTokenId(tid);
                                                const selectedTok = tokens.find(t => t.id === tid);
                                                if (selectedTok) {
                                                    if (selectedTok.assigned_restaurant_id) setLinkRestaurantId(selectedTok.assigned_restaurant_id);
                                                    if (selectedTok.restaurant_tables?.table_number) setLinkTableNo(selectedTok.restaurant_tables.table_number);
                                                }
                                            }}
                                            required
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main font-mono focus:outline-none focus:border-accent-primary/50"
                                        >
                                            <option value="">-- Select QR Token --</option>
                                            {tokens.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.token} ({t.status}{t.restaurants ? ` - ${t.restaurants.name}` : ''})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Select Restaurant */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5">Select Restaurant *</label>
                                    {loadingRestaurants ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-bg border border-border rounded-lg text-xs text-text-muted">
                                            <Loader2 size={14} className="animate-spin" />
                                            Loading restaurants...
                                        </div>
                                    ) : (
                                        <select
                                            value={linkRestaurantId}
                                            onChange={e => setLinkRestaurantId(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                        >
                                            <option value="">-- Choose Restaurant --</option>
                                            {restaurants.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Table Number & Seat Capacity */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted mb-1.5">Table No. *</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={linkTableNo}
                                            onChange={e => setLinkTableNo(parseInt(e.target.value) || 1)}
                                            required
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted mb-1.5">Seat Capacity *</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={linkSeatCapacity}
                                            onChange={e => setLinkSeatCapacity(parseInt(e.target.value) || 1)}
                                            required
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    If Table #{linkTableNo} already exists for this restaurant, the QR token will be assigned to it and seat capacity updated. If not, a new table with {linkSeatCapacity} seats will be created automatically.
                                </p>
                            </div>

                            <div className="flex gap-3 px-6 py-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setShowLinkModal(false)}
                                    className="flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={linking}
                                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(37,99,235,0.3)]"
                                >
                                    {linking ? <><Loader2 size={14} className="animate-spin" />Linking...</> : 'Link Token'}
                                </button>
                            </div>
                        </form>
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

