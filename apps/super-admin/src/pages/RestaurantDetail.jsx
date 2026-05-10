import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Store, Globe, Mail, Phone, Calendar,
    Shield, Activity, CreditCard, MapPin, Settings as SettingsIcon,
    Clock, Tag, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2,
    Utensils, Layers, List, ArrowUpRight, CheckCircle2, XCircle, Timer,
    Hash, Map, Palette, Image as ImageIcon
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
            await fetchMenuData();
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
        if (!isEditing) return null;
        return (
            <div className="space-y-2">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                {type === 'select' ? (
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
            {/* Cover & Profile Header */}
            <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                <div style={{ 
                    height: '180px', 
                    width: '100%', 
                    background: `linear-gradient(135deg, ${restaurant.primary_color || 'var(--accent-primary)'} 0%, ${restaurant.secondary_color || 'var(--accent-secondary)'} 100%)`,
                    borderRadius: '24px',
                    opacity: 0.15,
                    position: 'absolute',
                    top: 0,
                    zIndex: -1
                }} />
                
                <div style={{ padding: '2rem 2.5rem 0', display: 'flex', alignItems: 'flex-end', gap: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div className="user-avatar" style={{ width: '120px', height: '120px', borderRadius: '32px', fontSize: '3rem', border: '6px solid var(--surface-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (restaurant.name?.[0] || '?').toUpperCase()}
                        </div>
                    </div>
                    <div style={{ flex: 1, paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0 }}>{restaurant.name}</h1>
                            <Badge style={{ background: STATUS_COLORS[restaurant.status], color: 'white', border: 'none', padding: '4px 12px' }}>
                                {restaurant.status?.toUpperCase()}
                            </Badge>
                        </div>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '4px' }}>{restaurant.tagline || 'No tagline set'}</p>
                    </div>
                    {!isEditing && (
                        <div style={{ paddingBottom: '1rem' }}>
                            <button onClick={() => setIsEditing(true)} className="btn-save" style={{ background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                                <Edit size={16} /> Edit Restaurant
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                {/* Left: General & Menu */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Store size={18} color="var(--accent-primary)" />
                                <CardTitle>{isEditing ? 'Edit Restaurant Core' : 'General Information'}</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ padding: '0.5rem 0' }}>
                            {isEditing ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {renderField("Restaurant Name", "name")}
                                    {renderField("Tagline", "tagline")}
                                    {renderField("Operating Status", "status", "select", [
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'active', label: 'Active' },
                                        { value: 'suspended', label: 'Suspended' },
                                        { value: 'rejected', label: 'Rejected' }
                                    ])}
                                    {renderField("Logo URL", "logo_url")}
                                    {renderField("Weekdays Hours", "operating_hours_weekdays")}
                                    {renderField("Weekends Hours", "operating_hours_weekends")}
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="space-y-6">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Unique Slug</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>/{restaurant.slug}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Operating Hours</div>
                                            <div style={{ fontSize: '0.9rem' }}>
                                                <div>Week: {restaurant.operating_hours_weekdays || '—'}</div>
                                                <div>End: {restaurant.operating_hours_weekends || '—'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Opening Date</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                                {restaurant.opening_date ? new Date(restaurant.opening_date).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Not Announced'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Created At</div>
                                            <div style={{ fontSize: '0.9rem' }}>{new Date(restaurant.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {!isEditing && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Layers size={18} color="#8b5cf6" />
                                        <CardTitle>Menu Categories</CardTitle>
                                    </div>
                                </CardHeader>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {categories.length > 0 ? categories.map(cat => (
                                        <Badge key={cat.id} variant={cat.active ? 'info' : 'secondary'} style={{ padding: '4px 10px' }}>
                                            {cat.name}
                                        </Badge>
                                    )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No categories created.</p>}
                                </div>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Utensils size={18} color="#ec4899" />
                                        <CardTitle>Menu Stats</CardTitle>
                                    </div>
                                </CardHeader>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: 'var(--surface-hover)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{menuItems.length}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Items</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-hover)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{menuItems.filter(i => i.is_veg).length}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Veg Options</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {!isEditing && (
                        <Card>
                            <CardHeader>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <List size={18} color="#10b981" />
                                    <CardTitle>Recent Menu Updates</CardTitle>
                                </div>
                            </CardHeader>
                            <div className="space-y-3">
                                {menuItems.slice(0, 3).map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                                {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}><ImageIcon size={16} /></div>}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{categories.find(c => c.id === item.category_id)?.name}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700 }}>₹{item.price}</div>
                                            <Badge variant={item.is_available ? 'success' : 'warning'} style={{ fontSize: '0.6rem' }}>{item.is_available ? 'Available' : 'Sold Out'}</Badge>
                                        </div>
                                    </div>
                                ))}
                                {menuItems.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No items added to the menu yet.</p>}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right: Subscription, Contact, Location */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <CreditCard size={18} color="#f59e0b" />
                                <CardTitle>Subscription</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Active Plan</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{restaurant.subscription_type?.toUpperCase() || 'LITE PLAN'}</div>
                            <Badge variant={restaurant.subscription_status ? 'success' : 'warning'} style={{ marginTop: '8px' }}>
                                {restaurant.subscription_status ? 'Active & Paid' : 'Trial Period'}
                            </Badge>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                        <div className="space-y-3">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Expires On</span>
                                <span style={{ fontWeight: 600 }}>{restaurant.subscription_end_at ? new Date(restaurant.subscription_end_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Auto Renewal</span>
                                <span style={{ fontWeight: 600 }}>Enabled</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={18} color="#3b82f6" />
                                <CardTitle>Contact & Support</CardTitle>
                            </div>
                        </CardHeader>
                        {isEditing ? (
                            <div className="space-y-4">
                                {renderField("Contact Email", "contact_email")}
                                {renderField("Phone", "contact_phone")}
                                {renderField("Address", "contact_address")}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Mail size={14} color="var(--text-muted)" />
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{restaurant.contact_email}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Phone size={14} color="var(--text-muted)" />
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{restaurant.contact_phone}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MapPin size={14} color="var(--text-muted)" />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{restaurant.contact_address}</div>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Palette size={18} color="#8b5cf6" />
                                <CardTitle>Brand Identity</CardTitle>
                            </div>
                        </CardHeader>
                        {isEditing ? (
                            <div className="space-y-4">
                                {renderField("Primary Color", "primary_color")}
                                {renderField("Secondary Color", "secondary_color")}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--surface-hover)', textAlign: 'center' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: restaurant.primary_color, margin: '0 auto 8px', border: '2px solid var(--border-color)' }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{restaurant.primary_color}</div>
                                </div>
                                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--surface-hover)', textAlign: 'center' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: restaurant.secondary_color, margin: '0 auto 8px', border: '2px solid var(--border-color)' }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Secondary</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{restaurant.secondary_color}</div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
