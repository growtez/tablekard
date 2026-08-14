import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { AlertCircle, Lock, Ban, CreditCard } from 'lucide-react';

export default function StatusGuard({ children }: { children: React.ReactNode }) {
    const { activeRestaurantStatus, activeRestaurantSubscriptionStatus } = useAuth();
    const location = useLocation();

    // 1. Check Platform Status (Master Switch)
    const status = (activeRestaurantStatus || 'pending').toLowerCase();
    
    const isProfilePage = location.pathname.includes('/profile');
    
    // PENDING status no longer restricts the Restaurant Admin (they get full access)
    if (status === 'suspended') {
        if (isProfilePage) return <>{children}</>;
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 font-sans">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mb-6">
                    <Ban size={32} />
                </div>
                <h1 className="text-2xl font-bold text-[#1E293B] mb-3">Account Suspended</h1>
                <p className="text-[#64748B] max-w-md">
                    Your restaurant account has been suspended by the platform administrators.
                    Please contact support for more information.
                </p>
            </div>
        );
    }

    if (status === 'rejected') {
        if (isProfilePage) return <>{children}</>;
        return <Navigate to="/profile" replace />;
    }

    // 2. Check Subscription Status (Billing) - Only applies if Account is Active
    const subStatus = (activeRestaurantSubscriptionStatus || 'inactive').toLowerCase();
    const isSubscriptionPage = location.pathname.includes('/subscription');

    // Assuming SUSPENDED blocks access to all pages except /subscription.
    // (EXPIRED and INACTIVE now allow full access to Restaurant Admin)
    if (subStatus === 'suspended') {
        // Allow access to the subscription/billing page to renew, and profile to manage account
        if (isSubscriptionPage || isProfilePage) {
            return <>{children}</>;
        }

        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 font-sans">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-full mb-6">
                    <CreditCard size={32} />
                </div>
                <h1 className="text-2xl font-bold text-[#1E293B] mb-3">
                    Billing Suspended
                </h1>
                <p className="text-[#64748B] max-w-md mb-8">
                    Your access to the platform has been restricted because your subscription is not active. 
                    Please renew your plan to regain full access.
                </p>
                <Link to="/subscription" className="bg-[#B91C1C] hover:bg-[#991B1B] text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm inline-block">
                    Go to Billing & Subscription
                </Link>
            </div>
        );
    }

    // 3. Handle Trial and Expired Banners
    const isTrial = subStatus === 'trial' || subStatus.includes('trial');
    const isExpired = subStatus === 'expired';

    return (
        <div className="relative w-full h-full flex flex-col min-h-screen">
            {isTrial && (
                <div className="bg-blue-600 text-white text-[13px] font-medium py-2.5 px-4 text-center flex items-center justify-center gap-2 z-[100] relative shadow-sm shrink-0 font-sans">
                    <AlertCircle size={16} />
                    <span>You are currently on a Free Trial.</span>
                    <Link to="/subscription" className="underline hover:text-blue-100 ml-1">
                        Upgrade your plan
                    </Link>
                </div>
            )}
            {isExpired && !isTrial && (
                <div className="bg-amber-600 text-white text-[13px] font-medium py-2.5 px-4 text-center flex items-center justify-center gap-2 z-[100] relative shadow-sm shrink-0 font-sans">
                    <AlertCircle size={16} />
                    <span>Your subscription has expired. Renew now to avoid suspension.</span>
                    <Link to="/subscription" className="underline hover:text-amber-100 ml-1">
                        Go to Billing
                    </Link>
                </div>
            )}
            <div className="flex-1 flex flex-col relative z-0">
                {children}
            </div>
        </div>
    );
}
