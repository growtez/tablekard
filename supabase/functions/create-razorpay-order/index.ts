// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not Node.js.
// VS Code may show import errors, but the functions deploy and work correctly.

// supabase/functions/create-razorpay-order/index.ts
// 
// PURPOSE: Create a Razorpay order BEFORE the customer pays.
//          - Fetches real prices from menu_items (prevents price tampering)
//          - Calls Razorpay Orders API
//          - Stores cart items temporarily in payments table
//          - Returns razorpay_order_id to frontend
//
// CALLED BY: Frontend (paymentService.js)
// DOES NOT: Create an order in the orders table (that happens after payment verification)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // ──────────────────────────────────────────────
        // 0. Read environment variables
        // ──────────────────────────────────────────────
        const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay credentials not configured");
        }

        // ──────────────────────────────────────────────
        // 1. Parse request body
        // ──────────────────────────────────────────────
        const {
            restaurant_id,
            table_id,
            order_type,    // 'DINE_IN' or 'TAKEAWAY'
            items,         // [{ menu_item_id, quantity, variant, addons, special_instructions }]
        } = await req.json();

        if (!restaurant_id || !items || items.length === 0) {
            return new Response(
                JSON.stringify({ error: "restaurant_id and items are required" }),
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

        // Create Supabase client with user's auth token (for reading menu items)
        const supabaseUser = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
            global: { headers: { Authorization: authHeader } },
        });

        // Service role client (for inserting into payments — bypasses RLS)
        const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Get user ID from auth token
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
        // 3. Fetch REAL prices from menu_items table
        //    (prevents customer from sending fake prices)
        // ──────────────────────────────────────────────
        const menuItemIds = items.map((item: any) => item.menu_item_id);

        const { data: menuItems, error: menuError } = await supabaseAdmin
            .from("menu_items")
            .select("id, name, price, discount_price, is_available, restaurant_id")
            .in("id", menuItemIds)
            .eq("restaurant_id", restaurant_id);

        if (menuError || !menuItems) {
            throw new Error(`Failed to fetch menu items: ${menuError?.message}`);
        }

        // Validate all items exist and are available
        const menuMap = new Map(menuItems.map((mi: any) => [mi.id, mi]));
        const validatedItems: any[] = [];
        let subtotal = 0;

        for (const item of items) {
            const menuItem = menuMap.get(item.menu_item_id);
            if (!menuItem) {
                return new Response(
                    JSON.stringify({ error: `Menu item not found: ${item.menu_item_id}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            if (!menuItem.is_available) {
                return new Response(
                    JSON.stringify({ error: `Item "${menuItem.name}" is currently unavailable` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Use discount_price if available, otherwise regular price
            const unitPrice = menuItem.discount_price || menuItem.price;
            const itemTotal = unitPrice * item.quantity;

            validatedItems.push({
                menu_item_id: menuItem.id,
                name: menuItem.name,
                price: unitPrice,
                quantity: item.quantity,
                total: itemTotal,
                variant: item.variant || null,
                addons: item.addons || null,
                special_instructions: item.special_instructions || null,
            });

            subtotal += itemTotal;
        }

        // ──────────────────────────────────────────────
        // 4. Fetch restaurant settings for tax calculation
        // ──────────────────────────────────────────────
        const { data: restaurant, error: restError } = await supabaseAdmin
            .from("restaurants")
            .select("id, name, settings, slug")
            .eq("id", restaurant_id)
            .single();

        if (restError || !restaurant) {
            throw new Error(`Restaurant not found: ${restError?.message}`);
        }

        const taxPercentage = restaurant.settings?.tax_percentage || 0;
        const taxes = Math.round((subtotal * taxPercentage) / 100 * 100) / 100;
        const total = Math.round((subtotal + taxes) * 100) / 100;

        // ──────────────────────────────────────────────
        // 5. Create Razorpay Order via API
        //    Amount is in PAISE (₹735 = 73500 paise)
        // ──────────────────────────────────────────────
        const amountInPaise = Math.round(total * 100);

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
                    restaurant_id: restaurant_id,
                    restaurant_name: restaurant.name,
                    customer_id: user.id,
                    items_count: items.length,
                },
            }),
        });

        if (!razorpayResponse.ok) {
            const errorBody = await razorpayResponse.text();
            console.error("Razorpay API error:", errorBody);
            throw new Error(`Razorpay order creation failed: ${razorpayResponse.status}`);
        }

        const razorpayOrder = await razorpayResponse.json();

        // ──────────────────────────────────────────────
        // 6. Save payment record in our database
        //    Store cart items in event_data for later use
        //    (when payment is verified, we'll use this to create the order)
        // ──────────────────────────────────────────────
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from("payments")
            .insert({
                user_id: user.id,
                restaurant_id: restaurant_id,
                order_id: null,  // No order yet — will be linked after verification
                amount: total,
                currency: "INR",
                gateway: "razorpay",
                razorpay_order_id: razorpayOrder.id,
                status: "PENDING",
            })
            .select("id")
            .single();

        if (paymentError) {
            console.error("Payment insert error:", paymentError);
            throw new Error(`Failed to save payment: ${paymentError.message}`);
        }

        // ──────────────────────────────────────────────
        // 7. Log the event in payment_logs
        //    Store the cart items here for retrieval during verification
        // ──────────────────────────────────────────────
        await supabaseAdmin.from("payment_logs").insert({
            payment_id: payment.id,
            order_id: null,
            event_type: "ORDER_CREATED",
            event_data: {
                razorpay_order_id: razorpayOrder.id,
                amount: total,
                amount_in_paise: amountInPaise,
                subtotal,
                taxes,
                tax_percentage: taxPercentage,
                restaurant_id,
                restaurant_name: restaurant.name,
                table_id: table_id || null,
                order_type: order_type || "DINE_IN",
                customer_id: user.id,
                items: validatedItems,  // Store validated cart items for later
            },
        });

        // ──────────────────────────────────────────────
        // 8. Return response to frontend
        // ──────────────────────────────────────────────
        return new Response(
            JSON.stringify({
                success: true,
                razorpay_order_id: razorpayOrder.id,
                razorpay_key_id: RAZORPAY_KEY_ID,
                amount: amountInPaise,
                currency: "INR",
                payment_id: payment.id, // Our internal payment ID
                order_summary: {
                    subtotal,
                    taxes,
                    total,
                    items_count: validatedItems.length,
                },
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("create-razorpay-order error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
