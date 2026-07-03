// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not Node.js.

// supabase/functions/verify-subscription-payment/index.ts
//
// PURPOSE: Verify Razorpay signature for subscription payment, then
//          activate / extend the restaurant's subscription.
//
// LOGIC:
//   - If restaurant has no active subscription → starts_at = now
//   - If restaurant has an active subscription with future end date → starts_at = current end date
//     (stacking: new period starts after the current one expires)
//   - ends_at = starts_at + plan_duration months

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay key secret not configured");
        }

        // ── 1. Parse request ──
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            payment_id,
        } = await req.json();

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !payment_id) {
            return new Response(
                JSON.stringify({ error: "Missing required payment verification fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── 2. Authenticate user ──
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Authorization required" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
            authHeader.replace("Bearer ", "")
        );
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: "Invalid auth token" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── 3. Verify Razorpay signature ──
        const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const isValid = expectedSignature === razorpay_signature;

        // ── 4. Fetch subscription payment record ──
        const { data: paymentRecord, error: paymentError } = await supabaseAdmin
            .from("subscription_payments")
            .select("*")
            .eq("id", payment_id)
            .eq("razorpay_order_id", razorpay_order_id)
            .single();

        if (paymentError || !paymentRecord) {
            return new Response(
                JSON.stringify({ error: "Subscription payment record not found" }),
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
            // ❌ SIGNATURE MISMATCH
            console.error("Subscription payment signature mismatch!", {
                expected: expectedSignature,
                received: razorpay_signature,
            });

            await supabaseAdmin
                .from("subscription_payments")
                .update({
                    status: "failed",
                    razorpay_payment_id,
                })
                .eq("id", payment_id);

            return new Response(
                JSON.stringify({ error: "Payment verification failed" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── 5. ✅ PAYMENT VERIFIED — Calculate subscription period ──
        const restaurantId = paymentRecord.restaurant_id;
        const planDuration = paymentRecord.plan_duration; // in months
        const planName = paymentRecord.plan_name;          // snapshotted at order creation
        const now = new Date();

        // Fetch current restaurant status and subscription end date
        const { data: restaurant } = await supabaseAdmin
            .from("restaurants")
            .select("status, subscription_end_at")
            .eq("id", restaurantId)
            .single();

        // Guard: only 'approved' or 'active' restaurants can activate a subscription.
        // 'pending' and 'rejected' must be onboarded by a super-admin first.
        if (!restaurant || !["approved", "active"].includes(restaurant.status)) {
            return new Response(
                JSON.stringify({ error: "Restaurant must be approved before subscribing" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Stack if currently 'active' with a future end date; otherwise start fresh.
        // 'approved' restaurant (first payment) always starts from now.
        let startsAt: Date;
        if (
            restaurant.status === "active" &&
            restaurant.subscription_end_at &&
            new Date(restaurant.subscription_end_at) > now
        ) {
            startsAt = new Date(restaurant.subscription_end_at); // renewal — stack
        } else {
            startsAt = now; // first payment or lapsed subscription
        }

        const endsAt = addMonths(startsAt, planDuration);

        // 3-day grace period: restaurant stays 'active' for 3 extra days after expiry
        const gracePeriodEndsAt = new Date(endsAt);
        gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 3);

        // ── 6. Update subscription_payments record ──
        await supabaseAdmin
            .from("subscription_payments")
            .update({
                razorpay_payment_id,
                razorpay_signature,
                status: "paid",
                paid_at: now.toISOString(),
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
            })
            .eq("id", payment_id);

        // ── 7. Activate / extend restaurant subscription ──
        // NOTE: intentionally transitions 'approved' → 'active' on first payment.
        await supabaseAdmin
            .from("restaurants")
            .update({
                status: "active",                                       // access control gate
                subscription_status: true,                              // UI billing badge
                subscription_type: planName ?? "QR",                   // plan name snapshot
                subscription_end_at: endsAt.toISOString(),
                grace_period_ends_at: gracePeriodEndsAt.toISOString(), // auto-suspend after this
            })
            .eq("id", restaurantId);

        // ── 8. Return success ──
        return new Response(
            JSON.stringify({
                success: true,
                message: "Subscription payment verified and activated",
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
                plan_duration: planDuration,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("verify-subscription-payment error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
