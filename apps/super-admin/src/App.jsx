import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import AdminPanel from './AdminPanel'
import Dashboard from './pages/Dashboard'
import Restaurants from './pages/Restaurants'
import RestaurantDetail from './pages/RestaurantDetail'
import UserDetail from './pages/UserDetail'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import Transactions from './pages/billing/Transactions'
import Plans from './pages/billing/Plans'
// import Complaints from './pages/support/Complaints'
// import Reviews from './pages/support/Reviews'
// import Announcements from './pages/support/Announcements'
// import General from './pages/settings/General'
// import Integrations from './pages/settings/Integrations'
// import Security from './pages/settings/Security'
// import EmailTemplates from './pages/settings/Email'
import Sidebar from './components/Sidebar'
import QuickCreateDrawer from './components/QuickCreateDrawer'
import { Plus, UserPlus, FilePlus, ChevronLeft, Edit, Save, X, RefreshCw, Menu } from 'lucide-react'
import { Badge } from './components/ui/Badge'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeForm, setActiveForm] = useState('user')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [refreshCallback, setRefreshCallback] = useState(null)
  const [headerData, setHeaderData] = useState(null)
  const [syncAction, setSyncAction] = useState(null)
  const [globalStats, setGlobalStats] = useState({
    restaurants: { total: 0, active: 0, recent: 0 },
    users: { total: 0, customers: 0, restAdmins: 0, restStaff: 0 }
  });

  const fetchGlobalStats = async () => {
    try {
      const [{ count: resCount }, { count: activeResCount }, { data: profiles }] = await Promise.all([
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('role')
      ]);
      setGlobalStats({
        restaurants: { total: resCount || 0, active: activeResCount || 0, recent: resCount > 0 ? 1 : 0 },
        users: {
          total: profiles?.length || 0,
          customers: profiles?.filter(p => p.role === 'customer').length || 0,
          restAdmins: profiles?.filter(p => p.role === 'restaurant_admin').length || 0,
          restStaff: profiles?.filter(p => p.role === 'restaurant_staff').length || 0
        }
      });
    } catch (err) { console.error('App: Global stats fetch failed:', err); }
  };

  useEffect(() => { if (session && isAdmin) fetchGlobalStats(); }, [session, isAdmin]);

  const openDrawer = (formType, data = null, onRefresh = null) => {
    setActiveForm(formType); setEditingData(data); setRefreshCallback(() => onRefresh); setIsDrawerOpen(true);
  }
  const closeDrawer = () => { setIsDrawerOpen(false); setEditingData(null); setRefreshCallback(null); }

  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    let active = true;
    const globalTimeout = setTimeout(() => { if (active && loading) { setLoading(false); } }, 6000);

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        setSession(session);
        if (session) await checkIsAdmin(session);
      } catch (err) { console.error('App: Initialization error:', err); }
      finally { if (active) { setLoading(false); clearTimeout(globalTimeout); } }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSession(session);
      if (session) { checkIsAdmin(session); } else { setIsAdmin(false); setUserRole(null); }
    });

    return () => { active = false; subscription?.unsubscribe(); clearTimeout(globalTimeout); };
  }, []);

  const checkIsAdmin = async (session) => {
    if (!session?.user) return;
    setAuthError(null);
    const metaRole = session.user.app_metadata?.role || session.user.user_metadata?.role;
    if (metaRole && ['super_admin', 'restaurant_admin', 'admin'].includes(metaRole)) {
      setUserRole(metaRole + ' (metadata)'); setIsAdmin(true); return;
    }
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (error) { setAuthError(error.message); if (!metaRole) setIsAdmin(false); return; }
      setUserRole(data.role);
      // user_role enum: super_admin, restaurant_admin, restaurant_staff, customer
      setIsAdmin(['super_admin', 'restaurant_admin', 'admin', 'restaurant_owner'].includes(data.role));
    } catch (err) { setAuthError(err.message); if (!metaRole) setIsAdmin(false); }
  };

  const handleLogout = async () => {
    try {
      setSession(null); setIsAdmin(false); setUserRole(null); setAuthError(null);
      localStorage.clear(); sessionStorage.clear();
      supabase.auth.signOut().catch(() => { });
      window.location.replace(window.location.origin);
    } catch (e) { window.location.href = '/'; }
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="flex column items-center gap-4">
          <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
          <p style={{ color: 'var(--accent-primary)', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Initializing Session...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login />

  if (!isAdmin) {
    return (
      <div className="login-page">
        <div className="login-card animate-fade-in" style={{ textAlign: 'center' }}>
          <div className="login-header">
            <div className="logo-icon" style={{ margin: '0 auto 1.5rem' }}>!</div>
            <h1>Access Denied</h1><p>Insufficient Permissions</p>
          </div>
          <div className="error-alert-modern" style={{ flexDirection: 'column', gap: '8px', marginBottom: '2rem', padding: '1.5rem' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Access Level Evaluation</div>
            <div className="flex justify-between w-full" style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Detected Role:</span>
              <code style={{ color: 'var(--accent-primary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{userRole || 'NotFound/Unknown'}</code>
            </div>
            {authError && <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '4px', textAlign: 'left', background: 'rgba(255,0,0,0.05)', padding: '8px', borderRadius: '8px' }}><strong>Database Error:</strong> {authError}</div>}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>User ID: <span style={{ opacity: 0.8 }}>{session?.user?.id}</span></div>
          </div>
          <div className="flex column gap-3" style={{ width: '100%' }}>
            <button onClick={() => checkIsAdmin(session)} className="primary" style={{ width: '100%' }}>Refresh Permissions</button>
            <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}>Sign Out & Try Another Account</button>
          </div>
        </div>
      </div>
    )
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return { title: 'Dashboard', stats: [{ label: 'Total Restaurants', value: String(globalStats.restaurants.total), path: '/restaurants' }, { label: 'Total Users', value: String(globalStats.users.total), path: '/users' }] };
    if (path === '/restaurants') return { title: 'Restaurants', stats: [{ label: 'Total', value: String(globalStats.restaurants.total) }, { label: 'Active', value: String(globalStats.restaurants.active) }] };
    if (path === '/users') return { title: 'Users', stats: [{ label: 'Total', value: String(globalStats.users.total) }, { label: 'Admins', value: String(globalStats.users.restAdmins) }, { label: 'Staff', value: String(globalStats.users.restStaff) }] };
    if (path === '/subscriptions') return { title: 'Subscriptions' };
    if (path === '/billing/transactions') return { title: 'Transactions & Refunds' };
    if (path === '/billing/plans') return { title: 'Pricing Plans' };
    // if (path === '/support/complaints') return { title: 'Complaints & Disputes' };
    // if (path === '/support/reviews') return { title: 'Reviews Moderation' };
    // if (path === '/support/announcements') return { title: 'Announcements' };
    // if (path === '/settings/general') return { title: 'General Settings' };
    // if (path === '/settings/integrations') return { title: 'Integrations & API' };
    // if (path === '/settings/security') return { title: 'Security & Backups' };
    // if (path === '/settings/email') return { title: 'Email Templates' };
    return { title: 'Command Center' };
  };

  const { title, stats } = getPageTitle();

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />}

      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        session={session}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="top-nav">
          <div className="nav-container">
            <div className="flex items-center gap-4">
              {/* Mobile hamburger */}
              <button className="mobile-hamburger" onClick={() => setMobileSidebarOpen(true)} title="Open menu">
                <Menu size={20} />
              </button>

              {headerData ? (
                <div className="flex items-center gap-4 animate-fade-in">
                  <Link to={headerData.backPath || '/restaurants'} className="btn-back-nav-icon" title={headerData.backTitle || 'Back'} onClick={() => setHeaderData(null)}>
                    <ChevronLeft size={20} />
                  </Link>
                  <div className="h-6 w-[1px] bg-white/10 mx-1" />
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
                    {headerData.isEditing ? (
                      <>
                        <button onClick={headerData.onSave} className="btn-save" disabled={headerData.saving} style={{ padding: '6px 16px', gap: '8px', fontSize: '0.85rem' }}>
                          {headerData.saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Save
                        </button>
                        <button onClick={headerData.onCancel} className="btn-cancel" disabled={headerData.saving} style={{ padding: '6px 16px', gap: '8px', fontSize: '0.85rem' }}>
                          <X size={16} /> Cancel
                        </button>
                      </>
                    ) : headerData.onEdit && (
                      <button onClick={headerData.onEdit} className="btn-ghost" style={{ padding: '6px 12px', gap: '6px', fontSize: '0.8rem', opacity: 0.8 }}>
                        <Edit size={14} /> Edit
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
                    <Link key={idx} to={stat.path} className="header-stat-card clickable" style={{ textDecoration: 'none' }}>{content}</Link>
                  ) : (
                    <div key={idx} className="header-stat-card">{content}</div>
                  );
                })}
              </div>
            )}

            <div className="nav-actions">
              {syncAction && (
                <button onClick={() => { syncAction.onSync?.(); fetchGlobalStats(); }} className="btn-ghost"
                  style={{ padding: '8px 16px', gap: '8px', fontSize: '0.85rem', opacity: 0.8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                  <RefreshCw size={16} className={syncAction.loading ? 'animate-spin' : ''} />
                  <span className="sync-label">Sync</span>
                </button>
              )}
              <div className="quick-create-wrapper">
                <button className="btn-quick-create" onClick={() => openDrawer('user')}>
                  <Plus size={18} /> <span>Quick Create</span>
                </button>
                <div className="quick-create-menu">
                  <div className="menu-content">
                    <button className="menu-item" onClick={() => openDrawer('user')}><UserPlus /> Add New User</button>
                    <button className="menu-item" onClick={() => openDrawer('restaurant')}><FilePlus /> Add Restaurant</button>
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
              {/* Billing */}
              <Route path="/subscriptions" element={<Subscriptions setSyncAction={setSyncAction} />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
              <Route path="/billing/transactions" element={<Transactions setSyncAction={setSyncAction} />} />
              <Route path="/billing/plans" element={<Plans />} />
              {/* Support */}
              {/* <Route path="/support/complaints" element={<Complaints setSyncAction={setSyncAction} />} />
              <Route path="/support/reviews" element={<Reviews setSyncAction={setSyncAction} />} />
              <Route path="/support/announcements" element={<Announcements setSyncAction={setSyncAction} />} /> */}
              {/* Settings */}
              {/* <Route path="/settings/general" element={<General setSyncAction={setSyncAction} />} />
              <Route path="/settings/integrations" element={<Integrations setSyncAction={setSyncAction} />} />
              <Route path="/settings/security" element={<Security setSyncAction={setSyncAction} />} />
              <Route path="/settings/email" element={<EmailTemplates setSyncAction={setSyncAction} />} /> */}
              {/* Fallback */}
              <Route path="*" element={<Dashboard setSyncAction={setSyncAction} />} />
            </Routes>
          </div>
        </main>

        <footer className="app-footer">
          <p>System Status: <span className="status-dot" /> Operational • v1.1.0</p>
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
