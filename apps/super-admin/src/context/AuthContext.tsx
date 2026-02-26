// Authentication Context for Super Admin (Supabase)
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { UserRole } from '@restaurant-saas/types';
import { authService, UserProfile } from '../services/auth.service';

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

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data } = await authService.getSession();
            const currentUser = data.session?.user ?? null;
            if (!mounted) return;
            setUser(currentUser);
            if (currentUser) {
                const profile = await authService.fetchProfile(currentUser);
                if (!mounted) return;
                setUserProfile(profile);
            }
            setLoading(false);
        };

        init();

        const { data: authListener } = authService.onAuthStateChange(async (_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            if (nextUser) {
                const profile = await authService.fetchProfile(nextUser);
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
        const nextUser = await authService.signIn(email, password);
        const profile = await authService.fetchProfile(nextUser);

        if (!profile || profile.role !== UserRole.SUPER_ADMIN) {
            await authService.signOut();
            throw new Error('You are not authorized to access the super admin panel');
        }

        setUserProfile(profile);
        return nextUser;
    };

    const createAccount = async (email: string, password: string, name: string): Promise<User> => {
        const nextUser = await authService.signUp(email, password, name);
        const profile = await authService.fetchProfile(nextUser);
        setUserProfile(profile);
        return nextUser;
    };

    const signOut = async (): Promise<void> => {
        await authService.signOut();
        setUser(null);
        setUserProfile(null);
    };

    const resetPassword = async (email: string): Promise<void> => {
        await authService.resetPassword(email);
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