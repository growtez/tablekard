// Authentication Context for Customer Web (Supabase)
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import { UserRole } from '@restaurant-saas/types';

const AuthContext = createContext(null);

async function upsertCustomerProfile(user) {
    if (!user) return null;
    const metadata = user.user_metadata || {};
    const existing = await fetchProfile(user.id);
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.email,
            name: metadata.full_name || metadata.name || null,
            avatar_url: metadata.avatar_url || null,
            role: existing?.role || UserRole.CUSTOMER
        })
        .select('id,email,name,role,avatar_url')
        .maybeSingle();
    if (error) {
        console.warn('Failed to upsert profile:', error.message);
        return null;
    }
    return data;
}

async function fetchProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id,email,name,role,avatar_url')
        .eq('id', userId)
        .maybeSingle();
    if (error) {
        console.warn('Failed to fetch profile:', error.message);
        return null;
    }
    return data;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data } = await supabase.auth.getSession();
            const sessionUser = data.session?.user ?? null;
            if (!mounted) return;
            setUser(sessionUser);
            if (sessionUser) {
                const profile = await upsertCustomerProfile(sessionUser);
                setUserProfile(profile);
            }
            setLoading(false);
        };

        init();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            if (nextUser) {
                const profile = await upsertCustomerProfile(nextUser);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async (redirectToOverride) => {
        const redirectTo = redirectToOverride || import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo }
        });
        if (error) throw error;
    };

    const sendMagicLink = async (email, redirectToOverride) => {
        const redirectTo = redirectToOverride || import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin;
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo }
        });
        if (error) throw error;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
    };

    const updateUserProfile = async (data) => {
        if (!user) return;
        const { data: updated, error } = await supabase
            .from('profiles')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select('id,email,name,role,avatar_url')
            .maybeSingle();
        if (error) throw error;
        setUserProfile(updated);
    };

    const value = useMemo(() => ({
        user,
        userProfile,
        loading,
        signInWithGoogle,
        sendMagicLink,
        logout,
        updateUserProfile,
        isAuthenticated: !!user
    }), [user, userProfile, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
