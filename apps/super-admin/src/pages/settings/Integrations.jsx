import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Save, RefreshCw, AlertCircle, Eye, EyeOff, Key, Webhook } from 'lucide-react';

// platform_settings: id TEXT PRIMARY KEY, config JSONB, updated_at TIMESTAMPTZ
// Key: 'integrations'
// Stores platform Razorpay keys for TableKard subscription billing.
// Restaurant food-order payments use each restaurant's own Razorpay settings.

const FIELD_META = [
    { key: 'razorpay_key_id', label: 'Platform Razorpay Key ID', type: 'text', secret: false, description: 'Public key for TableKard SaaS subscription checkout.' },
    { key: 'razorpay_key_secret', label: 'Platform Razorpay Key Secret', type: 'password', secret: true, description: 'Secret for TableKard subscription payment verification.' },
    { key: 'razorpay_webhook_secret', label: 'Platform Razorpay Webhook Secret', type: 'password', secret: true, description: 'Reserved for platform billing webhooks.' },
    { key: 'supabase_url', label: 'Supabase URL', type: 'text', secret: false, description: 'Project URL — used by Edge Functions.' },
    { key: 'supabase_service_key', label: 'Supabase Service Role Key', type: 'password', secret: true, description: 'Service key for admin operations in Edge Functions.' },
];

export default function Integrations({ setSyncAction }) {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [visible, setVisible] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const { data, error: err } = await supabase
                .from('platform_settings')
                .select('config, updated_at')
                .eq('id', 'integrations')
                .maybeSingle();
            if (err) throw err;
            setConfig(data?.config || {});
            setLastUpdated(data?.updated_at || null);
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
                .upsert({ id: 'integrations', config, updated_at: new Date().toISOString() }, { onConflict: 'id' });
            if (err) throw err;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            fetchData();
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };

    const update = (key, value) => setConfig(c => ({ ...c, [key]: value }));
    const toggleVisible = (key) => setVisible(v => ({ ...v, [key]: !v[key] }));

    return (
        <div className="animate-fade-in space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Integrations & API</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        Stored in <code>platform_settings</code> (id = <code>'integrations'</code>).
                        {lastUpdated && <span style={{ marginLeft: '0.5rem' }}>Last saved: {new Date(lastUpdated).toLocaleString('en-IN')}</span>}
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving || loading}
                    style={{ background: 'var(--accent-primary)', color: 'black', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            <div className="premium-card" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <span>Keys are stored in Supabase. Never expose your <strong style={{ color: '#ef4444' }}>secret</strong> or <strong style={{ color: '#ef4444' }}>service role</strong> keys client-side — use Edge Functions only.</span>
            </div>

            {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}
            {success && <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#10b981', fontSize: '0.875rem' }}>✓ Integration settings saved.</div>}

            <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {FIELD_META.map((field, idx) => (
                        <div key={field.key} style={{ padding: '1.25rem 1.5rem', borderBottom: idx < FIELD_META.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                    {field.secret ? <Key size={13} style={{ color: '#f59e0b' }} /> : <Webhook size={13} style={{ color: 'var(--accent-primary)' }} />}
                                    {field.label}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{field.description}</div>
                            </div>
                            <div style={{ minWidth: '220px', maxWidth: '320px', width: '100%', position: 'relative' }}>
                                <input
                                    type={field.secret && !visible[field.key] ? 'password' : 'text'}
                                    value={config[field.key] || ''}
                                    onChange={e => update(field.key, e.target.value)}
                                    placeholder={field.secret ? '••••••••••••••••' : `Enter ${field.label}`}
                                    className="edit-input"
                                    style={{ padding: field.secret ? '8px 36px 8px 12px' : '8px 12px' }}
                                />
                                {field.secret && (
                                    <button onClick={() => toggleVisible(field.key)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}>
                                        {visible[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
