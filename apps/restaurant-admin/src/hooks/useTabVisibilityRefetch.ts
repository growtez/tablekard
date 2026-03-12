import { useEffect, useCallback, useRef, useState } from 'react';

export const useTabVisibilityRefetch = (
  fetchFn: () => Promise<void>,
  options: {
    enabled?: boolean;
    autoRefreshInterval?: number;
    refetchOnMount?: boolean;
    debounceMs?: number;
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
  const fetchFnRef = useRef(fetchFn);
  const [refetching, setRefetching] = useState(false);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const safeFetch = useCallback(
    async (force = false) => {
      if (!enabled) return;
      if (fetchingRef.current && !force) return;

      const now = Date.now();
      if (!force && now - lastFetchRef.current < debounceMs) return;

      fetchingRef.current = true;
      setRefetching(true);

      try {
        await fetchFnRef.current();
        lastFetchRef.current = Date.now();
      } catch (error) {
        console.error('[useTabVisibilityRefetch] Fetch failed:', error);
      } finally {
        fetchingRef.current = false;
        setRefetching(false);
      }
    },
    [enabled, debounceMs]
  );

  useEffect(() => {
    if (refetchOnMount && enabled) {
      safeFetch(true);
    }
  }, [enabled, refetchOnMount, safeFetch]);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          safeFetch(true);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, safeFetch]);

  useEffect(() => {
    if (!enabled || autoRefreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        safeFetch();
      }
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [enabled, autoRefreshInterval, safeFetch]);

  return { refetch: safeFetch, refetching };
};
