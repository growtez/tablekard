import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, User, Mail, Shield, Calendar,
    Clock, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2,
    Hash, Camera, Activity, ShieldCheck, MapPin, ExternalLink, ArrowUpRight,
    Lock, History, Settings, Plus, CreditCard, CheckCircle2, Utensils,
    ShoppingBag, Receipt
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function UserDetail({ setHeaderData, setSyncAction }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [restaurants, setRestaurants] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const [isEditing, setIsEditing] = useState(location.state?.edit || false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    // Refs to handle stale closures in header actions
    const saveRef = useRef();
    const cancelRef = useRef();

    useEffect(() => {
        if (id) {
            fetchInitialData();
        }
        return () => {
            setHeaderData && setHeaderData(null);
            setSyncAction && setSyncAction(null);
        };
    }, [id]);

    useEffect(() => {
        if (setSyncAction && !isEditing) {
            setSyncAction({
                onSync: fetchInitialData,
                loading: loading
            });
        }
    }, [loading, setSyncAction, isEditing]);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([
            fetchUserProfile(),
            fetchRestaurants(),
            fetchUserOrders()
        ]);
        setLoading(false);
    };

    const fetchRestaurants = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('id, name')
                .order('name');
            if (error) throw error;
            setRestaurants(data || []);
        } catch (err) {
            console.error('Failed to fetch restaurants:', err);
        }
    };

    const fetchUserOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    order_number, 
                    total, 
                    status, 
                    payment_status, 
                    created_at,
                    restaurants(name, slug)
                `)
                .eq('customer_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Failed to fetch user orders:', err);
        }
    };

    const fetchUserProfile = async () => {
        setError(null);
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;

            let restaurantId = '';
            if (['restaurant_admin', 'restaurant_staff'].includes(profileData.role)) {
                const { data: resUserData } = await supabase
                    .from('restaurant_users')
                    .select('restaurant_id')
                    .eq('profile_id', id)
                    .maybeSingle();

                if (resUserData) {
                    restaurantId = resUserData.restaurant_id;
                }
            }

            setProfile(profileData);
            setFormData({ ...profileData, restaurant_id: restaurantId });
        } catch (err) {
            setError('Failed to fetch user profile: ' + err.message);
        }
    };

    const handleSave = async () => {
        if (['restaurant_admin', 'restaurant_staff'].includes(formData.role) && !formData.restaurant_id) {
            setError('Please select a restaurant for this member.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    role: formData.role,
                    avatar_url: formData.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (profileError) throw profileError;

            if (['restaurant_admin', 'restaurant_staff'].includes(formData.role)) {
                const restaurantRole = formData.role === 'restaurant_admin' ? 'admin' : 'staff';
                const { data: existing } = await supabase
                    .from('restaurant_users')
                    .select('id')
                    .eq('profile_id', id)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('restaurant_users')
                        .update({
                            restaurant_id: formData.restaurant_id,
                            role: restaurantRole,
                            active: true
                        })
                        .eq('profile_id', id);
                } else {
                    await supabase
                        .from('restaurant_users')
                        .insert({
                            profile_id: id,
                            restaurant_id: formData.restaurant_id,
                            role: restaurantRole,
                            active: true
                        });
                }
            } else {
                await supabase
                    .from('restaurant_users')
                    .delete()
                    .eq('profile_id', id);
            }

            setIsEditing(false);
            fetchUserProfile();
        } catch (err) {
            setError('Failed to save changes: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({ ...profile, restaurant_id: profile.restaurant_id });
        setIsEditing(false);
    };

    useEffect(() => {
        saveRef.current = handleSave;
        cancelRef.current = handleCancel;
    });

    useEffect(() => {
        if (profile && setHeaderData) {
            setHeaderData({
                id: profile.id,
                name: profile.name || profile.email,
                logo_url: profile.avatar_url,
                status: profile.role,
                onEdit: !isEditing ? () => setIsEditing(true) : null,
                isEditing,
                onSave: () => saveRef.current?.(),
                onCancel: () => cancelRef.current?.(),
                saving,
                backPath: '/users',
                backTitle: 'Back to Users'
            });
        }
    }, [profile, setHeaderData, isEditing, saving]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
                <div className="loader" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching user profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'The requested user profile could not be located.'}</p>
                <button onClick={() => navigate('/users')} className="btn-primary">
                    <ChevronLeft size={18} /> Back to Users
                </button>
            </div>
        );
    }

    const renderField = (label, field, type = 'text', options = []) => {
        return (
            <div className="space-y-2">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                {isEditing ? (
                    type === 'select' ? (
                        <select
                            value={formData[field] || ''}
                            onChange={(e) => updateField(field, e.target.value)}
                            className="edit-input"
                        >
                            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                        <input
                            type={type}
                            value={formData[field] || ''}
                            onChange={(e) => updateField(field, e.target.value)}
                            className="edit-input"
                            placeholder={`Enter ${label.toLowerCase()}`}
                        />
                    )
                ) : (
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {field === 'role' ? profile.role?.replace('_', ' ').toUpperCase() : (profile[field] || '—')}
                    </div>
                )}
            </div>
        );
    };

    const ORDER_STATUS_COLORS = {
        completed: '#10b981',
        delivered: '#10b981',
        pending: '#f59e0b',
        cancelled: '#ef4444',
        processing: '#3b82f6'
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'activity', label: 'Order History', icon: ShoppingBag },
                    { id: 'security', label: 'Security & Access', icon: ShieldCheck }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '1rem 0',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                            borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent-primary)' : 'transparent'}`,
                            transition: 'all 0.2s',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Info size={18} color="var(--accent-primary)" />
                                        <CardTitle>Profile Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    {renderField("Full Name", "name")}
                                    {renderField("Email Address", "email", "static")}
                                    {renderField("Access Role", "role", "select", [
                                        { value: 'super_admin', label: 'Super Admin' },
                                        { value: 'restaurant_admin', label: 'Restaurant Admin' },
                                        { value: 'restaurant_staff', label: 'Restaurant Staff' },
                                        { value: 'customer', label: 'Customer' }
                                    ])}
                                    {isEditing && renderField("Avatar URL", "avatar_url")}
                                    {['restaurant_admin', 'restaurant_staff'].includes(formData.role) &&
                                        renderField("Managed Restaurant", "restaurant_id", "select", [
                                            { value: '', label: 'Select a restaurant...' },
                                            ...restaurants.map(r => ({ value: r.id, label: r.name }))
                                        ])
                                    }
                                </div>
                            </Card>

                            {['restaurant_admin', 'restaurant_staff'].includes(profile.role) && !isEditing && (
                                <Card style={{ background: 'linear-gradient(90deg, var(--surface-color) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <Store size={24} color="#10b981" />
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Affiliated Restaurant</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{restaurants.find(r => r.id === formData.restaurant_id)?.name || 'Not Linked'}</div>
                                            </div>
                                        </div>
                                        {formData.restaurant_id && (
                                            <button onClick={() => navigate(`/restaurants/${formData.restaurant_id}`)} className="btn-ghost" style={{ border: '1px solid var(--border-color)' }}>
                                                View <ArrowUpRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>

                        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card>
                                <CardHeader><CardTitle>User Stats</CardTitle></CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{orders.length}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{orders.filter(o => o.status === 'completed' || o.status === 'delivered').length}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Done</div>
                                    </div>
                                </div>
                                <div className="space-y-4" style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Spent Total</span>
                                        <span style={{ fontWeight: 700 }}>₹{orders.filter(o => o.payment_status === 'paid' || o.payment_status === 'completed').reduce((sum, o) => sum + Number(o.total), 0).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Avg Order</span>
                                        <span style={{ fontWeight: 600 }}>₹{orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length) : 0}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <ShoppingBag size={18} color="var(--accent-primary)" />
                                    <CardTitle>Recent Food Orders</CardTitle>
                                </div>
                                <Badge variant="secondary">{orders.length} Total Orders</Badge>
                            </div>
                        </CardHeader>
                        <div className="space-y-4">
                            {orders.length > 0 ? orders.map((order, i) => (
                                <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Utensils size={20} color="var(--accent-primary)" />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>#{order.order_number}</span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>at {order.restaurants?.name}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>₹{Number(order.total).toLocaleString()}</div>
                                        <Badge style={{
                                            background: `${ORDER_STATUS_COLORS[order.status] || '#71717a'}15`,
                                            color: ORDER_STATUS_COLORS[order.status] || '#71717a',
                                            border: `1px solid ${ORDER_STATUS_COLORS[order.status] || '#71717a'}30`,
                                            fontSize: '0.65rem'
                                        }}>
                                            {order.status?.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <Receipt size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No food orders found for this user.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {activeTab === 'security' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 7' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ShieldCheck size={18} color="#10b981" />
                                        <CardTitle>Access Control</CardTitle>
                                    </div>
                                </CardHeader>
                                <div className="space-y-6">
                                    <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Two-Factor Authentication</div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Secure account access with an additional verification step.</p>
                                        <Badge variant="warning" style={{ marginTop: '10px' }}>Not Configured</Badge>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Account Status</div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Current standing of the user account on the platform.</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', color: '#10b981', fontWeight: 600 }}>
                                            <CheckCircle2 size={16} /> Fully Operational
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div style={{ gridColumn: 'span 5' }}>
                            <Card>
                                <CardHeader><CardTitle>System Meta</CardTitle></CardHeader>
                                <div className="space-y-4">
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Internal UUID</div>
                                        <code style={{ fontSize: '0.8rem', display: 'block', padding: '8px', background: 'var(--surface-hover)', borderRadius: '6px', marginTop: '4px' }}>{profile.id}</code>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Heartbeat</div>
                                        <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{new Date(profile.updated_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
