import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, ChevronRight, LogOut, Menu } from 'lucide-react';

const Tooltip = ({
  text,
  showTooltip,
  children,
}: {
  text: string;
  showTooltip: boolean;
  children: React.ReactNode;
}) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!showTooltip || !ref.current) return;

    const icon = ref.current.querySelector("span");
    if (!icon) return;

    const rect = icon.getBoundingClientRect();

    setPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });

    setShow(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      className="w-full"
    >
      {children}
      {show && (
        <div
          className="fixed z-[9999] px-3 py-1.5 bg-tk-bg-elevated text-tk-text text-[13px] font-semibold rounded-md border border-tk-border shadow-[0_4px_20px_rgba(0,0,0,0.15)] whitespace-nowrap pointer-events-none -translate-y-1/2"
          style={{
            top: pos.top,
            left: pos.left,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

interface NavItem {
  icon: (active: boolean) => React.ReactNode;
  label: string;
  id: string;
  path: string;
}

const DashboardIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const OrderIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 3H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V5a2 2 0 00-2-2z" fill={active ? 'currentColor' : 'none'} />
    <line x1="7" y1="8" x2="17" y2="8" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
    <line x1="7" y1="12" x2="17" y2="12" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
    <line x1="7" y1="16" x2="13" y2="16" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
  </svg>
);

const MenuIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.8' : '2'} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h12" />
    <circle cx="20" cy="18" r="2" fill={active ? 'currentColor' : 'none'} />
  </svg>
);

const PaymentIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
  </svg>
);

const ReportIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '3' : '2'} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TableIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10" />
    <path d="M19 8v10" />
    <line x1="3" y1="18" x2="8" y2="18" />
    <line x1="16" y1="18" x2="21" y2="18" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SubscriptionIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M2 12h20" fill={active ? 'currentColor' : 'none'} stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} strokeWidth="1" />
    <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" fill={active ? 'currentColor' : 'none'} />
    <path d="M16 14l-4 4-4-4M12 18V9" stroke={active ? 'var(--icon-stripe, #FFF0EC)' : 'currentColor'} />
  </svg>
);

const UsersIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRestaurantName, activeRestaurantLogo, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [logoError, setLogoError] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [activeRestaurantLogo]);

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
    if (path.includes('/team')) return 'team';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return true;
    }
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  }, [location.pathname]);

  const navItems: NavItem[] = [
    { icon: (active) => <DashboardIcon active={active} />, label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
    { icon: (active) => <OrderIcon active={active} />, label: 'Order Management', id: 'order', path: '/orders' },
    { icon: (active) => <MenuIcon active={active} />, label: 'Menu Management', id: 'menu', path: '/menu' },
    { icon: (active) => <PaymentIcon active={active} />, label: 'Payment Management', id: 'payment', path: '/payments' },
    { icon: (active) => <ReportIcon active={active} />, label: 'Report and Analytics', id: 'report', path: '/reports' },
    { icon: (active) => <TableIcon active={active} />, label: "Table Management", id: "table-management", path: "/table-management" },
    { icon: (active) => <UsersIcon active={active} />, label: 'Team Management', id: 'team', path: '/team' },
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

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Mobile Hamburger Button */}
      <button
        className={`fixed top-4 left-4 z-[90] p-2 bg-tk-bg-surface border border-tk-border rounded-lg md:hidden shadow-sm transition-opacity duration-200 ${!isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={() => setIsCollapsed(false)}
      >
        <Menu size={24} className="text-tk-text" />
      </button>

      {/* Overlay for mobile when sidebar is open */}
      <div
        className={`fixed inset-0 bg-black/50 z-[95] md:hidden transition-opacity duration-300 ${!isCollapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCollapsed(true)}
      />      
      
      <div className={`fixed left-0 top-0 h-screen bg-tk-bg py-4 flex flex-col z-[100] font-sans transition-[width,transform] duration-300 ease-in-out border-r-[1.5px] border-tk-border md:translate-x-0 ${isCollapsed ? '-translate-x-full w-[280px] md:w-[64px] px-1.5' : 'translate-x-0 w-[280px] md:w-[240px] px-2'} shadow-[4px_0_24px_rgba(0,0,0,0.08)] md:shadow-none`}>

        <button 
          className={`hidden md:flex absolute top-1 w-7 h-7 bg-tk-bg text-tk-text-secondary border-[1.5px] border-tk-border rounded-full items-center justify-center cursor-pointer z-[110] shadow-sm hover:scale-105 hover:text-tk-text hover:border-tk-text-secondary transition-all duration-200 -right-[14px]`} 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
        </button>

        <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col">
          <div className="flex flex-col items-center mb-5 shrink-0 mt-2">
            <div className="w-14 h-14 flex items-center justify-center mb-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`rounded-full bg-tk-burgundy-bg flex items-center justify-center overflow-hidden border-2 border-tk-burgundy transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(139,58,30,0.15)] ${isCollapsed && !isMobile ? 'w-10 h-10' : 'w-14 h-14'}`}
                aria-label="Go to dashboard"
              >
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
              </button>
            </div>
            <div className="w-full h-9 flex items-start justify-center shrink-0">
              {showLabels && (
                <div className="text-tk-text text-[14px] font-semibold text-center px-1 leading-tight">
                  {activeRestaurantName}
                </div>
              )}
            </div>
          </div>

          <nav className="flex flex-col gap-0 flex-1 w-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Tooltip key={item.id} text={item.label} showTooltip={isCollapsed && !isMobile}>
                  <div
                    className={`flex items-center rounded-tk-md cursor-pointer transition-all duration-200 text-[13px] border-[1px] gap-2 p-2 ${isActive ? 'bg-tk-burgundy text-white font-semibold border-tk-burgundy shadow-[0_4px_12px_rgba(139,58,30,0.25)]' : 'text-tk-text-secondary border-transparent hover:bg-tk-burgundy-bg hover:text-tk-burgundy hover:border-tk-burgundy/15 font-medium'}`}
                    onClick={() => handleNavClick(item)}
                  >
                    <span className="w-6 h-6 flex items-center justify-center shrink-0">{item.icon(isActive)}</span>
                    {showLabels && <span className="font-inherit whitespace-nowrap">{item.label}</span>}
                  </div>
                </Tooltip>
              );
            })}
          </nav>

          <div className="w-full mt-4 flex flex-col gap-2">
            <Tooltip text={isCollapsed ? 'Profile' : 'Profile'} showTooltip={isCollapsed && !isMobile}>
              <div className={`flex items-center justify-between rounded-tk-md border-[1.5px] transition-all duration-200 ${activeTab === 'profile' ? 'bg-tk-burgundy text-white border-tk-burgundy font-semibold shadow-[0_4px_12px_rgba(139,58,30,0.25)]' : 'bg-tk-bg-card text-tk-text-secondary border-tk-border hover:bg-tk-burgundy-bg hover:text-tk-burgundy hover:border-tk-burgundy/20 hover:-translate-y-[1px]'}`}>
                <div
                  className={`flex items-center cursor-pointer text-[13px] gap-2 p-2 ${isCollapsed && !isMobile ? 'w-10 h-10 justify-center' : 'flex-1'}`}
                  onClick={() => { navigate('/profile'); if (window.innerWidth <= 768) setIsCollapsed(true); }}
                >
                  <span className="w-6 h-6 flex items-center justify-center shrink-0"><ProfileIcon active={activeTab === 'profile'} /></span>
                  {(!isCollapsed || isMobile) && <span className="font-inherit whitespace-nowrap">Profile</span>}
                </div>

                {(!isCollapsed || isMobile) && (
                  <Tooltip text="Sign Out" showTooltip={false}>
                    <button
                      type="button"
                      className="flex items-center justify-center border-l border-tk-border/70 cursor-pointer bg-transparent text-current transition-all duration-200 hover:bg-tk-burgundy-bg hover:text-tk-burgundy hover:border-tk-burgundy/20 px-2 h-10 ml-auto"
                      onClick={() => setShowLogoutConfirm(true)}
                      aria-label="Sign out"
                    >
                      <LogOut size={16} />
                    </button>
                  </Tooltip>
                )}
              </div>
            </Tooltip>

            {/* Dark Mode Toggle */}
            <Tooltip text={isDark ? 'Light Mode' : 'Dark Mode'} showTooltip={isCollapsed && !isMobile}>
              <button
                className="w-full flex items-center border border-tk-border rounded-tk-md cursor-pointer bg-transparent text-tk-text-secondary transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-burgundy text-[13px] gap-2 p-2"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  toggleTheme({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                }}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="w-6 h-6 flex items-center justify-center shrink-0">
                  {isDark ? (
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                  )}
                </span>
                {showLabels && (
                  <span className="font-inherit font-medium whitespace-nowrap">
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </span>
                )}
              </button>
            </Tooltip>
        </div>
      </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[120] p-5">
          <div className="bg-white rounded-3xl p-8 max-w-[420px] w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] dark:bg-tk-bg-card dark:border dark:border-tk-border">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                <LogOut size={24} />
              </div>
              <h3 className="m-0 text-[20px] font-semibold text-tk-text dark:text-tk-text">Sign Out</h3>
            </div>
            <p className="m-0 text-[14px] text-tk-text-secondary dark:text-tk-text-secondary">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3 justify-end mt-6">
              <button
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_8px_18px_rgba(139,58,30,0.2)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;