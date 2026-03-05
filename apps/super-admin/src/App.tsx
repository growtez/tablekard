import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/Layout';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import { Toaster } from 'react-hot-toast';

// Lazy load pages for better performance (code-splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Restaurants = lazy(() => import('./pages/Restaurants'));
const RestaurantDetails = lazy(() => import('./pages/RestaurantDetails'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Settings = lazy(() => import('./pages/Settings'));
const LoginPage = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Users = lazy(() => import('./pages/Users'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Transactions = lazy(() => import('./pages/Transactions'));
const PricingPlans = lazy(() => import('./pages/PricingPlans'));
const ComplaintsDisputes = lazy(() => import('./pages/ComplaintsDisputes'));
const ReviewsModeration = lazy(() => import('./pages/ReviewsModeration'));
const Announcements = lazy(() => import('./pages/Announcements'));
const GeneralSettings = lazy(() => import('./pages/GeneralSettings'));
const IntegrationsAPI = lazy(() => import('./pages/IntegrationsAPI'));
const SecurityBackups = lazy(() => import('./pages/SecurityBackups'));
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));

function AppRoutes() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="restaurants" element={<Restaurants />} />
                    <Route path="restaurants/:id" element={<RestaurantDetails />} />
                    <Route path="subscriptions" element={<Subscriptions />} />
                    <Route path="billing/transactions" element={<Transactions />} />
                    <Route path="billing/plans" element={<PricingPlans />} />
                    <Route path="support/complaints" element={<ComplaintsDisputes />} />
                    <Route path="support/reviews" element={<ReviewsModeration />} />
                    <Route path="support/announcements" element={<Announcements />} />
                    <Route path="settings/general" element={<GeneralSettings />} />
                    <Route path="settings/integrations" element={<IntegrationsAPI />} />
                    <Route path="settings/security" element={<SecurityBackups />} />
                    <Route path="settings/email" element={<EmailTemplates />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="users" element={<Users />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Suspense>
    );
}

function App() {
    return (
        <GlobalErrorBoundary>
            <AuthProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                        },
                        success: {
                            iconTheme: {
                                primary: 'var(--color-success)',
                                secondary: 'white',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: 'var(--color-error)',
                                secondary: 'white',
                            },
                        },
                    }}
                />
                <AppRoutes />
            </AuthProvider>
        </GlobalErrorBoundary>
    );
}

export default App;

