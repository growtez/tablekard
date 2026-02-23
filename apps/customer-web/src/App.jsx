import React, { useState, useEffect } from "react";
import { Smartphone } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Import your pages
import HomePage from "./pages/home";
import MenuPage from "./pages/menu";
import MyOrdersPage from "./pages/my_order";
import ProfilePage from "./pages/profile";
import SettingsPage from "./pages/settings";
import SearchPage from './pages/search';
import LikesPage from './pages/likes';
import MostPopularPage from './pages/popular';
import RecentOrdersPage from './pages/recent';
import OffersPage from './pages/offers';
import OnboardingPage from './pages/onboarding';
import LoginPage from './pages/login';
import LiveQueuePage from './pages/live_queue';
import FeedbackPage from './pages/feedback';
import OrderHistoryPage from './pages/order_history';
import AboutPage from './pages/about';
import TestWebhookPage from './pages/test_webhook';



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
    <Routes>
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


