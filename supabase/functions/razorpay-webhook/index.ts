// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not Node.js.
// VS Code may show import errors, but the functions deploy and work correctly.

// supabase/functions/razorpay-webhook/index.ts
//
// PURPOSE: Handle webhook events from Razorpay servers.
//          This is the SAFETY NET — if the frontend verify call fails
//          (e.g. customer's browser crashes after payment), this function
//          still receives the payment confirmation from Razorpay.
//
// CALLED BY: Razorpay servers (NOT your frontend!)
// DOES NOT: Need authentication — uses webhook signature instead

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

/**
 * Add N months to a date. Handles month overflow correctly.
 */
function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // ──────────────────────────────────────────────
        // 0. Read environment variables
        // ──────────────────────────────────────────────
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        // ──────────────────────────────────────────────
        // 1. Read the raw request body (needed for signature verification)
        // ──────────────────────────────────────────────
        const rawBody = await req.text();
        const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const webhookData = JSON.parse(rawBody);
        const event = webhookData.event;

        // ──────────────────────────────────────────────
        // 2. Verify the webhook signature
        //    Razorpay signs the ENTIRE request body with your webhook secret
        // ──────────────────────────────────────────────
        const razorpaySignature = req.headers.get("x-razorpay-signature");

        if (!razorpaySignature) {
            console.error("Missing x-razorpay-signature header");
            return new Response("Missing signature", { status: 400, headers: corsHeaders });
        }

        let webhookSecret = "";
        let entityNotes = webhookData.payload?.payment?.entity?.notes;
        
        if (!entityNotes && webhookData.payload?.refund?.entity?.notes) {
            entityNotes = webhookData.payload?.refund?.entity?.notes;
        }

        if (entityNotes?.type === "subscription") {
            webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "";
            if (!webhookSecret) {
                console.error("Master Webhook secret not configured");
                return new Response("Webhook secret not configured", { status: 500, headers: corsHeaders });
            }
        } else if (entityNotes?.restaurant_id) {
            const { data: secretData, error: secretError } = await supabaseAdmin
                .rpc("get_restaurant_razorpay_secret", { p_restaurant_id: entityNotes.restaurant_id })
                .maybeSingle();
            
            if (!secretError && secretData?.razorpay_webhook_secret) {
                webhookSecret = secretData.razorpay_webhook_secret;
            } else {
                console.error(`Restaurant Webhook secret not configured for ${entityNotes.restaurant_id}`);
                return new Response("Webhook secret not configured for this restaurant", { status: 500, headers: corsHeaders });
            }
        } else {
            console.error("Missing notes.restaurant_id or notes.type in webhook payload");
            return new Response("Missing context in notes", { status: 400, headers: corsHeaders });
        }

        const expectedSignature = createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            console.error("Webhook signature mismatch — possible spoofing!");
            return new Response("Invalid signature", { status: 400, headers: corsHeaders });
        }

        // ──────────────────────────────────────────────
        // ✅ Signature verified — this is a genuine Razorpay webhook
        // ──────────────────────────────────────────────

        console.log(`Webhook received: ${event}`);

        let webhookPayment;
        let isSubscription = false;

        if (event === "payment.captured" || event === "payment.failed") {
            const razorpayOrderId = webhookData.payload?.payment?.entity?.order_id;
            if (!razorpayOrderId) {
                return new Response("Missing Razorpay order id", { status: 400, headers: corsHeaders });
            }
            
            const { data: customerPayment } = await supabaseAdmin
                .from("payments")
                .select("id, restaurant_id, order_id, status")
                .eq("razorpay_order_id", razorpayOrderId)
                .maybeSingle();

            if (customerPayment) {
                webhookPayment = customerPayment;
            } else {
                const { data: subPayment } = await supabaseAdmin
                    .from("subscription_payments")
                    .select("*")
                    .eq("razorpay_order_id", razorpayOrderId)
                    .maybeSingle();
                if (subPayment) {
                    webhookPayment = subPayment;
                    isSubscription = true;
                }
            }
        } else if (event === "refund.created" || event === "refund.processed") {
            const razorpayPaymentId = webhookData.payload?.refund?.entity?.payment_id;
            if (!razorpayPaymentId) {
                return new Response("Missing Razorpay payment id", { status: 400, headers: corsHeaders });
            }

            const { data: customerPayment } = await supabaseAdmin
                .from("payments")
                .select("id, restaurant_id, order_id, status")
                .eq("razorpay_payment_id", razorpayPaymentId)
                .maybeSingle();

            if (customerPayment) {
                webhookPayment = customerPayment;
            } else {
                const { data: subPayment } = await supabaseAdmin
                    .from("subscription_payments")
                    .select("*")
                    .eq("razorpay_payment_id", razorpayPaymentId)
                    .maybeSingle();
                if (subPayment) {
                    webhookPayment = subPayment;
                    isSubscription = true;
                }
            }
        } else {
            console.log(`Unhandled webhook event: ${event}`);
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
        }

        if (!webhookPayment) {
            console.error(`Payment record not found for webhook verification: ${event}`);
            return new Response("Payment record not found", { status: 200, headers: corsHeaders });
        }

        // ──────────────────────────────────────────────
        // 3. Handle different webhook events
        // ──────────────────────────────────────────────

        if (event === "payment.captured") {
            // ───── PAYMENT CAPTURED (Success) ─────
            const paymentEntity = webhookData.payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;
            const razorpayPaymentId = paymentEntity.id;
            const method = paymentEntity.method;     // 'upi', 'card', 'netbanking', etc.

            if (isSubscription) {
                // --- SUBSCRIPTION LOGIC ---
                if (webhookPayment.status !== "paid") {
                    console.log("Frontend verify did not run — activating subscription from webhook");
                    
                    const now = new Date();
                    const restaurantId = webhookPayment.restaurant_id;
                    const planDuration = webhookPayment.plan_duration || 1;
                    const planName = webhookPayment.plan_name;

                    const { data: restaurant } = await supabaseAdmin
                        .from("restaurants")
                        .select("status, subscription_end_at")
                        .eq("id", restaurantId)
                        .single();

                    if (restaurant && ["approved", "active"].includes(restaurant.status)) {
                        let startsAt;
                        if (
                            restaurant.status === "active" &&
                            restaurant.subscription_end_at &&
                            new Date(restaurant.subscription_end_at) > now
                        ) {
                            startsAt = new Date(restaurant.subscription_end_at);
                        } else {
                            startsAt = now;
                        }

                        const endsAt = addMonths(startsAt, planDuration);
                        const gracePeriodEndsAt = new Date(endsAt);
                        gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 3);

                        await supabaseAdmin
                            .from("subscription_payments")
                            .update({
                                razorpay_payment_id: razorpayPaymentId,
                                status: "paid",
                                paid_at: now.toISOString(),
                                starts_at: startsAt.toISOString(),
                                ends_at: endsAt.toISOString(),
                            })
                            .eq("id", webhookPayment.id);

                        await supabaseAdmin
                            .from("restaurants")
                            .update({
                                status: "active",
                                subscription_status: true,
                                subscription_type: planName ?? "QR",
                                subscription_end_at: endsAt.toISOString(),
                                grace_period_ends_at: gracePeriodEndsAt.toISOString(),
                            })
                            .eq("id", restaurantId);
                    }
                }
            } else {
                // --- CUSTOMER FOOD ORDER LOGIC ---
                const payment = webhookPayment;

                // Update payment: mark webhook as verified, fill in method
                await supabaseAdmin
                    .from("payments")
                    .update({
                        webhook_verified: true,
                        webhook_event_id: webhookData.event_id || null,
                        razorpay_payment_id: razorpayPaymentId,
                        method: method,
                        status: "paid",                                // Confirm payment
                        paid_at: new Date().toISOString(),
                    })
                    .eq("id", payment.id);

                // If the verify-razorpay-payment function already created the order,
                // update the order's payment_status too (safety net)
                if (payment.order_id) {
                    await supabaseAdmin
                        .from("orders")
                        .update({ payment_status: "paid" })
                        .eq("id", payment.order_id);
                }

                // If verify function DIDN'T run (browser crashed), we need to
                // create the order now using the stored cart data
                if (!payment.order_id && payment.status !== "paid") {
                    console.log("Frontend verify did not run — creating order from webhook");

                    // Fetch cart data from payment_logs
                    const { data: logEntry } = await supabaseAdmin
                        .from("payment_logs")
                        .select("event_data")
                        .eq("payment_id", payment.id)
                        .eq("event_type", "ORDER_CREATED")
                        .single();

                    if (logEntry?.event_data?.items) {
                        const cartData = logEntry.event_data;

                        // Generate order number
                        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                        let orderNumber = "ORD-";
                        for (let i = 0; i < 6; i++) {
                            orderNumber += chars.charAt(Math.floor(Math.random() * chars.length));
                        }

                        // Create the order
                        const { data: order } = await supabaseAdmin
                            .from("orders")
                            .insert({
                                customer_id: cartData.customer_id,
                                restaurant_id: cartData.restaurant_id,
                                order_number: orderNumber,
                                type: cartData.order_type?.toLowerCase() || "dine_in",
                                status: "confirmed",
                                table_id: (typeof cartData.table_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cartData.table_id)) ? cartData.table_id : null,
                                payment_method: "online",
                                payment_status: "paid",
                                subtotal: cartData.subtotal,
                                taxes: cartData.taxes,
                                discount: 0,
                                total: cartData.amount,
                            })
                            .select("id")
                            .single();

                        if (order) {
                            // Create order items
                            const orderItems = cartData.items.map((item: any) => ({
                                order_id: order.id,
                                menu_item_id: item.menu_item_id,
                                name: item.name,
                                price: item.price,
                                quantity: item.quantity,
                                total: item.total,
                                variant: item.variant,
                                addons: item.addons,
                                special_instructions: item.special_instructions,
                            }));

                            await supabaseAdmin.from("order_items").insert(orderItems);

                            // Link payment to the new order
                            await supabaseAdmin
                                .from("payments")
                                .update({ order_id: order.id })
                                .eq("id", payment.id);
                            
                            payment.order_id = order.id;
                        }
                    }
                }

                // Log the webhook event
                await supabaseAdmin.from("payment_logs").insert({
                    payment_id: payment.id,
                    order_id: payment.order_id,
                    event_type: "WEBHOOK_PAYMENT_CAPTURED",
                    event_data: {
                        razorpay_order_id: razorpayOrderId,
                        razorpay_payment_id: razorpayPaymentId,
                        method,
                        amount: paymentEntity.amount,
                        webhook_event_id: webhookData.event_id,
                        received_at: new Date().toISOString(),
                    },
                });
            }

        } else if (event === "payment.failed") {
            // ───── PAYMENT FAILED ─────
            const paymentEntity = webhookData.payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;
            const errorCode = paymentEntity.error_code;
            const errorDescription = paymentEntity.error_description;

            if (isSubscription) {
                await supabaseAdmin
                    .from("subscription_payments")
                    .update({
                        status: "failed"
                    })
                    .eq("id", webhookPayment.id);
            } else {
                const payment = webhookPayment;
                await supabaseAdmin
                    .from("payments")
                    .update({
                        status: "failed",
                        failure_reason: errorDescription,
                        failure_code: errorCode,
                        webhook_verified: true,
                        webhook_event_id: webhookData.event_id || null,
                    })
                    .eq("id", payment.id);

                await supabaseAdmin.from("payment_logs").insert({
                    payment_id: payment.id,
                    order_id: payment.order_id,
                    event_type: "WEBHOOK_PAYMENT_FAILED",
                    event_data: {
                        razorpay_order_id: razorpayOrderId,
                        error_code: errorCode,
                        error_description: errorDescription,
                        webhook_event_id: webhookData.event_id,
                        received_at: new Date().toISOString(),
                    },
                });
            }

        } else if (event === "refund.created" || event === "refund.processed") {
            // ───── REFUND EVENTS ─────
            const refundEntity = webhookData.payload.refund.entity;
            const razorpayPaymentId = refundEntity.payment_id;

            if (isSubscription) {
                // Typically you'd handle subscription refunds here if needed
                if (event === "refund.processed") {
                     await supabaseAdmin
                        .from("subscription_payments")
                        .update({
                            status: "refunded"
                        })
                        .eq("id", webhookPayment.id);
                }
            } else {
                const payment = webhookPayment;
                const eventType = event === "refund.created"
                    ? "WEBHOOK_REFUND_CREATED"
                    : "WEBHOOK_REFUND_PROCESSED";

                if (event === "refund.processed") {
                    await supabaseAdmin
                        .from("payments")
                        .update({
                            status: "refunded",
                            refund_id: refundEntity.id,
                            refund_amount: refundEntity.amount / 100,  // Convert paise to rupees
                            webhook_verified: true,
                        })
                        .eq("id", payment.id);

                    if (payment.order_id) {
                        await supabaseAdmin
                            .from("orders")
                            .update({ payment_status: "refunded" })
                            .eq("id", payment.order_id);
                    }
                }

                await supabaseAdmin.from("payment_logs").insert({
                    payment_id: payment.id,
                    order_id: payment.order_id,
                    event_type: eventType,
                    event_data: {
                        refund_id: refundEntity.id,
                        razorpay_payment_id: razorpayPaymentId,
                        amount: refundEntity.amount,
                        status: refundEntity.status,
                        webhook_event_id: webhookData.event_id,
                        received_at: new Date().toISOString(),
                    },
                });
            }
        }

        // ──────────────────────────────────────────────
        // ALWAYS return 200 OK to Razorpay.
        // ──────────────────────────────────────────────
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("razorpay-webhook error:", error);
        // Still return 200 to prevent infinite retries
        return new Response(JSON.stringify({ received: true, error: "Internal error logged" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
