import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, Home, ShoppingBag, User, Star, Plus, Minus, Filter, ShoppingCart, X, Grid, Clock, Hourglass, ArrowRight, Users } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import './menu.css';
import Hamburger from '../components/hamburger';

const MenuPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Starters');
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const cartIconRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(0);

  const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts'];

  const closeItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  const menuItems = {
    'Starters': [
      {
        id: 1,
        name: 'Caesar Salad',
        shortDesc: 'Crisp romaine lettuce tossed with creamy Caesar dressing and croutons',
        description: 'Fresh, crisp heads of romaine lettuce tossed in our signature creamy Caesar dressing. Loaded with herb-infused croutons and generous shavings of aged Parmesan cheese.',
        price: 340,
        time: '15min',
        rating: 4.6,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
        dietType: 'veg'
      },
      {
        id: 2,
        name: 'Chicken Wings',
        shortDesc: 'Crispy fried wings tossed in our signature spicy buffalo sauce',
        description: 'Crispy fried chicken wings tossed in our signature spicy buffalo sauce, served with cool ranch dipping sauce and fresh celery sticks. Perfect for sharing.',
        price: 480,
        time: '20min',
        rating: 4.8,
        serves: 'Serves 2',
        image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop',
        dietType: 'non-veg'
      },
      {
        id: 3,
        name: 'Avocado Toast',
        shortDesc: 'Fresh smashed avocado seasoned with lime on artisan sourdough bread',
        description: 'Perfectly ripe avocado smashed and seasoned with lime, sea salt, and red pepper flakes, served on toasted artisan sourdough bread. Topped with microgreens.',
        price: 380,
        time: '10min',
        rating: 4.4,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=400&fit=crop',
        dietType: 'vegan'
      }
    ],
    'Main Course': [
      {
        id: 4,
        name: 'Grilled Salmon',
        shortDesc: 'Premium Atlantic salmon grilled to perfection with lemon herb butter',
        description: 'Premium Atlantic salmon fillet grilled to perfection and topped with a zesty lemon herb butter. Served with seasonal roasted vegetables.',
        price: 740,
        time: '25min',
        rating: 4.7,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
        dietType: 'non-veg'
      },
      {
        id: 5,
        name: 'Pasta Carbonara',
        shortDesc: 'Classic creamy Italian pasta with crispy bacon and parmesan cheese',
        description: 'Traditional Italian pasta carbonara made with al dente spaghetti, crispy bacon, fresh eggs, parmesan cheese, and black pepper. Rich and creamy.',
        price: 560,
        time: '20min',
        rating: 4.5,
        serves: 'Serves 2',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=400&fit=crop',
        dietType: 'non-veg'
      },
      {
        id: 6,
        name: 'Veggie Burger',
        shortDesc: 'Delicious plant-based patty topped with fresh veggies and house sauce',
        description: 'Delicious plant-based burger patty made from black beans and vegetables, topped with lettuce, tomato, pickles, and our special house sauce.',
        price: 540,
        time: '18min',
        rating: 4.3,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop',
        dietType: 'vegan'
      }
    ],
    'Drinks': [
      {
        id: 7,
        name: 'Fresh Orange Juice',
        shortDesc: 'Pure freshly squeezed juice from premium oranges with no sugar added',
        description: 'Pure, freshly squeezed orange juice made from premium oranges. No added sugar or preservatives - just pure, natural goodness.',
        price: 180,
        time: '5min',
        rating: 4.8,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
        dietType: 'vegan'
      },
      {
        id: 8,
        name: 'Iced Coffee',
        shortDesc: 'Smooth cold brew coffee made from premium arabica beans served over ice',
        description: 'Smooth cold brew coffee made from premium arabica beans, steeped for 12 hours for a rich, low-acid flavor. Served over ice.',
        price: 140,
        time: '3min',
        rating: 4.6,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
        dietType: 'veg'
      }
    ],
    'Desserts': [
      {
        id: 10,
        name: 'Chocolate Cake',
        shortDesc: 'Decadent triple-layer chocolate cake with silky ganache and whipped cream',
        description: 'Decadent triple-layer chocolate cake made with premium cocoa, layered with silky chocolate ganache and topped with fresh whipped cream.',
        price: 300,
        time: '5min',
        rating: 4.9,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
        dietType: 'veg'
      },
      {
        id: 11,
        name: 'Tiramisu',
        shortDesc: 'Authentic Italian tiramisu with layers of mascarpone cream and cocoa',
        description: 'Authentic Italian tiramisu made with layers of coffee-soaked ladyfinger biscuits and rich mascarpone cream, dusted with premium cocoa.',
        price: 320,
        time: '5min',
        rating: 4.8,
        serves: 'Serves 1',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
        dietType: 'veg'
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
    if (event) event.stopPropagation();

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

  const filteredItems = menuItems[selectedCategory].filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="menu-container">
      {/* Header with Nav Buttons */}
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
      <div className="menu-search-section">
        <div className="menu-search-container" onClick={() => navigate('/search')}>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search your favourite food..."
            readOnly
            className="search-input"
          />
        </div>
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
                      addToCart(item, e);
                    }}
                  >
                    <Plus size={20} color="#FFFFFF" />
                  </button>
                ) : (
                  <div className="menu-qty-stepper" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="menu-stepper-btn"
                      onClick={(e) => removeFromCart(item.id, e)}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="menu-stepper-value">{getItemQuantity(item.id)}</span>
                    <button
                      className="menu-stepper-btn"
                      onClick={(e) => addToCart(item, e)}
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

export default MenuPage;