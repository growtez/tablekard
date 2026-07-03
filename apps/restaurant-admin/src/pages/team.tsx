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
      <div className="flex-shrink-0 mb-6">
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col">
            <h1 className="text-[22px] font-semibold text-tk-text">Team Management</h1>
            <p className="text-sm text-tk-text-secondary mt-1">Manage restaurant admins and kitchen staff access.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tk-text-secondary" size={16} />
              <input
                type="text"
                placeholder="Search team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-sm focus:outline-none focus:border-tk-burgundy transition-colors w-full sm:w-[240px]"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-tk-burgundy text-white rounded-xl text-sm font-semibold hover:bg-[#721c24] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-[1px]"
            >
              <Plus size={16} />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-tk-bg-surface border border-tk-border rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-tk-text-secondary">
            <Loader2 className="animate-spin text-tk-burgundy" size={32} />
            <p className="text-sm font-medium">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-16 h-16 bg-tk-bg-hover rounded-full flex items-center justify-center mb-4">
              <Users className="text-tk-text-secondary opacity-50" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-tk-text mb-1">No Team Members Found</h3>
            <p className="text-tk-text-secondary text-sm max-w-md">
              {searchTerm ? "No members match your search criteria." : "You haven't added any team members yet. Add admins or kitchen staff to help manage your restaurant."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-tk-bg-hover text-tk-text text-sm font-medium rounded-lg hover:bg-tk-border transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tk-bg-hover/50">
                <th className="py-4 px-6 text-xs font-semibold text-tk-text-secondary uppercase tracking-wider border-b border-tk-border">Member</th>
                <th className="py-4 px-6 text-xs font-semibold text-tk-text-secondary uppercase tracking-wider border-b border-tk-border">Role</th>
                <th className="py-4 px-6 text-xs font-semibold text-tk-text-secondary uppercase tracking-wider border-b border-tk-border">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-tk-text-secondary uppercase tracking-wider border-b border-tk-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-b border-tk-border/50 hover:bg-tk-bg-hover/30 transition-colors last:border-0">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-tk-burgundy/10 flex items-center justify-center text-tk-burgundy font-bold text-sm shrink-0">
                        {member.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-tk-text">{member.profiles?.name || 'Unknown'}</span>
                        <div className="flex items-center gap-1.5 text-xs text-tk-text-secondary mt-0.5">
                          <Mail size={12} />
                          {member.profiles?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      member.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Shield size={12} />
                      {member.role === 'admin' ? 'Restaurant Admin' : 'Kitchen Staff'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      member.active 
                        ? 'bg-[#C6F6D5] text-[#22543D]' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => toggleMemberStatus(member)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        member.active
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {member.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-[fadeIn_0.2s_ease]" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="bg-tk-bg-card rounded-[24px] p-6 max-w-[500px] w-full border-[1.5px] border-tk-border shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-[slideUp_0.3s_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-tk-text flex items-center gap-2">
                <Users size={20} className="text-tk-burgundy" />
                Add Team Member
              </h2>
              <button 
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-2 bg-tk-bg-hover text-tk-text-secondary hover:text-tk-text rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {!adminAuthClient && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 text-yellow-800">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Service Role Key is missing. User creation will fail.</p>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-tk-text">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-sm focus:outline-none focus:border-tk-burgundy transition-colors"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-tk-text">Role</label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-2.5 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-sm focus:outline-none focus:border-tk-burgundy transition-colors appearance-none cursor-pointer"
                    >
                      <option value="staff">Kitchen Staff</option>
                      <option value="admin">Restaurant Admin</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-tk-text-secondary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-tk-text">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="staff@restaurant.com"
                  className="w-full px-4 py-2.5 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-sm focus:outline-none focus:border-tk-burgundy transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-tk-text">Temporary Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 bg-tk-bg-surface border border-tk-border rounded-xl text-tk-text text-sm focus:outline-none focus:border-tk-burgundy transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-tk-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-tk-text-secondary font-semibold hover:bg-tk-bg-hover rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-tk-burgundy text-white font-semibold rounded-xl hover:bg-[#721c24] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:hover:bg-tk-burgundy shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Create Member
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
