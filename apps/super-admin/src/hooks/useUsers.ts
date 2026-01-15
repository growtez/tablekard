import { useState, useEffect } from 'react';
import firebaseService from '../services/firebaseService';
import { User, UserRole } from '@restaurant-saas/types';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { users: data } = await firebaseService.getUsers(50); // Fetch first 50
            setUsers(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            await firebaseService.updateUserRole(userId, role as UserRole);
            setUsers(prev => prev.map(u =>
                u.uid === userId ? { ...u, role: role as UserRole } : u
            ));
        } catch (err: any) {
            console.error('Failed to update user role', err);
            throw err;
        }
    };

    return {
        users,
        loading,
        error,
        updateRole: handleUpdateRole,
        refresh: fetchUsers
    };
}
