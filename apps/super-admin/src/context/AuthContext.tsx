// Authentication Context for Super Admin
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: 'restaurant_admin' | 'super_admin' | 'customer' | 'driver';
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

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('🔐 Setting up Firebase Auth listener for Super Admin...');

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('🔐 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    await firebaseUser.getIdToken(true);

                    if (import.meta.env.DEV) {
                        console.log('🔥 Firebase projectId (auth):', auth.app.options.projectId);
                        console.log('🔥 Firebase projectId (firestore):', db.app.options.projectId);
                    }
                    // Fetch user profile from Firestore
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data() as Omit<UserProfile, 'id'>;
                        const profile: UserProfile = { id: userDoc.id, ...data };

                        setUserProfile(profile);

                        // If not super admin, warn
                        if (profile.role !== 'super_admin') {
                            console.warn('⚠️ User is not a super admin');
                            // We don't force logout here to allow context to show "Access Denied" UI if needed, 
                            // but for now strict mode is handled in signIn.
                        }
                    } else {
                        console.warn('⚠️ User logged in but no profile found:', firebaseUser.email);
                        setUserProfile(null);
                    }
                } catch (error) {
                    console.warn('⚠️ Could not fetch user profile:', error);
                    if (
                        typeof error === 'object' &&
                        error !== null &&
                        'code' in error &&
                        typeof (error as { code?: unknown }).code === 'string' &&
                        [
                            'auth/user-token-expired',
                            'auth/invalid-user-token',
                            'auth/user-disabled',
                            'auth/network-request-failed',
                            'auth/internal-error',
                        ].includes((error as { code: string }).code)
                    ) {
                        try {
                            await firebaseSignOut(auth);
                        } catch {
                            // ignore
                        }
                        setUser(null);
                    }
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign in with email and password
    const signIn = async (email: string, password: string): Promise<User> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        await userCredential.user.getIdToken(true);

        // Verify role from DB
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            if (profile.role !== 'super_admin') {
                await firebaseSignOut(auth);
                throw new Error('You are not authorized to access the super admin panel');
            }
        } else {
            await firebaseSignOut(auth);
            throw new Error('Access Denied: User profile not found.');
        }

        return userCredential.user;
    };

    // Sign out
    const signOut = async (): Promise<void> => {
        await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    // Create super admin account (restricted)
    const createAccount = async (email: string, password: string, name: string): Promise<User> => {
        // Removed whitelist logic as requested
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await user.getIdToken(true);

        // Create profile
        const newProfile = {
            email: user.email!,
            name: name,
            role: 'super_admin' as const,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });

        // Update local state is handled by onAuthStateChanged, but we can set it optimistically
        const profile: UserProfile = { id: user.uid, ...newProfile };
        setUserProfile(profile);

        return user;
    };

    // Reset password
    const resetPassword = async (email: string): Promise<void> => {
        await sendPasswordResetEmail(auth, email);
    };

    const value: AuthContextType = {
        user,
        userProfile,
        loading,
        signIn,
        createAccount,
        signOut,
        resetPassword,
        isAuthenticated: !!user && userProfile?.role === 'super_admin',
        isSuperAdmin: userProfile?.role === 'super_admin',
    };

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
