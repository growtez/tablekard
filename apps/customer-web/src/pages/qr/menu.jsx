import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Heart, Star, Plus, Filter, ShoppingCart, X, MapPin } from 'lucide-react';
import '../menu.css';

const QRMenuPage = () => {
    const { restaurantSlug, tableNumber } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Starters');
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const cartIconRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);

    // Would fetch from Firebase based on restaurantSlug
    const restaurant = {
        name: 'The Gourmet Kitchen',
        logo: 'https://via.placeholder.com/50',
    };

    const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts'];

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

    const menuItems = {
        'Starters': [
            {
                id: 1,
                name: 'Caesar Salad',
                description: 'Fresh romaine lettuce with parmesan cheese',
                fullDescription: 'Fresh romaine lettuce tossed with creamy Caesar dressing, shaved parmesan cheese, and crispy croutons.',
                price: 340,
                time: '15min',
                rating: 4.6,
                servings: 1,
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&h=120&fit=crop',
                isVegan: true
            },
            {
                id: 2,
                name: 'Chicken Wings',
                description: 'Spicy buffalo wings with ranch dip',
                fullDescription: 'Crispy fried chicken wings tossed in our signature spicy buffalo sauce.',
                price: 480,
                time: '20min',
                rating: 4.8,
                servings: 2,
                image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=120&h=120&fit=crop',
                isVegan: false
            },
            {
                id: 3,
                name: 'Avocado Toast',
                description: 'Smashed avocado on sourdough bread',
                fullDescription: 'Perfectly ripe avocado smashed and seasoned with lime, sea salt, and red pepper flakes.',
                price: 380,
                time: '10min',
                rating: 4.4,
                servings: 1,
                image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=120&h=120&fit=crop',
                isVegan: true
            }
        ],
        'Main Course': [
            {
                id: 4,
                name: 'Grilled Salmon',
                description: 'Fresh salmon with lemon herbs',
                fullDescription: 'Premium Atlantic salmon fillet grilled to perfection.',
                price: 740,
                time: '25min',
                rating: 4.7,
                servings: 1,
                image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=120&h=120&fit=crop',
                isVegan: false
            },
            {
                id: 5,
                name: 'Pasta Carbonara',
                description: 'Creamy pasta with bacon and parmesan',
                fullDescription: 'Traditional Italian pasta carbonara made with al dente spaghetti.',
                price: 560,
                time: '20min',
                rating: 4.5,
                servings: 2,
                image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=120&h=120&fit=crop',
                isVegan: false
            }
        ],
        'Drinks': [
            {
                id: 7,
                name: 'Fresh Orange Juice',
                description: 'Freshly squeezed orange juice',
                fullDescription: 'Pure, freshly squeezed orange juice.',
                price: 180,
                time: '5min',
                rating: 4.8,
                servings: 1,
                image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=120&h=120&fit=crop',
                isVegan: true
            },
            {
                id: 8,
                name: 'Iced Coffee',
                description: 'Cold brew coffee with ice',
                fullDescription: 'Smooth cold brew coffee made from premium arabica beans.',
                price: 140,
                time: '3min',
                rating: 4.6,
                servings: 1,
                image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=120&h=120&fit=crop',
                isVegan: true
            }
        ],
        'Desserts': [
            {
                id: 10,
                name: 'Chocolate Cake',
                description: 'Rich chocolate cake with cream',
                fullDescription: 'Decadent triple-layer chocolate cake.',
                price: 300,
                time: '5min',
                rating: 4.9,
                servings: 1,
                image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&h=120&fit=crop',
                isVegan: false
            },
            {
                id: 11,
                name: 'Tiramisu',
                description: 'Classic Italian dessert',
                fullDescription: 'Authentic Italian tiramisu.',
                price: 320,
                time: '5min',
                rating: 4.8,
                servings: 1,
                image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=120&h=120&fit=crop',
                isVegan: false
            }
        ]
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
        // Store cart in sessionStorage for the cart page
        sessionStorage.setItem('qr_cart', JSON.stringify(cart));
        sessionStorage.setItem('qr_restaurant', JSON.stringify(restaurant));
        sessionStorage.setItem('qr_table', tableNumber || '');
        navigate(`/r/${restaurantSlug}/cart`);
    };

    const filteredItems = menuItems[selectedCategory]?.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="menu-container">
            {/* Header with Table Info */}
            <header className="header">
                <div className="header-content">
                    {/* Restaurant Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                            src={restaurant.logo}
                            alt={restaurant.name}
                            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div>
                            <h3 style={{ fontSize: '14px', margin: 0, color: '#fff' }}>{restaurant.name}</h3>
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

                {/* Main Title */}
                <div className="main-title">
                    <h1>Order <span className="highlight">Delicious</span></h1>
                    <h1><span className="highlight">Food</span></h1>
                </div>

                {/* Search Bar */}
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
                            key={category}
                            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="menu-items" style={{ paddingBottom: cartItemCount > 0 ? '100px' : '20px' }}>
                {filteredItems.map(item => (
                    <div key={item.id} className="menu-item" onClick={() => handleItemClick(item)}>
                        <div className="menu-image">
                            <img src={item.image} alt={item.name} />
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
                            {item.isVegan && <div className="vegan-badge">V</div>}
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
                                <span className="time">{item.time}</span>
                                <div className="rating">
                                    <Star className="star-icon" size={12} fill="#FFD700" color="#FFD700" />
                                    <span>{item.rating}</span>
                                </div>
                                <span className="serves">serves {item.servings}</span>
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
                            <img src={selectedItem.image} alt={selectedItem.name} />
                            {selectedItem.isVegan && <div className="modal-vegan-badge">Vegan</div>}
                        </div>

                        <div className="modal-content-section">
                            <div className="modal-serves-info">Serves {selectedItem.servings}</div>

                            <div className="modal-time-rating-row">
                                <div className="modal-time-rating-left">
                                    <div className="modal-item-time">{selectedItem.time}</div>
                                    <div className="modal-rating-section">
                                        <Star size={16} fill="#d9b550" color="#d9b550" />
                                        <span>{selectedItem.rating}</span>
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

            {/* Cart Footer (for QR ordering - no bottom nav) */}
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
