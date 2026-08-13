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

        // 3. Generate Magic Link
        const { data, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: redirectTo || Deno.env.get("VITE_SUPABASE_REDIRECT_URL") || "http://localhost:3002"
            }
        });

        if (generateError) {
            console.error("Error generating magic link:", generateError);
            return new Response(
                JSON.stringify({ error: generateError.message || "Could not generate magic link." }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const actionLink = data.properties?.action_link;
        if (!actionLink) {
             throw new Error("Action link not generated");
        }

        // 4. Send email via Brevo REST API
        const emailHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
                    <h2 style="color: #111827; margin-top: 0; font-size: 24px; text-align: center; font-weight: 600;">Sign in to Tablekard</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                        Click the secure button below to seamlessly sign in to your account and continue your dining experience.
                    </p>
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${actionLink}" style="background-color: #8B3A1E; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(139, 58, 30, 0.2);">Sign In Securely</a>
                    </div>
                    <p style="color: #6b7280; font-size: 13px; text-align: center; margin-bottom: 30px; word-break: break-all; line-height: 1.5;">
                        Or if the sign in button does not work, copy and paste this URL into your browser:<br>
                        <a href="${actionLink}" style="color: #8B3A1E; text-decoration: underline;">${actionLink}</a>
                    </p>
                    <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-bottom: 0; line-height: 1.5;">
                        This link will securely sign you in. If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
                    <p>The Tablekard Team</p>
                </div>
            </div>
        `;

        const brevoPayload = {
            sender: {
                name: BREVO_SENDER_NAME,
                email: BREVO_SENDER_EMAIL
            },
            to: [{ email: email }],
            subject: "Your Tablekard Sign In Link",
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
