import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import AdminPanel from './AdminPanel'
import Dashboard from './pages/Dashboard'
import Restaurants from './pages/Restaurants'
import RestaurantDetail from './pages/RestaurantDetail'
import UserDetail from './pages/UserDetail'
import Sidebar from './components/Sidebar'
import QuickCreateDrawer from './components/QuickCreateDrawer'
import { Plus, UserPlus, FilePlus, ChevronLeft, Edit, Save, X, RefreshCw } from 'lucide-react'
import { Badge } from './components/ui/Badge'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [activeForm, setActiveForm] = useState('user')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [refreshCallback, setRefreshCallback] = useState(null)
  const [headerData, setHeaderData] = useState(null)
  const [syncAction, setSyncAction] = useState(null)

  const openDrawer = (formType, data = null, onRefresh = null) => {
    setActiveForm(formType)
    setEditingData(data)
    setRefreshCallback(() => onRefresh)
    setIsDrawerOpen(true)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setEditingData(null)
    setRefreshCallback(null)
  }
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let active = true;

    // Safety fallback: if everything hangs, show the UI after 6s
    const globalTimeout = setTimeout(() => {
      if (active && loading) {
        console.warn("App: Initialization safety timeout reached");
        setLoading(false);
      }
    }, 6000);

    const initialize = async () => {
      console.log("App: Running Auth Init...");
      try {
        // Race for session
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        setSession(session);
        if (session) {
          await checkIsAdmin(session);
        }
      } catch (err) {
        console.error("App: Initialization error:", err);
      } finally {
        if (active) {
          setLoading(false);
          clearTimeout(globalTimeout);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`App: Auth State Change -> ${_event}`);
      if (!active) return;

      setSession(session);
      if (session) {
        checkIsAdmin(session);
      } else {
        setIsAdmin(false);
        setUserRole(null);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
      clearTimeout(globalTimeout);
    };
  }, []);

  const checkIsAdmin = async (session) => {
    if (!session?.user) return;

    setAuthError(null);
    console.log("App: Checking permissions for", session.user.id);

    // Fallback 1: Check metadata (often set by Edge Functions or Admin API)
    const metaRole = session.user.app_metadata?.role || session.user.user_metadata?.role;
    console.log("App: Metadata role found:", metaRole);
    if (metaRole && ['super_admin', 'restaurant_admin', 'admin'].includes(metaRole)) {
      console.log("App: Access granted via metadata");
      setUserRole(metaRole + " (metadata)");
      setIsAdmin(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.warn("App: Profile fetch error:", error.message);
        setAuthError(error.message);
        // If we have metadata role, keep it, otherwise denied
        if (!metaRole) setIsAdmin(false);
        return;
      }

      console.log("App: Profile role found:", data.role);
      setUserRole(data.role);
      const isAuthorized = ['super_admin', 'restaurant_admin', 'admin', 'restaurant_owner'].includes(data.role);
      setIsAdmin(isAuthorized);
    } catch (err) {
      console.error("App: Role check failed:", err.message);
      setAuthError(err.message);
      if (!metaRole) setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    console.log("App: Forced Logout");

    // Nuclear clear-out
    try {
      // 1. Clear session memory
      setSession(null);
      setIsAdmin(false);
      setUserRole(null);
      setAuthError(null);

      // 2. Clear persistence
      localStorage.clear();
      sessionStorage.clear();

      // 3. Clear Supabase internal state (don't await)
      supabase.auth.signOut().catch(() => { });

      console.log("App: Logic cleared, redirecting...");

      // 4. Force hard redirect to home
      window.location.replace(window.location.origin);
    } catch (e) {
      console.error("App: Logout fatal error:", e);
      // Absolute fallback
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="flex column items-center gap-4">
          <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p style={{ color: 'var(--accent-primary)', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
            Initializing Session...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  if (!isAdmin) {
    return (
      <div className="login-page">
        <div className="login-card animate-fade-in" style={{ textAlign: 'center' }}>
          <div className="login-header">
            <div className="logo-icon" style={{ margin: '0 auto 1.5rem' }}>!</div>
            <h1>Access Denied</h1>
            <p>Insufficient Permissions</p>
          </div>

          <div className="error-alert-modern" style={{ flexDirection: 'column', gap: '8px', marginBottom: '2rem', padding: '1.5rem' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Access Level Evaluation</div>

            <div className="flex justify-between w-full" style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Detected Role:</span>
              <code style={{ color: 'var(--accent-primary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                {userRole || 'NotFound/Unknown'}
              </code>
            </div>

            {authError && (
              <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '4px', textAlign: 'left', background: 'rgba(255,0,0,0.05)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.1)' }}>
                <strong>Database Error:</strong> {authError}
              </div>
            )}

            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
              User ID: <span style={{ opacity: 0.8 }}>{session?.user?.id}</span>
            </div>
          </div>

          <div className="flex column gap-3" style={{ width: '100%' }}>
            <button onClick={() => checkIsAdmin(session)} className="primary" style={{ width: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
              Refresh Permissions
            </button>
            <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}>
              Sign Out & Try Another Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return {
      title: 'Dashboard',
      stats: [
        { label: 'Total Restaurants', value: '1', path: '/restaurants' },
        { label: 'Total Users', value: '8', path: '/users' }
      ]
    };
    if (path === '/restaurants') return {
      title: 'Restaurants',
      stats: [
        { label: 'Total Restaurants', value: '1' },
        { label: 'Active Status', value: '1' },
        { label: 'Recently Added', value: '1' }
      ]
    };
    if (path === '/users') return {
      title: 'Users',
      stats: [
        { label: 'Total Users', value: '8' },
        { label: 'Super Admins', value: '2' },
        { label: 'Active Staff', value: '4' }
      ]
    };
    return { title: 'Command Center' };
  };

  const { title, stats } = getPageTitle();

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        session={session}
        onLogout={handleLogout}
      />

      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="top-nav">
          <div className="nav-container">
            <div className="flex items-center gap-4">
              {headerData ? (
                <div className="flex items-center gap-4 animate-fade-in">
                  <Link
                    to={headerData.backPath || "/restaurants"}
                    className="btn-back-nav-icon"
                    title={headerData.backTitle || "Back"}
                    onClick={() => setHeaderData(null)}
                  >
                    <ChevronLeft size={20} />
                  </Link>
                  <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
                  <div className="flex items-center gap-3">
                    <div className="res-avatar-small">
                      {headerData.logo_url ? <img src={headerData.logo_url} alt="" /> : <span>{headerData.name?.[0] || '?'}</span>}
                    </div>
                    <div className="flex column" style={{ gap: '0px' }}>
                      <div className="flex items-center gap-2">
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{headerData.name}</h2>
                        <Badge variant={headerData.status === 'active' ? 'success' : 'warning'} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {headerData.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {headerData.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" style={{ marginLeft: '1rem' }}>
                    {headerData.onEdit && (
                      <button
                        onClick={headerData.onEdit}
                        className="btn-ghost"
                        style={{ padding: '6px 12px', gap: '6px', fontSize: '0.8rem', opacity: 0.8 }}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{title}</h2>
                </div>
              )}
            </div>

            {!headerData && stats && (
              <div className="header-stats">
                {stats.map((stat, idx) => {
                  const content = (
                    <>
                      <span className="header-stat-label">{stat.label}</span>
                      <div className="header-stat-value-group">
                        <span className="header-stat-value">{stat.value}</span>
                      </div>
                    </>
                  );

                  return stat.path ? (
                    <Link key={idx} to={stat.path} className="header-stat-card clickable" style={{ textDecoration: 'none' }}>
                      {content}
                    </Link>
                  ) : (
                    <div key={idx} className="header-stat-card">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="nav-actions">
              {syncAction && (
                <button
                  onClick={syncAction.onSync}
                  className="btn-ghost"
                  style={{
                    padding: '8px 16px',
                    gap: '8px',
                    fontSize: '0.85rem',
                    opacity: 0.8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)'
                  }}
                  title="Sync Data"
                >
                  <RefreshCw size={16} className={syncAction.loading ? 'animate-spin' : ''} />
                  <span>Sync</span>
                </button>
              )}
              <div className="quick-create-wrapper">
                <button className="btn-quick-create" onClick={() => openDrawer('user')}>
                  <Plus size={18} />
                  <span>Quick Create</span>
                </button>
                <div className="quick-create-menu">
                  <div className="menu-content">
                    <button className="menu-item" onClick={() => openDrawer('user')}>
                      <UserPlus />
                      Add New User
                    </button>
                    <button className="menu-item" onClick={() => openDrawer('restaurant')}>
                      <FilePlus />
                      Add Restaurant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content animate-fade-in">
          <div className="content-container">
            <Routes>
              <Route path="/" element={<Dashboard setSyncAction={setSyncAction} />} />
              <Route path="/dashboard" element={<Dashboard setSyncAction={setSyncAction} />} />
              <Route path="/restaurants" element={<Restaurants openDrawer={openDrawer} setSyncAction={setSyncAction} />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail setHeaderData={setHeaderData} setSyncAction={setSyncAction} />} />
              <Route path="/users" element={<AdminPanel activeForm={activeForm} setActiveForm={setActiveForm} openDrawer={openDrawer} setSyncAction={setSyncAction} />} />
              <Route path="/users/:id" element={<UserDetail setHeaderData={setHeaderData} setSyncAction={setSyncAction} />} />
              {/* Fallback to Dashboard */}
              <Route path="*" element={<Dashboard setSyncAction={setSyncAction} />} />
            </Routes>
          </div>
        </main>

        <footer className="app-footer">
          <p>System Status: <span className="status-dot"></span> Operational • v1.0.4</p>
        </footer>
      </div>

      <QuickCreateDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        activeForm={activeForm}
        setActiveForm={setActiveForm}
        editingData={editingData}
        onRefresh={refreshCallback}
      />
    </div>
  )
}
