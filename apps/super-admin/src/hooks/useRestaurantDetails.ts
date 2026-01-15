import { useState, useEffect } from 'react';
import firebaseService from '../services/firebaseService';
import { Restaurant } from '@restaurant-saas/types';

export function useRestaurantDetails(id: string | undefined) {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRestaurant = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await firebaseService.getRestaurantById(id);
            if (!data) {
                setError('Restaurant not found');
            } else {
                setRestaurant(data);
                setError(null);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch restaurant');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurant();
    }, [id]);

    const handleUpdate = async (data: Partial<Restaurant>) => {
        // Implementation for updating restaurant would go here
        // We'd need to add updateRestaurant to firebaseService first
        console.log('Update not implemented yet', data);
    };

    return {
        restaurant,
        loading,
        error,
        refresh: fetchRestaurant,
        update: handleUpdate
    };
}
