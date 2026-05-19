import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/dashboard";
import Order from "./pages/order";
import Menu from "./pages/menu";
import Payment from "./pages/payment";
import LoginPage from "./pages/Login";
import Reports from "./pages/reports";
import QRCodePage from "./pages/qrcode";
import TableManagement from "./pages/table_management";
import ProfilePage from "./pages/profile/profile";
import SubscriptionPage from "./pages/subscription/subscription";




// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();



  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#FFFFFF',
        color: '#1A1A1A'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute><Order /></ProtectedRoute>
      } />
      <Route path="/menu" element={
        <ProtectedRoute><Menu /></ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute><Payment /></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute><Reports /></ProtectedRoute>
      } />
      <Route path="/qrcode" element={
        <ProtectedRoute><QRCodePage /></ProtectedRoute>
      } />
      <Route path="/table-management" element={
        <ProtectedRoute><TableManagement /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      } />
      <Route path="/subscription" element={
        <ProtectedRoute><SubscriptionPage /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

