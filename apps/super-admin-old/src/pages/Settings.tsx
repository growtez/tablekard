import { Save, Loader } from 'lucide-react';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { SubscriptionPlan } from '@restaurant-saas/types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

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
            <PageHeader
                className="page-header"
                title="Settings"
            />

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
                    <Card style={{ marginBottom: '1.5rem' }}>
                        <CardHeader>
                            <CardTitle>Platform Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                                <div className="form-group">
                                    <Label>Platform Name</Label>
                                    <Input
                                        name="platformName"
                                        type="text"
                                        defaultValue={config.platformName || ''}
                                        placeholder="Restaurant SaaS"
                                    />
                                </div>
                                <div className="form-group">
                                    <Label>Support Email</Label>
                                    <Input
                                        name="supportEmail"
                                        type="email"
                                        defaultValue={config.supportEmail || ''}
                                        placeholder="support@restaurantsaas.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <Label>Support Phone</Label>
                                    <Input
                                        name="supportPhone"
                                        type="tel"
                                        defaultValue={config.supportPhone || ''}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="form-group">
                                    <Label>Trial Period (Days)</Label>
                                    <Input
                                        name="defaultTrialDays"
                                        type="number"
                                        defaultValue={config.defaultTrialDays || 14}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Settings */}
                    <Card style={{ marginBottom: '1.5rem' }}>
                        <CardHeader>
                            <CardTitle>Subscription Pricing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '600px' }}>
                                <div className="form-group">
                                    <Label>QR Only Plan (₹/month)</Label>
                                    <Input
                                        name="qrPrice"
                                        type="number"
                                        defaultValue={config.plans?.[SubscriptionPlan.QR]?.price || 999}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Branding Settings */}
                    {/* Note: We are keeping this purely visual for now as branding might need a nested object structure handling */}
                    <Card style={{ marginBottom: '1.5rem' }}>
                        <CardHeader>
                            <CardTitle>Default Branding</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '600px' }}>
                                <div className="form-group">
                                    <Label>Default Primary Color</Label>
                                    <div className="flex items-center gap-sm">
                                        <input
                                            type="color"
                                            defaultValue="#6366f1"
                                            style={{ width: '48px', height: '36px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                        />
                                        <Input type="text" defaultValue="#6366f1" style={{ flex: 1 }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <Label>Default Font</Label>
                                    <select className="form-input">
                                        <option>Inter</option>
                                        <option>Poppins</option>
                                        <option>Roboto</option>
                                        <option>Open Sans</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={saving}>
                        {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </div>
        </>
    );
}
