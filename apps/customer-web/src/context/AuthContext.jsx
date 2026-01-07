// Authentication Context for Customer Web
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUserProfile({ id: userDoc.id, ...userDoc.data() });
                    }
                } catch (error) {
                    console.warn('Could not fetch user profile:', error.message);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const firebaseUser = userCredential.user;

        const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (!userDocSnap.exists()) {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                name: firebaseUser.displayName || '',
                phone: firebaseUser.phoneNumber || '',
                avatar: firebaseUser.photoURL || '',
                role: 'customer',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        return firebaseUser;
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    const updateUserProfile = async (data) => {
        if (!user) return;

        await setDoc(doc(db, 'users', user.uid), {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });

        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        if (userDocSnap.exists()) {
            setUserProfile({ id: userDocSnap.id, ...userDocSnap.data() });
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        signInWithGoogle,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
    };

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
