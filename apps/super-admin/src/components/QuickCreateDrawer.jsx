import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, UserPlus, FilePlus, Eye, EyeOff } from 'lucide-react'

export default function QuickCreateDrawer({ isOpen, onClose, activeForm, setActiveForm, editingData, onRefresh }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [restaurants, setRestaurants] = useState([])
    const [formData, setFormData] = useState({ email: '', password: '', role: 'customer', restaurantId: '' })
    const [resFormData, setResFormData] = useState({ name: '', contact_email: '', contact_address: '', contact_phone: '', admin_password: 'Tablekard@123' })
    const [wasEditing, setWasEditing] = useState(false)
    const [showPassword, setShowPassword] = useState(true)

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
                        contact_email: editingData.contact_email || '',
                        contact_address: editingData.contact_address || '',
                        contact_phone: editingData.contact_phone || '',
                        admin_password: ''
                    })
                }
            } else {
                if (wasEditing) {
                    setFormData({ email: '', password: '', role: 'customer', restaurantId: '' })
                    setResFormData({ name: '', contact_email: '', contact_address: '', contact_phone: '', admin_password: 'Tablekard@123' })
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

        try {
            if (editingData) {
                const { error } = await supabase
                    .from('restaurants')
                    .update({
                        name: resFormData.name.trim(),
                        contact_email: resFormData.contact_email.trim().toLowerCase(),
                        contact_address: resFormData.contact_address.trim(),
                        contact_phone: resFormData.contact_phone.trim(),
                    })
                    .eq('id', editingData.id)
                if (error) throw error
            } else {
                let authData = null
                
                // Create Admin Account FIRST to check for existing email
                if (resFormData.admin_password) {
                    const { data, error: authError } = await supabase.auth.admin.createUser({
                        email: resFormData.contact_email.trim().toLowerCase(),
                        password: resFormData.admin_password,
                        email_confirm: true
                    })
                    
                    if (authError) {
                        throw new Error(`Admin account failed: ${authError.message}. Restaurant not created.`)
                    }
                    authData = data
                }

                // If auth creation succeeded (or wasn't requested), create the restaurant
                const { data: newRes, error: resError } = await supabase
                    .from('restaurants')
                    .insert([
                        {
                            name: resFormData.name.trim(),
                            contact_email: resFormData.contact_email.trim().toLowerCase(),
                            contact_address: resFormData.contact_address.trim(),
                            contact_phone: resFormData.contact_phone.trim(),
                            status: 'pending'
                        }
                    ])
                    .select()
                    .single()
                
                if (resError) {
                    // Rollback auth user if restaurant creation fails
                    if (authData) {
                        await supabase.auth.admin.deleteUser(authData.user.id)
                    }
                    throw resError
                }

                if (authData) {
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
                setResFormData({ name: '', contact_email: '', contact_address: '', contact_phone: '', admin_password: 'Tablekard@123' })
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
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-screen w-full max-w-[450px] bg-bg z-[1001] transition-transform duration-500 shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {activeForm === 'user' ? <UserPlus size={20} className="text-accent-primary" /> : <FilePlus size={20} className="text-accent-primary" />}
                        <h3 className="text-lg font-semibold m-0">{editingData ? 'Update' : (activeForm === 'user' ? 'Add New User' : 'Create Restaurant')}</h3>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted transition-all hover:bg-border hover:text-text-main hover:rotate-90 border-none cursor-pointer" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                    <div className="flex bg-surface-hover p-1 rounded-lg mb-8 border border-border">
                        <button
                            className={`flex-1 p-2 rounded text-sm font-semibold transition-all border-none cursor-pointer ${activeForm === 'restaurant' ? 'bg-accent-primary text-white shadow-sm' : 'bg-transparent text-text-muted hover:bg-surface hover:text-text-main'}`}
                            onClick={() => setActiveForm('restaurant')}
                        >
                            Restaurant
                        </button>
                        <button
                            className={`flex-1 p-2 rounded text-sm font-semibold transition-all border-none cursor-pointer ${activeForm === 'user' ? 'bg-accent-primary text-white shadow-sm' : 'bg-transparent text-text-muted hover:bg-surface hover:text-text-main'}`}
                            onClick={() => setActiveForm('user')}
                        >
                            User Account
                        </button>
                    </div>

                    <form onSubmit={activeForm === 'user' ? handleCreateUser : handleCreateRestaurant} className="flex-1 flex flex-col gap-5">
                        {activeForm === 'user' ? (
                            <>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="rahul@example.in"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Email Address</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder={editingData ? "Leave empty to keep current" : "Min 6 characters"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingData}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Password</label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                                    >
                                        {roleOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary">System Role</label>
                                </div>

                                {['restaurant_admin', 'restaurant_staff'].includes(formData.role) && (
                                    <div className="relative">
                                        <select
                                            value={formData.restaurantId}
                                            onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                                            required
                                            className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                                        >
                                            <option value="">Select Restaurant</option>
                                            {restaurants.map(res => (
                                                <option key={res.id} value={res.id}>{res.name}</option>
                                            ))}
                                        </select>
                                        <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary pointer-events-none">Restaurant Assignment</label>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="The Bombay Spice"
                                        value={resFormData.name}
                                        onChange={(e) => setResFormData({ ...resFormData, name: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Restaurant Name</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="manager@bombayspice.in"
                                        value={resFormData.contact_email}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_email: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Admin Email</label>
                                </div>
                                {!editingData && (
                                    <div className="relative">
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Set login password"
                                                value={resFormData.admin_password}
                                                onChange={(e) => setResFormData({ ...resFormData, admin_password: e.target.value })}
                                                required={!editingData}
                                                className="peer w-full bg-surface-hover border border-border rounded-xl px-4 pr-10 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                            />
                                            <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Admin Password</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer p-1.5 flex hover:text-text-main transition-colors z-20"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="MG Road, Bangalore"
                                        value={resFormData.contact_address}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_address: e.target.value })}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Address</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="+91 98765 43210"
                                        value={resFormData.contact_phone}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_phone: e.target.value })}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Phone Number</label>
                                </div>
                            </>
                        )}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-4 mb-2">
                                {error}
                            </div>
                        )}

                        <button type="submit" className="mt-auto w-full h-12 flex items-center justify-center gap-2 bg-accent-primary text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(5,150,105,0.15)] hover:shadow-[0_6px_25px_rgba(5,150,105,0.25)] transition-all border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
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
