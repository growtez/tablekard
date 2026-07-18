import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bell, ChefHat, Clock, Utensils, Loader2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@restaurant-saas/supabase';
import './live_queue.css';

const LiveQueuePage = () => {
    const { user } = useAuth();
    const { restaurantId, restaurant } = useRestaurant();
    const navigate = useNavigate();
    const [expandedOrders, setExpandedOrders] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [isPulling, setIsPulling] = useState(false);
    const [pullY, setPullY] = useState(0);
    const touchStartY = useRef(0);

    const toggleOrderItems = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const [queueData, setQueueData] = useState({
        nowServing: null,
        preparing: [],
        upcoming: [],
        yourToken: null,
    });

    const fetchLiveQueue = async () => {
        if (!restaurant?.id) return;
        
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    order_number, 
                    status, 
                    customer_id,
                    updated_at,
                    order_items (status, name)
                `)
                .eq('restaurant_id', restaurant.id)
                .gte('created_at', twelveHoursAgo.toISOString())
                .neq('status', 'cancelled')
                .neq('status', 'completed')
                .neq('status', 'served')
                .order('created_at', { ascending: true }); // Oldest first

            if (error) throw error;

            const formatToken = (order) => {
                const items = order.order_items || [];
                const readyCount = items.filter(i => i.status === 'ready').length;
                const totalCount = items.length;
                return {
                    id: order.order_number ? order.order_number.split('-')[1].slice(-4) : order.id.slice(0, 4).toUpperCase(),
                    progress: totalCount > 0 ? `${readyCount}/${totalCount}` : ''
                };
            };

            const now = new Date();
            const activeData = data.filter(o => {
                if (o.status === 'ready') {
                    const updatedAt = new Date(o.updated_at);
                    const diffMins = (now - updatedAt) / (1000 * 60);
                    return diffMins <= 60;
                }
                return true;
            });

            const readyOrders = activeData.filter(o => o.status === 'ready');
            const preparingOrders = activeData.filter(o => o.status === 'preparing');
            const upcomingOrders = activeData.filter(o => o.status === 'pending' || o.status === 'confirmed');

            const nowServing = readyOrders.length > 0 ? formatToken(readyOrders[readyOrders.length - 1]) : null;
            const preparingTokens = preparingOrders.map(formatToken);
            const upcomingTokens = upcomingOrders.map(formatToken);

            let yourTokens = [];
            if (user?.id) {
                // Find all active user orders
                const userOrders = activeData.filter(o => o.customer_id === user.id);
                yourTokens = userOrders.map(o => {
                    const tokenData = formatToken(o);
                    const items = o.order_items || [];
                    const readyCount = items.filter(i => i.status === 'ready').length;
                    const totalCount = items.length;
                    return {
                        ...tokenData,
                        status: o.status,
                        progress: totalCount > 0 ? `${readyCount}/${totalCount} items ready` : '',
                        items: items.map(i => ({ name: i.name, status: i.status || 'placed' }))
                    };
                });
            }

            setQueueData({
                nowServing,
                preparing: preparingTokens,
                upcoming: upcomingTokens,
                yourTokens
            });
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching live queue:', err);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveQueue();

        if (restaurant?.id) {
            const subscription = supabase
                .channel('public:orders:queue')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
                    (payload) => {
                        fetchLiveQueue();
                    }
                )
                .subscribe();

            // Fallback poll
            const pollInterval = setInterval(() => {
                fetchLiveQueue();
            }, 10000);

            return () => {
                supabase.removeChannel(subscription);
                clearInterval(pollInterval);
            };
        }
    }, [restaurant?.id, user?.id]);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            touchStartY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        if (touchStartY.current > 0 && window.scrollY <= 0) {
            const y = e.touches[0].clientY;
            const pullDist = y - touchStartY.current;
            if (pullDist > 0) {
                setPullY(Math.min(pullDist, 100));
                if (pullDist > 10 && e.cancelable) {
                    e.preventDefault();
                }
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullY > 50 && !isPulling) {
            setIsPulling(true);
            await fetchLiveQueue();
            setIsPulling(false);
        }
        setPullY(0);
        touchStartY.current = 0;
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getYourPosition = (tokenId) => {
        const index = queueData.upcoming.findIndex(item => item.id === tokenId);
        return index >= 0 ? index + 1 : null;
    };

    const getOrdersAhead = () => {
        const preparingPenalty = queueData.preparing.length > 0 ? 1 : 0;

        if (queueData.yourTokens && queueData.yourTokens.length > 0) {
            // Treat the entire 'Preparing' section as exactly 1 block of work ahead of you.
            // If the kitchen is busy, add 1. Then add how many people are in front of you in the waiting queue.
            for (const token of queueData.yourTokens) {
                if (token.status === 'pending' || token.status === 'confirmed') {
                    const index = queueData.upcoming.findIndex(item => item.id === token.id);
                    if (index !== -1) {
                        return preparingPenalty + index;
                    }
                }
            }
            // If all their orders are already preparing or ready, ahead of you is 0
            return 0;
        }
        return preparingPenalty + queueData.upcoming.length; // Default
    };

    const getYourStatusDisplay = (token) => {
        if (!token) return { label: "", value: "", color: "", fontSize: "28px" };
        
        if (token.status === 'ready') {
            return { label: "", value: "Ready!", color: "#8B3A1E", fontSize: "24px" };
        }
        if (token.status === 'preparing') {
            return { label: "", value: "Preparing", color: "#8B3A1E", fontSize: "22px" };
        }
        
        const pos = getYourPosition(token.id);
        return { label: "Queue Pos", value: `#${pos}`, color: "#8B3A1E", fontSize: "28px" };
    };

    if (!user?.id || !restaurantId) {
        return (
            <div className="live-queue-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading queue data...</p>
            </div>
        );
    }

    if (restaurant?.kitchen_app_enabled === false) {
        return (
            <div className="live-queue-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ marginBottom: '10px', color: '#1A202C' }}>Live Queue Disabled</h2>
                    <p style={{ color: '#718096' }}>This restaurant does not currently use the live queue feature.</p>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#8B3A1E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="live-queue-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} color="#8B3A1E" />
            </div>
        );
    }

    return (
        <div 
            className="live-queue-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Spinner */}
            <div style={{
                height: `${pullY}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: isPulling ? 'none' : 'height 0.3s ease-out',
                background: 'transparent'
            }}>
                {pullY > 10 && (
                    <Loader2 
                        size={24} 
                        color="#8B3A1E" 
                        style={{ 
                            transform: `rotate(${pullY * 3}deg)`,
                            ...(isPulling ? { animation: 'spin 1s linear infinite' } : {})
                        }} 
                    />
                )}
            </div>

            {/* Header */}
            <header className="queue-header">
                <button className="global-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <div className="header-title">
                    <h1>Live Queue</h1>
                </div>
                <div className="live-badge">
                    <span className="pulse-dot"></span>
                    Live
                </div>
            </header>

            {/* Kitchen Animation Display */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <lottie-player 
                    src="/assets/kitchen-animation.json"
                    background="transparent" 
                    speed="1" 
                    style={{ width: '200px', height: '200px' }} 
                    loop 
                    autoplay
                ></lottie-player>
            </div>

            {/* Your Token Cards */}
            {queueData.yourTokens && queueData.yourTokens.map((token) => {
                const statusInfo = getYourStatusDisplay(token);
                const showArrow = token.status !== 'ready';
                const isExpanded = showArrow && !!expandedOrders[token.id];
                return (
                    <div className="your-token-card" key={token.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div 
                            style={{ display: 'flex', width: '100%', cursor: showArrow ? 'pointer' : 'default', borderBottom: isExpanded ? '1px solid rgba(139, 58, 30, 0.1)' : 'none' }}
                            onClick={() => showArrow && toggleOrderItems(token.id)}
                        >
                            <div className="your-token-left">
                                <span className="your-label">Your Order #</span>
                                <span className="your-number" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {token.id}
                                    {showArrow && (
                                        <ChevronDown 
                                            size={20} 
                                            color="#8B3A1E" 
                                            style={{ 
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }} 
                                        />
                                    )}
                                </span>
                            </div>
                            <div className="your-token-right">
                                {statusInfo.label && <span className="position-label">{statusInfo.label}</span>}
                                <span className="position-number" style={{ color: statusInfo.color, fontSize: statusInfo.fontSize }}>{statusInfo.value}</span>
                            </div>
                        </div>
                        {/* List of items with statuses */}
                        {isExpanded && token.items && token.items.length > 0 && (
                            <div style={{ padding: '16px 20px', background: '#FAFAFA', width: '100%' }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Items Status
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {token.items.map((item, idx) => {
                                        let badgeColor = '#FF9800'; // placed
                                        if (item.status === 'preparing') badgeColor = '#3B82F6';
                                        if (item.status === 'ready') badgeColor = '#22C55E';
                                        
                                        return (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                                <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{item.name}</span>
                                                <span style={{ 
                                                    fontSize: '10px', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontWeight: 'bold',
                                                    color: badgeColor,
                                                    backgroundColor: badgeColor + '12',
                                                    border: `1px solid ${badgeColor}30`,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Queue Timeline */}
            <div className="queue-timeline">

                {/* Preparing */}
                <div className="timeline-section">
                    <div className="timeline-header">
                        <ChefHat size={18} />
                        <span>Preparing Now</span>
                    </div>
                    <div className="timeline-tokens">
                        {queueData.preparing.map((order) => {
                            const isYours = queueData.yourTokens?.some(t => t.id === order.id);
                            return (
                                <div
                                    key={order.id}
                                    className={`timeline-token preparing ${isYours ? 'yours' : ''}`}
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '2px',
                                        padding: '10px 14px',
                                        minWidth: '70px',
                                        height: 'auto'
                                    }}
                                >
                                    <span style={{ fontSize: '18px', fontWeight: '800' }}>{order.id}</span>
                                    {order.progress && (
                                        <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'bold' }}>
                                            {order.progress}
                                        </span>
                                    )}
                                    {isYours && <span className="yours-badge" style={{ position: 'absolute', top: '-6px', right: '-6px' }}>You</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Queue */}
                <div className="timeline-section">
                    <div className="timeline-header">
                        <Clock size={18} />
                        <span>Order Queue</span>
                    </div>
                    <div className="timeline-tokens">
                        {queueData.upcoming.map((order) => {
                            const isYours = queueData.yourTokens?.some(t => t.id === order.id);
                            return (
                                <div
                                    key={order.id}
                                    className={`timeline-token upcoming ${isYours ? 'yours' : ''}`}
                                >
                                    {order.id}
                                    {isYours && <span className="yours-badge">You</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Info Footer */}
            <div className="queue-info">
                <div className="info-item">
                    <span className="info-value">{queueData.preparing.length}</span>
                    <span className="info-label">Preparing</span>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                    <span className="info-value">{queueData.upcoming.length}</span>
                    <span className="info-label">Waiting</span>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                    <span className="info-value">{getOrdersAhead()}</span>
                    <span className="info-label">{(queueData.yourTokens && queueData.yourTokens.length > 0) ? "Ahead of You" : "Total Active"}</span>
                </div>
            </div>
        </div>
    );
};

export default LiveQueuePage;
