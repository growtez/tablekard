// Authentication Context for Restaurant Admin (Supabase)
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import type { User } from '@supabase/supabase-js';
import { UserRole } from '@restaurant-saas/types';

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    avatarUrl: string | null;
}

interface RestaurantMembership {
    id: string;
    restaurantId: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    memberships: RestaurantMembership[];
    activeRestaurantId: string | null;
    activeRestaurantName: string;
    activeRestaurantLogo: string | null;
    activeRestaurantStatus: string;
    activeRestaurantSubscriptionStatus: string;
    activeRestaurantSubscriptionPlan: string | null;
    activeRestaurantGracePeriodEndsAt: string | null;
    setActiveRestaurantId: (restaurantId: string) => void;
    refreshSessionData: () => Promise<void>;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
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
        .select('id,email,name,role,avatar_url')
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
        role: data.role as UserRole,
        avatarUrl: data.avatar_url
    };
}

async function fetchMemberships(userId: string): Promise<RestaurantMembership[]> {
    const { data, error } = await supabase
        .from('restaurant_users')
        .select('id,restaurant_id,role')
        .eq('profile_id', userId)
        .eq('active', true);

    if (error) {
        console.warn('Failed to fetch memberships:', error.message);
        return [];
    }
    return (data ?? []).map(row => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        role: row.role
    }));
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [memberships, setMemberships] = useState<RestaurantMembership[]>([]);
    const [activeRestaurantId, setActiveRestaurantIdState] = useState<string | null>(null);
    const [activeRestaurantName, setActiveRestaurantName] = useState('Restaurant');
    const [activeRestaurantLogo, setActiveRestaurantLogo] = useState<string | null>(null);
    const [activeRestaurantStatus, setActiveRestaurantStatus] = useState<string>('pending');
    const [activeRestaurantSubscriptionStatus, setActiveRestaurantSubscriptionStatus] = useState<string>('inactive');
    const [activeRestaurantSubscriptionPlan, setActiveRestaurantSubscriptionPlan] = useState<string | null>(null);
    const [activeRestaurantGracePeriodEndsAt, setActiveRestaurantGracePeriodEndsAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const setActiveRestaurantId = (restaurantId: string) => {
        setActiveRestaurantIdState(restaurantId);
        localStorage.setItem('active_restaurant_id', restaurantId);
    };

    const syncMemberships = async (nextUser: User | null): Promise<string | null> => {
        if (!nextUser) {
            setUserProfile(null);
            setMemberships([]);
            setActiveRestaurantIdState(null);
            return null;
        }

        const [profile, membershipList] = await Promise.all([
            fetchProfile(nextUser.id),
            fetchMemberships(nextUser.id)
        ]);

        // Gate: only restaurant_admin and super_admin may use this app.
        // If this session belongs to a kitchen_staff (or any other disallowed role),
        // sign them out immediately before setting any state, so no render ever
        // sees isAuthenticated = true for a disallowed user.
        const roleStr = String(profile?.role).toLowerCase();
        const isAllowed = roleStr === 'restaurant_admin'
            || roleStr === 'super_admin'
            || profile?.role === UserRole.RESTAURANT_ADMIN
            || profile?.role === UserRole.SUPER_ADMIN;

        if (!isAllowed) {
            // Sign out silently — do not set any state so isAuthenticated stays false
            await supabase.auth.signOut();
            setUserProfile(null);
            setMemberships([]);
            setActiveRestaurantIdState(null);
            return null;
        }

        setUserProfile(profile);
        setMemberships(membershipList);

        const stored = localStorage.getItem('active_restaurant_id');
        let nextActiveId: string | null = null;
        if (stored && membershipList.some(m => m.restaurantId === stored)) {
            nextActiveId = stored;
        } else if (membershipList[0]?.restaurantId) {
            nextActiveId = membershipList[0].restaurantId;
            localStorage.setItem('active_restaurant_id', nextActiveId);
        }
        
        setActiveRestaurantIdState(nextActiveId);
        return nextActiveId;
    };

    // Fetch restaurant branding whenever activeRestaurantId changes
    const fetchRestaurantBranding = useCallback(async (restaurantId: string | null) => {
        if (!restaurantId) {
            setActiveRestaurantName('Restaurant');
            setActiveRestaurantLogo(null);
            setActiveRestaurantStatus('pending');
            setActiveRestaurantSubscriptionStatus('inactive');
            setActiveRestaurantSubscriptionPlan(null);
            setActiveRestaurantGracePeriodEndsAt(null);
            return;
        }
        try {
            const { data: rawData, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', restaurantId)
                .maybeSingle();
            if (!error && rawData) {
                const data = rawData as any;
                setActiveRestaurantName(data.name || 'Restaurant');
                setActiveRestaurantLogo(data.logo_url || null);
                setActiveRestaurantStatus(data.status || 'pending');
                setActiveRestaurantSubscriptionStatus(data.subscription_status || 'inactive');
                setActiveRestaurantSubscriptionPlan(data.subscription_plan || null);
                setActiveRestaurantGracePeriodEndsAt(data.grace_period_ends_at || null);
            }
        } catch {
            // silently ignore
        }
    }, []);

    useEffect(() => {
        fetchRestaurantBranding(activeRestaurantId);
        
        // Subscribe to real-time changes on the active restaurant record
        if (!activeRestaurantId) return;

        const subscription = supabase
            .channel(`restaurant-status-${activeRestaurantId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'restaurants', 
                filter: `id=eq.${activeRestaurantId}` 
            }, (payload) => {
                const updated = payload.new;
                if (updated.name !== undefined) setActiveRestaurantName(updated.name);
                if (updated.logo_url !== undefined) setActiveRestaurantLogo(updated.logo_url);
                if (updated.status !== undefined) setActiveRestaurantStatus(updated.status);
                if (updated.subscription_status !== undefined) setActiveRestaurantSubscriptionStatus(updated.subscription_status);
                if (updated.subscription_plan !== undefined) setActiveRestaurantSubscriptionPlan(updated.subscription_plan);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [activeRestaurantId, fetchRestaurantBranding]);

    const refreshSessionData = async (): Promise<void> => {
        await syncMemberships(user);
        await fetchRestaurantBranding(activeRestaurantId);
    };

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data } = await supabase.auth.getSession();
            const currentUser = data.session?.user ?? null;
            if (!mounted) return;
            setUser(currentUser);
            const activeId = await syncMemberships(currentUser);
            if (activeId) {
                await fetchRestaurantBranding(activeId);
            }
            setLoading(false);
        };

        init();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const nextUser = session?.user ?? null;
            
            // Optimization: Only sync memberships if user changed or it's an explicit SIGNED_IN event
            // This prevents redundant fetches on TOKEN_REFRESHED or focus events
            // NOTE: Do NOT set loading=false here — only init() controls that flag.
            // Otherwise a second event (TOKEN_REFRESHED) can set loading=false before
            // syncMemberships finishes, briefly making isAuthenticated=false and flashing login.
            setUser(prev => {
                if (prev?.id !== nextUser?.id || event === 'SIGNED_IN') {
                    syncMemberships(nextUser);
                }
                return nextUser;
            });
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

        const activeId = await syncMemberships(data.user);
        if (!activeId) {
            throw new Error('Access denied. Only restaurant administrators with active accounts can access the admin panel.');
        }

        await fetchRestaurantBranding(activeId);

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
        const redirectTo = `${window.location.origin}/update-password`;
        const { data, error } = await supabase.functions.invoke('reset-password', {
            body: { email, redirectTo }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
    };

    const updatePassword = async (password: string): Promise<void> => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    const isAllowedAdminRole = useMemo(() => {
        if (!userProfile) return false;
        const roleStr = String(userProfile.role).toLowerCase();
        return roleStr === 'restaurant_admin'
            || roleStr === 'super_admin'
            || userProfile.role === UserRole.RESTAURANT_ADMIN
            || userProfile.role === UserRole.SUPER_ADMIN;
    }, [userProfile]);

    const value: AuthContextType = useMemo(() => ({
        user,
        userProfile,
        memberships,
        activeRestaurantId,
        activeRestaurantName,
        activeRestaurantLogo,
        activeRestaurantStatus,
        activeRestaurantSubscriptionStatus,
        activeRestaurantSubscriptionPlan,
        activeRestaurantGracePeriodEndsAt,
        setActiveRestaurantId,
        refreshSessionData,
        loading,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        isAuthenticated: !!user && memberships.length > 0 && isAllowedAdminRole,
        isRestaurantAdmin: memberships.some(m => String(m.role).toLowerCase() === 'admin') || String(userProfile?.role).toLowerCase() === 'super_admin'
    }), [
        user, userProfile, memberships, activeRestaurantId, 
        activeRestaurantName, activeRestaurantLogo, 
        activeRestaurantStatus, activeRestaurantSubscriptionStatus, activeRestaurantSubscriptionPlan, 
        activeRestaurantGracePeriodEndsAt,
        loading, isAllowedAdminRole
    ]);

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
