import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, User, Mail, Shield, Calendar,
    Clock, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2,
    Hash, Camera, Activity, ShieldCheck, MapPin, ExternalLink, ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function UserDetail({ setHeaderData, setSyncAction }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        setFormData({ ...profile, restaurant_id: profile.restaurant_id });
        setIsEditing(false);
    };

    // Update refs every render
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

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header / Profile Summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div className="user-avatar" style={{ width: '80px', height: '80px', borderRadius: '24px', fontSize: '2rem' }}>
                            {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.name?.[0] || profile.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--surface-color)', padding: '4px', borderRadius: '50%' }}>
                            <div style={{ background: profile.role === 'super_admin' ? 'var(--accent-primary)' : '#3b82f6', width: '12px', height: '12px', borderRadius: '50%' }} />
                        </div>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{profile.name || 'No Name Set'}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Mail size={14} /> {profile.email}
                            </div>
                            <Badge variant={profile.role === 'super_admin' ? 'success' : 'info'}>
                                {profile.role?.replace('_', ' ').toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn-save" style={{ background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                        <Edit size={16} /> Edit Profile
                    </button>
                )}
            </div>

            <div className="dashboard-chart-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                {/* Left Column: Core Details */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <User size={18} color="var(--accent-primary)" />
                                <CardTitle>{isEditing ? 'Edit Profile Information' : 'User Overview'}</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ padding: '0.5rem 0' }}>
                            {isEditing ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {renderField("Full Name", "name")}
                                    {renderField("Access Role", "role", "select", [
                                        { value: 'super_admin', label: 'Super Admin' },
                                        { value: 'restaurant_admin', label: 'Restaurant Admin' },
                                        { value: 'restaurant_staff', label: 'Restaurant Staff' },
                                        { value: 'customer', label: 'Customer' }
                                    ])}
                                    {renderField("Avatar URL", "avatar_url")}
                                    {['restaurant_admin', 'restaurant_staff'].includes(formData.role) && 
                                        renderField("Managed Restaurant", "restaurant_id", "select", [
                                            { value: '', label: 'Select a restaurant...' },
                                            ...restaurants.map(r => ({ value: r.id, label: r.name }))
                                        ])
                                    }
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="space-y-6">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Account Type</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{profile.role?.replace('_', ' ').toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>User ID</div>
                                            <code style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>{profile.id}</code>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Email Verification</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>
                                                <ShieldCheck size={16} /> Verified
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Last Updated</div>
                                            <div style={{ fontSize: '0.9rem' }}>{new Date(profile.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {['restaurant_admin', 'restaurant_staff'].includes(profile.role) && !isEditing && (
                        <Card style={{ background: 'linear-gradient(90deg, var(--surface-color) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ background: 'var(--surface-hover)', p: '12px', borderRadius: '12px' }}>
                                        <Store size={24} color="#10b981" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Affiliated Restaurant</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{restaurants.find(r => r.id === formData.restaurant_id)?.name || 'Not Linked'}</div>
                                    </div>
                                </div>
                                {formData.restaurant_id && (
                                    <button onClick={() => navigate(`/restaurants/${formData.restaurant_id}`)} className="btn-ghost" style={{ border: '1px solid var(--border-color)' }}>
                                        View Details <ArrowUpRight size={16} style={{ marginLeft: '6px' }} />
                                    </button>
                                )}
                            </div>
                        </Card>
                    )}

                    {!isEditing && (
                        <Card>
                            <CardHeader>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Activity size={18} color="#ef4444" />
                                    <CardTitle>Recent Activity</CardTitle>
                                </div>
                            </CardHeader>
                            <div className="space-y-4">
                                {[
                                    { action: 'Dashboard Access', time: '2 hours ago', status: 'Success' },
                                    { action: 'Profile Update', time: 'Yesterday, 14:20', status: 'Success' },
                                    { action: 'Subscription Renewal', time: '3 days ago', status: 'System' }
                                ].map((act, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{act.action}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{act.status}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{act.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column: Meta & Stats */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card>
                        <CardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Calendar size={18} color="#3b82f6" />
                                <CardTitle>Membership</CardTitle>
                            </div>
                        </CardHeader>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                                {Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24))}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Days Active</div>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                        <div className="space-y-4">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Joined On</span>
                                <span style={{ fontWeight: 600 }}>{new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Platform Access</span>
                                <Badge variant="success">Granted</Badge>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(99, 102, 241, 0.05) 100%)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', textAlign: 'center' }}>
                            <Shield size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Security Logs</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                No suspicious login attempts detected in the last 30 days.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
