/**
 * Custom React Query hooks for all Supabase data fetching.
 *
 * Benefits over raw useEffect + useState:
 *   - Automatic caching & deduplication across components
 *   - refetchOnWindowFocus  → seamless tab-switch refresh
 *   - Retry logic (3 attempts) → handles transient network issues
 *   - staleTime avoids unnecessary re-fetches while keeping data fresh
 *   - Shared loading/error/data states
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMenuItems,
  getMenuCategories,
  getDashboardOrders,
  getOrders,
  getPaymentTransactions,
  getRestaurantTables,
  getRestaurantById,
} from '../services/supabaseService';
import type { MenuItem, MenuCategory, Restaurant, Order } from '@restaurant-saas/types';
import type { DashboardOrder, PaymentTransaction, RestaurantTable } from '../services/supabaseService';

// ─── Stale times ────────────────────────────────────────────────────
const STALE_30S = 30 * 1000;   // data pages (orders, payments)
const STALE_2M = 2 * 60 * 1000; // slower-changing data (menu, tables)

// ─── Query key factories ────────────────────────────────────────────
export const queryKeys = {
  restaurant: (id: string) => ['restaurant', id] as const,
  menuItems: (restaurantId: string) => ['menuItems', restaurantId] as const,
  menuCategories: (restaurantId: string) => ['menuCategories', restaurantId] as const,
  dashboardOrders: (restaurantId: string) => ['dashboardOrders', restaurantId] as const,
  orders: (restaurantId: string) => ['orders', restaurantId] as const,
  payments: (restaurantId: string) => ['payments', restaurantId] as const,
  tables: (restaurantId: string) => ['tables', restaurantId] as const,
};

// ─── Restaurant ─────────────────────────────────────────────────────
export function useRestaurant(restaurantId: string | null) {
  return useQuery<Restaurant | null>({
    queryKey: queryKeys.restaurant(restaurantId ?? ''),
    queryFn: () => getRestaurantById(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_2M,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// ─── Menu ───────────────────────────────────────────────────────────
export function useMenuItems(restaurantId: string | null) {
  return useQuery<MenuItem[]>({
    queryKey: queryKeys.menuItems(restaurantId ?? ''),
    queryFn: () => getMenuItems(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_2M,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

export function useMenuCategories(restaurantId: string | null) {
  return useQuery<MenuCategory[]>({
    queryKey: queryKeys.menuCategories(restaurantId ?? ''),
    queryFn: () => getMenuCategories(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_2M,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// ─── Orders ─────────────────────────────────────────────────────────
export function useDashboardOrders(restaurantId: string | null) {
  return useQuery<DashboardOrder[]>({
    queryKey: queryKeys.dashboardOrders(restaurantId ?? ''),
    queryFn: () => getDashboardOrders(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_30S,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,  // auto-poll every 30s for a real-time feel
    retry: 3,
  });
}

export function useOrders(restaurantId: string | null, limit?: number) {
  return useQuery<Order[]>({
    queryKey: queryKeys.orders(restaurantId ?? ''),
    queryFn: () => getOrders(restaurantId!, limit),
    enabled: !!restaurantId,
    staleTime: STALE_30S,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// ─── Payments ───────────────────────────────────────────────────────
export function usePaymentTransactions(restaurantId: string | null) {
  return useQuery<PaymentTransaction[]>({
    queryKey: queryKeys.payments(restaurantId ?? ''),
    queryFn: () => getPaymentTransactions(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_30S,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// ─── Tables ─────────────────────────────────────────────────────────
export function useRestaurantTables(restaurantId: string | null) {
  return useQuery<RestaurantTable[]>({
    queryKey: queryKeys.tables(restaurantId ?? ''),
    queryFn: () => getRestaurantTables(restaurantId!),
    enabled: !!restaurantId,
    staleTime: STALE_2M,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// ─── Invalidation helper ────────────────────────────────────────────
/**
 * Returns helper functions to invalidate specific query groups after mutations.
 */
export function useInvalidateQueries() {
  const qc = useQueryClient();
  return {
    invalidateMenu: (restaurantId: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.menuItems(restaurantId) });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(restaurantId) });
    },
    invalidateOrders: (restaurantId: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboardOrders(restaurantId) });
      qc.invalidateQueries({ queryKey: queryKeys.orders(restaurantId) });
    },
    invalidatePayments: (restaurantId: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.payments(restaurantId) });
    },
    invalidateTables: (restaurantId: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.tables(restaurantId) });
    },
    invalidateAll: (restaurantId: string) => {
      qc.invalidateQueries({ queryKey: ['menuItems', restaurantId] });
      qc.invalidateQueries({ queryKey: ['menuCategories', restaurantId] });
      qc.invalidateQueries({ queryKey: ['dashboardOrders', restaurantId] });
      qc.invalidateQueries({ queryKey: ['orders', restaurantId] });
      qc.invalidateQueries({ queryKey: ['payments', restaurantId] });
      qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
    },
  };
}
