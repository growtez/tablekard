import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, CheckCircle, Plus, Trash2, Zap, Clock, Star, Award, Shield, DollarSign, Search } from 'lucide-react';

const COLOR_OPTIONS = [
    { label: 'Blue', value: '#1e40af' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Purple', value: '#7c3aed' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Rose', value: '#e11d48' },
    { label: 'Slate', value: '#475569' }
];

const ICON_MAP = {
    Zap,
    Clock,
    Star,
    Award,
    Shield,
    DollarSign
};

export default function EditPlanDrawer({ isOpen, onClose, initialData, type, onSave, onDelete }) {
    const [formData, setFormData] = useState(null);
    const [newFeatureText, setNewFeatureText] = useState('');
    const [allRestaurants, setAllRestaurants] = useState([]);
    const [restaurantSearch, setRestaurantSearch] = useState('');

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(JSON.parse(JSON.stringify(initialData)));
            setNewFeatureText('');
            setRestaurantSearch('');
            fetchRestaurants();
            // Small delay so the DOM renders off-screen first, then animate in
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen, initialData]);

    const fetchRestaurants = async () => {
        try {
            const { data } = await supabase.from('restaurants').select('id, name').order('name');
            setAllRestaurants(data || []);
        } catch (err) {
            console.error('Failed to fetch restaurants:', err);
        }
    };

    if (!formData) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFeatureDelete = (index) => {
        const updatedFeatures = formData.features.filter((_, idx) => idx !== index);
        handleChange('features', updatedFeatures);
    };

    const handleFeatureAdd = () => {
        const text = newFeatureText.trim();
        if (!text) return;
        handleChange('features', [...(formData.features || []), text]);
        setNewFeatureText('');
    };

    const handleSaveClick = () => {
        if (!formData.name?.trim()) return alert("Name is required.");
        if (!formData.id?.trim()) return alert("Identifier Key (ID) is required.");
        onSave(formData, type);
    };

    // Helpers for restaurant multi-select
    const selectedIds = (formData.allowed_restaurant_ids || '').split(',').map(id => id.trim()).filter(Boolean);
    const toggleRestaurant = (rid) => {
        const newIds = selectedIds.includes(rid)
            ? selectedIds.filter(id => id !== rid)
            : [...selectedIds, rid];
        handleChange('allowed_restaurant_ids', newIds.join(', '));
    };
    const filteredRestaurants = allRestaurants.filter(r =>
        (r.name || r.id).toLowerCase().includes(restaurantSearch.toLowerCase())
    );

    // Floating label input style (matching QuickCreateDrawer)
    const inputClass = "peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50";
    const labelClass = "absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary";
    const fixedLabelClass = "absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary";

    const accentColor = type === 'trial' ? 'emerald-500' : 'accent-primary';

    return (
        <>
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100] transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-screen w-full max-w-[450px] bg-bg z-[1101] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-2xl flex flex-col ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {type === 'trial' ? <Zap size={20} className="text-emerald-500" /> : <Award size={20} className="text-accent-primary" />}
                        <h3 className="text-lg font-semibold m-0">{initialData?.isNew ? `Create New ${type === 'trial' ? 'Trial' : 'Plan'}` : `Edit ${type === 'trial' ? 'Trial' : 'Plan'}`}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {!initialData?.isNew && onDelete && (
                            <button 
                                onClick={() => onDelete(initialData.id, type)}
                                className="w-8 h-8 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center hover:bg-red-500/20 transition-colors border-none cursor-pointer"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted transition-all hover:bg-border hover:text-text-main hover:rotate-90 border-none cursor-pointer" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
                    
                    {type === 'trial' && (
                        <>
                            {/* Trial Name */}
                            <div className="relative">
                                <input
                                    placeholder="14 Days Free Trial"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className={inputClass}
                                />
                                <label className={labelClass}>Trial Name</label>
                            </div>

                            {/* Duration & ID */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="14"
                                        value={formData.duration_days || ''}
                                        onChange={e => handleChange('duration_days', parseInt(e.target.value) || 0)}
                                        className={inputClass}
                                    />
                                    <label className={labelClass}>Duration (Days)</label>
                                </div>
                                <div className="relative">
                                    <input
                                        placeholder="14_days_trial"
                                        value={formData.id || ''}
                                        onChange={e => handleChange('id', e.target.value)}
                                        disabled={!initialData?.isNew}
                                        className={`${inputClass} ${!initialData?.isNew ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                    <label className={fixedLabelClass}>Identifier Key</label>
                                    {!initialData?.isNew && <p className="text-[10px] text-text-muted mt-1 ml-1">ID locked after creation.</p>}
                                </div>
                            </div>

                            {/* Visibility */}
                            <div className="relative">
                                <select
                                    value={formData.visibility || (formData.is_public ? 'global' : 'hidden')}
                                    onChange={e => handleChange('visibility', e.target.value)}
                                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                                >
                                    <option value="hidden">Hidden (Assign manually)</option>
                                    <option value="global">Global (All restaurants)</option>
                                    <option value="specific">Specific Restaurants Only</option>
                                </select>
                                <label className={fixedLabelClass}>Visibility</label>
                            </div>

                            {/* Specific Restaurants Picker */}
                            {formData.visibility === 'specific' && (
                                <div className="animate-fade-in border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
                                    <div className="bg-surface-hover px-3 py-2.5 border-b border-border flex items-center gap-2">
                                        <Search size={14} className="text-text-muted shrink-0" />
                                        <input 
                                            placeholder="Search restaurants..."
                                            value={restaurantSearch}
                                            onChange={e => setRestaurantSearch(e.target.value)}
                                            className="bg-transparent border-none focus:outline-none text-sm w-full text-text-main"
                                        />
                                    </div>

                                    {/* Selected chips */}
                                    {selectedIds.length > 0 && (
                                        <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 border-b border-border">
                                            {selectedIds.map(sid => {
                                                const r = allRestaurants.find(r => r.id === sid);
                                                return (
                                                    <span key={sid} className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 text-[11px] font-semibold px-2 py-1 rounded-full">
                                                        {r?.name || sid.substring(0, 8) + '...'}
                                                        <button onClick={() => toggleRestaurant(sid)} className="bg-transparent border-none cursor-pointer text-emerald-700 hover:text-red-500 p-0 flex">
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Restaurant list */}
                                    <div className="max-h-[200px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
                                        {filteredRestaurants.map(r => {
                                            const isSelected = selectedIds.includes(r.id);
                                            return (
                                                <div 
                                                    key={r.id} 
                                                    onClick={() => toggleRestaurant(r.id)}
                                                    className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'bg-emerald-500/10 text-emerald-700 font-semibold' : 'hover:bg-surface-hover text-text-main'}`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{r.name || 'Unnamed Restaurant'}</span>
                                                        <span className="text-[10px] text-text-muted font-mono">{r.id.substring(0, 12)}...</span>
                                                    </div>
                                                    {isSelected && <CheckCircle size={16} className="text-emerald-600 shrink-0" />}
                                                </div>
                                            );
                                        })}
                                        {filteredRestaurants.length === 0 && (
                                            <div className="px-3 py-6 text-center text-[12px] text-text-muted">No restaurants found.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {type === 'plan' && (
                        <>
                            {/* Package Name */}
                            <div className="relative">
                                <input
                                    placeholder="6 Months Package"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className={inputClass}
                                />
                                <label className={labelClass}>Package Name</label>
                            </div>
                            
                            {/* ID & Price */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        placeholder="6_months"
                                        value={formData.id || ''}
                                        onChange={e => handleChange('id', e.target.value)}
                                        disabled={!initialData?.isNew}
                                        className={`${inputClass} ${!initialData?.isNew ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                    <label className={fixedLabelClass}>Identifier Key</label>
                                    {!initialData?.isNew && <p className="text-[10px] text-text-muted mt-1 ml-1">ID locked after creation.</p>}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="2699"
                                        value={formData.price || ''}
                                        onChange={e => handleChange('price', parseInt(e.target.value) || 0)}
                                        className={inputClass}
                                    />
                                    <label className={labelClass}>Price (₹)</label>
                                </div>
                            </div>

                            {/* Duration & Savings */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="6"
                                        value={formData.duration || ''}
                                        onChange={e => handleChange('duration', parseInt(e.target.value) || 1)}
                                        className={inputClass}
                                    />
                                    <label className={labelClass}>Duration (Months)</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="10"
                                        value={formData.savings || ''}
                                        onChange={e => handleChange('savings', parseInt(e.target.value) || 0)}
                                        className={inputClass}
                                    />
                                    <label className={labelClass}>Savings %</label>
                                </div>
                            </div>

                            {/* Icon & Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <select value={formData.iconName || 'Zap'} onChange={e => handleChange('iconName', e.target.value)} className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none">
                                        {Object.keys(ICON_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                    <label className={fixedLabelClass}>Visual Icon</label>
                                </div>
                                <div className="relative">
                                    <select value={formData.color || '#1e40af'} onChange={e => handleChange('color', e.target.value)} className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none">
                                        {COLOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <label className={fixedLabelClass}>Color Theme</label>
                                </div>
                            </div>

                            {/* Featured toggle */}
                            <div className="flex items-center gap-3 bg-surface-hover px-4 py-3 rounded-xl border border-border">
                                <input 
                                    type="checkbox"
                                    id="rec-plan"
                                    checked={!!formData.recommended}
                                    onChange={e => handleChange('recommended', e.target.checked)}
                                    className="w-4 h-4 cursor-pointer accent-accent-primary"
                                />
                                <label htmlFor="rec-plan" className="text-sm cursor-pointer text-text-main font-semibold">Mark as Featured / Best Value</label>
                            </div>

                            {/* Description */}
                            <div className="relative">
                                <textarea 
                                    value={formData.description || ''} 
                                    onChange={e => handleChange('description', e.target.value)} 
                                    rows={2} 
                                    placeholder="Standard medium-term package..."
                                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all resize-y placeholder:text-transparent focus:placeholder:text-text-muted/50" 
                                />
                                <label className={labelClass}>Description</label>
                            </div>

                            {/* Features */}
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Included Features</label>
                                <div className="flex flex-col gap-2">
                                    {formData.features?.map((f, fIdx) => (
                                        <div key={fIdx} className="flex items-center gap-2 bg-surface-hover p-2.5 rounded-xl border border-border group">
                                            <CheckCircle size={14} className="text-accent-primary shrink-0" />
                                            <span className="text-[12px] flex-1 truncate">{f}</span>
                                            <button onClick={() => handleFeatureDelete(fIdx)} className="text-text-muted hover:text-red-500 cursor-pointer border-none bg-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <div className="flex items-center gap-2 mt-1">
                                        <input 
                                            value={newFeatureText} 
                                            onChange={e => setNewFeatureText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleFeatureAdd()}
                                            placeholder="Add new feature..."
                                            className="flex-1 text-[12px] px-3 py-2.5 rounded-xl border border-border bg-surface-hover text-text-main focus:outline-none focus:border-accent-primary"
                                        />
                                        <button onClick={handleFeatureAdd} className="bg-accent-primary text-white p-2.5 rounded-xl cursor-pointer hover:bg-accent-hover transition-colors border-none">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-surface-hover text-text-main hover:bg-border transition-colors border-none cursor-pointer">
                        Cancel
                    </button>
                    <button onClick={handleSaveClick} className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-colors border-none cursor-pointer ${type === 'trial' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-accent-primary hover:bg-accent-hover'}`}>
                        {initialData?.isNew ? 'Create' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
}
