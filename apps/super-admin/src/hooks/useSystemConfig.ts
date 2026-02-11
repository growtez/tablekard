import { useState, useEffect } from 'react';
import supabaseService from '../services/supabaseService';
import { SaasSettings } from '@restaurant-saas/types';

export function useSystemConfig() {
    const [config, setConfig] = useState<Partial<SaasSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const data = await supabaseService.getSystemConfig();
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
            await supabaseService.updateSystemConfig(newConfig);
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
