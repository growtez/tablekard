import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Megaphone, Zap, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
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

  const { activeRestaurantId } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!activeRestaurantId) return;
      try {
        // Fetch Specific Notifications (Which now includes Broadcasts)
        const { data: specificData, error: specificError } = await db
            .from('restaurant_notifications')
            .select('*')
            .eq('restaurant_id', activeRestaurantId)
            .order('created_at', { ascending: false });

        if (specificError) throw specificError;

        let allNotifications: Notification[] = [];
        if (specificData) {
            allNotifications = specificData.map(n => ({
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

    // Mark as read when page is viewed
    localStorage.setItem('lastReadNotificationDate', new Date().toISOString());
    window.dispatchEvent(new Event('notificationsRead'));
  }, [activeRestaurantId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'update': return <RefreshCw size={22} className="text-[#3B82F6]" />;
      case 'feature': return <Zap size={22} className="text-[#F59E0B]" />;
      case 'alert': return <AlertCircle size={22} className="text-[#EF4444]" />;
      case 'info':
      default: return <Megaphone size={22} className="text-[#10B981]" />;
    }
  };
  
  const getTypeBadge = (type: string) => {
    switch(type) {
        case 'update': return <span className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">System Update</span>;
        case 'feature': return <span className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">New Feature</span>;
        case 'alert': return <span className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Important Alert</span>;
        default: return <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Announcement</span>;
    }
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease]">
      <div className="flex flex-col mb-8 max-md:-mt-[52px] max-md:mb-[12px] max-md:ml-[56px]">
        <h1 className="text-[28px] font-extrabold text-tk-text tracking-tight m-0">System Notifications</h1>
        <p className="text-[14px] text-tk-text-secondary mt-1">Updates and announcements from the TableKard team.</p>
      </div>

      <div className="flex-1 overflow-auto w-full max-w-4xl mx-auto bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-[24px] shadow-sm mb-6 relative">
        {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-tk-text-secondary">
                <Loader2 size={32} className="animate-spin mb-4 text-tk-primary" />
                <p>Checking for updates...</p>
            </div>
        ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-20 h-20 bg-tk-bg-surface border border-tk-border rounded-[24px] flex items-center justify-center mb-6 shadow-sm rotate-3">
                <Bell className="text-tk-text-secondary opacity-60" size={36} />
                </div>
                <h3 className="text-[22px] font-extrabold text-tk-text mb-2">You're all caught up!</h3>
                <p className="text-tk-text-secondary text-[15px] max-w-md leading-relaxed mb-6">
                There are no new announcements at the moment. We'll let you know when something important happens.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-tk-success-bg text-tk-success border border-tk-success/20 rounded-full font-bold text-[13px] tracking-wide uppercase">
                <CheckCircle2 size={16} />
                <span>All Clear</span>
                </div>
            </div>
        ) : (
            <div className="p-6 md:p-10">
                <div className="space-y-4 max-w-2xl mx-auto">
                    {notifications.map(notif => (
                        <div key={notif.id} className="group relative flex gap-4 p-5 rounded-2xl bg-tk-bg-surface border border-tk-border hover:border-tk-primary/30 transition-all hover:shadow-md">
                            <div className="mt-1 shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-tk-bg shadow-sm border border-tk-border flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                {getTypeIcon(notif.type)}
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-[16px] font-bold text-tk-text">{notif.title}</h3>
                                        {getTypeBadge(notif.type)}
                                    </div>
                                    <span className="text-[12px] font-medium text-tk-text-secondary uppercase tracking-wider">
                                        {new Date(notif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-[14px] text-tk-text-secondary leading-relaxed whitespace-pre-wrap">
                                    {notif.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
