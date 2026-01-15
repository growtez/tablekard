import { useState, useEffect } from 'react';
import firebaseService from '../services/firebaseService';
import { Restaurant, Order } from '@restaurant-saas/types';

export function useDashboardStats() {
    const [stats, setStats] = useState<{
        totalUsers: number;
        totalRestaurants: number;
        totalDrivers: number;
        totalOrders: number;
    } | null>(null);

    const [revenue, setRevenue] = useState<{
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
    } | null>(null);

    const [recentRestaurants, setRecentRestaurants] = useState<Restaurant[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Calculate current month date range
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const [statsData, restaurantsData, ordersData, revenueData] = await Promise.all([
                firebaseService.getPlatformStats(),
                firebaseService.getRestaurants(5), // Top 5 recent
                firebaseService.getRecentOrders(5),
                firebaseService.getRevenueStats(startOfMonth, endOfMonth)
            ]);

            setStats(statsData);
            setRecentRestaurants(restaurantsData.restaurants);
            setRecentOrders(ordersData);
            setRevenue(revenueData);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        stats,
        revenue,
        recentRestaurants,
        recentOrders,
        loading,
        error,
        refresh: fetchData
    };
}
