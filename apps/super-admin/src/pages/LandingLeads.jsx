import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Download, Search, Filter, Mail, Phone, Calendar, ArrowUpDown, Loader2, MapPin, Store, User, Inbox, X, Eye, Trash2, AlertTriangle } from 'lucide-react';
import '../AdminPanel.css'; // Reuse existing styles

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
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0.5rem 0' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Landing Page Leads
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Manage and track potential restaurants from your public website.
          </p>
        </div>
        <button 
          onClick={handleDownload} 
          className="btn-primary" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 20px', borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(11, 14, 23, 0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <Download size={18} /> Export as CSV
        </button>
      </div>

      {/* Filters Card */}
      <Card style={{ marginBottom: '2rem', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <CardContent style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search 
              size={18} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input 
              type="text" 
              placeholder="Search leads by restaurant, owner, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 44px',
                borderRadius: '12px', border: '1px solid var(--border-color)',
                background: 'var(--surface-color)', color: 'var(--text-main)',
                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Date Picker Filter */}
            <div style={{ position: 'relative' }}>
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: '10px 16px', borderRadius: '10px',
                  border: '1px solid var(--border-color)', background: 'var(--surface-color)',
                  color: dateFilter ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  style={{
                    position: 'absolute', right: '36px', top: '50%', transform: 'translateY(-50%)',
                    background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                    width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)'
                  }}
                  title="Clear Date"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <Filter size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 36px 10px 36px', borderRadius: '10px',
                  border: '1px solid var(--border-color)', background: 'var(--surface-color)',
                  color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer',
                  appearance: 'none', outline: 'none'
                }}
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
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '10px 16px', borderRadius: '10px',
                background: 'var(--surface-hover)', border: '1px solid transparent',
                color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer',
                fontWeight: 600, transition: 'all 0.2s', minWidth: '160px', justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--border-color)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--surface-hover)'}
            >
              <ArrowUpDown size={16} />
              {sortOrder === 'desc' ? 'Sort: Date (Newest)' : 'Sort: Date (Oldest)'}
            </button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Loader2 size={18} /> {error}
        </div>
      )}

      {/* Modern Profile Card Grid View */}
      {loading && leads.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', gap: '1rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={36} color="var(--accent-primary)" />
          <span style={{ fontWeight: 500, fontSize: '1.1rem' }}>Fetching latest leads...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', gap: '1rem', color: 'var(--text-muted)' }}>
          <Inbox size={56} opacity={0.2} />
          <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>No leads found</span>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredLeads.map((lead, index) => {
              // Attach observer ref to the last card for lazy loading
              const isLastElement = index === filteredLeads.length - 1;
              
              return (
                <Card 
                  key={lead.id} 
                  ref={isLastElement ? lastLeadElementRef : null}
                  onClick={() => setSelectedLead(lead)}
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    background: 'var(--surface-color)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Colored Card Banner Top */}
                  <div style={{ 
                    height: '80px', 
                    background: 'linear-gradient(135deg, rgba(11, 14, 23, 0.03) 0%, rgba(11, 14, 23, 0.08) 100%)',
                    position: 'relative'
                  }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(lead.id);
                      }}
                      style={{
                        position: 'absolute', top: '12px', left: '12px', zIndex: 1,
                        background: 'var(--surface-color)', border: 'none', cursor: 'pointer',
                        color: '#ef4444', padding: '6px', borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = '#dc2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = '#ef4444'; }}
                      title="Delete Lead"
                      disabled={updatingId === lead.id}
                    >
                      {updatingId === lead.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                    <Badge variant={getStatusBadgeVariant(lead.status)} style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1 }}>
                      {lead.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <CardContent style={{ padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-36px' }}>
                    
                    {/* Floating Avatar Icon */}
                    <div style={{ 
                      width: '72px', height: '72px', borderRadius: '50%', 
                      background: 'var(--surface-color)',
                      border: '4px solid var(--surface-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: 'var(--accent-primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      marginBottom: '1rem',
                      zIndex: 2
                    }}>
                      <div style={{ 
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(11,14,23,0.05) 0%, rgba(11,14,23,0.1) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Store size={32} />
                      </div>
                    </div>

                    {/* Central Info */}
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center', width: '100%', ...truncateStyle }}>
                      {lead.restaurant_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '1.25rem' }}>
                      <Calendar size={14} />
                      {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginBottom: '1.25rem' }} />

                    {/* Micro List */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={14} color="var(--text-muted)" />
                        </div>
                        <span style={truncateStyle}>{lead.owner_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Phone size={14} color="var(--text-muted)" />
                        </div>
                        <span style={truncateStyle}>{lead.phone_number}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MapPin size={14} color="var(--text-muted)" />
                        </div>
                        <span style={truncateStyle}>{lead.district || lead.state || lead.country}</span>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                      style={{ 
                        width: '100%', padding: '10px', borderRadius: '10px', 
                        background: 'var(--surface-hover)', color: 'var(--text-main)',
                        border: '1px solid transparent', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-color)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-hover)';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
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
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', background: 'var(--surface-color)', padding: '8px 24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Loader2 className="animate-spin" size={18} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading more leads...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal - Redesigned UI */}
      {selectedLead && (
        <div 
          style={{ 
            position: 'fixed', inset: 0, backgroundColor: 'rgba(11, 14, 23, 0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem', animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div 
            style={{ 
              background: 'var(--surface-color)', borderRadius: '24px', width: '100%', maxWidth: '520px',
              boxShadow: '0 24px 50px rgba(0,0,0,0.15)', overflow: 'hidden',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2rem 2rem 1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '16px', 
                  background: 'linear-gradient(135deg, rgba(11,14,23,0.04) 0%, rgba(11,14,23,0.08) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)'
                }}>
                  <Store size={28} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {selectedLead.restaurant_name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                    <Calendar size={14} />
                    {new Date(selectedLead.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                style={{ background: 'var(--surface-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '8px', borderRadius: '50%', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Premium Soft Boxed Layout */}
            <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface-hover)' }}>
              
              <div style={{ background: 'var(--surface-color)', padding: '1rem 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <User size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>Owner Name</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>{selectedLead.owner_name}</span>
                </div>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '1rem 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Phone size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>Phone Number</span>
                  <a href={`tel:${selectedLead.phone_number}`} style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>{selectedLead.phone_number}</a>
                </div>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '1rem 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <Mail size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>Email Address</span>
                  {selectedLead.email ? (
                    <a href={`mailto:${selectedLead.email}`} style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>{selectedLead.email}</a>
                  ) : <span style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Not provided</span>}
                </div>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '1rem 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                  <MapPin size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>Location Details</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {selectedLead.district ? `${selectedLead.district}, ` : ''}
                    {selectedLead.state ? `${selectedLead.state}, ` : ''}
                    {selectedLead.country}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1.5rem 2rem', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status:</span>
                <Badge variant={getStatusBadgeVariant(selectedLead.status)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                  {selectedLead.status.toUpperCase()}
                </Badge>
              </div>
              <select
                value={selectedLead.status}
                disabled={updatingId === selectedLead.id}
                onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                style={{
                  padding: '10px 18px', fontSize: '0.95rem', fontWeight: 700,
                  borderRadius: '12px', border: '2px solid var(--border-color)',
                  background: 'var(--surface-color)', color: 'var(--text-main)',
                  cursor: updatingId === selectedLead.id ? 'wait' : 'pointer',
                  outline: 'none', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  width: '160px'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
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
          style={{ 
            position: 'fixed', inset: 0, backgroundColor: 'rgba(11, 14, 23, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010,
            padding: '1rem', animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div 
            style={{ 
              background: 'var(--surface-color)', borderRadius: '24px', width: '100%', maxWidth: '400px',
              boxShadow: '0 24px 50px rgba(0,0,0,0.2)', overflow: 'hidden',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)', padding: '2.5rem 2rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
              <AlertTriangle size={36} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Delete this lead?</h3>
            <p style={{ margin: '0 0 2rem 0', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this lead? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--surface-hover)', border: 'none', color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteLead}
                disabled={updatingId === deleteConfirmId}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.2)'; }}
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
