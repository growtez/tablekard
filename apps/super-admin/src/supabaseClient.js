/**
 * lib/supabaseClient.js
 * Helper to initialize the Supabase client.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// Use service key for admin operations (use with caution on client side)
// For production, move admin operations to backend
const apiKey = supabaseServiceKey || supabasePublishableKey

console.log('Supabase: Initializing client at', supabaseUrl);
export const supabase = createClient(supabaseUrl, apiKey)