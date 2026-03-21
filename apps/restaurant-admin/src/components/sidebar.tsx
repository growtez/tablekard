// Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

interface NavItem {
  icon: string;
  label: string;
  id: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRestaurantName, activeRestaurantLogo } = useAuth();

  const [logoError, setLogoError] = useState(false);

  // Reset logo error when the logo URL changes
  useEffect(() => {
    setLogoError(false);
  }, [activeRestaurantLogo]);

  // Determine active tab based on current path (reactive to location changes)
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.includes('/orders')) return 'order';
    if (path.includes('/menu')) return 'menu';
    if (path.includes('/payments')) return 'payment';
    if (path.includes('/reports')) return 'report';
    if (path.includes('/qr-menu')) return 'qr-menu';
    if (path.includes('/table-management')) return 'table-management';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  // Collapse state - default to collapsed on mobile
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return true;
    }
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Apply class to body for global layout adjustments
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
      if (window.innerWidth > 768) {
        localStorage.setItem('sidebar-collapsed', 'true');
      }
    } else {
      document.body.classList.remove('sidebar-collapsed');
      if (window.innerWidth > 768) {
        localStorage.setItem('sidebar-collapsed', 'false');
      }
    }
  }, [isCollapsed]);

  // Handle resize to auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems: NavItem[] = [
    { icon: '📊', label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
    { icon: '📦', label: 'Order Management', id: 'order', path: '/orders' },
    { icon: '📋', label: 'Menu Management', id: 'menu', path: '/menu' },
    { icon: '💰', label: 'Payment Management', id: 'payment', path: '/payments' },
    { icon: '📈', label: 'Report and Analytics', id: 'report', path: '/reports' },
    // { icon: '📋', label: "QR Menu", id: "qr-menu", path: "/qrcode" },
    { icon: '📦', label: "Table Management", id: "table-management", path: "/table-management" }
  ];

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const showLabels = isMobile ? true : !isCollapsed;

  const showImage = activeRestaurantLogo && !logoError;
  const initial = activeRestaurantName.charAt(0).toUpperCase() || 'R';

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className={`mobile-menu-btn ${!isCollapsed ? 'hidden' : ''}`}
        onClick={() => setIsCollapsed(false)}
      >
        <span className="hamburger-icon">☰</span>
      </button>

      {/* Overlay for mobile when sidebar is open */}
      <div
        className={`sidebar-overlay ${!isCollapsed ? 'visible' : ''}`}
        onClick={() => setIsCollapsed(true)}
      />

      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>

        <div className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '»' : '«'}
        </div>

        <div className="profile">
          <div className="profile-avatar">
            {showImage ? (
              <img
                src={activeRestaurantLogo}
                alt={`${activeRestaurantName} logo`}
                className="avatar-img"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="avatar-initial">{initial}</span>
            )}
          </div>
          {showLabels && <div className="profile-name">{activeRestaurantName}</div>}
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
              onClick={() => handleNavClick(item)}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {showLabels && <span className="nav-label">{item.label}</span>}
            </div>
          ))}
        </nav>

        <div className={`help-button ${activeTab === 'profile' ? 'help-button-active' : ''}`} onClick={() => { navigate('/profile'); if (window.innerWidth <= 768) setIsCollapsed(true); }} title={isCollapsed && !isMobile ? "Profile" : undefined}>
          <span className="help-icon">👤</span>
          {showLabels && <span className="help-text">Profile</span>}
        </div>
      </div>
    </>
  );
};

export default Sidebar;