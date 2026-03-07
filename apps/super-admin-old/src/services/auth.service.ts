import { supabase } from '@restaurant-saas/supabase';
import type { User } from '@supabase/supabase-js';
import { UserRole } from '@restaurant-saas/types';

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
}

export const authService = {
    async fetchProfile(user: User): Promise<UserProfile | null> {
        // 1. Bypass the database check for our Super Admin UID
        if (user.id === '5ed77283-f881-4106-871e-f2d55ddbf717') {
            return {
                id: user.id,
                email: user.email ?? 'admin@tablekard.com',
                name: 'Super Admin',
                role: UserRole.SUPER_ADMIN
            };
        }

        // 2. For normal users, fetch from the profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('id,email,name,role')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.warn('Failed to fetch profile:', error.message);
            return null;
        }
        if (!data) return null;
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role as UserRole
        };
    },

    async getSession() {
        return await supabase.auth.getSession();
    },

    onAuthStateChange(callback: (event: any, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    async signIn(email: string, password: string): Promise<User> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
            throw error ?? new Error('Failed to sign in');
        }
        return data.user;
    },

    async signUp(email: string, password: string, name: string): Promise<User> {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role: UserRole.SUPER_ADMIN }
            }
        });
        if (error || !data.user) {
            throw error ?? new Error('Failed to create account');
        }

        const { error: profileError } = await (supabase.from('profiles') as any).upsert({
            id: data.user.id,
            email: data.user.email ?? email,
            name,
            role: UserRole.SUPER_ADMIN
        });
        if (profileError) {
            console.warn('Failed to upsert profile:', profileError.message);
        }

        return data.user;
    },

    async signOut(): Promise<void> {
        await supabase.auth.signOut();
    },

    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (error) throw error;
    }
};

export default authService;
