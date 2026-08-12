import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const body = await req.json();
        const { action } = body;

        if (!action || !['create_restaurant', 'create_user'].includes(action)) {
            return new Response(JSON.stringify({ error: "Invalid action" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // 1. Verify caller identity using their JWT
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Initialize admin client
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 2. Authorize: Ensure caller is a super_admin
        const { data: callerProfile, error: callerCheckError } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (callerCheckError || !callerProfile || callerProfile.role !== 'super_admin') {
             return new Response(JSON.stringify({ error: "Forbidden: You are not a super admin" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (action === 'create_restaurant') {
            const { restaurant, admin_password } = body;
            
            let authData = null;
            if (admin_password) {
                const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: restaurant.contact_email.trim().toLowerCase(),
                    password: admin_password,
                    email_confirm: true
                });
                
                if (authError) {
                    throw new Error(`Admin account failed: ${authError.message}. Restaurant not created.`);
                }
                authData = data;
            }

            const { data: newRes, error: resError } = await supabaseAdmin
                .from('restaurants')
                .insert([restaurant])
                .select()
                .single();
            
            if (resError) {
                if (authData) {
                    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                }
                throw new Error(`Failed to create restaurant: ${resError.message}`);
            }

            if (authData) {
                await supabaseAdmin
                    .from('profiles')
                    .update({ role: 'restaurant_admin' })
                    .eq('id', authData.user.id);

                await supabaseAdmin
                    .from('restaurant_users')
                    .insert({
                        restaurant_id: newRes.id,
                        profile_id: authData.user.id,
                        role: 'admin',
                        active: true
                    });
            }

            return new Response(
                JSON.stringify({ success: true, message: "Restaurant created successfully", restaurant: newRes }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else if (action === 'create_user') {
            const { userData } = body;
            
            const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: userData.email.trim().toLowerCase(),
                password: userData.password,
                email_confirm: true
            });

            if (authError) {
                throw new Error(`Failed to create user: ${authError.message}`);
            }

            const newUserId = data.user.id;

            await supabaseAdmin
                .from('profiles')
                .update({ role: userData.role })
                .eq('id', newUserId);

            if (['restaurant_admin', 'restaurant_staff'].includes(userData.role)) {
                const restaurantRole = userData.role === 'restaurant_admin' ? 'admin' : 'staff';
                await supabaseAdmin
                    .from('restaurant_users')
                    .insert({
                        restaurant_id: userData.restaurantId,
                        profile_id: newUserId,
                        role: restaurantRole,
                        active: true
                    });
            }

            return new Response(
                JSON.stringify({ success: true, message: "User created successfully" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

    } catch (error: any) {
        console.error("create-admin-user error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
