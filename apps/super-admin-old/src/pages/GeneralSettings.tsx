import { useState } from 'react';
import {
    Settings,
    Globe,
    Mail,
    Phone,
    CreditCard,
    DollarSign,
    Bell,
    Shield,
    Save,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Info,
    Palette,
    Language,
    Clock,
    Users,
    Store,
    FileText,
    HelpCircle
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

export default function GeneralSettings() {
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Platform Settings
    const [platformSettings, setPlatformSettings] = useState({
        platformName: 'TableKard',
        platformLogo: '/logo.png',
        supportEmail: 'support@tablekard.com',
        supportPhone: '+91-80-1234-5678',
        defaultCurrency: 'INR',
        timezone: 'Asia/Kolkata',
        defaultLanguage: 'en'
    });

    // Business Settings
    const [businessSettings, setBusinessSettings] = useState({
        defaultTrialDays: 14,
        commissionRate: 5,
        minimumOrderAmount: 100,
        maximumOrderAmount: 50000,
        autoAcceptOrders: true,
        enableDelivery: true,
        enableTakeaway: true
    });

    // Notification Settings
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        orderAlerts: true,
        paymentAlerts: true,
        systemAlerts: true
    });

    // UI Settings
    const [uiSettings, setUiSettings] = useState({
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        darkMode: false,
        compactMode: false,
        showAnimations: true
    });

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');

        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 1500);
    };

    const handleReset = () => {
        // Reset to default values
        setPlatformSettings({
            platformName: 'TableKard',
            platformLogo: '/logo.png',
            supportEmail: 'support@tablekard.com',
            supportPhone: '+91-80-1234-5678',
            defaultCurrency: 'INR',
            timezone: 'Asia/Kolkata',
            defaultLanguage: 'en'
        });
    };

    return (
        <>
            <PageHeader
                className="page-header"
                title="General Settings"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={handleReset}>
                            <RefreshCw size={18} />
                            Reset
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                            {isSaving ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }
            />

            <div className="page-content animate-fadeIn">
                {saveStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="text-green-700">Settings saved successfully!</span>
                    </div>
                )}

                {saveStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-600" />
                        <span className="text-red-700">Failed to save settings. Please try again.</span>
                    </div>
                )}

                {/* Platform Settings */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe size={20} />
                            Platform Settings
                        </CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Basic platform configuration and contact information</p>
                    </CardHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Platform Name
                                </label>
                                <input
                                    type="text"
                                    value={platformSettings.platformName}
                                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Platform Logo URL
                                </label>
                                <input
                                    type="text"
                                    value={platformSettings.platformLogo}
                                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformLogo: e.target.value })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Support Email
                                </label>
                                <input
                                    type="email"
                                    value={platformSettings.supportEmail}
                                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Support Phone
                                </label>
                                <input
                                    type="tel"
                                    value={platformSettings.supportPhone}
                                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Default Currency
                                </label>
                                <select
                                    value={platformSettings.defaultCurrency}
                                    onChange={(e) => setPlatformSettings({ ...platformSettings, defaultCurrency: e.target.value })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                >
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="GBP">British Pound (£)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Timezone
                                </label>
                                <select
                                    value={platformSettings.timezone}
                                    onChange={(e) => setPlatformSettings({ ...platformSettings, timezone: e.target.value })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                >
                                    <option value="Asia/Kolkata">India (IST)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="Europe/London">London</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Business Settings */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store size={20} />
                            Business Settings
                        </CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Configure business rules and operational parameters</p>
                    </CardHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Default Trial Period (days)
                                </label>
                                <input
                                    type="number"
                                    value={businessSettings.defaultTrialDays}
                                    onChange={(e) => setBusinessSettings({ ...businessSettings, defaultTrialDays: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Commission Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={businessSettings.commissionRate}
                                    onChange={(e) => setBusinessSettings({ ...businessSettings, commissionRate: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Minimum Order Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={businessSettings.minimumOrderAmount}
                                    onChange={(e) => setBusinessSettings({ ...businessSettings, minimumOrderAmount: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Maximum Order Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={businessSettings.maximumOrderAmount}
                                    onChange={(e) => setBusinessSettings({ ...businessSettings, maximumOrderAmount: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={businessSettings.autoAcceptOrders}
                                    onChange={(e) => setBusinessSettings({ ...businessSettings, autoAcceptOrders: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <span className="text-sm text-[var(--color-text-primary)]">Auto-accept orders</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={businessSettings.enableDelivery}
                                    onChange={(e) => setBusinessSettings({ ...businessSettings, enableDelivery: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <span className="text-sm text-[var(--color-text-primary)]">Enable delivery service</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={businessSettings.enableTakeaway}
                                    onChange={(e) => setBusinessSettings({ ...businessSettings, enableTakeaway: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <span className="text-sm text-[var(--color-text-primary)]">Enable takeaway service</span>
                            </label>
                        </div>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell size={20} />
                            Notification Settings
                        </CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Configure system notifications and alerts</p>
                    </CardHeader>
                    <div className="p-6">
                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.emailNotifications}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">Email notifications</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.smsNotifications}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">SMS notifications</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.pushNotifications}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <Bell size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">Push notifications</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.orderAlerts}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, orderAlerts: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">Order alerts</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.paymentAlerts}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, paymentAlerts: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">Payment alerts</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.systemAlerts}
                                    onChange={(e) => setNotificationSettings({ ...notificationSettings, systemAlerts: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">System alerts</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </Card>

                {/* UI Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette size={20} />
                            UI Settings
                        </CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Customize the appearance and behavior of the admin interface</p>
                    </CardHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Primary Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={uiSettings.primaryColor}
                                        onChange={(e) => setUiSettings({ ...uiSettings, primaryColor: e.target.value })}
                                        className="w-12 h-10 border border-[var(--color-border)] rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={uiSettings.primaryColor}
                                        onChange={(e) => setUiSettings({ ...uiSettings, primaryColor: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Secondary Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={uiSettings.secondaryColor}
                                        onChange={(e) => setUiSettings({ ...uiSettings, secondaryColor: e.target.value })}
                                        className="w-12 h-10 border border-[var(--color-border)] rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={uiSettings.secondaryColor}
                                        onChange={(e) => setUiSettings({ ...uiSettings, secondaryColor: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={uiSettings.darkMode}
                                    onChange={(e) => setUiSettings({ ...uiSettings, darkMode: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <Palette size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">Dark mode</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={uiSettings.compactMode}
                                    onChange={(e) => setUiSettings({ ...uiSettings, compactMode: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <Settings size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">Compact mode</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={uiSettings.showAnimations}
                                    onChange={(e) => setUiSettings({ ...uiSettings, showAnimations: e.target.checked })}
                                    className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <Info size={16} className="text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">Show animations</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}
