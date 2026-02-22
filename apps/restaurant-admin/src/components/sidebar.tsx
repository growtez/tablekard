// Sidebar.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

// Using URL instead of local asset to avoid missing file error
const pizzaLogo = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop";


interface NavItem {
  icon: string;
  label: string;
  id: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Set active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.includes('/orders')) return 'order';
    if (path.includes('/menu')) return 'menu';
    if (path.includes('/payments')) return 'payment';
    if (path.includes('/reports')) return 'report';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());
  
  // Collapse state - default to collapsed on mobile
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return true;
    }
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Apply class to body for global layout adjustments
  React.useEffect(() => {
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
  React.useEffect(() => {
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
  ];

  const handleNavClick = (item: NavItem) => {
    setActiveTab(item.id);
    navigate(item.path);
    if (window.innerWidth <= 768) {
      setIsCollapsed(true); // Auto close on mobile when navigating
    }
  };

  // Check if we are showing labels (on mobile, we always show labels when open, on desktop it depends on isCollapsed)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const showLabels = isMobile ? true : !isCollapsed;

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
            <img src={pizzaLogo} alt="log" className="avatar-img" />
          </div>
          {showLabels && <div className="profile-name">Pizza Hut</div>}
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

        <div className="help-button" onClick={() => navigate('/help')} title={isCollapsed && !isMobile ? "Help & Support" : undefined}>
          <span className="help-icon">❓</span>
          {showLabels && <span className="help-text">Help & Support</span>}
        </div>
      </div>
    </>
  );
};

export default Sidebar;