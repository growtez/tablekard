import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { restaurantId, accountNumber, ifsc, beneficiaryName, businessName } = await req.json();

    if (!restaurantId || !accountNumber || !ifsc || !beneficiaryName) {
      throw new Error('Missing required fields');
    }

    // Get the Master Razorpay API keys
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Master Razorpay keys are not configured');
    }

    // Call Razorpay API to create a linked account
    // We use the v1/beta/accounts endpoint which supports bank_account in the payload
    const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
    
    // Generate a dummy email if none is provided, as Razorpay requires an email
    const dummyEmail = `vendor_${restaurantId.replace(/-/g, '').substring(0, 10)}@tablekard.com`;

    const razorpayRes = await fetch('https://api.razorpay.com/v1/beta/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        name: businessName || beneficiaryName,
        email: dummyEmail,
        tnc_accepted: true,
        account_details: {
          business_name: businessName || beneficiaryName,
          business_type: "proprietorship"
        },
        bank_account: {
          ifsc_code: ifsc,
          beneficiary_name: beneficiaryName,
          account_number: accountNumber
        }
      }),
    });

    const razorpayData = await razorpayRes.json();

    if (!razorpayRes.ok) {
      console.error('Razorpay Error:', razorpayData);
      throw new Error(razorpayData.error?.description || 'Failed to create Linked Account in Razorpay');
    }

    const linkedAccountId = razorpayData.id;

    if (!linkedAccountId) {
        throw new Error('Razorpay did not return an account ID');
    }

    // Save it to Supabase using the RPC
    const { error: dbError } = await supabase.rpc('upsert_restaurant_payment_settings', {
      p_restaurant_id: restaurantId,
      p_online_payments_enabled: true,
      p_razorpay_linked_account_id: linkedAccountId,
      p_razorpay_key_id: null,
      p_razorpay_key_secret: null,
      p_razorpay_webhook_secret: null
    });

    if (dbError) {
      console.error('DB Error:', dbError);
      throw new Error('Failed to save Linked Account ID to database');
    }

    return new Response(JSON.stringify({ success: true, linkedAccountId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
