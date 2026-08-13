import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChefHat, Clock, Loader2, Utensils, Users, CheckCircle2, Bell, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@restaurant-saas/supabase';
import Lottie from 'lottie-react';
import kitchenAnimation from '../assets/kitchen-animation.json';
import './live_queue.css';

/* ── Cloche SVG illustration ─────────────────────── */
const ClocheIllustration = () => (
    <svg className="lq-cloche-svg" width="90" height="60" viewBox="0 0 90 60" fill="none">
        <ellipse cx="45" cy="52" rx="35" ry="5" fill="#E8D0C8" opacity="0.5"/>
        <rect x="10" y="46" width="70" height="6" rx="3" fill="#C9A090"/>
        <path d="M15 46 Q45 5 75 46" fill="#D4B0A0" stroke="#C9A090" strokeWidth="1.5"/>
        <rect x="38" y="2" width="14" height="6" rx="3" fill="#C9A090"/>
    </svg>
);

const playBellChime = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        // Chime tone 1 (A5 - 880Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.5, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.2);

        // Chime tone 2 (E6 - 1320Hz, delayed 0.15s)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 1.5);

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } catch (e) {
        console.error('Error playing notification chime:', e);
    }
};

const LiveQueuePage = () => {
    const { user } = useAuth();
    const { restaurantId, restaurant } = useRestaurant();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [isPulling, setIsPulling] = useState(false);
    const [pullY, setPullY] = useState(0);
    const [notifyEnabled, setNotifyEnabled] = useState(() => {
        const saved = localStorage.getItem('tablekard_queue_notify');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [expandedOrders, setExpandedOrders] = useState({});
    const touchStartY = useRef(0);
    const prevReadyItemsRef = useRef(new Set());
    const isInitialFetchRef = useRef(true);
    const notifyEnabledRef = useRef(notifyEnabled);

    useEffect(() => {
        notifyEnabledRef.current = notifyEnabled;
        localStorage.setItem('tablekard_queue_notify', JSON.stringify(notifyEnabled));
    }, [notifyEnabled]);

    const handleToggleNotify = () => {
        setNotifyEnabled(prev => {
            const next = !prev;
            if (next) {
                playBellChime();
            }
            return next;
        });
    };

    const toggleOrderItems = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const [queueData, setQueueData] = useState({
        nowServing: null,
        preparing: [],
        upcoming: [],
        yourTokens: [],
    });

    const fetchLiveQueue = async () => {
        if (!restaurant?.id) return;
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`id, order_number, status, customer_id, updated_at, payment_status, order_items (status, name)`)
                .eq('restaurant_id', restaurant.id)
                .gte('created_at', twelveHoursAgo.toISOString())
                .neq('status', 'cancelled')
                .order('created_at', { ascending: true });
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
                if (o.status === 'ready' && o.payment_status === 'paid') {
                    const updatedAt = new Date(o.updated_at);
                    const diffMins = (now - updatedAt) / (1000 * 60);
                    return diffMins <= 15;
                }
                return true;
            });

            const readyOrders = activeData.filter(o => o.status === 'ready');
            const preparingOrders = activeData.filter(o => o.status === 'preparing');
            const upcomingOrders = activeData.filter(o => o.status === 'placed');

            const nowServing = readyOrders.length > 0 ? formatToken(readyOrders[readyOrders.length - 1]) : null;
            const preparingTokens = preparingOrders.map(formatToken);
            const upcomingTokens = upcomingOrders.map(formatToken);

            let yourTokens = [];
            const currentReadyItems = new Set();

            if (user?.id) {
                const userOrders = activeData.filter(o => o.customer_id === user.id);
                yourTokens = userOrders.map(o => {
                    const tokenData = formatToken(o);
                    const items = o.order_items || [];
                    const readyCount = items.filter(i => i.status === 'ready').length;
                    const totalCount = items.length;

                    // Collect ready item keys
                    items.forEach((i, idx) => {
                        if (i.status === 'ready') {
                            currentReadyItems.add(`${o.id}_${i.name || idx}`);
                        }
                    });

                    // If entire order is marked ready
                    if (o.status === 'ready') {
                        currentReadyItems.add(`${o.id}_ORDER_READY`);
                    }

                    return {
                        ...tokenData,
                        orderId: o.id,
                        status: o.status,
                        progress: totalCount > 0 ? `${readyCount}/${totalCount} items ready` : '',
                        items: items.map(i => ({ name: i.name, status: i.status || 'placed' }))
                    };
                }).reverse();
            }

            // Check if any item status changed to ready
            if (!isInitialFetchRef.current && notifyEnabledRef.current) {
                let newlyReadyDetected = false;
                for (const key of currentReadyItems) {
                    if (!prevReadyItemsRef.current.has(key)) {
                        newlyReadyDetected = true;
                        break;
                    }
                }
                if (newlyReadyDetected) {
                    playBellChime();
                }
            }

            prevReadyItemsRef.current = currentReadyItems;
            isInitialFetchRef.current = false;

            setQueueData({ nowServing, preparing: preparingTokens, upcoming: upcomingTokens, yourTokens });
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
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
                    () => fetchLiveQueue()
                ).subscribe();
            const pollInterval = setInterval(() => fetchLiveQueue(), 10000);
            return () => { supabase.removeChannel(subscription); clearInterval(pollInterval); };
        }
    }, [restaurant?.id, user?.id]);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
        if (touchStartY.current > 0 && window.scrollY <= 0) {
            const pullDist = e.touches[0].clientY - touchStartY.current;
            if (pullDist > 0) {
                setPullY(Math.min(pullDist, 100));
                if (pullDist > 10 && e.cancelable) e.preventDefault();
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

    const getYourPosition = (tokenId) => {
        const index = queueData.upcoming.findIndex(item => item.id === tokenId);
        return index >= 0 ? index + 1 : null;
    };

    const getOrdersAhead = () => {
        const preparingPenalty = queueData.preparing.length > 0 ? 1 : 0;
        if (queueData.yourTokens && queueData.yourTokens.length > 0) {
            for (const token of queueData.yourTokens) {
                if (token.status === 'pending' || token.status === 'confirmed') {
                    const index = queueData.upcoming.findIndex(item => item.id === token.id);
                    if (index !== -1) return preparingPenalty + index;
                }
            }
            return 0;
        }
        return preparingPenalty + queueData.upcoming.length;
    };

    /* timeline step state for a token */
    const getTimelineStep = (status) => {
        if (status === 'ready')     return 2; // all done
        if (status === 'preparing') return 1; // on step 2
        return 0;                             // placed (step 1)
    };

    /* ── guard states ───────────────────────────────── */
    if (!user?.id || !restaurantId) {
        return (
            <div className="lq-center-screen">
                <Loader2 size={36} className="lq-spin" color="#8B3A1E" />
            </div>
        );
    }

    if (restaurant?.kitchen_app_enabled === false) {
        return (
            <div className="lq-center-screen">
                <div className="lq-disabled-card">
                    <div className="lq-disabled-icon"><Utensils size={26} /></div>
                    <h2>Queue Not Available</h2>
                    <p>This restaurant doesn't use the live queue feature right now.</p>
                    <button className="lq-btn-primary" onClick={() => navigate('/')}>Back to Menu</button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="lq-center-screen">
                <Loader2 size={40} className="lq-spin" color="#8B3A1E" />
            </div>
        );
    }

    const firstYourToken = queueData.yourTokens?.[0] ?? null;
    const yourPosition   = firstYourToken ? getYourPosition(firstYourToken.id) : null;
    const timelineStep   = firstYourToken ? getTimelineStep(firstYourToken.status) : -1;

    return (
        <div
            className="lq-page"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull-to-refresh */}
            <div
                className="lq-ptr"
                style={{ height: `${pullY}px`, transition: isPulling ? 'none' : 'height 0.3s ease-out' }}
            >
                {pullY > 10 && (
                    <Loader2
                        size={22}
                        color="#8B3A1E"
                        style={{
                            transform: `rotate(${pullY * 3}deg)`,
                            ...(isPulling ? { animation: 'lq-spin 1s linear infinite' } : {})
                        }}
                    />
                )}
            </div>

            {/* Header */}
            <header className="lq-header">
                <button className="lq-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <span className="lq-title">Live Queue</span>
                <div className="lq-live-badge">
                    <span className="lq-pulse" />
                    Live
                </div>
            </header>

            {/* ── YOUR ORDER CARDS ──────────────────────── */}
            {queueData.yourTokens && queueData.yourTokens.map((token) => {
                const isExpanded = !!expandedOrders[token.id];
                const pos = getYourPosition(token.id);

                return (
                    <React.Fragment key={token.id}>
                        <div className="lq-your-card">
                            <div 
                                className="lq-your-top"
                                onClick={() => toggleOrderItems(token.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Left: order number */}
                                <div className="lq-your-left">
                                    <span className="lq-your-label">Your Order Number</span>
                                    <span className="lq-your-number" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {token.id}
                                        <ChevronDown 
                                            size={22} 
                                            color="#8B3A1E"
                                            style={{ 
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.25s ease'
                                            }}
                                        />
                                    </span>
                                </div>
                                <div className="lq-divider-v" />
                                {/* Right: position / status */}
                                <div className="lq-your-right">
                                    <span className="lq-pos-label">Your Position</span>
                                    {token.status === 'ready' ? (
                                        <span className="lq-pos-value" style={{ fontSize: '26px' }}>Ready!</span>
                                    ) : token.status === 'preparing' ? (
                                        <span className="lq-pos-value" style={{ fontSize: '22px' }}>Cooking</span>
                                    ) : (
                                        <>
                                            <span className="lq-pos-value">#{pos ?? '—'}</span>
                                            <span className="lq-pos-sub">in queue</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Dropdown Items Panel */}
                            {isExpanded && token.items && token.items.length > 0 && (
                                <div className="lq-items-panel">
                                    <div className="lq-items-title">Ordered Items</div>
                                    <div className="lq-items-list">
                                        {token.items.map((item, idx) => {
                                            let badgeColor = '#FF9800';
                                            let badgeBg = '#FF980015';
                                            if (item.status === 'preparing') { badgeColor = '#3B82F6'; badgeBg = '#3B82F615'; }
                                            if (item.status === 'ready')     { badgeColor = '#22C55E'; badgeBg = '#22C55E15'; }
                                            return (
                                                <div className="lq-item-row" key={idx}>
                                                    <span className="lq-item-name">{item.name}</span>
                                                    <span
                                                        className="lq-item-badge"
                                                        style={{
                                                            color: badgeColor,
                                                            backgroundColor: badgeBg,
                                                            border: `1px solid ${badgeColor}40`
                                                        }}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* notify strip */}
                            {/* <div className="lq-notify-strip">
                                <Bell size={14} color="#8B3A1E" />
                                <span>We'll notify you when it's your turn</span>
                            </div> */}
                        </div>

                        {/* ── STATUS TIMELINE ─────────────────────── */}
                        {(() => {
                            const isReady = token.status === 'ready' || (token.items && token.items.length > 0 && token.items.every(i => i.status === 'ready'));
                            const currentStep = getTimelineStep(token.status);
                            
                            return (
                                <div className="lq-timeline-wrap">
                                    <div className="lq-timeline-title">Order Status</div>
                                    <div className="lq-timeline">
                                        {/* Step 1 – Placed */}
                                        <div className="lq-tl-step">
                                            <div className={`lq-tl-dot ${currentStep === 0 ? 'active' : currentStep > 0 ? 'done' : ''}`}>
                                                {currentStep > 0 ? '✓' : '1'}
                                            </div>
                                            <span className={`lq-tl-label ${currentStep === 0 ? 'active' : currentStep > 0 ? 'done' : ''}`}>Placed</span>
                                        </div>
                                        <div className={`lq-tl-line ${currentStep > 0 ? 'done' : ''}`} />
                                        {/* Step 2 – Preparing */}
                                        <div className="lq-tl-step">
                                            <div className={`lq-tl-dot ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
                                                {currentStep > 1 ? '✓' : '2'}
                                            </div>
                                            <span className={`lq-tl-label ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>Preparing</span>
                                        </div>
                                        <div className={`lq-tl-line ${isReady ? 'ready-done' : currentStep === 1 ? 'active' : ''}`} />
                                        {/* Step 3 – Ready */}
                                        <div className="lq-tl-step">
                                            <div className={`lq-tl-dot ${isReady ? 'ready-done' : currentStep === 2 ? 'active' : ''}`}>
                                                {isReady ? '✓' : '3'}
                                            </div>
                                            <span className={`lq-tl-label ${isReady ? 'ready-done' : ''}`}>Ready</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </React.Fragment>
                );
            })}

            {/* ── KITCHEN ANIMATION (STANDALONE OUTSIDE) ────── */}
            <div className="lq-kitchen-standalone-anim">
                <Lottie
                    animationData={kitchenAnimation}
                    loop={true}
                    style={{ height: 180, width: '100%', maxWidth: '320px', margin: '0 auto' }}
                />
            </div>

            {/* ── PREPARING NOW ───────────────────────────── */}
            <div className="lq-section-card">
                <div className="lq-section-head">
                    <div className="lq-sec-icon chef">
                        <ChefHat size={18} />
                    </div>
                    <div className="lq-sec-texts">
                        <span className="lq-sec-title">Preparing Now</span>
                        <span className="lq-sec-sub">The kitchen is preparing orders</span>
                    </div>
                    <span className="lq-sec-count">{queueData.preparing.length} order{queueData.preparing.length !== 1 ? 's' : ''}</span>
                </div>
                {queueData.preparing.length === 0 ? (
                    <div className="lq-cloche-area">
                        <span className="lq-sparkle">✦</span>
                        <ClocheIllustration />
                        <span className="lq-sparkle">✦</span>
                    </div>
                ) : (
                    <div className="lq-tokens">
                        {queueData.preparing.map((order) => {
                            const isYours = queueData.yourTokens?.some(t => t.id === order.id);
                            return (
                                <div key={order.id} className={`lq-token preparing${isYours ? ' mine' : ''}`}>
                                    {order.id}
                                    {order.progress && <span className="lq-token-progress">{order.progress}</span>}
                                    {isYours && <span className="lq-mine-badge">You</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── UP NEXT ────────────────────────────────── */}
            <div className="lq-section-card">
                <div className="lq-section-head">
                    <div className="lq-sec-icon clock">
                        <Clock size={18} />
                    </div>
                    <div className="lq-sec-texts">
                        <span className="lq-sec-title">Up Next</span>
                    </div>
                    <span className="lq-sec-count">{queueData.upcoming.length} order{queueData.upcoming.length !== 1 ? 's' : ''}</span>
                </div>
                {queueData.upcoming.length === 0 ? (
                    <div className="lq-empty-section">No placed orders right now</div>
                ) : (
                    <div className="lq-tokens">
                        {queueData.upcoming.map((order) => {
                            const isYours = queueData.yourTokens?.some(t => t.id === order.id);
                            return (
                                <div key={order.id} className={`lq-token upcoming${isYours ? ' mine' : ''}`}>
                                    {order.id}
                                    {isYours && <span className="lq-mine-badge">You</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* ── BOTTOM NOTIFY BAR ──────────────────────── */}
            <div className="lq-bottom-bar">
                <Bell size={18} color="#8B3A1E" />
                <span>Relax! We'll notify you on this device</span>
                <label className="lq-toggle">
                    <input
                        type="checkbox"
                        checked={notifyEnabled}
                        onChange={handleToggleNotify}
                    />
                    <span className="lq-toggle-slider" />
                </label>
            </div>
        </div>
    );
};

export default LiveQueuePage;
