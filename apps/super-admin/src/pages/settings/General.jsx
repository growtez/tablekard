import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';

// platform_settings: id TEXT PRIMARY KEY, config JSONB, updated_at TIMESTAMPTZ
// Key: 'general'
const DEFAULTS = {
    platform_name: 'TableKard',
    support_email: 'support@tablekard.com',
    default_currency: 'INR',
    default_timezone: 'Asia/Kolkata',
    max_tables_per_restaurant: '50',
    order_auto_confirm: 'false',
    maintenance_mode: 'false',
};

const FIELD_META = [
    { key: 'platform_name', label: 'Platform Name', type: 'text', description: 'Displayed in all customer-facing interfaces.' },
    { key: 'support_email', label: 'Support Email', type: 'email', description: 'Shown to restaurant admins for support queries.' },
    { key: 'default_currency', label: 'Default Currency', type: 'text', description: 'ISO 4217 code (e.g. INR, USD).' },
    { key: 'default_timezone', label: 'Default Timezone', type: 'text', description: 'IANA timezone (e.g. Asia/Kolkata).' },
    { key: 'max_tables_per_restaurant', label: 'Max Tables / Restaurant', type: 'number', description: 'Hard cap on restaurant_tables per restaurant.' },
    { key: 'order_auto_confirm', label: 'Auto-Confirm Orders', type: 'select', options: ['false', 'true'], description: 'Skip "confirmed" status, jump to "preparing" automatically.' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'select', options: ['false', 'true'], description: 'Puts all customer-web pages in maintenance state.' },
];

export default function General({ setSyncAction }) {
    const [config, setConfig] = useState({ ...DEFAULTS });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const { data, error: err } = await supabase
                .from('platform_settings')
                .select('config, updated_at')
                .eq('id', 'general')
                .maybeSingle();
            if (err) throw err;
            if (data) {
                setConfig({ ...DEFAULTS, ...data.config });
                setLastUpdated(data.updated_at);
            }
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (setSyncAction) setSyncAction({ onSync: fetchData, loading }); }, [loading, setSyncAction]);

    const handleSave = async () => {
        setSaving(true); setError(null); setSuccess(false);
        try {
            const { error: err } = await supabase
                .from('platform_settings')
                .upsert({ id: 'general', config, updated_at: new Date().toISOString() }, { onConflict: 'id' });
            if (err) throw err;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            fetchData();
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };

    const update = (key, value) => setConfig(c => ({ ...c, [key]: value }));

    return (
        <div className="animate-fade-in space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>General Settings</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        Stored in <code>platform_settings</code> (id = <code>'general'</code>).
                        {lastUpdated && <span style={{ marginLeft: '0.5rem' }}>Last saved: {new Date(lastUpdated).toLocaleString('en-IN')}</span>}
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving || loading}
                    style={{ background: 'var(--accent-primary)', color: 'black', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={16} /> {error}</div>}
            {success && <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#10b981', fontSize: '0.875rem' }}>✓ Settings saved successfully.</div>}

            <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {loading ? (
                        [...Array(7)].map((_, i) => <div key={i} style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', height: '80px', background: 'var(--surface-hover)', animation: 'pulse 1.5s infinite', borderRadius: i === 0 ? '8px 8px 0 0' : i === 6 ? '0 0 8px 8px' : 0 }} />)
                    ) : FIELD_META.map((field, idx) => (
                        <div key={field.key} style={{ padding: '1.25rem 1.5rem', borderBottom: idx < FIELD_META.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{field.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{field.description}</div>
                            </div>
                            <div style={{ minWidth: '220px', maxWidth: '300px', width: '100%' }}>
                                {field.type === 'select' ? (
                                    <select value={config[field.key] || ''} onChange={e => update(field.key, e.target.value)} className="edit-input" style={{ padding: '8px 12px' }}>
                                        {field.options.map(o => <option key={o} value={o}>{o === 'true' ? 'Enabled' : o === 'false' ? 'Disabled' : o}</option>)}
                                    </select>
                                ) : (
                                    <input type={field.type} value={config[field.key] || ''} onChange={e => update(field.key, e.target.value)} className="edit-input" style={{ padding: '8px 12px' }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
