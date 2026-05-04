import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut, Camera, ChevronRight, Heart, MapPin,
  Clock, HelpCircle, Phone, Mail, Utensils, Star, ListOrdered,
  Home, ShoppingBag, User, Edit2, ShoppingCart, MessageSquare, Info
} from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import './profile.css';
import Hamburger from '../components/hamburger';
import { getUserStats } from '../services/supabaseService';


const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { restaurant, tableId, tableNumber } = useRestaurant();
  const navigate = useNavigate();
  // Start as loading only if user isn't yet available, to avoid flash
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
    tableNumber: '',
    stats: {
      todaysOrders: 0,
      totalSpent: 0,
      favoriteItems: 0
    }
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        setIsProfileLoading(false);
        return;
      }

      try {
        const stats = await getUserStats(user.id);
        setUserProfile(prev => ({
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member',
          email: user?.email || '',
          phone: user?.phone || '+91 98XXX XXXXX',
          avatar: user?.user_metadata?.avatar_url || prev.avatar,
          tableNumber: tableNumber ? `Table No-${tableNumber}` : 'N/A',
          stats: stats
        }));
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfileData();
  }, [user, tableNumber]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...userProfile });

  // Sync edit form when userProfile changes
  useEffect(() => {
    setEditForm({ ...userProfile });
  }, [userProfile]);

  const fileInputRef = useRef(null);


  const handleEditToggle = () => {
    if (isEditing) {
      setUserProfile({ ...editForm });
    } else {
      setEditForm({ ...userProfile });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserProfile(prev => ({
        ...prev,
        avatar: imageUrl
      }));
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still navigate to login to clear UI state if needed
      navigate('/login');
    }
  };


  const menuItems = [
    {
      icon: <Clock size={20} />,
      title: "Order History",
      description: "View all your orders",
      to: "/order-history",
    },
    {
      icon: <Heart size={20} />,
      title: "Favorites",
      description: "Your favorite dishes",
      to: "/likes",
    },
    {
      icon: <MessageSquare size={20} />,
      title: "Feedback & Ratings",
      description: "Rate your dining experience",
      to: "/feedback",
    },
    {
      icon: <Info size={20} />,
      title: "About Restaurant",
      description: "Story, timings & more",
      to: "/about",
    },
  ];

  if (isProfileLoading) {
    return (
      <div className="profile-container">
        <style>{`
          @keyframes _prof_shimmer {
            0%   { background-position: -200% 0; }
            100% { background-position:  200% 0; }
          }
          .prof-sk {
            background: linear-gradient(90deg, #FFF0EC 25%, #FFD6C9 50%, #FFF0EC 75%);
            background-size: 200% 100%;
            animation: _prof_shimmer 1.5s infinite;
            border-radius: 8px;
          }
        `}</style>

        {/* Skeleton Hero */}
        <div className="profile-hero" style={{ minHeight: 220 }}>
          <div className="hero-pattern" />
          <div className="hero-header">
            <div className="prof-sk" style={{ width: 42, height: 42, borderRadius: 12 }} />
            <div className="prof-sk" style={{ width: 42, height: 42, borderRadius: 12 }} />
          </div>
          <div className="hero-avatar-section">
            <div className="prof-sk" style={{ width: 90, height: 90, borderRadius: '50%' }} />
          </div>
          <div className="hero-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 20 }}>
            <div className="prof-sk" style={{ width: 140, height: 22 }} />
            <div className="prof-sk" style={{ width: 190, height: 14, marginTop: 4 }} />
          </div>
        </div>

        {/* Skeleton Stats */}
        <div className="profile-content">
          <div className="stats-row">
            {[1, 2, 3].map(i => (
              <React.Fragment key={i}>
                <div className="stat-item">
                  <div className="prof-sk" style={{ width: 40, height: 24, margin: '0 auto 6px' }} />
                  <div className="prof-sk" style={{ width: 70, height: 12 }} />
                </div>
                {i < 3 && <div className="stat-divider" />}
              </React.Fragment>
            ))}
          </div>

          {/* Skeleton Menu Items */}
          <div className="menu-section" style={{ marginTop: 20 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f5ede9' }}>
                <div className="prof-sk" style={{ width: 36, height: 36, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="prof-sk" style={{ width: '55%', height: 14, marginBottom: 6 }} />
                  <div className="prof-sk" style={{ width: '75%', height: 11 }} />
                </div>
                <div className="prof-sk" style={{ width: 20, height: 20, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Hero Header with Gradient */}
      <div className="profile-hero">
        <div className="hero-pattern"></div>
        <div className="hero-header">
          <Hamburger />
          <button className="edit-btn" onClick={handleEditToggle}>
            <Edit2 size={18} />
          </button>
        </div>

        {/* Floating Avatar */}
        <div className="hero-avatar-section">
          <div className="avatar-wrapper">
            <img src={userProfile.avatar} alt="Profile" className="hero-avatar" />
            <button className="camera-btn" onClick={handleCameraClick}>
              <Camera size={14} />
            </button>
          </div>
        </div>

        <div className="hero-info">
          <h1>{userProfile.name}</h1>
          <p className="hero-email">{userProfile.email}</p>
          <div className="table-indicator">
            <MapPin size={14} />
            <span>{userProfile.tableNumber}</span>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">

        {/* Edit Form */}
        {isEditing && (
          <div className="edit-form">
            <h3 className="edit-title">Edit Profile</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button className="save-btn" onClick={handleEditToggle}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-value">{userProfile.stats.todaysOrders}</div>
            <div className="stat-label">Orders Today</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item featured">
            <div className="stat-value">
              ₹{Number(userProfile.stats.totalSpent) % 1 === 0
                ? Number(userProfile.stats.totalSpent)
                : Number(userProfile.stats.totalSpent).toFixed(1)}
            </div>
            <div className="stat-label">Total Spent</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">{userProfile.stats.favoriteItems}</div>
            <div className="stat-label">Favorites</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-card live-queue" onClick={() => navigate('/menu')}>
            <div className="action-icon">
              <ShoppingBag size={22} />
            </div>
            <span>Menu</span>
          </button>
          <button className="action-card live-queue" onClick={() => navigate('/orders')}>
            <div className="action-icon">
              <Clock size={22} />
            </div>
            <span>Orders</span>
          </button>
          <button className="action-card live-queue" onClick={() => navigate('/live-queue')}>
            <div className="action-icon">
              <ListOrdered size={22} />
            </div>
            <span>Live Queue</span>
          </button>
        </div>

        {/* Menu Section */}
        <div className="menu-section">
          <div className="menu-list">
            {menuItems.map((item, index) => (
              <NavLink key={index} to={item.to} className="menu-item">
                <div className="menu-icon">{item.icon}</div>
                <div className="menu-info">
                  <div className="menu-title">{item.title}</div>
                  <div className="menu-description">{item.description}</div>
                </div>
                <ChevronRight size={18} className="menu-arrow" />
              </NavLink>
            ))}
          </div>
        </div>

        {/* Restaurant Info Card — live data from DB */}
        <div className="restaurant-card">
          <div className="restaurant-header">
            <Star size={16} fill="#8B3A1E" color="#8B3A1E" />
            <span>{restaurant?.name || 'Restaurant'}</span>
          </div>
          <div className="restaurant-contact">
            {restaurant?.contact_phone ? (
              <a href={`tel:${restaurant.contact_phone}`} className="contact-link">
                <Phone size={16} />
                <span>{restaurant.contact_phone}</span>
              </a>
            ) : (
              <span className="contact-link" style={{ opacity: 0.4, cursor: 'default' }}>
                <Phone size={16} />
                <span>Phone not available</span>
              </span>
            )}
            {restaurant?.contact_email ? (
              <a href={`mailto:${restaurant.contact_email}`} className="contact-link">
                <Mail size={16} />
                <span>{restaurant.contact_email}</span>
              </a>
            ) : (
              <span className="contact-link" style={{ opacity: 0.4, cursor: 'default' }}>
                <Mail size={16} />
                <span>Email not available</span>
              </span>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button className="signout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <Home size={22} />
        </NavLink>

        <NavLink to="/menu" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <ShoppingBag size={22} />
        </NavLink>

        <NavLink to="/orders" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={22} />
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <User size={22} />
        </NavLink>
      </nav>
    </div >
  );
};

export default ProfilePage;