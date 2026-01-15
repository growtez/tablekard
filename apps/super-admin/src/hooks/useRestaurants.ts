import { useState, useEffect } from 'react';
import {
    getRestaurants,
    approveRestaurant,
    suspendRestaurant,
    reactivateRestaurant,
    deleteRestaurant
} from '../services/firebaseService.ts';
import { Restaurant } from '@restaurant-saas/types';

export function useRestaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const { restaurants: data } = await getRestaurants();
            setRestaurants(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch restaurants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await approveRestaurant(id);
            setRestaurants(prev => prev.map(r =>
                r.id === id ? { ...r, status: 'ACTIVE' as any } : r
            ));
        } catch (err: any) {
            console.error('Failed to approve restaurant', err);
            // Optionally set error toast here
        }
    };

    const handleSuspend = async (id: string, reason: string) => {
        try {
            await suspendRestaurant(id, reason);
            setRestaurants(prev => prev.map(r =>
                r.id === id ? { ...r, status: 'SUSPENDED' as any } : r
            ));
        } catch (err: any) {
            console.error('Failed to suspend restaurant', err);
        }
    };

    const handleReactivate = async (id: string) => {
        try {
            await reactivateRestaurant(id);
            setRestaurants(prev => prev.map(r =>
                r.id === id ? { ...r, status: 'ACTIVE' as any } : r
            ));
        } catch (err: any) {
            console.error('Failed to reactivate restaurant', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this restaurant?')) return;
        try {
            await deleteRestaurant(id);
            setRestaurants(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            console.error('Failed to delete restaurant', err);
        }
    };

    return {
        restaurants,
        loading,
        error,
        actions: {
            approve: handleApprove,
            suspend: handleSuspend,
            reactivate: handleReactivate,
            remove: handleDelete,
            refresh: fetchRestaurants
        }
    };
}
