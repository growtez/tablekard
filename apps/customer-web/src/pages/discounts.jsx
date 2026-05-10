import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ArrowLeft, Clock, Star, Heart, X, Plus, Minus, Users, View } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useRestaurant } from '../context/RestaurantContext';
import { getDiscountItemsForHome } from '../services/supabaseService';
import PageSkeleton from '../components/PageSkeleton';
import './discounts.css';

const DiscountsPage = () => {
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
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
        getDiscountItemsForHome(restaurant.id, 20)
            .then(discounts => setDiscountItems(discounts || []))
            .catch(err => console.error('Discounts fetch failed:', err))
            .finally(() => setLoadingItems(false));
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
        setShowItemModal(true);
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        setSelectedItem(null);
    };

    return (
        <div className="discounts-page-container">
            <header className="discounts-header">
                <button className="global-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <h1>Discounts</h1>
            </header>

            <div className="discounts-content">
                {loadingItems ? (
                    <PageSkeleton />
                ) : (
                    <div className="menu-items">
                        {discountItems.map(item => (
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
                                        <p className="menu-description">{item.subtitle}</p>
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
                                        <span className="price-text">₹{item.price}</span>
                                    </div>
                                    {getItemQuantity(item.id) === 0 ? (
                                        <button
                                            className="add-btn-large"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(item);
                                            }}
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
                </div>
                )}
            </div>

            {/* Dish Details Modal - Shared from Home */}
            {showItemModal && selectedItem && (
                <div className={`item-modal-overlay ${showItemModal ? 'show' : ''}`} onClick={closeItemModal}>
                    <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-drag-bar"></div>
                        <button className="modal-x-btn" onClick={closeItemModal}>
                            <X size={18} />
                        </button>

                        <div className="modal-dish-showcase">
                            <div className="dish-image-frame">
                                <img src={selectedItem.image} alt={selectedItem.name} />
                            </div>
                            <button
                                className="modal-fav-floating"
                                onClick={(e) => toggleFavorite(selectedItem.id, e)}
                            >
                                <Heart
                                    size={20}
                                    fill={favorites.includes(selectedItem.id) ? '#8B3A1E' : 'transparent'}
                                    color="#8B3A1E"
                                />
                            </button>
                            <div className="dish-rating-pill">
                                <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                                <span>{selectedItem.rating}</span>
                            </div>
                        </div>

                        <div className="modal-dish-info">
                            <h2 className="dish-title">{selectedItem.name}</h2>
                            <div className="dish-meta-chips">
                                <span className="meta-chip"><Clock size={13} />{selectedItem.time}</span>
                                <span className="meta-chip"><Users size={13} /> {selectedItem.serves}</span>
                                {selectedItem.dietType === 'veg' && <span className="meta-chip green">Veg</span>}
                                {selectedItem.dietType === 'non-veg' && <span className="meta-chip red">Non-Veg</span>}
                            </div>
                            <p className="dish-full-desc">{selectedItem.description}</p>
                            
                            <button 
                                className="view-ar-btn"
                                onClick={() => navigate(`/ar/${selectedItem.id}`, { state: { modelUrl: selectedItem.modelUrl } })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '16px',
                                    backgroundColor: '#f5ede9',
                                    color: '#8B3A1E',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <View size={18} />
                                View in AR
                            </button>
                        </div>

                        <div className="modal-bottom-bar">
                            <div className="price-display">
                                <span className="price-rupee">₹{selectedItem.price}</span>
                            </div>

                            {getItemQuantity(selectedItem.id) === 0 ? (
                                <button
                                    className="add-to-order-btn"
                                    onClick={() => addToCart(selectedItem)}
                                >
                                    Add to Order
                                </button>
                            ) : (
                                <div className="qty-stepper">
                                    <button
                                        className="stepper-btn"
                                        onClick={() => removeFromCart(selectedItem.id)}
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="stepper-count">{getItemQuantity(selectedItem.id)}</span>
                                    <button
                                        className="stepper-btn"
                                        onClick={() => addToCart(selectedItem)}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Bottom Navigation */}
            {!showItemModal && <BottomNav />}
        </div>
    );
};

export default DiscountsPage;
