import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Store, Globe, Mail, Phone, Calendar,
    Shield, Activity, CreditCard, MapPin, Settings as SettingsIcon,
    Clock, Tag, Info, AlertTriangle
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

    useEffect(() => {
        if (restaurant && setHeaderData) {
            setHeaderData({
                id: restaurant.id,
                name: restaurant.name,
                logo_url: restaurant.logo_url,
                status: restaurant.status
            });
        }
    }, [restaurant, setHeaderData]);

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
                margin: '-2rem -2rem 1rem -2rem',
                padding: '0.6rem 2rem',
                borderBottom: 'none',
                ...headerStyle
            }}>
                <div className="section-header">
                    {icon}
                    <CardTitle style={{ color: headerStyle.color || 'inherit' }}>{title}</CardTitle>
                </div>
            </CardHeader>
            <div className="section-content">
                {items.map((item, idx) => (
                    <div key={idx} className="detail-row">
                        <span className="detail-label">{item.label}</span>
                        <span className="detail-value">{item.value || <span className="text-muted italic">Not set</span>}</span>
                    </div>
                ))}
            </div>
        </Card>
    );

    return (
        <div className="restaurant-detail-page animate-fade-in" style={{ paddingTop: '1rem' }}>
            <div className="detail-grid">
                <div className="detail-column">
                    {renderDetailSection(
                        "General Information",
                        <Store size={20} />,
                        [
                            { label: "Display Name", value: restaurant.name },
                            { label: "Unique Slug", value: `/${restaurant.slug}` },
                            { label: "Status", value: restaurant.status },
                            { label: "Created At", value: new Date(restaurant.created_at).toLocaleString() },
                            { label: "Last Updated", value: new Date(restaurant.updated_at).toLocaleString() }
                        ],
                        { background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #3b82f6', color: '#3b82f6' }
                    )}

                    {renderDetailSection(
                        "Contact Details",
                        <Mail size={20} />,
                        [
                            { label: "Email Address", value: restaurant.contact_email },
                            { label: "Phone Number", value: restaurant.contact_phone },
                            { label: "Physical Address", value: restaurant.contact_address }
                        ],
                        { background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #10b981', color: '#10b981' }
                    )}

                    {renderDetailSection(
                        "Branding & Assets",
                        <Tag size={20} />,
                        [
                            { label: "Logo URL", value: restaurant.logo_url },
                            { label: "Primary Color", value: <div className="color-preview-row"><span className="color-circle" style={{ backgroundColor: restaurant.primary_color || 'var(--primary)' }}></span> {restaurant.primary_color}</div> },
                            { label: "Secondary Color", value: <div className="color-preview-row"><span className="color-circle" style={{ backgroundColor: restaurant.secondary_color || 'var(--secondary)' }}></span> {restaurant.secondary_color}</div> }
                        ],
                        { background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #8b5cf6', color: '#8b5cf6' }
                    )}
                </div>

                <div className="detail-column">
                    {renderDetailSection(
                        "Subscription & Billing",
                        <CreditCard size={20} />,
                        [
                            { label: "Plan Status", value: restaurant.subscription_status ? "Active (Paid)" : "Inactive (Trial/Free)" },
                            { label: "Plan Type", value: restaurant.subscription_type || "Lite Plan" }
                        ],
                        { background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #f59e0b', color: '#f59e0b' }
                    )}

                    {renderDetailSection(
                        "Location & Radius",
                        <MapPin size={20} />,
                        [
                            { label: "Latitude", value: restaurant.latitude },
                            { label: "Longitude", value: restaurant.longitude },
                            { label: "Allowed Radius (m)", value: `${restaurant.allowed_radius} meters` }
                        ],
                        { background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #ef4444', color: '#ef4444' }
                    )}

                    {renderDetailSection(
                        "System Metadata",
                        <Info size={20} />,
                        [
                            { label: "Raw Settings", value: <pre className="json-preview">{JSON.stringify(restaurant.settings, null, 2)}</pre> }
                        ],
                        { background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%)', borderLeft: '4px solid #6366f1', color: '#6366f1' }
                    )}
                </div>
            </div>
        </div>
    );
}
