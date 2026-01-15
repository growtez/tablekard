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

import { db, auth } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    serverTimestamp,
    QueryDocumentSnapshot
} from 'firebase/firestore';

// Import Types
import {
    Restaurant,
    RestaurantStatus,
    User,
    UserRole,
    Order,
    OrderStatus,
    DeliveryAgent
} from '@restaurant-saas/types';

// ============================================
// RESTAURANT MANAGEMENT
// ============================================

/**
 * Get all restaurants with pagination
 */
export const getRestaurants = async (limitCount: number = 20, lastDoc: QueryDocumentSnapshot | null = null) => {
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
            restaurants: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant)),
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
        };
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
    }
};

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as Restaurant;
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
    }
};

/**
 * Create a new restaurant
 */
export const createRestaurant = async (restaurantData: Partial<Restaurant>) => {
    try {
        const docRef = await addDoc(collection(db, 'restaurants'), {
            ...restaurantData,
            status: RestaurantStatus.TRIAL,
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
export const approveRestaurant = async (restaurantId: string) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(docRef, {
            status: RestaurantStatus.ACTIVE,
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
export const suspendRestaurant = async (restaurantId: string, reason: string) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(docRef, {
            status: RestaurantStatus.SUSPENDED,
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
export const reactivateRestaurant = async (restaurantId: string) => {
    try {
        const docRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(docRef, {
            status: RestaurantStatus.ACTIVE,
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
export const deleteRestaurant = async (restaurantId: string) => {
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
export const getUsers = async (limitCount: number = 20, lastDoc: QueryDocumentSnapshot | null = null, role: UserRole | null = null) => {
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
            users: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as User)),
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
    try {
        const docRef = doc(db, 'users', userId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as unknown as User;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

/**
 * Update user role
 */
export const updateUserRole = async (userId: string, role: UserRole) => {
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
export const suspendUser = async (userId: string, reason: string) => {
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
export const reactivateUser = async (userId: string) => {
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
export const getDrivers = async (limitCount: number = 20, lastDoc: QueryDocumentSnapshot | null = null) => {
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
            drivers: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as DeliveryAgent)),
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
        };
    } catch (error) {
        console.error('Error fetching drivers:', error);
        throw error;
    }
};

/**
 * Approve driver
 */
export const approveDriver = async (driverId: string) => {
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
export const suspendDriver = async (driverId: string, reason: string) => {
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

interface OrderFilters {
    status?: OrderStatus;
    restaurantId?: string;
}

/**
 * Get all orders with filters
 */
export const getOrders = async (filters: OrderFilters = {}, limitCount: number = 50) => {
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
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

/**
 * Cancel order (admin override)
 */
export const cancelOrder = async (orderId: string, reason: string) => {
    try {
        const docRef = doc(db, 'orders', orderId);
        await updateDoc(docRef, {
            status: OrderStatus.CANCELLED,
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
export const getRevenueStats = async (startDate: Date, endDate: Date) => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            where('status', '==', OrderStatus.DELIVERED)
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => doc.data() as Order);

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
export const getRecentOrders = async (limitCount: number = 10) => {
    try {
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
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
export const updateSystemConfig = async (config: any) => {
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
export const logAdminAction = async (action: string, details: any) => {
    try {
        if (!auth.currentUser) return;

        await addDoc(collection(db, 'auditLogs'), {
            action,
            details,
            adminId: auth.currentUser.uid,
            adminEmail: auth.currentUser.email,
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
export const getAuditLogs = async (limitCount: number = 100) => {
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

const firebaseService = {
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

export default firebaseService;
