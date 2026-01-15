import { useState, useEffect } from 'react';
import firebaseService from '../services/firebaseService';
import { SaasSettings, SubscriptionPlan } from '@restaurant-saas/types';

export function useSystemConfig() {
    const [config, setConfig] = useState<Partial<SaasSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const data = await firebaseService.getSystemConfig();
            setConfig(data || {});
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch system config');
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = async (newConfig: Partial<SaasSettings>) => {
        try {
            setSaving(true);
            setSuccessMessage(null);
            await firebaseService.updateSystemConfig(newConfig);
            setConfig(prev => ({ ...prev, ...newConfig }));
            setSuccessMessage('Settings saved successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return {
        config,
        loading,
        saving,
        error,
        successMessage,
        updateConfig,
        refresh: fetchConfig
    };
}
