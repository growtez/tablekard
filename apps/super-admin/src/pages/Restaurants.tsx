import { useState, useEffect } from 'react';
import { formatDate } from '@restaurant-saas/types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Phone, Calendar, Search, ExternalLink, Filter, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableRowsSkeleton } from '../components/ui/Skeleton';
import SubscriptionDropdown from '../components/SubscriptionDropdown';
import AccountStatusDropdown from '../components/AccountStatusDropdown';

import { DashboardProps } from './Dashboard';

export interface Restaurant {
    id: string;
    name: string;
    status: string;
    contact_email?: string;
    created_at: string;
    logo_url?: string;
    subscription_plan?: string;
    subscription_status?: string;
    subscription_end_at?: string;
    contact_phone?: string;
}

export default function Restaurants({ openDrawer, setSyncAction }: { openDrawer: (drawer: string) => void } & DashboardProps) {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [billingPlans, setBillingPlans] = useState<any[]>([]);
    const [trialPlans, setTrialPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    useEffect(() => {
        if (setSyncAction) {
            setSyncAction({
                onSync: fetchRestaurants,
                loading: loading
            });
        }
    }, [loading, setSyncAction]);

    const fetchRestaurants = async () => {
        setLoading(true);
        setError(null);
        try {
            const [restRes, plansRes] = await Promise.all([
                supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
                supabase.from('platform_settings').select('config').eq('id', 'billing_plans').maybeSingle()
            ]);

            if (restRes.error) throw restRes.error;
            setRestaurants(restRes.data || []);

            if (plansRes.data?.config) {
                setBillingPlans(plansRes.data.config.plans || []);
                setTrialPlans(plansRes.data.config.trials || [
                    { id: '14_days_trial', name: '14 Days Free Trial', duration_days: 14 }
                ]);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccountStatusChange = async (resId: string, status: string) => {
        const updates = { status };
        setRestaurants(prev => prev.map(r => r.id === resId ? { ...r, ...updates } : r));
        try {
            const { error: updateError } = await supabase.from('restaurants').update(updates).eq('id', resId);
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating account status:', err);
            fetchRestaurants();
        }
    };

    const handleSubscriptionChange = async (resId: string, newStatusVal: string) => {
        const updates: any = {};
        let subType = null;
        let subStatus = 'inactive';
        
        if (newStatusVal === 'none') {
            updates.subscription_end_at = null;
        } else if (newStatusVal.startsWith('active-trial-')) {
            const trialId = newStatusVal.replace('active-trial-', '');
            const selectedTrial = trialPlans.find(t => t.id === trialId);
            subType = selectedTrial ? selectedTrial.name : 'trial plan';
            subStatus = 'trial';
            if (selectedTrial) {
                const endsAt = new Date();
                const days = selectedTrial.duration_days || 14;
                endsAt.setDate(endsAt.getDate() + days);
                updates.subscription_end_at = endsAt.toISOString();
            }
        } else if (newStatusVal.startsWith('active-plan-')) {
            const planId = newStatusVal.replace('active-plan-', '');
            const selectedPlan = billingPlans.find(p => p.id === planId);
            subType = selectedPlan ? selectedPlan.name : 'paid plan';
            subStatus = 'active';
            if (selectedPlan) {
                const endsAt = new Date();
                const durationMonths = selectedPlan.duration || 1;
                endsAt.setMonth(endsAt.getMonth() + durationMonths);
                updates.subscription_end_at = endsAt.toISOString();
            }
        } else if (newStatusVal === 'active-custom') {
            subStatus = 'active';
        } else if (newStatusVal === 'suspended') {
            subStatus = 'suspended';
        } else if (newStatusVal === 'expired') {
            subStatus = 'expired';
        }

        updates.subscription_plan = subType;
        updates.subscription_status = subStatus;

        setRestaurants(prev => prev.map(r => r.id === resId ? { ...r, ...updates } : r));
        try {
            const { error: updateError } = await supabase.from('restaurants').update(updates).eq('id', resId);
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating subscription status:', err);
            fetchRestaurants();
        }
    };

    const filteredRestaurants = restaurants
        .filter(res => {
            const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (res.contact_email && res.contact_email.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesFilter = filterStatus === 'all' || res.status === filterStatus;

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
        });

    const totalPages = Math.max(1, Math.ceil(filteredRestaurants.length / perPage));
    const safePage = Math.min(page, totalPages);
    const pagedRestaurants = filteredRestaurants.slice((safePage - 1) * perPage, safePage * perPage);

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

    const toggleSort = (newSort) => {
        if (sortBy === newSort) {
            setSortBy(newSort === 'newest' ? 'oldest' : newSort === 'name' ? 'newest' : 'newest');
        } else {
            setSortBy(newSort);
        }
    };

    const getSortIcon = (field) => {
        if (sortBy === field) return <ArrowUp size={14} />;
        if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
        return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Name,Status,Email,Phone,Created\n"
            + filteredRestaurants.map(r => `${r.name},${r.status},${r.contact_email || ''},${r.contact_phone || ''},${formatDate(r.created_at)}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `restaurants_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-3">
            {/* List Control */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface/50 rounded-xl px-3 py-2">
                {/* Search Box */}
                <div className="relative w-full md:max-w-[260px] shrink-0">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search Restaurants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                </div>

                {/* Inline Active Filters (Scrollable horizontally if needed) */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
                    {(searchQuery || filterStatus !== 'all' || sortBy !== 'newest') ? (
                        <>
                            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {filterStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                    <button onClick={() => setFilterStatus('all')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {sortBy === 'oldest' ? 'Oldest' : sortBy === 'name' ? 'A-Z' : sortBy === 'status' ? 'Status' : sortBy}
                                    <button onClick={() => setSortBy('newest')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            <button 
                                onClick={() => { setSearchQuery(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); }}
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
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
                        >
                            <Filter size={14} className="text-accent-primary" /> Filter
                        </button>
                        <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${
                            isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                        }`}>
                            {['all', 'pending', 'approved', 'active', 'suspended', 'rejected'].map(status => (
                                <button key={status} onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterStatus === status ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover transition-colors text-[12px] font-medium shadow-sm cursor-pointer border-none flex-1 md:flex-none"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Restaurants List Container */}
            <div className="w-full overflow-x-auto pb-32">
                {/* Table View */}
                <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-[900px]">
                    <thead className="bg-surface">
                        <tr className="border-b border-border">
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[22%]" onClick={() => toggleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Name {getSortIcon('name')}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[16%]" onClick={() => toggleSort('status')}>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    Rest Account Status {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[16%]">
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    Subscription Status
                                </div>
                            </th>

                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[30%] truncate">Email</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[16%]">Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableRowsSkeleton rows={perPage} columns={5} />
                        ) : filteredRestaurants.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-text-muted text-[13px]">
                                    No restaurants found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            <>
                                {pagedRestaurants.map((res) => (
                                    <tr
                                        key={res.id}
                                        className="group hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors"
                                        onClick={(e) => {
                                            if (!(e.target as Element).closest('.actions-cell') && !(e.target as Element).closest('button') && !(e.target as Element).closest('select')) {
                                                navigate(`/restaurants/${res.id}`, { state: { name: res.name, logo_url: res.logo_url } });
                                            }
                                        }}
                                    >
                                        <td className="py-2.5 px-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                                                    {res.name[0].toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-text-main text-[13px] group-hover:text-accent-primary transition-colors max-w-[220px] truncate block" title={res.name}>{res.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 align-middle actions-cell">
                                            <AccountStatusDropdown 
                                                status={res.status || 'pending'}
                                                onChange={(val) => handleAccountStatusChange(res.id, val)}
                                            />
                                        </td>
                                        <td className="py-2.5 px-4 align-middle actions-cell">
                                            <SubscriptionDropdown
                                                currentValue=""
                                                subscriptionStatus={res.subscription_status || ''}
                                                subscriptionPlan={res.subscription_plan || ''}
                                                trialPlans={trialPlans}
                                                billingPlans={billingPlans}
                                                disabled={res.status !== 'active'}
                                                onChange={(val) => handleSubscriptionChange(res.id, val)}
                                            />
                                        </td>

                                        <td className="py-2.5 px-4 align-middle">
                                            <div className="flex items-center gap-2 text-[12px] text-text-main">
                                                <Mail size={12} className="text-blue-500 shrink-0" />
                                                <span className="max-w-[200px] inline-block truncate" title={res.contact_email || '—'}>{res.contact_email || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 align-middle">
                                            <div className="flex items-center gap-2 text-[12px] text-text-main">
                                                <Phone size={12} className="text-blue-500 shrink-0" />
                                                <span className="max-w-[110px] inline-block truncate" title={res.contact_phone || '—'}>{res.contact_phone || '—'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {perPage - pagedRestaurants.length > 0 && Array.from({ length: perPage - pagedRestaurants.length }).map((_, idx) => (
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
            </div>
        </div>
    );
}
