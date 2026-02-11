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
    role: 'ADMIN' | 'STAFF';
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    memberships: RestaurantMembership[];
    activeRestaurantId: string | null;
    setActiveRestaurantId: (restaurantId: string) => void;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
    isRestaurantAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id,email,name,role')
        .eq('id', userId)
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

async function fetchMemberships(userId: string): Promise<RestaurantMembership[]> {
    const { data, error } = await supabase
        .from('restaurant_users')
        .select('id,restaurant_id,role,name,email')
        .eq('auth_user_id', userId)
        .eq('active', true);

    if (error) {
        console.warn('Failed to fetch memberships:', error.message);
        return [];
    }
    return (data ?? []).map(row => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        role: row.role,
        name: row.name,
        email: row.email
    }));
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [memberships, setMemberships] = useState<RestaurantMembership[]>([]);
    const [activeRestaurantId, setActiveRestaurantIdState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const setActiveRestaurantId = (restaurantId: string) => {
        setActiveRestaurantIdState(restaurantId);
        localStorage.setItem('active_restaurant_id', restaurantId);
    };

    const syncMemberships = async (nextUser: User | null) => {
        if (!nextUser) {
            setMemberships([]);
            setActiveRestaurantIdState(null);
            return;
        }

        const [profile, membershipList] = await Promise.all([
            fetchProfile(nextUser.id),
            fetchMemberships(nextUser.id)
        ]);

        setUserProfile(profile);
        setMemberships(membershipList);

        const stored = localStorage.getItem('active_restaurant_id');
        if (stored && membershipList.some(m => m.restaurantId === stored)) {
            setActiveRestaurantIdState(stored);
        } else if (membershipList[0]?.restaurantId) {
            setActiveRestaurantIdState(membershipList[0].restaurantId);
            localStorage.setItem('active_restaurant_id', membershipList[0].restaurantId);
        } else {
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

        const roleAllowed = profile?.role === UserRole.RESTAURANT_ADMIN
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
        localStorage.removeItem('active_restaurant_id');
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
        memberships,
        activeRestaurantId,
        setActiveRestaurantId,
        loading,
        signIn,
        signOut,
        resetPassword,
        isAuthenticated: !!user && memberships.length > 0,
        isRestaurantAdmin: memberships.some(m => m.role === 'ADMIN') || userProfile?.role === UserRole.SUPER_ADMIN
    }), [user, userProfile, memberships, activeRestaurantId, loading]);

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
