import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, User, Mail, Shield, Calendar,
    Clock, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2,
    Hash, Camera, Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function UserDetail({ setHeaderData }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchInitialData();
        }
        return () => {
            setHeaderData && setHeaderData(null);
        };
    }, [id]);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([
            fetchUserProfile(),
            fetchRestaurants()
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

    const fetchUserProfile = async () => {
        setError(null);
        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;

            // Fetch restaurant association if applicable
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

    useEffect(() => {
        if (profile && setHeaderData) {
            setHeaderData({
                id: profile.id,
                name: profile.name || profile.email,
                logo_url: profile.avatar_url,
                status: profile.role,
                onEdit: !isEditing ? () => setIsEditing(true) : null,
                isEditing,
                backPath: '/users',
                backTitle: 'Back to Users'
            });
        }
    }, [profile, setHeaderData, isEditing]);

    const handleSave = async () => {
        if (['restaurant_admin', 'restaurant_staff'].includes(formData.role) && !formData.restaurant_id) {
            setError('Please select a restaurant for this member.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            // 1. Update Profile
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

            // 2. Handle Restaurant Association
            if (['restaurant_admin', 'restaurant_staff'].includes(formData.role)) {
                const restaurantRole = formData.role === 'restaurant_admin' ? 'admin' : 'staff';

                // Check for existing
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
                // If role changed to something else, remove association
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
        let restaurantId = '';
        if (profile && ['restaurant_admin', 'restaurant_staff'].includes(profile.role)) {
            // Need to re-derive restaurantId or store it in profile state
            // But fetchUserProfile will reset it correctly
        }
        setFormData({ ...profile, restaurant_id: profile.restaurant_id });
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

    if (error || !profile) {
        return (
            <div className="p-8">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ChevronLeft size={20} />
                </button>
                <div className="error-container mt-4">
                    <AlertTriangle size={48} className="text-warning mb-4" />
                    <h2>Error loading profile</h2>
                    <p>{error || 'Profile not found'}</p>
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
                        <span className="detail-label" style={{ width: '35%' }}>{item.label}</span>
                        <div className="detail-value" style={{ width: isEditing && item.type !== 'static' ? '65%' : 'auto' }}>
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
                            Save Profile
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
                        "Core Identity",
                        <User size={20} />,
                        [
                            { label: "Full Name", field: "name", value: profile.name },
                            { label: "Email Address", field: "email", type: "static", value: profile.email },
                            {
                                label: "Access Role",
                                field: "role",
                                type: "select",
                                value: <Badge variant={profile.role === 'super_admin' ? 'success' : 'info'}>{profile.role}</Badge>,
                                options: [
                                    { value: 'super_admin', label: 'Super Admin' },
                                    { value: 'restaurant_admin', label: 'Restaurant Admin' },
                                    { value: 'restaurant_staff', label: 'Restaurant Staff' },
                                    { value: 'customer', label: 'Customer' }
                                ]
                            },
                            ...(['restaurant_admin', 'restaurant_staff'].includes(formData.role) ? [{
                                label: <>Managed Restaurant <span className="text-error">*</span></>,
                                field: "restaurant_id",
                                type: "select",
                                value: restaurants.find(r => r.id === formData.restaurant_id)?.name || 'Not Assigned',
                                options: [
                                    { value: '', label: 'Select a restaurant...' },
                                    ...restaurants.map(r => ({ value: r.id, label: r.name }))
                                ]
                            }] : [])
                        ],
                        { background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #3b82f6', color: '#3b82f6' }
                    )}

                    {renderDetailSection(
                        "System Information",
                        <Shield size={20} />,
                        [
                            { label: "Internal ID", type: "static", value: <code style={{ fontSize: '0.75rem', opacity: 0.7 }}>{profile.id}</code> },
                            { label: "Initial Join", type: "static", value: new Date(profile.created_at).toLocaleString() },
                            { label: "Last Heartbeat", type: "static", value: new Date(profile.updated_at).toLocaleString() }
                        ],
                        { background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #10b981', color: '#10b981' }
                    )}
                </div>

                <div className="detail-column">
                    {renderDetailSection(
                        "Profile Media",
                        <Camera size={20} />,
                        [
                            { label: "Avatar URL", field: "avatar_url", value: profile.avatar_url || 'Default Placeholder' },
                            {
                                label: "Preview",
                                type: "static",
                                value: (
                                    <div className="user-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem', borderRadius: '12px' }}>
                                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile.name?.[0] || profile.email?.[0] || '?').toUpperCase()}
                                    </div>
                                )
                            }
                        ],
                        { background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #8b5cf6', color: '#8b5cf6' }
                    )}

                    {renderDetailSection(
                        "Activity Log",
                        <Activity size={20} />,
                        [
                            { label: "Total Visits", type: "static", value: "154 (Simulated)" },
                            { label: "Last Action", type: "static", value: "Login - Today 05:42" }
                        ],
                        { background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #ef4444', color: '#ef4444' }
                    )}
                </div>
            </div>
        </div>
    );
}
