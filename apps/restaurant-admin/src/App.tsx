import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Lazy load page components
const Dashboard = lazy(() => import("./pages/dashboard"));
const Order = lazy(() => import("./pages/order"));
const Menu = lazy(() => import("./pages/menu"));
const Payment = lazy(() => import("./pages/payment"));
const TransactionDetail = lazy(() => import("./pages/transaction_detail"));
const LoginPage = lazy(() => import("./pages/Login"));
const Reports = lazy(() => import("./pages/reports"));
const QRCodePage = lazy(() => import("./pages/qrcode"));
const TableManagement = lazy(() => import("./pages/table_management"));
const ProfilePage = lazy(() => import("./pages/profile/profile"));
const SubscriptionPage = lazy(() => import("./pages/subscription/subscription"));

// Loading fallback for Suspense
const PageLoader = () => (
  <div className="flex justify-center items-center h-screen bg-[#F4F6F9] text-[#1E293B] font-sans text-base font-medium">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-[#E2E8F0] border-t-tk-burgundy animate-spin"></div>
      <span>Loading...</span>
    </div>
  </div>
);

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/payments/:id" element={
          <ProtectedRoute><TransactionDetail /></ProtectedRoute>
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
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
