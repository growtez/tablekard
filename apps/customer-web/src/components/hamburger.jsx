import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Star, ListOrdered, User, Info, LogOut } from 'lucide-react';
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

  // Sidebar content to be rendered via portal
  const sidebarContent = (
    <>
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
            to="/live-queue"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <ListOrdered size={20} />
            <span>Live Queue</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <User size={20} />
            <span>Profile</span>
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Info size={20} />
            <span>About</span>
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

  return (
    <>
      {/* Hamburger Button (only visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <div className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
        </div>
      )}

      {/* Render sidebar via portal to document.body */}
      {ReactDOM.createPortal(sidebarContent, document.body)}
    </>
  );
};

export default Hamburger;

