import React, { useState, useEffect, lazy, Suspense } from "react";
import { Smartphone, Home, ShoppingBag, ShoppingCart, User, MapPinOff, AlertCircle } from "lucide-react";
import {
  Routes, Route, Navigate,
  useLocation, NavLink
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useRestaurant } from "./context/RestaurantContext";
import PageSkeleton from "./components/PageSkeleton";
import FloatingQueueButton from "./components/FloatingQueueButton";
import { showHomeLoader, hideHomeLoader } from "./utils/loader";

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
const DiscountsPage   = lazy(() => import("./pages/discounts"));
const OnboardingPage  = lazy(() => import("./pages/onboarding"));
const LoginPage       = lazy(() => import("./pages/login"));
const LiveQueuePage   = lazy(() => import("./pages/live_queue"));
const FeedbackPage    = lazy(() => import("./pages/feedback"));
const OrderHistoryPage= lazy(() => import("./pages/order_history"));
const AboutPage       = lazy(() => import("./pages/about"));
const TestWebhookPage = lazy(() => import("./pages/test_webhook"));
const ARViewerPage    = lazy(() => import("./pages/ar_viewer"));


const ScanQRPage    = lazy(() => import("./pages/scan_qr"));

// ─── Home Loader ───────────────────────────────────────────────────────────────
const HomeLoading = () => {
  const isFirstLoad = !sessionStorage.getItem('homeAnimationShown');

  useEffect(() => {
    if (isFirstLoad) {
      showHomeLoader();
      // We'll let HomePage set the session storage flag once it fully loads
      // or set it here if we want to be sure it only happens once.
    }
    return () => {
      if (isFirstLoad) hideHomeLoader();
    };
  }, [isFirstLoad]);

  return isFirstLoad ? null : <PageSkeleton />;
};

// ─── Auth guard ───────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return location.pathname === '/' ? <HomeLoading /> : <PageSkeleton />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

// ─── Restaurant guard ─────────────────────────────────────────────────────────
function RequireRestaurant({ children }) {
  const { restaurantId, restaurantLoading, geofenceStatus, distance, allowedRadius, checkGeofence } = useRestaurant();
  const location = useLocation();
  
  if (restaurantLoading) return location.pathname === '/' ? <HomeLoading /> : <PageSkeleton />;
  
  if (!restaurantId) {
    return <ScanQRPage />;
  }

  if (geofenceStatus === 'checking') {
    return location.pathname === '/' ? <HomeLoading /> : <PageSkeleton />;
  }

  if (geofenceStatus === 'outside') {
    return (
      <div className="geofence-blocked-screen">
        <div className="geofence-blocked-card">
          <div className="blocked-icon-wrapper">
            <MapPinOff size={48} color="#8B3A1E" />
          </div>
          <h2>You are outside the restaurant</h2>
          <p>
            To view the menu or place an order, you must be physically present at the restaurant. 
            
          </p>
          <button className="geofence-retry-btn-large" onClick={checkGeofence}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (geofenceStatus === 'error') {
    return (
      <div className="geofence-blocked-screen">
        <div className="geofence-blocked-card">
          <div className="blocked-icon-wrapper">
            <AlertCircle size={48} color="#8B3A1E" />
          </div>
          <h2>Location Access Required</h2>
          <p>
            This app requires location access to verify you are present at the restaurant before placing orders.
          </p>
          <button className="geofence-retry-btn-large" onClick={checkGeofence}>
            Enable Location & Retry
          </button>
        </div>
      </div>
    );
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
      <Suspense key={location.pathname} fallback={location.pathname === '/' ? <HomeLoading /> : <PageSkeleton />}>
        <RequireRestaurant>
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
          <Route path="/ar/:slug"   element={<ARViewerPage />} />

            {/* Protected */}
            <Route path="/profile"       element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/settings"      element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="/likes"         element={<RequireAuth><LikesPage /></RequireAuth>} />
            <Route path="/live-queue"    element={<RequireAuth><LiveQueuePage /></RequireAuth>} />
            <Route path="/feedback"      element={<RequireAuth><FeedbackPage /></RequireAuth>} />
            <Route path="/feedback/:orderId" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
            <Route path="/order-history" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />

            {/* Dev */}
            <Route path="/test-webhook" element={<TestWebhookPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <FloatingQueueButton />
        </RequireRestaurant>
      </Suspense>
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
          <ScrollToTop />
          <MobileOnlyWrapper>
            <div className="App">
              <AppRoutes />
            </div>
          </MobileOnlyWrapper>
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
