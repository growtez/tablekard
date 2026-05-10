import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Home, ShoppingBag, MessageCircle, User, ArrowLeft } from 'lucide-react';
import './recent.css';

const RecentOrdersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="recent-container">
      <header className="header">
        <button onClick={() => navigate(-1)} className="global-back-btn">
          <ArrowLeft size={22} />
        </button>
        <h1>Recent Orders</h1>
      </header>
      <div className="recent-content">
        <p>Recent orders will appear here.</p>
      </div>
      <BottomNav />
    </div>
  );
};

export default RecentOrdersPage;
