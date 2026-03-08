import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to handle automatic data refetching when:
 * 1. Tab becomes visible after being hidden
 * 2. At regular intervals (optional)
 * 
 * Usage:
 * ```typescript
 * const fetchData = useCallback(async () => {
 *   const data = await someApiCall();
 *   setData(data);
 * }, [dependencies]);
 * 
 * useTabVisibilityRefetch(fetchData, {
 *   enabled: true,
 *   autoRefreshInterval: 30000, // 30 seconds
 *   refetchOnMount: true
 * });
 * ```
 */
export const useTabVisibilityRefetch = (
  fetchFn: () => Promise<void>,
  options: {
    enabled?: boolean;
    autoRefreshInterval?: number; // in milliseconds, 0 to disable
    refetchOnMount?: boolean;
    debounceMs?: number; // prevent rapid refetches
  } = {}
) => {
  const {
    enabled = true,
    autoRefreshInterval = 0,
    refetchOnMount = true,
    debounceMs = 1000,
  } = options;

  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  const safeFetch = useCallback(
    async (force = false) => {
      if (!enabled) return;

      // Prevent duplicate simultaneous fetches
      if (fetchingRef.current && !force) {
        console.log('[useTabVisibilityRefetch] Already fetching, skipping...');
        return;
      }

      // Debounce rapid refetches (unless forced)
      const now = Date.now();
      if (!force && now - lastFetchRef.current < debounceMs) {
        console.log('[useTabVisibilityRefetch] Debouncing refetch');
        return;
      }

      fetchingRef.current = true;

      try {
        await fetchFn();
        lastFetchRef.current = Date.now();
      } catch (error) {
        console.error('[useTabVisibilityRefetch] Fetch failed:', error);
      } finally {
        fetchingRef.current = false;
      }
    },
    [fetchFn, enabled, debounceMs]
  );

  // Initial fetch on mount
  useEffect(() => {
    if (refetchOnMount && enabled) {
      safeFetch(true);
    }
  }, [enabled]); // Only run on mount or when enabled changes

  // Handle tab visibility changes
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useTabVisibilityRefetch] Tab became visible, refetching...');
        // Small delay to ensure Supabase connection is restored
        setTimeout(() => {
          safeFetch(true);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, safeFetch]);

  // Auto-refresh interval (only when tab is visible)
  useEffect(() => {
    if (!enabled || autoRefreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('[useTabVisibilityRefetch] Auto-refresh triggered');
        safeFetch();
      }
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [enabled, autoRefreshInterval, safeFetch]);

  // Return the safeFetch function for manual refetching
  return safeFetch;
};