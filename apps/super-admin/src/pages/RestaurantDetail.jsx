import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Store, Globe, Mail, Phone, Calendar,
    Shield, Activity, CreditCard, MapPin, Settings as SettingsIcon,
    Clock, Tag, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2,
    Utensils, Layers, List
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

    useEffect(() => {
        if (id) {
            fetchRestaurantDetails();
        }
        return () => {
            setHeaderData && setHeaderData(null);
            setSyncAction && setSyncAction(null);
        };
    }, [id]);

    const [isEditing, setIsEditing] = useState(location.state?.edit || false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    // Refs to handle stale closures in header actions
    const saveRef = useRef();
    const cancelRef = useRef();

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    name: formData.name,
                    contact_email: formData.contact_email,
                    contact_phone: formData.contact_phone,
                    contact_address: formData.contact_address,
                    primary_color: formData.primary_color,
                    secondary_color: formData.secondary_color,
                    logo_url: formData.logo_url,
                    latitude: parseFloat(formData.latitude) || null,
                    longitude: parseFloat(formData.longitude) || null,
                    allowed_radius: parseInt(formData.allowed_radius) || 100,
                    status: formData.status
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

    // Update refs every render
    useEffect(() => {
        saveRef.current = handleSave;
        cancelRef.current = handleCancel;
    });

    useEffect(() => {
        if (setSyncAction && !isEditing) {
            setSyncAction({
                onSync: fetchRestaurantDetails,
                loading: loading
            });
        }
    }, [loading, setSyncAction, isEditing]);

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

    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);

    const fetchMenuData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                supabase.from('menu_categories').select('*').eq('restaurant_id', id).order('sort_order'),
                supabase.from('menu_items').select('*').eq('restaurant_id', id)
            ]);

            if (catRes.error) throw catRes.error;
            if (itemRes.error) throw itemRes.error;

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
            await fetchMenuData();
        } catch (err) {
            setError('Failed to fetch restaurant details: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (restaurant) {
            setFormData(restaurant);
        }
    }, [restaurant]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="p-8">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ChevronLeft size={20} />
                </button>
                <div className="error-container mt-4">
                    <AlertTriangle size={48} className="text-warning mb-4" />
                    <h2>Error loading restaurant</h2>
                    <p>{error || 'Restaurant not found'}</p>
                </div>
            </div>
        );
    }

    const renderDetailSection = (title, icon, items, headerStyle = {}) => (
        <Card className="detail-section overflow-hidden">
            <CardHeader style={{
                margin: '-1.5rem -1.5rem 0.5rem -1.5rem',
                padding: '0.4rem 1.25rem',
                borderBottom: 'none',
                ...headerStyle
            }}>
                <div className="section-header">
                    {icon}
                    <CardTitle style={{
                        color: headerStyle.color || 'inherit',
                        fontSize: '0.95rem',
                        borderBottom: 'none',
                        paddingBottom: 0
                    }}>{title}</CardTitle>
                </div>
            </CardHeader>
            <div className="section-content">
                {items.map((item, idx) => (
                    <div key={idx} className="detail-row" style={{ alignItems: isEditing && item.type !== 'static' ? 'center' : 'flex-start' }}>
                        <span className="detail-label">{item.label}</span>
                        <div className="detail-value" style={{ width: isEditing && item.type !== 'static' ? '60%' : 'auto' }}>
                            {isEditing && item.field && item.type !== 'static' ? (
                                item.type === 'select' ? (
                                    <select
                                        value={formData[item.field] || ''}
                                        onChange={(e) => updateField(item.field, e.target.value)}
                                        className="edit-input"
                                    >
                                        {item.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type={item.type || 'text'}
                                        value={formData[item.field] || ''}
                                        onChange={(e) => updateField(item.field, e.target.value)}
                                        className="edit-input"
                                        placeholder={`Enter ${item.label.toLowerCase()}`}
                                    />
                                )
                            ) : (
                                item.value || <span className="text-muted italic">Not set</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    return (
        <div className="restaurant-detail-page animate-fade-in" style={{ paddingTop: '1rem' }}>
            {error && !isEditing && <div className="p-4 mb-4 bg-error/10 text-error rounded-lg">{error}</div>}
            {error && isEditing && <div className="fixed bottom-8 right-8 p-4 bg-error text-white rounded-lg shadow-lg z-50 animate-slide-up">{error}</div>}

            <div className="detail-grid">
                <div className="detail-column">
                    {renderDetailSection(
                        "General Information",
                        <Store size={20} />,
                        [
                            { label: "Display Name", field: "name", value: restaurant.name },
                            { label: "Unique Slug", type: "static", value: `/${restaurant.slug}` },
                            {
                                label: "Status",
                                field: "status",
                                type: "select",
                                value: restaurant.status,
                                options: [
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'suspended', label: 'Suspended' },
                                    { value: 'rejected', label: 'Rejected' }
                                ]
                            },
                            { label: "Created At", type: "static", value: new Date(restaurant.created_at).toLocaleString() },
                            { label: "Last Updated", type: "static", value: new Date(restaurant.updated_at).toLocaleString() }
                        ],
                        { background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #3b82f6', color: '#3b82f6' }
                    )}

                    {renderDetailSection(
                        "Contact Details",
                        <Mail size={20} />,
                        [
                            { label: "Email Address", field: "contact_email", value: restaurant.contact_email },
                            { label: "Phone Number", field: "contact_phone", value: restaurant.contact_phone },
                            { label: "Physical Address", field: "contact_address", value: restaurant.contact_address }
                        ],
                        { background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #10b981', color: '#10b981' }
                    )}

                    {renderDetailSection(
                        "Branding & Assets",
                        <Tag size={20} />,
                        [
                            { label: "Logo URL", field: "logo_url", value: restaurant.logo_url },
                            {
                                label: "Primary Color",
                                field: "primary_color",
                                value: <div className="color-preview-row"><span className="color-circle" style={{ backgroundColor: restaurant.primary_color || 'var(--primary)' }}></span> {restaurant.primary_color}</div>
                            },
                            {
                                label: "Secondary Color",
                                field: "secondary_color",
                                value: <div className="color-preview-row"><span className="color-circle" style={{ backgroundColor: restaurant.secondary_color || 'var(--secondary)' }}></span> {restaurant.secondary_color}</div>
                            }
                        ],
                        { background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #8b5cf6', color: '#8b5cf6' }
                    )}
                </div>

                <div className="detail-column">
                    {renderDetailSection(
                        "Subscription & Billing",
                        <CreditCard size={20} />,
                        [
                            { label: "Plan Status", type: "static", value: restaurant.subscription_status ? "Active (Paid)" : "Inactive (Trial/Free)" },
                            { label: "Plan Type", type: "static", value: restaurant.subscription_type || "Lite Plan" }
                        ],
                        { background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #f59e0b', color: '#f59e0b' }
                    )}

                    {renderDetailSection(
                        "Location & Radius",
                        <MapPin size={20} />,
                        [
                            { label: "Latitude", field: "latitude", type: "number", value: restaurant.latitude },
                            { label: "Longitude", field: "longitude", type: "number", value: restaurant.longitude },
                            { label: "Allowed Radius (m)", field: "allowed_radius", type: "number", value: `${restaurant.allowed_radius} meters` }
                        ],
                        { background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #ef4444', color: '#ef4444' }
                    )}

                    {renderDetailSection(
                        "System Metadata",
                        <Info size={20} />,
                        [
                            { label: "Raw Settings", type: "static", value: <pre className="json-preview">{JSON.stringify(restaurant.settings, null, 2)}</pre> }
                        ],
                        { background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #6366f1', color: '#6366f1' }
                    )}

                    {renderDetailSection(
                        "Menu & Catalog",
                        <Utensils size={20} />,
                        [
                            { label: "Total Categories", type: "static", value: <Badge variant="info">{categories.length}</Badge> },
                            { label: "Total Items", type: "static", value: <Badge variant="success">{menuItems.length}</Badge> },
                            { label: "Active/Available", type: "static", value: menuItems.filter(i => i.is_available).length },
                            { label: "Vegetarian Options", type: "static", value: menuItems.filter(i => i.is_veg).length }
                        ],
                        { background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #ec4899', color: '#ec4899' }
                    )}
                </div>
            </div>

            {/* Added detailed lists for Menu Categories and Recently Added Items */}
            <div style={{ marginTop: '2rem' }}>
                <div className="detail-grid">
                    <Card className="detail-section">
                        <CardHeader style={{ padding: '0.4rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                            <div className="section-header">
                                <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
                                <CardTitle style={{ fontSize: '0.9rem' }}>Menu Categories</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ padding: '1rem' }}>
                            {categories.length > 0 ? (
                                <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {categories.map(cat => (
                                        <Badge key={cat.id} variant={cat.active ? 'success' : 'secondary'} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                                            {cat.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No categories defined yet.</p>
                            )}
                        </div>
                    </Card>

                    <Card className="detail-section">
                        <CardHeader style={{ padding: '0.4rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                            <div className="section-header">
                                <List size={18} style={{ color: 'hsl(150, 100%, 50%)' }} />
                                <CardTitle style={{ fontSize: '0.9rem' }}>Recently Updated Items</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ padding: 0, overflow: 'hidden' }}>
                            {menuItems.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {menuItems
                                        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                                        .slice(0, 4)
                                        .map((item, idx) => (
                                            <div key={item.id} style={{
                                                padding: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                            }} className="hover:bg-white/5 transition-colors">
                                                <div className="flex items-center" style={{ gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        background: 'var(--surface-hover)',
                                                        border: '1px solid var(--border-color)',
                                                        overflow: 'hidden',
                                                        flexShrink: 0
                                                    }}>
                                                        {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', opacity: 0.5 }}>IMG</div>}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {item.is_veg && <span style={{ color: 'hsl(150, 100%, 50%)', fontWeight: 'bold' }}>●</span>}
                                                            {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>₹{item.price}</div>
                                                    {!item.is_available && <Badge variant="warning" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Unavailable</Badge>}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No items found in the menu.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
