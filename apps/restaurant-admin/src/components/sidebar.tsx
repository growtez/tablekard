// Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './sidebar.css';

interface NavItem {
  icon: (active: boolean) => React.ReactNode;
  label: string;
  id: string;
  path: string;
}

// Inline SVG icon components (Flaticon-style) — filled when active
const DashboardIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const OrderIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 3H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V5a2 2 0 00-2-2z" fill={active ? 'currentColor' : 'none'} />
    <line x1="7" y1="8" x2="17" y2="8" stroke={active ? 'var(--icon-stripe, #A0D9B4)' : 'currentColor'} />
    <line x1="7" y1="12" x2="17" y2="12" stroke={active ? 'var(--icon-stripe, #A0D9B4)' : 'currentColor'} />
    <line x1="7" y1="16" x2="13" y2="16" stroke={active ? 'var(--icon-stripe, #A0D9B4)' : 'currentColor'} />
  </svg>
);

const MenuIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.8' : '2'} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h12" />
    <circle cx="20" cy="18" r="2" fill={active ? 'currentColor' : 'none'} />
  </svg>
);

const PaymentIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" stroke={active ? 'var(--icon-stripe, #A0D9B4)' : 'currentColor'} />
  </svg>
);

const ReportIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '3' : '2'} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TableIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10" />
    <path d="M19 8v10" />
    <line x1="3" y1="18" x2="8" y2="18" />
    <line x1="16" y1="18" x2="21" y2="18" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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
    { icon: (active) => <DashboardIcon active={active} />, label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
    { icon: (active) => <OrderIcon active={active} />, label: 'Order Management', id: 'order', path: '/orders' },
    { icon: (active) => <MenuIcon active={active} />, label: 'Menu Management', id: 'menu', path: '/menu' },
    { icon: (active) => <PaymentIcon active={active} />, label: 'Payment Management', id: 'payment', path: '/payments' },
    { icon: (active) => <ReportIcon active={active} />, label: 'Report and Analytics', id: 'report', path: '/reports' },
    // { icon: (active) => <MenuIcon active={active} />, label: "QR Menu", id: "qr-menu", path: "/qrcode" },
    { icon: (active) => <TableIcon active={active} />, label: "Table Management", id: "table-management", path: "/table-management" }
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
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                onClick={() => handleNavClick(item)}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon(isActive)}</span>
                {showLabels && <span className="nav-label">{item.label}</span>}
              </div>
            );
          })}
        </nav>

        <div className={`help-button ${activeTab === 'profile' ? 'help-button-active' : ''}`} onClick={() => { navigate('/profile'); if (window.innerWidth <= 768) setIsCollapsed(true); }} title={isCollapsed && !isMobile ? "Profile" : undefined}>
          <span className="help-icon"><ProfileIcon active={activeTab === 'profile'} /></span>
          {showLabels && <span className="help-text">Profile</span>}
        </div>
      </div>
    </>
  );
};

export default Sidebar;