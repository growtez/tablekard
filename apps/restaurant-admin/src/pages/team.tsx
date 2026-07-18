import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Users, Mail, Shield, CheckCircle2, AlertTriangle, Loader2, Search } from 'lucide-react';
import { supabase } from '@restaurant-saas/supabase';
import { createClient } from '@supabase/supabase-js';

// Initialize a separate client with the service role key for user creation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const adminAuthClient = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

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
  const { activeRestaurantId } = useAuth();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      const clientToUse = adminAuthClient || (supabase as any);
      const { data, error } = await clientToUse
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
        .eq('restaurant_id', activeRestaurantId);

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
    if (!adminAuthClient) {
      setError("Admin privileges not configured. Missing Service Key.");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name
        }
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      const globalRole = formData.role === 'admin' ? 'restaurant_admin' : 'restaurant_staff';

      // 2. Insert into profiles
      const { error: profileError } = await adminAuthClient
        .from('profiles')
        .insert({
          id: userId,
          email: formData.email.trim().toLowerCase(),
          name: formData.name,
          role: globalRole
        });

      if (profileError) {
        // If it already exists, update both name and email
        await adminAuthClient
          .from('profiles')
          .update({ 
            name: formData.name,
            email: formData.email.trim().toLowerCase(),
            role: globalRole
          })
          .eq('id', userId);
      }

      // 3. Insert into restaurant_users
      const { error: restUserError } = await adminAuthClient
        .from('restaurant_users')
        .insert({
          restaurant_id: activeRestaurantId,
          profile_id: userId,
          role: formData.role,
          active: true
        });

      if (restUserError) throw restUserError;

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
    try {
      const clientToUse = adminAuthClient || (supabase as any);
      const { error } = await clientToUse
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
    <div className="flex flex-col h-full">
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap mb-8 max-md:-mt-[52px] max-md:mb-[12px] animate-[fadeIn_0.3s_ease]">
          <div className="flex items-center gap-4 max-md:ml-[56px]">
            <h1 className="text-[28px] font-extrabold text-tk-text tracking-tight m-0">Team</h1>
            <div className="px-3 py-1 bg-tk-burgundy/10 text-tk-burgundy text-[13px] font-bold rounded-full border border-tk-burgundy/20">
              {filteredMembers.length} Members
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tk-text-secondary opacity-70" size={16} />
              <input
                type="text"
                placeholder="Search team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-full text-tk-text text-sm focus:outline-none focus:ring-4 focus:ring-tk-burgundy/10 focus:border-tk-burgundy transition-all w-full sm:w-[260px] shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white rounded-full text-sm font-bold transition-all duration-300 shadow-[0_8px_16px_rgba(139,58,30,0.2)] hover:shadow-[0_12px_20px_rgba(139,58,30,0.3)] hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="max-sm:hidden">Add Member</span>
            </button>
          </div>
        </div>

      <div className="flex-1 overflow-auto bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-[24px] shadow-sm mb-6 relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-tk-text-secondary">
            <Loader2 className="animate-spin text-tk-burgundy" size={36} />
            <p className="text-sm font-semibold tracking-wide uppercase">Loading team...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4 animate-[fadeIn_0.4s_ease]">
            <div className="w-20 h-20 bg-tk-bg-surface border border-tk-border rounded-[24px] flex items-center justify-center mb-5 shadow-sm rotate-3">
              <Users className="text-tk-text-secondary opacity-60" size={36} />
            </div>
            <h3 className="text-[20px] font-bold text-tk-text mb-2">No Team Members Found</h3>
            <p className="text-tk-text-secondary text-[15px] max-w-md leading-relaxed">
              {searchTerm ? "No members match your search criteria." : "You haven't added any team members yet. Invite your staff to collaborate."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-6 px-5 py-2 bg-tk-bg-surface border border-tk-border text-tk-text text-sm font-semibold rounded-full hover:bg-tk-bg-hover transition-colors shadow-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-5 px-6 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] border-b border-[#E2E8F0] dark:border-tk-border bg-tk-bg-surface/50">Team Member</th>
                    <th className="py-5 px-6 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] border-b border-[#E2E8F0] dark:border-tk-border bg-tk-bg-surface/50">Role</th>
                    <th className="py-5 px-6 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] border-b border-[#E2E8F0] dark:border-tk-border bg-tk-bg-surface/50">Status</th>
                    <th className="py-5 px-6 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] border-b border-[#E2E8F0] dark:border-tk-border bg-tk-bg-surface/50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-[#E2E8F0] dark:border-tk-border hover:bg-tk-bg-surface/50 transition-colors last:border-0 group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_4px_10px_rgba(139,58,30,0.2)] flex items-center justify-center font-extrabold text-[15px] shrink-0 transform group-hover:scale-105 transition-transform duration-300">
                            {member.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-tk-text text-[15px]">{member.profiles?.name || 'Unknown'}</span>
                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-tk-text-secondary mt-0.5">
                              <Mail size={13} className="opacity-70" />
                              {member.profiles?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider ${
                          member.role === 'admin' 
                            ? 'bg-[#E9D8FD] text-[#44337A] border border-[#D6BCFA]' 
                            : 'bg-[#BEE3F8] text-[#2A4365] border border-[#90CDF4]'
                        }`}>
                          <Shield size={13} />
                          {member.role === 'admin' ? 'Admin' : 'Kitchen'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`relative flex h-2.5 w-2.5`}>
                            {member.active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tk-success opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${member.active ? 'bg-tk-success' : 'bg-tk-text-secondary opacity-40'}`}></span>
                          </span>
                          <span className={`text-[13px] font-bold ${member.active ? 'text-tk-success' : 'text-tk-text-secondary'}`}>
                            {member.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => toggleMemberStatus(member)}
                          className={`px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all duration-200 border shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                            member.active
                              ? 'text-[#E53E3E] bg-[#FFF5F5] border-[#FEB2B2] hover:bg-[#FED7D7]'
                              : 'text-tk-success bg-tk-success-bg border-tk-success/30 hover:bg-tk-success/20'
                          }`}
                        >
                          {member.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View - Hidden on Desktop */}
            <div className="flex flex-col gap-4 sm:hidden p-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="bg-white dark:bg-tk-bg-surface p-5 rounded-[20px] shadow-sm border border-[#E2E8F0] dark:border-tk-border flex flex-col gap-4 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-2 h-full ${member.active ? 'bg-tk-success' : 'bg-gray-300'}`} />
                  <div className="flex items-center gap-4 pr-4">
                    <div className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_4px_10px_rgba(139,58,30,0.2)] flex items-center justify-center font-extrabold text-[15px] shrink-0">
                      {member.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-tk-text text-[15px] truncate">{member.profiles?.name || 'Unknown'}</span>
                      <span className="text-[13px] font-medium text-tk-text-secondary truncate mt-0.5">{member.profiles?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0] dark:border-tk-border">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                      member.role === 'admin' 
                        ? 'bg-[#E9D8FD] text-[#44337A] border border-[#D6BCFA]' 
                        : 'bg-[#BEE3F8] text-[#2A4365] border border-[#90CDF4]'
                    }`}>
                      <Shield size={12} />
                      {member.role === 'admin' ? 'Admin' : 'Kitchen'}
                    </span>

                    <button
                      onClick={() => toggleMemberStatus(member)}
                      className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border shadow-sm ${
                        member.active
                          ? 'text-[#E53E3E] bg-[#FFF5F5] border-[#FEB2B2]'
                          : 'text-tk-success bg-tk-success-bg border-tk-success/30'
                      }`}
                    >
                      {member.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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

            {!adminAuthClient && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3 text-yellow-800">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-[13px] font-bold m-0">Service Role Key is missing. User creation will fail.</p>
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
    </div>
  );
};

export default Team;
