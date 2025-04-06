"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface AuthContextType {
  user: User | null;
  error: string | null;
  loading: boolean;
  onboardingCompleted: boolean | null;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  error: null,
  loading: true,
  onboardingCompleted: null,
  signUp: async () => {
    throw new Error('AuthContext not initialized');
  },
  signIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  signInWithGoogle: async () => {
    throw new Error('AuthContext not initialized');
  },
  signOut: async () => {
    throw new Error('AuthContext not initialized');
  },
});

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('AuthProvider mounted, setting up auth listener');
    
    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed in listener:', { 
        user: user ? 'exists' : 'null',
        loading 
      });
      
      try {
        setUser(user);
        
        if (user) {
          // Check if user has completed onboarding
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              onboardingCompleted: false
            });
            setOnboardingCompleted(false);
          } else {
            setOnboardingCompleted(userDoc.data().onboardingCompleted || false);
          }
        } else {
          setOnboardingCompleted(null);
        }
      } catch (err) {
        console.error('Error in auth state listener:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => {
      console.log('AuthProvider unmounting, cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('AuthProvider state updated:', { 
      user: user ? 'exists' : 'null',
      loading,
      error 
    });
  }, [user, loading, error]);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out');
      throw err;
    }
  };

  const signOut = logout;

  const value = {
    user,
    error,
    loading,
    onboardingCompleted,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
