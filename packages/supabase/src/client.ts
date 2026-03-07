import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@restaurant-saas/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

// Use a global singleton to prevent multiple Supabase client instances
// during Vite HMR reloads. Multiple instances cause Web Lock conflicts.
const GLOBAL_KEY = '__supabase_admin_client_v3__';

function getOrCreateClient(): SupabaseClient<Database> {
    const existing = (globalThis as any)[GLOBAL_KEY] as SupabaseClient<Database> | undefined;
    if (existing) {
        return existing;
    }

    const client = createClient<Database>(
        supabaseUrl ?? '',
        supabaseAnonKey ?? '',
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                // Use a unique storage key per app to avoid cross-tab conflicts
                storageKey: 'tablekard-admin-auth',
                // Avoid navigator.locks deadlock on tab focus / HMR
                lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
                    return await fn();
                }
            }
        }
    );

    (globalThis as any)[GLOBAL_KEY] = client;
    return client;
}

export const supabase: SupabaseClient<Database> = getOrCreateClient();

export const getSupabaseClient = (): SupabaseClient<Database> => supabase;
