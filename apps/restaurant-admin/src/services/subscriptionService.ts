/**
 * Subscription Payment Service for Restaurant Admin
 *
 * Handles the Razorpay payment flow for SaaS subscription renewals:
 * 1. createSubscriptionOrder() — calls Edge Function to create a Razorpay order
 * 2. openSubscriptionCheckout() — opens the Razorpay payment popup
 * 3. verifySubscriptionPayment() — calls Edge Function to verify and activate
 *
 * NOTE: Currently uses the same Razorpay setup as customer-web.
 *       Later, customer-web will use per-restaurant Razorpay keys,
 *       and this will remain on the platform Razorpay account.
 */

import { supabase } from '@restaurant-saas/supabase';

declare global {
    interface Window {
        Razorpay: any;
    }
}

/**
 * Step 1: Create a Razorpay Order for subscription via Edge Function
 */
export const createSubscriptionOrder = async ({
    restaurantId,
    planDuration,
}: {
    restaurantId: string;
    planDuration: number;
}) => {
    const { data, error } = await supabase.functions.invoke('create-subscription-order', {
        body: {
            restaurant_id: restaurantId,
            plan_duration: planDuration,
        },
    });

    if (error) {
        console.error('[createSubscriptionOrder] Error:', error);
        throw new Error(error.message || 'Failed to create subscription order');
    }

    if (!data?.success) {
        throw new Error(data?.error || 'Failed to create subscription order');
    }

    return data as {
        success: boolean;
        razorpay_order_id: string;
        razorpay_key_id: string;
        amount: number;
        currency: string;
        payment_id: string;
        plan_duration: number;
        plan_price: number;
    };
};

/**
 * Step 2: Open Razorpay Checkout Popup for subscription
 */
export const openSubscriptionCheckout = ({
    razorpayOrderId,
    razorpayKeyId,
    amount,
    restaurantName,
    userEmail,
    userName,
}: {
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    restaurantName: string;
    userEmail?: string;
    userName?: string;
}): Promise<{
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}> => {
    return new Promise((resolve, reject) => {
        if (!window.Razorpay) {
            reject(new Error('Razorpay SDK not loaded. Please refresh the page.'));
            return;
        }

        const options = {
            key: razorpayKeyId,
            amount,
            currency: 'INR',
            name: 'Tablekard',
            description: `Subscription for ${restaurantName}`,
            order_id: razorpayOrderId,
            prefill: {
                email: userEmail || '',
                name: userName || '',
            },
            theme: {
                color: '#4f755c',
            },
            handler: function (response: any) {
                resolve({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                });
            },
            modal: {
                ondismiss: function () {
                    reject(new Error('Payment cancelled by user'));
                },
            },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.on('payment.failed', function (response: any) {
            reject(new Error(response.error?.description || 'Payment failed'));
        });

        razorpay.open();
    });
};

/**
 * Step 3: Verify payment signature and activate subscription
 */
export const verifySubscriptionPayment = async ({
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    paymentId,
}: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    paymentId: string;
}) => {
    const { data, error } = await supabase.functions.invoke('verify-subscription-payment', {
        body: {
            razorpay_payment_id: razorpayPaymentId,
            razorpay_order_id: razorpayOrderId,
            razorpay_signature: razorpaySignature,
            payment_id: paymentId,
        },
    });

    if (error) {
        console.error('[verifySubscriptionPayment] Error:', error);
        throw new Error(error.message || 'Failed to verify subscription payment');
    }

    if (!data?.success) {
        throw new Error(data?.error || 'Payment verification failed');
    }

    return data as {
        success: boolean;
        message: string;
        starts_at: string;
        ends_at: string;
        plan_duration: number;
    };
};

/**
 * Complete subscription flow: create order → checkout → verify
 */
export const processSubscriptionPayment = async ({
    restaurantId,
    planDuration,
    restaurantName,
    userEmail,
    userName,
}: {
    restaurantId: string;
    planDuration: number;
    restaurantName: string;
    userEmail?: string;
    userName?: string;
}) => {
    // Step 1: Create order
    const orderData = await createSubscriptionOrder({ restaurantId, planDuration });

    // Step 2: Open checkout
    const paymentResponse = await openSubscriptionCheckout({
        razorpayOrderId: orderData.razorpay_order_id,
        razorpayKeyId: orderData.razorpay_key_id,
        amount: orderData.amount,
        restaurantName,
        userEmail,
        userName,
    });

    // Step 3: Verify
    const result = await verifySubscriptionPayment({
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        paymentId: orderData.payment_id,
    });

    return result;
};
