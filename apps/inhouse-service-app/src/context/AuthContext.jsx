import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@restaurant-saas/supabase';

/**
 * Lightweight auth context for the inhouse-service-app.
 * Mirrors the restaurant-admin pattern but kept minimal —
 * only what the kitchen display / service screen needs.
 */

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[AuthContext] fetchProfile error:', error.message);
    return null;
  }
  return data;
}

async function fetchMemberships(userId) {
  const { data, error } = await supabase
    .from('restaurant_users')
    .select('id, restaurant_id, role')
    .eq('profile_id', userId)
    .eq('active', true);

  if (error) {
    console.warn('[AuthContext] fetchMemberships error:', error.message);
    return [];
  }
  return data ?? [];
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [activeRestaurantId, setActiveRestaurantIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const setActiveRestaurantId = useCallback((id) => {
    setActiveRestaurantIdState(id);
    localStorage.setItem('inhouse_active_restaurant_id', id);
  }, []);

  const syncMemberships = useCallback(async (nextUser) => {
    if (!nextUser) {
      setProfile(null);
      setMemberships([]);
      setActiveRestaurantIdState(null);
      return;
    }

    const [prof, membershipList] = await Promise.all([
      fetchProfile(nextUser.id),
      fetchMemberships(nextUser.id),
    ]);

    setProfile(prof);
    setMemberships(membershipList);

    const stored = localStorage.getItem('inhouse_active_restaurant_id');
    if (stored && membershipList.some((m) => m.restaurant_id === stored)) {
      setActiveRestaurantIdState(stored);
    } else if (membershipList[0]?.restaurant_id) {
      setActiveRestaurantIdState(membershipList[0].restaurant_id);
      localStorage.setItem('inhouse_active_restaurant_id', membershipList[0].restaurant_id);
    } else {
      setActiveRestaurantIdState(null);
    }
  }, []);

  // Bootstrap session on mount
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser((prev) => {
          if (prev?.id !== nextUser?.id) {
            syncMemberships(nextUser);
          }
          return nextUser;
        });
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncMemberships]);

  const signIn = useCallback(async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const msg = error?.message ?? 'Failed to sign in';
      setAuthError(msg);
      throw new Error(msg);
    }

    const [prof, membershipList] = await Promise.all([
      fetchProfile(data.user.id),
      fetchMemberships(data.user.id),
    ]);

    // Check if user has a valid role in profiles or any valid membership role
    const role = String(prof?.role).toLowerCase();
    const hasValidMembershipRole = membershipList.some(m => 
      ['kitchen_staff', 'admin'].includes(String(m.role).toLowerCase())
    );
    
    const roleAllowed =
      role === 'restaurant_admin' ||
      role === 'restaurant_staff' ||
      role === 'super_admin' ||
      hasValidMembershipRole;

    if (!roleAllowed || membershipList.length === 0) {
      await supabase.auth.signOut();
      const msg = 'You are not authorised to access this app';
      setAuthError(msg);
      throw new Error(msg);
    }

    setProfile(prof);
    setMemberships(membershipList);

    if (membershipList[0]?.restaurant_id) {
      setActiveRestaurantIdState(membershipList[0].restaurant_id);
      localStorage.setItem('inhouse_active_restaurant_id', membershipList[0].restaurant_id);
    }

    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMemberships([]);
    setActiveRestaurantIdState(null);
    localStorage.removeItem('inhouse_active_restaurant_id');
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      memberships,
      activeRestaurantId,
      setActiveRestaurantId,
      loading,
      authError,
      signIn,
      signOut,
      isAuthenticated: !!user && memberships.length > 0,
    }),
    [user, profile, memberships, activeRestaurantId, loading, authError, signIn, signOut, setActiveRestaurantId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
