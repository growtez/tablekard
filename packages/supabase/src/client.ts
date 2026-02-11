import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@restaurant-saas/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl ?? '',
    supabaseAnonKey ?? '',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

export const getSupabaseClient = (): SupabaseClient<Database> => supabase;
