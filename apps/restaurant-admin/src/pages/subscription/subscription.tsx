import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRestaurantById, getSubscriptionPayments } from '../../services/supabaseService';
import type { SubscriptionPaymentRecord } from '../../services/supabaseService';
import { processSubscriptionPayment } from '../../services/subscriptionService';
import type { Restaurant } from '@restaurant-saas/types';
import { supabase } from '@restaurant-saas/supabase';
import { CheckCircle2, Loader2, Calendar, TrendingUp, X } from 'lucide-react';

// ──────────────────────────────────────────────
// Plan definitions (display only — pricing enforced server-side)
// ──────────────────────────────────────────────
interface Plan {
    duration: number;
    label: string;
    price: number;
    perMonth: number;
    savings: number;        // percentage saved vs monthly
    popular?: boolean;
}

const DEFAULT_PLANS: Plan[] = [
    { duration: 1, label: '1 Month Package', price: 499, perMonth: 499, savings: 0 },
    { duration: 3, label: '3 Months Package', price: 1399, perMonth: 466, savings: 7 },
    { duration: 6, label: '6 Months Package', price: 2699, perMonth: 450, savings: 10, popular: true },
    { duration: 12, label: '12 Months Package', price: 4999, perMonth: 417, savings: 16 },
];

const PLAN_FEATURES = [
    'Unlimited Orders & Revenue',
    'Advanced Reports & Analytics',
    'Digital Menu Management',
    'QR Code Table Ordering',
    '24/7 Priority Support'
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function daysUntil(dateStr: string | null | undefined): number {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getStatusInfo(restaurant: Restaurant | null): {
    label: string;
    status: 'active' | 'grace' | 'expired' | 'inactive';
    icon: string;
    message: string;
} {
    if (!restaurant) {
        return { label: 'No Restaurant', status: 'inactive', icon: '🏪', message: 'No restaurant linked to this account.' };
    }

    if (!restaurant.subscriptionStatus) {
        return { label: 'Inactive', status: 'inactive', icon: '⏸️', message: 'Your subscription is inactive. Choose a plan to get started.' };
    }

    const now = new Date();
    const endAt = restaurant.subscriptionEndAt;
    const graceEnd = (restaurant as any).gracePeriodEndsAt;

    if (endAt && new Date(endAt) > now) {
        // Still within the paid subscription period
        const days = daysUntil(endAt);
        return {
            label: 'Active',
            status: 'active',
            icon: '✅',
            message: days <= 7
                ? `Expires on ${formatDate(endAt)} — renew soon to avoid interruption.`
                : `Active until ${formatDate(endAt)}.`,
        };
    }

    if (graceEnd && new Date(graceEnd) > now) {
        // Subscription ended but within 3-day grace period
        const graceDays = daysUntil(graceEnd);
        return {
            label: 'Grace Period',
            status: 'grace',
            icon: '⏳',
            message: `Your subscription has expired. You have ${graceDays} day${graceDays !== 1 ? 's' : ''} remaining before services are suspended. Renew now to avoid interruption!`,
        };
    }

    return { label: 'Expired', status: 'expired', icon: '⚠️', message: 'Your subscription has expired. Renew to continue using all features.' };
}

function planLabel(months: number): string {
    if (months === 1) return '1 Month';
    return `${months} Months`;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
const SubscriptionPage: React.FC = () => {
    const { activeRestaurantId, activeRestaurantName, userProfile } = useAuth();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>([]);
    const [dbPlans, setDbPlans] = useState<Plan[]>(DEFAULT_PLANS);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);

    // ── Load data ──
    const loadData = useCallback(async () => {
        if (!activeRestaurantId) {
            setRestaurant(null);
            setPayments([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const [rest, pays] = await Promise.all([
                getRestaurantById(activeRestaurantId),
                getSubscriptionPayments(activeRestaurantId),
            ]);
            setRestaurant(rest);
            setPayments(pays);

            // Fetch active billing plans from platform_settings
            try {
                const { data, error: err } = await supabase
                    .from('platform_settings')
                    .select('config')
                    .eq('id', 'billing_plans')
                    .maybeSingle();

                if (err) throw err;

                const config = data?.config as any;
                if (config?.plans) {
                    const mapped = config.plans.map((p: any) => ({
                        duration: p.duration,
                        label: p.name,
                        price: p.price,
                        perMonth: Math.round(p.price / p.duration),
                        savings: p.savings || 0,
                        popular: !!p.recommended
                    }));
                    setDbPlans(mapped);
                } else {
                    setDbPlans(DEFAULT_PLANS);
                }
            } catch (plansErr) {
                console.error('Failed to load DB plans, utilizing fallbacks:', plansErr);
                setDbPlans(DEFAULT_PLANS);
            }
        } catch (err: any) {
            console.error('Failed to load subscription data:', err);
            setFeedback({ tone: 'error', message: err.message || 'Failed to load subscription data.' });
        } finally {
            setIsLoading(false);
        }
    }, [activeRestaurantId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Handle payment ──
    const handleRenew = async (planDuration: number) => {
        if (!activeRestaurantId || isProcessing !== null) return;

        setIsProcessing(planDuration);
        setFeedback(null);

        try {
            const result = await processSubscriptionPayment({
                restaurantId: activeRestaurantId,
                planDuration,
                restaurantName: activeRestaurantName,
                userEmail: userProfile?.email || undefined,
                userName: userProfile?.name || undefined,
            });

            setFeedback({
                tone: 'success',
                message: `🎉 Subscription activated! Active until ${formatDate(result.ends_at)}.`,
            });

            // Reload data to reflect changes
            await loadData();
        } catch (err: any) {
            if (err.message?.includes('cancelled')) {
                setFeedback({ tone: 'info', message: 'Payment was cancelled.' });
            } else {
                setFeedback({ tone: 'error', message: err.message || 'Payment failed. Please try again.' });
            }
        } finally {
            setIsProcessing(null);
        }
    };

    // ── Status info ──
    const statusInfo = getStatusInfo(restaurant);
    const days = restaurant?.subscriptionEndAt ? daysUntil(restaurant.subscriptionEndAt) : 0;

    // Find current active plan from the latest successful payment
    const latestSuccessfulPayment = payments.find(p => p.status === 'succeeded');
    const currentPlanDuration = (statusInfo.status === 'active' || statusInfo.status === 'grace') 
        ? latestSuccessfulPayment?.planDuration 
        : null;

    // ── Loading state ──
    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-[#4A5568] dark:text-tk-text-secondary">
                    <div className="w-9 h-9 border-3 border-[#E2E8F0] border-t-tk-burgundy rounded-full animate-spin" />
                    <p className="text-[0.9rem] text-[#4A5568] dark:text-tk-text-secondary">Loading subscription information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] w-full mx-auto pb-12">
            {/* Feedback Banner */}
            {feedback && (
                <div className={`flex items-center gap-3 px-5 py-4 rounded-xl mb-6 text-[0.9rem] font-medium animate-[sub-fadeIn_0.3s_ease] shadow-sm border-[1.5px] ${
                    feedback.tone === 'success' ? 'bg-tk-success-bg text-tk-success border-tk-success/30' : 
                    feedback.tone === 'error' ? 'bg-tk-error-bg text-tk-error border-tk-error/30' : 
                    'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                    {feedback.tone === 'success' && <CheckCircle2 size={18} />}
                    {feedback.tone === 'error' && <X size={18} />}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Modern Hero & Status Board */}
            <div className="mb-12 relative overflow-hidden rounded-[24px] bg-tk-bg-card border-[1.5px] border-tk-border shadow-sm p-8 flex justify-between items-center max-md:flex-col max-md:items-start max-md:gap-6">
                <div className="absolute top-0 right-0 w-80 h-80 bg-tk-burgundy/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h1 className="text-[32px] font-extrabold text-tk-text m-0 mb-3 tracking-tight">Subscription & Billing</h1>
                    <p className="text-[15px] text-tk-text-secondary m-0 max-w-lg leading-relaxed">Manage your restaurant's access to TableKard. Upgrade or extend your plan to continue unlocking the full potential of your business operations.</p>
                    
                    <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-tk-bg-surface border-[1.5px] border-tk-border shadow-sm">
                        <span className="relative flex h-3 w-3">
                            {statusInfo.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tk-success opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${statusInfo.status === 'active' ? 'bg-tk-success' : 'bg-tk-error'}`}></span>
                        </span>
                        <span className="text-[13px] font-bold text-tk-text uppercase tracking-widest">
                            Status: <span className={statusInfo.status === 'active' ? 'text-tk-success' : 'text-tk-error'}>{statusInfo.label}</span>
                        </span>
                    </div>
                </div>
                
                {/* Dynamic Days Remaining Circular Badge */}
                <div className="relative z-10 flex flex-col items-center justify-center bg-tk-bg-surface rounded-2xl p-7 border-[1.5px] border-tk-border shadow-sm min-w-[200px]">
                    {statusInfo.status === 'active' ? (
                        <>
                            <div className="text-[48px] font-black text-tk-text leading-none mb-2 tracking-tighter">{days}</div>
                            <div className="text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.2em]">Days Left</div>
                        </>
                    ) : (
                        <>
                            <div className="text-[48px] mb-3">{statusInfo.icon}</div>
                            <div className="text-[14px] font-bold text-tk-error text-center uppercase tracking-widest">Action Required</div>
                        </>
                    )}
                </div>
            </div>

            {/* SaaS Pricing Cards */}
            <div className="mb-16">
                <div className="text-center mb-10">
                    <h2 className="text-[28px] font-extrabold text-tk-text m-0 mb-3 tracking-tight">Choose the Perfect Plan</h2>
                    <p className="text-[15px] text-tk-text-secondary m-0">Simple, transparent pricing to power your restaurant's growth.</p>
                </div>
                
                <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1 items-stretch pt-4">
                    {dbPlans.map((plan) => {
                        const isCurrentPlan = currentPlanDuration === plan.duration;
                        
                        return (
                        <div
                            key={plan.duration}
                            className={`relative flex flex-col bg-tk-bg-card rounded-[24px] transition-all duration-300 ${
                                plan.popular 
                                ? 'border-[2px] border-tk-burgundy shadow-[0_12px_40px_rgba(139,58,30,0.15)] -translate-y-4 max-lg:-translate-y-0 z-10' 
                                : 'border-[1.5px] border-tk-border shadow-sm hover:shadow-xl hover:border-tk-burgundy/40 hover:-translate-y-2'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-md whitespace-nowrap z-20">
                                    Most Popular
                                </div>
                            )}
                            
                            {isCurrentPlan && (
                                <div className="absolute top-0 right-0 bg-tk-success text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[22px] uppercase tracking-widest z-20 shadow-sm">
                                    Current Plan
                                </div>
                            )}
                            
                            <div className="p-8 border-b border-tk-border/50 text-center relative overflow-hidden rounded-t-[24px] flex flex-col items-center justify-center">
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-tk-burgundy/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                )}
                                <div className="text-[14px] font-bold text-tk-text-secondary mb-5 uppercase tracking-[0.15em] relative z-10">{plan.label}</div>
                                <div className="flex items-start justify-center gap-1 mb-2 relative z-10">
                                    <span className="text-[20px] font-bold text-tk-text mt-1">₹</span>
                                    <span className="text-[42px] font-black text-tk-text leading-none tracking-tighter">{plan.price.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="text-[14px] text-tk-text-secondary font-semibold relative z-10">
                                    Just ₹{plan.perMonth} / month
                                </div>
                                {plan.savings > 0 ? (
                                    <div className="mt-4 inline-block bg-tk-success-bg text-tk-success text-[12px] font-bold px-3 py-1.5 rounded-full relative z-10 uppercase tracking-wider">
                                        Save {plan.savings}%
                                    </div>
                                ) : (
                                    <div className="mt-4 inline-block px-3 py-1.5 opacity-0 pointer-events-none text-[12px]">
                                        No savings
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-8 flex-1 flex flex-col bg-tk-bg-surface/30 rounded-b-[24px]">
                                <div className="text-[12px] font-bold text-tk-text mb-5 uppercase tracking-widest text-center">What's included</div>
                                <ul className="flex flex-col gap-4 mb-8">
                                    {PLAN_FEATURES.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[14px] text-tk-text-secondary font-medium">
                                            <CheckCircle2 size={18} className="text-tk-burgundy shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                
                                <div className="mt-auto">
                                    <button
                                        className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
                                            plan.popular
                                            ? 'bg-tk-burgundy text-white hover:bg-[#6B2A15] shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                                            : 'bg-tk-burgundy-bg text-tk-burgundy hover:bg-tk-burgundy hover:text-white shadow-sm'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        disabled={isProcessing !== null || !activeRestaurantId}
                                        onClick={() => handleRenew(plan.duration)}
                                    >
                                        {isProcessing === plan.duration ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : isCurrentPlan ? (
                                            'Extend Plan'
                                        ) : (
                                            'Subscribe Now'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {/* Payment History */}
            <div>
                <h2 className="text-[20px] font-bold text-tk-text m-0 mb-5 tracking-tight">Payment History</h2>
                <div className="bg-tk-bg-card rounded-[16px] border-[1.5px] border-tk-border shadow-sm flex flex-col h-full relative z-0 overflow-hidden">
                    {payments.length === 0 ? (
                        <div className="p-12 text-center text-tk-text-secondary text-[15px] font-medium flex flex-col items-center gap-3">
                            <Calendar size={32} className="text-tk-border" />
                            No subscription payments yet.
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto overflow-y-auto max-h-[400px] relative rounded-[16px]">
                            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                                <thead>
                                    <tr>
                                        <th className="sticky top-0 z-10 w-[20%] px-6 py-4 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] bg-tk-bg-surface border-b border-tk-border">Date</th>
                                        <th className="sticky top-0 z-10 w-[20%] px-6 py-4 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] bg-tk-bg-surface border-b border-tk-border">Plan</th>
                                        <th className="sticky top-0 z-10 w-[20%] px-6 py-4 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] bg-tk-bg-surface border-b border-tk-border">Amount</th>
                                        <th className="sticky top-0 z-10 w-[25%] px-6 py-4 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] bg-tk-bg-surface border-b border-tk-border">Period</th>
                                        <th className="sticky top-0 z-10 w-[15%] px-6 py-4 text-[12px] font-bold text-tk-text-secondary uppercase tracking-[0.1em] bg-tk-bg-surface border-b border-tk-border text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment, i) => (
                                        <tr key={payment.id} className={`group hover:bg-tk-bg-hover transition-colors ${i !== payments.length - 1 ? 'border-b border-tk-border' : ''}`}>
                                            <td className="px-6 py-4 text-[14px] text-tk-text whitespace-nowrap font-medium">
                                                {formatDate(payment.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-tk-text font-medium">
                                                {planLabel(payment.planDuration)}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] font-bold text-tk-text">
                                                ₹{payment.amount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-tk-text-secondary font-medium">
                                                {payment.startsAt && payment.endsAt
                                                    ? <div>{formatDate(payment.startsAt)} — {formatDate(payment.endsAt)}</div>
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] ${
                                                    payment.status === 'succeeded' ? 'bg-tk-success-bg text-tk-success' :
                                                    payment.status === 'failed' ? 'bg-tk-error-bg text-tk-error' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
