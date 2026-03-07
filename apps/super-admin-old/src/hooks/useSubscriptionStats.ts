import { useState, useEffect } from 'react';
import supabaseService from '../services/supabaseService';
import { SubscriptionPlan } from '@restaurant-saas/types';

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

            const { activeCount, trialCount } = await supabaseService.getSubscriptionStats();

            setStats([
                {
                    label: `QR Plan (${SubscriptionPlan.QR})`,
                    count: activeCount,
                    revenue: 'Manual'
                },
                {
                    label: 'Trial',
                    count: trialCount,
                    revenue: '₹0'
                }
            ]);

            setRecentPayments([]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRevenue = async () => {
        try {
            setRevenueLoading(true);
            setMonthlyRevenue({
                current: 0,
                last: 0,
                growth: 0
            });
        } catch (error) {
            console.error(error);
        } finally {
            setRevenueLoading(false);
        }
    };

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
