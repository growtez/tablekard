import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// QR Ordering pages
import QRMenuPage from './pages/qr/menu';
import QRCartPage from './pages/qr/cart';
import QROrderSuccessPage from './pages/qr/order_success';
import LoginPage from './pages/login';

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
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/r/:restaurantSlug"
        element={<RequireAuth><QRMenuPage /></RequireAuth>}
      />
      <Route
        path="/r/:restaurantSlug/table/:tableNumber"
        element={<RequireAuth><QRMenuPage /></RequireAuth>}
      />
      <Route
        path="/r/:restaurantSlug/cart"
        element={<RequireAuth><QRCartPage /></RequireAuth>}
      />
      <Route
        path="/r/:restaurantSlug/order-success"
        element={<RequireAuth><QROrderSuccessPage /></RequireAuth>}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
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
