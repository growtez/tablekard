import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '@restaurant-saas/supabase';
import { ListOrdered } from 'lucide-react';
import './FloatingQueueButton.css';

const FloatingQueueButton = () => {
    const { user } = useAuth();
    const { restaurantId } = useRestaurant();
    const navigate = useNavigate();
    const location = useLocation();
    const [hasActiveOrder, setHasActiveOrder] = useState(false);

    useEffect(() => {
        if (!user?.id || !restaurantId) {
            setHasActiveOrder(false);
            return;
        }

        const checkActiveOrders = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('orders')
                .select('id, status')
                .eq('restaurant_id', restaurantId)
                .eq('customer_id', user.id)
                .gte('created_at', today.toISOString())
                .neq('status', 'cancelled')
                .neq('status', 'completed')
                .neq('status', 'served')
                .neq('status', 'SERVED');

            if (!error && data && data.length > 0) {
                // Only show if there are truly active (not-yet-ready) orders
                const hasNonReadyOrders = data.some(o =>
                    o.status !== 'ready' && o.status !== 'READY'
                );
                setHasActiveOrder(hasNonReadyOrders);
            } else {
                setHasActiveOrder(false);
            }
        };

        checkActiveOrders();

        const subscription = supabase
            .channel('public:orders:floating_btn')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
                (payload) => {
                    if (payload.new?.customer_id === user.id || payload.old?.customer_id === user.id) {
                        checkActiveOrders();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user?.id, restaurantId]);

    // Don't show the button if we are already on the live-queue page
    if (!hasActiveOrder || location.pathname === '/live-queue') {
        return null;
    }

    return (
        <button 
            className="floating-queue-btn" 
            onClick={() => navigate('/live-queue')}
            aria-label="View Live Queue"
        >
            <ListOrdered size={24} />
            <span className="pulse-indicator"></span>
        </button>
    );
};

export default FloatingQueueButton;
