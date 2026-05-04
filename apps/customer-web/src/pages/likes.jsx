import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Star, Trash2, ShoppingCart, Plus, Minus, Users, Loader2, ArrowRight, X, Clock } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getFavorites, removeFavoriteFromDB } from '../services/supabaseService';
import './likes.css';

const LikesPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { cartItems, addToCart, removeFromCart, getItemQuantity, cartTotal, cartSubtotal } = useCart();

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);

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
        const fetchFavorites = async () => {
            if (!isAuthenticated || !user) {
                setLoading(false);
                return;
            }

            try {
                const data = await getFavorites(user.id);
                // Map database items to UI format
                const mapped = data.map(item => {
                    const images = (item.menu_item_images || []).sort((a, b) => a.sort_order - b.sort_order);
                    const primaryImage = images.length > 0 ? images[0].image_url : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
                    
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.short_description || item.long_description || item.description || '',
                        price: item.discount_price || item.price,
                        rating: parseFloat((4.5 + Math.random() * 0.4).toFixed(1)),
                        serves: item.serves || '1',
                        image: primaryImage,
                        raw: item // Keep raw data for cart
                    };
                });
                setFavorites(mapped);
            } catch (err) {
                console.error('Failed to fetch favorites:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [isAuthenticated, user]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowItemModal(true);
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        setSelectedItem(null);
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
                    <div className="likes-page-grid">
                        {favorites.map(item => (
                            <div key={item.id} className="likes-page-card" onClick={() => handleItemClick(item)}>
                                {/* Remove Button */}
                                <button
                                    className="likes-page-remove-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFavorite(item.id);
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Image */}
                                <div className="likes-page-image">
                                    <img src={item.image} alt={item.name} />
                                </div>

                                {/* Info */}
                                <div className="likes-page-info">
                                    <h3 className="likes-page-name">{item.name}</h3>
                                    <p className="likes-page-desc">{item.description}</p>

                                    <div className="likes-page-meta">
                                        <span className="likes-page-meta-item rating">
                                            <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                                            {item.rating}
                                        </span>
                                        <span className="likes-page-meta-item serves">
                                            <Users size={12} />
                                            Serves {item.serves}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="likes-page-card-footer">
                                    <div className="likes-page-price-wrapper">
                                        <span className="likes-page-price-label">Price</span>
                                        <span className="likes-page-price">₹{item.price}</span>
                                    </div>

                                    {getItemQuantity(item.id) > 0 ? (
                                        <div className="likes-page-qty-control" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => removeFromCart(item.id)}>
                                                <Minus size={14} />
                                            </button>
                                            <span className="qty-value">{getItemQuantity(item.id)}</span>
                                            <button onClick={() => addToCart(item.raw)}>
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="likes-page-add-btn-circle"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(item.raw);
                                            }}
                                            aria-label="Add to cart"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modern Frosted Glow Cart Indicator */}
            {cartTotal > 0 && (
                <NavLink to="/orders" className="cart-modern-glow">
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
            {showItemModal && selectedItem && (
                <div className={`item-modal-overlay ${showItemModal ? 'show' : ''}`} onClick={closeItemModal}>
                    <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>

                        {/* Drag Indicator */}
                        <div className="modal-drag-bar"></div>

                        {/* Close Button */}
                        <button className="modal-x-btn" onClick={closeItemModal}>
                            <X size={18} />
                        </button>

                        {/* Centered Dish Image */}
                        <div className="modal-dish-showcase">
                            <div className="dish-image-frame">
                                <img src={selectedItem.image} alt={selectedItem.name} />
                            </div>
                            <button
                                className="modal-fav-floating active"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFavorite(selectedItem.id);
                                    closeItemModal();
                                }}
                            >
                                <Heart
                                    size={20}
                                    fill="#8B3A1E"
                                    color="#8B3A1E"
                                />
                            </button>
                            <div className="dish-rating-pill">
                                <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                                <span>{selectedItem.rating}</span>
                            </div>
                        </div>

                        {/* Dish Info */}
                        <div className="modal-dish-info">
                            <h2 className="dish-title">{selectedItem.name}</h2>

                            <div className="dish-meta-chips">
                                <span className="meta-chip"><Clock size={13} /> {selectedItem.raw?.preparation_time || '15'}min</span>
                                <span className="meta-chip"><Users size={13} /> Serves {selectedItem.serves}</span>
                                {selectedItem.raw?.is_veg ? (
                                    <span className="meta-chip green">Veg</span>
                                ) : (
                                    <span className="meta-chip red">Non-Veg</span>
                                )}
                            </div>

                            <p className="dish-full-desc">{selectedItem.raw?.long_description || selectedItem.description}</p>
                        </div>

                        {/* Sticky Bottom Action Bar */}
                        <div className="modal-bottom-bar">
                            <div className="price-display">
                                <span className="price-rupee">₹{selectedItem.price}</span>
                            </div>

                            {getItemQuantity(selectedItem.id) === 0 ? (
                                <button
                                    className="add-to-order-btn"
                                    onClick={() => addToCart(selectedItem.raw)}
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
                                        onClick={() => addToCart(selectedItem.raw)}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LikesPage;
