import React, { useState, useEffect, lazy, Suspense } from "react";
import { Smartphone, Loader2 } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
const OffersPage = lazy(() => import("./pages/offers"));
const OnboardingPage = lazy(() => import("./pages/onboarding"));
const LoginPage = lazy(() => import("./pages/login"));
const LiveQueuePage = lazy(() => import("./pages/live_queue"));
const FeedbackPage = lazy(() => import("./pages/feedback"));
const OrderHistoryPage = lazy(() => import("./pages/order_history"));
const AboutPage = lazy(() => import("./pages/about"));
const TestWebhookPage = lazy(() => import("./pages/test_webhook"));

// Loading fallbacks
const PageLoader = () => (
  <div style={{
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#8B3A1E'
  }}>
    <Loader2 size={32} className="animate-spin" />
    <span style={{ fontWeight: 500, fontSize: '14px' }}>Loading...</span>
    <style>{`
      .animate-spin { animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `}</style>
  </div>
);



import "./App.css";

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <RestaurantProvider>
      <Routes>
        {/* QR Code Entry Route – captures restaurantId and tableId */}
        <Route path="/order/:restaurantId/:tableId" element={<MenuPage />} />

        {/* Public Customer Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/popular" element={<MostPopularPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Protected Customer Routes */}
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/likes" element={<RequireAuth><LikesPage /></RequireAuth>} />
        <Route path="/recent" element={<RequireAuth><RecentOrdersPage /></RequireAuth>} />
        <Route path="/live-queue" element={<RequireAuth><LiveQueuePage /></RequireAuth>} />
        <Route path="/feedback" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
        <Route path="/feedback/:orderId" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
        <Route path="/order-history" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />

        {/* Developer Demo Route */}
        <Route path="/test-webhook" element={<TestWebhookPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RestaurantProvider>
  );
}

function MobileOnlyWrapper({ children }) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isDesktop) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#212121', // Dark background from new theme
        color: '#FFFFFF', // White text
        padding: '2rem',
        textAlign: 'center'
      }}>
        <Smartphone size={80} color="#d9b550" style={{ marginBottom: '1.5rem', strokeWidth: 1.5 }} />
        <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 'bold', color: '#d9b550' }}>Mobile Only</h2>
        <p style={{ color: '#CCCCCC', fontSize: '1rem' }}>Please open this app on your phone for the correct experience.</p>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider>
          <Router>
            <MobileOnlyWrapper>
              <div className="App">
                <Suspense fallback={<PageLoader />}>
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


