import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
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
      <BottomNav />
    </div>
  );
};

export default MostPopularPage;
