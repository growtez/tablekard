import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Store, Globe, Mail, Phone, Calendar,
    Shield, Activity, CreditCard, MapPin, Settings as SettingsIcon,
    Clock, Tag, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2,
    Utensils, Layers, List, ArrowUpRight, CheckCircle2, XCircle, Timer,
    Hash, Map, Palette, Image as ImageIcon, Box
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function RestaurantDetail({ setHeaderData, setSyncAction }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('general');

    const [isEditing, setIsEditing] = useState(location.state?.edit || false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    // Refs to handle stale closures in header actions
    const saveRef = useRef();
    const cancelRef = useRef();

    useEffect(() => {
        if (id) {
            fetchRestaurantDetails();
        }
        return () => {
            setHeaderData && setHeaderData(null);
            setSyncAction && setSyncAction(null);
        };
    }, [id]);

    useEffect(() => {
        if (setSyncAction && !isEditing) {
            setSyncAction({
                onSync: fetchRestaurantDetails,
                loading: loading
            });
        }
    }, [loading, setSyncAction, isEditing]);

    const fetchMenuData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                supabase.from('menu_categories').select('*').eq('restaurant_id', id).order('sort_order'),
                supabase.from('menu_items').select('*').eq('restaurant_id', id)
            ]);
            setCategories(catRes.data || []);
            setMenuItems(itemRes.data || []);
        } catch (err) {
            console.error('Failed to fetch menu data:', err);
        }
    };

    const fetchPayments = async () => {
        try {
            const { data, error } = await supabase
                .from('subscription_payments')
                .select('*')
                .eq('restaurant_id', id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setPayments(data || []);
        } catch (err) {
            console.error('Failed to fetch payment history:', err);
        }
    };

    const fetchRestaurantDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setRestaurant(data);
            setFormData(data);
            await Promise.all([fetchMenuData(), fetchPayments()]);
        } catch (err) {
            setError('Failed to fetch restaurant details: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    name: formData.name,
                    tagline: formData.tagline,
                    contact_email: formData.contact_email,
                    contact_phone: formData.contact_phone,
                    contact_address: formData.contact_address,
                    primary_color: formData.primary_color,
                    secondary_color: formData.secondary_color,
                    logo_url: formData.logo_url,
                    latitude: parseFloat(formData.latitude) || null,
                    longitude: parseFloat(formData.longitude) || null,
                    allowed_radius: parseInt(formData.allowed_radius) || 100,
                    status: formData.status,
                    operating_hours_weekdays: formData.operating_hours_weekdays,
                    operating_hours_weekends: formData.operating_hours_weekends
                })
                .eq('id', id);

            if (error) throw error;
            setIsEditing(false);
            fetchRestaurantDetails();
        } catch (err) {
            setError('Failed to save changes: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(restaurant);
        setIsEditing(false);
    };

    useEffect(() => {
        saveRef.current = handleSave;
        cancelRef.current = handleCancel;
    });

    useEffect(() => {
        if (restaurant && setHeaderData) {
            setHeaderData({
                id: restaurant.id,
                name: restaurant.name,
                logo_url: restaurant.logo_url,
                status: restaurant.status,
                onEdit: !isEditing ? () => setIsEditing(true) : null,
                isEditing,
                onSave: () => saveRef.current?.(),
                onCancel: () => cancelRef.current?.(),
                saving,
                backPath: '/restaurants',
                backTitle: 'Back to Restaurants'
            });
        }
    }, [restaurant, setHeaderData, isEditing, saving]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
                <div className="loader" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching restaurant profile...</p>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Restaurant Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'The requested restaurant could not be located.'}</p>
                <button onClick={() => navigate('/restaurants')} className="btn-primary">
                    <ChevronLeft size={18} /> Back to Restaurants
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
                        {field === 'status' ? <Badge style={{ background: STATUS_COLORS[restaurant.status], color: 'white', border: 'none' }}>{restaurant.status.toUpperCase()}</Badge> : (restaurant[field] || '—')}
                    </div>
                )}
            </div>
        );
    };

    const STATUS_COLORS = {
        active: '#10b981',
        approved: '#3b82f6',
        pending: '#f59e0b',
        suspended: '#ef4444',
        rejected: '#71717a'
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>


            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', overflowX: 'auto' }}>
                {[
                    { id: 'general', label: 'General Info', icon: Info },
                    { id: 'menu', label: 'Menu & Catalog', icon: Utensils },
                    { id: 'billing', label: 'Billing & Sub', icon: CreditCard },
                    { id: 'branding', label: 'Branding & Geo', icon: Palette }
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
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'general' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card>
                                <CardHeader><CardTitle>Core Identity</CardTitle></CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {renderField("Restaurant Name", "name")}
                                    {renderField("Tagline", "tagline")}
                                    {renderField("Slug (URL)", "slug", "static")}
                                    {renderField("Status", "status", "select", [
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'active', label: 'Active' },
                                        { value: 'suspended', label: 'Suspended' }
                                    ])}
                                </div>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                                <div className="space-y-4">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Mail size={16} color="var(--text-muted)" />
                                        {renderField("Contact Email", "contact_email")}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Phone size={16} color="var(--text-muted)" />
                                        {renderField("Phone Number", "contact_phone")}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <MapPin size={16} color="var(--text-muted)" style={{ marginTop: '4px' }} />
                                        {renderField("Address", "contact_address")}
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card>
                                <CardHeader><CardTitle>Operating Hours</CardTitle></CardHeader>
                                <div className="space-y-4">
                                    {renderField("Weekdays", "operating_hours_weekdays")}
                                    {renderField("Weekends", "operating_hours_weekends")}
                                </div>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>System Meta</CardTitle></CardHeader>
                                <div className="space-y-4">
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Opening Date</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{restaurant.opening_date || '—'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Update</div>
                                        <div style={{ fontSize: '0.9rem' }}>{new Date(restaurant.updated_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card>
                                <CardHeader><CardTitle>Menu Overview</CardTitle></CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{menuItems.length}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{categories.length}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Categories</div>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {categories.map(cat => (
                                        <Badge key={cat.id} variant={cat.active ? 'success' : 'secondary'}>{cat.name}</Badge>
                                    ))}
                                </div>
                            </Card>
                        </div>
                        <div style={{ gridColumn: 'span 8' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <CardTitle>Recent Menu Items</CardTitle>
                                        <Badge variant="info">{menuItems.length} Total</Badge>
                                    </div>
                                </CardHeader>
                                <div className="space-y-3">
                                    {menuItems.slice(0, 5).map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--surface-color)', overflow: 'hidden' }}>
                                                    {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box size={20} style={{ margin: '14px', opacity: 0.3 }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{categories.find(c => c.id === item.category_id)?.name}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800 }}>₹{item.price}</div>
                                                <Badge variant={item.is_available ? 'success' : 'warning'} style={{ fontSize: '0.65rem' }}>{item.is_available ? 'In Stock' : 'Out'}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 6' }}>
                            <Card style={{ background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
                                <CardHeader><CardTitle>Subscription Status</CardTitle></CardHeader>
                                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Plan</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>{restaurant.subscription_type?.toUpperCase() || 'LITE PLAN'}</div>
                                    <Badge variant={restaurant.subscription_status ? 'success' : 'warning'} style={{ marginTop: '12px', padding: '6px 16px' }}>
                                        {restaurant.subscription_status ? 'ACTIVE & PAID' : 'TRIAL PERIOD'}
                                    </Badge>
                                </div>
                                <div className="space-y-4" style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Valid Until</span>
                                        <span style={{ fontWeight: 600 }}>{restaurant.subscription_end_at ? new Date(restaurant.subscription_end_at).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Auto Renewal</span>
                                        <Badge variant="secondary">ENABLED</Badge>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div style={{ gridColumn: 'span 6' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <CardTitle>Payment History</CardTitle>
                                        <Badge variant="secondary">{payments.length} Transactions</Badge>
                                    </div>
                                </CardHeader>
                                <div className="space-y-3">
                                    {payments.length > 0 ? (
                                        payments.map((payment) => (
                                            <div 
                                                key={payment.id}
                                                onClick={() => navigate(`/subscriptions/${payment.id}`)}
                                                style={{ 
                                                    padding: '1rem', 
                                                    borderRadius: '12px', 
                                                    background: 'var(--surface-hover)', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    border: '1px solid transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary-glow)'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ 
                                                        width: '40px', 
                                                        height: '40px', 
                                                        borderRadius: '10px', 
                                                        background: payment.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <CreditCard size={18} color={payment.status === 'paid' ? '#10b981' : '#ef4444'} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>₹{Number(payment.amount).toLocaleString()}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(payment.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <Badge variant={payment.status === 'paid' ? 'success' : (payment.status === 'pending' ? 'warning' : 'error')} style={{ fontSize: '0.65rem' }}>
                                                        {payment.status.toUpperCase()}
                                                    </Badge>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        {payment.plan_duration} Days
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                            <Activity size={32} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                            <p style={{ fontSize: '0.85rem' }}>No payment records found for this restaurant.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'branding' && (
                    <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card>
                                <CardHeader><CardTitle>Color Palette</CardTitle></CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ padding: '1.25rem', borderRadius: '16px', background: 'var(--surface-hover)', textAlign: 'center' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: restaurant.primary_color, margin: '0 auto 10px', border: '3px solid var(--border-color)' }} />
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary</div>
                                        {isEditing ? renderField("", "primary_color") : <div style={{ fontWeight: 700 }}>{restaurant.primary_color}</div>}
                                    </div>
                                    <div style={{ padding: '1.25rem', borderRadius: '16px', background: 'var(--surface-hover)', textAlign: 'center' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: restaurant.secondary_color, margin: '0 auto 10px', border: '3px solid var(--border-color)' }} />
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Secondary</div>
                                        {isEditing ? renderField("", "secondary_color") : <div style={{ fontWeight: 700 }}>{restaurant.secondary_color}</div>}
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Geofencing</CardTitle></CardHeader>
                                <div className="space-y-6">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        {renderField("Latitude", "latitude")}
                                        {renderField("Longitude", "longitude")}
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <MapPin size={16} /> Allowed Radius
                                        </div>
                                        <div style={{ marginTop: '8px' }}>
                                            {isEditing ? renderField("", "allowed_radius", "number") : <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{restaurant.allowed_radius} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>meters</span></div>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div style={{ gridColumn: 'span 6' }}>
                            <Card>
                                <CardHeader><CardTitle>Visual Assets</CardTitle></CardHeader>
                                <div className="space-y-6">
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Restaurant Logo</div>
                                        <div style={{ width: '100%', height: '160px', borderRadius: '16px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <ImageIcon size={48} style={{ opacity: 0.1 }} />}
                                        </div>
                                        {isEditing && <div style={{ marginTop: '1rem' }}>{renderField("Logo URL", "logo_url")}</div>}
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
