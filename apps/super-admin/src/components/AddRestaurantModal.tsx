import { useState, useEffect } from 'react';
import { X, Store, Globe, Mail, Phone, Shield } from 'lucide-react';
import { Restaurant } from '@restaurant-saas/types';
import { createRestaurant, updateRestaurant } from '../services/supabaseService';
import toast from 'react-hot-toast';

interface AddRestaurantModalProps {
    onClose: () => void;
    onSuccess: () => void;
    restaurant?: Restaurant; // Add this for edit mode
}

export default function AddRestaurantModal({ onClose, onSuccess, restaurant }: AddRestaurantModalProps) {
    const isEditMode = !!restaurant;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: restaurant?.name || '',
        slug: restaurant?.slug || '',
        email: restaurant?.contact?.email || '',
        phone: restaurant?.contact?.phone || '',
        allowedRadius: restaurant?.location?.allowedRadius || 500,
        subscriptionType: restaurant?.subscriptionType || 'QR Only'
    });
    const [error, setError] = useState<string | null>(null);

    // Auto-generate slug from name (only in add mode)
    useEffect(() => {
        if (!isEditMode && formData.name) {
            const generatedSlug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug: generatedSlug }));
        }
    }, [formData.name, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isEditMode && restaurant) {
                await updateRestaurant(restaurant.id, {
                    name: formData.name,
                    slug: formData.slug,
                    contact_email: formData.email,
                    contact_phone: formData.phone,
                    subscriptionType: formData.subscriptionType,
                    allowedRadius: formData.allowedRadius
                });
                toast.success('Restaurant updated successfully');
            } else {
                await createRestaurant({
                    name: formData.name,
                    slug: formData.slug,
                    status: 'pending' as any,
                    contact_email: formData.email,
                    contact_phone: formData.phone,
                    contact_address: '',
                    subscription_status: true,
                    subscription_type: formData.subscriptionType,
                    allowed_radius: formData.allowedRadius
                } as any);
                toast.success('Restaurant added successfully');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} restaurant`);
            toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} restaurant`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal animate-fadeIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="modal-header border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]" style={{ padding: '32px' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-gradient)] flex items-center justify-center text-[var(--color-on-accent)] shadow-glow">
                            <Store size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                {isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}
                            </h2>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {isEditMode ? `Updating ${restaurant?.name}` : 'Register a new business on the platform'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon hover:bg-[var(--color-bg-hover)] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-content space-y-8 max-h-[90vh] overflow-y-auto w-full" style={{ padding: '32px' }}>
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <Shield size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 w-full" style={{ gap: '24px' }}>
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
                                    <div className="flex w-full">
                                        <input
                                            type="text"
                                            required
                                            className="form-input flex-1"
                                            placeholder="e.g. pizza-paradise"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            style={{ borderRadius: '10px 0 0 10px', minWidth: '0' }}
                                        />
                                        <div className="flex items-center px-3 bg-[var(--color-bg-tertiary)] border border-l-0 border-[var(--color-border)] text-[var(--color-text-muted)] text-sm font-medium shrink-0" style={{ borderRadius: '0 10px 10px 0' }}>
                                            .tablekard.com
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 w-full" style={{ gap: '24px' }}>
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
                            <div className="grid grid-cols-2 w-full" style={{ gap: '24px' }}>
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
                        </div>
                    </div>

                    <div className="modal-actions flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-ghost border border-[var(--color-border)] px-6" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary shadow-lg shadow-black/20 px-8" disabled={loading}>
                            {loading ? (
                                <div className="flex items-center" style={{ gap: '8px' }}>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                                </div>
                            ) : (isEditMode ? 'Save Changes' : 'Add Restaurant')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
