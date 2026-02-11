import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Heart, Star, Plus, Filter, ShoppingCart, X, MapPin } from 'lucide-react';
import '../menu.css';
import { getRestaurantBySlug, getMenuCategories, getMenuItems } from '../../services/supabaseService';

const QRMenuPage = () => {
    const { restaurantSlug, tableNumber } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const cartIconRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);

    const [restaurant, setRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const savedCart = sessionStorage.getItem('qr_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch {
                // ignore
            }
        }
    }, []);

    useEffect(() => {
        const loadMenu = async () => {
            try {
                setLoading(true);
                const restaurantData = await getRestaurantBySlug(restaurantSlug);
                if (!restaurantData) {
                    setError('Restaurant not found');
                    return;
                }
                setRestaurant(restaurantData);

                const [categoryData, itemData] = await Promise.all([
                    getMenuCategories(restaurantData.id),
                    getMenuItems(restaurantData.id)
                ]);

                setCategories(categoryData);
                setItems(itemData);
                if (categoryData.length > 0) {
                    setSelectedCategory(categoryData[0].id);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load menu. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (restaurantSlug) {
            loadMenu();
        }
    }, [restaurantSlug]);

    const closeItemModal = () => {
        const overlay = document.querySelector('.item-modal-overlay');
        const content = document.querySelector('.item-modal-content');

        if (overlay) overlay.classList.add('closing');
        if (content) {
            content.classList.remove('slide-up');
            content.classList.add('slide-down');
        }

        setTimeout(() => {
            setShowItemModal(false);
            if (overlay) overlay.classList.remove('closing');
            if (content) content.classList.remove('slide-down');
        }, 400);

        setTimeout(() => {
            setSelectedItem(null);
        }, 400);
    };

    const toggleFavorite = (itemId) => {
        setFavorites(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const addToCart = (item, event) => {
        const button = event.currentTarget;
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);

        if (cartIconRef.current) {
            cartIconRef.current.style.transform = 'scale(1.3)';
            setTimeout(() => {
                if (cartIconRef.current) {
                    cartIconRef.current.style.transform = 'scale(1)';
                }
            }, 300);
        }

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

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowItemModal(true);
    };

    const goToCart = () => {
        sessionStorage.setItem('qr_cart', JSON.stringify(cart));
        sessionStorage.setItem('qr_restaurant', JSON.stringify(restaurant));
        sessionStorage.setItem('qr_table', tableNumber || '');
        navigate(`/r/${restaurantSlug}/cart`);
    };

    const filteredItems = items
        .filter(item => !selectedCategory || item.category_id === selectedCategory)
        .filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (loading) {
        return (
            <div className="menu-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <p style={{ color: '#fff' }}>Loading menu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="menu-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <p style={{ color: '#fff' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="menu-container">
            {/* Header with Table Info */}
            <header className="header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                            src={restaurant?.logo_url || 'https://via.placeholder.com/50'}
                            alt={restaurant?.name || 'Restaurant'}
                            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div>
                            <h3 style={{ fontSize: '14px', margin: 0, color: '#fff' }}>{restaurant?.name}</h3>
                            {tableNumber && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '12px',
                                    color: '#d9b550',
                                    marginTop: '2px'
                                }}>
                                    <MapPin size={12} />
                                    Table {tableNumber}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cart-icon-container" ref={cartIconRef} onClick={goToCart} style={{ cursor: 'pointer' }}>
                        <ShoppingCart size={24} color="#d9b550" />
                        {cart.length > 0 && (
                            <div className="cart-count">
                                {cartItemCount}
                            </div>
                        )}
                    </div>
                </div>

                <div className="main-title">
                    <h1>Order <span className="highlight">Delicious</span></h1>
                    <h1><span className="highlight">Food</span></h1>
                </div>

                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <div className="filter-icon">
                        <Filter size={20} />
                    </div>
                </div>
            </header>

            {/* Categories */}
            <div className="categories-section">
                <div className="categories-list">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="menu-items" style={{ paddingBottom: cartItemCount > 0 ? '100px' : '20px' }}>
                {filteredItems.map(item => (
                    <div key={item.id} className="menu-item" onClick={() => handleItemClick(item)}>
                        <div className="menu-image">
                            <img src={item.image_url || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=120&h=120&fit=crop'} alt={item.name} />
                            <button
                                className="favorite-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item.id);
                                }}
                            >
                                <Heart
                                    size={18}
                                    fill={favorites.includes(item.id) ? '#d9b550' : 'transparent'}
                                    color={favorites.includes(item.id) ? '#d9b550' : '#FFFFFF'}
                                />
                            </button>
                            {item.is_veg && <div className="vegan-badge">V</div>}
                        </div>
                        <div className="menu-info">
                            <div className="menu-header">
                                <h3>{item.name}</h3>
                                <button
                                    className="add-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item, e);
                                    }}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <p className="menu-description">{item.description}</p>
                            <div className="menu-meta">
                                <span className="time">{item.preparation_time ? `${item.preparation_time}min` : '15min'}</span>
                                <div className="rating">
                                    <Star className="star-icon" size={12} fill="#FFD700" color="#FFD700" />
                                    <span>{item.rating || 4.5}</span>
                                </div>
                                <span className="serves">serves {item.serves || 1}</span>
                            </div>
                            <div className="price">₹{item.price}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Item Details Modal */}
            {showItemModal && selectedItem && (
                <div className={`item-modal-overlay ${showItemModal ? 'show' : ''}`} onClick={closeItemModal}>
                    <div className={`item-modal-content ${showItemModal ? 'slide-up' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-info">
                            <h2 className="modal-item-name">{selectedItem.name}</h2>
                            <button className="modal-close-btn" onClick={closeItemModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-main-image">
                            <img src={selectedItem.image_url || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop'} alt={selectedItem.name} />
                            {selectedItem.is_veg && <div className="modal-vegan-badge">Veg</div>}
                        </div>

                        <div className="modal-content-section">
                            <div className="modal-serves-info">Serves {selectedItem.serves || 1}</div>

                            <div className="modal-time-rating-row">
                                <div className="modal-time-rating-left">
                                    <div className="modal-item-time">{selectedItem.preparation_time ? `${selectedItem.preparation_time}min` : '15min'}</div>
                                    <div className="modal-rating-section">
                                        <Star size={16} fill="#d9b550" color="#d9b550" />
                                        <span>{selectedItem.rating || 4.5}</span>
                                    </div>
                                </div>
                                <button
                                    className="modal-main-add-btn"
                                    onClick={() => {
                                        addToCart(selectedItem, { currentTarget: document.activeElement });
                                        closeItemModal();
                                    }}
                                >
                                    ADD
                                </button>
                            </div>

                            <div className="modal-main-price">₹{selectedItem.price}</div>

                            <p className="modal-main-description">
                                {selectedItem.fullDescription || selectedItem.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Footer */}
            {cartItemCount > 0 && (
                <div
                    onClick={goToCart}
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '16px',
                        background: 'linear-gradient(to top, #1a1a2e 0%, #1a1a2e 80%, transparent 100%)',
                        zIndex: 100
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#d9b550',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        cursor: 'pointer'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                                background: '#1a1a2e',
                                color: '#d9b550',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {cartItemCount}
                            </span>
                            <span style={{ color: '#1a1a2e', fontWeight: 600 }}>View Cart</span>
                        </div>
                        <span style={{ color: '#1a1a2e', fontWeight: 700, fontSize: '18px' }}>
                            ₹{cartTotal}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRMenuPage;
