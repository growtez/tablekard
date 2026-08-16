declare const Deno: any;
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
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
        const { member_id, profile_id, name, email, role, restaurant_id, avatar_url } = body;

        if (!member_id || !profile_id || !name || !role || !restaurant_id) {
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

        // 2. Authorize: Ensure caller is an admin for this specific restaurant or a super_admin
        const { data: callerProfile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", callerId)
            .maybeSingle();

        const isSuperAdmin = callerProfile?.role === 'super_admin';

        if (!isSuperAdmin) {
            const { data: adminRecord, error: adminCheckError } = await supabaseAdmin
                .from("restaurant_users")
                .select("role")
                .eq("profile_id", callerId)
                .eq("restaurant_id", restaurant_id)
                .maybeSingle();

            const isRestAdmin = adminRecord && (adminRecord.role === 'admin' || adminRecord.role === 'restaurant_admin');

            if (adminCheckError || !isRestAdmin) {
                 return new Response(JSON.stringify({ error: "Forbidden: You are not an admin for this restaurant" }), {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // 3. Update Auth email if email provided and changed
        if (email) {
            const normalizedEmail = email.trim().toLowerCase();
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(profile_id, {
                email: normalizedEmail,
                email_confirm: true,
                user_metadata: { name: name }
            });

            if (authUpdateError) {
                console.error("Failed to update auth email:", authUpdateError);
                return new Response(JSON.stringify({ error: authUpdateError.message }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // 4. Update Profile
        const profilePayload: any = {
            name: name
        };
        if (email) {
            profilePayload.email = email.trim().toLowerCase();
        }
        if (avatar_url !== undefined) {
            profilePayload.avatar_url = avatar_url;
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(profilePayload)
            .eq('id', profile_id);

        if (profileError) {
             return new Response(JSON.stringify({ error: "Failed to update profile" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 5. Update restaurant_users role
        const { error: restUserError } = await supabaseAdmin
            .from('restaurant_users')
            .update({ role: role })
            .eq('id', member_id);

        if (restUserError) {
             return new Response(JSON.stringify({ error: "Failed to update member role" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(
            JSON.stringify({ success: true, message: "Team member updated successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("update-team-member error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
