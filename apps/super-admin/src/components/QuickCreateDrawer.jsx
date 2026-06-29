import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, UserPlus, FilePlus, Eye, EyeOff } from 'lucide-react'

export default function QuickCreateDrawer({ isOpen, onClose, activeForm, setActiveForm, editingData, onRefresh }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [restaurants, setRestaurants] = useState([])
    const [formData, setFormData] = useState({ email: '', password: '', role: 'customer', restaurantId: '' })
    const [resFormData, setResFormData] = useState({ name: '', slug: '', contact_email: '', contact_address: '', contact_phone: '', admin_password: '' })
    const [wasEditing, setWasEditing] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const roleOptions = [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'restaurant_admin', label: 'Restaurant Admin' },
        { value: 'restaurant_staff', label: 'Restaurant Staff' },
        { value: 'customer', label: 'Customer' }
    ]

    useEffect(() => {
        if (isOpen) {
            fetchRestaurants()
            if (editingData) {
                setWasEditing(true)
                if (activeForm === 'user') {
                    setFormData({
                        email: editingData.email || '',
                        password: '', // Hidden for security, only changed if provided
                        role: editingData.role || 'customer',
                        restaurantId: '' // Would need more lookup for relations
                    })
                } else {
                    setResFormData({
                        name: editingData.name || '',
                        slug: editingData.slug || '',
                        contact_email: editingData.contact_email || '',
                        contact_address: editingData.contact_address || '',
                        contact_phone: editingData.contact_phone || '',
                        admin_password: ''
                    })
                }
            } else {
                if (wasEditing) {
                    setFormData({ email: '', password: '', role: 'customer', restaurantId: '' })
                    setResFormData({ name: '', slug: '', contact_email: '', contact_address: '', contact_phone: '', admin_password: '' })
                    setWasEditing(false)
                }
            }
        }
    }, [isOpen, editingData, activeForm])

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

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (editingData) {
                // Update Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ role: formData.role })
                    .eq('id', editingData.id)
                if (profileError) throw profileError
            } else {
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
            }

            onRefresh && onRefresh()
            if (!editingData) {
                setFormData({ email: '', password: '', role: 'customer', restaurantId: '' })
            }
            onClose()
        } catch (err) {
            setError(`Failed to ${editingData ? 'update' : 'create'} user: ` + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRestaurant = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const slug = resFormData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')

        try {
            if (editingData) {
                const { error } = await supabase
                    .from('restaurants')
                    .update({
                        name: resFormData.name.trim(),
                        slug: slug,
                        contact_email: resFormData.contact_email.trim(),
                        contact_address: resFormData.contact_address.trim(),
                        contact_phone: resFormData.contact_phone.trim(),
                    })
                    .eq('id', editingData.id)
                if (error) throw error
            } else {
                const { data: newRes, error: resError } = await supabase
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
                    .single()
                
                if (resError) throw resError

                // Create Admin Account automatically
                if (resFormData.admin_password) {
                    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                        email: resFormData.contact_email.trim().toLowerCase(),
                        password: resFormData.admin_password,
                        email_confirm: true
                    })
                    
                    if (authError) throw new Error(`Restaurant created, but admin account failed: ${authError.message}`)

                    // Update Profile Role
                    await supabase
                        .from('profiles')
                        .update({ role: 'restaurant_admin' })
                        .eq('id', authData.user.id)

                    // Link to Restaurant
                    await supabase
                        .from('restaurant_users')
                        .insert({
                            restaurant_id: newRes.id,
                            profile_id: authData.user.id,
                            role: 'admin',
                            active: true
                        })
                }
            }

            onRefresh && onRefresh()
            if (!editingData) {
                setResFormData({ name: '', slug: '', contact_email: '', contact_address: '', contact_phone: '', admin_password: '' })
            }
            onClose()
        } catch (err) {
            setError(`Failed to ${editingData ? 'update' : 'create'} restaurant: ` + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`drawer-container ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {activeForm === 'user' ? <UserPlus size={20} className="text-primary" /> : <FilePlus size={20} className="text-primary" />}
                        <h3>{editingData ? 'Update' : (activeForm === 'user' ? 'Add New User' : 'Create Restaurant')}</h3>
                    </div>
                    <button className="btn-close-drawer" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="form-toggle-group" style={{ marginBottom: '2rem' }}>
                        <button
                            className={`toggle-btn ${activeForm === 'user' ? 'active' : ''}`}
                            onClick={() => setActiveForm('user')}
                            style={{ flex: 1 }}
                        >
                            User Account
                        </button>
                        <button
                            className={`toggle-btn ${activeForm === 'restaurant' ? 'active' : ''}`}
                            onClick={() => setActiveForm('restaurant')}
                            style={{ flex: 1 }}
                        >
                            Restaurant
                        </button>
                    </div>

                    <form onSubmit={activeForm === 'user' ? handleCreateUser : handleCreateRestaurant} className="admin-form" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {activeForm === 'user' ? (
                            <>
                                <div className="form-group-modern">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="rahul@example.in"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group-modern">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        placeholder={editingData ? "Leave empty to keep current" : "Min 6 characters"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingData}
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
                            </>
                        ) : (
                            <>
                                <div className="form-group-modern">
                                    <label>Restaurant Name</label>
                                    <input
                                        type="text"
                                        placeholder="The Bombay Spice"
                                        value={resFormData.name}
                                        onChange={(e) => setResFormData({ ...resFormData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group-modern">
                                    <label>Restaurant Slug (URL)</label>
                                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                        <input
                                            type="text"
                                            placeholder="the-bombay-spice"
                                            value={resFormData.slug}
                                            onChange={(e) => setResFormData({ ...resFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            required
                                            style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                        />
                                        <span style={{ 
                                            padding: '0 12px', 
                                            background: 'var(--surface-hover)', 
                                            border: '1px solid var(--border-color)', 
                                            borderLeft: 'none', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            borderTopRightRadius: '8px', 
                                            borderBottomRightRadius: '8px',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.9rem',
                                            whiteSpace: 'nowrap'
                                        }}>.tablekard.com</span>
                                    </div>
                                </div>
                                <div className="form-group-modern">
                                    <label>Contact Email</label>
                                    <input
                                        type="email"
                                        placeholder="manager@bombayspice.in"
                                        value={resFormData.contact_email}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group-modern">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        placeholder="MG Road, Bangalore"
                                        value={resFormData.contact_address}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_address: e.target.value })}
                                    />
                                </div>
                                <div className="form-group-modern">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="+91 98765 43210"
                                        value={resFormData.contact_phone}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_phone: e.target.value })}
                                    />
                                </div>

                                {!editingData && (
                                    <>
                                        <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Admin Login Credentials</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                The contact email <strong>{resFormData.contact_email || 'above'}</strong> will be used as the admin login.
                                            </p>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>Admin Password</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Set login password"
                                                    value={resFormData.admin_password}
                                                    onChange={(e) => setResFormData({ ...resFormData, admin_password: e.target.value })}
                                                    required={!editingData}
                                                    style={{ paddingRight: '40px', width: '100%' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '10px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        display: 'flex'
                                                    }}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {error && (
                            <div className="error-alert-modern" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="primary" style={{ marginTop: 'auto', width: '100%', height: '48px', minHeight: '48px' }} disabled={loading}>
                            {loading ? (
                                <div className="loader" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
                            ) : (
                                <>
                                    {activeForm === 'user' ? <UserPlus size={18} /> : <FilePlus size={18} />}
                                    {editingData ? 'Update Details' : (activeForm === 'user' ? 'Add User Account' : 'Register Restaurant')}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
