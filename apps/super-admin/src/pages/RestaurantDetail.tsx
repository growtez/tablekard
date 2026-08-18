import { useState, useEffect, useRef } from 'react';
import { formatDate } from '@restaurant-saas/types';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Store, Globe, Mail, Phone, Calendar,
    Shield, Activity, CreditCard, MapPin, Settings as SettingsIcon,
    Clock, Tag, Info, AlertTriangle, AlertCircle, Edit, Save, X as CloseIcon, Loader2,
    Utensils, Layers, List, ArrowUpRight, CheckCircle2, XCircle, Timer,
    Hash, Map, Palette, Image as ImageIcon, Box, Plus, BookOpen, User, ShoppingBag,
    Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, ChevronRight, X
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import QuickAddCategoryDrawer from '../components/QuickAddCategoryDrawer';
import QuickAddMenuItemDrawer from '../components/QuickAddMenuItemDrawer';
import RestaurantProfileView from '../components/RestaurantProfileView';
import { DetailPageSkeleton } from '../components/ui/Skeleton';
import OrderHistoryTab from '../components/OrderHistoryTab';

interface Restaurant {
    id: string;
    name: string;
    status: string;
    logo_url: string;
    subscription_plan: string;
    subscription_status: string;
    tagline?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
    primary_color?: string;
    secondary_color?: string;
    latitude?: number | string;
    longitude?: number | string;
    allowed_radius?: number | string;
    operating_hours_weekdays?: string;
    operating_hours_weekends?: string;
    cover_image_url?: string;
    website_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    manifesto?: string;
    opening_date?: string;
}

interface MenuCategory {
    id: string;
    name: string;
    active: boolean;
    sort_order: number;
}

interface MenuItem {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category_id: string;
    is_available: boolean;
}

interface Payment {
    id: string;
    created_at: string;
    plan_duration: number;
    status: string;
    amount: number;
}

interface AdminProfile {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
}

interface BillingPlans {
    plans: { id: string; name: string; [key: string]: unknown }[];
    trials: { id: string; name: string; [key: string]: unknown }[];
}

interface HeaderData {
    id?: string;
    name?: string;
    logo_url?: string | null;
    status?: string;
    backPath?: string;
    backTitle?: string;
    onEdit?: (() => void) | null;
    isEditing?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    saving?: boolean;
}

interface RestaurantDetailProps {
    setHeaderData?: (data: HeaderData | null) => void;
}

const TIME_OPTIONS = [
    { value: 'Closed', label: 'Closed' }
];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        let ampm = h >= 12 ? 'PM' : 'AM';
        let hour12 = h % 12 || 12;
        let mins = m === 0 ? '00' : '30';
        let timeStr = `${hour12.toString().padStart(2, '0')}:${mins} ${ampm}`;
        TIME_OPTIONS.push({ value: timeStr, label: timeStr });
    }
}

export default function RestaurantDetail({ setHeaderData }: RestaurantDetailProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [admins, setAdmins] = useState<AdminProfile[]>([]);
    const [billingPlans, setBillingPlans] = useState<BillingPlans>({ plans: [], trials: [] });
    const [activeTab, setActiveTab] = useState<string>('stats');

    // Payments list state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(8);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Restaurant>>({});
    const [saving, setSaving] = useState<boolean>(false);

    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
    const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);

    useEffect(() => {
        if (id) {
            fetchRestaurantDetails();
        }
        return () => {
            setHeaderData && setHeaderData(null);
        };
    }, [id]);

    const fetchMenuData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                supabase.from('menu_categories').select('*').eq('restaurant_id', id).order('sort_order'),
                supabase.from('menu_items').select('*').eq('restaurant_id', id)
            ]);
            setCategories(catRes.data || []);
            setMenuItems(itemRes.data || []);
        } catch (err: unknown) {
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
        } catch (err: unknown) {
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

            const fetchAdmins = async () => {
                try {
                    const { data: adminData, error: adminError } = await supabase
                        .from('restaurant_users')
                        .select(`
                            role,
                            profiles (
                                id,
                                name,
                                email,
                                avatar_url
                            )
                        `)
                        .eq('restaurant_id', id)
                        .eq('role', 'admin');

                    if (adminError) throw adminError;
                    setAdmins((adminData?.map(d => Array.isArray(d.profiles) ? d.profiles[0] : d.profiles) as unknown as AdminProfile[]).filter(Boolean) || []);
                } catch (err: unknown) {
                    console.error('Failed to fetch admins:', err);
                }
            };

            const fetchBillingPlans = async () => {
                try {
                    const { data, error } = await supabase
                        .from('platform_settings')
                        .select('config')
                        .eq('id', 'billing_plans')
                        .maybeSingle();
                    if (!error && data?.config) {
                        setBillingPlans(data.config);
                    }
                } catch (err: unknown) {
                    console.error('Failed to fetch billing plans:', err);
                }
            };

            await Promise.all([fetchMenuData(), fetchPayments(), fetchAdmins(), fetchBillingPlans()]);
        } catch (err: unknown) {
            setError('Failed to fetch restaurant details: ' + (err instanceof Error ? err.message : String(err)));
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
                    latitude: formData.latitude ? parseFloat(String(formData.latitude)) : null,
                    longitude: formData.longitude ? parseFloat(String(formData.longitude)) : null,
                    allowed_radius: formData.allowed_radius ? parseInt(String(formData.allowed_radius)) : 100,
                    status: formData.status,
                    operating_hours_weekdays: formData.operating_hours_weekdays || '09:00 AM - 10:00 PM',
                    operating_hours_weekends: formData.operating_hours_weekends || '09:00 AM - 10:00 PM',
                    cover_image_url: formData.cover_image_url,
                    website_url: formData.website_url,
                    instagram_url: formData.instagram_url,
                    facebook_url: formData.facebook_url,
                    manifesto: formData.manifesto,
                    opening_date: formData.opening_date || null
                })
                .eq('id', id);

            if (error) throw error;
            setEditingCard(null);
            fetchRestaurantDetails();
        } catch (err: unknown) {
            setError('Failed to save changes: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(restaurant);
        setEditingCard(null);
    };

    useEffect(() => {
        if (setHeaderData) {
            if (restaurant) {
                setHeaderData({
                    id: restaurant.id,
                    name: restaurant.name,
                    logo_url: restaurant.logo_url,
                    status: restaurant.status,
                    backPath: '/restaurants',
                    backTitle: 'Back to Restaurants'
                });
            } else if (location.state?.name) {
                setHeaderData({
                    id,
                    name: location.state.name,
                    logo_url: location.state.logo_url,
                    status: location.state.status || 'active',
                    backPath: '/restaurants',
                    backTitle: 'Back to Restaurants'
                });
            }
        }
    }, [restaurant, location.state, id, setHeaderData]);

    const updateField = (field: keyof Restaurant, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <DetailPageSkeleton />;
    }

    if (error || !restaurant) {
        return (
            <div className="animate-fade-in p-8 text-center">
                <AlertCircle size={48} className="text-red-500 opacity-50 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold mb-2">Restaurant Not Found</h2>
                <p className="text-text-muted mb-6">{error || 'The requested restaurant could not be located.'}</p>
                <button onClick={() => navigate('/restaurants')} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-black font-bold rounded-xl mx-auto shadow-sm hover:shadow-md transition-all border-none cursor-pointer">
                    <ChevronLeft size={18} /> Back to Restaurants
                </button>
            </div>
        );
    }

    const filteredPayments = payments
        .filter(p => {
            const matchesSearch = (p.id ? String(p.id).toLowerCase() : '').includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'amount') return Number(b.amount) - Number(a.amount);
            if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
            return 0;
        });

    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / perPage));
    const safePage = Math.min(page, totalPages);
    const pagedPayments = filteredPayments.slice((safePage - 1) * perPage, safePage * perPage);

    const getPaginationPages = () => {
        if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (safePage === totalPages) return [1, '...', totalPages];
        if (safePage === totalPages - 1) return [safePage - 1, safePage, totalPages];
        return [safePage, '...', totalPages];
    };

    const toggleSort = (newSort: string) => {
        if (sortBy === newSort) setSortBy(newSort === 'newest' ? 'oldest' : 'newest');
        else setSortBy(newSort);
    };

    const getSortIcon = (field: string) => {
        if (sortBy === field) return <ArrowUp size={14} />;
        if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
        return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    };

    const handleExportPayments = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "ID,Date,Duration,Status,Amount\n"
            + filteredPayments.map(p => `${p.id},${formatDate(p.created_at)},${p.plan_duration} Days,${p.status},${p.amount}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `payments_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderCardHeader = (title: string, cardId: string) => (
        <CardHeader>
            <div className="flex justify-between items-center w-full">
                <CardTitle className="m-0">{title}</CardTitle>
                {editingCard === cardId ? (
                    <div className="flex gap-2">
                        <button onClick={handleCancel} className="px-3 py-1 text-sm bg-surface-hover text-text-muted rounded-lg flex items-center gap-1 hover:bg-border transition-colors border-none cursor-pointer" disabled={saving}><CloseIcon size={14} /> Cancel</button>
                        <button onClick={handleSave} className="px-3 py-1 text-sm bg-accent-primary text-black font-bold rounded-lg flex items-center gap-1 hover:shadow-md transition-all border-none cursor-pointer" disabled={saving}>
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save</>}
                        </button>
                    </div>
                ) : (
                    <button onClick={() => { setFormData(restaurant); setEditingCard(cardId); }} className="px-2 py-1 text-sm font-semibold text-accent-primary flex items-center gap-1.5 rounded-md hover:bg-accent-primary/10 transition-colors border-none bg-transparent cursor-pointer">
                        <Edit size={14} /> Edit
                    </button>
                )}
            </div>
        </CardHeader>
    );

    const renderField = (label: string | null, field: keyof Restaurant, cardId: string, type = 'text', options: {value: string, label: string}[] = []) => {
        const isEditingCard = editingCard === cardId;
        return (
            <div className="flex-1 w-full space-y-1">
                {label && <label className="text-xs text-text-muted uppercase tracking-wider mb-0.5 block">{label}</label>}
                {isEditingCard && type !== 'static' ? (
                    type === 'select' ? (
                        <select
                            value={formData[field] || ''}
                            onChange={(e) => updateField(field, e.target.value)}
                            className="w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                        >
                            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : type === 'time-range' ? (
                        <div className="flex items-center gap-4">
                            <select
                                value={formData[field] === 'Closed' ? 'Closed' : ((formData[field] as string)?.split(' - ')[0] || '09:00 AM')}
                                onChange={(e) => {
                                    const currentEnd = (formData[field] as string)?.split(' - ')[1] || '10:00 PM';
                                    const newVal = e.target.value === 'Closed' ? 'Closed' : `${e.target.value} - ${currentEnd}`;
                                    updateField(field, newVal);
                                }}
                                className="flex-1 bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                            >
                                {TIME_OPTIONS.map(opt => <option key={`start-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <span className="text-sm text-text-muted">to</span>
                            <select
                                value={(formData[field] as string)?.split(' - ')[1] || '10:00 PM'}
                                onChange={(e) => {
                                    const currentStart = formData[field] === 'Closed' ? '09:00 AM' : ((formData[field] as string)?.split(' - ')[0] || '09:00 AM');
                                    const newVal = formData[field] === 'Closed' ? 'Closed' : `${currentStart} - ${e.target.value}`;
                                    updateField(field, newVal);
                                }}
                                className="flex-1 bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                                disabled={formData[field] === 'Closed'}
                            >
                                {TIME_OPTIONS.map(opt => <option key={`end-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    ) : (
                        <input
                            type={type}
                            value={formData[field] || ''}
                            onChange={(e) => updateField(field, e.target.value)}
                            className="w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                            placeholder={label ? `Enter ${label.toLowerCase()}` : ''}
                        />
                    )
                ) : (
                    <div className="text-base font-semibold">
                        {field === 'status' ? <Badge className="text-white border-none" style={{ background: STATUS_COLORS[restaurant.status] }}>{restaurant.status.toUpperCase()}</Badge> : (restaurant[field] || '—')}
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
        rejected: '#71717a',
    };

    return (
        <div className="animate-fade-in max-w-[1100px] mx-auto pb-16">


            {/* Tabs Navigation */}
            <div className="flex gap-10 border-b border-border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {[
                    { id: 'stats', label: 'Stats', icon: Activity },
                    { id: 'orders', label: 'Transaction History', icon: ShoppingBag },
                    { id: 'billing', label: 'Subscription History', icon: CreditCard },
                    { id: 'general', label: 'General Info', icon: Info }
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
                {['general', 'branding', 'story', 'admin'].includes(activeTab) && (
                    <RestaurantProfileView
                        restaurant={restaurant}
                        formData={formData}
                        updateField={updateField}
                        saving={saving}
                        handleSave={handleSave}
                        handleCancel={handleCancel}
                        editingCard={editingCard}
                        setEditingCard={setEditingCard}
                        activeTab={activeTab}
                    />
                )}

                {activeTab === 'menu' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <Card>
                                <CardHeader><CardTitle>Menu Overview</CardTitle></CardHeader>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface-hover p-4 rounded-2xl text-center">
                                        <div className="text-3xl font-extrabold text-text-main">{menuItems.length}</div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Items</div>
                                    </div>
                                    <div className="bg-surface-hover p-4 rounded-2xl text-center">
                                        <div className="text-3xl font-extrabold text-text-main">{categories.length}</div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Categories</div>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <CardHeader className="flex justify-between items-center w-full">
                                    <CardTitle className="m-0">Categories</CardTitle>
                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAddCategoryOpen(true); }} className="text-accent-primary font-semibold text-sm bg-transparent border-none flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-accent-primary/10 transition-colors">
                                        <Plus size={14} /> Add
                                    </button>
                                </CardHeader>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <Badge key={cat.id} variant={cat.active ? 'success' : 'default'}>{cat.name}</Badge>
                                    ))}
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-8">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle className="m-0">Recent Menu Items</CardTitle>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="info">{menuItems.length} Total</Badge>
                                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAddItemOpen(true); }} className="px-3 py-1.5 bg-accent-primary text-black text-sm font-bold rounded-lg flex items-center gap-1.5 border-none cursor-pointer hover:shadow-md transition-all">
                                                <Plus size={14} /> Add Item
                                            </button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <div className="space-y-3">
                                    {menuItems.slice(0, 5).map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-surface overflow-hidden flex items-center justify-center">
                                                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Box size={20} className="text-text-muted opacity-30" />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="font-semibold text-[15px] text-text-main truncate">{item.name}</div>
                                                    <div className="text-xs text-text-muted truncate">{categories.find(c => c.id === item.category_id)?.name}</div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-extrabold text-base text-text-main">₹{item.price}</div>
                                                <Badge variant={item.is_available ? 'success' : 'warning'} className="text-[10px] px-1.5 py-0.5 mt-0.5">{item.is_available ? 'In Stock' : 'Out'}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (() => {
                    const getPlanName = () => {
                        if (!restaurant?.subscription_plan) return 'NO PLAN SELECTED';
                        const { plans = [], trials = [] } = billingPlans;
                        const plan = plans.find(p => p.id === restaurant.subscription_plan);
                        if (plan) return plan.name.toUpperCase();
                        const trial = trials.find(t => t.id === restaurant.subscription_plan);
                        if (trial) return trial.name.toUpperCase();
                        return restaurant.subscription_plan.toUpperCase().replace(/_/g, ' ');
                    };

                    const isTrial = () => {
                        if (!restaurant?.subscription_plan) return false;
                        const { trials = [] } = billingPlans;
                        if (trials.find(t => t.id === restaurant?.subscription_plan)) return true;
                        return false;
                    };

                    const planName = getPlanName();
                    const isLite = planName === 'NO PLAN SELECTED';

                    let badgeText = '';
                    let badgeVariant = '';

                    if (restaurant?.subscription_status === 'active') {
                        badgeText = 'ACTIVE & PAID';
                        badgeVariant = 'success';
                    } else if (restaurant?.subscription_status === 'trial') {
                        badgeText = 'TRIAL PERIOD';
                        badgeVariant = 'warning';
                    } else if (restaurant?.subscription_status === 'inactive' && isLite) {
                        badgeText = 'FREE TIER (ACTIVE)';
                        badgeVariant = 'info';
                    } else {
                        badgeText = 'EXPIRED / INACTIVE';
                        badgeVariant = 'error';
                    }

                    return (
                        <div className="flex flex-col gap-6">


                            <div className="w-full space-y-3">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
                                    <div className="relative w-full md:max-w-[260px] shrink-0">
                                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search Payments..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
                                        {(searchQuery || filterStatus !== 'all' || sortBy !== 'newest') ? (
                                            <>
                                                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                                                {searchQuery && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                                        "{searchQuery}"
                                                        <button onClick={() => setSearchQuery('')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                                    </span>
                                                )}
                                                {filterStatus !== 'all' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                                        {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                                        <button onClick={() => setFilterStatus('all')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                                    </span>
                                                )}
                                                {sortBy !== 'newest' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                                        {sortBy === 'oldest' ? 'Oldest' : sortBy === 'amount' ? 'Amount' : sortBy === 'status' ? 'Status' : sortBy}
                                                        <button onClick={() => setSortBy('newest')} className="hover:text-blue-800 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => { setSearchQuery(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); }}
                                                    className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0"
                                                >
                                                    Clear
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between md:justify-start gap-1 shrink-0 md:border-x md:border-border/50 px-3 py-1.5 md:py-0 w-full md:w-auto">
                                        <button onClick={() => setPage(p => Math.max(1, Number(p) - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                                            <ChevronLeft size={14} />
                                        </button>
                                        <div className="flex items-center justify-center gap-1 w-[80px]">
                                            {getPaginationPages().map((p, i) => p === '...' ? (
                                                <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
                                            ) : (
                                                <button key={p} onClick={() => setPage(Number(p))} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p}</button>
                                            ))}
                                        </div>
                                        <button onClick={() => setPage(p => Math.min(totalPages, Number(p) + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                                        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
                                            {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                                        </select>
                                        <div className="relative group flex-1 md:flex-none">
                                            <button
                                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
                                            >
                                                <Filter size={14} className="text-accent-primary" /> Filter
                                            </button>
                                            <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                                                }`}>
                                                {['all', 'paid', 'pending', 'error'].map(status => (
                                                    <button key={status} onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterStatus === status ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleExportPayments}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-hover transition-colors text-[12px] font-medium shadow-sm cursor-pointer border-none flex-1 md:flex-none"
                                        >
                                            <Download size={14} /> Export
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-[700px]">
                                            <thead>
                                                <tr className="border-b border-border bg-surface-hover/30">
                                                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[30%]" onClick={() => toggleSort('newest')}>
                                                        <div className="flex items-center gap-2 cursor-pointer">Date {getSortIcon('newest')}</div>
                                                    </th>
                                                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]">Duration</th>
                                                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]" onClick={() => toggleSort('status')}>
                                                        <div className="flex items-center gap-2 cursor-pointer">Status {getSortIcon('status')}</div>
                                                    </th>
                                                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[30%] text-right" onClick={() => toggleSort('amount')}>
                                                        <div className="flex items-center justify-end gap-2 cursor-pointer">Amount {getSortIcon('amount')}</div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPayments.length === 0 ? (
                                                    <tr><td colSpan={4} className="text-center py-12 text-text-muted text-[13px]">No payment records found matching your criteria.</td></tr>
                                                ) : (
                                                    pagedPayments.map(payment => (
                                                        <tr
                                                            key={payment.id}
                                                            onClick={() => navigate(`/subscriptions/${payment.id}`)}
                                                            className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 cursor-pointer transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-[13px] text-text-main">{formatDate(payment.created_at)}</td>
                                                            <td className="py-3 px-4 text-[13px] text-text-muted">{payment.plan_duration} Days</td>
                                                            <td className="py-3 px-4 text-[13px]">
                                                                <Badge variant={payment.status === 'paid' ? 'success' : (payment.status === 'pending' ? 'warning' : 'error')}>
                                                                    {payment.status.toUpperCase()}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 px-4 text-[13px] font-semibold text-text-main text-right">₹{Number(payment.amount).toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {(activeTab === 'orders' || activeTab === 'stats') && (
                    <OrderHistoryTab restaurantId={id} viewMode={activeTab} />
                )}

                {activeTab === 'branding' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-6 flex flex-col gap-6">
                            <Card>
                                {renderCardHeader("Color Palette", "branding")}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-surface-hover text-center">
                                        <div className="w-8 h-8 rounded-full mx-auto mb-2 border-[3px] border-border" style={{ background: restaurant.primary_color }} />
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Primary</div>
                                        {editingCard === 'branding' ? renderField(null, "primary_color", "branding") : <div className="font-bold text-sm text-text-main">{restaurant.primary_color}</div>}
                                    </div>
                                    <div className="p-5 rounded-2xl bg-surface-hover text-center">
                                        <div className="w-8 h-8 rounded-full mx-auto mb-2 border-[3px] border-border" style={{ background: restaurant.secondary_color }} />
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Secondary</div>
                                        {editingCard === 'branding' ? renderField(null, "secondary_color", "branding") : <div className="font-bold text-sm text-text-main">{restaurant.secondary_color}</div>}
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                {renderCardHeader("Geofencing", "geo")}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {renderField("Latitude", "latitude", "geo")}
                                        {renderField("Longitude", "longitude", "geo")}
                                    </div>
                                    <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                        <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-2">
                                            <MapPin size={16} /> Allowed Radius
                                        </div>
                                        <div>
                                            {editingCard === 'geo' ? renderField(null, "allowed_radius", "geo", "number") : <div className="text-2xl font-extrabold text-text-main">{restaurant.allowed_radius} <span className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">meters</span></div>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-6">
                            <Card>
                                {renderCardHeader("Visual Assets", "logo")}
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Restaurant Logo</div>
                                        <div className="w-full h-40 rounded-2xl bg-surface-hover flex items-center justify-center overflow-hidden border border-border">
                                            {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" className="max-w-full max-h-full object-contain" /> : <ImageIcon size={48} className="text-text-muted opacity-20" />}
                                        </div>
                                        {editingCard === 'logo' && <div className="mt-4">{renderField("Logo URL", "logo_url", "logo")}</div>}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            <QuickAddCategoryDrawer
                isOpen={isAddCategoryOpen}
                onClose={() => setIsAddCategoryOpen(false)}
                restaurantId={id}
                onSuccess={fetchMenuData}
            />
            <QuickAddMenuItemDrawer
                isOpen={isAddItemOpen}
                onClose={() => setIsAddItemOpen(false)}
                restaurantId={id}
                categories={categories}
                onSuccess={fetchMenuData}
                onAddCategory={() => setIsAddCategoryOpen(true)}
            />
        </div>
    );
}
