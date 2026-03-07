import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, UserPlus, FilePlus } from 'lucide-react'

export default function QuickCreateDrawer({ isOpen, onClose, activeForm, setActiveForm, onRefresh }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [restaurants, setRestaurants] = useState([])
    const [formData, setFormData] = useState({ email: '', password: '', role: 'customer', restaurantId: '' })
    const [resFormData, setResFormData] = useState({ name: '', contact_email: '', contact_address: '', contact_phone: '' })

    const roleOptions = [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'restaurant_admin', label: 'Restaurant Admin' },
        { value: 'restaurant_staff', label: 'Restaurant Staff' },
        { value: 'customer', label: 'Customer' }
    ]

    useEffect(() => {
        if (isOpen) {
            fetchRestaurants()
        }
    }, [isOpen])

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
            onRefresh && onRefresh()
            onClose()
        } catch (err) {
            setError('Failed to create user: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRestaurant = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

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

            if (error) throw error

            setResFormData({ name: '', contact_email: '', contact_address: '', contact_phone: '' })
            onRefresh && onRefresh()
            onClose()
        } catch (err) {
            setError('Failed to create restaurant: ' + err.message)
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
                        <h3>{activeForm === 'user' ? 'Add New User' : 'Create Restaurant'}</h3>
                    </div>
                    <button className="btn-close-drawer" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="drawer-content">
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

                    <form onSubmit={activeForm === 'user' ? handleCreateUser : handleCreateRestaurant} className="admin-form">
                        {activeForm === 'user' ? (
                            <>
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
                            </>
                        ) : (
                            <>
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
                            </>
                        )}

                        {error && (
                            <div className="error-alert-modern" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="primary" style={{ marginTop: '1rem', width: '100%', height: '48px' }} disabled={loading}>
                            {loading ? (
                                <div className="loader" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
                            ) : (
                                <>
                                    {activeForm === 'user' ? <UserPlus size={18} /> : <FilePlus size={18} />}
                                    {activeForm === 'user' ? 'Add User Account' : 'Register Restaurant'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
