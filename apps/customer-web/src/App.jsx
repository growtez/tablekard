import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

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

// QR Ordering pages (dine-in)
import QRMenuPage from './pages/qr/menu';
import QRCartPage from './pages/qr/cart';
import QROrderSuccessPage from './pages/qr/order_success';

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

      {/* Public QR Ordering routes (browsing is allowed) */}
      <Route path="/r/:restaurantSlug" element={<QRMenuPage />} />
      <Route path="/r/:restaurantSlug/table/:tableNumber" element={<QRMenuPage />} />
      <Route path="/r/:restaurantSlug/cart" element={<QRCartPage />} />

      {/* Protected QR Order Success (only makes sense if you just ordered) */}
      <Route
        path="/r/:restaurantSlug/order-success"
        element={<RequireAuth><QROrderSuccessPage /></RequireAuth>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;


