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
            if (Array.isArray(parsed)) {
                // Migrate old format to new format and group duplicates
                const migrated = [];
                parsed.forEach(item => {
                    if (!item.configurations) {
                        const basePrice = item.variant ? item.variant.price : (item.price || 0);
                        const addonsPrice = (item.addons || []).reduce((sum, a) => sum + a.price, 0);
                        const variantId = item.variant ? item.variant.id : '';
                        const expectedId = `${item.menuItemId || item.id.split('_')[0]}_${variantId}`;
                        
                        const existing = migrated.find(i => i.id === expectedId);
                        if (existing) {
                            existing.quantity += item.quantity;
                            existing.configurations.push(...Array(item.quantity).fill({ addons: item.addons || [], addonsPrice }));
                        } else {
                            migrated.push({
                                ...item,
                                id: expectedId,
                                basePrice,
                                configurations: Array(item.quantity).fill({ addons: item.addons || [], addonsPrice })
                            });
                        }
                    } else {
                        // Already new format, check if we need to merge
                        const existing = migrated.find(i => i.id === item.id);
                        if (existing) {
                            existing.quantity += item.quantity;
                            existing.configurations.push(...item.configurations);
                        } else {
                            migrated.push(item);
                        }
                    }
                });
                return migrated;
            }
            return [];
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
        const variantId = selectedVariant ? selectedVariant.id : '';
        const compositeId = `${item.id}_${variantId}`;

        setCartItems(prev => {
            const existing = prev.find(i => i.id === compositeId);
            const basePrice = selectedVariant ? selectedVariant.price : (item.discount_price || item.price);
            const addonsPrice = (selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
            
            if (existing) {
                return prev.map(i => {
                    if (i.id === compositeId) {
                        const newConfigurations = [...(i.configurations || []), { addons: selectedAddons, addonsPrice }];
                        return { 
                            ...i, 
                            quantity: i.quantity + 1,
                            configurations: newConfigurations
                        };
                    }
                    return i;
                });
            }

            return [...prev, {
                id: compositeId,
                menuItemId: item.id,
                name: item.name,
                basePrice: basePrice,
                image: item.image_url || item.image,
                rating: item.rating || '4.5',
                serves: item.serves || '1',
                quantity: 1,
                variant: selectedVariant,
                configurations: [{ addons: selectedAddons, addonsPrice }]
            }];
        });
    };

    const removeFromCart = (id) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === id);
            let targetItem = existing;
            
            if (!targetItem) {
                const matching = prev.filter(i => i.menuItemId === id || i.id === id || i.id.startsWith(id + '_'));
                if (matching.length > 0) {
                    targetItem = matching[matching.length - 1];
                }
            }
            
            if (targetItem) {
                if (targetItem.quantity > 1) {
                    return prev.map(i => {
                        if (i.id === targetItem.id) {
                            const newConfigurations = [...(i.configurations || [])];
                            newConfigurations.pop(); // Remove the last added configuration
                            return { 
                                ...i, 
                                quantity: i.quantity - 1,
                                configurations: newConfigurations
                            };
                        }
                        return i;
                    });
                }
                return prev.filter(i => i.id !== targetItem.id);
            }
            return prev;
        });
    };

    const deleteFromCart = (itemId) => {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId, increment) => {
        setCartItems(prev => {
            return prev.map(item => {
                if (item.id === itemId) {
                    if (increment > 0) {
                        // Duplicate the last configuration when incrementing from cart UI
                        const lastConfig = item.configurations.length > 0 
                            ? item.configurations[item.configurations.length - 1] 
                            : { addons: [], addonsPrice: 0 };
                        return { 
                            ...item, 
                            quantity: item.quantity + 1,
                            configurations: [...item.configurations, lastConfig]
                        };
                    } else if (increment < 0) {
                        // Remove the last configuration
                        if (item.quantity > 1) {
                            const newConfigs = [...item.configurations];
                            newConfigs.pop();
                            return {
                                ...item,
                                quantity: item.quantity - 1,
                                configurations: newConfigs
                            };
                        }
                        return { ...item, quantity: 0 };
                    }
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const updateAddonQuantity = (itemId, addon, increment) => {
        setCartItems(prev => {
            return prev.map(item => {
                if (item.id === itemId) {
                    const addonKey = addon._key ?? addon.id ?? addon.name;
                    const newConfigs = JSON.parse(JSON.stringify(item.configurations || []));
                    
                    if (increment > 0) {
                        if (newConfigs.length === 0) {
                            newConfigs.push({ addons: [], addonsPrice: 0 });
                        }
                        const targetConfig = newConfigs[newConfigs.length - 1];
                        targetConfig.addons.push(addon);
                        targetConfig.addonsPrice = (targetConfig.addonsPrice || 0) + addon.price;
                    } else if (increment < 0) {
                        for (let i = newConfigs.length - 1; i >= 0; i--) {
                            const config = newConfigs[i];
                            const addonIndex = config.addons.findIndex(a => (a._key ?? a.id ?? a.name) === addonKey);
                            if (addonIndex !== -1) {
                                const removedAddon = config.addons[addonIndex];
                                config.addons.splice(addonIndex, 1);
                                config.addonsPrice -= removedAddon.price;
                                break;
                            }
                        }
                    }
                    return { ...item, configurations: newConfigs };
                }
                return item;
            });
        });
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
    
    // Calculate accurate subtotal by summing base price for all quantities + all addon prices in configurations
    const cartSubtotal = cartItems.reduce((sum, item) => {
        const itemBaseTotal = item.basePrice * item.quantity;
        const itemAddonsTotal = (item.configurations || []).reduce((addonSum, config) => addonSum + (config.addonsPrice || 0), 0);
        return sum + itemBaseTotal + itemAddonsTotal;
    }, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            setCartItems,
            addToCart,
            removeFromCart,
            deleteFromCart,
            updateQuantity,
            updateAddonQuantity,
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
