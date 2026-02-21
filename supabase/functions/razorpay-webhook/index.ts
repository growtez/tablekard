import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Read the body as text to properly calculate the HMAC signature
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            console.error("Missing x-razorpay-signature header");
            return new Response("Missing signature", { status: 400 });
        }

        if (!RAZORPAY_WEBHOOK_SECRET) {
            console.error("Missing RAZORPAY_WEBHOOK_SECRET environment variable");
            return new Response("Server configuration error", { status: 500 });
        }

        // 1. Verify webhook signature
        // The signature is an HMAC hex digest of the request body using the webhook secret
        const expectedSignature = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("Webhook signature mismatch", { expected: expectedSignature, received: signature });
            return new Response("Invalid signature", { status: 400 });
        }

        const event = JSON.parse(body);
        const eventType = event.event;

        console.log(`Received verified webhook event: ${eventType}`);

        // 2. Handle different webhook events
        switch (eventType) {
            case "payment.captured": {
                const payment = event.payload.payment.entity;
                const razorpayOrderId = payment.order_id;
                const razorpayPaymentId = payment.id;
                const method = payment.method;      // e.g. 'upi', 'card', 'netbanking'

                // 3a. Update payment record
                const { error: paymentUpdateError } = await supabase
                    .from("payments")
                    .update({
                        status: "CAPTURED",
                        razorpay_payment_id: razorpayPaymentId,
                        method: method,
                        method_details: payment.card || payment.upi || payment.wallet || null,
                        webhook_verified: true,
                        webhook_event_id: event.event_id || null,
                        paid_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq("razorpay_order_id", razorpayOrderId);

                if (paymentUpdateError) {
                    console.error("Failed to update payment record:", paymentUpdateError);
                    // Return 500 so Razorpay retries the webhook
                    return new Response("Database error", { status: 500 });
                }

                // 3b. Fetch the order_id from the payments table to update the associated order
                const { data: paymentRecord, error: fetchPaymentError } = await supabase
                    .from("payments")
                    .select("id, order_id")
                    .eq("razorpay_order_id", razorpayOrderId)
                    .maybeSingle();

                if (fetchPaymentError) {
                    console.error("Failed to fetch payment record for order_id:", fetchPaymentError);
                }

                if (paymentRecord && paymentRecord.order_id) {
                    // 3c. Update the order
                    const { error: orderUpdateError } = await supabase
                        .from("orders")
                        .update({
                            payment_status: "PAID",
                            transaction_id: razorpayPaymentId, // Fast lookup
                            payment_method: "ONLINE",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", paymentRecord.order_id);

                    if (orderUpdateError) {
                        console.error("Failed to update order record:", orderUpdateError);
                    }

                    // 3d. Log success in payment_logs
                    await supabase.from("payment_logs").insert({
                        payment_id: paymentRecord.id,
                        order_id: paymentRecord.order_id,
                        event_type: "WEBHOOK_PAYMENT_CAPTURED",
                        event_data: event, // Save the full Razorpay payload
                    });
                }

                break;
            }

            case "payment.failed": {
                const payment = event.payload.payment.entity;
                const razorpayOrderId = payment.order_id;
                // ... Handle failures if necessary
                console.log(`Payment failed for order ${razorpayOrderId}`);
                const { data: paymentRecord } = await supabase
                    .from("payments")
                    .select("id, order_id")
                    .eq("razorpay_order_id", razorpayOrderId)
                    .maybeSingle();

                if (paymentRecord) {
                    await supabase.from("payments").update({
                        status: "FAILED",
                        failure_reason: payment.error_description || "Payment failed",
                        failure_code: payment.error_code || null,
                        updated_at: new Date().toISOString()
                    }).eq("id", paymentRecord.id);

                    await supabase.from("orders").update({
                        payment_status: "FAILED",
                        updated_at: new Date().toISOString()
                    }).eq("id", paymentRecord.order_id);

                    await supabase.from("payment_logs").insert({
                        payment_id: paymentRecord.id,
                        order_id: paymentRecord.order_id,
                        event_type: "WEBHOOK_PAYMENT_FAILED",
                        event_data: event,
                    });
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event type: ${eventType}`);
        }

        // Return 200 OK so Razorpay knows we received it successfully
        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (err) {
        console.error("Unexpected error processing webhook:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
});
