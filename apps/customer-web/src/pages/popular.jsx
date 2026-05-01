import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, MessageCircle, User, ArrowLeft } from 'lucide-react';
import './popular.css';

const MostPopularPage = () => {
  const navigate = useNavigate();

  return (
    <div className="popular-container">
      <header className="header">
        <button onClick={() => navigate(-1)} className="global-back-btn">
          <ArrowLeft size={22} />
        </button>
        <h1>Most Popular</h1>
      </header>
      <div className="popular-content">
        <p>Most popular items will appear here.</p>
      </div>
      <nav className="bottom-nav">
        <NavLink to="/" className="nav-btn">
          <Home size={24} />
        </NavLink>
        <NavLink to="/menu" className="nav-btn">
          <ShoppingBag size={24} />
        </NavLink>
        <NavLink to="/orders" className="nav-btn">
          <MessageCircle size={24} />
        </NavLink>
        <NavLink to="/profile" className="nav-btn">
          <User size={24} />
        </NavLink>
      </nav>
    </div>
  );
};

export default MostPopularPage;
