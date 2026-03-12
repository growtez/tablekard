// Authentication Context for Restaurant Admin (Supabase)
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

interface RestaurantMembership {
    id: string;
    restaurantId: string;
    role: string;
}

interface AuthDiagnostics {
    lastSyncAt: string | null;
    lastSyncError: string | null;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    memberships: RestaurantMembership[];
    diagnostics: AuthDiagnostics;
    activeRestaurantId: string | null;
    setActiveRestaurantId: (restaurantId: string) => void;
    refreshUserContext: () => Promise<void>;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    signOut: () => Promise<void>;
    clearStoredSession: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
    isRestaurantAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableFetchError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return message.toLowerCase().includes('failed to fetch')
        || message.toLowerCase().includes('network')
        || message.toLowerCase().includes('connection');
};

async function withRetry<T>(fn: () => Promise<T>, attempts: number = 3): Promise<T> {
    let lastError: unknown;

    for (let index = 0; index < attempts; index += 1) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (!isRetryableFetchError(error) || index === attempts - 1) {
                throw error;
            }

            await sleep(300 * (index + 1));
        }
    }

    throw lastError;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await withRetry(async () => await supabase
        .from('profiles')
        .select('id,email,name,role')
        .eq('id', userId)
        .maybeSingle());
    if (error) {
        throw error;
    }
    if (!data) return null;
    return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole
    };
}

async function fetchMemberships(userId: string): Promise<RestaurantMembership[]> {
    const { data, error } = await withRetry(async () => await supabase
        .from('restaurant_users')
        .select('id,restaurant_id,role')
        .eq('profile_id', userId)
        .eq('active', true));

    if (error) {
        throw error;
    }
    return (data ?? []).map((row: { id: string; restaurant_id: string; role: string }) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        role: row.role
    }));
}

async function clearSessionStorage() {
    localStorage.removeItem('active_restaurant_id');
    localStorage.removeItem('tablekard-admin-auth');
    sessionStorage.removeItem('tablekard-admin-auth');
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [memberships, setMemberships] = useState<RestaurantMembership[]>([]);
    const [diagnostics, setDiagnostics] = useState<AuthDiagnostics>({
        lastSyncAt: null,
        lastSyncError: null
    });
    const [activeRestaurantId, setActiveRestaurantIdState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const setActiveRestaurantId = (restaurantId: string) => {
        setActiveRestaurantIdState(restaurantId);
        localStorage.setItem('active_restaurant_id', restaurantId);
    };

    const syncMemberships = async (nextUser: User | null) => {
        if (!nextUser) {
            setUserProfile(null);
            setMemberships([]);
            setActiveRestaurantIdState(null);
            setDiagnostics({
                lastSyncAt: new Date().toISOString(),
                lastSyncError: null
            });
            return;
        }

        let profile: UserProfile | null = null;
        let membershipList: RestaurantMembership[] = [];

        try {
            [profile, membershipList] = await Promise.all([
                fetchProfile(nextUser.id),
                fetchMemberships(nextUser.id)
            ]);
        } catch (error) {
            console.error('Failed to fetch auth context data:', error);
            setDiagnostics({
                lastSyncAt: new Date().toISOString(),
                lastSyncError: error instanceof Error ? error.message : String(error)
            });
            return;
        }

        setUserProfile(profile);
        setMemberships(membershipList);
        setDiagnostics({
            lastSyncAt: new Date().toISOString(),
            lastSyncError: null
        });

        const stored = localStorage.getItem('active_restaurant_id');
        if (stored && membershipList.some(m => m.restaurantId === stored)) {
            setActiveRestaurantIdState(stored);
        } else if (membershipList[0]?.restaurantId) {
            setActiveRestaurantIdState(membershipList[0].restaurantId);
            localStorage.setItem('active_restaurant_id', membershipList[0].restaurantId);
        } else {
            setActiveRestaurantIdState(null);
        }

        const roleStr = String(profile?.role ?? '').toLowerCase();
        const roleAllowed = roleStr === 'restaurant_admin' || roleStr === 'restaurant_staff' || roleStr === 'super_admin';

        if (!roleAllowed || membershipList.length === 0) {
            await supabase.auth.signOut();
            await clearSessionStorage();
            setUser(null);
            setUserProfile(null);
            setMemberships([]);
            setActiveRestaurantIdState(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data } = await supabase.auth.getSession();
            const currentUser = data.session?.user ?? null;
            if (!mounted) return;
            setUser(currentUser);
            await syncMemberships(currentUser);
            setLoading(false);
        };

        init();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const nextUser = session?.user ?? null;
            setLoading(true);
            setUser(nextUser);
            await syncMemberships(nextUser);
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

        const [profile, membershipList] = await Promise.all([
            fetchProfile(data.user.id),
            fetchMemberships(data.user.id)
        ]);

        const roleStr = String(profile?.role).toLowerCase();
        const roleAllowed = roleStr === 'restaurant_admin'
            || roleStr === 'restaurant_staff'
            || roleStr === 'super_admin'
            || profile?.role === UserRole.RESTAURANT_ADMIN
            || profile?.role === UserRole.RESTAURANT_STAFF
            || profile?.role === UserRole.SUPER_ADMIN;

        if (!roleAllowed || membershipList.length === 0) {
            await supabase.auth.signOut();
            throw new Error('You are not authorized to access the restaurant admin panel');
        }

        setUserProfile(profile);
        setMemberships(membershipList);
        if (membershipList[0]?.restaurantId) {
            setActiveRestaurantIdState(membershipList[0].restaurantId);
            localStorage.setItem('active_restaurant_id', membershipList[0].restaurantId);
        } else {
            setActiveRestaurantIdState(null);
        }

        return data.user;
    };

    const signOut = async (): Promise<void> => {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        setMemberships([]);
        setActiveRestaurantIdState(null);
        await clearSessionStorage();
    };

    const clearStoredSession = async (): Promise<void> => {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        setMemberships([]);
        setActiveRestaurantIdState(null);
        await clearSessionStorage();
    };

    const resetPassword = async (email: string): Promise<void> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (error) throw error;
    };

    const refreshUserContext = async (): Promise<void> => {
        await syncMemberships(user);
    };

    const value: AuthContextType = useMemo(() => ({
        user,
        userProfile,
        memberships,
        diagnostics,
        activeRestaurantId,
        setActiveRestaurantId,
        refreshUserContext,
        loading,
        signIn,
        signOut,
        clearStoredSession,
        resetPassword,
        isAuthenticated: !!user && memberships.length > 0,
        isRestaurantAdmin: memberships.some(m => String(m.role).toLowerCase() === 'admin') || String(userProfile?.role).toLowerCase() === 'super_admin'
    }), [user, userProfile, memberships, diagnostics, activeRestaurantId, loading]);

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
