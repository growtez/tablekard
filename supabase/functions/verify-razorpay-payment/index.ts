// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not Node.js.
// VS Code may show import errors, but the functions deploy and work correctly.

// supabase/functions/verify-razorpay-payment/index.ts
//
// PURPOSE: Verify the Razorpay payment signature, then CREATE the order.
//          - Verifies HMAC-SHA256 signature (proves payment is real)
//          - Retrieves stored cart items from payment_logs
//          - Creates the order in orders + order_items tables
//          - Updates payments and orders tables
//
// CALLED BY: Frontend (paymentService.js) — immediately after Razorpay checkout succeeds
// THIS IS WHERE the order actually gets created!

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Generate a unique order number like "ORD-A1B2C3"
function generateOrderNumber(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ORD-${code}`;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // ──────────────────────────────────────────────
        // 0. Read environment variables
        // ──────────────────────────────────────────────
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay key secret not configured");
        }

        // ──────────────────────────────────────────────
        // 1. Parse request body
        // ──────────────────────────────────────────────
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            payment_id,         // Our internal payment ID (from create-razorpay-order response)
        } = await req.json();

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !payment_id) {
            return new Response(
                JSON.stringify({ error: "Missing required payment verification fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ──────────────────────────────────────────────
        // 2. Get the authenticated user
        // ──────────────────────────────────────────────
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Authorization required" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const supabaseUser = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: userError } = await supabaseUser.auth.getUser(
            authHeader.replace("Bearer ", "")
        );
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: "Invalid auth token" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ──────────────────────────────────────────────
        // 3. VERIFY the Razorpay signature
        //    signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
        // ──────────────────────────────────────────────
        const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const isValid = expectedSignature === razorpay_signature;

        // ──────────────────────────────────────────────
        // 4. Fetch the stored payment record
        // ──────────────────────────────────────────────
        const { data: paymentRecord, error: paymentError } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("id", payment_id)
            .eq("razorpay_order_id", razorpay_order_id)
            .single();

        if (paymentError || !paymentRecord) {
            return new Response(
                JSON.stringify({ error: "Payment record not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify the payment belongs to this user
        if (paymentRecord.user_id !== user.id) {
            return new Response(
                JSON.stringify({ error: "Unauthorized: payment does not belong to this user" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!isValid) {
            // ──────────────────────────────────────────────
            // ❌ SIGNATURE MISMATCH — possible tampering!
            // ──────────────────────────────────────────────
            console.error("Signature mismatch!", {
                expected: expectedSignature,
                received: razorpay_signature,
            });

            // Update payment status to FAILED
            await supabaseAdmin
                .from("payments")
                .update({
                    status: "FAILED",
                    razorpay_payment_id,
                    failure_reason: "Signature verification failed — possible tampering",
                })
                .eq("id", payment_id);

            // Log the failure
            await supabaseAdmin.from("payment_logs").insert({
                payment_id: payment_id,
                order_id: null,
                event_type: "SIGNATURE_MISMATCH",
                event_data: {
                    razorpay_order_id,
                    razorpay_payment_id,
                    expected_signature: expectedSignature.substring(0, 10) + "...",
                    received_signature: razorpay_signature.substring(0, 10) + "...",
                    user_id: user.id,
                },
            });

            return new Response(
                JSON.stringify({ error: "Payment verification failed" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ──────────────────────────────────────────────
        // ✅ SIGNATURE IS VALID — Payment is real!
        // Now we CREATE the order
        // ──────────────────────────────────────────────

        // ──────────────────────────────────────────────
        // 5. Retrieve stored cart items from payment_logs
        // ──────────────────────────────────────────────
        const { data: logEntry, error: logError } = await supabaseAdmin
            .from("payment_logs")
            .select("event_data")
            .eq("payment_id", payment_id)
            .eq("event_type", "ORDER_CREATED")
            .single();

        if (logError || !logEntry) {
            throw new Error("Cart data not found in payment logs");
        }

        const cartData = logEntry.event_data;
        const orderNumber = generateOrderNumber();

        // ──────────────────────────────────────────────
        // 6. CREATE the order (NOW — after payment is verified)
        // ──────────────────────────────────────────────
        const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
                customer_id: user.id,
                restaurant_id: cartData.restaurant_id,
                order_number: orderNumber,
                type: cartData.order_type || "DINE_IN",
                status: "CONFIRMED",                    // ✅ Immediately CONFIRMED (paid!)
                table_id: cartData.table_id || null,
                payment_method: "ONLINE",
                payment_status: "PAID",                  // ✅ Already paid
                subtotal: cartData.subtotal,
                taxes: cartData.taxes,
                discount: 0,
                total: cartData.amount || paymentRecord.amount,
            })
            .select("id, order_number")
            .single();

        if (orderError || !order) {
            console.error("Order creation failed:", orderError);
            throw new Error(`Failed to create order: ${orderError?.message}`);
        }

        // ──────────────────────────────────────────────
        // 7. CREATE order_items
        // ──────────────────────────────────────────────
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

        const { error: itemsError } = await supabaseAdmin
            .from("order_items")
            .insert(orderItems);

        if (itemsError) {
            console.error("Order items creation failed:", itemsError);
            // Don't throw — order is created, items failed. Log it.
        }

        // ──────────────────────────────────────────────
        // 8. UPDATE the payment record
        // ──────────────────────────────────────────────
        await supabaseAdmin
            .from("payments")
            .update({
                order_id: order.id,                // Link payment to order
                razorpay_payment_id,
                razorpay_signature,
                status: "PAID",
                paid_at: new Date().toISOString(),
            })
            .eq("id", payment_id);

        // ──────────────────────────────────────────────
        // 9. LOG: Payment success
        // ──────────────────────────────────────────────
        await supabaseAdmin.from("payment_logs").insert({
            payment_id: payment_id,
            order_id: order.id,
            event_type: "PAYMENT_SUCCESS",
            event_data: {
                razorpay_order_id,
                razorpay_payment_id,
                amount: paymentRecord.amount,
                order_number: order.order_number,
                order_id: order.id,
                verified_at: new Date().toISOString(),
            },
        });

        // ──────────────────────────────────────────────
        // 10. Return success to frontend
        // ──────────────────────────────────────────────
        return new Response(
            JSON.stringify({
                success: true,
                order_id: order.id,
                order_number: order.order_number,
                payment_status: "PAID",
                message: "Payment verified and order confirmed!",
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("verify-razorpay-payment error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
