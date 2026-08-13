import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Megaphone, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import { CardListSkeleton } from '../../components/ui/Skeleton';

// Stored in platform_settings: id TEXT PRIMARY KEY, config JSONB, updated_at TIMESTAMPTZ
// Key: 'announcements', config: { items: [{id, title, body, level, created_at}] }
const LEVELS = ['info', 'warning', 'maintenance'];
const LEVEL_COLORS = { info: '#3b82f6', warning: '#f59e0b', maintenance: '#ef4444' };
const LEVEL_LABELS = { info: 'Info', warning: 'Warning', maintenance: 'Maintenance' };
const LEVEL_VARIANTS = { info: 'info', warning: 'warning', maintenance: 'error' };

export default function Announcements({ setSyncAction }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ title: '', body: '', level: 'info' });
    const [showForm, setShowForm] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('platform_settings')
                .select('config, updated_at')
                .eq('id', 'announcements')
                .maybeSingle();
            if (err) throw err;
            setAnnouncements(data?.config?.items || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (setSyncAction) setSyncAction({ onSync: fetchData, loading }); }, [loading, setSyncAction]);

    const saveAnnouncements = async (items) => {
        setSaving(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('platform_settings')
                .upsert({ id: 'announcements', config: { items }, updated_at: new Date().toISOString() }, { onConflict: 'id' });
            if (err) throw err;
            setAnnouncements(items);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAdd = async () => {
        if (!form.title.trim() || !form.body.trim()) { setError('Title and message are required.'); return; }
        const newItem = { id: crypto.randomUUID(), title: form.title.trim(), body: form.body.trim(), level: form.level, created_at: new Date().toISOString() };
        await saveAnnouncements([newItem, ...announcements]);
        setForm({ title: '', body: '', level: 'info' });
        setShowForm(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this announcement?')) return;
        await saveAnnouncements(announcements.filter(a => a.id !== id));
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Platform Announcements</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        Stored in <code>platform_settings</code> (id = <code>'announcements'</code>, config JSONB).
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', border: '1px solid hsla(155,100%,50%,0.2)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', gap: '6px', display: 'flex', alignItems: 'center' }}>
                    <Plus size={16} /> New Announcement
                </button>
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {showForm && (
                <Card style={{ border: '1px solid hsla(155,100%,50%,0.2)' }}>
                    <CardHeader><CardTitle style={{ fontSize: '1rem' }}>Compose Announcement</CardTitle></CardHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Title</label>
                            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Scheduled Maintenance Tonight" style={{ marginTop: '0.25rem' }} />
                        </div>
                        <div>
                            <label>Message</label>
                            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Full announcement text..." rows={3}
                                style={{ marginTop: '0.25rem', resize: 'vertical', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '0.9rem', width: '100%' }} />
                        </div>
                        <div>
                            <label>Level</label>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                {LEVELS.map(lv => (
                                    <button key={lv} onClick={() => setForm(f => ({ ...f, level: lv }))}
                                        style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: form.level === lv ? `${LEVEL_COLORS[lv]}20` : 'var(--surface-hover)', color: form.level === lv ? LEVEL_COLORS[lv] : 'var(--text-muted)', border: form.level === lv ? `1px solid ${LEVEL_COLORS[lv]}50` : '1px solid var(--border-color)' }}>
                                        {LEVEL_LABELS[lv]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowForm(false)} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>Cancel</button>
                            <button onClick={handleAdd} disabled={saving} style={{ background: 'var(--accent-primary)', color: 'black', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                                {saving ? 'Saving…' : 'Publish'}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {loading ? (
                <CardListSkeleton count={4} />
            ) : announcements.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Megaphone size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                    <p>No active announcements. Use the button above to create one.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {announcements.map(a => (
                        <div key={a.id} className="premium-card" style={{ borderLeft: `4px solid ${LEVEL_COLORS[a.level] || '#3b82f6'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.title}</span>
                                        <Badge variant={LEVEL_VARIANTS[a.level] || 'info'} style={{ fontSize: '0.65rem' }}>{LEVEL_LABELS[a.level]}</Badge>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{a.body}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        <Clock size={12} />
                                        {new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(a.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '6px 10px', borderRadius: '8px', flexShrink: 0 }} title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
