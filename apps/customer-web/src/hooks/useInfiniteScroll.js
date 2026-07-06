import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * A custom hook for client-side progressive rendering (infinite scroll).
 * @param {Array} items - The full array of items to paginate.
 * @param {number} itemsPerPage - Number of items to load per scroll chunk.
 * @returns {object} - { visibleItems, loaderRef, hasMore, reset }
 */
export const useInfiniteScroll = (items = [], itemsPerPage = 10) => {
    const [visibleCount, setVisibleCount] = useState(itemsPerPage);
    const loaderRef = useRef(null);

    // Reset visible count if the base items array changes significantly
    // (optional, but good if filters change)
    useEffect(() => {
        setVisibleCount(itemsPerPage);
    }, [itemsPerPage]); // Intentionally omitting `items` to avoid resetting scroll position when items dynamically update (e.g., realtime updates)

    useEffect(() => {
        const currentLoader = loaderRef.current;
        if (!currentLoader) return;

        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting) {
                setVisibleCount(prev => Math.min(prev + itemsPerPage, items.length));
            }
        }, {
            root: null,
            rootMargin: '200px', // Start loading slightly before the user reaches the very bottom
            threshold: 0.1
        });

        observer.observe(currentLoader);

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [items.length, itemsPerPage]);

    const visibleItems = useMemo(() => {
        return items.slice(0, visibleCount);
    }, [items, visibleCount]);

    const hasMore = visibleCount < items.length;

    const reset = () => setVisibleCount(itemsPerPage);

    return { visibleItems, loaderRef, hasMore, reset, visibleCount };
};
