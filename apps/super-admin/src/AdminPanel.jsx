import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { Filter, SlidersHorizontal, Search, RefreshCw, MoreVertical, Edit2, Trash2, Store, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card } from './components/ui/Card'
import './AdminPanel.css'

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
    <div className="admin-panel full-width">
      {/* Main Content: Users Table */}
      <section className="users-section">
        <Card style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="dropdown-wrapper">
                <button className={`btn-ghost ${filterRole !== 'all' ? 'active-filter' : ''}`} style={{ padding: '10px 16px', borderRadius: '12px', background: filterRole !== 'all' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filterRole !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '8px', fontSize: '0.9rem', color: filterRole !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Filter size={18} />
                  {filterRole === 'all' ? 'Filter' : `Role: ${roleOptions.find(r => r.value === filterRole)?.label}`}
                </button>
                <div className="dropdown-content">
                  {roleOptions.map(option => (
                    <button key={option.value} onClick={() => setFilterRole(option.value)} className={filterRole === option.value ? 'active' : ''}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dropdown-wrapper">
                <button className="btn-ghost" style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <SlidersHorizontal size={18} />
                  {sortBy === 'newest' ? 'Sort By' : `Sorted: ${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`}
                </button>
                <div className="dropdown-content">
                  <button onClick={() => setSortBy('newest')} className={sortBy === 'newest' ? 'active' : ''}>Newest First</button>
                  <button onClick={() => setSortBy('oldest')} className={sortBy === 'oldest' ? 'active' : ''}>Oldest First</button>
                  <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'active' : ''}>User Name (A-Z)</button>
                  <button onClick={() => setSortBy('role')} className={sortBy === 'role' ? 'active' : ''}>Access Level</button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">
                    User / Identity {getSortIcon('name')}
                  </div>
                </th>
                <th className="sortable-header" onClick={() => toggleSort('role')}>
                  <div className="flex items-center gap-2">
                    Access Level {getSortIcon('role')}
                  </div>
                </th>
                <th>Restaurant</th>
                <th className="sortable-header" onClick={() => toggleSort('newest')}>
                  <div className="flex items-center gap-2">
                    Joined {getSortIcon('newest')}
                  </div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loader" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Retrieving user directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="clickable-row"
                    onClick={(e) => {
                      // Don't navigate if clicking action buttons or the menu or if it's protected
                      if (e.target.closest('.actions-cell') || e.target.closest('.action-trigger') || e.target.closest('.actions-menu')) {
                        return;
                      }
                      navigate(`/users/${user.id}`);
                    }}
                  >
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="user-info-text">
                          <span className="user-name">{user.name || 'Anonymous User'}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td>
                      {['restaurant_admin', 'restaurant_staff'].includes(user.role) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <Store size={14} style={{ opacity: 0.6 }} />
                          <span style={{ fontWeight: 500 }}>{user.restaurant_users?.[0]?.restaurants?.name || 'Unassigned'}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {user.role === 'super_admin' ? (
                        <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5 }} title="Protected System Account">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                      ) : (
                        <>
                          <button className="action-trigger">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                          </button>
                          <div className="actions-menu">
                            <button
                              className="action-btn edit"
                              onClick={() => navigate(`/users/${user.id}`, { state: { edit: true } })}
                              title="View Profile Details"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </button>
                          </div>
                        </>
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
