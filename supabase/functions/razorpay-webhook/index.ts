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

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // ──────────────────────────────────────────────
        // 0. Read environment variables
        // ──────────────────────────────────────────────
        const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!RAZORPAY_WEBHOOK_SECRET) {
            throw new Error("Webhook secret not configured");
        }

        // ──────────────────────────────────────────────
        // 1. Read the raw request body (needed for signature verification)
        // ──────────────────────────────────────────────
        const rawBody = await req.text();

        // ──────────────────────────────────────────────
        // 2. Verify the webhook signature
        //    Razorpay signs the ENTIRE request body with your webhook secret
        // ──────────────────────────────────────────────
        const razorpaySignature = req.headers.get("x-razorpay-signature");

        if (!razorpaySignature) {
            console.error("Missing x-razorpay-signature header");
            return new Response("Missing signature", { status: 400, headers: corsHeaders });
        }

        const expectedSignature = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
            .update(rawBody)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            console.error("Webhook signature mismatch — possible spoofing!");
            return new Response("Invalid signature", { status: 400, headers: corsHeaders });
        }

        // ──────────────────────────────────────────────
        // ✅ Signature verified — this is a genuine Razorpay webhook
        // ──────────────────────────────────────────────

        const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const webhookData = JSON.parse(rawBody);
        const event = webhookData.event;

        console.log(`Webhook received: ${event}`);

        // ──────────────────────────────────────────────
        // 3. Handle different webhook events
        // ──────────────────────────────────────────────

        if (event === "payment.captured") {
            // ───── PAYMENT CAPTURED (Success) ─────
            const paymentEntity = webhookData.payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;
            const razorpayPaymentId = paymentEntity.id;
            const method = paymentEntity.method;     // 'upi', 'card', 'netbanking', etc.

            // Find our payment record by razorpay_order_id
            const { data: payment, error: findError } = await supabaseAdmin
                .from("payments")
                .select("id, order_id, status")
                .eq("razorpay_order_id", razorpayOrderId)
                .single();

            if (findError || !payment) {
                console.error(`Payment not found for razorpay_order_id: ${razorpayOrderId}`);
                // Still return 200 to prevent Razorpay from retrying
                return new Response("Payment record not found", { status: 200, headers: corsHeaders });
            }

            // Update payment: mark webhook as verified, fill in method
            await supabaseAdmin
                .from("payments")
                .update({
                    webhook_verified: true,
                    webhook_event_id: webhookData.event_id || null,
                    razorpay_payment_id: razorpayPaymentId,
                    method: method,
                    status: "PAID",                                // Confirm payment
                    paid_at: new Date().toISOString(),
                })
                .eq("id", payment.id);

            // If the verify-razorpay-payment function already created the order,
            // update the order's payment_status too (safety net)
            if (payment.order_id) {
                await supabaseAdmin
                    .from("orders")
                    .update({ payment_status: "PAID" })
                    .eq("id", payment.order_id);
            }

            // If verify function DIDN'T run (browser crashed), we need to
            // create the order now using the stored cart data
            if (!payment.order_id && payment.status !== "PAID") {
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
                            type: cartData.order_type || "DINE_IN",
                            status: "CONFIRMED",
                            table_id: cartData.table_id || null,
                            payment_method: "ONLINE",
                            payment_status: "PAID",
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

        } else if (event === "payment.failed") {
            // ───── PAYMENT FAILED ─────
            const paymentEntity = webhookData.payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;
            const errorCode = paymentEntity.error_code;
            const errorDescription = paymentEntity.error_description;

            const { data: payment } = await supabaseAdmin
                .from("payments")
                .select("id, order_id")
                .eq("razorpay_order_id", razorpayOrderId)
                .single();

            if (payment) {
                await supabaseAdmin
                    .from("payments")
                    .update({
                        status: "FAILED",
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

            const { data: payment } = await supabaseAdmin
                .from("payments")
                .select("id, order_id")
                .eq("razorpay_payment_id", razorpayPaymentId)
                .single();

            if (payment) {
                const eventType = event === "refund.created"
                    ? "WEBHOOK_REFUND_CREATED"
                    : "WEBHOOK_REFUND_PROCESSED";

                if (event === "refund.processed") {
                    await supabaseAdmin
                        .from("payments")
                        .update({
                            status: "REFUNDED",
                            refund_id: refundEntity.id,
                            refund_amount: refundEntity.amount / 100,  // Convert paise to rupees
                            webhook_verified: true,
                        })
                        .eq("id", payment.id);

                    if (payment.order_id) {
                        await supabaseAdmin
                            .from("orders")
                            .update({ payment_status: "REFUNDED" })
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

        } else {
            // ───── UNHANDLED EVENT ─────
            console.log(`Unhandled webhook event: ${event}`);
        }

        // ──────────────────────────────────────────────
        // ALWAYS return 200 OK to Razorpay.
        // If you return an error, Razorpay will retry the webhook
        // up to 24 hours, which could cause duplicate processing.
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
