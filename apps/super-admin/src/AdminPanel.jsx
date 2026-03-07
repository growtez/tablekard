import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './AdminPanel.css'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeForm, setActiveForm] = useState('user') // 'user' or 'restaurant'
  const [formData, setFormData] = useState({ email: '', password: '', role: 'customer', restaurantId: '' })
  const [resFormData, setResFormData] = useState({ name: '', contact_email: '', contact_address: '', contact_phone: '' })
  const [editingUser, setEditingUser] = useState(null)

  const roleOptions = [
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
        .select('*')
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
      // In a real app, you'd use the Edge Function for this to handle roles correctly
      // But we'll follow the existing logic which seems to use auth.admin
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

    // Generate slug from name
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
            status: 'active' // Set default status to active for super admin creation
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

  return (
    <div className="admin-panel">
      {/* Sidebar: Creation Form */}
      <aside className="form-sidebar">
        <div className="form-toggle-group">
          <button
            className={`toggle-btn ${activeForm === 'user' ? 'active' : ''}`}
            onClick={() => setActiveForm('user')}
          >
            User
          </button>
          <button
            className={`toggle-btn ${activeForm === 'restaurant' ? 'active' : ''}`}
            onClick={() => setActiveForm('restaurant')}
          >
            Restaurant
          </button>
        </div>

        <div className="premium-card">
          {activeForm === 'user' ? (
            <>
              <h3>Create New User</h3>
              <form onSubmit={handleCreateUser} className="admin-form">
                <div className="form-group-modern">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label>System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {['restaurant_admin', 'restaurant_staff'].includes(formData.role) && (
                  <div className="form-group-modern">
                    <label>Restaurant Assignment</label>
                    <select
                      value={formData.restaurantId}
                      onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                      required
                    >
                      <option value="">Select Restaurant</option>
                      {restaurants.map(res => (
                        <option key={res.id} value={res.id}>{res.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="primary" style={{ marginTop: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Create User
                </button>
              </form>
            </>
          ) : (
            <>
              <h3>Create Restaurant</h3>
              <form onSubmit={handleCreateRestaurant} className="admin-form">
                <div className="form-group-modern">
                  <label>Restaurant Name</label>
                  <input
                    type="text"
                    placeholder="The Gourmet Kitchen"
                    value={resFormData.name}
                    onChange={(e) => setResFormData({ ...resFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    placeholder="manager@restaurant.com"
                    value={resFormData.contact_email}
                    onChange={(e) => setResFormData({ ...resFormData, contact_email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label>Address</label>
                  <input
                    type="text"
                    placeholder="123 Street, City"
                    value={resFormData.contact_address}
                    onChange={(e) => setResFormData({ ...resFormData, contact_address: e.target.value })}
                  />
                </div>
                <div className="form-group-modern">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 234 567 890"
                    value={resFormData.contact_phone}
                    onChange={(e) => setResFormData({ ...resFormData, contact_phone: e.target.value })}
                  />
                </div>

                <button type="submit" className="primary" style={{ marginTop: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  Add Restaurant
                </button>
              </form>
            </>
          )}
        </div>

        {error && (
          <div className="error-alert-modern" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
            {error}
          </div>
        )}
      </aside>

      {/* Main Content: Users Table */}
      <section className="users-section">
        <div className="section-header">
          <div className="section-title">
            <h2>User Management</h2>
            <span className="count-badge">{users.length} Users</span>
          </div>
          <button onClick={fetchUsers} className="btn-refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
            Sync
          </button>
        </div>

        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>User / Identity</th>
                <th>Access Level</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loader" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Retrieving user directory...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No users found in the system.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
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
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="action-trigger">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                      </button>
                      <div className="actions-menu">
                        <button
                          className="action-btn edit"
                          onClick={() => setEditingUser(user)}
                          title="Edit Access"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="editing-overlay">
          <div className="editing-modal animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Update Access Level</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Changing role for <strong>{editingUser.email}</strong></p>

            <form onSubmit={handleUpdateUser} className="admin-form">
              <div className="form-group-modern">
                <label>Select New Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  required
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>Update Access</button>
                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
