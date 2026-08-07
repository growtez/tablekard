import React, { useState, useEffect } from 'react';
import { Bell, Megaphone, Zap, RefreshCw, AlertCircle, Loader2, Search, X, Filter } from 'lucide-react';
import { supabase as db } from '@restaurant-saas/supabase';
import { useAuth } from '../context/AuthContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    date: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const [lastReadDate, setLastReadDate] = useState<number>(0);
  const [readIds, setReadIds] = useState<string[]>([]);

  const { activeRestaurantId } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!activeRestaurantId) return;
      try {
        const { data: specificData, error: specificError } = await db
            .from('restaurant_notifications')
            .select('*')
            .eq('restaurant_id', activeRestaurantId)
            .order('created_at', { ascending: false });

        if (specificError) throw specificError;

        let allNotifications: Notification[] = [];
        if (specificData) {
            allNotifications = (specificData as any[]).map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                date: n.created_at
            }));
        }

        setNotifications(allNotifications);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();

    const lastReadStr = localStorage.getItem('lastReadNotificationDate');
    setLastReadDate(lastReadStr ? new Date(lastReadStr).getTime() : 0);
    const readIdsStr = localStorage.getItem('readNotificationIds');
    setReadIds(readIdsStr ? JSON.parse(readIdsStr) : []);
  }, [activeRestaurantId]);

  const isUnread = (notif: Notification) => {
    const isOlderThanMarkAll = new Date(notif.date).getTime() <= lastReadDate;
    const isIndividuallyRead = readIds.includes(notif.id);
    return !isOlderThanMarkAll && !isIndividuallyRead;
  };

  const handleNotificationClick = (notif: Notification) => {
    setSelectedNotification(notif);
    if (isUnread(notif)) {
      const newReadIds = [...readIds, notif.id];
      setReadIds(newReadIds);
      localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds));
      window.dispatchEvent(new Event('notificationsRead'));
    }
  };

  const handleMarkAllRead = () => {
    localStorage.setItem('lastReadNotificationDate', new Date().toISOString());
    setLastReadDate(new Date().getTime());
    localStorage.setItem('readNotificationIds', JSON.stringify([]));
    setReadIds([]);
    window.dispatchEvent(new Event('notificationsRead'));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'update': return <RefreshCw size={20} className="text-[#3B82F6]" />;
      case 'feature': return <Zap size={20} className="text-[#F59E0B]" />;
      case 'alert': return <AlertCircle size={20} className="text-[#EF4444]" />;
      case 'info':
      default: return <Megaphone size={20} className="text-[#10B981]" />;
    }
  };

  const getIconContainerColor = (type: string) => {
    switch (type) {
      case 'update': return 'bg-[#3B82F6]/10';
      case 'feature': return 'bg-[#F59E0B]/10';
      case 'alert': return 'bg-[#EF4444]/10';
      case 'info':
      default: return 'bg-[#10B981]/10';
    }
  };

  const getTimeAgo = (dateStr: string) => {
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
    const groups: { [key: string]: Notification[] } = {
      'Today': [],
      'Yesterday': [],
      'Older': []
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const filtered = notifications.filter(notif => {
      const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            notif.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || notif.type === filterType;
      
      return matchesSearch && matchesType;
    });

    filtered.forEach(notif => {
      const date = new Date(notif.date);
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
    <div className="animate-[fadeIn_0.3s_ease]">
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 max-md:-mt-[52px] max-md:ml-[56px] max-md:mb-[16px] mb-6">
        <div>
          <h1 className="text-[20px] sm:text-[28px] font-extrabold text-gray-900 dark:text-tk-text tracking-tight m-0">Notifications</h1>
          <p className="text-[13px] sm:text-[15px] text-gray-600 dark:text-tk-text-secondary mt-0.5">
            You have <span className="text-tk-burgundy font-bold">{notifications.length}</span> notifications to go through
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row gap-8 md:items-start">
        
        {/* Left Column (Desktop Filter Chips) */}
        <div className="hidden md:flex w-[260px] shrink-0 flex-col gap-3 sticky top-4 h-fit">
          <h3 className="text-[13px] font-bold text-gray-500 dark:text-tk-text-tertiary uppercase tracking-wider pl-1">Filter by Type</h3>
          <div className="flex flex-col gap-2">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'update', label: 'System Update' },
              { id: 'feature', label: 'New Feature' },
              { id: 'alert', label: 'Important Alert' },
              { id: 'info', label: 'Announcement' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all border text-left ${
                  filterType === type.id 
                    ? 'bg-tk-burgundy text-white border-tk-burgundy shadow-sm' 
                    : 'bg-white dark:bg-tk-bg-card border-gray-200 dark:border-tk-border text-gray-700 dark:text-tk-text hover:border-tk-burgundy/30 hover:bg-gray-50 dark:hover:bg-tk-bg-surface'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column (Search & List) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between mb-4">
            <div className="flex items-center gap-2 w-full sm:max-w-md">
              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-tk-bg-card border border-gray-200 dark:border-tk-border rounded-lg text-sm text-gray-900 dark:text-tk-text focus:outline-none focus:ring-2 focus:ring-tk-burgundy/50 focus:border-tk-burgundy transition-all shadow-sm"
                />
              </div>

              {/* Mobile Filter Button Dropdown (Inline with Search) */}
              <div className="md:hidden relative shrink-0">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-white dark:bg-tk-bg-card border border-gray-200 dark:border-tk-border rounded-lg text-sm font-bold text-gray-900 dark:text-tk-text focus:outline-none focus:ring-2 focus:ring-tk-burgundy/50 focus:border-tk-burgundy transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="update">Update</option>
                  <option value="feature">Feature</option>
                  <option value="alert">Alert</option>
                  <option value="info">Announcement</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-500">
                  <Filter size={14} />
                </div>
              </div>
            </div>

            <button onClick={handleMarkAllRead} className="text-[14px] font-bold text-tk-burgundy hover:text-tk-burgundy/80 hover:underline transition-colors whitespace-nowrap text-right sm:text-left pr-2 sm:pr-0">
              Mark all as Read
            </button>
          </div>

        <div className="w-full">
        {loading ? (
            <div className="flex flex-col items-center justify-center text-gray-500 py-20">
                <Loader2 size={32} className="animate-spin mb-4 text-tk-burgundy" />
                <p>Loading notifications...</p>
            </div>
        ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-white dark:bg-tk-bg-surface border border-gray-100 dark:border-tk-border rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3">
                <Bell className="text-gray-400" size={36} />
                </div>
                <h3 className="text-[22px] font-extrabold text-gray-900 dark:text-tk-text mb-2">You're all caught up!</h3>
                <p className="text-gray-500 dark:text-tk-text-secondary text-[15px] max-w-md leading-relaxed mb-6">
                There are no new announcements at the moment. We'll let you know when something important happens.
                </p>
            </div>
        ) : (
            <div className="pb-10">
                <div className="bg-white dark:bg-tk-bg-card rounded-2xl border border-gray-200 dark:border-tk-border overflow-hidden shadow-sm">
                  {['Today', 'Yesterday', 'Older'].map((groupKey) => {
                    const groupNotifs = groupedNotifications[groupKey];
                    if (groupNotifs.length === 0) return null;

                    return (
                      <div key={groupKey}>
                        <div className="bg-gray-50/80 dark:bg-tk-bg-surface px-6 py-2.5 border-y border-gray-200 dark:border-tk-border first:border-t-0">
                          <h3 className="text-[13px] font-bold text-gray-500 dark:text-tk-text-secondary uppercase tracking-wider">{groupKey}</h3>
                        </div>
                        <div className="flex flex-col">
                          {groupNotifs.map(notif => {
                            const unread = isUnread(notif);
                            return (
                            <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-tk-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-tk-bg-surface transition-colors cursor-pointer group ${unread ? 'bg-tk-burgundy/5 dark:bg-tk-burgundy/10' : ''}`}>
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="relative">
                                    <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${getIconContainerColor(notif.type)}`}>
                                        {getTypeIcon(notif.type)}
                                    </div>
                                    {unread && (
                                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white dark:border-tk-bg-card rounded-full"></span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                          <h4 className={`text-[15px] truncate transition-colors ${unread ? 'font-extrabold text-tk-text' : 'font-bold text-gray-900 dark:text-tk-text group-hover:text-tk-burgundy'}`}>{notif.title}</h4>
                                          <span className={`text-[13px] whitespace-nowrap ${unread ? 'text-tk-burgundy font-semibold' : 'text-gray-400 dark:text-tk-text-tertiary'}`}>
                                              {getTimeAgo(notif.date)}
                                          </span>
                                      </div>
                                      <p className={`text-[14px] truncate ${unread ? 'text-gray-800 dark:text-tk-text font-medium' : 'text-gray-600 dark:text-tk-text-secondary'}`}>
                                          {notif.message}
                                      </p>
                                  </div>
                                </div>
                                <div className="hidden sm:block pl-4 shrink-0 self-center">
                                  <span className="text-[13px] font-bold text-[#10B981] dark:text-[#10B981] uppercase tracking-wide">View</span>
                                </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.values(groupedNotifications).every(group => group.length === 0) && notifications.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="text-gray-300 mb-4" size={48} />
                        <h3 className="text-[18px] font-bold text-gray-900 dark:text-tk-text mb-1">No results found</h3>
                        <p className="text-gray-500 dark:text-tk-text-secondary text-[14px]">
                          We couldn't find any notifications matching your filters.
                        </p>
                    </div>
                  )}
                </div>
            </div>
        )}
      </div>
    </div>
  </div>
      
      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={() => setSelectedNotification(null)}>
          <div className="bg-white dark:bg-tk-bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-tk-border">
              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconContainerColor(selectedNotification.type)}`}>
                  {getTypeIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-tk-text">Notification Details</h3>
                  <span className="text-[12px] text-gray-500 dark:text-tk-text-secondary">
                    {new Date(selectedNotification.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-tk-bg-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h4 className="text-[18px] font-extrabold text-gray-900 dark:text-tk-text mb-4">{selectedNotification.title}</h4>
              <div className="text-[15px] text-gray-700 dark:text-tk-text-secondary leading-relaxed whitespace-pre-wrap font-medium">
                {selectedNotification.message}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-tk-border bg-gray-50/50 dark:bg-tk-bg-surface flex justify-end">
              <button 
                onClick={() => setSelectedNotification(null)}
                className="px-6 py-2 bg-tk-burgundy text-white rounded-lg font-semibold text-[14px] hover:bg-tk-burgundy/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
