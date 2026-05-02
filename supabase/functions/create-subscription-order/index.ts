// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not Node.js.

// supabase/functions/create-subscription-order/index.ts
//
// PURPOSE: Create a Razorpay order for SaaS subscription renewal.
//          - Validates plan duration and looks up FIXED price server-side
//          - Calls Razorpay Orders API
//          - Inserts a subscription_payments record
//          - Returns razorpay_order_id to the frontend
//
// NOTE: Currently uses the same platform Razorpay credentials.
//       In the future, customer-web will use per-restaurant Razorpay keys,
//       while this function will remain on the platform Razorpay account.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ──────────────────────────────────────────────
// Fixed subscription pricing (server-side only)
// ──────────────────────────────────────────────
const PLAN_PRICES: Record<number, number> = {
    1: 499,
    3: 1399,
    6: 2699,
    12: 4999,
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay credentials not configured");
        }

        // ── 1. Parse request ──
        const { restaurant_id, plan_duration } = await req.json();

        if (!restaurant_id || !plan_duration) {
            return new Response(
                JSON.stringify({ error: "restaurant_id and plan_duration are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── 2. Validate plan ──
        const price = PLAN_PRICES[plan_duration];
        if (!price) {
            return new Response(
                JSON.stringify({ error: `Invalid plan_duration. Allowed: ${Object.keys(PLAN_PRICES).join(", ")}` }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── 3. Authenticate user ──
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

        // ── 4. Verify restaurant membership ──
        const { data: membership, error: memberError } = await supabaseAdmin
            .from("restaurant_users")
            .select("id")
            .eq("restaurant_id", restaurant_id)
            .eq("profile_id", user.id)
            .eq("active", true)
            .maybeSingle();

        if (memberError || !membership) {
            return new Response(
                JSON.stringify({ error: "You are not a member of this restaurant" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── 5. Fetch restaurant name for Razorpay notes ──
        const { data: restaurant } = await supabaseAdmin
            .from("restaurants")
            .select("name")
            .eq("id", restaurant_id)
            .single();

        // ── 6. Create Razorpay Order ──
        const amountInPaise = Math.round(price * 100);

        const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: "INR",
                notes: {
                    type: "subscription",
                    restaurant_id,
                    restaurant_name: restaurant?.name || "",
                    plan_duration: String(plan_duration),
                    user_id: user.id,
                },
            }),
        });

        if (!razorpayResponse.ok) {
            const errorBody = await razorpayResponse.text();
            console.error("Razorpay API error:", errorBody);
            throw new Error(`Razorpay order creation failed: ${razorpayResponse.status}`);
        }

        const razorpayOrder = await razorpayResponse.json();

        // ── 7. Insert subscription_payments record ──
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from("subscription_payments")
            .insert({
                restaurant_id,
                user_id: user.id,
                plan_duration,
                amount: price,
                currency: "INR",
                razorpay_order_id: razorpayOrder.id,
                status: "pending",
            })
            .select("id")
            .single();

        if (paymentError) {
            console.error("Subscription payment insert error:", paymentError);
            throw new Error(`Failed to save payment: ${paymentError.message}`);
        }

        // ── 8. Return to frontend ──
        return new Response(
            JSON.stringify({
                success: true,
                razorpay_order_id: razorpayOrder.id,
                razorpay_key_id: RAZORPAY_KEY_ID,
                amount: amountInPaise,
                currency: "INR",
                payment_id: payment.id,
                plan_duration,
                plan_price: price,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("create-subscription-order error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
