import React, { createContext, useContext, useState, useEffect } from 'react';

// Use a global singleton context to prevent HMR and duplicate import module issues in Vite
if (!window.__TablekardCartContext) {
    window.__TablekardCartContext = createContext(null);
}
const CartContext = window.__TablekardCartContext;

const STORAGE_KEY = 'tablekard_cart';

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const [orderSpecialInstructions, setOrderSpecialInstructions] = useState(() => {
        try {
            return sessionStorage.getItem('tablekard_special_instructions') || '';
        } catch {
            return '';
        }
    });

    // Persist cart to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
        sessionStorage.setItem('tablekard_special_instructions', orderSpecialInstructions);
    }, [cartItems, orderSpecialInstructions]);

    const addToCart = (item, selectedVariant = null, selectedAddons = []) => {
        const addonIds = (selectedAddons || []).map(a => a.id).sort().join(',');
        const variantId = selectedVariant ? selectedVariant.id : '';
        const compositeId = `${item.id}_${variantId}_${addonIds}`;

        setCartItems(prev => {
            const existing = prev.find(i => i.id === compositeId);
            if (existing) {
                return prev.map(i =>
                    i.id === compositeId ? { ...i, quantity: i.quantity + 1 } : i
                );
            }

            const basePrice = selectedVariant ? selectedVariant.price : (item.discount_price || item.price);
            const addonsPrice = (selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
            const totalPrice = basePrice + addonsPrice;

            return [...prev, {
                id: compositeId,
                menuItemId: item.id,
                name: item.name,
                price: totalPrice,
                image: item.image_url || item.image,
                rating: item.rating || '4.5',
                serves: item.serves || '1',
                quantity: 1,
                variant: selectedVariant,
                addons: selectedAddons,
            }];
        });
    };

    const removeFromCart = (id) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === id);
            if (existing) {
                if (existing.quantity > 1) {
                    return prev.map(i =>
                        i.id === id ? { ...i, quantity: i.quantity - 1 } : i
                    );
                }
                return prev.filter(i => i.id !== id);
            } else {
                // Treat id as base menuItemId and decrement the last added customized version
                const matching = prev.filter(i => i.menuItemId === id || i.id === id || i.id.startsWith(id + '_'));
                if (matching.length === 0) return prev;
                const lastItem = matching[matching.length - 1];
                if (lastItem.quantity > 1) {
                    return prev.map(i =>
                        i.id === lastItem.id ? { ...i, quantity: i.quantity - 1 } : i
                    );
                }
                return prev.filter(i => i.id !== lastItem.id);
            }
        });
    };

    const deleteFromCart = (itemId) => {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId, increment) => {
        setCartItems(prev =>
            prev
                .map(item => {
                    if (item.id === itemId) {
                        return { ...item, quantity: item.quantity + increment };
                    }
                    return item;
                })
                .filter(item => item.quantity > 0)
        );
    };



    const getItemQuantity = (itemId) => {
        return cartItems
            .filter(i => i.menuItemId === itemId || i.id === itemId || i.id.startsWith(itemId + '_'))
            .reduce((sum, item) => sum + item.quantity, 0);
    };

    const clearCart = () => {
        setCartItems([]);
        setOrderSpecialInstructions('');
    };

    const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            setCartItems,
            addToCart,
            removeFromCart,
            deleteFromCart,
            updateQuantity,
            orderSpecialInstructions,
            setOrderSpecialInstructions,
            getItemQuantity,
            clearCart,
            cartTotal,
            cartSubtotal,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within <CartProvider>');
    return ctx;
}
