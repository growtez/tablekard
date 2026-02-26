/**
 * paymentService.js
 * 
 * Handles all Razorpay payment operations:
 * 1. createRazorpayOrder() — calls our Edge Function to create a Razorpay order
 * 2. openRazorpayCheckout() — opens the Razorpay payment popup
 * 3. verifyPayment() — calls our Edge Function to verify and create the order
 */

import { supabase } from '@restaurant-saas/supabase';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();

/**
 * Step 1: Create a Razorpay Order via our Edge Function
 * 
 * Sends cart items to the server, which:
 * - Fetches real prices from DB (prevents tampering)
 * - Creates a Razorpay order
 * - Returns razorpay_order_id to open checkout
 */
export const createRazorpayOrder = async ({ restaurantId, tableId, orderType, items }) => {
    // Debug: check auth state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[Payment Debug]', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenAlg: session?.access_token ? JSON.parse(atob(session.access_token.split('.')[0])).alg : 'none',
        userId: session?.user?.id,
        sessionError,
    });

    if (!session?.access_token) {
        throw new Error('You must be logged in to make a payment. Please log in first.');
    }

    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
            restaurant_id: restaurantId,
            table_id: tableId || null,
            order_type: orderType || 'DINE_IN',
            items: items.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                variant: item.variant || null,
                addons: item.addons || null,
                special_instructions: item.specialInstructions || null,
            })),
        },
    });

    if (error) {
        console.error('[createRazorpayOrder] Error:', error);
        // Try to read the actual error body from the Edge Function
        let errorMessage = 'Failed to create payment order';
        try {
            if (error.context) {
                const errorBody = await error.context.json();
                console.error('[createRazorpayOrder] Error body:', errorBody);
                errorMessage = errorBody?.error || errorMessage;
            }
        } catch (e) {
            console.error('[createRazorpayOrder] Could not parse error body:', e);
        }
        throw new Error(errorMessage);
    }

    return data;
};

/**
 * Step 2: Open Razorpay Checkout Popup
 * 
 * Shows the Razorpay payment modal where customer selects
 * UPI, Card, NetBanking, etc. and completes payment.
 * 
 * Returns a promise that resolves with payment details on success,
 * or rejects on failure/dismissal.
 */
export const openRazorpayCheckout = ({
    razorpayOrderId,
    amount,
    currency = 'INR',
    restaurantName = 'Tablekard',
    userName = '',
    userEmail = '',
    userPhone = '',
}) => {
    return new Promise((resolve, reject) => {
        if (!window.Razorpay) {
            reject(new Error('Razorpay SDK not loaded. Please refresh the page.'));
            return;
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: amount,         // Already in paise from Edge Function
            currency: currency,
            name: restaurantName,
            description: 'Food Order Payment',
            order_id: razorpayOrderId,
            prefill: {
                name: userName,
                email: userEmail,
                contact: userPhone,
            },
            theme: {
                color: '#d9b550',   // Tablekard gold
            },
            handler: function (response) {
                // Payment successful — Razorpay returns these
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

        razorpay.on('payment.failed', function (response) {
            reject(new Error(
                response.error?.description || 'Payment failed. Please try again.'
            ));
        });

        razorpay.open();
    });
};

/**
 * Step 3: Verify Payment via our Edge Function
 * 
 * After Razorpay checkout succeeds, this verifies the signature
 * and CREATES the order in our database.
 * 
 * Returns { success, order_id, order_number }
 */
export const verifyPayment = async ({
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    paymentId,      // Our internal payment ID
}) => {
    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
            razorpay_payment_id: razorpayPaymentId,
            razorpay_order_id: razorpayOrderId,
            razorpay_signature: razorpaySignature,
            payment_id: paymentId,
        },
    });

    if (error) {
        console.error('[verifyPayment] Error:', error);
        throw new Error(error.message || 'Payment verification failed');
    }

    return data;
};

/**
 * Complete Payment Flow — combines all 3 steps
 * 
 * Usage in my_order.jsx:
 *   const result = await processOnlinePayment({ restaurantId, items, ... });
 *   if (result.success) switch to orders tab
 */
export const processOnlinePayment = async ({
    restaurantId,
    tableId,
    orderType,
    items,
    restaurantName,
    userName,
    userEmail,
    userPhone,
    onStatusChange,     // Callback: (status) => {} for UI updates
}) => {
    try {
        // Step 1: Create Razorpay Order
        onStatusChange?.('creating_order');

        const orderData = await createRazorpayOrder({
            restaurantId,
            tableId,
            orderType,
            items,
        });

        // Step 2: Open Razorpay Checkout
        onStatusChange?.('opening_checkout');

        const paymentResponse = await openRazorpayCheckout({
            razorpayOrderId: orderData.razorpay_order_id,
            amount: orderData.amount,
            currency: orderData.currency,
            restaurantName,
            userName,
            userEmail,
            userPhone,
        });

        // Step 3: Verify Payment
        onStatusChange?.('verifying_payment');

        const verifyResult = await verifyPayment({
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpayOrderId: paymentResponse.razorpay_order_id,
            razorpaySignature: paymentResponse.razorpay_signature,
            paymentId: orderData.payment_id,
        });

        onStatusChange?.('success');

        return {
            success: true,
            orderId: verifyResult.order_id,
            orderNumber: verifyResult.order_number,
            paymentId: orderData.payment_id,
        };

    } catch (error) {
        onStatusChange?.('error');
        throw error;
    }
};
