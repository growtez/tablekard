import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Save, RefreshCw, AlertCircle, Mail } from 'lucide-react';

// platform_settings: id TEXT PRIMARY KEY, config JSONB, updated_at TIMESTAMPTZ
// Key: 'email_templates' — config.templates: [{id, name, subject, body}]

const DEFAULT_TEMPLATES = [
    {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to TableKard! 🎉',
        body: `Hi {{name}},\n\nWelcome to TableKard! Your restaurant {{restaurant_name}} is now live.\n\nStart managing your menu at: {{dashboard_url}}\n\nBest,\nThe TableKard Team`,
    },
    {
        id: 'subscription_confirmed',
        name: 'Subscription Confirmed',
        subject: 'Your TableKard subscription is active ✅',
        body: `Hi {{name}},\n\nYour subscription payment of ₹{{amount}} has been received.\n\nPlan: {{plan_type}}\nValid until: {{ends_at}}\nPayment ID: {{razorpay_payment_id}}\n\nThank you for choosing TableKard!`,
    },
    {
        id: 'subscription_expiring',
        name: 'Subscription Expiring Soon',
        subject: 'Your TableKard plan expires in 3 days ⚠️',
        body: `Hi {{name}},\n\nYour TableKard subscription for {{restaurant_name}} expires on {{ends_at}}.\n\nRenew now to avoid service interruption: {{renewal_url}}\n\nBest,\nTableKard Team`,
    },
    {
        id: 'order_confirmed',
        name: 'Order Confirmed (Customer)',
        subject: 'Order #{{order_number}} confirmed! 🍽️',
        body: `Hi {{customer_name}},\n\nYour order at {{restaurant_name}} (Table {{table_number}}) has been confirmed.\n\nOrder #{{order_number}} | Total: ₹{{total}}\n\nSit back and enjoy!`,
    },
];

export default function EmailTemplates({ setSyncAction }) {
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
    const [activeId, setActiveId] = useState('welcome');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const { data, error: err } = await supabase
                .from('platform_settings')
                .select('config, updated_at')
                .eq('id', 'email_templates')
                .maybeSingle();
            if (err) throw err;
            if (data?.config?.templates?.length > 0) {
                setTemplates(data.config.templates);
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
                .upsert({ id: 'email_templates', config: { templates }, updated_at: new Date().toISOString() }, { onConflict: 'id' });
            if (err) throw err;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };

    const activeTemplate = templates.find(t => t.id === activeId);
    const updateActive = (key, value) => setTemplates(ts => ts.map(t => t.id === activeId ? { ...t, [key]: value } : t));

    return (
        <div className="animate-fade-in space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Email Templates</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        Stored in <code>platform_settings</code> (id = <code>'email_templates'</code>). Variables use <code>{'{{variable}}'}</code> syntax.
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving || loading}
                    style={{ background: 'var(--accent-primary)', color: 'black', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving…' : 'Save Templates'}
                </button>
            </div>

            {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}
            {success && <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#10b981', fontSize: '0.875rem' }}>✓ Templates saved successfully.</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Template list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {templates.map(t => (
                        <button key={t.id} onClick={() => setActiveId(t.id)}
                            style={{ padding: '0.75rem 1rem', borderRadius: '10px', textAlign: 'left', background: activeId === t.id ? 'var(--accent-primary-glow)' : 'var(--surface-hover)', border: activeId === t.id ? '1px solid hsla(155,100%,50%,0.2)' : '1px solid var(--border-color)', color: activeId === t.id ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: activeId === t.id ? 600 : 400 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={14} />
                                {t.name}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Editor */}
                {activeTemplate && (
                    <Card>
                        <CardHeader>
                            <CardTitle style={{ fontSize: '0.95rem' }}>{activeTemplate.name}</CardTitle>
                        </CardHeader>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Subject Line</label>
                                <input value={activeTemplate.subject} onChange={e => updateActive('subject', e.target.value)} style={{ marginTop: '0.25rem' }} />
                            </div>
                            <div>
                                <label>Body</label>
                                <textarea
                                    value={activeTemplate.body}
                                    onChange={e => updateActive('body', e.target.value)}
                                    rows={10}
                                    style={{ marginTop: '0.25rem', resize: 'vertical', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.85rem', width: '100%', lineHeight: 1.7 }}
                                />
                            </div>
                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                                <strong style={{ color: 'var(--text-main)' }}>Available variables:</strong>{' '}
                                {activeTemplate.id === 'welcome' && '{{name}}, {{restaurant_name}}, {{dashboard_url}}'}
                                {activeTemplate.id === 'subscription_confirmed' && '{{name}}, {{amount}}, {{plan_type}}, {{ends_at}}, {{razorpay_payment_id}}'}
                                {activeTemplate.id === 'subscription_expiring' && '{{name}}, {{restaurant_name}}, {{ends_at}}, {{renewal_url}}'}
                                {activeTemplate.id === 'order_confirmed' && '{{customer_name}}, {{restaurant_name}}, {{table_number}}, {{order_number}}, {{total}}'}
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
