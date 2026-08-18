import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { formatDateShort } from '@restaurant-saas/types';
import {
    QrCode, Download, RefreshCw, Plus, Search, Filter,
    Loader2, CheckCircle, AlertCircle, Unlink, Link as LinkIcon,
    ChevronLeft, ChevronRight, X, Copy, Check, Trash2, Building2,
    ArrowUpDown, ArrowUp, ArrowDown, Eye, ExternalLink, Calendar, Hash,
    LayoutGrid, List
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { TableRowsSkeleton } from '../components/ui/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QrToken {
    id: string;
    token: string;
    status: 'available' | 'assigned' | 'trashed';
    table_number: number | null;
    capacity: number | null;
    is_auto_generated?: boolean;
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
    const [genTab, setGenTab] = useState<'way1' | 'way2'>('way1');
    const [genRows, setGenRows] = useState<{ prefix: string, tableNum: string, capacity: string, quantity: string }[]>([{ prefix: 'TK-', tableNum: '', capacity: '', quantity: '1' }]);

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
    const [isBulkLink, setIsBulkLink] = useState(false);

    // Filter / search
    const [tokenTypeTab, setTokenTypeTab] = useState<'physical' | 'auto_generated' | 'trashed'>('physical');
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned' | 'trashed'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'restaurant'>(
        () => (localStorage.getItem('qr_tokens_view_mode') as 'list' | 'grid' | 'restaurant') || 'list'
    );

    useEffect(() => {
        localStorage.setItem('qr_tokens_view_mode', viewMode);
    }, [viewMode]);

    // Restaurant View State
    const [selectedViewRestaurantId, setSelectedViewRestaurantId] = useState<string>('');
    const [restaurantTables, setRestaurantTables] = useState<any[]>([]);
    const [loadingRestaurantTables, setLoadingRestaurantTables] = useState(false);

    // Add/Edit Table Modal
    const [showTableModal, setShowTableModal] = useState(false);
    const [tableModalMode, setTableModalMode] = useState<'add' | 'edit'>('add');
    const [tableModalId, setTableModalId] = useState<string>('');
    const [tableModalTableNo, setTableModalTableNo] = useState<number>(1);
    const [tableModalCapacity, setTableModalCapacity] = useState<number>(4);
    const [tableModalQuantity, setTableModalQuantity] = useState<number>(1);
    const [tableModalSaving, setTableModalSaving] = useState(false);
    const [tableModalError, setTableModalError] = useState<string | null>(null);

    // Download state
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDownloading, setIsBulkDownloading] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Unlink confirm
    const [unlinkTarget, setUnlinkTarget] = useState<QrToken | null>(null);
    const [unlinking, setUnlinking] = useState(false);

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<QrToken | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<QrToken | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Detail modal
    const [detailToken, setDetailToken] = useState<QrToken | null>(null);

    const fetchTokens = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: e } = await supabase
                .from('qr_code_tokens')
                .select(`
                    id, token, status, table_number, capacity, is_auto_generated, assigned_restaurant_id, assigned_table_id, assigned_at, created_at,
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

    const fetchRestaurantsList = async () => {
        if (restaurants.length > 0) return;
        setLoadingRestaurants(true);
        try {
            const { data, error: resErr } = await supabase
                .from('restaurants')
                .select('id, name')
                .order('name', { ascending: true });
            if (resErr) throw resErr;
            setRestaurants(data || []);
        } catch (err: any) {
            console.error('Failed to load restaurants', err);
        } finally {
            setLoadingRestaurants(false);
        }
    };

    const fetchRestaurantTables = async () => {
        if (!selectedViewRestaurantId) return;
        setLoadingRestaurantTables(true);
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('restaurant_id', selectedViewRestaurantId)
                .order('table_number', { ascending: true });
            if (error) throw error;
            setRestaurantTables(data || []);
        } catch (err) {
            console.error('Failed to fetch restaurant tables', err);
        } finally {
            setLoadingRestaurantTables(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'restaurant') {
            fetchRestaurantsList();
        }
    }, [viewMode]);

    useEffect(() => {
        if (viewMode === 'restaurant' && selectedViewRestaurantId) {
            fetchRestaurantTables();
        }
    }, [selectedViewRestaurantId, viewMode]);

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
    const openLinkModal = async (token?: QrToken, bulk: boolean = false) => {
        setLinkError(null);
        setIsBulkLink(bulk);
        if (bulk) {
            setLinkTarget(null);
            setLinkTokenId('');
            setLinkRestaurantId('');
            setLinkTableNo(1);
            setLinkSeatCapacity(4);
        } else if (token) {
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

        if (!isBulkLink) {
            const tokenObj = linkTarget || tokens.find(t => t.id === linkTokenId);
            if (!tokenObj) {
                setLinkError('Please select a valid QR token.');
                return;
            }
        } else if (selectedIds.size === 0) {
            setLinkError('Please select at least one QR token.');
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
            const processToken = async (tokenObj: QrToken, tableNo: number) => {
                // Strict Option 2 Validation
                if (tokenObj.table_number !== tableNo) {
                    throw new Error(`Token ${tokenObj.token} is configured for Table ${tokenObj.table_number}, but you are trying to link it to Table ${tableNo}.`);
                }
                if (tokenObj.capacity !== linkSeatCapacity) {
                    throw new Error(`Token ${tokenObj.token} is configured for ${tokenObj.capacity} seats, but you are trying to link it to ${linkSeatCapacity} seats.`);
                }

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
                    .eq('table_number', tableNo)
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
                            table_number: tableNo,
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
            };

            if (isBulkLink) {
                const tokensToLink = tokens.filter(t => selectedIds.has(t.id));
                let currentTableNo = linkTableNo;
                for (const tokenObj of tokensToLink) {
                    await processToken(tokenObj, currentTableNo);
                    currentTableNo++;
                }
                setSelectedIds(new Set());
            } else {
                const tokenObj = linkTarget || tokens.find(t => t.id === linkTokenId)!;
                await processToken(tokenObj, linkTableNo);
            }

            await fetchTokens();
            setShowLinkModal(false);
            setLinkTarget(null);
        } catch (err: any) {
            setLinkError('Failed to link token: ' + err.message);
        } finally {
            setLinking(false);
        }
    };

    // ── Filtered + sorted + paginated tokens ──
    const filtered = tokens.filter(t => {
        const isAuto = t.is_auto_generated === true;
        const isTrash = t.status === 'trashed';

        if (tokenTypeTab === 'trashed' && !isTrash) return false;
        if (tokenTypeTab !== 'trashed' && isTrash) return false;

        if (tokenTypeTab === 'physical' && isAuto) return false;
        if (tokenTypeTab === 'auto_generated' && !isAuto) return false;

        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (search && !t.token.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const sorted = sortKey ? [...filtered].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortKey) {
            case 'token': aVal = a.token; bVal = b.token; break;
            case 'table_number': aVal = a.table_number ?? -1; bVal = b.table_number ?? -1; break;
            case 'capacity': aVal = a.capacity ?? -1; bVal = b.capacity ?? -1; break;
            case 'status': aVal = a.status; bVal = b.status; break;
            case 'assigned': aVal = a.restaurants?.name ?? ''; bVal = b.restaurants?.name ?? ''; break;
            case 'created_at': aVal = a.created_at; bVal = b.created_at; break;
            default: return 0;
        }
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
    }) : filtered;

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    const safePage = Math.min(page, totalPages);
    const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage);

    // ── Grid view groupings ──
    const groupedByCapacity = React.useMemo(() => {
        const groups: Record<string, QrToken[]> = {};
        filtered.forEach(token => {
            const cap = token.capacity != null ? token.capacity.toString() : 'Unassigned';
            if (!groups[cap]) groups[cap] = [];
            groups[cap].push(token);
        });

        // Sort tokens inside each capacity group by table_number ascending
        for (const cap in groups) {
            groups[cap].sort((a, b) => {
                if (a.table_number == null && b.table_number == null) return 0;
                if (a.table_number == null) return 1;
                if (b.table_number == null) return -1;
                return a.table_number - b.table_number;
            });
        }

        return groups;
    }, [filtered]);

    const capacityGroups = Object.keys(groupedByCapacity).sort((a, b) => {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
        return Number(a) - Number(b);
    });

    const getTableSummary = (tokens: QrToken[]) => {
        const tableStats: Record<string, { total: number, available: number }> = {};
        let unassignedTotal = 0;
        let unassignedAvailable = 0;
        tokens.forEach(t => {
            if (t.table_number != null) {
                if (!tableStats[t.table_number]) tableStats[t.table_number] = { total: 0, available: 0 };
                tableStats[t.table_number].total++;
                if (t.status === 'available') tableStats[t.table_number].available++;
            } else {
                unassignedTotal++;
                if (t.status === 'available') unassignedAvailable++;
            }
        });

        const parts = Object.entries(tableStats)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([tableNum, stats]) => ({
                label: `Table ${tableNum}`,
                total: stats.total,
                available: stats.available
            }));

        if (unassignedTotal > 0) {
            parts.push({ label: 'Unassigned', total: unassignedTotal, available: unassignedAvailable });
        }

        return parts;
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc');
            else { setSortKey(null); setSortDir('asc'); }
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <ArrowUpDown size={12} className="opacity-0 group-hover/th:opacity-40 transition-opacity" />;
        return sortDir === 'asc' ? <ArrowUp size={12} className="text-accent-primary" /> : <ArrowDown size={12} className="text-accent-primary" />;
    };

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
        if (genTab === 'way1') {
            if (genQuantity < 1 || genQuantity > 500) return;
            if (!genTableNum || !genCapacity) return;
        } else {
            if (genRows.length === 0) return;
            if (genRows.some(r => !r.tableNum || !r.capacity)) return;
        }

        setGenerating(true);
        try {
            const existing = new Set(tokens.map(t => t.token));
            const newTokens: any[] = [];
            let attempts = 0;

            if (genTab === 'way1') {
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
            } else {
                for (let i = 0; i < genRows.length; i++) {
                    const row = genRows[i];
                    const tNum = parseInt(row.tableNum);
                    const cap = parseInt(row.capacity);
                    const qty = parseInt(row.quantity) || 1;

                    for (let q = 0; q < qty; q++) {
                        let created = false;
                        let localAttempts = 0;
                        while (!created && localAttempts < 10) {
                            localAttempts++;
                            attempts++;
                            const code = generateTokenCode(row.prefix || 'TK-');
                            if (!existing.has(code) && !newTokens.some(nt => nt.token === code)) {
                                newTokens.push({
                                    token: code,
                                    status: 'available',
                                    table_number: !isNaN(tNum) ? tNum : null,
                                    capacity: !isNaN(cap) ? cap : null
                                });
                                created = true;
                            }
                        }
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
            if (deleteTarget.status === 'trashed') {
                // Permanently delete if already in trash
                const { error: delErr } = await supabase
                    .from('qr_code_tokens')
                    .delete()
                    .eq('id', deleteTarget.id);
                if (delErr) throw delErr;
            } else {
                // Move to trash
                if (deleteTarget.assigned_table_id) {
                    if (deleteTarget.is_auto_generated) {
                        await supabase
                            .from('restaurant_tables')
                            .delete()
                            .eq('id', deleteTarget.assigned_table_id);
                    } else {
                        await supabase
                            .from('restaurant_tables')
                            .update({ qr_token: null })
                            .eq('id', deleteTarget.assigned_table_id);
                    }
                }
                const { error: updErr } = await supabase
                    .from('qr_code_tokens')
                    .update({ 
                        status: 'trashed',
                        assigned_restaurant_id: null,
                        assigned_table_id: null,
                        assigned_at: null 
                    })
                    .eq('id', deleteTarget.id);
                if (updErr) throw updErr;
            }

            await fetchTokens();
            setDeleteTarget(null);
        } catch (err: any) {
            setError('Failed to delete token: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async () => {
        if (!restoreTarget) return;
        setRestoring(true);
        try {
            const { error: resErr } = await supabase
                .from('qr_code_tokens')
                .update({ status: 'available' })
                .eq('id', restoreTarget.id);
            if (resErr) throw resErr;

            await fetchTokens();
            setRestoreTarget(null);
        } catch (err: any) {
            setError('Failed to restore token: ' + err.message);
        } finally {
            setRestoring(false);
        }
    };

    const handleSaveRestaurantTable = async () => {
        if (!selectedViewRestaurantId) return;
        setTableModalError(null);
        setTableModalSaving(true);
        try {
            if (tableModalMode === 'add') {
                if (tableModalQuantity < 1) throw new Error("Quantity must be at least 1.");

                const inserts = [];
                for (let i = 0; i < tableModalQuantity; i++) {
                    const tNum = tableModalTableNo + i;
                    const existing = restaurantTables.find(t => t.table_number === tNum);
                    if (existing) {
                        throw new Error(`Table ${tNum} already exists.`);
                    }
                    inserts.push({
                        restaurant_id: selectedViewRestaurantId,
                        table_number: tNum,
                        capacity: tableModalCapacity,
                        active: true
                    });
                }

                const { error } = await supabase
                    .from('restaurant_tables')
                    .insert(inserts);
                if (error) throw error;
            } else {
                const existing = restaurantTables.find(t => t.table_number === tableModalTableNo && t.id !== tableModalId);
                if (existing) {
                    throw new Error(`Table ${tableModalTableNo} already exists.`);
                }
                const { error } = await supabase
                    .from('restaurant_tables')
                    .update({
                        table_number: tableModalTableNo,
                        capacity: tableModalCapacity,
                    })
                    .eq('id', tableModalId);
                if (error) throw error;
            }
            await fetchRestaurantTables();
            await fetchTokens();
            setShowTableModal(false);
        } catch (err: any) {
            setTableModalError(err.message);
        } finally {
            setTableModalSaving(false);
        }
    };

    const handleDeleteRestaurantTable = async (tableId: string) => {
        if (!confirm('Are you sure you want to delete this table?')) return;
        try {
            const tableToDelete = restaurantTables.find(t => t.id === tableId);
            const { error } = await supabase
                .from('restaurant_tables')
                .delete()
                .eq('id', tableId);
            if (error) throw error;

            if (tableToDelete?.qr_token) {
                await supabase
                    .from('qr_code_tokens')
                    .update({
                        status: 'available',
                        assigned_restaurant_id: null,
                        assigned_table_id: null,
                        assigned_at: null
                    })
                    .eq('token', tableToDelete.qr_token);
            }

            await fetchRestaurantTables();
            await fetchTokens();
        } catch (err: any) {
            setError('Failed to delete table: ' + err.message);
        }
    };

    const openAssignTokenToTableModal = (tableNo: number, capacity: number) => {
        const availableTok = tokens.find(t => t.status === 'available');
        setIsBulkLink(false);
        setLinkTarget(availableTok || null);
        setLinkTokenId(availableTok ? availableTok.id : '');
        setLinkRestaurantId(selectedViewRestaurantId);
        setLinkTableNo(tableNo);
        setLinkSeatCapacity(capacity);
        setShowLinkModal(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length && filtered.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(t => t.id)));
        }
    };

    const toggleGroupSelectAll = (cap: string) => {
        const groupTokens = groupedByCapacity[cap] || [];
        if (groupTokens.length === 0) return;
        const allSelected = groupTokens.every(t => selectedIds.has(t.id));
        const next = new Set(selectedIds);

        if (allSelected) {
            groupTokens.forEach(t => next.delete(t.id));
        } else {
            groupTokens.forEach(t => next.add(t.id));
        }
        setSelectedIds(next);
    };

    const toggleSelect = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        
        const tokensToDelete = tokens.filter(t => selectedIds.has(t.id));
        const alreadyTrashedIds = tokensToDelete.filter(t => t.status === 'trashed').map(t => t.id);
        const toTrashIds = tokensToDelete.filter(t => t.status !== 'trashed').map(t => t.id);
        
        const confirmMsg = alreadyTrashedIds.length > 0 
            ? `Are you sure you want to permanently delete ${alreadyTrashedIds.length} token(s) and move ${toTrashIds.length} token(s) to trash?`
            : `Are you sure you want to move ${toTrashIds.length} token(s) to trash?`;
            
        if (!window.confirm(confirmMsg)) return;
        
        setIsBulkDeleting(true);
        try {
            // Handle tokens to move to trash
            if (toTrashIds.length > 0) {
                const tokensToTrash = tokensToDelete.filter(t => t.status !== 'trashed');
                const assignedTokens = tokensToTrash.filter(t => t.assigned_table_id);
                if (assignedTokens.length > 0) {
                    const autoGenTableIds = assignedTokens.filter(t => t.is_auto_generated).map(t => t.assigned_table_id);
                    const physicalTableIds = assignedTokens.filter(t => !t.is_auto_generated).map(t => t.assigned_table_id);
                    
                    if (physicalTableIds.length > 0) {
                        const { error: updErr } = await supabase.from('restaurant_tables').update({ qr_token: null }).in('id', physicalTableIds);
                        if (updErr) console.error("Error unlinking tables", updErr);
                    }
                    if (autoGenTableIds.length > 0) {
                        const { error: delTableErr } = await supabase.from('restaurant_tables').delete().in('id', autoGenTableIds);
                        if (delTableErr) console.error("Error deleting tables", delTableErr);
                    }
                }
                const { error: trashErr } = await supabase.from('qr_code_tokens').update({ 
                    status: 'trashed',
                    assigned_restaurant_id: null,
                    assigned_table_id: null,
                    assigned_at: null
                }).in('id', toTrashIds);
                if (trashErr) throw trashErr;
            }
            
            // Handle tokens to permanently delete
            if (alreadyTrashedIds.length > 0) {
                const { error: delErr } = await supabase.from('qr_code_tokens').delete().in('id', alreadyTrashedIds);
                if (delErr) throw delErr;
            }
            
            await fetchTokens();
            setSelectedIds(new Set());
        } catch (err: any) {
            setError('Failed to bulk delete: ' + err.message);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleBulkDownloadPdf = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDownloading(true);
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [CARD_MM_W, CARD_MM_H] });
            const tokensList = filtered.filter(t => selectedIds.has(t.id));
            for (let i = 0; i < tokensList.length; i++) {
                const t = tokensList[i];
                const svgId = `qr-svg-${t.id}`;
                const canvas = await paintGenericQrCard(svgId, t.token, t.table_number, t.capacity);
                if (i > 0) pdf.addPage();
                pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, CARD_MM_W, CARD_MM_H);
            }
            pdf.save(`tablekard-bulk-${tokensList.length}-qrs.pdf`);
        } catch (err: any) {
            console.error('Bulk QR download failed:', err);
            setError('Failed to generate bulk QR download.');
        } finally {
            setIsBulkDownloading(false);
            setSelectedIds(new Set());
        }
    };

    const handleBulkDownloadPng = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDownloading(true);
        try {
            const zip = new JSZip();
            const tokensList = filtered.filter(t => selectedIds.has(t.id));

            for (const t of tokensList) {
                const svgId = `qr-svg-${t.id}`;
                const canvas = await paintGenericQrCard(svgId, t.token, t.table_number, t.capacity);
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                zip.file(`tablekard-qr-${t.token}.png`, base64Data, { base64: true });
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `tablekard-bulk-${tokensList.length}-qrs.zip`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err: any) {
            console.error('Bulk QR PNG download failed:', err);
            setError('Failed to generate bulk PNG download.');
        } finally {
            setIsBulkDownloading(false);
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="space-y-3 w-full">

            {/* ── Type Tabs ── */}
            <div className="flex items-center gap-6 border-b border-border px-2">
                <button
                    onClick={() => { setTokenTypeTab('physical'); setPage(1); fetchTokens(); }}
                    className={`py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${tokenTypeTab === 'physical' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-muted hover:text-text-main'} bg-transparent cursor-pointer`}
                >
                    Super Admin
                </button>
                <button
                    onClick={() => { setTokenTypeTab('auto_generated'); setPage(1); fetchTokens(); }}
                    className={`py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${tokenTypeTab === 'auto_generated' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-muted hover:text-text-main'} bg-transparent cursor-pointer`}
                >
                    Rest Admins
                </button>
                <button
                    onClick={() => { setTokenTypeTab('trashed'); setPage(1); fetchTokens(); }}
                    className={`py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${tokenTypeTab === 'trashed' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-muted hover:text-text-main'} bg-transparent cursor-pointer`}
                >
                    Trash
                </button>
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
                {viewMode !== 'grid' && (
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

                        <div className="w-px h-6 bg-border mx-1 hidden md:block"></div>

                        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer">
                            {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                        </select>
                    </div>
                )}

                {/* Per-page & Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                    {viewMode === 'grid' && (
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover cursor-pointer transition-colors md:mr-2 flex-1 md:flex-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                onChange={toggleSelectAll}
                            />
                            <span className="text-[12px] font-medium text-text-main select-none">Select All</span>
                        </label>
                    )}
                    <div className="flex bg-surface-hover p-1 rounded-lg border border-border">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`} title="List View"><List size={14} /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`} title="Grid View"><LayoutGrid size={14} /></button>
                        <button onClick={() => setViewMode('restaurant')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'restaurant' ? 'bg-surface shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`} title="Restaurant View"><Building2 size={14} /></button>
                    </div>

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

            {/* ── Tokens Table or Grid ── */}
            {viewMode === 'restaurant' ? (
                <div className="w-full space-y-4">
                    <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between animate-fade-in">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-sm font-semibold text-text-main">Select Restaurant</label>
                            <select
                                value={selectedViewRestaurantId}
                                onChange={(e) => setSelectedViewRestaurantId(e.target.value)}
                                className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary max-w-sm"
                            >
                                <option value="">-- Choose a Restaurant --</option>
                                {restaurants.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedViewRestaurantId && (
                            <button
                                onClick={() => {
                                    setTableModalMode('add');
                                    setTableModalTableNo(1);
                                    setTableModalCapacity(4);
                                    setTableModalQuantity(1);
                                    setShowTableModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white text-sm font-semibold rounded-lg hover:bg-accent-secondary transition-colors shrink-0"
                            >
                                <Plus size={16} /> Add Table
                            </button>
                        )}
                    </div>

                    {selectedViewRestaurantId && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 animate-fade-in">
                            {loadingRestaurantTables ? (
                                <div className="col-span-full py-10 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-text-muted" size={24} />
                                </div>
                            ) : restaurantTables.length === 0 ? (
                                <div className="col-span-full bg-surface border border-border rounded-xl p-8 flex items-center justify-center text-text-muted text-sm">
                                    No tables configured for this restaurant. Click "Add Table" to start.
                                </div>
                            ) : (
                                restaurantTables.map(table => (
                                    <div key={table.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-border/80 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-text-main text-lg">Table {table.table_number}</span>
                                            <span className="text-xs font-semibold px-2 py-0.5 bg-surface-hover rounded-md text-text-muted">
                                                {table.capacity} Seats
                                            </span>
                                        </div>

                                        <div className="h-px bg-border/50 w-full" />

                                        <div className="flex flex-col gap-2">
                                            {table.qr_token ? (
                                                <div className="flex items-center gap-2 text-xs text-text-main font-medium truncate">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                                                    Token: <span className="font-mono bg-bg border border-border/50 px-1.5 rounded truncate">{table.qr_token}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between text-xs font-medium">
                                                    <span className="text-text-muted flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div> No Token
                                                    </span>
                                                    <button
                                                        onClick={() => openAssignTokenToTableModal(table.table_number, table.capacity)}
                                                        className="text-accent-primary hover:text-accent-secondary shrink-0 font-bold border-none bg-transparent cursor-pointer"
                                                    >
                                                        Assign
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <button
                                                onClick={() => {
                                                    setTableModalMode('edit');
                                                    setTableModalId(table.id);
                                                    setTableModalTableNo(table.table_number);
                                                    setTableModalCapacity(table.capacity);
                                                    setShowTableModal(true);
                                                }}
                                                className="flex-1 py-1.5 text-xs font-semibold text-text-main bg-surface-hover hover:bg-bg border border-border/50 rounded transition-colors cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRestaurantTable(table.id)}
                                                className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
                                                title="Delete Table"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    {/* Desktop View Table */}
                    <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap table-fixed">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-3 px-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[12%] cursor-pointer select-none group/th" onClick={() => handleSort('table_number')}>
                                    <span className="inline-flex items-center gap-1.5">Table <SortIcon col="table_number" /></span>
                                </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[8%] cursor-pointer select-none group/th" onClick={() => handleSort('capacity')}>
                                    <span className="inline-flex items-center gap-1.5">Capacity <SortIcon col="capacity" /></span>
                                </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[17%] cursor-pointer select-none group/th" onClick={() => handleSort('token')}>
                                    <span className="inline-flex items-center gap-1.5">Token Code <SortIcon col="token" /></span>
                                </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%] cursor-pointer select-none group/th" onClick={() => handleSort('status')}>
                                    <span className="inline-flex items-center gap-1.5">Status <SortIcon col="status" /></span>
                                </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%] cursor-pointer select-none group/th" onClick={() => handleSort('assigned')}>
                                    <span className="inline-flex items-center gap-1.5">Assigned To <SortIcon col="assigned" /></span>
                                </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%] cursor-pointer select-none group/th" onClick={() => handleSort('created_at')}>
                                    <span className="inline-flex items-center gap-1.5">Created <SortIcon col="created_at" /></span>
                                </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-right w-[23%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowsSkeleton rows={perPage} columns={7} />
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-text-muted text-[13px]">
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
                                                className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors cursor-pointer"
                                                onClick={() => setDetailToken(token)}
                                            >
                                                <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                                        checked={selectedIds.has(token.id)}
                                                        onChange={(e) => toggleSelect(e, token.id)}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                                                            <QrCode size={14} className="text-accent-primary" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            {token.table_number != null ? (
                                                                <span className="font-bold text-text-main text-[14px] truncate group-hover:text-accent-primary transition-colors">
                                                                    Table {token.table_number}
                                                                </span>
                                                            ) : (
                                                                <span className="font-semibold text-text-muted text-[13px] opacity-70 italic group-hover:text-accent-primary/70 transition-colors">Unassigned</span>
                                                            )}
                                                        </div>
                                                        <div className="sr-only">
                                                            <QRCodeSVG id={`qr-svg-${token.id}`} value={qrUrl} size={QR_SIZE} bgColor="#ffffff" fgColor="#1A202C" level="H" includeMargin />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-4 align-middle">
                                                    {token.capacity != null ? (
                                                        <span className="text-text-main text-[13px] font-medium">{token.capacity}</span>
                                                    ) : (
                                                        <span className="text-text-muted text-[12px] opacity-60">—</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 align-middle">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-text-muted text-[12px] tracking-wide truncate max-w-[120px]" title={token.token}>{token.token}</span>
                                                        <CopyButton value={token.token} />
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-4 align-middle">
                                                    <span className={`text-[12px] font-bold ${token.status === 'available' ? 'text-green-600' : token.status === 'trashed' ? 'text-gray-500' : 'text-blue-600'}`}>
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
                                                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
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
                                                        {token.status === 'assigned' && !token.is_auto_generated && (
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
                                        className="p-4 hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors flex flex-col gap-2.5 cursor-pointer"
                                        onClick={() => setDetailToken(token)}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                                                    <QrCode size={14} className="text-accent-primary" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    {token.table_number != null ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-text-main text-[14px] truncate">Table {token.table_number}</span>
                                                            {token.capacity != null && (
                                                                <span className="text-text-muted text-[11px] font-medium shrink-0">({token.capacity} seats)</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="font-semibold text-text-muted text-[13px] opacity-70 italic">Unassigned Table</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded bg-surface-hover border border-border/40 shrink-0 ${token.status === 'available' ? 'text-green-600' : token.status === 'trashed' ? 'text-gray-500' : 'text-blue-600'}`}>
                                                {token.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="sr-only">
                                            <QRCodeSVG id={`qr-svg-${token.id}`} value={qrUrl} size={QR_SIZE} bgColor="#ffffff" fgColor="#1A202C" level="H" includeMargin />
                                        </div>

                                        <div className="flex flex-col gap-1.5 pl-11">
                                            <div className="flex items-center gap-1.5 text-[12px]">
                                                <span className="text-text-muted font-medium">Token:</span>
                                                <span className="font-mono text-text-main tracking-wide truncate" title={token.token}>
                                                    {token.token}
                                                </span>
                                                <CopyButton value={token.token} />
                                            </div>

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
                                                {token.status === 'trashed' ? (
                                                    <button
                                                        onClick={() => setRestoreTarget(token)}
                                                        className="px-2.5 py-1.5 text-xs rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
                                                        title="Restore token"
                                                    >
                                                        <RefreshCw size={12} />
                                                    </button>
                                                ) : (
                                                    token.status === 'assigned' && !token.is_auto_generated && (
                                                        <button
                                                            onClick={() => setUnlinkTarget(token)}
                                                            className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
                                                        >
                                                            <Unlink size={12} />
                                                        </button>
                                                    )
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
            ) : (
                <div className="space-y-6">
                    {capacityGroups.length === 0 ? (
                        <div className="w-full bg-surface rounded-xl border border-border p-10 flex items-center justify-center text-text-muted text-[13px]">
                            {tokens.length === 0 ? 'No tokens generated yet. Click "Generate Batch" to start.' : 'No tokens match your filter.'}
                        </div>
                    ) : (
                        capacityGroups.map(cap => (
                            <div key={cap} className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col animate-fade-in">
                                <div className="bg-surface-hover border-b border-border px-5 py-3 flex items-center flex-wrap gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer mr-1">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                            checked={groupedByCapacity[cap].length > 0 && groupedByCapacity[cap].every(t => selectedIds.has(t.id))}
                                            onChange={() => toggleGroupSelectAll(cap)}
                                        />
                                    </label>
                                    <h3 className="font-bold text-text-main text-[14px]">
                                        {cap === 'Unassigned' ? 'Unassigned Capacity' : `Capacity: ${cap} Seats`}
                                    </h3>
                                    <span className="bg-bg border border-border text-text-muted text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                        {groupedByCapacity[cap].length} token{groupedByCapacity[cap].length !== 1 ? 's' : ''}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 ml-2 pl-3 border-l border-border/50 hidden sm:flex">
                                        {getTableSummary(groupedByCapacity[cap]).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 text-[10px] bg-surface border border-border/70 rounded-md shadow-sm px-1.5 py-0.5">
                                                <span className="font-bold text-text-main">{item.label}</span>
                                                {item.available > 0 ? (
                                                    <span className="px-1 py-0.5 rounded text-green-600 bg-green-500/10 font-semibold tracking-wide">
                                                        {item.available} available
                                                    </span>
                                                ) : (
                                                    <span className="px-1 py-0.5 rounded text-text-muted bg-surface-hover font-medium">
                                                        0 available
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {groupedByCapacity[cap].map(token => (
                                        <div
                                            key={token.id}
                                            onClick={() => setDetailToken(token)}
                                            className={`p-3 rounded-xl border transition-colors cursor-pointer group flex flex-col gap-2 ${token.status === 'available'
                                                ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                                                : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between min-w-0 gap-2">
                                                <div className="flex items-center gap-2 min-w-0" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary shrink-0 cursor-pointer"
                                                        checked={selectedIds.has(token.id)}
                                                        onChange={(e) => toggleSelect(e, token.id)}
                                                    />
                                                    <span className="font-bold text-text-main text-[15px] truncate">
                                                        {token.table_number != null ? `Table ${token.table_number}` : 'Unassigned'}
                                                    </span>
                                                </div>
                                                <QrCode size={14} className="text-text-muted shrink-0 group-hover:text-accent-primary transition-colors" />
                                            </div>

                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="text-text-muted font-mono text-[11px] truncate">{token.token}</span>
                                            </div>

                                            {token.status === 'assigned' && token.restaurants && (
                                                <div className="mt-2 pt-2 border-t border-blue-500/20 flex flex-col min-w-0">
                                                    <span className="text-[10px] text-blue-500 font-bold uppercase truncate">Assigned</span>
                                                    <span className="text-[11px] text-text-main font-medium truncate">{token.restaurants.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Generate Modal ── */}
            {showGenModal && createPortal(
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4" onClick={() => setShowGenModal(false)}>
                    <div className={`bg-surface border border-border rounded-2xl w-full ${genTab === 'way2' ? 'max-w-2xl' : 'max-w-md'} shadow-2xl transition-all duration-300`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-border pb-4">
                            <h2 className="font-bold text-text-main text-lg">Generate QR Token Batch</h2>
                            <button onClick={() => setShowGenModal(false)} className="text-text-muted hover:text-text-main"><X size={20} /></button>
                        </div>

                        <div className="px-6 pt-4">
                            <div className="flex bg-surface-hover p-1 rounded-lg border border-border">
                                <button
                                    onClick={() => setGenTab('way1')}
                                    className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${genTab === 'way1' ? 'bg-surface shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`}
                                >
                                    Sequential Batch
                                </button>
                                <button
                                    onClick={() => setGenTab('way2')}
                                    className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${genTab === 'way2' ? 'bg-surface shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`}
                                >
                                    Custom List
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {genTab === 'way1' ? (
                                <>
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
                                        <h3 className="text-sm font-medium text-text-main">Pre-configure Table Info</h3>
                                        <p className="text-xs text-text-muted">Table numbers will automatically increment for each token in the batch.</p>
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
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-text-muted">Table Configuration</label>
                                        <span className="text-xs text-text-muted font-medium">{genRows.reduce((sum, row) => sum + (parseInt(row.quantity) || 1), 0)} token{genRows.reduce((sum, row) => sum + (parseInt(row.quantity) || 1), 0) !== 1 ? 's' : ''} to generate</span>
                                    </div>

                                    {/* Header row for custom list */}
                                    <div className="flex items-center gap-2 px-1 mb-2">
                                        <div className="w-[80px] text-xs font-medium text-text-muted">Prefix</div>
                                        <div className="w-[120px] text-xs font-medium text-text-muted">Table Number</div>
                                        <div className="w-[120px] text-xs font-medium text-text-muted">Seat Capacity</div>
                                        <div className="w-[80px] text-xs font-medium text-text-muted">Quantity</div>
                                        <div className="flex items-center gap-1 w-16"></div>
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 no-scrollbar">
                                        {genRows.map((row, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="w-[80px]">
                                                    <input
                                                        type="text"
                                                        value={row.prefix}
                                                        onChange={e => {
                                                            const newRows = [...genRows];
                                                            newRows[idx].prefix = e.target.value.toUpperCase();
                                                            setGenRows(newRows);
                                                        }}
                                                        maxLength={5}
                                                        className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main font-mono focus:outline-none focus:border-accent-primary/50"
                                                        placeholder="TK-"
                                                    />
                                                </div>
                                                <div className="w-[120px]">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={row.tableNum}
                                                        onChange={e => {
                                                            const newRows = [...genRows];
                                                            newRows[idx].tableNum = e.target.value;
                                                            setGenRows(newRows);
                                                        }}
                                                        className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                                        placeholder="Table"
                                                    />
                                                </div>
                                                <div className="w-[120px]">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={row.capacity}
                                                        onChange={e => {
                                                            const newRows = [...genRows];
                                                            newRows[idx].capacity = e.target.value;
                                                            setGenRows(newRows);
                                                        }}
                                                        className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                                        placeholder="Seats"
                                                    />
                                                </div>
                                                <div className="w-[80px]">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={row.quantity}
                                                        onChange={e => {
                                                            const newRows = [...genRows];
                                                            newRows[idx].quantity = e.target.value;
                                                            setGenRows(newRows);
                                                        }}
                                                        className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary/50"
                                                        placeholder="Qty"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 w-16">
                                                    <button
                                                        onClick={() => setGenRows(genRows.filter((_, i) => i !== idx))}
                                                        disabled={genRows.length === 1}
                                                        className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    {idx === genRows.length - 1 && (
                                                        <button
                                                            onClick={() => setGenRows([...genRows, { prefix: genRows[idx].prefix || 'TK-', tableNum: '', capacity: '', quantity: '1' }])}
                                                            className="p-1.5 text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                            title="Add Row"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-border">
                            <button onClick={() => setShowGenModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating || (genTab === 'way1' ? (!genTableNum || !genCapacity) : (genRows.length === 0 || genRows.some(r => !r.tableNum || !r.capacity || !r.quantity)))}
                                className="flex-1 py-2 rounded-lg bg-accent-primary text-white text-sm font-semibold hover:bg-accent-secondary transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {generating ? <><Loader2 size={14} className="animate-spin" />Generating...</> : `Generate ${genTab === 'way1' ? genQuantity : genRows.reduce((sum, row) => sum + (parseInt(row.quantity) || 1), 0)} Tokens`}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Link Token Modal ── */}
            {showLinkModal && createPortal(
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
                </div>,
                document.body
            )}

            {/* ── Unlink Confirm Modal ── */}
            {unlinkTarget && createPortal(
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
                </div>,
                document.body
            )}

            {/* ── Restore Confirm Modal ── */}
            {restoreTarget && createPortal(
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4" onClick={() => setRestoreTarget(null)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                                    <RefreshCw size={18} className="text-green-500" />
                                </div>
                                <h2 className="font-bold text-text-main">Restore Token</h2>
                            </div>
                            <p className="text-sm text-text-muted mb-1">
                                Are you sure you want to restore token <span className="font-mono font-semibold text-text-main">{restoreTarget.token}</span>?
                            </p>
                            <p className="text-xs text-green-500 mt-3">This will make it available again.</p>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-border">
                            <button onClick={() => setRestoreTarget(null)} className="flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                            <button
                                onClick={handleRestore}
                                disabled={restoring}
                                className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {restoring ? <Loader2 size={16} className="animate-spin" /> : 'Restore'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && createPortal(
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
                </div>,
                document.body
            )}

            {/* ── Detail Drawer ── */}
            {detailToken && createPortal((() => {
                const qrUrl = `${CUSTOMER_APP_URL}/q/${detailToken.token}`;
                return (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/60 z-[1000] animate-fade-in"
                            onClick={() => setDetailToken(null)}
                        />
                        {/* Drawer Panel */}
                        <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-surface shadow-2xl z-[1001] flex flex-col animate-slide-in-right border-l border-border">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                                        <QrCode size={20} className="text-accent-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-text-main text-lg truncate">Token Details</h2>
                                        <p className="text-xs text-text-muted font-mono truncate">{detailToken.token}</p>
                                    </div>
                                </div>
                                <button onClick={() => setDetailToken(null)} className="text-text-muted hover:text-text-main transition-colors p-2 rounded-lg hover:bg-surface-hover shrink-0">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            {/* Body */}
                            <div className="p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
                                {/* Header Section: QR on Left, Status/Table on Right */}
                                <div className="flex gap-4 items-start">
                                    {/* Left: QR Preview */}
                                    <div className="flex flex-col items-center gap-2 shrink-0">
                                        <div className="p-2 bg-white rounded-xl border border-border shadow-sm">
                                            <QRCodeSVG value={qrUrl} size={110} bgColor="#ffffff" fgColor="#1A202C" level="H" includeMargin />
                                        </div>
                                        <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 text-[10px] text-accent-primary hover:text-accent-secondary hover:underline font-medium transition-colors bg-accent-primary/5 px-2.5 py-1 rounded-full w-full">
                                            <ExternalLink size={10} /> Open Link
                                        </a>
                                    </div>

                                    {/* Right: Key Info Stack */}
                                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                                        <div className="bg-bg rounded-lg p-2.5 border border-border/50 flex flex-col items-start gap-1">
                                            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Status</div>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${detailToken.status === 'available' ? 'bg-green-500/10 text-green-600' : detailToken.status === 'trashed' ? 'bg-gray-500/10 text-gray-500' : 'bg-blue-500/10 text-blue-600'}`}>
                                                {detailToken.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="bg-bg rounded-lg p-2.5 border border-border/50 flex flex-col items-start gap-1">
                                            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Table</div>
                                            {detailToken.table_number != null ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-text-main text-[13px] font-bold leading-none">Table {detailToken.table_number}</span>
                                                    {detailToken.capacity != null && (
                                                        <span className="text-text-muted text-[10px] leading-none">{detailToken.capacity} seats</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-text-muted text-[11px] italic">Not set</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-bg rounded-lg p-2.5 border border-border/50">
                                            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1"><Calendar size={10} /> Created</div>
                                            <span className="text-text-main text-[12px] font-medium">{formatDateShort(detailToken.created_at)}</span>
                                        </div>
                                        <div className="bg-bg rounded-lg p-2.5 border border-border/50">
                                            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1"><Calendar size={10} /> Assigned</div>
                                            <span className="text-text-main text-[12px] font-medium">
                                                {detailToken.assigned_at ? formatDateShort(detailToken.assigned_at) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment Info */}
                                {detailToken.status === 'assigned' && detailToken.restaurants && (
                                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
                                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Building2 size={12} /> Assigned To</div>
                                        <div className="flex items-center gap-2.5 bg-surface border border-border/50 p-2 rounded-md shadow-sm">
                                            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <Building2 size={14} className="text-blue-500" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-text-main text-[13px] font-bold truncate">{detailToken.restaurants.name}</span>
                                                {detailToken.restaurant_tables && (
                                                    <span className="text-[11px] text-text-muted">
                                                        Table {detailToken.restaurant_tables.table_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Token Code */}
                                <div className="bg-bg rounded-lg p-3 border border-border/50">
                                    <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1"><Hash size={12} /> Token Code</div>
                                    <div className="flex items-center gap-2 bg-surface border border-border p-2 rounded-md">
                                        <code className="text-text-main font-mono text-[13px] font-bold tracking-widest flex-1 truncate">{detailToken.token}</code>
                                        <CopyButton value={detailToken.token} />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-border bg-surface shrink-0 flex flex-col gap-2">
                                <button
                                    onClick={() => { setDetailToken(null); openLinkModal(detailToken); }}
                                    className="w-full py-2 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border-none"
                                >
                                    <LinkIcon size={14} /> {detailToken.status === 'assigned' ? 'Edit Link' : 'Link to Restaurant'}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => downloadQR(detailToken, 'png')}
                                        className="flex-1 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5 text-[12px] font-medium text-text-main shadow-sm cursor-pointer"
                                    >
                                        <Download size={14} /> PNG
                                    </button>
                                    <button
                                        onClick={() => downloadQR(detailToken, 'pdf')}
                                        className="flex-1 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5 text-[12px] font-medium text-text-main shadow-sm cursor-pointer"
                                    >
                                        <Download size={14} /> PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            })(), document.body)}

            {/* ── Bulk Actions Floating Bar ── */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 bg-surface border border-border shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 z-[90] animate-slide-up">
                    <span className="text-[13px] font-bold text-text-main bg-surface-hover px-2.5 py-1 rounded-lg border border-border/50">
                        {selectedIds.size} selected
                    </span>
                    <div className="w-px h-6 bg-border"></div>
                    <button
                        onClick={() => openLinkModal(undefined, true)}
                        disabled={isBulkDownloading || isBulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none"
                    >
                        <LinkIcon size={14} /> Link
                    </button>
                    <button
                        onClick={handleBulkDownloadPng}
                        disabled={isBulkDownloading || isBulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none"
                    >
                        {isBulkDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        PNGs (ZIP)
                    </button>
                    <button
                        onClick={handleBulkDownloadPdf}
                        disabled={isBulkDownloading || isBulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none"
                    >
                        {isBulkDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        PDFs
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDownloading || isBulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none"
                    >
                        {isBulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Delete
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-main rounded-lg transition-colors ml-1 cursor-pointer border-none bg-transparent"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Hidden SVGs for ALL tokens (needed for bulk PDF downloads across pages) */}
            <div className="sr-only">
                {tokens.map(token => {
                    const qrUrl = `${CUSTOMER_APP_URL}/q/${token.token}`;
                    return <QRCodeSVG key={`hidden-qr-${token.id}`} id={`qr-svg-${token.id}`} value={qrUrl} size={QR_SIZE} bgColor="#ffffff" fgColor="#1A202C" level="H" includeMargin />
                })}
            </div>
            {showTableModal && createPortal(
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={() => setShowTableModal(false)}>
                    <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="font-bold text-text-main text-base">{tableModalMode === 'add' ? 'Add Table' : 'Edit Table'}</h2>
                            <button onClick={() => setShowTableModal(false)} className="text-text-muted hover:text-text-main border-none bg-transparent cursor-pointer"><X size={18} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            {tableModalError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs flex gap-2">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>{tableModalError}</span>
                                </div>
                            )}
                            {tableModalMode === 'add' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Starting Table Number</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={tableModalTableNo}
                                            onChange={e => setTableModalTableNo(parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Seat Capacity</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={tableModalCapacity}
                                                onChange={e => setTableModalCapacity(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Quantity</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={tableModalQuantity}
                                                onChange={e => setTableModalQuantity(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-surface-hover border border-border rounded-lg text-xs text-text-muted">
                                        This will create <strong>{tableModalQuantity}</strong> table{tableModalQuantity !== 1 ? 's' : ''} starting from number <strong>{tableModalTableNo}</strong> (to {tableModalTableNo + tableModalQuantity - 1}), each with <strong>{tableModalCapacity}</strong> seats.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Table Number</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={tableModalTableNo}
                                            onChange={e => setTableModalTableNo(parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Seat Capacity</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={tableModalCapacity}
                                            onChange={e => setTableModalCapacity(parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2 p-4 border-t border-border bg-surface-hover/30 rounded-b-xl">
                            <button onClick={() => setShowTableModal(false)} className="flex-1 py-2 text-sm font-semibold text-text-muted hover:text-text-main border border-border rounded-lg transition-colors bg-surface cursor-pointer">Cancel</button>
                            <button
                                onClick={handleSaveRestaurantTable}
                                disabled={tableModalSaving}
                                className="flex-1 py-2 text-sm font-semibold text-white bg-accent-primary hover:bg-accent-secondary rounded-lg transition-colors flex items-center justify-center cursor-pointer border-none disabled:opacity-50"
                            >
                                {tableModalSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Table'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

