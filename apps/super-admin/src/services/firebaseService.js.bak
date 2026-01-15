/**
 * Firebase Service for Super Admin Panel
 * 
 * This file contains all Firebase operations for platform-wide management:
 * - Restaurant management (approve, suspend, delete)
 * - User management
 * - Driver management
 * - Platform analytics
 * - System configuration
 */

import { db, auth, storage } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    serverTimestamp
} from 'firebase/firestore';

// ============================================
// RESTAURANT MANAGEMENT
// ============================================

/**
 * Get all restaurants with pagination
 */
export const getRestaurants = async (limitCount = 20, lastDoc = null) => {
    try {
        let q = query(
            collection(db, 'restaurants'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        return {
            restaurants: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            lastDoc: snapshot.docs[snapshot.docs.length - 1]
        };
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
    }
};

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (restaurantId) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
    }
};

/**
 * Create a new restaurant
 */
export const createRestaurant = async (restaurantData) => {
    try {
        const docRef = await addDoc(collection(db, 'restaurants'), {
            ...restaurantData,
            isActive: true,
            isApproved: false,
            rating: 0,
            reviewCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...restaurantData };
    } catch (error) {
        console.error('Error creating restaurant:', error);
        throw error;
    }
};

/**
 * Approve restaurant
 */
export const approveRestaurant = async (restaurantId) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(docRef, {
            isApproved: true,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error approving restaurant:', error);
        throw error;
    }
};

/**
 * Suspend restaurant
 */
export const suspendRestaurant = async (restaurantId, reason) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(docRef, {
            isActive: false,
            suspendedAt: serverTimestamp(),
            suspensionReason: reason,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error suspending restaurant:', error);
        throw error;
    }
};

/**
 * Reactivate restaurant
 */
export const reactivateRestaurant = async (restaurantId) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(docRef, {
            isActive: true,
            suspendedAt: null,
            suspensionReason: null,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error reactivating restaurant:', error);
        throw error;
    }
};

/**
 * Delete restaurant (soft delete)
 */
export const deleteRestaurant = async (restaurantId) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(docRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        throw error;
    }
};

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get all users with pagination
 */
export const getUsers = async (limitCount = 20, lastDoc = null, role = null) => {
    try {
        let q = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (role) {
            q = query(q, where('role', '==', role));
        }

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        return {
            users: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            lastDoc: snapshot.docs[snapshot.docs.length - 1]
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
    try {
        const docRef = doc(db, 'users', userId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

/**
 * Update user role
 */
export const updateUserRole = async (userId, role) => {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            role,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

/**
 * Suspend user
 */
export const suspendUser = async (userId, reason) => {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            isSuspended: true,
            suspendedAt: serverTimestamp(),
            suspensionReason: reason,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error suspending user:', error);
        throw error;
    }
};

/**
 * Reactivate user
 */
export const reactivateUser = async (userId) => {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            isSuspended: false,
            suspendedAt: null,
            suspensionReason: null,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error reactivating user:', error);
        throw error;
    }
};

// ============================================
// DRIVER MANAGEMENT
// ============================================

/**
 * Get all drivers
 */
export const getDrivers = async (limitCount = 20, lastDoc = null) => {
    try {
        let q = query(
            collection(db, 'drivers'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        return {
            drivers: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            lastDoc: snapshot.docs[snapshot.docs.length - 1]
        };
    } catch (error) {
        console.error('Error fetching drivers:', error);
        throw error;
    }
};

/**
 * Approve driver
 */
export const approveDriver = async (driverId) => {
    try {
        const docRef = doc(db, 'drivers', driverId);
        await updateDoc(docRef, {
            isApproved: true,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error approving driver:', error);
        throw error;
    }
};

/**
 * Suspend driver
 */
export const suspendDriver = async (driverId, reason) => {
    try {
        const docRef = doc(db, 'drivers', driverId);
        await updateDoc(docRef, {
            isSuspended: true,
            suspendedAt: serverTimestamp(),
            suspensionReason: reason,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error suspending driver:', error);
        throw error;
    }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * Get all orders with filters
 */
export const getOrders = async (filters = {}, limitCount = 50) => {
    try {
        let q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        }

        if (filters.restaurantId) {
            q = query(q, where('restaurantId', '==', filters.restaurantId));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

/**
 * Cancel order (admin override)
 */
export const cancelOrder = async (orderId, reason) => {
    try {
        const docRef = doc(db, 'orders', orderId);
        await updateDoc(docRef, {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            cancellationReason: reason,
            cancelledBy: 'admin',
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
    }
};

// ============================================
// PLATFORM ANALYTICS
// ============================================

/**
 * Get platform statistics
 */
export const getPlatformStats = async () => {
    try {
        const [usersCount, restaurantsCount, driversCount, ordersCount] = await Promise.all([
            getCountFromServer(collection(db, 'users')),
            getCountFromServer(collection(db, 'restaurants')),
            getCountFromServer(collection(db, 'drivers')),
            getCountFromServer(collection(db, 'orders'))
        ]);

        return {
            totalUsers: usersCount.data().count,
            totalRestaurants: restaurantsCount.data().count,
            totalDrivers: driversCount.data().count,
            totalOrders: ordersCount.data().count
        };
    } catch (error) {
        console.error('Error fetching platform stats:', error);
        throw error;
    }
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (startDate, endDate) => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            where('status', '==', 'delivered')
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => doc.data());

        return {
            totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
            totalOrders: orders.length,
            averageOrderValue: orders.length > 0
                ? orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length
                : 0
        };
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        throw error;
    }
};

/**
 * Get recent orders
 */
export const getRecentOrders = async (limitCount = 10) => {
    try {
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        throw error;
    }
};

// ============================================
// SYSTEM CONFIGURATION
// ============================================

/**
 * Get system configuration
 */
export const getSystemConfig = async () => {
    try {
        const docRef = doc(db, 'config', 'system');
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return {};
        return snapshot.data();
    } catch (error) {
        console.error('Error fetching system config:', error);
        throw error;
    }
};

/**
 * Update system configuration
 */
export const updateSystemConfig = async (config) => {
    try {
        const docRef = doc(db, 'config', 'system');
        await updateDoc(docRef, {
            ...config,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating system config:', error);
        throw error;
    }
};

// ============================================
// AUDIT LOG
// ============================================

/**
 * Log admin action
 */
export const logAdminAction = async (action, details) => {
    try {
        await addDoc(collection(db, 'auditLogs'), {
            action,
            details,
            adminId: auth.currentUser?.uid,
            adminEmail: auth.currentUser?.email,
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error logging admin action:', error);
        // Don't throw - logging shouldn't break the main action
    }
};

/**
 * Get audit logs
 */
export const getAuditLogs = async (limitCount = 100) => {
    try {
        const q = query(
            collection(db, 'auditLogs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }
};

export default {
    // Restaurants
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    approveRestaurant,
    suspendRestaurant,
    reactivateRestaurant,
    deleteRestaurant,

    // Users
    getUsers,
    getUserById,
    updateUserRole,
    suspendUser,
    reactivateUser,

    // Drivers
    getDrivers,
    approveDriver,
    suspendDriver,

    // Orders
    getOrders,
    cancelOrder,

    // Analytics
    getPlatformStats,
    getRevenueStats,
    getRecentOrders,

    // System
    getSystemConfig,
    updateSystemConfig,

    // Audit
    logAdminAction,
    getAuditLogs
};
