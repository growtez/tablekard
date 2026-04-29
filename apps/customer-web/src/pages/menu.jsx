import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, Home, ShoppingBag, User, Star, Plus, Minus, Filter, ShoppingCart, X, Grid, Clock, Hourglass, ArrowRight, Users, Loader2, QrCode } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '@restaurant-saas/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';
import './menu.css';
import Hamburger from '../components/hamburger';

const MenuPage = () => {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Starters');
  const [favorites, setFavorites] = useState([]);
  const { cartItems: cart, addToCart, removeFromCart, getItemQuantity, cartTotal, cartSubtotal } = useCart();
  const cartIconRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(0);
  const [menuItems, setMenuItems] = useState({});
  const [categories, setCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const closeItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
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
        // 2. Parallel Fetch
        const [catsRes, itemsRes] = await Promise.all([
          supabase.from('menu_categories').select('id, name').eq('restaurant_id', restaurantId).eq('active', true).order('sort_order'),
          supabase.from('menu_items').select('*, menu_item_images(id, image_url, sort_order)').eq('restaurant_id', restaurantId).eq('is_available', true)
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
                  serves: item.serves || 'Serves 1',
                  image: primaryImage,
                  images: images.map(img => img.image_url),
                  dietType: item.is_veg ? 'veg' : 'non-veg',
                };
              });
          });

          // 3. Update State & Cache
          setCategories(catNames);
          setMenuItems(grouped);
          sessionStorage.setItem('menuData', JSON.stringify(grouped));
          sessionStorage.setItem('menuCategories', JSON.stringify(catNames));

          if (!catNames.includes(selectedCategory) && catNames.length > 0) {
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
  }, [restaurantId]);

  const toggleFavorite = (itemId) => {
    setFavorites(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };



  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const filteredItems = (menuItems[selectedCategory] || []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="menu-container">
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
      <div className="menu-search-section" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="menu-search-container" onClick={() => navigate('/search')} style={{ flex: 1, margin: 0 }}>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search your favourite food..."
            readOnly
            className="search-input"
          />
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: '#8B3A1E',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 58, 30, 0.15)'
          }}
        >
          <QrCode size={20} />
        </button>
      </div>

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
      {menuLoading && Object.keys(menuItems).length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={40} color="#8B3A1E" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px', color: '#666', fontWeight: 500 }}>Fetching menu...</p>
        </div>
      ) : (
        <div className="menu-items">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-item" onClick={() => handleItemClick(item)}>
              <div className="menu-image-container">
                <div className="image-bg-wrapper">
                  <img src={item.image} alt={item.name} />
                </div>
              </div>

              <div className="menu-details">
                <div className="details-header">
                  <div className="title-desc">
                    <h3>{item.name}</h3>
                    <p className="menu-description">{item.shortDesc}</p>
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
                    <Users size={12} /> {item.serves || '8 pcs'}
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

            {/* Centered Dish Image */}
            <div className="modal-dish-showcase">
              <div className="dish-image-frame">
                <img src={selectedItem.image} alt={selectedItem.name} />
              </div>
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

    </>)}

      {/* Bottom Navigation - Hidden when modal or scanner is open */}
      {!showItemModal && !showScanner && (
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

export default MenuPage;