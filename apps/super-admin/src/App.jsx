import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import AdminPanel from './AdminPanel'
import Dashboard from './pages/Dashboard'
import Sidebar from './components/Sidebar'
import QuickCreateDrawer from './components/QuickCreateDrawer'
import { Plus, UserPlus, FilePlus } from 'lucide-react'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeForm, setActiveForm] = useState('user')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
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

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} />

      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="top-nav">
          <div className="nav-container">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="btn-ghost"
                style={{ padding: '8px', minWidth: 'auto', border: 'none' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Command Center</h2>
            </div>

            <div className="nav-actions">
              <div className="user-profile">
                <div className="profile-img">
                  {session.user.email[0].toUpperCase()}
                </div>
                <div className="profile-details">
                  <span className="profile-email">{session.user.email}</span>
                  <span className="profile-role">Super Admin</span>
                </div>
              </div>

              <button onClick={handleLogout} className="logout-button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Logout
              </button>

              <div className="quick-create-wrapper">
                <button className="btn-quick-create" onClick={() => setIsDrawerOpen(true)}>
                  <Plus size={18} />
                  <span>Quick Create</span>
                </button>
                <div className="quick-create-menu">
                  <div className="menu-content">
                    <button className="menu-item" onClick={() => { setActiveForm('user'); setIsDrawerOpen(true); }}>
                      <UserPlus />
                      Add New User
                    </button>
                    <button className="menu-item" onClick={() => { setActiveForm('restaurant'); setIsDrawerOpen(true); }}>
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<AdminPanel activeForm={activeForm} setActiveForm={setActiveForm} />} />
              <Route path="/users" element={<AdminPanel activeForm={activeForm} setActiveForm={setActiveForm} />} />
              {/* Fallback to Dashboard */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </main>

        <footer className="app-footer">
          <p>System Status: <span className="status-dot"></span> Operational • v1.0.4</p>
        </footer>
      </div>

      <QuickCreateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeForm={activeForm}
        setActiveForm={setActiveForm}
      />
    </div>
  )
}
