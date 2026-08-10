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
        const { name, email, password, role, restaurant_id } = body;

        if (!name || !email || !password || !role || !restaurant_id) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
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

        const callerId = user.id;

        // Initialize admin client to bypass RLS for subsequent checks and writes
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 2. Authorize: Ensure caller is an admin for this specific restaurant
        const { data: adminRecord, error: adminCheckError } = await supabaseAdmin
            .from("restaurant_users")
            .select("role")
            .eq("profile_id", callerId)
            .eq("restaurant_id", restaurant_id)
            .single();

        if (adminCheckError || !adminRecord || adminRecord.role !== 'admin') {
             return new Response(JSON.stringify({ error: "Forbidden: You are not an admin for this restaurant" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 3. Create the user in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
                name: name
            }
        });

        if (authError) {
            return new Response(JSON.stringify({ error: authError.message }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const newUserId = authData.user.id;
        const globalRole = role === 'admin' ? 'restaurant_admin' : 'restaurant_staff';

        // 4. Upsert Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUserId,
                email: email.trim().toLowerCase(),
                name: name,
                role: globalRole
            });

        if (profileError) {
             return new Response(JSON.stringify({ error: "Failed to create profile" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 5. Link user to restaurant
        const { error: restUserError } = await supabaseAdmin
            .from('restaurant_users')
            .insert({
                restaurant_id: restaurant_id,
                profile_id: newUserId,
                role: role,
                active: true
            });

        if (restUserError) {
             return new Response(JSON.stringify({ error: "Failed to link user to restaurant" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(
            JSON.stringify({ success: true, message: "Team member created successfully", user_id: newUserId }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("create-team-member error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
