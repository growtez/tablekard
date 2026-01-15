import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { SubscriptionPlan, RestaurantStatus } from '@restaurant-saas/types';

export function useSubscriptionStats() {
    const [stats, setStats] = useState<any[]>([]);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [revenueLoading, setRevenueLoading] = useState(true);
    const [monthlyRevenue, setMonthlyRevenue] = useState<{
        current: number;
        last: number;
        growth: number;
    } | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const restaurantsRef = collection(db, 'restaurants');

            // Get counts for each plan
            const [qrCount, deliveryCount, trialCount] = await Promise.all([
                getCountFromServer(query(restaurantsRef, where('subscription.plan', '==', SubscriptionPlan.QR), where('status', '==', RestaurantStatus.ACTIVE))),
                getCountFromServer(query(restaurantsRef, where('subscription.plan', '==', SubscriptionPlan.DELIVERY), where('status', '==', RestaurantStatus.ACTIVE))),
                getCountFromServer(query(restaurantsRef, where('status', '==', RestaurantStatus.TRIAL)))
            ]);

            // Calculate basic revenue stats (estimated from counts)
            // Ideally this would come from a payments collection
            const qrRevenue = qrCount.data().count * 999;
            const deliveryRevenue = deliveryCount.data().count * 1499;

            setStats([
                { label: 'QR Plan (₹999)', count: qrCount.data().count, revenue: `₹${qrRevenue.toLocaleString()}` },
                { label: 'Delivery Plan (₹1,499)', count: deliveryCount.data().count, revenue: `₹${deliveryRevenue.toLocaleString()}` },
                { label: 'Trial', count: trialCount.data().count, revenue: '₹0' },
            ]);

            // Mock recent payments since we don't have a payments collection yet
            // In a real app we would fetch from 'payments' collection
            setRecentPayments([
                { id: 1, restaurant: 'Pizza Paradise', plan: 'DELIVERY', amount: '₹1,499', date: new Date().toLocaleDateString(), status: 'SUCCESS' },
                { id: 2, restaurant: 'Tandoori Nights', plan: 'QR', amount: '₹999', date: new Date().toLocaleDateString(), status: 'SUCCESS' },
            ]);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRevenue = async () => {
        try {
            setRevenueLoading(true);
            // In a real app we'd aggregate payment documents. 
            // Here we'll mock it based on active subscriptions for now as we did above, but time-boxed.
            // Placeholder:
            setMonthlyRevenue({
                current: 233302,
                last: 198450,
                growth: 17.5
            });
        } catch (error) {
            console.error(error);
        } finally {
            setRevenueLoading(false);
        }
    }

    useEffect(() => {
        fetchStats();
        fetchRevenue();
    }, []);

    return {
        stats,
        monthlyRevenue,
        recentPayments,
        loading,
        revenueLoading,
        refresh: fetchStats
    };
}
