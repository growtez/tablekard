// Authentication Context for Customer Web (Supabase)
import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import { UserRole } from '@restaurant-saas/types';

const AuthContext = createContext(null);

// Error helper to check for AbortError
const isAbortError = (err) =>
    err && (
        err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('aborted') ||
        err.message?.toLowerCase().includes('signal is aborted') ||
        err.message?.toLowerCase().includes('signal was aborted')
    );

async function fetchProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id,email,name,role,avatar_url')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            if (isAbortError(error)) return null;
            console.warn('Failed to fetch profile:', error.message);
            return null;
        }
        return data;
    } catch (err) {
        if (!isAbortError(err)) {
            console.error('fetchProfile unexpected error:', err);
        }
        return null;
    }
}

async function upsertCustomerProfile(user) {
    if (!user) return null;
    try {
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
            if (isAbortError(error)) return null;
            console.warn('Failed to upsert profile:', error.message);
            return null;
        }
        return data;
    } catch (err) {
        if (!isAbortError(err)) {
            console.error('upsertCustomerProfile unexpected error:', err);
        }
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const isInitialized = useRef(false);
    const activeUserId = useRef(null);

    useEffect(() => {
        let mounted = true;

        // Safety timeout: never let loading hang more than 3 seconds
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('[Auth] Safety timeout: forcing loading to false');
                setLoading(false);
            }
        }, 3000);

        const handleAuthChange = async (session) => {
            if (!mounted) return;
            const nextUser = session?.user ?? null;

            // Only update if the user ID actually changed or we're not initialized
            if (!isInitialized.current || nextUser?.id !== activeUserId.current) {
                activeUserId.current = nextUser?.id || null;
                setUser(nextUser);

                if (nextUser) {
                    try {
                        const profile = await upsertCustomerProfile(nextUser);
                        if (mounted && activeUserId.current === nextUser.id) {
                            setUserProfile(profile);
                        }
                    } catch (err) {
                        if (!isAbortError(err)) console.error('Profile update error:', err);
                    }
                } else {
                    if (mounted) setUserProfile(null);
                }
            }

            if (mounted) setLoading(false);
            isInitialized.current = true;
        };

        const init = async () => {
            try {
                // Get initial session
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    if (!isAbortError(error)) throw error;
                } else if (mounted) {
                    await handleAuthChange(data.session);
                }
            } catch (err) {
                if (!isAbortError(err)) {
                    console.error('Auth initialization error:', err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        init();

        // Listen for changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                activeUserId.current = null;
                setUser(null);
                setUserProfile(null);
                setLoading(false);
                return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                await handleAuthChange(session);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async (redirectToOverride) => {
        try {
            const redirectTo = redirectToOverride || import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo }
            });
            if (error) throw error;
        } catch (err) {
            if (!isAbortError(err)) throw err;
        }
    };

    const sendMagicLink = async (email, redirectToOverride) => {
        try {
            const redirectTo = redirectToOverride || import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin;
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: redirectTo }
            });
            if (error) throw error;
        } catch (err) {
            if (!isAbortError(err)) throw err;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            activeUserId.current = null;
            setUser(null);
            setUserProfile(null);
        } catch (err) {
            if (!isAbortError(err)) console.error('Logout error:', err);
        }
    };

    const updateUserProfile = async (data) => {
        if (!user) return;
        try {
            const { data: updated, error } = await supabase
                .from('profiles')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select('id,email,name,role,avatar_url')
                .maybeSingle();

            if (error) {
                if (isAbortError(error)) return;
                throw error;
            }
            setUserProfile(updated);
        } catch (err) {
            if (!isAbortError(err)) throw err;
        }
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
