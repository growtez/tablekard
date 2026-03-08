import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Store, Globe, Mail, Phone, Calendar,
    Shield, Activity, CreditCard, MapPin, Settings as SettingsIcon,
    Clock, Tag, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function RestaurantDetail({ setHeaderData }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchRestaurantDetails();
        }
        return () => {
            setHeaderData && setHeaderData(null);
        };
    }, [id]);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (restaurant && setHeaderData) {
            setHeaderData({
                id: restaurant.id,
                name: restaurant.name,
                logo_url: restaurant.logo_url,
                status: restaurant.status,
                onEdit: !isEditing ? () => setIsEditing(true) : null,
                isEditing
            });
        }
    }, [restaurant, setHeaderData, isEditing]);

    useEffect(() => {
        if (restaurant) {
            setFormData(restaurant);
        }
    }, [restaurant]);

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
            {isEditing && (
                <div className="edit-actions-bar animate-slide-up">
                    <div className="flex items-center gap-4">
                        <button className="btn-save" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save All Changes
                        </button>
                        <button className="btn-cancel" onClick={handleCancel} disabled={saving}>
                            <CloseIcon size={18} />
                            Cancel
                        </button>
                    </div>
                    {error && <span className="text-error text-sm">{error}</span>}
                </div>
            )}

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
                </div>
            </div>
        </div>
    );
}
