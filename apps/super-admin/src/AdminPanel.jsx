import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { Filter, SlidersHorizontal, Search, RefreshCw, MoreVertical, Edit2, Trash2, Store, ArrowUpDown, ArrowUp, ArrowDown, X, Download, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from './components/ui/Card'
import { TableRowsSkeleton } from './components/ui/Skeleton'

export default function AdminPanel({ activeForm, setActiveForm, setSyncAction }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false)

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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * perPage, safePage * perPage);

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

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
        + "Name,Email,Role,Restaurant,Joined\n"
        + filteredUsers.map(u => `${u.name || 'Anonymous User'},${u.email},${roleOptions.find(r => r.value === u.role)?.label || u.role},${u.restaurant_users?.[0]?.restaurants?.name || 'Unassigned'},${new Date(u.created_at).toLocaleDateString()}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 w-full">
      {/* List Control */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
        {/* Search Box */}
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        {/* Inline Active Filters (Scrollable horizontally if needed) */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
          {(searchQuery || filterRole !== 'all' || sortBy !== 'newest') ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {filterRole !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {roleOptions.find(r => r.value === filterRole)?.label || filterRole}
                  <button onClick={() => setFilterRole('all')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {sortBy === 'oldest' ? 'Oldest' : sortBy === 'name' ? 'A-Z' : sortBy === 'role' ? 'Role' : sortBy}
                  <button onClick={() => setSortBy('newest')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              <button 
                onClick={() => { setSearchQuery(''); setFilterRole('all'); setSortBy('newest'); setPage(1); }}
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

        {/* Per-page & Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
            {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <div className="relative group flex-1 md:flex-none">
            <button 
              onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
            >
              <Filter size={14} className="text-accent-primary" /> Role
            </button>
            <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${
              isRoleFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
            }`}>
              {roleOptions.map(option => (
                <button key={option.value} onClick={() => { setFilterRole(option.value); setIsRoleFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterRole === option.value ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                  {option.label}
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

      {/* Users Table */}
      <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Desktop View Table */}
        <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap table-fixed">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[30%]" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-2">
                  User {getSortIcon('name')}
                </div>
              </th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[25%]">Email</th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[15%]" onClick={() => toggleSort('role')}>
                <div className="flex items-center gap-2">
                  Role {getSortIcon('role')}
                </div>
              </th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]">Restaurant</th>
              <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[10%]" onClick={() => toggleSort('newest')}>
                <div className="flex items-center gap-2">
                  Joined {getSortIcon('newest')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableRowsSkeleton rows={perPage} columns={5} />
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-text-muted text-[13px]">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              <>
                {pagedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors"
                    onClick={(e) => navigate(`/users/${user.id}`, { state: { name: user.name || 'Anonymous User' } })}
                  >
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-main text-[13px] truncate group-hover:text-accent-primary transition-colors max-w-[200px]" title={user.name || 'Anonymous User'}>{user.name || 'Anonymous User'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-2 text-[12px] text-text-main">
                        <Mail size={12} className="text-blue-500 shrink-0" />
                        <span className="max-w-[200px] inline-block truncate" title={user.email}>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <span className={`text-[12px] font-bold ${user.role === 'super_admin' ? 'text-green-600' : user.role === 'restaurant_admin' ? 'text-violet-600' : user.role === 'restaurant_staff' ? 'text-blue-600' : 'text-text-muted'}`}>
                        {(roleOptions.find(r => r.value === user.role)?.label || user.role).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      {['restaurant_admin', 'restaurant_staff'].includes(user.role) ? (
                        <div className="flex items-center gap-2 text-[12px]">
                          <Store size={14} className="opacity-60 shrink-0 text-accent-primary" />
                          <span className="font-medium text-text-main truncate max-w-[220px]" title={user.restaurant_users?.[0]?.restaurants?.name || 'Unassigned'}>
                            {user.restaurant_users?.[0]?.restaurants?.name || 'Unassigned'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-[12px] opacity-60">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <span className="text-text-muted text-[12px] font-medium">
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
                {perPage - pagedUsers.length > 0 && Array.from({ length: perPage - pagedUsers.length }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="border-b border-border/40 last:border-b-0 opacity-0 pointer-events-none">
                    <td colSpan="5" className="py-2.5 px-4 align-middle">
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-text-muted text-[13px]">
              No users found matching your criteria.
            </div>
          ) : (
            pagedUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => navigate(`/users/${user.id}`, { state: { name: user.name || 'Anonymous User' } })}
                className="p-4 hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors flex flex-col gap-2.5 active:bg-surface-hover/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-[12px] shrink-0">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-text-main text-[13px] truncate" title={user.name || 'Anonymous User'}>
                      {user.name || 'Anonymous User'}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded bg-surface-hover border border-border/40 ${user.role === 'super_admin' ? 'text-green-600' : user.role === 'restaurant_admin' ? 'text-violet-600' : user.role === 'restaurant_staff' ? 'text-blue-600' : 'text-text-muted'}`}>
                    {(roleOptions.find(r => r.value === user.role)?.label || user.role).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 pl-11">
                  <div className="flex items-center gap-2 text-[12px] text-text-main">
                    <Mail size={12} className="text-blue-500 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {['restaurant_admin', 'restaurant_staff'].includes(user.role) && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <Store size={12} className="opacity-60 shrink-0 text-accent-primary" />
                      <span className="font-medium text-text-main truncate">
                        {user.restaurant_users?.[0]?.restaurants?.name || 'Unassigned'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-text-muted mt-1 pt-1.5 border-t border-border/20">
                    <span>Joined</span>
                    <span className="font-medium text-text-main">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
