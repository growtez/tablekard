import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, Home, User, ShoppingBag, Grid, ShoppingCart, Clock, Star, MessageSquare, Plus, Minus, X, ArrowRight, Users } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import './home.css';
import Hamburger from '../components/hamburger';


const HomePage = () => {

    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeOfferIndex, setActiveOfferIndex] = useState(0);
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const [activeFilter, setActiveFilter] = useState('popular');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [modalQuantity, setModalQuantity] = useState(0);

    const handleScroll = () => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const maxScroll = scrollWidth - clientWidth;

            // Count all discount cards
            const cards = container.querySelectorAll('.discount-card');
            const totalCards = cards.length;

            if (totalCards === 0) return;

            // Check if we're at the end (give some tolerance)
            if (scrollLeft >= maxScroll - 10) {
                setActiveOfferIndex(totalCards - 1);
                return;
            }

            // Calculate index based on scroll position
            const cardWidth = cards[0].offsetWidth + 16; // width + gap
            const index = Math.round(scrollLeft / cardWidth);
            const boundedIndex = Math.max(0, Math.min(index, totalCards - 1));

            setActiveOfferIndex(boundedIndex);
        }
    };

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
        e.stopPropagation();
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

    const filters = [
        { id: 'popular', label: 'Popular this week' },
        { id: 'all', label: 'Most selling' },
        { id: 'expensive', label: 'Most expensive' },
        { id: 'budget', label: 'Under ₹200' }
    ];

    const featuredOffers = [
        {
            id: 'featured1',
            name: 'Sushi Pack',
            price: 12.99,
            time: '15 min',
            rating: 4.8,
            discount: '20% OFF',
            subtitle: 'Special sushi selection',
            serves: 'Serves 1-2',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop',
            description: 'A curated selection of premium seafood, including fresh Atlantic salmon nigiri, spicy tuna rolls, and delicate cucumber maki. Served with traditional pickled ginger, wasabi, and lower-sodium soy sauce. Perfect for spice lovers with a kick of wasabi',
            dietType: 'non-veg'
        },
        {
            id: 'featured2',
            name: 'Salmon Platter',
            price: 15.99,
            time: '15 min',
            rating: 4.8,
            discount: '20% OFF',
            subtitle: 'Premium grilled salmon',
            serves: 'Serves 1',
            image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop',
            description: 'Heart-healthy Atlantic salmon fillet, seasoned with a blend of Mediterranean herbs and lemon zest. Grilled over an open flame for a smoky finish and served atop a bed of sautéed garden vegetables.',
            dietType: 'non-veg'
        },
        {
            id: 'featured3',
            name: 'California Rolls',
            price: 10.99,
            time: '12 min',
            rating: 4.7,
            discount: '20% OFF',
            subtitle: 'Classic rolls',
            serves: 'Serves 1',
            image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop',
            description: 'The classic fan-favorite! Authentic crab stick, creamy Haas avocado, and crisp cucumber wrapped in premium vinegared sushi rice and toasted nori. Topped with a sprinkle of toasted sesame seeds.',
            dietType: 'non-veg'
        },
    ];

    const popularItems = [
        {
            id: 'popular1',
            name: 'Margherita',
            price: 168,
            time: '25min',
            rating: 4.9,
            serves: 'Serves 2',
            desc: 'cheese layers 🧀',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop',
            description: 'A timeless Italian masterpiece. Hand-stretched sourdough base topped with rich San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic basil leaves. Simple yet profound flavor.',
            dietType: 'veg'
        },
        {
            id: 'popular2',
            name: 'Tikka Masala',
            price: 198,
            time: '30min',
            rating: 4.8,
            serves: 'Serves 1',
            desc: 'spicy layers 🌶️',
            image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=300&fit=crop',
            description: 'Experience a burst of authentic Indian spices. Succulent chicken pieces marinated in yogurt and spices, simmered in a creamy, mildly spicy tomato-based gravy. Medium spice level.',
            dietType: 'non-veg'
        },
        {
            id: 'popular3',
            name: 'Lava Cake',
            price: 568,
            time: '15min',
            rating: 4.9,
            serves: 'Serves 1',
            desc: 'chocolate 🍫',
            image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300&h=300&fit=crop',
            description: 'The ultimate dessert indulgence. A warm dark chocolate cake with a soft, gooey molten chocolate center that flows out with every bite. Served with a light dusting of powdered sugar.',
            dietType: 'veg'
        },
        {
            id: 'popular4',
            name: 'Caesar Salad',
            price: 120,
            time: '10min',
            rating: 4.7,
            serves: 'Serves 1',
            desc: 'fresh greens 🥗',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop',
            description: 'Fresh, crisp heads of romaine lettuce tossed in our signature creamy Caesar dressing. Loaded with herb-infused croutons and generous shavings of aged Parmesan cheese.',
            dietType: 'veg'
        },
    ];

    // Function to get filtered items based on active filter
    const getFilteredItems = () => {
        switch (activeFilter) {
            case 'popular':
                // Sort by rating (highest first)
                return [...popularItems].sort((a, b) => b.rating - a.rating);
            case 'all':
                // Most selling - show all items (simulated)
                return popularItems;
            case 'expensive':
                // Sort by price (highest first)
                return [...popularItems].sort((a, b) => b.price - a.price);
            case 'budget':
                // Filter items under ₹200
                return popularItems.filter(item => item.price < 200);
            default:
                return popularItems;
        }
    };

    const filteredItems = getFilteredItems();

    const recentOrders = [
        {
            id: 'recent1',
            name: 'Pepperoni Pizza',
            price: 148,
            time: '20min',
            rating: 4.6,
            orderDate: '2 days ago',
            serves: 'Serves 2',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop',
            description: 'Our signature hand-tossed dough layered with zesty tomato sauce and melted mozzarella. Generously topped with spicy, crisp pepperoni slices. A perfect choice for meat lovers.',
            dietType: 'non-veg'
        },
        {
            id: 'recent2',
            name: 'Grilled Salmon',
            price: 228,
            time: '25min',
            rating: 4.8,
            orderDate: '1 week ago',
            serves: 'Serves 1',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop',
            description: 'Sustainably sourced salmon fillet, pan-seared for a crispy skin and tender, flaky interior. Seasoned with sea salt, pepper, and fresh dill. Served with a zesty lemon segment.',
            dietType: 'non-veg'
        },
        {
            id: 'recent3',
            name: 'Vegan Burger',
            price: 138,
            time: '20min',
            rating: 4.5,
            orderDate: '1 week ago',
            serves: 'Serves 1',
            image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&h=300&fit=crop',
            description: 'A hearty plant-based patty with a meaty texture. Topped with caramelized onions, vegan cheddar, organic arugula, and spicy vegan chipotle aioli on a toasted bun.',
            dietType: 'vegan'
        },
    ];

    const cartTotal = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className={`home-container ${cartTotal > 0 ? 'has-cart' : ''}`}>
            {/* Header with Burgundy Hamburger */}
            <header className="menu-header-nav">
                <div className="header-left">
                    <Hamburger />
                    <span className="header-brand-name">Tablekard</span>
                </div>
                <div className="header-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <NavLink to="/likes" className="header-nav-btn">
                        <Heart size={24} color="#8B3A1E" />
                        {favorites.length > 0 && (
                            <span className="nav-badge">
                                {favorites.length > 9 ? '9+' : favorites.length}
                            </span>
                        )}
                    </NavLink>
                </div>
            </header>

            {/* Hero Section with AI Generated Illustration */}
            <section className="hero-section">
                <div className="hero-text">
                    <h1>Find Your <span className="highlight">Best</span></h1>
                    <h1>Food Around You</h1>
                </div>
                <div className="hero-illustration">
                    <img
                        src="/assets/hero-illustration.png"
                        alt="Restaurant Illustration"
                    />
                </div>
            </section>

            {/* Search Bar */}
            <div className="search-section">
                <div className="search-container" onClick={() => navigate('/search')}>
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search your favourite food"
                        readOnly
                        className="search-input"
                    />
                </div>
            </div>

            {/* Categories with Black borders */}
            <section className="section categories-section">
                <div className="section-header">
                    <h2 className="section-title">Categories</h2>
                </div>
                <div className="category-pills">
                    {filters.map(filter => (
                        <button
                            key={filter.id}
                            className={`category-pill ${activeFilter === filter.id ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Dynamic Section Based on Filter */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        {filters.find(f => f.id === activeFilter)?.label || 'Popular this week'}
                    </h2>
                    <NavLink to="/popular" className="view-all-link">
                        View all
                        <span className="arrow-square">→</span>
                    </NavLink>
                </div>
                <div className="food-grid">
                    {filteredItems.map(item => (
                        <div key={item.id} className="food-card" onClick={() => handleItemClick(item)}>
                            <div className="food-card-image">
                                <img src={item.image} alt={item.name} />
                                <button
                                    className={`favorite-btn ${favorites.includes(item.id) ? 'active' : ''}`}
                                    onClick={(e) => toggleFavorite(item.id, e)}
                                >
                                    <Heart
                                        size={14}
                                        fill={favorites.includes(item.id) ? '#FFFFFF' : 'transparent'}
                                        color={favorites.includes(item.id) ? '#FFFFFF' : '#8B3A1E'}
                                    />
                                </button>
                            </div>
                            <div className="food-card-name">{item.name}</div>
                            <div className="food-card-meta">
                                <span className="food-card-time">
                                    <Clock size={10} color="#888888" />
                                    {item.time}
                                </span>
                                <span className="food-card-rating">
                                    <Star size={10} fill="#8B3A1E" color="#8B3A1E" />
                                    {item.rating}
                                </span>
                            </div>
                            <div className="food-card-price">₹{item.price}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Discounts Section */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        Discounts for you
                    </h2>
                    <NavLink to="/offers" className="view-all-link">
                        View all
                        <span className="arrow-square">→</span>
                    </NavLink>
                </div>
                <div className="discounts-container">
                    <div
                        className="discounts-scroll"
                        ref={scrollRef}
                        onScroll={handleScroll}
                    >
                        {featuredOffers.map(offer => (
                            <div key={offer.id} className="discount-card" onClick={() => handleItemClick(offer)}>
                                <div className="discount-image-container">
                                    <img src={offer.image} alt={offer.name} />
                                    <div className="discount-badge">
                                        <div className="discount-badge-inner">
                                            <span className="discount-value">{offer.discount.split(' ')[0]}</span>
                                            <span className="discount-off">{offer.discount.split(' ')[1]}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="discount-info">
                                    <h3 className="discount-name">{offer.name}</h3>
                                    <div className="discount-meta-row">
                                        <div className="discount-time">
                                            <Clock size={12} color="#666666" />
                                            <span>{offer.time}</span>
                                        </div>
                                        <div className="discount-rating">
                                            <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                                            <span>{offer.rating}</span>
                                        </div>
                                    </div>
                                    <div className="discount-price">₹{offer.price}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pagination-dots">
                        {featuredOffers.map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${activeOfferIndex === index ? 'active' : ''}`}
                            ></span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Orders */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Recent Orders</h2>
                    <NavLink to="/recent" className="view-all-link">
                        View all
                        <span className="arrow-square">→</span>
                    </NavLink>
                </div>
                <div className="recent-list">
                    {recentOrders.map(item => (
                        <div key={item.id} className="recent-item" onClick={() => handleItemClick(item)}>
                            <div className="recent-image">
                                <img src={item.image} alt={item.name} />
                            </div>
                            <div className="recent-info">
                                <div className="recent-name">{item.name}</div>
                                <div className="recent-meta">
                                    <span>{item.time}</span>
                                    <span className="rating">
                                        <Star size={10} fill="#F2B84B" color="#F2B84B" />
                                        {item.rating}
                                    </span>
                                </div>
                            </div>
                            <div className="recent-price">₹{item.price}</div>
                            {getItemQuantity(item.id) === 0 ? (
                                <button
                                    className="reorder-btn"
                                    onClick={(e) => addToCart(item, e)}
                                >
                                    <Plus size={16} />
                                </button>
                            ) : (
                                <div className="recent-qty-stepper" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="recent-stepper-btn"
                                        onClick={(e) => removeFromCart(item.id, e)}
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="recent-stepper-value">{getItemQuantity(item.id)}</span>
                                    <button
                                        className="recent-stepper-btn"
                                        onClick={(e) => addToCart(item, e)}
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Modern Frosted Glow Cart Indicator */}
            {cartTotal > 0 && !showItemModal && (
                <NavLink to="/orders" className="cart-modern-glow">
                    <div className="glow-content">
                        <div className="glow-badge">
                            <ShoppingCart size={16} strokeWidth={3} />
                            <span className="glow-count">{cartTotal > 9 ? '9+' : cartTotal}</span>
                        </div>
                        <div className="glow-details">
                            <span className="glow-label">Your Order</span>
                            <span className="glow-total">₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
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

                        {/* Dish Info */}
                        <div className="modal-dish-info">
                            <h2 className="dish-title">{selectedItem.name}</h2>

                            <div className="dish-meta-chips">
                                <span className="meta-chip"><Clock size={13} />{selectedItem.time}</span>
                                <span className="meta-chip"><Users size={13} /> {selectedItem.serves}</span>
                                {selectedItem.dietType === 'vegan' && (
                                    <span className="meta-chip vegan">Vegan</span>
                                )}
                                {selectedItem.dietType === 'veg' && (
                                    <span className="meta-chip green">Veg</span>
                                )}
                                {selectedItem.dietType === 'non-veg' && (
                                    <span className="meta-chip red">Non-Veg</span>
                                )}
                            </div>

                            <p className="dish-full-desc">{selectedItem.description}</p>
                        </div>

                        {/* Sticky Bottom Action Bar */}
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
            {/* Bottom Navigation - Hidden when modal is open */}
            {!showItemModal && (
                <nav className="bottom-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <Home size={22} />
                    </NavLink>
                    <NavLink to="/menu" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <ShoppingBag size={22} />
                    </NavLink>

                    <NavLink to="/orders" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <ShoppingCart size={22} />
                        {cartTotal > 0 && <span className="cart-badge">{cartTotal > 9 ? '9+' : cartTotal}</span>}
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <User size={22} />
                    </NavLink>
                </nav>
            )}
        </div>
    );
};

export default HomePage;
