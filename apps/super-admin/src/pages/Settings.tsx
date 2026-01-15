import { Save, Loader } from 'lucide-react';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { SubscriptionPlan } from '@restaurant-saas/types';

export default function Settings() {
    const { config, loading, saving, error, successMessage, updateConfig } = useSystemConfig();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const newConfig = {
            platformName: formData.get('platformName') as string,
            supportEmail: formData.get('supportEmail') as string,
            supportPhone: formData.get('supportPhone') as string,
            defaultTrialDays: Number(formData.get('defaultTrialDays')),
            plans: {
                ...config.plans,
                [SubscriptionPlan.QR]: {
                    ...config.plans?.[SubscriptionPlan.QR],
                    price: Number(formData.get('qrPrice'))
                },
                [SubscriptionPlan.DELIVERY]: {
                    ...config.plans?.[SubscriptionPlan.DELIVERY],
                    price: Number(formData.get('deliveryPrice'))
                }
            }
        };

        await updateConfig(newConfig as any);
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <header className="page-header">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Settings</h1>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                    Configure your SaaS platform settings
                </p>
            </header>

            <div className="page-content animate-fadeIn">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-lg">
                            {successMessage}
                        </div>
                    )}

                    {/* Platform Settings */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <h2 className="card-title">Platform Settings</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                                <div className="form-group">
                                    <label className="form-label">Platform Name</label>
                                    <input
                                        name="platformName"
                                        type="text"
                                        className="form-input"
                                        defaultValue={config.platformName || ''}
                                        placeholder="Restaurant SaaS"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Support Email</label>
                                    <input
                                        name="supportEmail"
                                        type="email"
                                        className="form-input"
                                        defaultValue={config.supportEmail || ''}
                                        placeholder="support@restaurantsaas.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Support Phone</label>
                                    <input
                                        name="supportPhone"
                                        type="tel"
                                        className="form-input"
                                        defaultValue={config.supportPhone || ''}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Trial Period (Days)</label>
                                    <input
                                        name="defaultTrialDays"
                                        type="number"
                                        className="form-input"
                                        defaultValue={config.defaultTrialDays || 14}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Settings */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <h2 className="card-title">Subscription Pricing</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '600px' }}>
                                <div className="form-group">
                                    <label className="form-label">QR Only Plan (₹/month)</label>
                                    <input
                                        name="qrPrice"
                                        type="number"
                                        className="form-input"
                                        defaultValue={config.plans?.[SubscriptionPlan.QR]?.price || 999}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Delivery Plan (₹/month)</label>
                                    <input
                                        name="deliveryPrice"
                                        type="number"
                                        className="form-input"
                                        defaultValue={config.plans?.[SubscriptionPlan.DELIVERY]?.price || 1499}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branding Settings */}
                    {/* Note: We are keeping this purely visual for now as branding might need a nested object structure handling */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <h2 className="card-title">Default Branding</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '600px' }}>
                                <div className="form-group">
                                    <label className="form-label">Default Primary Color</label>
                                    <div className="flex items-center gap-sm">
                                        <input
                                            type="color"
                                            defaultValue="#6366f1"
                                            style={{ width: '48px', height: '36px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                        />
                                        <input type="text" className="form-input" defaultValue="#6366f1" style={{ flex: 1 }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Default Font</label>
                                    <select className="form-input">
                                        <option>Inter</option>
                                        <option>Poppins</option>
                                        <option>Roboto</option>
                                        <option>Open Sans</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </>
    );
}
