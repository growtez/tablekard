import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, ShoppingBag, Star, ListOrdered, User,
  Info, LogOut, LogIn, Menu as MenuIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import './hamburger.css';

const Hamburger = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { restaurant } = useRestaurant();

  // Derived display values – fall back gracefully when no restaurant is loaded
  const restaurantName = restaurant?.name  || 'Tablekard';
  const restaurantTag  = restaurant?.tagline || 'The Art of Fine Dining';
  const logoSrc        = restaurant?.logo_url || '/assets/delish_logo.png';

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isSidebarOpen]);

  // Dynamic font size based on name length
  const getDynamicFontSize = (name) => {
    const len = name.length;
    if (len > 20) return '10px';
    if (len > 12) return '12px';
    return '14px';
  };

  const getDynamicLetterSpacing = (name) => {
    const len = name.length;
    if (len > 18) return '0.5px';
    if (len > 10) return '1.5px';
    return '3px';
  };

  const dynamicStyles = {
    fontSize: getDynamicFontSize(restaurantName),
    letterSpacing: getDynamicLetterSpacing(restaurantName)
  };

  const close = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    close();
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/login');
  };

  const handleLogin = () => {
    close();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Sidebar panel */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>

        {/* ── Header: restaurant logo + name ── */}
        <div className="sidebar-header">
          <div className="company-section">
            <div className="company-logo">
              <img
                src={logoSrc}
                alt={restaurantName}
                onError={e => { e.currentTarget.src = '/assets/delish_logo.png'; }}
              />
            </div>
            <div className="company-info">
              <h3 style={dynamicStyles}>{restaurantName}</h3>
              <p>{restaurantTag}</p>
            </div>
          </div>
          <button className="close-btn" onClick={close} aria-label="Close menu">×</button>
        </div>

        {/* ── Nav links ── */}
        <div className="sidebar-content">
          <NavLink to="/"            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={close} end>
            <Home size={20} /><span>Home</span>
          </NavLink>

          <NavLink to="/orders"      className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={close}>
            <ShoppingBag size={20} /><span>My Orders</span>
          </NavLink>

          <NavLink to="/likes"       className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={close}>
            <Star size={20} /><span>Favourites</span>
          </NavLink>

          <NavLink to="/live-queue"  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={close}>
            <ListOrdered size={20} /><span>Live Queue</span>
          </NavLink>

          <NavLink to="/profile"     className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={close}>
            <User size={20} /><span>Profile</span>
          </NavLink>

          <NavLink to="/about"       className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={close}>
            <Info size={20} /><span>About</span>
          </NavLink>

          {/* ── Auth action ── */}
          {!authLoading && (
            isAuthenticated ? (
              <button className="sidebar-item logout-btn" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            ) : (
              <button className="sidebar-item login-btn" onClick={handleLogin}>
                <LogIn size={20} />
                <span>Login</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={close} />
      )}
    </>
  );

  return (
    <>
      {/* Hamburger trigger button */}
      {!isSidebarOpen && (
        <div
          className="hamburger-btn"
          onClick={() => setIsSidebarOpen(true)}
          role="button"
          aria-label="Open menu"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setIsSidebarOpen(true)}
        >
          <div className="hamburger" />
          <div className="hamburger" />
        </div>
      )}

      {ReactDOM.createPortal(sidebarContent, document.body)}
    </>
  );
};

export default Hamburger;
