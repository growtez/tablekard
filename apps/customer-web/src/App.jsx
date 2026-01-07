import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// Import your pages
import HomePage from "./pages/home";
import MenuPage from "./pages/menu";
import MyOrdersPage from "./pages/my_order";
import ProfilePage from "./pages/profile";
import SettingsPage from "./pages/settings";

import LikesPage from './pages/likes';
import MostPopularPage from './pages/popular';
import RecentOrdersPage from './pages/recent';
import OffersPage from './pages/offers';
import OnboardingPage from './pages/onboarding';
import LoginPage from './pages/login';

// QR Ordering pages (dine-in)
import QRMenuPage from './pages/qr/menu';
import QRCartPage from './pages/qr/cart';
import QROrderSuccessPage from './pages/qr/order_success';

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Regular customer routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/likes" element={<LikesPage />} />
              <Route path="/popular" element={<MostPopularPage />} />
              <Route path="/recent" element={<RecentOrdersPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* QR Ordering routes (dine-in) */}
              <Route path="/r/:restaurantSlug" element={<QRMenuPage />} />
              <Route path="/r/:restaurantSlug/table/:tableNumber" element={<QRMenuPage />} />
              <Route path="/r/:restaurantSlug/cart" element={<QRCartPage />} />
              <Route path="/r/:restaurantSlug/order-success" element={<QROrderSuccessPage />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
