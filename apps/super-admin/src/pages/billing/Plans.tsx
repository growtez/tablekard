import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { CheckCircle, Zap, Award, Sparkles, Clock, Calendar, AlertCircle, Edit2, Plus, Search } from 'lucide-react';
import { PlansPageSkeleton } from '../../components/ui/Skeleton';
import EditPlanDrawer from '../../components/EditPlanDrawer';

const ICON_MAP = {
    Clock: Clock,
    Zap: Zap,
    Sparkles: Sparkles,
    Award: Award,
    Calendar: Calendar
};

const DEFAULT_PLANS = [
    {
        id: '14_days_trial',
        name: '14 Days Free Trial',
        price: 0,
        duration: 0.5,
        duration_days: 14,
        savings: 0,
        color: '#10b981',
        description: 'Try all premium features for absolutely free.',
        features: [
            'QR Table Ordering & Menu',
            'Live Order Management',
            'Sales & Revenue Analytics',
        ],
        iconName: 'Sparkles',
    },
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
    const [trials, setTrials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    
    const [editingItem, setEditingItem] = useState(null);
    const [allRestaurants, setAllRestaurants] = useState([]);
    const [searchQueries, setSearchQueries] = useState({});
    const [activeTab, setActiveTab] = useState('plans');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: restData } = await supabase.from('restaurants').select('id, name');
            setAllRestaurants(restData || []);

            const { data, error: err } = await supabase
                .from('platform_settings')
                .select('config')
                .eq('id', 'billing_plans')
                .maybeSingle();

            if (err) throw err;

            if (data?.config) { 
                setPlans(data.config.plans || []); 
                setTrials(data.config.trials || []); 
            } else { 
                setPlans(DEFAULT_PLANS); 
                setTrials([]); 
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
            setError('Failed to fetch pricing plans from the database. Using defaults.'); 
            setPlans(DEFAULT_PLANS); 
            setTrials([]);
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

    useEffect(() => {
        if (!setHeaderData || loading) return;

        setHeaderData({
            name: 'Pricing Plans',
            showAvatar: false,
            saving,
        });

        return () => setHeaderData(null);
    }, [loading, saving, setHeaderData]);

    const performSaveToDb = async (newPlans, newTrials) => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);
        
        try {
            const { error: err } = await supabase
                .from('platform_settings')
                .upsert(
                    { 
                        id: 'billing_plans', 
                        config: { plans: newPlans, trials: newTrials }, 
                        updated_at: new Date().toISOString() 
                    }, 
                    { onConflict: 'id' }
                );

            if (err) throw err;

            setPlans(newPlans);
            setTrials(newTrials);
            setSuccessMsg('🎉 Pricing plans successfully synchronized to the database!');
            setEditingItem(null);
        } catch (err) {
            console.error('Error saving plans:', err);
            setError(err.message || 'Failed to save changes. Please verify permissions.');
        } finally {
            setSaving(false);
        }
    };

    const handleDrawerSave = async (updatedData, type) => {
        let newPlans = [...plans];
        let newTrials = [...trials];

        if (type === 'trial') {
            if (editingItem.index !== undefined) {
                newTrials[editingItem.index] = updatedData;
            } else {
                newTrials.push(updatedData);
            }
        } else {
            if (editingItem.index !== undefined) {
                newPlans[editingItem.index] = updatedData;
            } else {
                newPlans.push(updatedData);
            }
        }

        await performSaveToDb(newPlans, newTrials);
    };

    const handleDrawerDelete = async (id, type) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        
        let newPlans = [...plans];
        let newTrials = [...trials];

        if (type === 'trial') {
            newTrials = newTrials.filter(t => t.id !== id);
        } else {
            newPlans = newPlans.filter(p => p.id !== id);
        }

        await performSaveToDb(newPlans, newTrials);
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
            iconName: 'Zap',
            isNew: true
        };
        setEditingItem({ data: newPlan, type: 'plan' });
    };

    const handleAddTrial = () => {
        const newTrial = {
            id: 'trial_' + Date.now(),
            name: 'New Trial',
            duration_days: 14,
            is_public: false,
            isNew: true
        };
        setEditingItem({ data: newTrial, type: 'trial' });
    };


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

            {/* Tab Switcher */}
            <div className="flex bg-surface-hover p-1 rounded-lg mb-8 border border-border max-w-[320px]">
                <button
                    className={`flex-1 p-2.5 rounded-md text-sm font-semibold transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'plans' ? 'bg-accent-primary text-white shadow-sm' : 'bg-transparent text-text-muted hover:bg-surface hover:text-text-main'}`}
                    onClick={() => setActiveTab('plans')}
                >
                    <Award size={16} /> Paid Plans
                </button>
                <button
                    className={`flex-1 p-2.5 rounded-md text-sm font-semibold transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'trials' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-transparent text-text-muted hover:bg-surface hover:text-text-main'}`}
                    onClick={() => setActiveTab('trials')}
                >
                    <Zap size={16} /> Trials
                    {trials.length > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'trials' ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-600'}`}>{trials.length}</span>}
                </button>
            </div>

            {/* Trials Tab */}
            {activeTab === 'trials' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2"><Sparkles size={20} className="text-emerald-500" /> Free Trial Plans</h2>
                        <button onClick={handleAddTrial} className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[13px] transition-colors">
                            <Plus size={16} /> New Trial
                        </button>
                    </div>
                    {trials.length === 0 ? (
                        <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border">
                            <Zap size={40} className="text-text-muted mx-auto mb-3 opacity-30" />
                            <p className="text-text-muted text-sm font-medium mb-4">No trial plans created yet.</p>
                            <button onClick={handleAddTrial} className="bg-emerald-500 text-white hover:bg-emerald-600 border-none cursor-pointer px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
                                <Plus size={16} className="inline mr-1.5" /> Create First Trial
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {trials.map((trial, idx) => (
                                <div key={trial.id} className="relative bg-surface rounded-2xl p-6 border-2 border-emerald-500/20 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow group">
                                    <button 
                                        onClick={() => setEditingItem({ data: trial, type: 'trial', index: idx })}
                                        className="absolute top-4 right-4 bg-surface text-text-muted hover:text-emerald-600 border border-border hover:border-emerald-500/30 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4"><Zap size={20} /></div>
                                    <h3 className="font-bold text-[16px] text-text-main mb-1">{trial.name}</h3>
                                    <div className="text-[13px] text-text-muted mb-2">{trial.duration_days} Days Free</div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${trial.visibility === 'global' ? 'bg-emerald-500/10 text-emerald-600' : trial.visibility === 'specific' ? 'bg-blue-500/10 text-blue-600' : 'bg-surface-hover text-text-muted'}`}>
                                        {trial.visibility === 'global' ? '🌍 Global' : trial.visibility === 'specific' ? '🎯 Specific' : '🔒 Hidden'}
                                    </span>
                                    <code className="text-[10px] text-text-muted bg-surface-hover px-1.5 py-0.5 rounded mt-auto border border-border">{trial.id}</code>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Paid Plans Tab */}
            {activeTab === 'plans' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2"><Award size={20} className="text-accent-primary" /> Paid Subscription Packages</h2>
                        <button onClick={handleAddPlan} className="bg-accent-primary text-white hover:bg-accent-hover border-none cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[13px] transition-colors shadow-sm">
                            <Plus size={16} /> New Package
                        </button>
                    </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {plans.map((plan, idx) => {
                    const IconComponent = ICON_MAP[plan.iconName] || Clock;
                    const perMonth = Math.round(plan.price / plan.duration);

                    return (
                        <div
                            key={plan.id}
                            className="relative bg-surface rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl group"
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

                            <div className="p-6 flex flex-col flex-1 relative">
                                <button 
                                    onClick={() => setEditingItem({ data: plan, type: 'plan', index: idx })}
                                    className="absolute top-4 right-4 bg-surface text-text-muted border border-border w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm z-20 hover:scale-105 hover:bg-surface-hover"
                                >
                                    <Edit2 size={14} style={{ color: plan.color }} />
                                </button>
                                
                                {/* Icon + Title */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${plan.color}18`, color: plan.color }}>
                                        <IconComponent size={20} />
                                    </div>
                                    <div className="pr-8">
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
                </div>
            )}

            {/* Edit Drawer */}
            <EditPlanDrawer 
                isOpen={!!editingItem} 
                onClose={() => setEditingItem(null)} 
                initialData={editingItem?.data} 
                type={editingItem?.type}
                onSave={handleDrawerSave}
                onDelete={handleDrawerDelete}
            />
        </div>
    );
}
