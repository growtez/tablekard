import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Megaphone, Trash2, Send, Zap, RefreshCw, AlertCircle } from 'lucide-react';

export default function Notifications() {
    const [loading, setLoading] = useState(true);
    
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('update'); // update, alert, info, feature
    
    const [targetAudience, setTargetAudience] = useState('broadcast');
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
    
    const [submitting, setSubmitting] = useState(false);
    
    const [historyGroups, setHistoryGroups] = useState([]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurant_notifications')
                .select('*, restaurants(name)')
                .order('created_at', { ascending: false })
                .limit(300);
                
            if (error) throw error;
            
            if (data) {
                // Group duplicates (from broadcasts) so the UI stays clean
                const grouped = [];
                const seen = new Set();
                for (const notif of data) {
                    const key = `${notif.title}|${notif.message}|${notif.type}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const copies = data.filter(n => `${n.title}|${n.message}|${n.type}` === key);
                        grouped.push({
                            ...notif,
                            isBroadcast: copies.length > 1,
                            dbIds: copies.map(c => c.id), // Store all DB ids for bulk deletion
                            restaurantCount: copies.length,
                            restaurantName: notif.restaurants?.name
                        });
                    }
                }
                setHistoryGroups(grouped);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const { data } = await supabase.from('restaurants').select('id, name').order('name');
            if (data) {
                setRestaurants(data);
                if (data.length > 0) setSelectedRestaurantId(data[0].id);
            }
        } catch (err) {
            console.error('Error fetching restaurants:', err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;
        if (targetAudience === 'specific' && !selectedRestaurantId) {
            alert('Please select a restaurant first.');
            return;
        }
        
        setSubmitting(true);
        try {
            let inserts = [];
            
            if (targetAudience === 'broadcast') {
                if (restaurants.length === 0) throw new Error('No active restaurants to broadcast to.');
                inserts = restaurants.map(r => ({
                    restaurant_id: r.id,
                    title: title.trim(),
                    message: message.trim(),
                    type: type
                }));
            } else {
                inserts = [{
                    restaurant_id: selectedRestaurantId,
                    title: title.trim(),
                    message: message.trim(),
                    type: type
                }];
            }
            
            const { error } = await supabase
                .from('restaurant_notifications')
                .insert(inserts);
                
            if (error) throw error;
            
            fetchHistory(); // Refresh history list
            
            setTitle('');
            setMessage('');
            setType('update');
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notification');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (dbIds) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        
        try {
            const { error } = await supabase
                .from('restaurant_notifications')
                .delete()
                .in('id', dbIds);
                
            if (error) throw error;
            setHistoryGroups(prev => prev.filter(g => g.dbIds[0] !== dbIds[0]));
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification');
        }
    };

    const getTypeIcon = (t) => {
        switch(t) {
            case 'update': return <RefreshCw size={16} className="text-blue-500" />;
            case 'feature': return <Zap size={16} className="text-yellow-500" />;
            case 'alert': return <AlertCircle size={16} className="text-red-500" />;
            default: return <Megaphone size={16} className="text-green-500" />;
        }
    };
    
    const getTypeBadgeColor = (t) => {
        switch(t) {
            case 'update': return 'info';
            case 'feature': return 'warning';
            case 'alert': return 'danger';
            default: return 'success';
        }
    };

    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Megaphone className="text-accent-primary" />
                        Global Notifications
                    </h1>
                    <p className="text-text-muted mt-1">Broadcast announcements to all restaurant dashboards.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Send Announcement</CardTitle>
                        </CardHeader>
                        <div className="p-4">
                            <form onSubmit={handleSend} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-2">Target Audience</label>
                                    <div className="flex gap-4 mb-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="target" 
                                                value="broadcast" 
                                                checked={targetAudience === 'broadcast'} 
                                                onChange={() => setTargetAudience('broadcast')}
                                                className="accent-accent-primary"
                                            />
                                            <span className="text-sm text-text-main">Broadcast All</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="target" 
                                                value="specific" 
                                                checked={targetAudience === 'specific'} 
                                                onChange={() => setTargetAudience('specific')}
                                                className="accent-accent-primary"
                                            />
                                            <span className="text-sm text-text-main">Specific Restaurant</span>
                                        </label>
                                    </div>
                                    
                                    {targetAudience === 'specific' && (
                                        <select 
                                            value={selectedRestaurantId} 
                                            onChange={e => setSelectedRestaurantId(e.target.value)}
                                            className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary mb-3"
                                        >
                                            <option value="" disabled>Select a restaurant...</option>
                                            {restaurants.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-1">Type</label>
                                    <select 
                                        value={type} 
                                        onChange={e => setType(e.target.value)}
                                        className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                                    >
                                        <option value="info">General Info</option>
                                        <option value="update">System Update</option>
                                        <option value="feature">New Feature</option>
                                        <option value="alert">Important Alert</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-1">Title</label>
                                    <input 
                                        type="text" 
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. New Pricing Plans!"
                                        className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-1">Message</label>
                                    <textarea 
                                        value={message} 
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Write your message here..."
                                        className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary min-h-[120px]"
                                        required
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full bg-accent-primary hover:bg-accent-secondary text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Send size={18} />
                                    {submitting ? 'Sending...' : 'Broadcast'}
                                </button>
                            </form>
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sent History</CardTitle>
                        </CardHeader>
                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <p className="text-text-muted text-center py-4">Loading...</p>
                            ) : historyGroups.length === 0 ? (
                                <div className="text-center py-10 flex flex-col items-center">
                                    <Megaphone size={40} className="text-border mb-3" />
                                    <p className="text-text-muted">No notifications found.</p>
                                </div>
                            ) : (
                                historyGroups.map(group => (
                                    <div key={group.dbIds[0]} className="p-5 rounded-2xl border border-border bg-surface-hover hover:border-accent-primary/40 transition-all relative group/item flex justify-between shadow-sm">
                                        <div className="flex gap-4">
                                            <div className="mt-1">
                                                {getTypeIcon(group.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-bold text-text-main">{group.title}</h3>
                                                    <Badge variant={getTypeBadgeColor(group.type)} className="text-[10px] uppercase">
                                                        {group.type}
                                                    </Badge>
                                                    {group.isBroadcast ? (
                                                        <Badge variant="info" className="text-[10px] bg-blue-100 text-blue-700 border-none font-bold">
                                                            Broadcast (Sent to {group.restaurantCount})
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] border-none bg-indigo-100 text-indigo-700 font-bold">
                                                            Targeted: {group.restaurantName || 'Specific Restaurant'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-muted mb-2 whitespace-pre-wrap">{group.message}</p>
                                                <p className="text-xs text-text-muted opacity-60">
                                                    {new Date(group.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(group.dbIds)}
                                            className="text-text-muted hover:text-red-500 transition-colors self-start opacity-0 group-hover/item:opacity-100 p-2"
                                            title="Delete Notification"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
