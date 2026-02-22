// Authentication Context for Super Admin (Supabase)
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import type { User } from '@supabase/supabase-js';
import { UserRole } from '@restaurant-saas/types';

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    createAccount: (email: string, password: string, name: string) => Promise<User>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

// Updated to accept the full User object instead of just the string ID
async function fetchProfile(user: User): Promise<UserProfile | null> {
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
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data } = await supabase.auth.getSession();
            const currentUser = data.session?.user ?? null;
            if (!mounted) return;
            setUser(currentUser);
            if (currentUser) {
                // Updated to pass the currentUser object
                const profile = await fetchProfile(currentUser);
                if (!mounted) return;
                setUserProfile(profile);
            }
            setLoading(false);
        };

        init();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            if (nextUser) {
                // Updated to pass the nextUser object
                const profile = await fetchProfile(nextUser);
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

    const signIn = async (email: string, password: string): Promise<User> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
            throw error ?? new Error('Failed to sign in');
        }

        // Updated to pass the data.user object
        const profile = await fetchProfile(data.user);
        
        if (!profile || profile.role !== UserRole.SUPER_ADMIN) {
            await supabase.auth.signOut();
            throw new Error('You are not authorized to access the super admin panel');
        }

        setUserProfile(profile);
        return data.user;
    };

    const createAccount = async (email: string, password: string, name: string): Promise<User> => {
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

        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email ?? email,
            name,
            role: UserRole.SUPER_ADMIN
        });
        if (profileError) {
            console.warn('Failed to upsert profile:', profileError.message);
        }

        return data.user;
    };

    const signOut = async (): Promise<void> => {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
    };

    const resetPassword = async (email: string): Promise<void> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (error) throw error;
    };

    const value: AuthContextType = useMemo(() => ({
        user,
        userProfile,
        loading,
        signIn,
        createAccount,
        signOut,
        resetPassword,
        isAuthenticated: !!user && userProfile?.role === UserRole.SUPER_ADMIN,
        isSuperAdmin: userProfile?.role === UserRole.SUPER_ADMIN
    }), [user, userProfile, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;