import { useState } from 'react';
import { X } from 'lucide-react';
import { createRestaurant } from '../services/firebaseService';
import { SubscriptionPlan, RestaurantStatus } from '@restaurant-saas/types';

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
        plan: SubscriptionPlan.QR as string
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createRestaurant({
                name: formData.name,
                slug: formData.slug,
                status: RestaurantStatus.TRIAL,
                contact: {
                    email: formData.email,
                    phone: formData.phone,
                    address: ''
                },
                // Set initial subscription
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create restaurant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>Add New Restaurant</h2>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-content">
                    {error && (
                        <div className="alert error" style={{ marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Restaurant Name</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Subdomain Slug</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="e.g. pizza-paradise"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        />
                        <small className="text-muted">.yourapp.com</small>
                    </div>

                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <label>Owner Email</label>
                            <input
                                type="email"
                                required
                                className="form-input"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                required
                                className="form-input"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Initial Plan</label>
                        <select
                            className="form-input"
                            value={formData.plan}
                            onChange={e => setFormData({ ...formData, plan: e.target.value })}
                        >
                            <option value={SubscriptionPlan.QR}>QR Plan (₹999)</option>
                            <option value={SubscriptionPlan.DELIVERY}>Delivery Plan (₹1,499)</option>
                            <option value={SubscriptionPlan.OWNED}>Owned App (Contact Sales)</option>
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Restaurant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
