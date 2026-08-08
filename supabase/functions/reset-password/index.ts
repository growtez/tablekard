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
        const { email, redirectTo } = await req.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: "Email is required" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 1. Get Environment variables
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        
        // Use environment variables from local .env or supabase dashboard
        const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
        const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@tablekard.com";
        const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "Tablekard";

        if (!BREVO_API_KEY) {
            console.error("Missing BREVO_API_KEY");
            return new Response(
                JSON.stringify({ error: "Email configuration is missing on the server." }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 3. Generate Password Reset Link
        const { data, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: redirectTo || Deno.env.get("VITE_SUPABASE_REDIRECT_URL") || "http://localhost:3003"
            }
        });

        if (generateError) {
            console.error("Error generating reset link:", generateError);
            return new Response(
                JSON.stringify({ error: "Account with this email does not exist." }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const actionLink = data.properties?.action_link;
        if (!actionLink) {
             throw new Error("Action link not generated");
        }

        // 4. Send email via Brevo REST API
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #8B3A1E;">Tablekard Password Reset</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your account associated with ${email}.</p>
                <p>Please click the button below to reset your password. This link will expire soon.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${actionLink}" style="background-color: #8B3A1E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>The Tablekard Team</p>
            </div>
        `;

        const brevoPayload = {
            sender: {
                name: BREVO_SENDER_NAME,
                email: BREVO_SENDER_EMAIL
            },
            to: [{ email: email }],
            subject: "Reset your Tablekard password",
            htmlContent: emailHtml
        };

        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify(brevoPayload)
        });

        if (!brevoRes.ok) {
            const brevoError = await brevoRes.text();
            console.error("Brevo API error:", brevoError);
            throw new Response(
                JSON.stringify({ error: "Failed to send email via Brevo" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "Reset email sent successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("reset-password error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
