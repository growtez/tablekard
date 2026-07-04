import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import { AppLoadingSkeleton } from './components/ui/Skeleton'
import AdminPanel from './AdminPanel'
import Dashboard from './pages/Dashboard'
import Restaurants from './pages/Restaurants'
import RestaurantDetail from './pages/RestaurantDetail'
import UserDetail from './pages/UserDetail'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import Transactions from './pages/billing/Transactions'
import TransactionDetail from './pages/billing/TransactionDetail'
import Plans from './pages/billing/Plans'
import LandingLeads from './pages/LandingLeads'
// import Complaints from './pages/support/Complaints'
// import Reviews from './pages/support/Reviews'
// import Announcements from './pages/support/Announcements'
// import General from './pages/settings/General'
// import Integrations from './pages/settings/Integrations'
// import Security from './pages/settings/Security'
// import EmailTemplates from './pages/settings/Email'
import Sidebar from './components/Sidebar'
import QuickCreateDrawer from './components/QuickCreateDrawer'
import { Plus, UserPlus, FilePlus, ChevronLeft, Edit, Save, X, RefreshCw, Menu, LogOut } from 'lucide-react'
import { Badge } from './components/ui/Badge'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [activeForm, setActiveForm] = useState('user')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [refreshCallback, setRefreshCallback] = useState(null)
  const [headerData, setHeaderData] = useState(null)
  const [syncAction, setSyncAction] = useState(null)
  const [globalStats, setGlobalStats] = useState({
    restaurants: { total: 0, active: 0, recent: 0 },
    users: { total: 0, customers: 0, restAdmins: 0, restStaff: 0 },
    subscriptions: { total: 0 },
    subscriptions_summary: { total: 0, paid: 0, pending: 0, failed: 0 },
    transactions_summary: { total: 0, paid: 0, totalAmount: 0, refunded: 0 },
    revenue: { total: 0 }
  });

  const fetchGlobalStats = async () => {
    try {
      const [{ count: resCount }, { count: activeResCount }, { data: profiles }, { data: subPayments }, { data: allPayments }, { data: cashOrders }] = await Promise.all([
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('role'),
        supabase.from('subscription_payments').select('amount, status'),
        supabase.from('payments').select('amount, status, order_id'),
        supabase.from('orders').select('id, total, payment_status').in('payment_method', ['cash', 'card'])
      ]);
      const payments = subPayments || [];
      const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      const paymentsArr = allPayments || [];
      const onlineOrderIds = new Set(paymentsArr.map(p => p.order_id).filter(Boolean));
      const filteredCash = (cashOrders || []).filter(o => !onlineOrderIds.has(o.id));
      const txTotal = paymentsArr.length + filteredCash.length;
      const txPaid = paymentsArr.filter(p => p.status === 'paid' || p.status === 'completed').length + 
                   filteredCash.filter(o => o.payment_status === 'paid' || o.payment_status === 'completed').length;
      const txAmount = paymentsArr.filter(p => p.status === 'paid' || p.status === 'completed').reduce((s, p) => s + Number(p.amount || 0), 0) +
                     filteredCash.filter(o => o.payment_status === 'paid' || o.payment_status === 'completed').reduce((s, o) => s + Number(o.total || 0), 0);
      const txRefunded = paymentsArr.filter(p => p.status === 'refunded').length + 
                       filteredCash.filter(o => o.payment_status === 'refunded').length;

      setGlobalStats({
        restaurants: { total: resCount || 0, active: activeResCount || 0, recent: resCount > 0 ? 1 : 0 },
        users: {
          total: profiles?.length || 0,
          customers: profiles?.filter(p => p.role === 'customer').length || 0,
          restAdmins: profiles?.filter(p => p.role === 'restaurant_admin').length || 0,
          restStaff: profiles?.filter(p => p.role === 'restaurant_staff').length || 0
        },
        subscriptions: { total: payments.length },
        subscriptions_summary: {
          total: payments.length,
          paid: payments.filter(p => p.status === 'paid').length,
          pending: payments.filter(p => p.status === 'pending').length,
          failed: payments.filter(p => p.status === 'failed').length
        },
        transactions_summary: {
          total: txTotal,
          paid: txPaid,
          totalAmount: txAmount,
          refunded: txRefunded
        },
        revenue: { total: totalRevenue }
      });
    } catch (err) { console.error('App: Global stats fetch failed:', err); }
  };

  useEffect(() => { if (session && isAdmin) fetchGlobalStats(); }, [session, isAdmin]);

  useEffect(() => {
    if (!showProfileMenu) return;

    const handleClickOutside = (event) => {
      const trigger = document.getElementById('header-admin-menu-trigger');
      const menu = document.getElementById('header-admin-menu');
      if (trigger?.contains(event.target) || menu?.contains(event.target)) return;
      setShowProfileMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const openDrawer = (formType, data = null, onRefresh = null) => {
    setActiveForm(formType); setEditingData(data); setRefreshCallback(() => onRefresh); setIsDrawerOpen(true);
  }
  const closeDrawer = () => { setIsDrawerOpen(false); setEditingData(null); setRefreshCallback(null); }

  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  // Initialize theme
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
    setIsCheckingPermissions(true);
    setAuthError(null);
    const metaRole = session.user.app_metadata?.role || session.user.user_metadata?.role;
    try {
      if (metaRole && ['super_admin', 'restaurant_admin', 'admin'].includes(metaRole)) {
        setUserRole(metaRole + ' (metadata)'); setIsAdmin(true); return;
      }
      const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (error) { setAuthError(error.message); if (!metaRole) setIsAdmin(false); return; }
      setUserRole(data.role);
      // user_role enum: super_admin, restaurant_admin, restaurant_staff, customer
      setIsAdmin(['super_admin', 'restaurant_admin', 'admin', 'restaurant_owner'].includes(data.role));
    } catch (err) { 
      setAuthError(err.message); if (!metaRole) setIsAdmin(false); 
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const handleLogout = async () => {
    try {
      setSession(null); setIsAdmin(false); setUserRole(null); setAuthError(null);
      const theme = localStorage.getItem('theme');
      localStorage.clear(); sessionStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
      supabase.auth.signOut().catch(() => { });
      window.location.replace(window.location.origin);
    } catch (e) { window.location.href = '/'; }
  };

  if (loading) {
    return <AppLoadingSkeleton />
  }

  if (!session) return <Login />

  if (isCheckingPermissions && !isAdmin) {
    return <AppLoadingSkeleton />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="glass p-8 w-full max-w-md rounded-2xl text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-12 h-12 bg-accent-primary text-white rounded-xl mx-auto mb-4 flex items-center justify-center text-xl font-bold">!</div>
            <h1 className="text-2xl font-bold mb-1">Access Denied</h1>
            <p className="text-text-muted">Insufficient Permissions</p>
          </div>
          <div className="flex flex-col gap-2 mb-8 p-6 bg-red-500/5 border border-red-500/10 rounded-xl text-left">
            <div className="font-bold text-lg mb-2">Access Level Evaluation</div>
            <div className="flex justify-between w-full text-sm">
              <span className="text-text-muted">Detected Role:</span>
              <code className="text-accent-primary bg-surface-hover px-2 py-0.5 rounded">{userRole || 'NotFound/Unknown'}</code>
            </div>
            {authError && <div className="text-xs text-red-500 mt-1 bg-red-500/5 p-2 rounded-lg"><strong>Database Error:</strong> {authError}</div>}
            <div className="text-xs text-text-muted mt-2 border-t border-border pt-2">User ID: <span className="opacity-80">{session?.user?.id}</span></div>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => checkIsAdmin(session)} className="w-full bg-accent-primary hover:bg-accent-secondary text-white py-2.5 rounded-xl font-semibold transition-all">Refresh Permissions</button>
            <button onClick={handleLogout} className="w-full bg-surface-hover hover:bg-border text-text-main py-2.5 rounded-xl font-semibold transition-all">Sign Out & Try Another Account</button>
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
            { label: 'Total Restaurants', value: String(globalStats.restaurants.total || 0), path: '/restaurants', change: '+0%' },
            { label: 'Total Users', value: String(globalStats.users.total || 0), path: '/users', change: '+0%' },
            { label: 'Total Subscriptions', value: String(globalStats.subscriptions?.total || 0), path: '/subscriptions', change: '+0%' }, 
            { label: 'Platform Revenue', value: '₹' + (globalStats.revenue?.total?.toLocaleString() || '0'), path: '/subscriptions', change: '+0%' }
        ] 
    };
    if (path === '/restaurants') return { title: 'Restaurants', stats: [{ label: 'Total', value: String(globalStats.restaurants.total) }, { label: 'Active', value: String(globalStats.restaurants.active) }] };
    if (path === '/users') return { title: 'Users', stats: [{ label: 'Total', value: String(globalStats.users.total) }, { label: 'Admins', value: String(globalStats.users.restAdmins) }, { label: 'Staff', value: String(globalStats.users.restStaff) }] };
    if (path === '/subscriptions') return { 
        title: 'Subscriptions',
        stats: [
            { label: 'Total Records', value: String(globalStats.subscriptions_summary?.total || 0) },
            { label: 'Paid', value: String(globalStats.subscriptions_summary?.paid || 0) },
            { label: 'Pending', value: String(globalStats.subscriptions_summary?.pending || 0) },
            { label: 'Failed', value: String(globalStats.subscriptions_summary?.failed || 0) },
            { label: 'Total Collected', value: '₹' + (globalStats.revenue?.total?.toLocaleString() || '0') }
        ]
    };
    if (path === '/billing/transactions') return { 
        title: 'Transactions & Refunds',
        stats: [
            { label: 'Total Transactions', value: String(globalStats.transactions_summary?.total || 0) },
            { label: 'Successful', value: String(globalStats.transactions_summary?.paid || 0) },
            { label: 'Revenue Collected', value: '₹' + (globalStats.transactions_summary?.totalAmount?.toLocaleString() || '0') },
            { label: 'Refunded', value: String(globalStats.transactions_summary?.refunded || 0) }
        ]
    };
    if (path === '/leads') return { title: 'Landing Page Leads' };
    if (path === '/billing/plans') return { title: 'Pricing Plans' };
    // if (path === '/support/complaints') return { title: 'Complaints & Disputes' };
    // if (path === '/support/reviews') return { title: 'Reviews Moderation' };
    // if (path === '/support/announcements') return { title: 'Announcements' };
    // if (path === '/settings/general') return { title: 'General Settings' };
    // if (path === '/settings/integrations') return { title: 'Integrations & API' };
    // if (path === '/settings/security') return { title: 'Security & Backups' };
    // if (path === '/settings/email') return { title: 'Email Templates' };
    if (path.startsWith('/restaurants/')) return { title: '', isBreadcrumb: true, backTitle: 'Restaurants', backPath: '/restaurants' };
    if (path.startsWith('/users/')) return { title: '', isBreadcrumb: true, backTitle: 'Users', backPath: '/users' };
    if (path.startsWith('/subscriptions/')) return { title: '', isBreadcrumb: true, backTitle: 'Subscriptions', backPath: '/subscriptions' };
    if (path.startsWith('/billing/transactions/')) return { title: '', isBreadcrumb: true, backTitle: 'Transactions', backPath: '/billing/transactions' };
    return { title: 'Command Center' };
  };

  const { title, stats, isBreadcrumb, backTitle, backPath } = getPageTitle();

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />}

      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        session={session}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-[52px]' : 'md:ml-[180px]'}`}>
        <header className="sticky top-0 z-30 h-14 md:h-14 flex items-center border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile hamburger */}
              <button className="md:hidden p-2 rounded-lg bg-surface-hover text-text-muted hover:text-text-main hover:bg-border transition-colors" onClick={() => setMobileSidebarOpen(true)} title="Open menu">
                <Menu size={20} />
              </button>

              {headerData ? (
                <div className="flex items-center gap-1.5 md:gap-2 animate-fade-in text-[12px] md:text-[13px] font-medium text-text-muted">
                  {headerData.backPath && (
                    <>
                      <Link to={headerData.backPath} className="hover:text-accent-primary hover:underline transition-colors cursor-pointer" onClick={() => setHeaderData(null)}>
                        {headerData.backTitle ? headerData.backTitle.replace('Back to ', '') : 'Back'}
                      </Link>
                      <span className="opacity-40 font-normal text-[10px] md:text-xs">/</span>
                    </>
                  )}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-text-main font-medium line-clamp-1">{headerData.name}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 md:ml-4">
                    {headerData.isEditing ? (
                      <>
                        <button onClick={headerData.onSave} className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold rounded-lg bg-accent-primary text-white hover:bg-accent-secondary transition-colors" disabled={headerData.saving}>
                          {headerData.saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} <span className="hidden md:inline">{headerData.saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                        <button onClick={headerData.onCancel} className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold rounded-lg bg-surface-hover text-text-main border border-border hover:bg-border transition-colors" disabled={headerData.saving}>
                          <X size={16} /> <span className="hidden md:inline">Cancel</span>
                        </button>
                      </>
                    ) : headerData.onEdit && (
                      <button onClick={headerData.onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 transition-colors">
                        <Edit size={14} /> <span className="hidden sm:inline">{headerData.editLabel || 'Edit'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : isBreadcrumb ? (
                <div className="flex items-center gap-1.5 md:gap-2 animate-fade-in text-[12px] md:text-[13px] font-medium text-text-muted">
                  <Link to={backPath} className="hover:text-accent-primary hover:underline transition-colors cursor-pointer">
                    {backTitle}
                  </Link>
                  <span className="opacity-40 font-normal text-[10px] md:text-xs">/</span>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className={`text-text-main font-medium line-clamp-1 ${!location.state?.name && 'opacity-50'}`}>
                      {location.state?.name || 'Loading...'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-[12px] md:text-[13px] font-medium text-text-main">{title}</span>
                </div>
              )}
            </div>

            {!headerData && stats && (
              <div className="hidden lg:flex items-center gap-10 mx-auto">
                {stats.map((stat, idx) => {
                  const content = (
                    <>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider -mb-1">{stat.label}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-text-main">{stat.value}</span>
                      </div>
                    </>
                  );
                  return stat.path ? (
                    <Link key={idx} to={stat.path} className="flex flex-col hover:-translate-y-0.5 transition-transform group cursor-pointer">{content}</Link>
                  ) : (
                    <div key={idx} className="flex flex-col">{content}</div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 md:gap-6">
              {syncAction && (
                <button onClick={() => { syncAction.onSync?.(); fetchGlobalStats(); }} className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-surface-hover border border-border text-text-main hover:bg-border transition-colors" title="Sync Data">
                  <RefreshCw size={16} className={syncAction.loading ? 'animate-spin' : ''} />
                </button>
              )}
              <div className="relative group">
                <button className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg shadow-[0_2px_6px_rgba(5,150,105,0.2)] hover:shadow-[0_4px_12px_rgba(5,150,105,0.4)] transition-all hover:-translate-y-0.5" onClick={() => openDrawer('restaurant')} title="Quick Create">
                  <Plus size={18} />
                </button>
                <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all z-50">
                  <div className="bg-surface border border-border rounded-xl shadow-md min-w-[180px] flex flex-col overflow-hidden">
                    <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted hover:text-accent-primary hover:bg-surface-hover hover:pl-5 transition-all text-left w-full" onClick={() => openDrawer('restaurant')}><FilePlus size={16}/> Add Restaurant</button>
                    <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted hover:text-accent-primary hover:bg-surface-hover hover:pl-5 transition-all text-left w-full" onClick={() => openDrawer('user')}><UserPlus size={16}/> Add New User</button>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <button
                  id="header-admin-menu-trigger"
                  className="w-9 h-9 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center font-bold text-sm border border-accent-primary/15 hover:bg-accent-primary/20 transition-colors"
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  title="Admin menu"
                >
                  {session?.user?.email?.[0]?.toUpperCase() || 'A'}
                </button>
                <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all z-50">
                  <div id="header-admin-menu" className="w-48 rounded-xl border border-border bg-surface shadow-xl p-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] text-text-main font-semibold truncate block w-full">{session?.user?.email}</span>
                      <span className="text-[10px] text-text-muted">Super Admin</span>
                    </div>
                    <button
                      className="mt-3 flex items-center gap-2 px-2.5 py-2 w-full bg-transparent border-none rounded-lg text-text-muted text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 animate-fade-in relative z-10">
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-3 pb-6">
            <Routes>
              <Route path="/" element={<Dashboard setSyncAction={setSyncAction} />} />
              <Route path="/dashboard" element={<Dashboard setSyncAction={setSyncAction} />} />
              <Route path="/restaurants" element={<Restaurants openDrawer={openDrawer} setSyncAction={setSyncAction} />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail setHeaderData={setHeaderData} setSyncAction={setSyncAction} />} />
              <Route path="/users" element={<AdminPanel activeForm={activeForm} setActiveForm={setActiveForm} openDrawer={openDrawer} setSyncAction={setSyncAction} />} />
              <Route path="/users/:id" element={<UserDetail setHeaderData={setHeaderData} setSyncAction={setSyncAction} />} />
              <Route path="/leads" element={<LandingLeads />} />
              {/* Billing */}
              <Route path="/subscriptions" element={<Subscriptions setSyncAction={setSyncAction} />} />
              <Route path="/subscriptions/:id" element={<SubscriptionDetail setHeaderData={setHeaderData} />} />
              <Route path="/billing/transactions/:source/:id" element={<TransactionDetail setHeaderData={setHeaderData} />} />
              <Route path="/billing/transactions" element={<Transactions setSyncAction={setSyncAction} />} />
              <Route path="/billing/plans" element={<Plans setSyncAction={setSyncAction} setHeaderData={setHeaderData} />} />
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
