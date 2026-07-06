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
            const { data, error } = await supabase
                .from('orders')
                .select('id, status')
                .eq('restaurant_id', restaurantId)
                .eq('customer_id', user.id)
                .in('status', ['pending', 'confirmed', 'preparing'])
                .limit(1);

            if (!error && data && data.length > 0) {
                setHasActiveOrder(true);
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

    // Add extra padding to the body when the button is visible so we can scroll past it
    useEffect(() => {
        if (hasActiveOrder && location.pathname !== '/live-queue') {
            document.body.classList.add('has-floating-btn');
        } else {
            document.body.classList.remove('has-floating-btn');
        }
        return () => document.body.classList.remove('has-floating-btn');
    }, [hasActiveOrder, location.pathname]);

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
