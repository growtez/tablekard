import { useState, useEffect } from 'react';
import { X, Store, Globe, Mail, Phone, Shield } from 'lucide-react';
import { createRestaurant } from '../services/supabaseService';
import { RestaurantStatus } from '@restaurant-saas/types';
import toast from 'react-hot-toast';

interface AddRestaurantModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddRestaurantModal({ onClose, onSuccess }: AddRestaurantModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        email: '',
        phone: '',
        allowedRadius: 500,
        subscriptionType: 'QR Only'
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name) {
            const generatedSlug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug: generatedSlug }));
        }
    }, [formData.name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createRestaurant({
                name: formData.name,
                slug: formData.slug,
                status: RestaurantStatus.TRIAL,
                contact_email: formData.email,      // Changed to flat snake_case
                contact_phone: formData.phone,      // Changed to flat snake_case
                contact_address: '',                // Changed to flat snake_case
                subscription_status: true,          // Changed to snake_case
                subscription_type: formData.subscriptionType, // Changed to snake_case
                allowed_radius: formData.allowedRadius        // Changed to flat snake_case
                // Note: If id is a UUID type, Supabase usually auto-generates it if omitted.
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create restaurant');
            toast.error(err.message || 'Failed to create restaurant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal animate-fadeIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header border-b border-[var(--color-border)] p-6 bg-[var(--color-bg-secondary)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-gradient)] flex items-center justify-center text-[var(--color-on-accent)] shadow-glow">
                            <Store size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Add New Restaurant</h2>
                            <p className="text-xs text-[var(--color-text-muted)]">Register a new business on the platform</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon hover:bg-[var(--color-bg-hover)] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-content p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <Shield size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <Store size={14} className="text-[var(--color-accent-primary)]" />
                                    Restaurant Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g. Pizza Paradise"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <Globe size={14} className="text-[var(--color-accent-primary)]" />
                                    Subdomain Slug
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        className="form-input pr-24"
                                        placeholder="e.g. pizza-paradise"
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-muted)] font-medium">
                                        .tablekard.com
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <Mail size={14} className="text-[var(--color-accent-primary)]" />
                                    Owner Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="form-input"
                                    placeholder="owner@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <Phone size={14} className="text-[var(--color-accent-primary)]" />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    className="form-input"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-[var(--color-border)]">
                            <button
                                type="button"
                                className="text-xs text-[var(--color-accent-primary)] font-medium flex items-center gap-1 hover:underline"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                <div className="form-group">
                                    <label className="form-label">Geo-Fence Radius (meters)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.allowedRadius}
                                        onChange={e => setFormData({ ...formData, allowedRadius: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subscription Type</label>
                                    <select
                                        className="form-input"
                                        value={formData.subscriptionType}
                                        onChange={e => setFormData({ ...formData, subscriptionType: e.target.value })}
                                    >
                                        <option value="QR Only">QR Only</option>
                                        <option value="Pro">Pro (Ordering)</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-actions flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-ghost border border-[var(--color-border)] px-6" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary shadow-lg shadow-black/20 px-8" disabled={loading}>
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Creating...</span>
                                </div>
                            ) : 'Generate Restaurant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
