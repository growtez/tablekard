import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { AlertCircle, Ban, CreditCard } from 'lucide-react';

export default function StatusGuard({ children }: { children: React.ReactNode }) {
    const { activeRestaurantStatus, activeRestaurantSubscriptionStatus, activeRestaurantGracePeriodEndsAt } = useAuth();
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


    // 3. Handle Trial and Expired Banners
    const isTrial = subStatus === 'trial' || subStatus.includes('trial');
    const isExpired = subStatus === 'expired';
    
    let isGracePeriodOver = false;
    let graceDays = 0;
    if (isExpired) {
        if (activeRestaurantGracePeriodEndsAt) {
            const graceEnd = new Date(activeRestaurantGracePeriodEndsAt);
            const now = new Date();
            isGracePeriodOver = graceEnd < now;
            graceDays = Math.max(0, Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
            isGracePeriodOver = true;
        }
    }

    return (
        <div className="relative w-full h-full flex flex-col min-h-screen">

            {isExpired && !isTrial && !isGracePeriodOver && (
                <div className="bg-amber-600 text-white text-[13px] font-medium py-2.5 px-4 text-center flex items-center justify-center gap-4 z-10 relative shadow-sm shrink-0 font-sans w-full -mt-6 mb-6 max-md:mt-0 rounded-b-md sm:rounded-md">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>Your plan is over. You have {graceDays} day{graceDays !== 1 ? 's' : ''} remaining before your customer web is disabled. Please renew.</span>
                    </div>
                    <Link to="/subscription" className="bg-white text-amber-700 hover:bg-amber-50 font-semibold py-1 px-3 rounded-md text-xs transition-colors shadow-sm">
                        Go to Billing
                    </Link>
                </div>
            )}
            {isExpired && !isTrial && isGracePeriodOver && (
                <div className="bg-red-600 text-white text-[13px] font-medium py-2.5 px-4 text-center flex items-center justify-center gap-4 z-10 relative shadow-sm shrink-0 font-sans w-full -mt-6 mb-6 max-md:mt-0 rounded-b-md sm:rounded-md">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>Your plan is over and your customer web is disabled. Please renew.</span>
                    </div>
                    <Link to="/subscription" className="bg-white text-red-700 hover:bg-red-50 font-semibold py-1 px-3 rounded-md text-xs transition-colors shadow-sm">
                        Go to Billing
                    </Link>
                </div>
            )}
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
