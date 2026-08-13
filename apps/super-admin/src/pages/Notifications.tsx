import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Megaphone, Trash2, Send, Zap, RefreshCw, AlertCircle, Bell, Search, Filter, X, Edit3, Save, Loader2 } from 'lucide-react';

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

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Modal state
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editMessage, setEditMessage] = useState('');
    const [editType, setEditType] = useState('update');
    const [saving, setSaving] = useState(false);

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
                            dbIds: copies.map(c => c.id),
                            restaurantIds: copies.map(c => c.restaurant_id),
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
                    type: type,
                    created_at: new Date().toISOString()
                }));
            } else {
                inserts = [{
                    restaurant_id: selectedRestaurantId,
                    title: title.trim(),
                    message: message.trim(),
                    type: type,
                    created_at: new Date().toISOString()
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

    // Modal open/close
    const handleOpenModal = (notif) => {
        setSelectedNotif(notif);
        setIsEditing(false);
        setEditTitle(notif.title);
        setEditMessage(notif.message);
        setEditType(notif.type);
    };

    const handleCloseModal = () => {
        setSelectedNotif(null);
        setIsEditing(false);
    };

    // Save edit: delete old rows and insert fresh ones → restaurant-admin sees them as new/unread
    const handleSaveEdit = async () => {
        if (!editTitle.trim() || !editMessage.trim()) return;
        setSaving(true);
        try {
            const now = new Date().toISOString();
            const { error: delError } = await supabase
                .from('restaurant_notifications')
                .delete()
                .in('id', selectedNotif.dbIds);
            if (delError) throw delError;

            const inserts = selectedNotif.restaurantIds.map(rid => ({
                restaurant_id: rid,
                title: editTitle.trim(),
                message: editMessage.trim(),
                type: editType,
                created_at: now
            }));
            const { error: insError } = await supabase
                .from('restaurant_notifications')
                .insert(inserts);
            if (insError) throw insError;

            handleCloseModal();
            fetchHistory();
        } catch (err) {
            console.error('Error updating notification:', err);
            alert('Failed to update notification');
        } finally {
            setSaving(false);
        }
    };

    const getTypeIcon = (t, size = 20) => {
        switch (t) {
            case 'update': return <RefreshCw size={size} className="text-[#3B82F6]" />;
            case 'feature': return <Zap size={size} className="text-[#F59E0B]" />;
            case 'alert': return <AlertCircle size={size} className="text-[#EF4444]" />;
            case 'info':
            default: return <Megaphone size={size} className="text-[#10B981]" />;
        }
    };

    const getIconContainerColor = (type) => {
        switch (type) {
            case 'update': return 'bg-[#3B82F6]/10';
            case 'feature': return 'bg-[#F59E0B]/10';
            case 'alert': return 'bg-[#EF4444]/10';
            case 'info':
            default: return 'bg-[#10B981]/10';
        }
    };

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays === 0 && date.getDate() === now.getDate()) {
            if (diffHours === 0) return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
            return `${diffHours}h ago`;
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const groupNotifications = () => {
        const groups = {
            'Today': [],
            'Yesterday': [],
            'Older': []
        };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const filtered = historyGroups.filter(notif => {
            const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.message.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = filterType === 'all' || notif.type === filterType;

            return matchesSearch && matchesType;
        });

        filtered.forEach(notif => {
            const date = new Date(notif.created_at);
            if (date.toDateString() === today.toDateString()) {
                groups['Today'].push(notif);
            } else if (date.toDateString() === yesterday.toDateString()) {
                groups['Yesterday'].push(notif);
            } else {
                groups['Older'].push(notif);
            }
        });

        return groups;
    };

    const groupedNotifications = groupNotifications();

    return (
        <div className="animate-[fadeIn_0.3s_ease] w-full mx-auto">

            <div className="flex flex-col xl:flex-row gap-8 items-start">
                {/* Left Column: Send Form */}
                <div className="w-full xl:w-[400px] shrink-0 sticky top-6">
                    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border bg-surface-hover/50">
                            <h3 className="text-[16px] font-extrabold text-text-main flex items-center gap-2">
                                <Send size={18} className="text-accent-primary" />
                                Send Announcement
                            </h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSend} className="space-y-5">
                                <div>
                                    <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wide">Target Audience</label>
                                    <div className="flex gap-4 mb-3">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="target"
                                                value="broadcast"
                                                checked={targetAudience === 'broadcast'}
                                                onChange={() => setTargetAudience('broadcast')}
                                                className="accent-accent-primary w-4 h-4"
                                            />
                                            <span className="text-[14px] font-medium text-text-main group-hover:text-accent-primary transition-colors">Broadcast All</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="target"
                                                value="specific"
                                                checked={targetAudience === 'specific'}
                                                onChange={() => setTargetAudience('specific')}
                                                className="accent-accent-primary w-4 h-4"
                                            />
                                            <span className="text-[14px] font-medium text-text-main group-hover:text-accent-primary transition-colors">Specific</span>
                                        </label>
                                    </div>

                                    {targetAudience === 'specific' && (
                                        <select
                                            value={selectedRestaurantId}
                                            onChange={e => setSelectedRestaurantId(e.target.value)}
                                            className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all appearance-none"
                                        >
                                            <option value="" disabled>Select a restaurant...</option>
                                            {restaurants.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wide">Type</label>
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                        className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="info">Announcement (Info)</option>
                                        <option value="update">System Update</option>
                                        <option value="feature">New Feature</option>
                                        <option value="alert">Important Alert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wide">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. New Pricing Plans!"
                                        className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-text-main mb-2 uppercase tracking-wide">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Write your message here..."
                                        className="w-full bg-surface-hover border border-border rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all min-h-[120px] resize-y"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-accent-primary hover:bg-accent-secondary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-accent-primary/20"
                                >
                                    <Send size={18} />
                                    {submitting ? 'Sending...' : 'Broadcast Notification'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="flex-1 flex flex-col min-w-0 w-full">
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between mb-6">
                        <div className="flex items-center gap-2 w-full sm:max-w-md">
                            {/* Search Bar */}
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={16} className="text-text-muted" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search sent history..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all shadow-sm"
                                />
                            </div>

                            {/* Filter */}
                            <div className="relative shrink-0">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="pl-4 pr-10 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="all">All Types</option>
                                    <option value="update">Update</option>
                                    <option value="feature">Feature</option>
                                    <option value="alert">Alert</option>
                                    <option value="info">Announcement</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                                    <Filter size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center text-text-muted py-20">
                                <RefreshCw size={32} className="animate-spin mb-4 text-accent-primary" />
                                <p>Loading history...</p>
                            </div>
                        ) : historyGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3">
                                    <Bell className="text-text-muted opacity-50" size={36} />
                                </div>
                                <h3 className="text-[20px] font-extrabold text-text-main mb-2">No notifications sent</h3>
                                <p className="text-text-muted text-[15px] max-w-md leading-relaxed mb-6">
                                    You haven't sent any notifications yet. Use the form to send your first broadcast.
                                </p>
                            </div>
                        ) : (
                            <div className="pb-10">
                                <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                                    {['Today', 'Yesterday', 'Older'].map((groupKey) => {
                                        const groupNotifs = groupedNotifications[groupKey];
                                        if (groupNotifs.length === 0) return null;

                                        return (
                                            <div key={groupKey}>
                                                <div className="bg-surface-hover/80 px-6 py-2.5 border-y border-border first:border-t-0">
                                                    <h3 className="text-[13px] font-bold text-text-muted uppercase tracking-wider">{groupKey}</h3>
                                                </div>
                                                <div className="flex flex-col">
                                                    {groupNotifs.map(notif => {
                                                        return (
                                                            <div key={notif.dbIds[0]} onClick={() => handleOpenModal(notif)} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors group relative cursor-pointer">
                                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                    <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${getIconContainerColor(notif.type)}`}>
                                                                        {getTypeIcon(notif.type)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="text-[15px] font-bold text-text-main truncate group-hover:text-accent-primary transition-colors">{notif.title}</h4>
                                                                            <span className="text-[12px] text-text-muted whitespace-nowrap hidden sm:inline">
                                                                                • {getTimeAgo(notif.created_at)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[14px] text-text-muted truncate mb-1.5">
                                                                            {notif.message}
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            {notif.isBroadcast ? (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                                                    BROADCAST • {notif.restaurantCount}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                                                                    TARGETED • {notif.restaurantName || 'Specific Restaurant'}
                                                                                </span>
                                                                            )}
                                                                            <span className="sm:hidden text-[11px] text-text-muted">
                                                                                {getTimeAgo(notif.created_at)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="hidden sm:flex items-center gap-2 pl-4 shrink-0 self-center">
                                                                    <span className="text-[12px] font-bold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(notif.dbIds); }}
                                                                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Delete Notification"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                                {/* Mobile delete button */}
                                                                <div className="sm:hidden absolute top-4 right-4">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(notif.dbIds); }}
                                                                        className="p-1.5 text-text-muted hover:text-red-500 bg-surface-hover rounded-md"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {Object.values(groupedNotifications).every(group => group.length === 0) && historyGroups.length > 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <Search className="text-text-muted/50 mb-4" size={48} />
                                            <h3 className="text-[18px] font-bold text-text-main mb-1">No results found</h3>
                                            <p className="text-text-muted text-[14px]">
                                                We couldn't find any sent notifications matching your filters.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification Detail / Edit Modal */}
            {selectedNotif && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-border animate-[slideUp_0.25s_ease]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover/40">
                            <div className="flex items-center gap-3">
                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconContainerColor(isEditing ? editType : selectedNotif.type)}`}>
                                    {getTypeIcon(isEditing ? editType : selectedNotif.type, 18)}
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-text-main">
                                        {isEditing ? 'Edit Notification' : 'Notification Details'}
                                    </h3>
                                    <span className="text-[12px] text-text-muted">
                                        {selectedNotif.isBroadcast
                                            ? `Broadcast · ${selectedNotif.restaurantCount} restaurants`
                                            : `Targeted · ${selectedNotif.restaurantName || 'Specific'}`}
                                    </span>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                            {isEditing ? (
                                <>
                                    <div>
                                        <label className="block text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2">Type</label>
                                        <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all appearance-none">
                                            <option value="info">Announcement (Info)</option>
                                            <option value="update">System Update</option>
                                            <option value="feature">New Feature</option>
                                            <option value="alert">Important Alert</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2">Title</label>
                                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2">Message</label>
                                        <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} className="w-full bg-surface-hover border border-border rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all min-h-[120px] resize-y" />
                                    </div>
                                    <p className="text-[12px] text-text-muted bg-surface-hover rounded-xl px-4 py-3 border border-border">
                                        💡 Saving will re-send this as a fresh notification, marking it as <strong>unread</strong> for all recipients.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <div className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-1">Title</div>
                                        <h4 className="text-[18px] font-extrabold text-text-main">{selectedNotif.title}</h4>
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-1">Message</div>
                                        <div className="text-[15px] text-text-main leading-relaxed whitespace-pre-wrap">{selectedNotif.message}</div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[13px] text-text-muted pt-2 border-t border-border">
                                        <span>{new Date(selectedNotif.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border bg-surface-hover/30 flex items-center justify-between gap-3">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-5 py-2 rounded-xl border border-border text-text-muted hover:text-text-main hover:bg-surface-hover font-semibold text-[14px] transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-accent-primary hover:bg-accent-secondary text-white font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50">
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Saving...' : 'Save & Re-send'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleCloseModal} className="px-5 py-2 rounded-xl border border-border text-text-muted hover:text-text-main hover:bg-surface-hover font-semibold text-[14px] transition-colors">
                                        Close
                                    </button>
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2 bg-accent-primary hover:bg-accent-secondary text-white font-bold text-[14px] rounded-xl transition-colors">
                                        <Edit3 size={16} /> Edit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
