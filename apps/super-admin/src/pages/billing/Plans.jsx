import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle, Zap, Award, Sparkles, Clock, Calendar, AlertCircle, Edit, Save, Trash2, Plus, X, RefreshCw } from 'lucide-react';

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

export default function Plans({ setSyncAction }) {
    const [plans, setPlans] = useState([]);
    const [editedPlans, setEditedPlans] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    
    // Feature temp states
    const [newFeatureText, setNewFeatureText] = useState({});

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

    if (loading) {
        return (
            <div className="text-center py-24">
                <RefreshCw className="animate-spin text-accent-primary mx-auto" size={32} />
                <p className="mt-4 text-text-muted">Loading platform billing configurations...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12">
            {/* Header controls bar */}
            <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold mb-1">Pricing & Billing Plans</h2>
                    <p className="text-text-muted text-[13px] m-0">
                        Currently synchronized with Supabase <code className="bg-surface-hover px-1.5 py-0.5 rounded-md">platform_settings</code>.
                    </p>
                </div>
                {!isEditing ? (
                    <button onClick={handleStartEdit} className="bg-accent-primary/10 text-accent-primary border border-accent-primary/20 px-5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 cursor-pointer hover:bg-accent-primary/20 transition-colors">
                        <Edit size={16} /> Edit Pricing Plans
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={handleCancelEdit} className="bg-surface-hover border border-border text-text-muted px-5 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-border transition-colors">
                            <X size={16} /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} className="bg-accent-primary text-white border-none px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:bg-emerald-600 transition-colors disabled:opacity-70">
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} 
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

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
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                        {plans.map(plan => {
                            const IconComponent = ICON_MAP[plan.iconName] || Clock;
                            const perMonth = Math.round(plan.price / plan.duration);

                            return (
                                <div
                                    key={plan.id}
                                    className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between min-h-[440px] relative transition-transform hover:-translate-y-1"
                                    style={{
                                        border: plan.recommended ? `2px solid ${plan.color}` : '1px solid var(--border-color)',
                                    }}
                                >
                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${plan.color}15`, color: plan.color }}>
                                                <IconComponent size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-bold m-0">{plan.name}</h3>
                                                    {plan.recommended && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase whitespace-nowrap text-white" style={{ background: plan.color }}>
                                                            Best Value
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-muted m-0 mt-1">{plan.description}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-extrabold" style={{ color: plan.color }}>₹{plan.price.toLocaleString('en-IN')}</span>
                                                <span className="text-sm text-text-muted">/ {plan.duration} {plan.duration === 1 ? 'Month' : 'Months'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs text-text-muted font-semibold">₹{perMonth}/month</span>
                                                {plan.savings > 0 && (
                                                    <span className="text-[11px] bg-emerald-500/15 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                                        Save {plan.savings}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2.5 mb-8">
                                            {plan.features?.map(f => (
                                                <div key={f} className="flex items-center gap-2.5">
                                                    <CheckCircle size={14} className="shrink-0" style={{ color: plan.color }} />
                                                    <span className="text-sm text-text-main">{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border text-xs text-text-muted">
                                        Plan key: <code className="bg-surface-hover px-1.5 py-0.5 rounded-md">{plan.id}</code>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 mt-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                        <div className="text-[13px] text-text-muted leading-relaxed">
                            <strong className="text-text-main">ℹ️ Pricing Synchronization</strong><br />
                            These tiers mirror the exact subscription models processed via Razorpay in the restaurant dashboard. Subscriptions are processed securely and credited instantly to restaurant profiles upon checkout completion.
                        </div>
                    </div>
                </>
            ) : (
                /* Editable Form Grid */
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-6">
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
