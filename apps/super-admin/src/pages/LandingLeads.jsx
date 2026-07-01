import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Download, Search, Filter, Mail, Phone, Calendar, ArrowUpDown, Loader2, MapPin, Store, User, Inbox, X, Eye, Trash2, AlertTriangle, Building, MessageCircle } from 'lucide-react';

const PAGE_SIZE = 12;

export default function LandingLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Sorting and Filtering
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = Newest first, 'asc' = Oldest first
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // Specific date calendar filter
  
  // Updating Status
  const [updatingId, setUpdatingId] = useState(null);
  
  // Modal State
  const [selectedLead, setSelectedLead] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Intersection Observer for Lazy Loading
  const observer = useRef();
  const lastLeadElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreLeads();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchLeads();
  }, [sortOrder]); // Re-fetch from start when sort changes

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    if (selectedLead || deleteConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedLead, deleteConfirmId]);

  // Client-side filtering is applied to the fetched leads. 
  // For true server-side filtering, we would put these in the supabase query.
  // Since we have search/filter, lazy loading might act weird if we only filter locally.
  // To keep it robust, we will fetch normally, but if search/filters are active, 
  // we rely on the loaded data so far.
  
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    try {
      const { data, error: fetchError } = await supabase
        .from('landing_leads')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(0, PAGE_SIZE - 1);

      if (fetchError) throw fetchError;
      
      setLeads(data || []);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to fetch leads: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreLeads = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('landing_leads')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (fetchError) throw fetchError;
      
      setLeads(prev => [...prev, ...(data || [])]);
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching more leads:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const { error: updateError } = await supabase
        .from('landing_leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (updateError) throw updateError;
      
      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      // Update selected lead if it's currently open
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteConfirmId) return;
    
    setUpdatingId(deleteConfirmId);
    try {
      const { error: deleteError } = await supabase
        .from('landing_leads')
        .delete()
        .eq('id', deleteConfirmId);

      if (deleteError) throw deleteError;
      
      setLeads(prev => prev.filter(lead => lead.id !== deleteConfirmId));
      if (selectedLead && selectedLead.id === deleteConfirmId) setSelectedLead(null);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Failed to delete lead: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownload = () => {
    if (window.confirm("Are you sure you want to download the leads as a CSV file?")) {
      downloadCSV();
    }
  };

  const downloadCSV = () => {
    if (leads.length === 0) return;
    
    // Define headers
    const headers = ['Date', 'Restaurant Name', 'Owner Name', 'Phone', 'Email', 'Country', 'State', 'District', 'Status'];
    
    // Format data rows
    const csvRows = [
      headers.join(','), // Header row
      ...filteredLeads.map(lead => {
        const dateStr = `" ${new Date(lead.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}"`;
        
        // Force Excel to parse phone as string using Tab character prefix
        const phoneStr = `"\t${lead.phone_number || ''}"`;
        
        return [
          dateStr,
          `"${lead.restaurant_name || ''}"`,
          `"${lead.owner_name || ''}"`,
          phoneStr,
          `"${lead.email || ''}"`,
          `"${lead.country || ''}"`,
          `"${lead.state || ''}"`,
          `"${lead.district || ''}"`,
          `"${lead.status || ''}"`
        ].join(',');
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `landing_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'converted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
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
  });

  const truncateStyle = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block'
  };

  return (
    <div className="animate-fade-in pb-16">
      
      {/* Filters Card */}
      <Card className="mb-8 border-none shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <CardContent className="p-5 flex gap-4 flex-wrap items-center justify-between">
          
          <div className="relative flex-1 min-w-[300px]">
            <Search 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" 
            />
            <input 
              type="text" 
              placeholder="Search leads by restaurant, owner, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-9 pr-3 bg-surface-hover border border-border rounded-xl text-text-main text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
            />
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            
            {/* Date Picker Filter */}
            <div className="relative">
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`py-2.5 px-4 rounded-xl border border-border bg-surface text-sm cursor-pointer focus:outline-none font-sans ${dateFilter ? 'text-text-main' : 'text-text-muted'}`}
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="absolute right-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-hover flex items-center justify-center text-text-muted hover:bg-border transition-colors border-none cursor-pointer"
                  title="Clear Date"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2.5 pl-9 pr-9 rounded-xl border border-border bg-surface text-text-main text-sm cursor-pointer appearance-none focus:outline-none focus:border-accent-primary transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button 
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-hover hover:bg-border border border-transparent text-text-main text-sm font-semibold cursor-pointer min-w-[160px] transition-colors"
            >
              <ArrowUpDown size={16} />
              {sortOrder === 'desc' ? 'Sort: Date (Newest)' : 'Sort: Date (Oldest)'}
            </button>
            <button 
              onClick={handleDownload} 
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-hover hover:bg-border border border-border text-text-main text-sm font-semibold cursor-pointer transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl mb-6 flex items-center gap-2">
          <Loader2 size={18} /> {error}
        </div>
      )}

      {/* Modern Profile Card Grid View */}
      {loading && leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 gap-4 text-text-muted">
          <Loader2 className="animate-spin text-accent-primary" size={36} />
          <span className="font-medium text-[1.1rem]">Fetching latest leads...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 gap-4 text-text-muted">
          <Inbox size={56} className="opacity-20" />
          <span className="text-xl font-semibold text-text-main">No leads found</span>
          <p className="m-0 text-[15px]">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {filteredLeads.map((lead, index) => {
              // Attach observer ref to the last card for lazy loading
              const isLastElement = index === filteredLeads.length - 1;
              
              return (
                <Card 
                  key={lead.id} 
                  ref={isLastElement ? lastLeadElementRef : null}
                  onClick={() => setSelectedLead(lead)}
                  className="border border-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all overflow-hidden flex flex-col bg-surface cursor-pointer group"
                >
                  {/* Colored Card Banner Top */}
                  <div className="h-20 bg-gradient-to-br from-surface-hover to-border relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(lead.id);
                      }}
                      className="absolute top-3 left-3 z-10 bg-surface border-none cursor-pointer text-red-500 p-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center transition-all hover:scale-110 hover:text-red-600 disabled:opacity-50"
                      title="Delete Lead"
                      disabled={updatingId === lead.id}
                    >
                      {updatingId === lead.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                    <Badge variant={getStatusBadgeVariant(lead.status)} className="absolute top-3 right-3 z-10 uppercase">
                      {lead.status}
                    </Badge>
                  </div>
                  
                  <CardContent className="px-6 pb-6 pt-0 flex flex-col items-center -mt-9">
                    
                    {/* Floating Avatar Icon */}
                    <div className="w-[72px] h-[72px] rounded-full bg-surface border-4 border-surface flex items-center justify-center text-accent-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-4 z-10">
                      <div className="w-full h-full rounded-full bg-surface-hover flex items-center justify-center">
                        <Store size={32} />
                      </div>
                    </div>

                    {/* Central Info */}
                    <h3 className="m-0 mb-1.5 text-xl font-bold text-text-main text-center w-full truncate">
                      {lead.restaurant_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-text-muted text-[13px] font-medium mb-5">
                      <Calendar size={14} />
                      {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    <div className="w-full h-px bg-border mb-5" />

                    {/* Micro List */}
                    <div className="w-full flex flex-col gap-3 mb-6">
                      <div className="flex items-center gap-2.5 text-[14px] text-text-main font-medium">
                        <div className="w-7 h-7 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                          <User size={14} className="text-text-muted" />
                        </div>
                        <span className="truncate">{lead.owner_name}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[14px] text-text-main font-medium">
                        <div className="w-7 h-7 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                          <Phone size={14} className="text-text-muted" />
                        </div>
                        <span className="truncate">{lead.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[14px] text-text-main font-medium">
                        <div className="w-7 h-7 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-text-muted" />
                        </div>
                        <span className="truncate">{lead.district || lead.state || lead.country}</span>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                      className="w-full p-2.5 rounded-xl bg-surface-hover hover:bg-surface hover:border-border border border-transparent text-text-main cursor-pointer font-semibold text-[14px] flex items-center justify-center gap-2 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                    >
                      <Eye size={16} /> View Details
                    </button>

                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lazy Loading Spinner Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2.5 text-text-muted bg-surface px-6 py-2 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <Loader2 className="animate-spin text-accent-primary" size={18} />
                <span className="text-[14px] font-semibold">Loading more leads...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal - Redesigned UI */}
      {selectedLead && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="bg-surface rounded-[24px] w-full max-w-[520px] shadow-[0_24px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start pt-8 px-8 pb-6 border-b border-border bg-surface">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-hover to-border flex items-center justify-center text-accent-primary shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]">
                  <Store size={28} />
                </div>
                <div>
                  <h2 className="m-0 mb-1.5 text-[1.4rem] font-extrabold text-text-main tracking-tight">
                    {selectedLead.restaurant_name}
                  </h2>
                  <div className="flex items-center gap-2 text-text-muted text-[14px] font-medium">
                    <Calendar size={14} />
                    {new Date(selectedLead.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="bg-surface-hover hover:bg-border border-none cursor-pointer text-text-main p-2 rounded-full transition-colors flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Premium Soft Boxed Layout */}
            <div className="px-8 py-6 flex flex-col gap-4 bg-surface-hover">
              
              <div className="bg-surface px-5 py-4 rounded-2xl flex items-center gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <User size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wider text-text-muted font-bold">Owner Name</span>
                  <span className="text-[16px] font-semibold text-text-main">{selectedLead.owner_name}</span>
                </div>
              </div>

              <div className="bg-surface px-5 py-4 rounded-2xl flex items-center gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Phone size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wider text-text-muted font-bold">Phone Number</span>
                  <a href={`tel:${selectedLead.phone_number}`} className="text-[16px] font-semibold text-text-main no-underline hover:underline">{selectedLead.phone_number}</a>
                </div>
              </div>

              <div className="bg-surface px-5 py-4 rounded-2xl flex items-center gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Mail size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wider text-text-muted font-bold">Email Address</span>
                  {selectedLead.email ? (
                    <a href={`mailto:${selectedLead.email}`} className="text-[16px] font-semibold text-text-main no-underline hover:underline">{selectedLead.email}</a>
                  ) : <span className="text-[16px] italic text-text-muted">Not provided</span>}
                </div>
              </div>

              <div className="bg-surface px-5 py-4 rounded-2xl flex items-center gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <MapPin size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wider text-text-muted font-bold">Location Details</span>
                  <span className="text-[16px] font-semibold text-text-main leading-relaxed">
                    {selectedLead.district ? `${selectedLead.district}, ` : ''}
                    {selectedLead.state ? `${selectedLead.state}, ` : ''}
                    {selectedLead.country}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-surface border-t border-border flex justify-between items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-bold text-text-muted uppercase tracking-wider">Current Status:</span>
                <Badge variant={getStatusBadgeVariant(selectedLead.status)} className="px-3.5 py-1.5 text-[13px] uppercase">
                  {selectedLead.status}
                </Badge>
              </div>
              <select
                value={selectedLead.status}
                disabled={updatingId === selectedLead.id}
                onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                className={`px-4 py-2.5 text-[15px] font-bold rounded-xl border-2 border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary transition-all shadow-[0_2px_6px_rgba(0,0,0,0.03)] w-40 ${updatingId === selectedLead.id ? 'cursor-wait' : 'cursor-pointer'}`}
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

      {/* Basic Keyframe Animations for Modal */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1010] p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div 
            className="bg-surface rounded-[24px] w-full max-w-[400px] shadow-[0_24px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)] py-10 px-8 flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[72px] h-[72px] rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]">
              <AlertTriangle size={36} />
            </div>
            <h3 className="m-0 mb-3 text-2xl font-extrabold text-text-main tracking-tight">Delete this lead?</h3>
            <p className="m-0 mb-8 text-text-muted text-base leading-relaxed">
              Are you sure you want to permanently delete this lead? This action cannot be undone.
            </p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3.5 rounded-xl bg-surface-hover hover:bg-border border-none text-text-main font-bold text-base cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteLead}
                disabled={updatingId === deleteConfirmId}
                className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 border-none text-white font-bold text-base cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-[0_4px_16px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
              >
                {updatingId === deleteConfirmId ? <Loader2 className="animate-spin" size={20} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
