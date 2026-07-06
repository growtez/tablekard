import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ArrowLeft, Clock, Star, Heart, X, Plus, Minus, Users, View } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ItemModal from '../components/ItemModal';
import { useRestaurant } from '../context/RestaurantContext';
import { getOffersForCustomer } from '../services/supabaseService';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import PageSkeleton from '../components/PageSkeleton';
import { supabase } from '@restaurant-saas/supabase';
import { Loader2 } from 'lucide-react';
import './discounts.css';

const DiscountsPage = () => {
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);

    const { restaurant } = useRestaurant();
    const [discountItems, setDiscountItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        document.body.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!restaurant?.id) return;
        setLoadingItems(true);
        
        const fetchDiscounts = () => {
            getOffersForCustomer(restaurant.id, 50)
                .then(discounts => setDiscountItems(discounts || []))
                .catch(err => console.error('Offers fetch failed:', err))
                .finally(() => setLoadingItems(false));
        };
        
        fetchDiscounts();

        const channel = supabase.channel('discounts-page-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'offers', filter: `restaurant_id=eq.${restaurant.id}` },
                () => {
                    getOffersForCustomer(restaurant.id, 50)
                        .then(discounts => setDiscountItems(discounts || []))
                        .catch(err => console.error('Offers fetch failed on real-time update:', err));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurant?.id]);

    useEffect(() => {
        if (showItemModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showItemModal]);

    const toggleFavorite = (itemId, e) => {
        if (e) e.stopPropagation();
        setFavorites(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const addToCart = (item, e) => {
        if (e) e.stopPropagation();
        setCart(prev => {
            const existingItem = prev.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prev.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId, event) => {
        if (event) event.stopPropagation();
        setCart(prev => {
            const existingItem = prev.find(item => item.id === itemId);
            if (existingItem && existingItem.quantity > 1) {
                return prev.map(item =>
                    item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return prev.filter(item => item.id !== itemId);
        });
    };

    const getItemQuantity = (itemId) => {
        const item = cart.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setModalStep(1);
        setShowItemModal(true);
    };

    const handleDirectAdd = (item, e) => {
        if (e) e.stopPropagation();
        if (item.variants?.length > 0 || item.addons?.length > 0) {
            setSelectedItem(item);
            setModalStep(2);
            setShowItemModal(true);
        } else {
            addToCart(item);
        }
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        setSelectedItem(null);
    };

    const { visibleItems, loaderRef, hasMore } = useInfiniteScroll(discountItems, 10);

    return (
        <div className="discounts-page-container">
            <div className="discounts-hero">
                <div className="hero-pattern-overlay"></div>
                <button className="hero-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} color="#FFFFFF" />
                </button>
                <div className="hero-content">
                    <h1>Exclusive Offers</h1>
                    <p>Unlock the best deals on your favorite meals</p>
                </div>
            </div>

            <div className="discounts-content">
                {loadingItems ? (
                    <PageSkeleton />
                ) : (
                    <div className="menu-items">
                        {visibleItems.map(item => (
                            <div key={item.id} className="menu-item" onClick={() => handleItemClick(item)}>
                            <div className="menu-image-container">
                                <div className="image-scroll-wrapper">
                                    <div className="image-bg-wrapper">
                                        <img src={item.image} alt={item.name} loading="lazy" />
                                        <div className="discount-badge-overlay">{item.discount}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="menu-details">
                                <div className="details-header">
                                    <div className="title-desc">
                                        <h3>{item.name}</h3>
                                        {item.subtitle && (
                                            <p className="menu-description" style={{ fontStyle: 'italic', color: '#888' }}>{item.subtitle}</p>
                                        )}
                                    </div>
                                    <button
                                        className="favorite-btn-inline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(item.id);
                                        }}
                                    >
                                        <Heart
                                            size={20}
                                            fill={favorites.includes(item.id) ? '#8B3A1E' : 'transparent'}
                                            color={favorites.includes(item.id) ? '#8B3A1E' : '#B8ADA9'}
                                        />
                                    </button>
                                </div>

                                <div className="details-meta">
                                    <div className="meta-item">
                                        <Star size={14} fill="#8B3A1E" color="#8B3A1E" />
                                        <span>{item.rating}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Clock size={14} color="#1A1A1A" />
                                        <span>{item.time}</span>
                                    </div>
                                    <div className="serves-pill">
                                        <Users size={12} /> {item.serves}
                                    </div>
                                </div>

                                <div className="details-footer">
                                    <div className="price-vegan">
                                        {item.originalPrice && item.originalPrice !== item.price && (
                                            <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '12px', marginRight: '4px' }}>₹{item.originalPrice}</span>
                                        )}
                                        <span className="price-text">₹{item.price}</span>
                                    </div>
                                    {getItemQuantity(item.id) === 0 ? (
                                        <button
                                            className="add-btn-large"
                                            onClick={(e) => handleDirectAdd(item, e)}
                                        >
                                            <Plus size={20} color="#FFFFFF" />
                                        </button>
                                    ) : (
                                        <div className="menu-qty-stepper" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="menu-stepper-btn"
                                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="menu-stepper-value">{getItemQuantity(item.id)}</span>
                                            <button
                                                className="menu-stepper-btn"
                                                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Progressive Rendering Loader */}
                    <div ref={loaderRef} style={{ height: '20px', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        {hasMore && <Loader2 className="discounts-spinner animate-spin" size={20} color="#888" />}
                    </div>
                </div>
                )}
            </div>

            {/* Dish Details Modal - Shared from Home */}
            <ItemModal
                isOpen={showItemModal}
                onClose={closeItemModal}
                item={selectedItem}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                initialStep={modalStep}
            />
            {/* Bottom Navigation
            {!showItemModal && <BottomNav />} */}
        </div>
    );
};

export default DiscountsPage;
