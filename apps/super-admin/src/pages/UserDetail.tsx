import { useState, useEffect, useRef } from 'react';
import { formatDateTimeShort, formatDateTime } from '@restaurant-saas/types';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, User, Mail, Shield, Calendar,
    Clock, Info, AlertTriangle, Edit, Save, X as CloseIcon, Loader2,
    Hash, Camera, Activity, ShieldCheck, MapPin, ExternalLink, ArrowUpRight,
    Lock, History, Settings, Plus, CreditCard, CheckCircle2, Utensils,
    ShoppingBag, Receipt, AlertCircle, Store
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DetailPageSkeleton } from '../components/ui/Skeleton';

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatar_url: string | null;
    updated_at: string;
    restaurant_id?: string;
}

interface Restaurant {
    id: string;
    name: string;
}

interface Order {
    id: string;
    order_number: string;
    total: number | string;
    status: string;
    payment_status: string;
    created_at: string;
    restaurants?: { name: string } | null;
}

interface HeaderData {
    id?: string;
    name?: string;
    logo_url?: string | null;
    status?: string;
    onEdit?: (() => void) | null;
    isEditing?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    saving?: boolean;
    backPath?: string;
    backTitle?: string;
}

interface UserDetailProps {
    setHeaderData?: (data: HeaderData | null) => void;
}

export default function UserDetail({ setHeaderData }: UserDetailProps) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('overview');

    const [isEditing, setIsEditing] = useState<boolean>(location.state?.edit || false);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [saving, setSaving] = useState<boolean>(false);

    // Refs to handle stale closures in header actions
    const saveRef = useRef<(() => void) | null>(null);
    const cancelRef = useRef<(() => void) | null>(null);

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
        } catch (err: unknown) {
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
                    restaurants(name)
                `)
                .eq('customer_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders((data as unknown as Order[]) || []);
        } catch (err: unknown) {
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
        } catch (err: unknown) {
            setError('Failed to fetch user profile: ' + (err instanceof Error ? err.message : String(err)));
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
        } catch (err: unknown) {
            setError('Failed to save changes: ' + (err instanceof Error ? err.message : String(err)));
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
                onSave: () => {
                    if (saveRef.current) saveRef.current();
                },
                onCancel: () => {
                    if (cancelRef.current) cancelRef.current();
                },
                saving,
                backPath: '/users',
                backTitle: 'Back to Users'
            });
        }
    }, [profile, setHeaderData, isEditing, saving]);

    const updateField = (field: keyof UserProfile, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <DetailPageSkeleton />;
    }

    if (error || !profile) {
        return (
            <div className="animate-fade-in p-8 text-center">
                <AlertCircle size={48} className="text-red-500 opacity-50 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
                <p className="text-text-muted mb-6">{error || 'The requested user profile could not be located.'}</p>
                <button onClick={() => navigate('/users')} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-black font-bold rounded-xl mx-auto shadow-sm hover:shadow-md transition-all">
                    <ChevronLeft size={18} /> Back to Users
                </button>
            </div>
        );
    }

    const renderField = (label: string, field: keyof UserProfile, type = 'text', options: { value: string, label: string }[] = []) => {
        return (
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase tracking-wider">{label}</label>
                {isEditing ? (
                    type === 'select' ? (
                        <select
                            value={formData[field] || ''}
                            onChange={(e) => updateField(field, e.target.value)}
                            className="w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                        >
                            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                        <input
                            type={type}
                            value={formData[field] || ''}
                            onChange={(e) => updateField(field, e.target.value)}
                            className="w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                            placeholder={`Enter ${label.toLowerCase()}`}
                        />
                    )
                ) : (
                    <div className="text-base font-semibold text-text-main">
                        {field === 'role' ? profile.role?.replace('_', ' ').toUpperCase() : (profile[field] || '—')}
                    </div>
                )}
            </div>
        );
    };

    const ORDER_STATUS_COLORS: Record<string, string> = {
        completed: '#065f46',
        delivered: '#065f46',
        pending: '#92400e',
        cancelled: '#991b1b',
        processing: '#1e40af'
    };

    return (
        <div className="animate-fade-in max-w-[1000px] mx-auto pb-12">

            {/* Tabs Navigation */}
            <div className="flex gap-8 border-b border-border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'activity', label: 'Order History', icon: ShoppingBag }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 text-sm font-semibold border-b-2 transition-all bg-transparent cursor-pointer ${activeTab === tab.id ? 'text-accent-primary border-accent-primary' : 'text-text-muted border-transparent hover:text-text-main'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <Info size={18} className="text-accent-primary" />
                                        <CardTitle className="m-0">Profile Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                <Card className="bg-gradient-to-r from-surface to-emerald-500/5 border-emerald-500/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <Store size={24} className="text-emerald-500" />
                                            <div>
                                                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Affiliated Restaurant</div>
                                                <div className="text-xl font-bold text-text-main mt-1">{restaurants.find(r => r.id === formData.restaurant_id)?.name || 'Not Linked'}</div>
                                            </div>
                                        </div>
                                        {formData.restaurant_id && (
                                            <button onClick={() => navigate(`/restaurants/${formData.restaurant_id}`)} className="px-4 py-2 bg-transparent text-text-main font-semibold border border-border rounded-lg hover:bg-surface-hover hover:border-text-muted transition-all flex items-center gap-2 cursor-pointer">
                                                View <ArrowUpRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <Card>
                                <CardHeader><CardTitle className="m-0">User Stats</CardTitle></CardHeader>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface-hover p-4 rounded-2xl text-center">
                                        <div className="text-3xl font-extrabold text-accent-primary">{orders.length}</div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Orders</div>
                                    </div>
                                    <div className="bg-surface-hover p-4 rounded-2xl text-center">
                                        <div className="text-3xl font-extrabold text-emerald-600">{orders.filter(o => o.status === 'completed' || o.status === 'delivered').length}</div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Done</div>
                                    </div>
                                </div>
                                <div className="space-y-4 mt-6 pt-6 border-t border-border">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">Spent Total</span>
                                        <span className="font-bold">₹{orders.filter(o => o.payment_status === 'paid' || o.payment_status === 'completed').reduce((sum, o) => sum + Number(o.total), 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">Avg Order</span>
                                        <span className="font-semibold">₹{orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length) : 0}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <ShoppingBag size={18} className="text-accent-primary" />
                                    <CardTitle className="m-0">Recent Food Orders</CardTitle>
                                </div>
                                <Badge variant="default">{orders.length} Total Orders</Badge>
                            </div>
                        </CardHeader>
                        <div className="space-y-4">
                            {orders.length > 0 ? orders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-surface-hover rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shrink-0">
                                            <Utensils size={20} className="text-accent-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[15px] text-text-main">#{order.order_number}</span>
                                                <span className="text-sm text-text-muted">at {order.restaurants?.name}</span>
                                            </div>
                                            <div className="text-xs text-text-muted mt-1">
                                                {formatDateTimeShort(order.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-base font-extrabold text-text-main mb-1">₹{Number(order.total).toLocaleString()}</div>
                                        <Badge style={{
                                            background: `${ORDER_STATUS_COLORS[order.status] || '#71717a'}15`,
                                            color: ORDER_STATUS_COLORS[order.status] || '#71717a',
                                            border: `1px solid ${ORDER_STATUS_COLORS[order.status] || '#71717a'}30`,
                                        }} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 text-text-muted">
                                    <Receipt size={40} className="opacity-20 mb-4 mx-auto" />
                                    <p className="text-sm">No food orders found for this user.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

            </div>
        </div>
    );
}
