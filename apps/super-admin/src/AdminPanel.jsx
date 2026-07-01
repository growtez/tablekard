import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { Filter, SlidersHorizontal, Search, RefreshCw, MoreVertical, Edit2, Trash2, Store, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card } from './components/ui/Card'

export default function AdminPanel({ activeForm, setActiveForm, setSyncAction }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (setSyncAction) {
      setSyncAction({
        onSync: fetchUsers,
        loading: loading
      });
    }
  }, [loading, setSyncAction]);

  const [formData, setFormData] = useState({ email: '', password: '', role: 'customer', restaurantId: '' })
  const [resFormData, setResFormData] = useState({ name: '', contact_email: '', contact_address: '', contact_phone: '' })
  const [editingUser, setEditingUser] = useState(null)

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'restaurant_admin', label: 'Restaurant Admin' },
    { value: 'restaurant_staff', label: 'Restaurant Staff' },
    { value: 'customer', label: 'Customer' }
  ]

  useEffect(() => {
    fetchUsers()
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name')
      if (error) throw error
      setRestaurants(data || [])
    } catch (err) {
      console.error('Failed to fetch restaurants:', err)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          restaurant_users (
            role,
            restaurants (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError('Failed to fetch users: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required')
      return
    }

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        email_confirm: true
      })
      if (error) throw error

      await supabase
        .from('profiles')
        .update({ role: formData.role })
        .eq('id', data.user.id)

      if (['restaurant_admin', 'restaurant_staff'].includes(formData.role)) {
        const restaurantRole = formData.role === 'restaurant_admin' ? 'admin' : 'staff'
        await supabase
          .from('restaurant_users')
          .insert({
            restaurant_id: formData.restaurantId,
            profile_id: data.user.id,
            role: restaurantRole,
            active: true
          })
      }

      setFormData({ email: '', password: '', role: 'customer', restaurantId: '' })
      fetchUsers()
      alert('User created successfully')
    } catch (err) {
      setError('Failed to create user: ' + err.message)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      setUsers(users.filter(u => u.id !== userId))
    } catch (err) {
      setError('Failed to delete user: ' + err.message)
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: editingUser.role })
        .eq('id', editingUser.id)
      if (error) throw error
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
      setEditingUser(null)
    } catch (err) {
      setError('Failed to update user: ' + err.message)
    }
  }

  const handleCreateRestaurant = async (e) => {
    e.preventDefault()
    setError(null)

    if (!resFormData.name.trim() || !resFormData.contact_email.trim()) {
      setError('Name and Contact Email are required')
      return
    }

    const slug = resFormData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert([
          {
            name: resFormData.name.trim(),
            slug: slug,
            contact_email: resFormData.contact_email.trim(),
            contact_address: resFormData.contact_address.trim(),
            contact_phone: resFormData.contact_phone.trim(),
            status: 'active'
          }
        ])
        .select()

      if (error) throw error

      setResFormData({ name: '', contact_email: '', contact_address: '', contact_phone: '' })
      fetchRestaurants()
      alert('Restaurant created successfully')
    } catch (err) {
      setError('Failed to create restaurant: ' + err.message)
    }
  }

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterRole === 'all' || user.role === filterRole;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
      return 0;
    });

  const toggleSort = (newSort) => {
    if (sortBy === newSort) {
      setSortBy(newSort === 'newest' ? 'oldest' : 'newest');
    } else {
      setSortBy(newSort);
    }
  };

  const getSortIcon = (field) => {
    if (sortBy === field) return <ArrowUp size={14} />;
    if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
    return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
  };

  return (
    <div className="w-full">
      {/* Main Content: Users Table */}
      <section className="flex flex-col">
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-9 pr-3 bg-surface-hover border border-border rounded-xl text-text-main text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative group/dropdown flex-1 md:flex-none">
                <button className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all ${filterRole !== 'all' ? 'bg-blue-500/10 border-accent-primary text-accent-primary shadow-[0_0_0_2px_rgba(59,130,246,0.2)] animate-pulse' : 'bg-surface-hover border-border text-text-muted hover:bg-border'}`}>
                  <Filter size={18} />
                  <span className="truncate">{filterRole === 'all' ? 'Filter' : `Role: ${roleOptions.find(r => r.value === filterRole)?.label}`}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 bg-surface/90 backdrop-blur-md border border-border rounded-xl shadow-lg min-w-[180px] opacity-0 invisible translate-y-2 group-hover/dropdown:opacity-100 group-hover/dropdown:visible group-hover/dropdown:translate-y-0 transition-all z-50 overflow-hidden flex flex-col">
                  {roleOptions.map(option => (
                    <button key={option.value} onClick={() => setFilterRole(option.value)} className={`w-full text-left px-4 py-3 text-sm font-medium transition-all hover:bg-surface-hover hover:text-accent-primary hover:pl-5 ${filterRole === option.value ? 'bg-blue-500/10 text-accent-primary font-semibold' : 'text-text-muted'}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group/dropdown flex-1 md:flex-none">
                <button className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover border border-border text-sm text-text-muted hover:bg-border transition-all">
                  <SlidersHorizontal size={18} />
                  <span className="truncate">{sortBy === 'newest' ? 'Sort By' : `Sorted: ${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 bg-surface/90 backdrop-blur-md border border-border rounded-xl shadow-lg min-w-[180px] opacity-0 invisible translate-y-2 group-hover/dropdown:opacity-100 group-hover/dropdown:visible group-hover/dropdown:translate-y-0 transition-all z-50 overflow-hidden flex flex-col">
                  <button onClick={() => setSortBy('newest')} className={`w-full text-left px-4 py-3 text-sm font-medium transition-all hover:bg-surface-hover hover:text-accent-primary hover:pl-5 ${sortBy === 'newest' ? 'bg-blue-500/10 text-accent-primary font-semibold' : 'text-text-muted'}`}>Newest First</button>
                  <button onClick={() => setSortBy('oldest')} className={`w-full text-left px-4 py-3 text-sm font-medium transition-all hover:bg-surface-hover hover:text-accent-primary hover:pl-5 ${sortBy === 'oldest' ? 'bg-blue-500/10 text-accent-primary font-semibold' : 'text-text-muted'}`}>Oldest First</button>
                  <button onClick={() => setSortBy('name')} className={`w-full text-left px-4 py-3 text-sm font-medium transition-all hover:bg-surface-hover hover:text-accent-primary hover:pl-5 ${sortBy === 'name' ? 'bg-blue-500/10 text-accent-primary font-semibold' : 'text-text-muted'}`}>User Name (A-Z)</button>
                  <button onClick={() => setSortBy('role')} className={`w-full text-left px-4 py-3 text-sm font-medium transition-all hover:bg-surface-hover hover:text-accent-primary hover:pl-5 ${sortBy === 'role' ? 'bg-blue-500/10 text-accent-primary font-semibold' : 'text-text-muted'}`}>Access Level</button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-surface border border-border rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full border-collapse text-left whitespace-nowrap md:whitespace-normal">
            <thead>
              <tr>
                <th className="bg-surface-hover py-4 px-4 md:px-6 text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border cursor-pointer hover:bg-border transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">
                    User / Identity {getSortIcon('name')}
                  </div>
                </th>
                <th className="bg-surface-hover py-4 px-4 md:px-6 text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border cursor-pointer hover:bg-border transition-colors" onClick={() => toggleSort('role')}>
                  <div className="flex items-center gap-2">
                    Access Level {getSortIcon('role')}
                  </div>
                </th>
                <th className="bg-surface-hover py-4 px-4 md:px-6 text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border">Restaurant</th>
                <th className="bg-surface-hover py-4 px-4 md:px-6 text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border cursor-pointer hover:bg-border transition-colors" onClick={() => toggleSort('newest')}>
                  <div className="flex items-center gap-2">
                    Joined {getSortIcon('newest')}
                  </div>
                </th>
                <th className="bg-surface-hover py-4 px-4 md:px-6 text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <div className="w-8 h-8 border-4 border-surface-hover border-t-accent-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-muted">Retrieving user directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-text-muted">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group/row cursor-pointer hover:bg-surface-hover transition-colors border-b border-border last:border-b-0"
                    onClick={(e) => {
                      // Don't navigate if clicking action buttons or the menu or if it's protected
                      if (e.target.closest('.actions-cell') || e.target.closest('.action-trigger') || e.target.closest('.actions-menu')) {
                        return;
                      }
                      navigate(`/users/${user.id}`);
                    }}
                  >
                    <td className="py-4 px-4 md:px-6 align-middle max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-secondary to-purple-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-main truncate group-hover/row:text-accent-primary transition-colors">{user.name || 'Anonymous User'}</span>
                          <span className="text-xs text-text-muted truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6 align-middle">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${user.role === 'super_admin' ? 'bg-emerald-500/10 text-emerald-600' : user.role === 'restaurant_admin' ? 'bg-violet-500/10 text-violet-600' : user.role === 'restaurant_staff' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-500/10 text-slate-600'}`}>
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 md:px-6 align-middle">
                      {['restaurant_admin', 'restaurant_staff'].includes(user.role) ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Store size={14} className="opacity-60 shrink-0" />
                          <span className="font-medium truncate max-w-[120px] sm:max-w-[180px] md:max-w-[250px]">{user.restaurant_users?.[0]?.restaurants?.name || 'Unassigned'}</span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 md:px-6 align-middle">
                      <span className="text-text-muted text-sm">
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-4 px-4 md:px-6 align-middle actions-cell relative w-[60px]">
                      {user.role === 'super_admin' ? (
                        <div className="w-9 h-9 flex items-center justify-center text-text-muted opacity-50" title="Protected System Account">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button className="action-trigger w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:bg-border hover:text-text-main transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                          </button>
                          <div className="actions-menu absolute right-6 top-1/2 -translate-y-1/2 scale-90 opacity-0 pointer-events-none flex gap-2 bg-surface p-2 rounded-lg border border-border shadow-md z-10 transition-all group-hover/row:opacity-100 group-hover/row:pointer-events-auto group-hover/row:scale-100 group-hover/row:right-[4.5rem]">
                            <button
                              className="w-8 h-8 rounded flex items-center justify-center transition-colors text-accent-primary hover:bg-accent-primary hover:text-white"
                              onClick={() => navigate(`/users/${user.id}`, { state: { edit: true } })}
                              title="View Profile Details"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button
                              className="w-8 h-8 rounded flex items-center justify-center transition-colors text-red-400 hover:bg-red-500 hover:text-white"
                              onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                              title="Delete User"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
