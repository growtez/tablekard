import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowLeft, Heart, Star, Clock, X, Plus, Minus, View, Zap, ShoppingBag, ShoppingCart, ArrowRight, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useCart } from '../context/CartContext';
import { getMenuItems, getFavorites, addFavorite, removeFavoriteFromDB } from '../services/supabaseService';
import ItemModal from '../components/ItemModal';
import './search.css';


const SearchPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { restaurantId, recommendations, recommendationsLoading } = useRestaurant();
    const { addToCart, removeFromCart, getItemQuantity, cartTotal, cartSubtotal } = useCart();

    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [allItems, setAllItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [modalQuantity, setModalQuantity] = useState(0);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        // Load favorites from DB if logged in
        if (isAuthenticated && user) {
            getFavorites(user.id)
                .then(data => setFavorites(data.map(f => f.id)))
                .catch(err => console.error('Failed to load favorites:', err));
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!restaurantId) return;
        getMenuItems(restaurantId).then(items => {
            const processedItems = items.map(m => {
                const images = (m.menu_item_images || []).sort((a, b) => a.sort_order - b.sort_order);
                const primaryImage = images.length > 0 ? images[0].image_url : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
                return {
                    id: m.id,
                    name: m.name,
                    price: m.price,
                    time: m.preparation_time ? `${m.preparation_time}min` : '15min',
                    rating: 4.8,
                    serves: `Serves ${m.serves || 1}`,
                    image: primaryImage,
                    images: images.map(img => img.image_url),
                    description: m.long_description || m.short_description || '',
                    dietType: m.is_veg ? 'veg' : 'non-veg',
                    modelUrl: m.model_url || null
                };
            });
            setAllItems(processedItems);
        }).catch(err => console.error("Error fetching menu items:", err));
    }, [restaurantId]);

    // Debounced search with relevance ranking
    const debounceRef = useRef(null);

    const rankAndFilter = useCallback((query, items) => {
        const q = query.toLowerCase().trim();
        if (!q) return [];

        const scored = [];
        for (const item of items) {
            const name = item.name.toLowerCase();
            const desc = (item.description || '').toLowerCase();
            let score = 0;

            if (name === q) {
                score = 100;                          // exact match
            } else if (name.startsWith(q)) {
                score = 80;                           // prefix match
            } else if (name.split(/\s+/).some(w => w.startsWith(q))) {
                score = 60;                           // word-boundary match
            } else if (name.includes(q)) {
                score = 40;                           // substring match
            } else if (desc.includes(q)) {
                score = 20;                           // description match
            }

            if (score > 0) scored.push({ item, score });
        }

        scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
        return scored.map(s => s.item);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (searchTerm.trim() === '') {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(() => {
            setResults(rankAndFilter(searchTerm, allItems));
            setIsSearching(false);
        }, 150);

        return () => clearTimeout(debounceRef.current);
    }, [searchTerm, allItems, rankAndFilter]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setModalQuantity(0);
        setShowItemModal(true);
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        setSelectedItem(null);
    };

    const toggleFavorite = async (itemId) => {
        if (!isAuthenticated || !user) {
            setFavorites(prev =>
                prev.includes(itemId)
                    ? prev.filter(id => id !== itemId)
                    : [...prev, itemId]
            );
            return;
        }

        try {
            if (favorites.includes(itemId)) {
                await removeFavoriteFromDB(user.id, itemId);
                setFavorites(prev => prev.filter(id => id !== itemId));
            } else {
                await addFavorite(user.id, itemId);
                setFavorites(prev => [...prev, itemId]);
            }
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    return (
        <div className="search-page-container">

            {/* ── Sticky Header ── */}
            <header className="search-header">
                <button className="global-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="search-bar-wrapper">
                    <Search size={18} color="#C4B8B4" />
                    <input
                        type="text"
                        placeholder="Search your favourite food…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="main-search-input"
                    />
                    {searchTerm && (
                        <button className="clear-btn" onClick={() => setSearchTerm('')}>
                            <X size={16} color="#C4B8B4" />
                        </button>
                    )}
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="search-main">
                {searchTerm === '' ? (
                    <div className="search-empty-state">
                        {recommendationsLoading ? (

                            /* Loading skeleton shimmer */
                            <div className="rec-loading-state">
                                <div className="rec-hero-text-skeleton">
                                    <div className="skeleton-pill" />
                                    <div className="skeleton-heading" />
                                    <div className="skeleton-subheading" />
                                </div>
                                <div className="rec-list">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="skeleton-card">
                                            <div className="skeleton-img" />
                                            <div className="skeleton-line short" />
                                            <div className="skeleton-line long" />
                                            <div className="skeleton-line mid" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                        ) : recommendations.length > 0 ? (

                            /* ── Beautiful Recommendations ── */
                            <div className="recommendations-section">

                                {/* Section label */}
                                <div className="rec-hero-block">
                                    <div className="rec-eyebrow">
                                        <span className="rec-eyebrow-dot" />
                                        Recommended items for you
                                    </div>
                                </div>

                                {/* Cards list */}
                                <div className="rec-list">
                                    {recommendations.slice(0, 4).map((item, idx) => (
                                        <div
                                            key={`rec-${item.id}`}
                                            className="rec-card"
                                            style={{ animationDelay: `${idx * 0.07}s` }}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            {/* Thumbnail */}
                                            <div className="rec-thumb">
                                                <img src={item.image} alt={item.name} loading="lazy" />

                                                {/* Veg/Non-Veg badge on image */}
                                                <div className={`rec-veg-badge ${item.dietType}`}>
                                                    <div className="rec-veg-dot" />
                                                </div>
                                            </div>

                                            {/* Info Column */}
                                            <div className="rec-info">
                                                {/* Name + Rating */}
                                                <div className="rec-name-row">
                                                    <h4 className="rec-name">{item.name}</h4>
                                                    <div className="rec-star-pill">
                                                        <Star size={10} fill="#8B3A1E" color="#8B3A1E" />
                                                        <span>{item.rating}</span>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="rec-desc">
                                                    {item.description || 'A chef-curated delight'}
                                                </p>

                                                {/* Price + Time + Add */}
                                                <div className="rec-bottom-row">
                                                    <div className="rec-left-info">
                                                        <span className="rec-price">₹{item.price}</span>
                                                        {getItemQuantity(item.id) > 0 && (
                                                            <Link to="/orders" className="rec-view-cart-link" onClick={(e) => e.stopPropagation()}>
                                                                View Cart
                                                            </Link>
                                                        )}
                                                    </div>

                                                    {getItemQuantity(item.id) === 0 ? (
                                                        <button
                                                            className="rec-add-pill"
                                                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                            aria-label={`Add ${item.name}`}
                                                        >
                                                            <Plus size={13} strokeWidth={3} />
                                                            Add
                                                        </button>
                                                    ) : (
                                                        <div className="rec-qty-stepper" onClick={(e) => e.stopPropagation()}>
                                                            <button className="rec-stepper-btn" onClick={() => removeFromCart(item.id)}>
                                                                <Minus size={11} strokeWidth={3} />
                                                            </button>
                                                            <span className="rec-stepper-value">{getItemQuantity(item.id)}</span>
                                                            <button className="rec-stepper-btn" onClick={() => addToCart(item)}>
                                                                <Plus size={11} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        ) : (

                            /* Empty / no recommendations */
                            <div className="search-placeholder">
                                <div className="search-illustration">
                                    <img src="/assets/search-illustration.png" alt="Search for food" />
                                </div>
                                <h3>Search your cravings</h3>
                                <p>Try "Pizza", "Biryani" or "Dessert"</p>
                            </div>

                        )}
                    </div>

                ) : results.length > 0 ? (

                    /* ── Search Results ── */
                    <div className="sr-container">
                        <p className="sr-count">
                            <span className="sr-count-num">{results.length}</span> result{results.length > 1 ? 's' : ''} for <span className="sr-count-q">"{searchTerm}"</span>
                        </p>
                        <div className="sr-list">
                            {results.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="sr-card"
                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                    onClick={() => handleItemClick(item)}
                                >
                                    {/* Image */}
                                    <div className="sr-img">
                                        <img src={item.image} alt={item.name} loading="lazy" />
                                        <div className={`sr-diet ${item.dietType || 'veg'}`}>
                                            <span />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="sr-info">
                                        <div className="sr-top">
                                            <h4 className="sr-name">{item.name}</h4>
                                            <div className="sr-rating">
                                                <Star size={10} fill="#8B3A1E" color="#8B3A1E" />
                                                <span>{item.rating}</span>
                                            </div>
                                        </div>
                                        <p className="sr-desc">{item.description || 'A chef-curated delight'}</p>
                                        <div className="sr-bottom">
                                            <span className="sr-price">₹{item.price}</span>
                                            {getItemQuantity(item.id) === 0 ? (
                                                <button
                                                    className="sr-add-btn"
                                                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                >
                                                    <Plus size={13} strokeWidth={3} />
                                                    Add
                                                </button>
                                            ) : (
                                                <div className="sr-qty" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => removeFromCart(item.id)}>
                                                        <Minus size={12} strokeWidth={3} />
                                                    </button>
                                                    <span>{getItemQuantity(item.id)}</span>
                                                    <button onClick={() => addToCart(item)}>
                                                        <Plus size={12} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                ) : isSearching ? (
                    
                    /* ── Search Loading State ── */
                    <div className="sr-container">
                        <div className="rec-list" style={{ marginTop: '20px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={`search-skel-${i}`} className="skeleton-card">
                                    <div className="skeleton-img" />
                                    <div className="skeleton-line short" />
                                    <div className="skeleton-line long" />
                                    <div className="skeleton-line mid" />
                                </div>
                            ))}
                        </div>
                    </div>

                ) : (

                    /* ── No Results ── */
                    <div className="search-no-results">
                        <div className="search-illustration">
                            <img src="/assets/no-results-illustration.png" alt="No results" />
                        </div>
                        <h3>No item available</h3>
                        <p>We couldn't find any match for<br />"{searchTerm}"</p>
                    </div>

                )}
            </main>

            {/* ── Item Detail Modal ── */}
            <ItemModal
                isOpen={showItemModal}
                onClose={closeItemModal}
                item={selectedItem}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
            {/* ── Modern Frosted Glow Cart Indicator ── */}
            {cartTotal > 0 && !showItemModal && (
                <Link to="/orders" className="cart-modern-glow">
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
                </Link>
            )}
        </div>
    );
};

export default SearchPage;
