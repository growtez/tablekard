import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Users,  Shield, CheckCircle2, AlertTriangle, Loader2, Search, MoreVertical, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@restaurant-saas/supabase';


interface TeamMember {
  id: string; // from restaurant_users
  profile_id: string;
  role: string;
  active: boolean;
  profiles: {
    name: string;
    email: string;
    avatar_url: string | null;
  }
}

const Team: React.FC = () => {
  const { activeRestaurantId, user } = useAuth();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' // 'admin' or 'staff'
  });

  useEffect(() => {
    if (activeRestaurantId) {
      fetchMembers();
    }
  }, [activeRestaurantId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_users')
        .select(`
          id,
          profile_id,
          role,
          active,
          profiles (
            name,
            email,
            avatar_url
          )
        `)
        .eq('restaurant_id', activeRestaurantId as string);

      if (error) throw error;
      setMembers((data || []) as unknown as TeamMember[]);
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurantId) {
      setError("Restaurant context missing.");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: { 
          name: formData.name, 
          email: formData.email, 
          password: formData.password, 
          role: formData.role, 
          restaurant_id: activeRestaurantId 
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to invoke function');
      }

      if (data?.error) {
         throw new Error(data.error);
      }

      // Success!
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      fetchMembers();

    } catch (err: any) {
      console.error('Error creating team member:', err);
      setError(err.message || 'Failed to create team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberStatus = async (member: TeamMember) => {
    if (member.profile_id === user?.id) return;
    try {
      const { error } = await supabase
        .from('restaurant_users')
        .update({ active: !member.active })
        .eq('id', member.id);
        
      if (error) throw error;
      fetchMembers();
    } catch (err: any) {
      console.error('Failed to toggle status', err);
      alert('Failed to update member status');
    }
  };

  const filteredMembers = members.filter(m => 
    m.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 max-md:-mt-[52px] max-md:mb-[8px] flex-nowrap mb-7">
        <div className="max-md:ml-[56px]">
          <h1 className="text-[18px] sm:text-[22px] font-semibold text-[#1A202C] m-0 mb-1 dark:text-tk-text whitespace-nowrap">Staff<span className="hidden sm:inline"> Management</span></h1>
        </div>
        {/* Desktop Actions */}
        <div className="hidden md:flex gap-2 items-center shrink-0 flex-nowrap overflow-x-auto hide-scrollbar w-full lg:w-auto max-md:pb-1 max-md:justify-start">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-[1.5px] border-[#E2E8F0] rounded-xl text-sm font-medium text-[#4A5568] cursor-pointer transition-all duration-200 hover:bg-[#F7FAFC] hover:border-[#CBD5E0] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-hover shrink-0 whitespace-nowrap" onClick={fetchMembers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-tk-burgundy border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(139,58,30,0.3)] hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(139,58,30,0.4)] shrink-0 whitespace-nowrap" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Add Member
          </button>
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
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1A202C] hover:bg-[#F7FAFC] dark:text-tk-text dark:hover:bg-tk-bg-hover transition-colors" onClick={() => { setShowActionsMenu(false); setIsModalOpen(true); }}>
                <Plus size={16} className="text-tk-burgundy" />
                Add Member
              </button>
              <div className="h-[1px] bg-[#E2E8F0] dark:bg-tk-border my-1"></div>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4A5568] hover:bg-[#F7FAFC] disabled:opacity-50 dark:text-tk-text-secondary dark:hover:bg-tk-bg-hover transition-colors" onClick={() => { setShowActionsMenu(false); fetchMembers(); }} disabled={loading}>
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
            <Users size={16} />
            {loading ? '...' : `${members.length} Members`}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#EDF2F7] text-[#4A5568] rounded-full text-sm font-semibold shrink-0 dark:bg-tk-bg-elevated dark:text-tk-text-secondary bg-[#C6F6D5] text-[#22543D] dark:bg-[rgba(198,246,213,0.15)] dark:text-[#68D391]">
            <CheckCircle size={16} />
            {loading ? '...' : `${members.filter((m) => m.active).length} Active`}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0] dark:text-tk-text-secondary" size={16} />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1A202C] focus:outline-none focus:border-tk-burgundy focus:bg-white transition-all dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text dark:focus:bg-tk-bg-surface"
          />
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-[#4A5568] text-center">
          <div className="w-10 h-10 border-4 border-[#E2E8F0] border-t-tk-burgundy rounded-full animate-spin"></div>
          <p>Loading staff...</p>
        </div>
      )}

      {!loading && filteredMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-[#4A5568] text-center">
          <Users size={64} color="#CBD5E0" />
          <p className="text-xl font-semibold text-[#4A5568] m-0 dark:text-tk-text">No staff members found</p>
          <p className="text-sm text-[#718096] max-w-[300px] m-0 dark:text-tk-text-secondary">
            {searchTerm ? "No members match your search criteria." : "Invite your staff to collaborate."}
          </p>
          {!searchTerm && (
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 mt-2 bg-tk-burgundy border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(139,58,30,0.3)] hover:bg-[#6B2A15] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(139,58,30,0.4)] max-md:flex-1" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              Add Member
            </button>
          )}
        </div>
      )}

      {/* Staff Grid */}
      {!loading && filteredMembers.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 max-md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] max-sm:grid-cols-1">
          {filteredMembers.map((member) => (
            <div key={member.id} className={`bg-white rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#E2E8F0] flex flex-col gap-4 transition-all duration-200 relative hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] dark:bg-tk-bg-card dark:border-tk-border ${!member.active ? 'opacity-60 border-dashed' : ''}`}>
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_4px_10px_rgba(139,58,30,0.2)] flex items-center justify-center font-extrabold text-[15px] shrink-0">
                    {member.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[#1A202C] text-[15px] truncate dark:text-tk-text">
                      {member.profiles?.name || 'Unknown'}
                      {member.profile_id === user?.id && ' (You)'}
                    </span>
                    <span className="text-[12px] font-medium text-[#718096] truncate mt-0.5 dark:text-tk-text-secondary">{member.profiles?.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  member.role === 'admin' 
                    ? 'bg-[#E9D8FD] text-[#44337A] border border-[#D6BCFA]' 
                    : 'bg-[#BEE3F8] text-[#2A4365] border border-[#90CDF4]'
                }`}>
                  <Shield size={11} />
                  {member.role === 'admin' ? 'Admin' : 'Kitchen'}
                </span>

                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 select-none ${member.active ? 'bg-[#C6F6D5] text-[#22543D] dark:bg-[rgba(198,246,213,0.15)] dark:text-[#68D391]' : 'bg-[#FED7D7] text-[#742A2A] dark:bg-[rgba(254,215,215,0.15)] dark:text-[#FC8181]'} ${member.profile_id !== user?.id ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'}`}
                  onClick={() => member.profile_id !== user?.id && toggleMemberStatus(member)}
                  title={member.profile_id === user?.id ? "You cannot change your own status" : "Click to toggle status"}
                >
                  {member.active ? (
                    <><CheckCircle size={11} /> Active</>
                  ) : (
                    <><AlertCircle size={11} /> Inactive</>
                  )}
                </div>
              </div>

              {member.profile_id !== user?.id && (
                <div className="flex mt-2">
                  <button
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 border-none rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap shadow-sm ${
                      member.active
                        ? 'bg-[#FFF5F5] text-[#C53030] hover:bg-[#FED7D7] cursor-pointer hover:-translate-y-0.5'
                        : 'bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7] cursor-pointer hover:-translate-y-0.5'
                    }`}
                    onClick={() => toggleMemberStatus(member)}
                  >
                    {member.active ? 'Deactivate Member' : 'Activate Member'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-[fadeIn_0.2s_ease]" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="bg-white dark:bg-tk-bg-card rounded-[28px] p-8 max-w-[480px] w-full border border-[#E2E8F0] dark:border-tk-border shadow-[0_24px_48px_rgba(0,0,0,0.2)] animate-[slideUp_0.3s_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tk-burgundy/10 flex items-center justify-center text-tk-burgundy">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-[22px] font-extrabold text-tk-text m-0">Add Member</h2>
              </div>
              <button 
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-tk-bg-surface text-tk-text-secondary hover:text-tk-text hover:bg-tk-bg-hover rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#FFF5F5] border border-[#FEB2B2] rounded-2xl flex items-start gap-3 text-[#C53030]">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-[13px] font-bold m-0">{error}</p>
              </div>
            )}



            <form onSubmit={handleCreateMember} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-tk-text uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-tk-burgundy/10 focus:border-tk-burgundy transition-all"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-tk-text uppercase tracking-wider">Role</label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-3 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-tk-burgundy/10 focus:border-tk-burgundy transition-all appearance-none cursor-pointer"
                    >
                      <option value="staff">Kitchen Staff</option>
                      <option value="admin">Restaurant Admin</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tk-text-secondary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-tk-text uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="staff@restaurant.com"
                  className="w-full px-4 py-3 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-tk-burgundy/10 focus:border-tk-burgundy transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-tk-text uppercase tracking-wider">Temporary Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-tk-burgundy/10 focus:border-tk-burgundy transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-tk-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-tk-text-secondary font-bold hover:bg-tk-bg-surface rounded-full transition-colors text-[14px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 text-[14px] disabled:opacity-70 shadow-[0_8px_16px_rgba(139,58,30,0.2)] hover:shadow-[0_12px_20px_rgba(139,58,30,0.3)] hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Confirm & Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Team;
