import React, { useState, useEffect, lazy, Suspense } from "react";
import { Smartphone, Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import {
  BrowserRouter as Router,
  Routes, Route, Navigate,
  useLocation, NavLink
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { RestaurantProvider } from "./context/RestaurantContext";

import "./App.css";

// ─── Scroll-to-top on every route change ─────────────────────────────────────
// React Router does not reset scroll position on navigation.
// This component listens to pathname changes and snaps the page to the top.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Reset both window and any scrollable document element
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const HomePage        = lazy(() => import("./pages/home"));
const MenuPage        = lazy(() => import("./pages/menu"));
const MyOrdersPage    = lazy(() => import("./pages/my_order"));
const ProfilePage     = lazy(() => import("./pages/profile"));
const SettingsPage    = lazy(() => import("./pages/settings"));
const SearchPage      = lazy(() => import("./pages/search"));
const LikesPage       = lazy(() => import("./pages/likes"));
const MostPopularPage = lazy(() => import("./pages/popular"));
const RecentOrdersPage= lazy(() => import("./pages/recent"));
const DiscountsPage   = lazy(() => import("./pages/discounts"));
const OnboardingPage  = lazy(() => import("./pages/onboarding"));
const LoginPage       = lazy(() => import("./pages/login"));
const LiveQueuePage   = lazy(() => import("./pages/live_queue"));
const FeedbackPage    = lazy(() => import("./pages/feedback"));
const OrderHistoryPage= lazy(() => import("./pages/order_history"));
const AboutPage       = lazy(() => import("./pages/about"));
const TestWebhookPage = lazy(() => import("./pages/test_webhook"));

// ─── Skeleton shimmer CSS (injected once) ─────────────────────────────────────
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
  .sk-nav-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    text-decoration: none;
    color: #9C8F8A;
    transition: background 0.15s, color 0.15s;
  }
  .sk-nav-link.active {
    background: rgba(139, 58, 30, 0.10);
    color: #8B3A1E;
  }
`;

// ─── Nav items shared between skeleton and real pages ────────────────────────
const NAV_ITEMS = [
  { to: "/",        Icon: Home,          label: "Home"    },
  { to: "/menu",    Icon: ShoppingBag,   label: "Menu"    },
  { to: "/orders",  Icon: ShoppingCart,  label: "Orders"  },
  { to: "/profile", Icon: User,          label: "Profile" },
];

// ─── Skeleton bottom nav (real Lucide icons, not emojis) ─────────────────────
function SkeletonBottomNav() {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      background: "#FFF7F3",
      borderTop: "1.5px solid #F0F0F0",
      boxShadow: "0 -4px 20px rgba(139,58,30,0.06)",
      zIndex: 1000,
    }}>
      {NAV_ITEMS.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `sk-nav-link${isActive ? " active" : ""}`}
          aria-label={label}
        >
          <Icon size={22} strokeWidth={1.8} />
        </NavLink>
      ))}
    </nav>
  );
}

// ─── Full-page skeleton ───────────────────────────────────────────────────────
// Shows immediately when a lazy chunk is loading or auth is resolving.
// Keeps the correct bottom-nav icon highlighted so there is zero visual lag.
function PageSkeleton() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      paddingBottom: 70,
    }}>
      <style>{SHIMMER_CSS}</style>

      {/* Header */}
      <div style={{
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #f5ede9",
      }}>
        <div className="sk-pulse" style={{ width: 42, height: 42, borderRadius: 12 }} />
        <div className="sk-pulse" style={{ width: 120, height: 22 }} />
        <div className="sk-pulse" style={{ width: 42, height: 42, borderRadius: 12 }} />
      </div>

      {/* Hero banner */}
      <div style={{ padding: "20px 20px 0" }}>
        <div className="sk-pulse" style={{ height: 140, borderRadius: 20 }} />
      </div>

      {/* Section label */}
      <div style={{ padding: "20px 20px 8px" }}>
        <div className="sk-pulse" style={{ width: 130, height: 18 }} />
      </div>

      {/* Card list */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            display: "flex", gap: 14, padding: 16,
            background: "#FFF7F3", borderRadius: 16, border: "1.5px solid #F0F0F0",
          }}>
            <div className="sk-pulse" style={{ width: 90, height: 90, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="sk-pulse" style={{ height: 18, width: "75%" }} />
              <div className="sk-pulse" style={{ height: 13, width: "100%" }} />
              <div className="sk-pulse" style={{ height: 13, width: "55%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <div className="sk-pulse" style={{ height: 20, width: 50 }} />
                <div className="sk-pulse" style={{ height: 32, width: 80, borderRadius: 20 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real icon bottom nav */}
      <SkeletonBottomNav />
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSkeleton />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

// ─── Routes (Suspense keyed to pathname) ──────────────────────────────────────
// KEY FIX: By placing <Suspense> inside AppRoutes and giving it key={location.pathname},
// React immediately unmounts the old page and shows the skeleton the moment you
// tap a nav icon — no pause/freeze on the previous page.
function AppRoutes() {
  const location = useLocation();

  return (
    <RestaurantProvider>
      {/*
        key={location.pathname} resets this Suspense boundary on every route change.
        Result: the skeleton appears instantly when navigating, not after a delay.
      */}
      <Suspense key={location.pathname} fallback={<PageSkeleton />}>
        <Routes location={location}>
          {/* QR Entry */}
          <Route path="/order/:restaurantId/:tableId" element={<MenuPage />} />

          {/* Public */}
          <Route path="/"           element={<HomePage />} />
          <Route path="/menu"       element={<MenuPage />} />
          <Route path="/orders"     element={<MyOrdersPage />} />
          <Route path="/search"     element={<SearchPage />} />
          <Route path="/popular"    element={<MostPopularPage />} />
          <Route path="/discounts"  element={<DiscountsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/about"      element={<AboutPage />} />

          {/* Protected */}
          <Route path="/profile"       element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/settings"      element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/likes"         element={<RequireAuth><LikesPage /></RequireAuth>} />
          <Route path="/recent"        element={<RequireAuth><RecentOrdersPage /></RequireAuth>} />
          <Route path="/live-queue"    element={<RequireAuth><LiveQueuePage /></RequireAuth>} />
          <Route path="/feedback"      element={<RequireAuth><FeedbackPage /></RequireAuth>} />
          <Route path="/feedback/:orderId" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
          <Route path="/order-history" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />

          {/* Dev */}
          <Route path="/test-webhook" element={<TestWebhookPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RestaurantProvider>
  );
}

// ─── Desktop guard ────────────────────────────────────────────────────────────
function MobileOnlyWrapper({ children }) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  if (isDesktop) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#212121", color: "#fff",
        padding: "2rem", textAlign: "center",
      }}>
        <Smartphone size={80} color="#d9b550" style={{ marginBottom: "1.5rem", strokeWidth: 1.5 }} />
        <h2 style={{ marginBottom: "1rem", fontSize: "1.8rem", fontWeight: "bold", color: "#d9b550" }}>
          Mobile Only
        </h2>
        <p style={{ color: "#CCCCCC", fontSize: "1rem" }}>
          Please open this app on your phone for the correct experience.
        </p>
      </div>
    );
  }

  return children;
}

// ─── App root ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider>
          <Router>
            <ScrollToTop />
            <MobileOnlyWrapper>
              <div className="App">
                <AppRoutes />
              </div>
            </MobileOnlyWrapper>
          </Router>
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
