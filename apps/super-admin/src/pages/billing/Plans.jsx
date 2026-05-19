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
            <div style={{ textAlign: 'center', padding: '6rem' }}>
                <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading platform billing configurations...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            {/* Header controls bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Pricing & Billing Plans</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        Currently synchronized with Supabase <code style={{ background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: '4px' }}>platform_settings</code>.
                    </p>
                </div>
                {!isEditing ? (
                    <button onClick={handleStartEdit} style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', border: '1px solid hsla(155,100%,50%,0.2)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, gap: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <Edit size={16} /> Edit Pricing Plans
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={handleCancelEdit} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', gap: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <X size={16} /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} style={{ background: 'var(--accent-primary)', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, gap: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}>
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} 
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {/* Error / Success banners */}
            {error && (
                <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '12px', color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {successMsg && (
                <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', color: '#065f46', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
                    <CheckCircle size={18} style={{ color: '#10b981' }} /> {successMsg}
                </div>
            )}

            {/* Active Plans Display (Read-Only) */}
            {!isEditing ? (
                <>
                    <div className="plans-grid">
                        {plans.map(plan => {
                            const IconComponent = ICON_MAP[plan.iconName] || Clock;
                            const perMonth = Math.round(plan.price / plan.duration);

                            return (
                                <div
                                    key={plan.id}
                                    className="premium-card"
                                    style={{
                                        border: plan.recommended ? `2px solid ${plan.color}` : '1px solid var(--border-color)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        minHeight: '440px'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${plan.color}15`, color: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconComponent size={24} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{plan.name}</h3>
                                                    {plan.recommended && (
                                                        <span style={{
                                                            background: plan.color, color: '#FFFFFF', fontSize: '0.65rem',
                                                            fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                                                            letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap'
                                                        }}>
                                                            Best Value
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>{plan.description}</p>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: plan.color }}>₹{plan.price.toLocaleString('en-IN')}</span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {plan.duration} {plan.duration === 1 ? 'Month' : 'Months'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.35rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>₹{perMonth}/month</span>
                                                {plan.savings > 0 && (
                                                    <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                                                        Save {plan.savings}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' }}>
                                            {plan.features?.map(f => (
                                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <CheckCircle size={14} style={{ color: plan.color, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Plan key: <code style={{ background: 'var(--surface-hover)', padding: '1px 6px', borderRadius: '4px' }}>{plan.id}</code>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="premium-card" style={{ marginTop: '2rem', background: 'rgba(5, 150, 105, 0.05)', border: '1px solid rgba(5, 150, 105, 0.15)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            <strong style={{ color: 'var(--text-main)' }}>ℹ️ Pricing Synchronization</strong><br />
                            These tiers mirror the exact subscription models processed via Razorpay in the restaurant dashboard. Subscriptions are processed securely and credited instantly to restaurant profiles upon checkout completion.
                        </div>
                    </div>
                </>
            ) : (
                /* Editable Form Grid */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                        {editedPlans.map((plan, idx) => {
                            return (
                                <div
                                    key={plan.id}
                                    className="premium-card animate-fade-in"
                                    style={{
                                        border: `2px dashed ${plan.color}`,
                                        position: 'relative',
                                        padding: '1.5rem',
                                        background: 'var(--surface-color)'
                                    }}
                                >
                                    {/* Delete Plan Icon */}
                                    <button 
                                        onClick={() => handleDeletePlan(idx)}
                                        style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                        title="Delete Plan"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Badge style={{ background: plan.color, color: 'white' }}>Plan #{idx + 1}</Badge>
                                        Editing {plan.name || 'Untitled Plan'}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Package Name</label>
                                            <input 
                                                value={plan.name} 
                                                onChange={e => handlePlanChange(idx, 'name', e.target.value)}
                                                style={{ marginTop: '4px', width: '100%', fontSize: '0.85rem' }} 
                                                placeholder="e.g. 6 Months Package"
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Price (₹)</label>
                                                <input 
                                                    type="number"
                                                    value={plan.price} 
                                                    onChange={e => handlePlanChange(idx, 'price', parseInt(e.target.value) || 0)}
                                                    style={{ marginTop: '4px', width: '100%', fontSize: '0.85rem' }} 
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Duration (Months)</label>
                                                <input 
                                                    type="number"
                                                    value={plan.duration} 
                                                    onChange={e => handlePlanChange(idx, 'duration', parseInt(e.target.value) || 1)}
                                                    style={{ marginTop: '4px', width: '100%', fontSize: '0.85rem' }} 
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Savings %</label>
                                                <input 
                                                    type="number"
                                                    value={plan.savings || 0} 
                                                    onChange={e => handlePlanChange(idx, 'savings', parseInt(e.target.value) || 0)}
                                                    style={{ marginTop: '4px', width: '100%', fontSize: '0.85rem' }} 
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Best Value Tag</label>
                                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="checkbox"
                                                        id={`rec-${plan.id}`}
                                                        checked={!!plan.recommended}
                                                        onChange={e => handlePlanChange(idx, 'recommended', e.target.checked)}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                    />
                                                    <label htmlFor={`rec-${plan.id}`} style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Featured Plan</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Visual Icon</label>
                                                <select 
                                                    value={plan.iconName || 'Zap'}
                                                    onChange={e => handlePlanChange(idx, 'iconName', e.target.value)}
                                                    style={{ marginTop: '4px', width: '100%', fontSize: '0.85rem', padding: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                                                >
                                                    {Object.keys(ICON_MAP).map(k => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Color Theme</label>
                                                <select 
                                                    value={plan.color}
                                                    onChange={e => handlePlanChange(idx, 'color', e.target.value)}
                                                    style={{ marginTop: '4px', width: '100%', fontSize: '0.85rem', padding: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                                                >
                                                    {COLOR_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Short Description</label>
                                            <textarea 
                                                value={plan.description} 
                                                onChange={e => handlePlanChange(idx, 'description', e.target.value)}
                                                rows={2}
                                                style={{ marginTop: '4px', width: '100%', fontSize: '0.85rem', padding: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', resize: 'vertical' }}
                                                placeholder="e.g. Standard medium-term package..."
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Features list</label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '6px', maxEndSize: '200px', overflowY: 'auto' }}>
                                                {plan.features?.map((f, fIdx) => (
                                                    <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-hover)', padding: '4px 8px', borderRadius: '6px' }}>
                                                        <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-main)' }}>{f}</span>
                                                        <button 
                                                            onClick={() => handleFeatureDelete(idx, fIdx)}
                                                            style={{ border: 'none', background: 'transparent', color: '#dc2626', padding: '2px', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Add feature line */}
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                                <input 
                                                    value={newFeatureText[idx] || ''}
                                                    onChange={e => setNewFeatureText(prev => ({ ...prev, [idx]: e.target.value }))}
                                                    placeholder="Add feature..."
                                                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.8rem', border: '1px dashed var(--border-color)' }}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFeatureAdd(idx); } }}
                                                />
                                                <button 
                                                    onClick={() => handleFeatureAdd(idx)}
                                                    style={{ background: 'var(--accent-primary)', border: 'none', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Identifier Key: <strong>{plan.id}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add New Plan Card */}
                        <div
                            onClick={handleAddPlan}
                            style={{
                                border: '2px dashed var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '440px',
                                cursor: 'pointer',
                                transition: 'var(--transition)',
                                background: 'rgba(0,0,0,0.01)',
                            }}
                            className="clickable-card"
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(5, 150, 105, 0.02)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(0,0,0,0.01)'; }}
                        >
                            <Plus size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>Create New Pricing Plan</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Add a customizable duration package</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
