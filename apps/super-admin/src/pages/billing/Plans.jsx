import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle, Zap, Award, Sparkles, Clock, Calendar, AlertCircle, Trash2, Plus } from 'lucide-react';
import { PlansPageSkeleton } from '../../components/ui/Skeleton';

const ICON_MAP = {
    Clock: Clock,
    Zap: Zap,
    Sparkles: Sparkles,
    Award: Award,
    Calendar: Calendar
};

const COLOR_OPTIONS = [
    { value: '#1e40af', label: 'Deep Blue' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#059669', label: 'Forest Green' },
    { value: '#6d28d9', label: 'Deep Purple' },
    { value: '#d97706', label: 'Amber/Orange' },
    { value: '#dc2626', label: 'Red' }
];

const DEFAULT_PLANS = [
    {
        id: '1_month',
        name: '1 Month Package',
        price: 499,
        duration: 1,
        savings: 0,
        color: '#1e40af',
        description: 'Flexible short-term access to get started quickly.',
        features: [
            'QR Table Ordering & Menu',
            'Live Order Management',
            'Sales & Revenue Analytics',
            'Customer Web-App Access',
            'Multi-Staff Dashboard',
        ],
        iconName: 'Clock',
    },
    {
        id: '3_months',
        name: '3 Months Package',
        price: 1399,
        duration: 3,
        savings: 7,
        color: '#10b981',
        description: 'Standard medium-term package for growing outlets.',
        features: [
            'Everything in 1 Month',
            'Live Order Management',
            'Sales & Revenue Analytics',
            'Customer Web-App Access',
            'Multi-Staff Dashboard',
        ],
        iconName: 'Zap',
    },
    {
        id: '6_months',
        name: '6 Months Package',
        price: 2699,
        duration: 6,
        savings: 10,
        color: '#059669',
        description: 'Best-value mid-term plan designed for optimal growth.',
        features: [
            'Everything in 3 Months',
            'Live Order Management',
            'Sales & Revenue Analytics',
            'Customer Web-App Access',
            'Multi-Staff Dashboard',
        ],
        iconName: 'Sparkles',
        recommended: true,
    },
    {
        id: '12_months',
        name: '12 Months Package',
        price: 4999,
        duration: 12,
        savings: 16,
        color: '#6d28d9',
        description: 'Ultimate long-term security with maximum savings.',
        features: [
            'Everything in 6 Months',
            'Live Order Management',
            'Sales & Revenue Analytics',
            'Customer Web-App Access',
            'Multi-Staff Dashboard',
        ],
        iconName: 'Award',
    },
];

export default function Plans({ setSyncAction, setHeaderData }) {
    const [plans, setPlans] = useState([]);
    const [editedPlans, setEditedPlans] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    
    // Feature temp states
    const [newFeatureText, setNewFeatureText] = useState({});

    const saveRef = useRef(null);
    const cancelRef = useRef(null);
    const startEditRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('platform_settings')
                .select('config')
                .eq('id', 'billing_plans')
                .maybeSingle();

            if (err) throw err;

            if (data?.config?.plans) {
                setPlans(data.config.plans);
            } else {
                setPlans(DEFAULT_PLANS);
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
            setError('Failed to fetch pricing plans from the database. Using defaults.');
            setPlans(DEFAULT_PLANS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (setSyncAction) {
            setSyncAction({ onSync: fetchData, loading });
        }
    }, [loading, setSyncAction]);

    const handleStartEdit = () => {
        setEditedPlans(JSON.parse(JSON.stringify(plans)));
        setIsEditing(true);
        setError(null);
        setSuccessMsg(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedPlans([]);
        setError(null);
    };

    const handlePlanChange = (index, field, value) => {
        const updated = [...editedPlans];
        updated[index][field] = value;
        setEditedPlans(updated);
    };

    const handleFeatureDelete = (planIndex, featureIndex) => {
        const updated = [...editedPlans];
        updated[planIndex].features = updated[planIndex].features.filter((_, idx) => idx !== featureIndex);
        setEditedPlans(updated);
    };

    const handleFeatureAdd = (planIndex) => {
        const text = newFeatureText[planIndex]?.trim();
        if (!text) return;

        const updated = [...editedPlans];
        updated[planIndex].features = [...updated[planIndex].features, text];
        setEditedPlans(updated);
        
        setNewFeatureText(prev => ({ ...prev, [planIndex]: '' }));
    };

    const handleAddPlan = () => {
        const newPlan = {
            id: `plan_${Date.now()}`,
            name: 'New Pricing Package',
            price: 999,
            duration: 30,
            savings: 0,
            color: '#1e40af',
            description: 'Custom plan description here.',
            features: ['Core QR Ordering System'],
            iconName: 'Zap'
        };
        setEditedPlans([...editedPlans, newPlan]);
    };

    const handleDeletePlan = (index) => {
        if (!window.confirm('Are you sure you want to delete this pricing plan? Restaurants will no longer be able to subscribe to it.')) return;
        const updated = editedPlans.filter((_, idx) => idx !== index);
        setEditedPlans(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        // Validation
        for (const plan of editedPlans) {
            if (!plan.name.trim()) {
                setError('All plans must have a name.');
                setSaving(false);
                return;
            }
            if (!plan.id.trim()) {
                setError('All plans must have a unique identifier key.');
                setSaving(false);
                return;
            }
            if (plan.price < 0 || plan.duration <= 0) {
                setError('Prices must be positive and duration must be at least 1 day.');
                setSaving(false);
                return;
            }
        }

        try {
            const { error: err } = await supabase
                .from('platform_settings')
                .upsert(
                    { 
                        id: 'billing_plans', 
                        config: { plans: editedPlans }, 
                        updated_at: new Date().toISOString() 
                    }, 
                    { onConflict: 'id' }
                );

            if (err) throw err;

            setPlans(editedPlans);
            setIsEditing(false);
            setSuccessMsg('🎉 Pricing plans successfully synchronized to the database!');
        } catch (err) {
            console.error('Error saving plans:', err);
            setError(err.message || 'Failed to save changes. Please verify permissions.');
        } finally {
            setSaving(false);
        }
    };

    saveRef.current = handleSave;
    cancelRef.current = handleCancelEdit;
    startEditRef.current = handleStartEdit;

    useEffect(() => {
        if (!setHeaderData || loading) return;

        setHeaderData({
            name: 'Pricing Plans',
            showAvatar: false,
            onEdit: !isEditing ? () => startEditRef.current?.() : null,
            isEditing,
            onSave: () => saveRef.current?.(),
            onCancel: () => cancelRef.current?.(),
            saving,
            editLabel: 'Edit Pricing Plans',
        });

        return () => setHeaderData(null);
    }, [loading, isEditing, saving, setHeaderData]);

    if (loading) {
        return <PlansPageSkeleton />;
    }

    return (
        <div className="animate-fade-in pb-12">
            {/* Error / Success banners */}
            {error && (
                <div className="px-5 py-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm flex items-center gap-2.5 mb-8">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {successMsg && (
                <div className="px-5 py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5 mb-8">
                    <CheckCircle size={18} className="text-emerald-500" /> {successMsg}
                </div>
            )}

            {/* Active Plans Display (Read-Only) */}
            {!isEditing ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {plans.map(plan => {
                            const IconComponent = ICON_MAP[plan.iconName] || Clock;
                            const perMonth = Math.round(plan.price / plan.duration);

                            return (
                                <div
                                    key={plan.id}
                                    className="relative bg-surface rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl"
                                    style={{ border: plan.recommended ? `2px solid ${plan.color}` : '1px solid #e5e7eb', boxShadow: plan.recommended ? `0 8px 32px ${plan.color}22` : '0 2px 12px rgba(0,0,0,0.04)' }}
                                >
                                    {/* Recommended ribbon */}
                                    {plan.recommended && (
                                        <div className="absolute top-4 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-l-full uppercase tracking-wider z-10" style={{ background: plan.color }}>
                                            Best Value
                                        </div>
                                    )}

                                    {/* Color top band */}
                                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${plan.color}, ${plan.color}88)` }} />

                                    <div className="p-6 flex flex-col flex-1">
                                        {/* Icon + Title */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${plan.color}18`, color: plan.color }}>
                                                <IconComponent size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-[15px] font-bold text-text-main m-0 leading-tight">{plan.name}</h3>
                                                <p className="text-[11px] text-text-muted m-0 mt-0.5 leading-snug">{plan.description}</p>
                                            </div>
                                        </div>

                                        {/* Pricing */}
                                        <div className="mb-5 pb-5 border-b border-border">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-[38px] font-extrabold leading-none" style={{ color: plan.color }}>₹{plan.price.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[12px] text-text-muted font-medium">{plan.duration} {plan.duration === 1 ? 'month' : 'months'} · ₹{perMonth}/mo</span>
                                                {plan.savings > 0 && (
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${plan.color}18`, color: plan.color }}>
                                                        Save {plan.savings}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className="flex flex-col gap-2 flex-1">
                                            {plan.features?.map(f => (
                                                <div key={f} className="flex items-start gap-2.5">
                                                    <CheckCircle size={13} className="shrink-0 mt-0.5" style={{ color: plan.color }} />
                                                    <span className="text-[12px] text-text-main leading-snug">{f}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                                            <code className="text-[10px] text-text-muted bg-surface-hover px-1.5 py-0.5 rounded">{plan.id}</code>
                                            <span className="text-[11px] font-semibold" style={{ color: plan.color }}>{plan.duration}M Plan</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    
                </>
            ) : (
                /* Editable Form Grid */
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {editedPlans.map((plan, idx) => {
                            return (
                                <div
                                    key={plan.id}
                                    className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 relative animate-fade-in"
                                    style={{
                                        border: `2px dashed ${plan.color}`,
                                    }}
                                >
                                    {/* Delete Plan Icon */}
                                    <button 
                                        onClick={() => handleDeletePlan(idx)}
                                        className="absolute top-5 right-5 bg-red-500/10 text-red-600 border border-red-500/20 p-2 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                                        title="Delete Plan"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <h3 className="text-base font-bold mb-5 border-b border-border pb-2.5 flex items-center gap-2.5">
                                        <Badge style={{ background: plan.color, color: 'white' }}>Plan #{idx + 1}</Badge>
                                        Editing {plan.name || 'Untitled Plan'}
                                    </h3>

                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-text-muted">Package Name</label>
                                            <input 
                                                value={plan.name} 
                                                onChange={e => handlePlanChange(idx, 'name', e.target.value)}
                                                className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary"
                                                placeholder="e.g. 6 Months Package"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Price (₹)</label>
                                                <input 
                                                    type="number"
                                                    value={plan.price} 
                                                    onChange={e => handlePlanChange(idx, 'price', parseInt(e.target.value) || 0)}
                                                    className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Duration (Months)</label>
                                                <input 
                                                    type="number"
                                                    value={plan.duration} 
                                                    onChange={e => handlePlanChange(idx, 'duration', parseInt(e.target.value) || 1)}
                                                    className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Savings %</label>
                                                <input 
                                                    type="number"
                                                    value={plan.savings || 0} 
                                                    onChange={e => handlePlanChange(idx, 'savings', parseInt(e.target.value) || 0)}
                                                    className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Best Value Tag</label>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <input 
                                                        type="checkbox"
                                                        id={`rec-${plan.id}`}
                                                        checked={!!plan.recommended}
                                                        onChange={e => handlePlanChange(idx, 'recommended', e.target.checked)}
                                                        className="w-4 h-4 cursor-pointer"
                                                    />
                                                    <label htmlFor={`rec-${plan.id}`} className="text-[13px] cursor-pointer text-text-main">Featured Plan</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Visual Icon</label>
                                                <select 
                                                    value={plan.iconName || 'Zap'}
                                                    onChange={e => handlePlanChange(idx, 'iconName', e.target.value)}
                                                    className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary"
                                                >
                                                    {Object.keys(ICON_MAP).map(k => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Color Theme</label>
                                                <select 
                                                    value={plan.color}
                                                    onChange={e => handlePlanChange(idx, 'color', e.target.value)}
                                                    className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary"
                                                >
                                                    {COLOR_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-text-muted">Short Description</label>
                                            <textarea 
                                                value={plan.description} 
                                                onChange={e => handlePlanChange(idx, 'description', e.target.value)}
                                                rows={2}
                                                className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-accent-primary resize-y"
                                                placeholder="e.g. Standard medium-term package..."
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-text-muted">Features list</label>
                                            <div className="flex flex-col gap-1.5 mt-1.5 max-h-48 overflow-y-auto">
                                                {plan.features?.map((f, fIdx) => (
                                                    <div key={fIdx} className="flex items-center gap-1.5 bg-surface-hover px-2 py-1 rounded-md">
                                                        <span className="flex-1 text-xs text-text-main">{f}</span>
                                                        <button 
                                                            onClick={() => handleFeatureDelete(idx, fIdx)}
                                                            className="border-none bg-transparent text-red-600 p-0.5 cursor-pointer hover:bg-red-500/10 rounded"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Add feature line */}
                                            <div className="flex gap-1.5 mt-2">
                                                <input 
                                                    value={newFeatureText[idx] || ''}
                                                    onChange={e => setNewFeatureText(prev => ({ ...prev, [idx]: e.target.value }))}
                                                    placeholder="Add feature..."
                                                    className="flex-1 px-2 py-1 text-xs border border-dashed border-border rounded bg-surface text-text-main focus:outline-none focus:border-accent-primary"
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFeatureAdd(idx); } }}
                                                />
                                                <button 
                                                    onClick={() => handleFeatureAdd(idx)}
                                                    className="bg-accent-primary border-none text-white px-2.5 py-1 rounded text-xs font-semibold cursor-pointer hover:bg-emerald-600"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-[11px] text-text-muted pt-3 border-t border-border flex justify-between items-center mt-2">
                                            <span>Identifier Key: <strong>{plan.id}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add New Plan Card */}
                        <div
                            onClick={handleAddPlan}
                            className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center min-h-[440px] cursor-pointer transition-colors bg-black/5 hover:border-accent-primary hover:bg-emerald-500/5 group"
                        >
                            <Plus size={36} className="text-text-muted mb-3 group-hover:text-accent-primary transition-colors" />
                            <span className="font-semibold text-[15px] text-text-main">Create New Pricing Plan</span>
                            <span className="text-xs text-text-muted mt-1">Add a customizable duration package</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
