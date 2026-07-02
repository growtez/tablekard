import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar';
import { useAuth } from '../../context/AuthContext';
import { getRestaurantById, getSubscriptionPayments } from '../../services/supabaseService';
import type { SubscriptionPaymentRecord } from '../../services/supabaseService';
import { processSubscriptionPayment } from '../../services/subscriptionService';
import type { Restaurant } from '@restaurant-saas/types';
import { supabase } from '@restaurant-saas/supabase';


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
    status: 'active' | 'expired' | 'inactive';
    icon: string;
    message: string;
} {
    if (!restaurant) {
        return { label: 'No Restaurant', status: 'inactive', icon: '🏪', message: 'No restaurant linked to this account.' };
    }

    if (!restaurant.subscriptionStatus) {
        return { label: 'Inactive', status: 'inactive', icon: '⏸️', message: 'Your subscription is inactive. Choose a plan to get started.' };
    }

    const endAt = restaurant.subscriptionEndAt;
    if (endAt && new Date(endAt) > new Date()) {
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
    const [selectedPlan, setSelectedPlan] = useState<number>(6); // default to popular plan
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
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

                    // Set default selected duration based on recommended flag
                    const recommendedPlan = mapped.find((p: any) => p.popular);
                    if (recommendedPlan) {
                        setSelectedPlan(recommendedPlan.duration);
                    } else if (mapped.length > 0) {
                        setSelectedPlan(mapped[0].duration);
                    }
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
    const handleRenew = async () => {
        if (!activeRestaurantId || isProcessing) return;

        setIsProcessing(true);
        setFeedback(null);

        try {
            const result = await processSubscriptionPayment({
                restaurantId: activeRestaurantId,
                planDuration: selectedPlan,
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
            setIsProcessing(false);
        }
    };

    // ── Status info ──
    const statusInfo = getStatusInfo(restaurant);
    const days = restaurant?.subscriptionEndAt ? daysUntil(restaurant.subscriptionEndAt) : 0;
    const activePlan = dbPlans.find(p => p.duration === selectedPlan) || dbPlans[0] || DEFAULT_PLANS[0];

    // ── Loading state ──
    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-tk-bg text-[#1A202C]">
                <Sidebar />
                <div className="flex-1 p-5 overflow-y-auto min-h-screen transition-all duration-300 ml-[240px] [.sidebar-collapsed_&]:ml-[80px] max-md:!ml-0 max-md:!p-4 max-md:!pt-[72px] bg-[#f7f8fa] rounded-l-[32px] shadow-[-8px_0_24px_rgba(0,0,0,0.12)] dark:bg-tk-bg-surface max-md:rounded-none">
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-[#718096] dark:text-tk-text-secondary">
                        <div className="w-9 h-9 border-3 border-[#E2E8F0] border-t-tk-burgundy rounded-full animate-spin" />
                        <p className="text-[0.9rem] text-[#718096] dark:text-tk-text-secondary">Loading subscription information...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-tk-bg text-[#1A202C]">
            <Sidebar />

            <div className="flex-1 p-5 overflow-y-auto min-h-screen transition-all duration-300 ml-[240px] [.sidebar-collapsed_&]:ml-[80px] max-md:!ml-0 max-md:!p-4 max-md:!pt-[72px] bg-[#f7f8fa] rounded-l-[32px] shadow-[-8px_0_24px_rgba(0,0,0,0.12)] dark:bg-tk-bg-surface max-md:rounded-none">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-[24px] font-bold text-[#1A202C] m-0 mb-1 dark:text-tk-text">Subscription</h1>
                    <p className="text-[0.925rem] text-[#718096] m-0 dark:text-tk-text-secondary">Manage your restaurant's subscription plan and billing.</p>
                </div>

                {/* Feedback */}
                {feedback && (
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-3xl mb-6 text-[0.9rem] font-medium animate-[sub-fadeIn_0.3s_ease] subscription-banner-${feedback.tone}`}>
                        <span className="w-2 h-2 rounded-full shrink-0" />
                        <span>{feedback.message}</span>
                    </div>
                )}

                {/* Status Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-3xl py-7 px-8 mb-8 flex items-center justify-between gap-8 flex-wrap shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:bg-tk-bg-card dark:border-tk-border max-md:flex-col max-md:items-start max-md:gap-5">
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${statusInfo.status}`}>
                            {statusInfo.icon}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[1.1rem] font-semibold m-0 mb-1 text-[#1A202C] dark:text-tk-text">
                                Subscription Status{' '}
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.8rem] font-semibold uppercase tracking-[0.03em] ${statusInfo.status}`}>
                                    {statusInfo.label}
                                </span>
                            </h3>
                            <p className="text-[0.875rem] text-[#718096] m-0 dark:text-tk-text-secondary">{statusInfo.message}</p>
                        </div>
                    </div>
                    {statusInfo.status === 'active' && (
                        <div className="flex flex-col items-end gap-2 max-md:items-start max-md:flex-row">
                            <div className="text-2xl font-bold text-[#1A202C] leading-none dark:text-tk-text">{days}</div>
                            <div className="text-[0.8rem] text-[#718096] uppercase tracking-[0.05em] dark:text-tk-text-secondary">Days Remaining</div>
                        </div>
                    )}
                </div>

                {/* Plan Selection */}
                <div className="mb-8">
                    <h2 className="text-[18px] font-semibold text-[#1A202C] m-0 mb-4 dark:text-tk-text">{statusInfo.status === 'active' ? 'Extend Your Plan' : 'Choose a Plan'}</h2>
                    <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-2 max-sm:grid-cols-1 max-md:gap-3">
                        {dbPlans.map((plan) => (
                            <div
                                key={plan.duration}
                                className={`subscription-plan-card${selectedPlan === plan.duration ? ' border-tk-burgundy bg-[linear-gradient(135deg,#f0faf3_0%,#ffffff_100%)] shadow-[0_0_0_1px_rgba(139,58,30,0.3),0_8px_24px_rgba(139,58,30,0.12)] dark:bg-tk-bg-hover dark:border-tk-burgundy' : ''}${plan.popular ? ' relative' : ''}`}
                                onClick={() => setSelectedPlan(plan.duration)}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white text-[0.7rem] font-bold px-3 py-1 rounded-full uppercase tracking-[0.05em] whitespace-nowrap">Best Value</div>
                                )}
                                {selectedPlan === plan.duration && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-tk-burgundy flex items-center justify-center text-white text-[0.75rem]">✓</div>
                                )}
                                <div className="text-[0.85rem] font-semibold text-[#718096] mb-3 uppercase tracking-[0.04em] dark:text-tk-text-secondary">{plan.label}</div>
                                <div className="text-3xl font-extrabold text-[#1A202C] mb-1 leading-[1.1] dark:text-tk-text max-md:text-[1.5rem]">
                                    ₹{plan.price.toLocaleString('en-IN')}
                                </div>
                                <div className="text-[0.825rem] text-[#718096] mb-3 dark:text-tk-text-secondary">
                                    ₹{plan.perMonth}/month
                                </div>
                                {plan.savings > 0 && (
                                    <div className="inline-block bg-[rgba(72,187,120,0.12)] text-[#22543D] text-[0.75rem] font-semibold px-2.5 py-1 rounded-md">
                                        Save {plan.savings}%
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pay Button */}
                <div className="flex justify-center mb-10">
                    <button
                        className="inline-flex items-center gap-2.5 px-10 py-3.5 bg-[linear-gradient(135deg,var(--tk-burgundy)_0%,#6B2A15_100%)] text-white text-base font-semibold border-none rounded-2xl cursor-pointer transition-all duration-250 shadow-[0_4px_16px_rgba(139,58,30,0.3)] hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[0_6px_20px_rgba(139,58,30,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isProcessing || !activeRestaurantId}
                        onClick={handleRenew}
                    >
                        {isProcessing ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-[sub-spin_0.6s_linear_infinite]" />
                                Processing...
                            </>
                        ) : (
                            <>
                                 {statusInfo.status === 'active' ? 'Extend' : 'Subscribe'} — ₹{activePlan.price.toLocaleString('en-IN')} for {activePlan.label}
                            </>
                        )}
                    </button>
                </div>

                {/* Payment History */}
                <div className="mb-8">
                    <h2 className="text-[18px] font-semibold text-[#1A202C] m-0 mb-4 dark:text-tk-text">Payment History</h2>
                    <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:bg-tk-bg-card dark:border-tk-border">
                        {payments.length === 0 ? (
                            <div className="p-10 text-center text-[#718096] text-[0.9rem] dark:text-tk-text-secondary">
                                No subscription payments yet.
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="text-left px-5 py-3.5 text-[0.8rem] font-semibold text-[#718096] uppercase tracking-[0.05em] border-b-2 border-[#E2E8F0] bg-[#F7FAFC] dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text-secondary">Date</th>
                                            <th className="text-left px-5 py-3.5 text-[0.8rem] font-semibold text-[#718096] uppercase tracking-[0.05em] border-b-2 border-[#E2E8F0] bg-[#F7FAFC] dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text-secondary">Plan</th>
                                            <th className="text-left px-5 py-3.5 text-[0.8rem] font-semibold text-[#718096] uppercase tracking-[0.05em] border-b-2 border-[#E2E8F0] bg-[#F7FAFC] dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text-secondary">Amount</th>
                                            <th className="text-left px-5 py-3.5 text-[0.8rem] font-semibold text-[#718096] uppercase tracking-[0.05em] border-b-2 border-[#E2E8F0] bg-[#F7FAFC] dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text-secondary">Period</th>
                                            <th className="text-left px-5 py-3.5 text-[0.8rem] font-semibold text-[#718096] uppercase tracking-[0.05em] border-b-2 border-[#E2E8F0] bg-[#F7FAFC] dark:bg-tk-bg-elevated dark:border-tk-border dark:text-tk-text-secondary">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-[#F7FAFC] dark:hover:bg-tk-bg-hover">
                                                <td className="px-5 py-3.5 text-[0.9rem] text-[#1A202C] border-b border-[#E2E8F0] dark:border-tk-border dark:text-tk-text">{formatDate(payment.createdAt)}</td>
                                                <td className="px-5 py-3.5 text-[0.9rem] text-[#1A202C] border-b border-[#E2E8F0] dark:border-tk-border dark:text-tk-text">{planLabel(payment.planDuration)}</td>
                                                <td className="px-5 py-3.5 text-[0.9rem] text-[#1A202C] border-b border-[#E2E8F0] dark:border-tk-border dark:text-tk-text font-semibold">
                                                    ₹{payment.amount.toLocaleString('en-IN')}
                                                </td>
                                                <td>
                                                    {payment.startsAt && payment.endsAt
                                                        ? `${formatDate(payment.startsAt)} — ${formatDate(payment.endsAt)}`
                                                        : '—'}
                                                </td>
                                                <td>
                                                    <span className={`sub-status-${payment.status}`}>
                                                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
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
        </div>
    );
};

export default SubscriptionPage;
