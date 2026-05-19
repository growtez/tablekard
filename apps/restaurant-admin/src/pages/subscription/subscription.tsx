import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar';
import { useAuth } from '../../context/AuthContext';
import { getRestaurantById, getSubscriptionPayments } from '../../services/supabaseService';
import type { SubscriptionPaymentRecord } from '../../services/supabaseService';
import { processSubscriptionPayment } from '../../services/subscriptionService';
import type { Restaurant } from '@restaurant-saas/types';
import { supabase } from '@restaurant-saas/supabase';
import './subscription.css';

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
            <div className="subscription-container">
                <Sidebar />
                <div className="subscription-main">
                    <div className="subscription-loading">
                        <div className="subscription-loading-spinner" />
                        <p>Loading subscription information...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="subscription-container">
            <Sidebar />

            <div className="subscription-main">
                {/* Header */}
                <div className="subscription-header">
                    <h1>Subscription</h1>
                    <p>Manage your restaurant's subscription plan and billing.</p>
                </div>

                {/* Feedback */}
                {feedback && (
                    <div className={`subscription-banner subscription-banner-${feedback.tone}`}>
                        <span className="subscription-banner-dot" />
                        <span>{feedback.message}</span>
                    </div>
                )}

                {/* Status Card */}
                <div className="subscription-status-card">
                    <div className="subscription-status-left">
                        <div className={`subscription-status-icon ${statusInfo.status}`}>
                            {statusInfo.icon}
                        </div>
                        <div className="subscription-status-info">
                            <h3>
                                Subscription Status{' '}
                                <span className={`subscription-status-badge ${statusInfo.status}`}>
                                    {statusInfo.label}
                                </span>
                            </h3>
                            <p>{statusInfo.message}</p>
                        </div>
                    </div>
                    {statusInfo.status === 'active' && (
                        <div className="subscription-status-right">
                            <div className="subscription-days-remaining">{days}</div>
                            <div className="subscription-days-label">Days Remaining</div>
                        </div>
                    )}
                </div>

                {/* Plan Selection */}
                <div className="subscription-plans-section">
                    <h2>{statusInfo.status === 'active' ? 'Extend Your Plan' : 'Choose a Plan'}</h2>
                    <div className="subscription-plans-grid">
                        {dbPlans.map((plan) => (
                            <div
                                key={plan.duration}
                                className={`subscription-plan-card${selectedPlan === plan.duration ? ' selected' : ''}${plan.popular ? ' popular' : ''}`}
                                onClick={() => setSelectedPlan(plan.duration)}
                            >
                                {plan.popular && (
                                    <div className="subscription-plan-popular-tag">Best Value</div>
                                )}
                                {selectedPlan === plan.duration && (
                                    <div className="subscription-plan-check">✓</div>
                                )}
                                <div className="subscription-plan-duration">{plan.label}</div>
                                <div className="subscription-plan-price">
                                    ₹{plan.price.toLocaleString('en-IN')}
                                </div>
                                <div className="subscription-plan-per-month">
                                    ₹{plan.perMonth}/month
                                </div>
                                {plan.savings > 0 && (
                                    <div className="subscription-plan-savings">
                                        Save {plan.savings}%
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pay Button */}
                <div className="subscription-pay-section">
                    <button
                        className="subscription-pay-btn"
                        disabled={isProcessing || !activeRestaurantId}
                        onClick={handleRenew}
                    >
                        {isProcessing ? (
                            <>
                                <span className="spinner" />
                                Processing...
                            </>
                        ) : (
                            <>
                                💳 {statusInfo.status === 'active' ? 'Extend' : 'Subscribe'} — ₹{activePlan.price.toLocaleString('en-IN')} for {activePlan.label}
                            </>
                        )}
                    </button>
                </div>

                {/* Payment History */}
                <div className="subscription-history-section">
                    <h2>Payment History</h2>
                    <div className="subscription-history-card">
                        {payments.length === 0 ? (
                            <div className="subscription-empty-history">
                                No subscription payments yet.
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Plan</th>
                                            <th>Amount</th>
                                            <th>Period</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>{formatDate(payment.createdAt)}</td>
                                                <td>{planLabel(payment.planDuration)}</td>
                                                <td style={{ fontWeight: 600 }}>
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
