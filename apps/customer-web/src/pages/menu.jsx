import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, Home, ShoppingBag, User, Star, Plus, Minus, Filter, ShoppingCart, X, Grid, Clock, Hourglass, ArrowRight, Users, Loader2, QrCode, View } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@restaurant-saas/supabase';
import { getFavorites, addFavorite, removeFavoriteFromDB } from '../services/supabaseService';
import { Scanner } from '@yudiel/react-qr-scanner';
import './menu.css';
import Hamburger from '../components/hamburger';
import BottomNav from '../components/BottomNav';

const MenuPage = () => {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const { cartItems: cart, addToCart, removeFromCart, getItemQuantity, cartTotal, cartSubtotal } = useCart();
  const cartIconRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(0);
  const [menuItems, setMenuItems] = useState({});
  const [categories, setCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [vegOnly, setVegOnly] = useState(false);

  const getBaseItemQuantity = (baseItemId) => {
    return cart
      .filter(i => i.menuItemId === baseItemId || i.id === baseItemId || i.id.startsWith(baseItemId + '_'))
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
    setSelectedVariant(null);
    setSelectedAddons([]);
  };

  // Load real menu items from database
  useEffect(() => {
    if (!restaurantId) return; // Don't fetch if no restaurant context
    const loadMenu = async () => {
      // 1. Check Cache First
      const cachedMenu = sessionStorage.getItem('menuData');
      const cachedCats = sessionStorage.getItem('menuCategories');
      if (cachedMenu && cachedCats) {
        setMenuItems(JSON.parse(cachedMenu));
        setCategories(JSON.parse(cachedCats));
        setMenuLoading(false);
      }

      try {
        // 2. Parallel Fetch — fetch ALL items (available + unavailable) for real-time tracking
        const [catsRes, itemsRes] = await Promise.all([
          supabase.from('menu_categories').select('id, name').eq('restaurant_id', restaurantId).eq('active', true).order('sort_order'),
          supabase.from('menu_items').select('*, menu_item_images(id, image_url, sort_order)').eq('restaurant_id', restaurantId)
        ]);

        if (catsRes.data && itemsRes.data) {
          const catNames = catsRes.data.map(c => c.name);
          const grouped = {};

          catsRes.data.forEach(cat => {
            grouped[cat.name] = itemsRes.data
              .filter(item => item.category_id === cat.id)
              .map(item => {
                const images = (item.menu_item_images || []).sort((a, b) => a.sort_order - b.sort_order);
                const primaryImage = images.length > 0 ? images[0].image_url : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
                return {
                  id: item.id,
                  name: item.name,
                  shortDesc: item.short_description || item.description?.substring(0, 80) || '',
                  description: item.long_description || item.description || '',
                  price: item.discount_price || item.price,
                  originalPrice: item.discount_price ? item.price : null,
                  time: item.preparation_time ? `${item.preparation_time}min` : '15min',
                  rating: parseFloat((4.5 + Math.random() * 0.4).toFixed(1)),
                  serves: item.serves ? `Serves ${item.serves}` : 'Serves 1',
                  image: primaryImage,
                  images: images.map(img => img.image_url),
                  dietType: item.is_veg ? 'veg' : 'non-veg',
                  tags: item.tags || [],
                  variants: (item.variants || []).map((v, i) => ({
                    ...v,
                    _key: v.id ?? `${v.name}_${v.price}_${i}`,
                  })),
                  addons: (item.addons || []).map((a, i) => ({
                    ...a,
                    _key: a.id ?? `${a.name}_${a.price}_${i}`,
                  })),
                  modelUrl: item.model_url || null,
                  isAvailable: item.is_available,
                };
              });
          });

          // 3. Update State & Cache
          setCategories(catNames);
          setMenuItems(grouped);
          sessionStorage.setItem('menuData', JSON.stringify(grouped));
          sessionStorage.setItem('menuCategories', JSON.stringify(catNames));

          if (selectedCategory !== 'All' && !catNames.includes(selectedCategory) && catNames.length > 0) {
            setSelectedCategory(catNames[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setMenuLoading(false);
      }
    };
    loadMenu();

    // Load favorites from DB if logged in
    const loadFavorites = async () => {
      if (isAuthenticated && user) {
        try {
          const data = await getFavorites(user.id);
          setFavorites(data.map(f => f.id));
        } catch (err) {
          console.error('Failed to load favorites:', err);
        }
      }
    };
    loadFavorites();

    // 4. Real-time subscription for menu_items availability changes
    const subscription = supabase
      .channel(`public:menu_items:${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          setMenuItems(prev => {
            const updated = { ...prev };

            Object.keys(updated).forEach(catName => {
              updated[catName] = updated[catName].map(item => {
                // UPDATE: item exists in state and matches the changed row
                if (eventType === 'UPDATE' && newRow && item.id === newRow.id) {
                  return {
                    ...item,
                    name: newRow.name,
                    shortDesc: newRow.short_description || newRow.description?.substring(0, 80) || '',
                    description: newRow.long_description || newRow.description || '',
                    price: newRow.discount_price || newRow.price,
                    originalPrice: newRow.discount_price ? newRow.price : null,
                    time: newRow.preparation_time ? `${newRow.preparation_time}min` : '15min',
                    serves: newRow.serves ? `Serves ${newRow.serves}` : 'Serves 1',
                    dietType: newRow.is_veg ? 'veg' : 'non-veg',
                    tags: newRow.tags || [],
                    variants: newRow.variants || [],
                    addons: newRow.addons || [],
                    modelUrl: newRow.model_url || null,
                    isAvailable: newRow.is_available,
                  };
                }
                // DELETE or item became invisible via RLS (unavailable → treated as DELETE)
                // In this case old row id matches — mark as unavailable
                if (eventType === 'DELETE' && oldRow && item.id === oldRow.id) {
                  return { ...item, isAvailable: false };
                }
                return item;
              });
            });

            // INSERT: a newly available item — trigger a full refresh to get images too
            if (eventType === 'INSERT') {
              loadMenu();
            } else {
              // Sync updated state to sessionStorage cache
              sessionStorage.setItem('menuData', JSON.stringify(updated));
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [restaurantId, isAuthenticated, user]);

  const toggleFavorite = async (itemId) => {
    if (!isAuthenticated || !user) {
      // Fallback to local state if not logged in (optional, or just prompt login)
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



  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
    setSelectedAddons([]);
    setShowItemModal(true);
  };

  const getModalTotalPrice = () => {
    if (!selectedItem) return 0;
    const basePrice = selectedVariant ? selectedVariant.price : (selectedItem.price);
    const addonsPrice = (selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
    return basePrice + addonsPrice;
  };

  // Safely determine the active category
  const actualCategory = selectedCategory === 'All'
    ? 'All'
    : categories.includes(selectedCategory) 
      ? selectedCategory 
      : (categories.length > 0 ? categories[0] : 'Starters');

  const itemsToFilter = actualCategory === 'All'
    ? Object.values(menuItems).flat()
    : (menuItems[actualCategory] || []);

  const filteredItems = itemsToFilter.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(searchLower);
    const descMatch = item.description?.toLowerCase().includes(searchLower);
    const vegMatch = vegOnly ? item.dietType === 'veg' : true;
    return (nameMatch || descMatch) && vegMatch;
  });

  return (
    <div className={`menu-container${cartTotal > 0 ? ' has-cart' : ''}`}>
      {/* No Restaurant Context – fallback for direct /menu access */}
      {/* Global Scanner Modal overlay */}
      {showScanner && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'var(--bg-primary, #fff)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px'
        }}>
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Scanner 
                  onScan={(result) => {
                    const text = Array.isArray(result) ? result[0].rawValue : (result?.text || result);
                    if (text) {
                      setShowScanner(false);
                      if (text.startsWith('http')) {
                        window.location.href = text;
                      } else {
                        navigate(text);
                      }
                    }
                  }}
                  onError={(error) => console.log(error?.message)}
                />
              </div>
              <button 
                onClick={() => setShowScanner(false)}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: '24px', 
                  border: '1px solid #8B3A1E', 
                  color: '#8B3A1E', 
                  background: 'transparent',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Scanner
              </button>
            </div>
        </div>
      )}

      {/* No Restaurant Context – fallback for direct /menu access */}
      {!restaurantId && !showScanner && (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '32px',
          textAlign: 'center',
          background: 'var(--bg-primary, #fff)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <QrCode size={72} color="#8B3A1E" strokeWidth={1.5} />
            <h2 style={{ color: '#8B3A1E', fontSize: '1.5rem', fontWeight: 700 }}>
              Scan the QR Code
            </h2>
            <p style={{ color: '#666', maxWidth: '280px', lineHeight: 1.6 }}>
              Please scan the QR code on your table to view the restaurant menu.
            </p>
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            style={{ 
              padding: '14px 28px', 
              borderRadius: '30px', 
              background: '#8B3A1E', 
              color: '#FFF', 
              fontWeight: 600,
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(139, 58, 30, 0.2)'
            }}
          >
            <QrCode size={20} />
            Scan Table QR
          </button>
        </div>
      )}

      {/* Main menu content – only renders when restaurantId exists */}
      {restaurantId && (<>
      <header className="menu-header-nav">
        <Hamburger />
        <div className="header-nav-right">
          <NavLink to="/likes" className="header-nav-btn">
            <Heart size={24} color="#8B3A1E" />
            {favorites.length > 0 && (
              <span className="nav-badge">
                {favorites.length > 9 ? '9+' : favorites.length}
              </span>
            )}
          </NavLink>
          <NavLink to="/orders" className="header-nav-btn">
            <ShoppingCart size={22} color="#8B3A1E" />
            {cartTotal > 0 && (
              <span className="nav-badge">{cartTotal}</span>
            )}
          </NavLink>
        </div>
      </header>

      {/* Hero Section with AI Illustration */}
      <section className="menu-hero-section">
        <div className="menu-hero-text">
          <h1>Our <span className="highlight">Delicious</span></h1>
          <h1>Menu</h1>
        </div>
        <div className="menu-hero-image">
          <img src="/assets/menu-hero-illustration.png" alt="Chef Illustration" />
        </div>
      </section>

      {/* Search Bar Redirect */}
      <div className="menu-search-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="menu-search-container" onClick={() => navigate('/search')} style={{ flex: 1, margin: 0 }}>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search your favourite food..."
            readOnly
            className="search-input"
          />
        </div>
        
        {/* Right-aligned Veg Toggle with text inside thumb */}
        <div className="veg-filter-row right-aligned">
          <button 
            className={`modern-toggle text-inside ${vegOnly ? 'active' : ''}`}
            onClick={() => setVegOnly(!vegOnly)}
            aria-label="Toggle Vegetarian Only"
          >
            <div className="toggle-thumb">
              <span className="thumb-text">Veg</span>
            </div>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="categories-list">
          <button
            className={`category-btn ${actualCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${actualCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      {menuLoading && Object.keys(menuItems).length === 0 ? (
        <div className="menu-items">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-item">
              <div className="skeleton-pulse skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-pulse skeleton-text title"></div>
                <div className="skeleton-pulse skeleton-text"></div>
                <div className="skeleton-pulse skeleton-text short"></div>
                <div className="skeleton-footer">
                  <div className="skeleton-pulse skeleton-price"></div>
                  <div className="skeleton-pulse skeleton-btn"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="menu-items" style={cartTotal > 0 ? { paddingBottom: '100px' } : {}}>
          {filteredItems.map(item => {
            const isOutOfStock = item.isAvailable === false;
            return (
              <div
                key={item.id}
                className={`menu-item${isOutOfStock ? ' out-of-stock' : ''}`}
                onClick={isOutOfStock ? undefined : () => handleItemClick(item)}
                style={isOutOfStock ? { cursor: 'default' } : {}}
              >
                <div className="menu-image-container">
                  <div className="image-scroll-wrapper">
                    {item.images && item.images.length > 0 ? (
                      item.images.map((imgUrl, idx) => (
                        <div key={idx} className="image-bg-wrapper">
                          <img src={imgUrl} alt={`${item.name} - ${idx}`} loading="lazy" />
                        </div>
                      ))
                    ) : (
                      <div className="image-bg-wrapper">
                        <img src={item.image} alt={item.name} loading="lazy" />
                      </div>
                    )}
                  </div>
                  {isOutOfStock && (
                    <div className="out-of-stock-overlay">
                      <span className="out-of-stock-label">Out of Stock</span>
                    </div>
                  )}
                </div>

                <div className="menu-details">
                  <div className="details-header">
                    <div className="title-desc">
                      <h3>{item.name}</h3>
                      <p className="menu-description">{item.shortDesc}</p>
                    </div>
                    {!isOutOfStock && (
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
                    )}
                  </div>

                  <div className="details-meta">
                    <div className="meta-item">
                      <Star size={14} fill={isOutOfStock ? '#AAAAAA' : '#8B3A1E'} color={isOutOfStock ? '#AAAAAA' : '#8B3A1E'} />
                      <span>{item.rating}</span>
                    </div>
                    <div className="meta-item">
                      <Clock size={14} color={isOutOfStock ? '#AAAAAA' : '#1A1A1A'} />
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
                    {isOutOfStock ? (
                      <span className="unavailable-tag">Unavailable</span>
                    ) : (item.variants?.length > 0 || item.addons?.length > 0) ? (
                      getItemQuantity(item.id) === 0 ? (
                        <button
                          className="add-btn-large"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
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
                            onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )
                    ) : getItemQuantity(item.id) === 0 ? (
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
            );
          })}
        </div>
      )}

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

      {/* Item Details Modal - Elegant Minimalist Design */}
      {showItemModal && selectedItem && (
        <div className={`item-modal-overlay ${showItemModal ? 'show' : ''}`} onClick={closeItemModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>

            {/* Drag Indicator */}
            <div className="modal-drag-bar"></div>

            {/* Close Button */}
            <button className="modal-x-btn" onClick={closeItemModal}>
              <X size={18} />
            </button>

            <div className="modal-scrollable-content">
              {/* Centered Dish Image */}
              <div className="modal-dish-showcase">
                {selectedItem.images && selectedItem.images.length > 1 ? (
                  <div className="dish-images-scroll-container">
                    {selectedItem.images.map((imgUrl, idx) => (
                      <div key={idx} className="dish-image-frame">
                        <img src={imgUrl} alt={`${selectedItem.name} ${idx + 1}`} loading="lazy" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dish-image-frame">
                    <img src={selectedItem.image} alt={selectedItem.name} loading="lazy" />
                  </div>
                )}
                <button
                  className="modal-fav-floating"
                  onClick={() => toggleFavorite(selectedItem.id)}
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
                
                {selectedItem.modelUrl && (
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
                )}
              </div>

              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div className="modal-customization-section">
                  <div className="customization-title-container">
                    <h3 className="customization-title">Choose Variant</h3>
                    <span className="customization-badge required">Required</span>
                  </div>
                  <div className="customization-options-list">
                    {selectedItem.variants.map((v) => {
                      const vKey = v._key ?? v.id ?? v.name;
                      const selKey = selectedVariant?._key ?? selectedVariant?.id ?? selectedVariant?.name;
                      const isActive = vKey !== undefined && vKey === selKey;
                      return (
                        <div
                          key={vKey}
                          className={`customization-option-row ${isActive ? 'active' : ''}`}
                          onClick={() => setSelectedVariant(v)}
                        >
                          <div className="customization-option-left">
                            <div className="custom-radio">
                              {isActive && <div className="custom-radio-inner" />}
                            </div>
                            <span className="customization-option-name">{v.name}</span>
                          </div>
                          <span className="customization-option-price">₹{v.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItem.addons && selectedItem.addons.length > 0 && (
                <div className="modal-customization-section">
                  <div className="customization-title-container">
                    <h3 className="customization-title">Add-ons</h3>
                    <span className="customization-badge optional">Optional</span>
                  </div>
                  <div className="customization-options-list">
                    {selectedItem.addons.map((addon) => {
                      const addonKey = addon._key ?? addon.id ?? addon.name;
                      const isSelected = selectedAddons.some(a => (a._key ?? a.id ?? a.name) === addonKey);
                      const handleToggleAddon = () => {
                        if (isSelected) {
                          setSelectedAddons(prev => prev.filter(a => (a._key ?? a.id ?? a.name) !== addonKey));
                        } else {
                          setSelectedAddons(prev => [...prev, addon]);
                        }
                      };
                      return (
                        <div
                          key={addon.id}
                          className={`customization-option-row ${isSelected ? 'active' : ''}`}
                          onClick={handleToggleAddon}
                        >
                          <div className="customization-option-left">
                            <div className="custom-checkbox">
                              <div className="custom-checkbox-inner" />
                            </div>
                            <span className="customization-option-name">{addon.name}</span>
                          </div>
                          <span className="customization-option-price">+₹{addon.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="modal-bottom-bar">
              <div className="price-display">
                <span className="price-rupee">₹{getModalTotalPrice()}</span>
              </div>

              {(selectedItem.variants?.length > 0 || selectedItem.addons?.length > 0) ? (
                <button
                  className="add-to-order-btn"
                  onClick={() => {
                    addToCart(selectedItem, selectedVariant, selectedAddons);
                    closeItemModal();
                  }}
                >
                  Add to Order {getBaseItemQuantity(selectedItem.id) > 0 && `(${getBaseItemQuantity(selectedItem.id)} in cart)`}
                </button>
              ) : getItemQuantity(selectedItem.id) === 0 ? (
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

    </>)}

      {/* Bottom Navigation */}
      {!showItemModal && !showScanner && <BottomNav />}
    </div>
  );
};

export default MenuPage;