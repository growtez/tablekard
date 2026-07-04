import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Download, Search, Filter, SlidersHorizontal, Mail, Phone, MapPin, Store, User, X, Trash2, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Calendar, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TableRowsSkeleton } from '../components/ui/Skeleton';

export default function LandingLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [dateFilter, setDateFilter] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  // Modal & Actions
  const [selectedLead, setSelectedLead] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('landing_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setLeads(data || []);
    } catch (err) {
      setError('Failed to fetch leads: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    if (selectedLead || deleteConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedLead, deleteConfirmId]);

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const { error: updateError } = await supabase
        .from('landing_leads').update({ status: newStatus }).eq('id', leadId);
      if (updateError) throw updateError;
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, status: newStatus });
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteConfirmId) return;
    setUpdatingId(deleteConfirmId);
    try {
      const { error: deleteError } = await supabase.from('landing_leads').delete().eq('id', deleteConfirmId);
      if (deleteError) throw deleteError;
      setLeads(prev => prev.filter(l => l.id !== deleteConfirmId));
      if (selectedLead?.id === deleteConfirmId) setSelectedLead(null);
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Failed to delete lead: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const leadDateStr = new Date(lead.created_at).toISOString().split('T')[0];
    const matchesDate = !dateFilter || leadDateStr === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortOrder === 'name') return (a.restaurant_name || '').localeCompare(b.restaurant_name || '');
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filteredLeads.slice((safePage - 1) * perPage, safePage * perPage);

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
    setPage(1);
    if (newSort === 'newest') {
      setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
    } else if (sortOrder === newSort) {
      setSortOrder('newest');
    } else {
      setSortOrder(newSort);
    }
  };

  const getSortIcon = (field) => {
    if (field === 'newest') {
      if (sortOrder === 'newest') return <ArrowUp size={14} />;
      if (sortOrder === 'oldest') return <ArrowDown size={14} />;
      return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    }
    if (sortOrder === field) return <ArrowDown size={14} />;
    return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
  };

  const handleExport = () => {
    const headers = ['Date', 'Restaurant Name', 'Owner Name', 'Phone', 'Email', 'Country', 'State', 'District', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        `"${new Date(lead.created_at).toLocaleDateString()}"`,
        `"${lead.restaurant_name || ''}"`,
        `"${lead.owner_name || ''}"`,
        `"\t${lead.phone_number || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.country || ''}"`,
        `"${lead.state || ''}"`,
        `"${lead.district || ''}"`,
        `"${lead.status || ''}"`,
      ].join(','))
    ];
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + csvRows.join('\n')));
    link.setAttribute("download", `landing_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColor = s => s === 'converted' ? 'text-green-600' : s === 'contacted' ? 'text-amber-600' : s === 'rejected' ? 'text-red-600' : 'text-blue-600';
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFilter;

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
        {/* Search Box */}
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        {/* Active Filter Pills */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
          {hasActiveFilters ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchTerm}"
                  <button onClick={() => { setSearchTerm(''); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <button onClick={() => { setStatusFilter('all'); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {dateFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {dateFilter}
                  <button onClick={() => { setDateFilter(''); setPage(1); }} className="hover:text-blue-800 focus:outline-none flex items-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSortOrder('newest'); setDateFilter(''); setPage(1); }} className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0">Clear</button>
            </>
          ) : (
            <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between md:justify-start gap-1 shrink-0 md:border-x md:border-border/50 px-3 py-1.5 md:py-0 w-full md:w-auto">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center justify-center gap-1 w-[80px]">
            {getPaginationPages().map((p, i) => p === '...' ? (
              <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
            ) : (
              <button key={p} onClick={() => setPage(p)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p}</button>
            ))}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Per-page & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
            {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>

          {/* Date filter */}
          <div className="relative flex-1 md:flex-none">
            <input
              type="date"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2 rounded-lg border border-border bg-surface text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer text-text-main"
              title="Filter by date"
            />
          </div>

          <div className="relative group flex-1 md:flex-none">
            <button 
              onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
            >
              <Filter size={14} className="text-accent-primary" /> Status
            </button>
            <div className={`absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${
              isStatusFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
            }`}>
              {['all', 'new', 'contacted', 'converted', 'rejected'].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); setIsStatusFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${statusFilter === s ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                  {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleExport} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover transition-colors text-[12px] font-medium shadow-sm cursor-pointer border-none flex-1 md:flex-none">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Leads List Container */}
      <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Desktop View Table */}
        <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap table-fixed">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[20%]" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-2">
                  Restaurant {getSortIcon('name')}
                </div>
              </th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[14%]">Owner</th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[13%]">Phone</th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[18%]">Email</th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[14%]">Location</th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Status</th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[9%]" onClick={() => toggleSort('newest')}>
                <div className="flex items-center gap-2">
                  Date {getSortIcon('newest')}
                </div>
              </th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[2%]"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableRowsSkeleton rows={perPage} columns={8} />
            ) : error ? (
              <tr><td colSpan="8" className="text-center py-10 text-red-500 text-[13px] font-medium">{error}</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-10 text-text-muted text-[13px]">No leads found matching your criteria.</td></tr>
            ) : (
              <>
                {paged.map(lead => (
                  <tr key={lead.id} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors" onClick={() => setSelectedLead(lead)}>
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                          {(lead.restaurant_name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-text-main text-[13px] truncate group-hover:text-accent-primary transition-colors max-w-[160px]" title={lead.restaurant_name}>{lead.restaurant_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5 text-[12px] text-text-main">
                        <User size={11} className="text-text-muted shrink-0" />
                        <span className="truncate max-w-[120px]" title={lead.owner_name}>{lead.owner_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5 text-[12px] text-text-main">
                        <Phone size={11} className="text-text-muted shrink-0" />
                        <span>{lead.phone_number || '—'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5 text-[12px] text-text-main">
                        <Mail size={11} className="text-blue-500 shrink-0" />
                        <span className="truncate max-w-[170px]" title={lead.email}>{lead.email || '—'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate max-w-[120px]">{[lead.district, lead.state, lead.country].filter(Boolean).join(', ') || '—'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <span className={`text-[12px] font-bold ${statusColor(lead.status)}`}>{(lead.status || 'new').toUpperCase()}</span>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <span className="text-[12px] text-text-muted font-medium">{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirmId(lead.id); }}
                        disabled={updatingId === lead.id}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete Lead"
                      >
                        {updatingId === lead.id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {perPage - paged.length > 0 && Array.from({ length: perPage - paged.length }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="border-b border-border/40 last:border-b-0 opacity-0 pointer-events-none">
                    <td colSpan="8" className="py-2.5 px-4 align-middle">
                      <div className="h-8"></div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
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
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-[13px] font-medium">{error}</div>
          ) : paged.length === 0 ? (
            <div className="text-center py-10 text-text-muted text-[13px]">No leads found matching your criteria.</div>
          ) : (
            paged.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="p-4 hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors flex flex-col gap-2.5 active:bg-surface-hover/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                      {(lead.restaurant_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-text-main text-[13px] truncate" title={lead.restaurant_name}>{lead.restaurant_name}</span>
                      <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                        <User size={10} className="shrink-0" />
                        {lead.owner_name || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface-hover border border-border/40 ${statusColor(lead.status)}`}>
                      {(lead.status || 'new').toUpperCase()}
                    </span>
                    <span className="text-[10px] text-text-muted">{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pl-11">
                  <div className="flex items-center gap-2 text-[12px] text-text-main">
                    <Phone size={12} className="text-text-muted shrink-0" />
                    <span>{lead.phone_number || '—'}</span>
                  </div>

                  {lead.email && (
                    <div className="flex items-center gap-2 text-[12px] text-text-main">
                      <Mail size={12} className="text-blue-500 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border/20">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted truncate mr-4">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{[lead.district, lead.state, lead.country].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirmId(lead.id); }}
                      disabled={updatingId === lead.id}
                      className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer shrink-0"
                      title="Delete Lead"
                    >
                      {updatingId === lead.id ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={() => setSelectedLead(null)}>
          <div className="bg-surface rounded-[24px] w-full max-w-[520px] max-h-[90vh] shadow-[0_24px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start pt-8 px-8 pb-6 border-b border-border shrink-0">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Store size={28} />
                </div>
                <div>
                  <h2 className="m-0 mb-1.5 text-[1.4rem] font-extrabold text-text-main tracking-tight">{selectedLead.restaurant_name}</h2>
                  <div className="flex items-center gap-2 text-text-muted text-[14px] font-medium">
                    <Calendar size={14} />
                    {new Date(selectedLead.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="bg-surface-hover hover:bg-border border-none cursor-pointer text-text-main p-2 rounded-full transition-colors flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="px-8 py-6 flex flex-col gap-4 bg-surface-hover overflow-y-auto min-h-0 flex-1">
              {[
                { icon: <User size={20} />, color: 'bg-blue-500/10 text-blue-600', label: 'Owner Name', value: selectedLead.owner_name },
                { icon: <Phone size={20} />, color: 'bg-emerald-500/10 text-emerald-600', label: 'Phone Number', value: <a href={`tel:${selectedLead.phone_number}`} className="text-[16px] font-semibold text-text-main no-underline hover:underline">{selectedLead.phone_number}</a> },
                { icon: <Mail size={20} />, color: 'bg-amber-500/10 text-amber-600', label: 'Email Address', value: selectedLead.email ? <a href={`mailto:${selectedLead.email}`} className="text-[16px] font-semibold text-text-main no-underline hover:underline">{selectedLead.email}</a> : <span className="text-[16px] italic text-text-muted">Not provided</span> },
                { icon: <MapPin size={20} />, color: 'bg-purple-500/10 text-purple-600', label: 'Location', value: [selectedLead.district, selectedLead.state, selectedLead.country].filter(Boolean).join(', ') || '—' },
              ].map(({ icon, color, label, value }) => (
                <div key={label} className="bg-surface px-5 py-4 rounded-2xl flex items-center gap-4 border border-border">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] uppercase tracking-wider text-text-muted font-bold">{label}</span>
                    {typeof value === 'string' ? <span className="text-[16px] font-semibold text-text-main">{value}</span> : value}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-8 py-6 bg-surface border-t border-border flex justify-between items-center gap-6 flex-wrap shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-bold text-text-muted uppercase tracking-wider">Status:</span>
                <span className={`text-[14px] font-bold ${statusColor(selectedLead.status)}`}>{(selectedLead.status || 'new').toUpperCase()}</span>
              </div>
              <select
                value={selectedLead.status}
                disabled={updatingId === selectedLead.id}
                onChange={e => handleStatusChange(selectedLead.id, e.target.value)}
                className={`px-4 py-2.5 text-[14px] font-bold rounded-xl border-2 border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary transition-all w-40 ${updatingId === selectedLead.id ? 'cursor-wait' : 'cursor-pointer'}`}
              >
                <option value="new">Mark New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1010] p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-surface rounded-[24px] w-full max-w-[400px] shadow-[0_24px_50px_rgba(0,0,0,0.2)] overflow-hidden py-10 px-8 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
            <div className="w-[72px] h-[72px] rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
              <AlertTriangle size={36} />
            </div>
            <h3 className="m-0 mb-3 text-2xl font-extrabold text-text-main tracking-tight">Delete this lead?</h3>
            <p className="m-0 mb-8 text-text-muted text-base leading-relaxed">Are you sure you want to permanently delete this lead? This action cannot be undone.</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 rounded-xl bg-surface-hover hover:bg-border border-none text-text-main font-bold text-base cursor-pointer transition-colors">Cancel</button>
              <button onClick={handleDeleteLead} disabled={updatingId === deleteConfirmId} className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 border-none text-white font-bold text-base cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {updatingId === deleteConfirmId ? <Loader2 className="animate-spin" size={20} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
    </div>
  );
}
