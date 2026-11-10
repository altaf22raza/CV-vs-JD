import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './config';
import { 
  signInAnonymously, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  requestEmailOtp: (email: string) => Promise<{ success: boolean; message: string; debugOtp?: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const AUTH_STORAGE_KEY = 'cv_vs_jd_authenticated_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync with Firebase Auth state on boot
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // If we already have stored email user, reconcile with current Firebase UID
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as AppUser;
            setUser({
              ...parsed,
              uid: fbUser.uid,
              isAnonymous: fbUser.isAnonymous,
            });
          } catch {
            // ignore
          }
        }
      } else {
        // Ensure request.auth is populated in Firestore rules
        try {
          const cred = await signInAnonymously(auth);
          const saved = localStorage.getItem(AUTH_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as AppUser;
              setUser({
                ...parsed,
                uid: cred.user.uid,
              });
            } catch {
              // ignore
            }
          }
        } catch (e) {
          console.warn('Anonymous auth init error:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncUserProfileToFirestore = async (u: AppUser) => {
    try {
      const userRef = doc(db, 'users', u.uid);
      await setDoc(userRef, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not sync user profile to firestore:', e);
    }
  };

  /**
   * Request 6-digit OTP code sent to user email
   */
  const requestEmailOtp = async (email: string) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send verification code');
    }
    return data;
  };

  /**
   * Verify 6-digit OTP code and sign user in
   */
  const verifyEmailOtp = async (email: string, otp: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: otp.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Invalid verification code' };
    }

    // Connect with Firebase Auth session so Firestore permissions succeed
    let firebaseUid = data.user.uid;
    try {
      if (!auth.currentUser) {
        const cred = await signInAnonymously(auth);
        firebaseUid = cred.user.uid;
      } else {
        firebaseUid = auth.currentUser.uid;
      }
    } catch (e) {
      console.warn('Firebase session init fallback:', e);
    }

    const appUser: AppUser = {
      uid: firebaseUid,
      email: cleanEmail,
      displayName: data.user.displayName || cleanEmail.split('@')[0],
      emailVerified: true,
      isAnonymous: false,
    };

    setUser(appUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
    await syncUserProfileToFirestore(appUser);

    return { success: true };
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        requestEmailOtp,
        verifyEmailOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
