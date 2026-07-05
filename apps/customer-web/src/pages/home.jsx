import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, Home, User, ShoppingBag, Grid, ShoppingCart, Clock, Star, MessageSquare, Plus, Minus, X, ArrowRight, Users, Timer, View } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import './home.css';
import Hamburger from '../components/hamburger';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getRecentOrderedItems, getRecommendedItems, getOffersForCustomer, getFavorites, addFavorite, removeFavoriteFromDB } from '../services/supabaseService';
import PageSkeleton from '../components/PageSkeleton';
import { showHomeLoader, hideHomeLoader } from '../utils/loader';
import BottomNav from '../components/BottomNav';
import ItemModal from '../components/ItemModal';
import { supabase } from '@restaurant-saas/supabase';
const HomePage = () => {

    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const { restaurant } = useRestaurant();
    const { user } = useAuth();
    const restaurantName = restaurant?.name || 'Tablekard';
    
    // Dynamic font size based on name length
    const getDynamicFontSize = (name) => {
        const len = name.length;
        if (len > 20) return '13px';
        if (len > 12) return '15px';
        return '16px';
    };
    const getDynamicLetterSpacing = (name) => {
        const len = name.length;
        if (len > 18) return '0.5px';
        if (len > 10) return '1.5px';
        return '3px';
    };
    const dynamicHeaderStyles = {
        fontSize: getDynamicFontSize(restaurantName),
        letterSpacing: getDynamicLetterSpacing(restaurantName)
    };
    const { cartItems, addToCart: cartAdd, removeFromCart: cartRemove, getItemQuantity, cartSubtotal } = useCart();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeOfferIndex, setActiveOfferIndex] = useState(0);
    const [favorites, setFavorites] = useState([]);
    const [activeFilter, setActiveFilter] = useState('popular');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
    const [modalQuantity, setModalQuantity] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [menuItems, setMenuItems] = useState([]);
    const [discountItems, setDiscountItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);

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

    useEffect(() => {
        const fetchAllData = async () => {
            if (!restaurant?.id) return; // Wait until restaurant is ready
            
            const isFirstLoad = !sessionStorage.getItem('homeAnimationShown');
            
            // Force a minimum delay of 3 seconds only on first load so animation completes
            const minDelay = isFirstLoad 
                ? new Promise(resolve => setTimeout(resolve, 3000))
                : Promise.resolve();
            
            if (isFirstLoad) {
                showHomeLoader();
                sessionStorage.setItem('homeAnimationShown', 'true');
            }
            
            setLoadingRecent(true);
            setLoadingItems(true);

            try {
                const fetchPromises = [
                    getRecommendedItems(user?.id, restaurant.id),
                    getOffersForCustomer(restaurant.id, 5),
                    minDelay
                ];
                
                if (user?.id) {
                    fetchPromises.push(getRecentOrderedItems(user.id, 3));
                }

                const results = await Promise.all(fetchPromises);
                
                setMenuItems(results[0] || []);
                setDiscountItems(results[1] || []);
                
                if (user?.id) {
                    const [recent, favs] = await Promise.all([
                        getRecentOrderedItems(user.id, 3),
                        getFavorites(user.id)
                    ]);
                    setRecentOrders(recent || []);
                    setFavorites(favs?.map(f => f.id) || []);
                }
            } catch (err) {
                console.error('Error fetching home data:', err);
            } finally {
                setLoadingRecent(false);
                setLoadingItems(false);
                if (isFirstLoad) hideHomeLoader();
            }
        };

        fetchAllData();

        // Inject lottie-player script
        if (!document.getElementById('lottie-player-script')) {
            const script = document.createElement('script');
            script.id = 'lottie-player-script';
            script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
            script.async = true;
            document.body.appendChild(script);
        }

        // Real-time subscription for offers
        const offersSubscription = supabase
            .channel('home-offers')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'offers', filter: `restaurant_id=eq.${restaurant?.id}` },
                async () => {
                    if (restaurant?.id) {
                        const updatedOffers = await getOffersForCustomer(restaurant.id, 5);
                        setDiscountItems(updatedOffers || []);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(offersSubscription);
        };
    }, [restaurant?.id, user?.id]);

    if (loadingRecent) {
        // If it's the first load, the showHomeLoader covers the screen, so returning null is fine.
        // On subsequent loads, we show the skeleton.
        const loader = document.getElementById('global-home-loader');
        const isLoaderVisible = loader && loader.style.display !== 'none';
        
        return sessionStorage.getItem('homeAnimationShown') === 'true' && !isLoaderVisible 
            ? <PageSkeleton /> 
            : null;
    }

    const toggleFavorite = async (itemId, e) => {
        if (e) e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        const isFavorite = favorites.includes(itemId);
        
        // Optimistic UI update
        setFavorites(prev =>
            isFavorite
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );

        try {
            if (isFavorite) {
                await removeFavoriteFromDB(user.id, itemId);
            } else {
                await addFavorite(user.id, itemId);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
            // Rollback on error
            setFavorites(prev =>
                isFavorite
                    ? [...prev, itemId]
                    : prev.filter(id => id !== itemId)
            );
        }
    };

    const addToCart = (item, e) => {
        if (e) e.stopPropagation();
        cartAdd(item);
    };

    const removeFromCart = (itemId, event) => {
        if (event) event.stopPropagation();
        cartRemove(itemId);
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
        setIsVariantSheetOpen(false);
        setSelectedItem(null);
    };

    const filters = [
        { id: 'popular', label: 'Popular this week' },
        { id: 'all', label: 'Most selling' },
        { id: 'rated', label: 'Most rated' },
        { id: 'budget', label: 'Under ₹200' }
    ];

    // All dynamic — no hardcoded featuredOffers or popularItems

    // Function to get filtered items based on active filter
    const getFilteredItems = () => {
        if (loadingItems) return [];
        switch (activeFilter) {
            case 'popular':
                return [...menuItems].sort((a, b) => (b.weeklySalesCount || 0) - (a.weeklySalesCount || 0)).slice(0, 4);
            case 'all':
                return [...menuItems].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 4);
            case 'rated':
                return [...menuItems].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 4);
            case 'budget':
                return menuItems
                    .filter(item => item.price < 200)
                    .sort((a, b) => {
                        if (a.price === b.price) {
                            return a.name.localeCompare(b.name);
                        }
                        return a.price - b.price;
                    })
                    .slice(0, 4);
            default:
                return menuItems.slice(0, 4);
        }
    };

    const filteredItems = getFilteredItems();

    // Label for discounts section — reflect whether items are real offers or top-sellers
    const hasRealDiscounts = discountItems.some(d => d.discount && d.discount !== 'Top Seller' && d.discount !== 'Featured');
    const discountSectionLabel = hasRealDiscounts ? 'Offers for you' : 'Top sellers';


    const cartTotal = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cart = cartItems;

    return (
        <div className={`home-container ${cartTotal > 0 ? 'has-cart' : ''}`}>
            {/* Header with Burgundy Hamburger */}
            <header className="menu-header-nav">
                <div className="header-left">
                    <Hamburger />
                    <span className="header-brand-name" style={dynamicHeaderStyles}>{restaurantName}</span>
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
            {discountItems.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">
                            {discountSectionLabel}
                        </h2>
                        <NavLink to="/discounts" className="view-all-link">
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
                            {discountItems.map(offer => (
                                <div key={offer.id} className="discount-card" onClick={() => handleItemClick(offer)}>
                                    <div className="discount-image-container">
                                        <img src={offer.image} alt={offer.name} />
                                        {offer.discount && (
                                            <div className="discount-badge">
                                                <span className="discount-badge-text">{offer.discount}</span>
                                            </div>
                                        )}
                                        {offer.timer && (
                                            <div className="discount-timer">
                                                <Timer size={12} className="discount-timer-icon" />
                                                <span className="discount-timer-text">{offer.timer}</span>
                                            </div>
                                        )}
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
                                        <div className="discount-price">
                                            {offer.originalPrice && offer.originalPrice !== offer.price && (
                                                <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '11px', marginRight: '4px' }}>₹{offer.originalPrice}</span>
                                            )}
                                            ₹{offer.price}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pagination-dots">
                            {discountItems.map((_, index) => (
                                <span
                                    key={index}
                                    className={`dot ${activeOfferIndex === index ? 'active' : ''}`}
                                ></span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Recent Orders */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Recent Orders</h2>
                    <NavLink to="/order-history" className="view-all-link">
                        View all
                        <span className="arrow-square">→</span>
                    </NavLink>
                </div>
                <div className="recent-list">
                    {recentOrders.length > 0 ? (
                        recentOrders.map(item => (
                            <div key={item.id} className="recent-item" onClick={() => handleItemClick(item)}>
                                <div className="recent-image">
                                    <img src={item.image} alt={item.name} />
                                </div>
                                <div className="recent-info">
                                    <div className="recent-name">{item.name}</div>
                                    <div className="recent-meta">
                                        <span>{item.time}</span>
                                        <span className="rating">
                                            <Star size={10} fill="#8B3A1E" color="#8B3A1E" />
                                            {item.rating}
                                        </span>
                                    </div>
                                </div>
                                <div className="recent-price">₹{item.price}</div>
                                <button
                                    className="reorder-btn"
                                    onClick={(e) => handleDirectAdd(item, e)}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="no-recent-orders">
                            <div className="no-recent-icon">
                                <ShoppingBag size={28} strokeWidth={1.5} />
                            </div>
                            <div className="no-recent-text">
                                <h4>No recent orders</h4>
                                <p>You haven't ordered anything in the last 7 days.</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Modern Frosted Glow Cart Indicator */}
            {cartTotal > 0 && (
                <NavLink to="/orders" className={`cart-modern-glow ${showItemModal && !isVariantSheetOpen ? 'hide-glow' : ''}`}>
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
                item={selectedItem}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                initialStep={modalStep}
                onVariantSheetChange={setIsVariantSheetOpen}
            />

            {/* Bottom Navigation */}
            {!showItemModal && <BottomNav />}
        </div>
    );
};

export default HomePage;
