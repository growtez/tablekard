import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, MessageCircle, User, Star, Settings, LogOut } from 'lucide-react';
import './hamburger.css';

const Hamburger = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  return (
    <>
      {/* Hamburger Button (only visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <div className="menu-icon" onClick={() => setIsSidebarOpen(true)}>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
        </div>
      )}

      {/* Sidebar */}
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="company-section">
            <div className="company-logo">
              <img src="/assets/delish_logo.png" alt="Delish Logo" />
            </div>
            <div className="company-info">
              <h3>Delish</h3>
              <p>The Art of Fine Dining</p>
            </div>
          </div>
          <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
            ×
          </button>
        </div>

        <div className="sidebar-content">
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Home size={20} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <ShoppingBag size={20} />
            <span>My Orders</span>
          </NavLink>

          <NavLink
            to="/likes"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Star size={20} />
            <span>Favourites</span>
          </NavLink>

          <NavLink
            to="/onboarding"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Star size={20} />
            <span>Onboarding</span>
          </NavLink>

          <NavLink
            to="/offers"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Star size={20} />
            <span>Rewards & Offers</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <User size={20} />
            <span>Profile</span>
          </NavLink>

          <button className="sidebar-item logout-btn" onClick={() => setIsSidebarOpen(false)}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
    </>
  );
};

export default Hamburger;
