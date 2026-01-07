import React, { useState, useRef } from 'react';
import { Search, Heart, Home, ShoppingBag, MessageCircle, User, Star, Plus, Filter, ShoppingCart, X } from 'lucide-react';
import { NavLink } from "react-router-dom";
import './menu.css';
import Hamburger from '../components/hamburger';

const MenuPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Starters');
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const cartIconRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts'];

  const closeItemModal = () => {
    // Add closing classes for animation
    const overlay = document.querySelector('.item-modal-overlay');
    const content = document.querySelector('.item-modal-content');

    if (overlay) overlay.classList.add('closing');
    if (content) {
      content.classList.remove('slide-up');
      content.classList.add('slide-down');
    }

    // Wait for animation to complete before hiding modal
    setTimeout(() => {
      setShowItemModal(false);
      if (overlay) overlay.classList.remove('closing');
      if (content) content.classList.remove('slide-down');
    }, 400); // Match the closing transition duration (0.4s)

    // Clear selected item after everything is done
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
        fullDescription: 'Fresh romaine lettuce tossed with creamy Caesar dressing, shaved parmesan cheese, and crispy croutons. A classic salad that perfectly balances flavor and freshness.',
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
        fullDescription: 'Crispy fried chicken wings tossed in our signature spicy buffalo sauce, served with cool ranch dipping sauce and fresh celery sticks. Perfect for sharing or enjoying solo.',
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
        fullDescription: 'Perfectly ripe avocado smashed and seasoned with lime, sea salt, and red pepper flakes, served on toasted artisan sourdough bread. Topped with cherry tomatoes and microgreens.',
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
        fullDescription: 'Premium Atlantic salmon fillet grilled to perfection and topped with a zesty lemon herb butter. Served with seasonal roasted vegetables and your choice of side.',
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
        fullDescription: 'Traditional Italian pasta carbonara made with al dente spaghetti, crispy bacon, fresh eggs, parmesan cheese, and black pepper. Rich, creamy, and utterly delicious.',
        price: 560,
        time: '20min',
        rating: 4.5,
        servings: 2,
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=120&h=120&fit=crop',
        isVegan: false
      },
      {
        id: 6,
        name: 'Veggie Burger',
        description: 'Plant-based patty with fresh vegetables',
        fullDescription: 'Delicious plant-based burger patty made from black beans and vegetables, topped with lettuce, tomato, pickles, and our special house sauce. Served on a whole grain bun with sweet potato fries.',
        price: 540,
        time: '18min',
        rating: 4.3,
        servings: 1,
        image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=120&h=120&fit=crop',
        isVegan: true
      }
    ],
    'Drinks': [
      {
        id: 7,
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        fullDescription: 'Pure, freshly squeezed orange juice made from premium oranges. No added sugar or preservatives - just pure, natural goodness packed with vitamin C.',
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
        fullDescription: 'Smooth cold brew coffee made from premium arabica beans, steeped for 12 hours for a rich, low-acid flavor. Served over ice with your choice of milk and sweetener.',
        price: 140,
        time: '3min',
        rating: 4.6,
        servings: 1,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=120&h=120&fit=crop',
        isVegan: true
      },
      {
        id: 9,
        name: 'Smoothie Bowl',
        description: 'Mixed berry smoothie with toppings',
        fullDescription: 'A thick and creamy smoothie bowl made with mixed berries, banana, and acai. Topped with fresh fruits, granola, coconut flakes, and a drizzle of honey. A perfect healthy treat!',
        price: 260,
        time: '8min',
        rating: 4.7,
        servings: 1,
        image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=120&h=120&fit=crop',
        isVegan: true
      }
    ],
    'Desserts': [
      {
        id: 10,
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with cream',
        fullDescription: 'Decadent triple-layer chocolate cake made with premium cocoa, layered with silky chocolate ganache and topped with fresh whipped cream. Pure chocolate heaven in every bite.',
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
        fullDescription: 'Authentic Italian tiramisu made with layers of coffee-soaked ladyfinger biscuits and rich mascarpone cream, dusted with premium cocoa powder. A timeless classic dessert.',
        price: 320,
        time: '5min',
        rating: 4.8,
        servings: 1,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=120&h=120&fit=crop',
        isVegan: false
      },
      {
        id: 12,
        name: 'Fresh Fruit Salad',
        description: 'Seasonal fruits with honey',
        fullDescription: 'A colorful medley of fresh seasonal fruits including strawberries, blueberries, kiwi, mango, and melon. Lightly drizzled with organic honey and garnished with fresh mint leaves.',
        price: 220,
        time: '5min',
        rating: 4.5,
        servings: 1,
        image: 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?w=120&h=120&fit=crop',
        isVegan: true
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
    // Animate the button
    const button = event.currentTarget;
    button.style.transform = 'scale(1.2)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 200);

    // Animate the cart icon
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


  const filteredItems = menuItems[selectedCategory].filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="menu-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Hamburger />

          <NavLink to="/orders" className="cart-icon-container" ref={cartIconRef}>
            <ShoppingCart size={24} color="#d9b550" />
            {cart.length > 0 && (
              <div className="cart-count">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </div>
            )}
          </NavLink>
        </div>

        {/* Main Title */}
        <div className="main-title">
          <h1>Our <span className="highlight">Delicious</span></h1>
          <h1><span className="highlight">Menu</span></h1>
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
      <div className="menu-items">
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

      {/* Cart Indicator - Shows when items in cart */}
      {cart.length > 0 && (
        <NavLink to="/orders" className="cart-indicator">
          <ShoppingCart size={20} />
          <span>{cart.reduce((total, item) => total + item.quantity, 0)} items in cart</span>
        </NavLink>
      )}

      {/* Item Details Modal */}
      {showItemModal && selectedItem && (
        <div className={`item-modal-overlay ${showItemModal ? 'show' : ''}`} onClick={closeItemModal}>
          <div className={`item-modal-content ${showItemModal ? 'slide-up' : ''}`} onClick={(e) => e.stopPropagation()}>

            {/* Header: Just Item Name and Close */}
            <div className="modal-header-info">
              <h2 className="modal-item-name">{selectedItem.name}</h2>
              <button className="modal-close-btn" onClick={closeItemModal}>
                <X size={20} />
              </button>
            </div>

            {/* Large Image with Border Radius */}
            <div className="modal-main-image">
              <img src={selectedItem.image} alt={selectedItem.name} />
              {selectedItem.isVegan && <div className="modal-vegan-badge">Vegan</div>}
            </div>

            {/* Content Section */}
            <div className="modal-content-section">

              {/* Serving Information */}
              <div className="modal-serves-info">Serves {selectedItem.servings}</div>

              {/* Time, Rating and ADD Button Row */}
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

              {/* Price */}
              <div className="modal-main-price">₹{selectedItem.price}</div>

              {/* Description */}
              <p className="modal-main-description">
                {selectedItem.fullDescription || selectedItem.description}
              </p>

            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink to="/" className="nav-btn">
          <Home size={24} />
        </NavLink>

        <NavLink to="/menu" className="nav-btn">
          <ShoppingBag size={24} />
        </NavLink>

        <NavLink to="/orders" className="nav-btn">
          <ShoppingCart size={24} />
        </NavLink>

        <NavLink to="/profile" className="nav-btn">
          <User size={24} />
        </NavLink>
      </nav>
    </div>
  );
};

export default MenuPage;