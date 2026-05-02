import React, { useState, useEffect, lazy, Suspense } from "react";
import { Smartphone } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, NavLink } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { RestaurantProvider } from "./context/RestaurantContext";

// Lazy load pages for faster initial startup
const HomePage = lazy(() => import("./pages/home"));
const MenuPage = lazy(() => import("./pages/menu"));
const MyOrdersPage = lazy(() => import("./pages/my_order"));
const ProfilePage = lazy(() => import("./pages/profile"));
const SettingsPage = lazy(() => import("./pages/settings"));
const SearchPage = lazy(() => import("./pages/search"));
const LikesPage = lazy(() => import("./pages/likes"));
const MostPopularPage = lazy(() => import("./pages/popular"));
const RecentOrdersPage = lazy(() => import("./pages/recent"));
const DiscountsPage = lazy(() => import("./pages/discounts"));
const OnboardingPage = lazy(() => import("./pages/onboarding"));
const LoginPage = lazy(() => import("./pages/login"));
const LiveQueuePage = lazy(() => import("./pages/live_queue"));
const FeedbackPage = lazy(() => import("./pages/feedback"));
const OrderHistoryPage = lazy(() => import("./pages/order_history"));
const AboutPage = lazy(() => import("./pages/about"));
const TestWebhookPage = lazy(() => import("./pages/test_webhook"));

import "./App.css";

// ── Skeleton loader ────────────────────────────────────────────────────────────
// Preserves the bottom nav so the selected icon stays visible while the lazy
// page chunk is downloading / while auth is resolving.
// This also means no jarring full-screen spinner that obscures navigation.
const SHIMMER_CSS = `
  @keyframes _sk_shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .sk-pulse {
    background: linear-gradient(90deg, #FFF0EC 25%, #FFD6C9 50%, #FFF0EC 75%);
    background-size: 200% 100%;
    animation: _sk_shimmer 1.5s infinite;
    border-radius: 8px;
  }
  .sk-nav-btn {
    display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 12px;
    text-decoration: none; font-size: 20px;
    transition: background 0.2s;
  }
  .sk-nav-btn.active { background: rgba(139,58,30,0.12); }
`;

function PageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', paddingBottom: 70 }}>
      <style>{SHIMMER_CSS}</style>

      {/* Header skeleton */}
      <div style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #f5ede9'
      }}>
        <div className="sk-pulse" style={{ width: 42, height: 42, borderRadius: 12 }} />
        <div className="sk-pulse" style={{ width: 120, height: 22 }} />
        <div className="sk-pulse" style={{ width: 42, height: 42, borderRadius: 12 }} />
      </div>

      {/* Hero banner skeleton */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="sk-pulse" style={{ height: 140, borderRadius: 20 }} />
      </div>

      {/* List-card skeletons */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: 16,
            background: '#FFF7F3', borderRadius: 16, border: '1.5px solid #F0F0F0'
          }}>
            <div className="sk-pulse" style={{ width: 90, height: 90, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="sk-pulse" style={{ height: 18, width: '75%' }} />
              <div className="sk-pulse" style={{ height: 13, width: '100%' }} />
              <div className="sk-pulse" style={{ height: 13, width: '55%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <div className="sk-pulse" style={{ height: 20, width: 50 }} />
                <div className="sk-pulse" style={{ height: 32, width: 80, borderRadius: 20 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav — always rendered so the correct icon is highlighted */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        background: '#FFF7F3', borderTop: '1.5px solid #F0F0F0',
        boxShadow: '0 -4px 20px rgba(139,58,30,0.06)', zIndex: 1000
      }}>
        {[
          { to: '/',        icon: '🏠' },
          { to: '/menu',    icon: '🛍️' },
          { to: '/orders',  icon: '🛒' },
          { to: '/profile', icon: '👤' },
        ].map(({ to, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sk-nav-btn${isActive ? ' active' : ''}`}
          >
            {icon}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// ── Auth guard ─────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // While auth is resolving, show skeleton (with nav visible) instead of blank screen
  if (loading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <RestaurantProvider>
      <Routes>
        {/* QR Code Entry Route – captures restaurantId and tableId */}
        <Route path="/order/:restaurantId/:tableId" element={<MenuPage />} />

        {/* Public Customer Routes */}
        <Route path="/"           element={<HomePage />} />
        <Route path="/menu"       element={<MenuPage />} />
        <Route path="/orders"     element={<MyOrdersPage />} />
        <Route path="/search"     element={<SearchPage />} />
        <Route path="/popular"    element={<MostPopularPage />} />
        <Route path="/discounts"  element={<DiscountsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/about"      element={<AboutPage />} />

        {/* Protected Customer Routes */}
        <Route path="/profile"       element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/settings"      element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/likes"         element={<RequireAuth><LikesPage /></RequireAuth>} />
        <Route path="/recent"        element={<RequireAuth><RecentOrdersPage /></RequireAuth>} />
        <Route path="/live-queue"    element={<RequireAuth><LiveQueuePage /></RequireAuth>} />
        <Route path="/feedback"      element={<RequireAuth><FeedbackPage /></RequireAuth>} />
        <Route path="/feedback/:orderId" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
        <Route path="/order-history" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />

        {/* Developer Demo Route */}
        <Route path="/test-webhook" element={<TestWebhookPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RestaurantProvider>
  );
}

// ── Desktop guard ─────────────────────────────────────────────────────────────
function MobileOnlyWrapper({ children }) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  if (isDesktop) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#212121', color: '#FFFFFF',
        padding: '2rem', textAlign: 'center'
      }}>
        <Smartphone size={80} color="#d9b550" style={{ marginBottom: '1.5rem', strokeWidth: 1.5 }} />
        <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 'bold', color: '#d9b550' }}>
          Mobile Only
        </h2>
        <p style={{ color: '#CCCCCC', fontSize: '1rem' }}>
          Please open this app on your phone for the correct experience.
        </p>
      </div>
    );
  }

  return children;
}

// ── App root ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider>
          <Router>
            <MobileOnlyWrapper>
              <div className="App">
                {/*
                  Suspense fallback uses PageSkeleton which:
                  1. Shows animated shimmer content (not a spinner)
                  2. Keeps the bottom nav visible so the selected icon is immediately highlighted
                  3. Prevents the "selected icon but wrong page content" visual bug
                */}
                <Suspense fallback={<PageSkeleton />}>
                  <AppRoutes />
                </Suspense>
              </div>
            </MobileOnlyWrapper>
          </Router>
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
