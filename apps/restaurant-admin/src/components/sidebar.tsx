// Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <line x1="7" y1="8" x2="17" y2="8" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
    <line x1="7" y1="12" x2="17" y2="12" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
    <line x1="7" y1="16" x2="13" y2="16" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
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
    <line x1="1" y1="10" x2="23" y2="10" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
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

const SubscriptionIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M2 12h20" fill={active ? 'currentColor' : 'none'} stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} strokeWidth="1" />
    <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" fill={active ? 'currentColor' : 'none'} />
    <path d="M16 14l-4 4-4-4M12 18V9" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
  </svg>
);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRestaurantName, activeRestaurantLogo } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
    if (path.includes('/subscription')) return 'subscription';
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
    { icon: (active) => <TableIcon active={active} />, label: "Table Management", id: "table-management", path: "/table-management" },
    { icon: (active) => <SubscriptionIcon active={active} />, label: 'Subscription', id: 'subscription', path: '/subscription' }
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
      />      <div className={`fixed left-0 top-0 h-screen bg-tk-bg py-4 flex flex-col z-[100] font-sans transition-[width,transform] duration-300 ease-in-out border-r-[1.5px] border-tk-border md:translate-x-0 ${isCollapsed ? 'w-[80px] -translate-x-full md:w-[80px] px-3' : 'w-[280px] translate-x-0 md:w-[240px] px-3'} overflow-y-auto no-scrollbar shadow-[4px_0_24px_rgba(0,0,0,0.08)] md:shadow-none`}>

        <button 
          className={`hidden md:flex absolute top-5 w-7 h-7 bg-tk-bg text-tk-text-secondary border-[1.5px] border-tk-border rounded-full items-center justify-center cursor-pointer z-[110] shadow-sm hover:scale-105 hover:text-tk-text hover:border-tk-text-secondary transition-all duration-200 ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-3'}`} 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
        </button>

        <div className="flex flex-col items-center mb-5 shrink-0">
          <div className={`rounded-full bg-tk-burgundy-bg flex items-center justify-center overflow-hidden border-2 border-tk-burgundy transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(139,58,30,0.15)] ${isCollapsed && !isMobile ? 'w-10 h-10 mb-0 mt-12' : 'w-14 h-14 mb-2'}`}>
            {showImage ? (
              <img
                src={activeRestaurantLogo}
                alt={`${activeRestaurantName} logo`}
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-2xl font-bold text-tk-burgundy leading-none select-none">{initial}</span>
            )}
          </div>
          {showLabels && <div className="text-tk-text text-[14px] font-semibold w-full text-center px-1 break-words leading-tight mt-1">{activeRestaurantName}</div>}
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center rounded-tk-md cursor-pointer transition-all duration-200 text-[13px] border-[1.5px] ${isCollapsed && !isMobile ? 'justify-center p-2.5 gap-0' : 'gap-2.5 py-2 px-3'} ${isActive ? 'bg-tk-burgundy text-white font-semibold border-tk-burgundy shadow-[0_4px_12px_rgba(139,58,30,0.25)]' : 'text-tk-text-secondary border-transparent hover:bg-tk-burgundy-bg hover:text-tk-burgundy hover:border-tk-burgundy/15 font-medium'}`}
                onClick={() => handleNavClick(item)}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <span className="text-[17px] flex items-center justify-center shrink-0">{item.icon(isActive)}</span>
                {showLabels && <span className="font-inherit">{item.label}</span>}
              </div>
            );
          })}
        </nav>

        <div 
          className={`flex items-center rounded-tk-md cursor-pointer mt-4 text-[13px] transition-all duration-200 border-[1.5px] ${isCollapsed && !isMobile ? 'justify-center p-2.5 gap-0' : 'gap-2.5 py-2 px-3'} ${activeTab === 'profile' ? 'bg-tk-burgundy text-white border-tk-burgundy font-semibold shadow-[0_4px_12px_rgba(139,58,30,0.25)]' : 'bg-tk-bg-card text-tk-text-secondary border-tk-border hover:bg-tk-burgundy-bg hover:text-tk-burgundy hover:border-tk-burgundy/20 hover:-translate-y-[1px]'}`} 
          onClick={() => { navigate('/profile'); if (window.innerWidth <= 768) setIsCollapsed(true); }} 
          title={isCollapsed && !isMobile ? "Profile" : undefined}
        >
          <span className="text-[17px] flex items-center justify-center shrink-0"><ProfileIcon active={activeTab === 'profile'} /></span>
          {showLabels && <span className="font-inherit">Profile</span>}
        </div>

        {/* Dark Mode Toggle */}
        <button
          className={`flex items-center border border-tk-border rounded-tk-md cursor-pointer bg-transparent text-tk-text-secondary transition-all duration-200 mt-2.5 hover:bg-tk-bg-hover hover:text-tk-burgundy text-[13px] ${isCollapsed && !isMobile ? 'justify-center p-2.5 gap-0' : 'gap-2.5 py-2 px-3'}`}
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="text-[17px] flex items-center justify-center shrink-0">
            {isDark ? (
              // Sun icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              // Moon icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </span>
          {showLabels && (
            <span className="font-inherit font-medium">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export default Sidebar;