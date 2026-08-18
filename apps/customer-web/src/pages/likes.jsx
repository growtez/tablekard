import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Star, Trash2, ShoppingCart, Plus, Minus, Users, Loader2, ArrowRight, X, Clock } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import { getFavorites, removeFavoriteFromDB } from '../services/supabaseService';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import ItemModal from '../components/ItemModal';
import './likes.css';

const LikesPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { restaurant } = useRestaurant();
    const { cartItems, addToCart, removeFromCart, getItemQuantity, cartTotal, cartSubtotal } = useCart();

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);

    const closeItemModal = () => {
        setShowItemModal(false);
        setIsVariantSheetOpen(false);
        setSelectedItem(null);
    };

    const { visibleItems, loaderRef, hasMore } = useInfiniteScroll(favorites, 10);

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

    useEffect(() => {
        const fetchFavorites = async (isBackground = false) => {
            if (!isAuthenticated || !user) {
                setLoading(false);
                return;
            }

            const cacheKey = `favorites_${user.id}_${restaurant?.id}`;
            
            if (!isBackground) {
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    try {
                        setFavorites(JSON.parse(cachedData));
                        setLoading(false);
                    } catch (e) {}
                } else {
                    setLoading(true);
                }
            }

            try {
                const data = await getFavorites(user.id, restaurant?.id);
                setFavorites(data);
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (err) {
                console.error('Failed to fetch favorites:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [isAuthenticated, user, restaurant?.id]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowItemModal(true);
    };


    const removeFavorite = async (itemId) => {
        if (!user) return;
        try {
            await removeFavoriteFromDB(user.id, itemId);
            setFavorites(prev => prev.filter(item => item.id !== itemId));
        } catch (err) {
            console.error('Failed to remove favorite:', err);
        }
    };

    if (loading) {
        return (
            <div className="likes-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={40} color="#8B3A1E" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="likes-page-container">
                <header className="likes-page-header">
                    <button className="global-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="likes-page-title">Favourites</h1>
                </header>
                <div className="likes-page-content">
                    <div className="likes-page-empty">
                        <div className="likes-page-empty-icon">
                            <Heart size={48} />
                        </div>
                        <h3>Please login</h3>
                        <p>Login to see your favorite dishes!</p>
                        <button className="likes-page-browse-btn" onClick={() => navigate('/login')}>
                            Login Now
                        </button>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="likes-page-container">
            {/* Header */}
            <header className="likes-page-header">
                <button className="global-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <h1 className="likes-page-title">Favourites</h1>
                <div className="likes-page-count-badge">
                    <span>{favorites.length}</span>
                    <Heart size={18} fill="#FFFFFF" color="#FFFFFF" />
                </div>
            </header>

            {/* Content */}
            <div className="likes-page-content">
                {favorites.length === 0 ? (
                    <div className="likes-page-empty">
                        <div className="likes-page-empty-icon">
                            <Heart size={48} />
                        </div>
                        <h3>No favorites yet</h3>
                        <p>Start adding dishes you love!</p>
                        <button className="likes-page-browse-btn" onClick={() => navigate('/menu')}>
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <div className="food-grid">
                        {visibleItems.map(item => (
                            <div key={item.id} className="food-card" onClick={() => handleItemClick(item)}>
                                <div className="food-card-image">
                                    <img src={item.image} alt={item.name} />
                                    <button aria-label="Favorite" 
                                        className="favorite-btn active"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFavorite(item.id);
                                        }}
                                    >
                                        <Heart
                                            size={14}
                                            fill="#FFFFFF"
                                            color="#FFFFFF"
                                        />
                                    </button>
                                </div>
                                <div className="food-card-name">{item.name}</div>
                                <div className="food-card-meta">
                                    <span className="food-card-time">
                                        <Clock size={10} color="#888888" />
                                        {item.time || '15-20 min'}
                                    </span>
                                    {item.ratingCount > 0 ? (
                                        <span className="food-card-rating">
                                            <Star size={10} fill="#8B3A1E" color="#8B3A1E" />
                                            {item.rating}
                                        </span>
                                    ) : (
                                        <span className="food-card-new-badge">NEW</span>
                                    )}
                                </div>
                                <div className="food-card-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
                                    <div className="food-card-price" style={{ margin: 0 }}>₹{item.variants && item.variants.length > 0 ? Math.min(...item.variants.map(v => v.price)) : item.price}</div>
                                    
                                    {getItemQuantity(item.id) > 0 ? (
                                        <div className="recent-qty-stepper" onClick={(e) => e.stopPropagation()} style={{ height: '28px', padding: '2px', width: '70px', justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#8B3A1E', borderRadius: '8px' }}>
                                            <button onClick={() => removeFromCart(item.id)} style={{ width: '22px', height: '24px', background: 'transparent', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Minus size={14} />
                                            </button>
                                            <span style={{ color: '#FFF', fontSize: '12px', fontWeight: '600' }}>{getItemQuantity(item.id)}</span>
                                            <button onClick={() => addToCart(item.raw)} style={{ width: '22px', height: '24px', background: 'transparent', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="reorder-btn"
                                            style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#8B3A1E', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(item.raw);
                                            }}
                                            aria-label="Add to cart"
                                        >
                                            <ShoppingCart size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* Progressive Rendering Loader */}
                        <div ref={loaderRef} style={{ height: '20px', display: 'flex', justifyContent: 'center', marginTop: '10px', gridColumn: '1 / -1' }}>
                            {hasMore && <Loader2 className="likes-spinner animate-spin" size={20} color="#888" />}
                        </div>
                    </div>
                )}
            </div>

            {/* Modern Frosted Glow Cart Indicator */}
            {cartTotal > 0 && (!showItemModal || isVariantSheetOpen) && (
                <NavLink to="/orders" className={`cart-modern-glow ${isVariantSheetOpen ? 'above-variant-sheet' : ''}`}>
                    <div className="glow-content">
                        <div className="glow-badge">
                            <ShoppingCart size={16} strokeWidth={3} />
                            <span className="glow-count">{cartTotal > 9 ? '9+' : cartTotal}</span>
                        </div>
                        <div className="glow-details">
                            <span className="glow-label">Your Order</span>
                            <span className="glow-total">₹{cartSubtotal}</span>
                        </div>
                        <div className="glow-cta">
                            <span>View Cart</span>
                            <div className="cta-icon">
                                <ArrowRight size={18} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                    <div className="glow-bg-blur"></div>
                </NavLink>
            )}

            {/* Dish Details Modal - Elegant Minimalist Design (Synchronized with Menu) */}
            <ItemModal
                isOpen={showItemModal}
                onClose={closeItemModal}
                item={selectedItem ? {
                    ...selectedItem.raw,
                    image: selectedItem.image,
                    rating: selectedItem.rating,
                    time: selectedItem.raw?.preparation_time ? `${selectedItem.raw.preparation_time}min` : '15min',
                    serves: selectedItem.serves,
                    dietType: selectedItem.raw?.is_veg ? 'veg' : 'non-veg',
                    description: selectedItem.raw?.long_description || selectedItem.description,
                    id: selectedItem.id // Ensure id is mapped correctly
                } : null}
                favorites={favorites.map(f => f.id)}
                onToggleFavorite={(id) => {
                    removeFavorite(id);
                    closeItemModal();
                }}
                onVariantSheetChange={setIsVariantSheetOpen}
            />
            {/* Bottom Navigation */}
            {!showItemModal && <BottomNav />}
        </div>
    );
};

export default LikesPage;
