import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Store, Globe, Mail, Phone, Calendar,
    Shield, Activity, CreditCard, MapPin, Settings as SettingsIcon,
    Clock, Tag, Info, AlertTriangle, AlertCircle, Edit, Save, X as CloseIcon, Loader2,
    Utensils, Layers, List, ArrowUpRight, CheckCircle2, XCircle, Timer,
    Hash, Map, Palette, Image as ImageIcon, Box, Plus, BookOpen, User, ShoppingBag
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import QuickAddCategoryDrawer from '../components/QuickAddCategoryDrawer';
import QuickAddMenuItemDrawer from '../components/QuickAddMenuItemDrawer';
import RestaurantProfileView from '../components/RestaurantProfileView';
import { DetailPageSkeleton } from '../components/ui/Skeleton';
import OrderHistoryTab from '../components/OrderHistoryTab';

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
    const [admins, setAdmins] = useState([]);
    const [activeTab, setActiveTab] = useState('general');

    const [editingCard, setEditingCard] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);

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
        if (setSyncAction && !editingCard) {
            setSyncAction({
                onSync: fetchRestaurantDetails,
                loading: loading
            });
        }
    }, [loading, setSyncAction, editingCard]);

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
                    setAdmins(adminData?.map(d => d.profiles).filter(Boolean) || []);
                } catch (err) {
                    console.error('Failed to fetch admins:', err);
                }
            };

            await Promise.all([fetchMenuData(), fetchPayments(), fetchAdmins()]);
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
                    operating_hours_weekdays: formData.operating_hours_weekdays || '09:00 AM - 10:00 PM',
                    operating_hours_weekends: formData.operating_hours_weekends || '09:00 AM - 10:00 PM',
                    slug: formData.slug,
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
        } catch (err) {
            setError('Failed to save changes: ' + err.message);
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

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                <button onClick={() => navigate('/restaurants')} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-black font-bold rounded-xl mx-auto shadow-sm hover:shadow-md transition-all">
                    <ChevronLeft size={18} /> Back to Restaurants
                </button>
            </div>
        );
    }

    const renderCardHeader = (title, cardId) => (
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

    const renderField = (label, field, cardId, type = 'text', options = []) => {
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
                                value={formData[field] === 'Closed' ? 'Closed' : (formData[field]?.split(' - ')[0] || '09:00 AM')}
                                onChange={(e) => {
                                    const currentEnd = formData[field]?.split(' - ')[1] || '10:00 PM';
                                    const newVal = e.target.value === 'Closed' ? 'Closed' : `${e.target.value} - ${currentEnd}`;
                                    updateField(field, newVal);
                                }}
                                className="flex-1 bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                            >
                                {TIME_OPTIONS.map(opt => <option key={`start-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <span className="text-sm text-text-muted">to</span>
                            <select
                                value={formData[field]?.split(' - ')[1] || '10:00 PM'}
                                onChange={(e) => {
                                    const currentStart = formData[field] === 'Closed' ? '09:00 AM' : (formData[field]?.split(' - ')[0] || '09:00 AM');
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
        active:    '#10b981',
        approved:  '#3b82f6',
        pending:   '#f59e0b',
        suspended: '#ef4444',
        rejected:  '#71717a',
    };

    return (
        <div className="animate-fade-in max-w-[1100px] mx-auto pb-16">


            {/* Tabs Navigation */}
            <div className="flex gap-10 border-b border-border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {[
                    { id: 'general', label: 'General Info', icon: Info },
                    { id: 'branding', label: 'Location & Branding', icon: Palette },
                    { id: 'story', label: 'Story & Socials', icon: BookOpen },
                    { id: 'admin', label: 'Admin Profile', icon: User },
                    { id: 'menu', label: 'Menu & Catalog', icon: Utensils },
                    { id: 'billing', label: 'Billing & Sub', icon: CreditCard },
                    { id: 'orders', label: 'Order History', icon: ShoppingBag }
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
                        admins={admins}
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
                                        <Badge key={cat.id} variant={cat.active ? 'success' : 'secondary'}>{cat.name}</Badge>
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

                {activeTab === 'billing' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-6">
                            <Card className="bg-gradient-to-br from-surface to-amber-500/5">
                                <CardHeader><CardTitle>Subscription Status</CardTitle></CardHeader>
                                <div className="text-center py-4">
                                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Current Plan</div>
                                    <div className="text-3xl font-extrabold text-amber-500 mt-2">{restaurant.subscription_type?.toUpperCase() || 'LITE PLAN'}</div>
                                    <Badge variant={restaurant.subscription_status ? 'success' : 'warning'} className="mt-3 px-4 py-1.5 text-xs">
                                        {restaurant.subscription_status ? 'ACTIVE & PAID' : 'TRIAL PERIOD'}
                                    </Badge>
                                </div>
                                <div className="space-y-3 mt-4 pt-4 border-t border-border">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">Valid Until</span>
                                        <span className="font-semibold">{restaurant.subscription_end_at ? new Date(restaurant.subscription_end_at).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">Auto Renewal</span>
                                        <Badge variant="secondary">ENABLED</Badge>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle className="m-0">Payment History</CardTitle>
                                        <Badge variant="secondary">{payments.length} Transactions</Badge>
                                    </div>
                                </CardHeader>
                                <div className="space-y-3">
                                    {payments.length > 0 ? (
                                        payments.map((payment) => (
                                            <div 
                                                key={payment.id}
                                                onClick={() => navigate(`/subscriptions/${payment.id}`)}
                                                className="flex items-center justify-between p-4 rounded-xl bg-surface-hover cursor-pointer border border-transparent transition-all hover:border-accent-primary/50 group/payment"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        <CreditCard size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[15px] text-text-main group-hover/payment:text-accent-primary transition-colors">₹{Number(payment.amount).toLocaleString()}</div>
                                                        <div className="text-xs text-text-muted">{new Date(payment.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={payment.status === 'paid' ? 'success' : (payment.status === 'pending' ? 'warning' : 'error')} className="text-[10px] px-1.5 py-0.5">
                                                        {payment.status.toUpperCase()}
                                                    </Badge>
                                                    <div className="text-[11px] font-medium text-text-muted mt-1">
                                                        {payment.plan_duration} Days
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-text-muted">
                                            <Activity size={32} className="opacity-20 mb-4" />
                                            <p className="text-sm">No payment records found for this restaurant.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <OrderHistoryTab restaurantId={id} />
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
