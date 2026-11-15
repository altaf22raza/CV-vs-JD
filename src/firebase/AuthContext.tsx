import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth, db } from './config';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { registerAuthTokenResolver } from '../services/authTokenStore';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  isAnonymous?: boolean;
  authProvider?: 'otp' | 'google';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  sessionExpiredNotice: string | null;
  clearSessionExpiredNotice: () => void;
  requestEmailOtp: (
    email: string
  ) => Promise<{ success: boolean; message: string; expiresAt?: number; resendCooldownSec?: number }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const LEGACY_STORAGE_KEYS = [
  'cv_vs_jd_authenticated_user',
  'cv_vs_jd_session_token',
];

function clearLegacyCustomSessionStorage(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  }
}

async function mapFirebaseUserToAppUser(fbUser: FirebaseUser): Promise<AppUser> {
  let authProvider: AppUser['authProvider'] = fbUser.providerData.some(
    (p) => p.providerId === 'google.com'
  )
    ? 'google'
    : 'otp';
  let claimEmail = '';
  let claimEmailVerified = fbUser.emailVerified;

  try {
    const tokenResult = await fbUser.getIdTokenResult();
    if (tokenResult.claims?.authMethod === 'email_otp' || tokenResult.signInProvider === 'custom') {
      authProvider = 'otp';
    } else if (tokenResult.signInProvider === 'google.com') {
      authProvider = 'google';
    }
    if (typeof tokenResult.claims?.email === 'string') {
      claimEmail = tokenResult.claims.email;
    }
    if (typeof tokenResult.claims?.email_verified === 'boolean') {
      claimEmailVerified = tokenResult.claims.email_verified;
    }
  } catch {
    // fallback to basic Firebase user fields
  }

  const resolvedEmail = (fbUser.email || claimEmail || '').trim();
  const fallbackName = resolvedEmail ? resolvedEmail.split('@')[0] : 'Candidate';

  return {
    uid: fbUser.uid,
    email: resolvedEmail,
    displayName: fbUser.displayName || fallbackName,
    photoURL: fbUser.photoURL || undefined,
    emailVerified: claimEmailVerified,
    isAnonymous: fbUser.isAnonymous,
    authProvider,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clearSessionExpiredNotice = useCallback(() => {
    setSessionExpiredNotice(null);
  }, []);

  const syncUserProfileToFirestore = useCallback(async (u: AppUser) => {
    if (!auth.currentUser || auth.currentUser.uid !== u.uid || !u.email) {
      return;
    }
    try {
      const userRef = doc(db, 'users', u.uid);
      await setDoc(
        userRef,
        {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          ...(u.photoURL ? { photoURL: u.photoURL } : {}),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Could not sync user profile to firestore:', e);
    }
  }, []);

  // Supply fresh Firebase ID tokens to all protected API calls
  useEffect(() => {
    registerAuthTokenResolver(async (forceRefresh = false) => {
      if (!auth.currentUser || auth.currentUser.isAnonymous) {
        return null;
      }
      try {
        return await auth.currentUser.getIdToken(forceRefresh);
      } catch {
        return null;
      }
    });

    return () => {
      registerAuthTokenResolver(null);
    };
  }, []);

  // React cleanly when a protected endpoint rejects a token with 401
  useEffect(() => {
    const onUnauthorized = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      const msg =
        custom?.detail?.message ||
        'Your session expired or requires authentication. Please sign in to continue.';
      firebaseSignOut(auth).catch(() => {
        // ignore signOut errors
      });
      setUser(null);
      setSessionExpiredNotice(msg);
    };

    window.addEventListener('cvvsjd:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cvvsjd:unauthorized', onUnauthorized);
  }, []);

  // Single source of truth: Firebase onAuthStateChanged
  useEffect(() => {
    clearLegacyCustomSessionStorage();
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;
      if (fbUser && !fbUser.isAnonymous) {
        const mapped = await mapFirebaseUserToAppUser(fbUser);
        if (!mounted) return;
        setUser(mapped);
        setSessionExpiredNotice(null);
        setLoading(false);
        await syncUserProfileToFirestore(mapped);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [syncUserProfileToFirestore]);

  /**
   * Request 6-digit OTP code sent to user email
   */
  const requestEmailOtp = async (email: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  };

  /**
   * Verify 6-digit OTP on server, then authenticate via Firebase signInWithCustomToken
   */
  const verifyEmailOtp = async (email: string, otp: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: otp.trim() }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok || !data?.customToken) {
        return {
          success: false,
          error: data?.error || 'Could not complete Firebase verification sign-in.',
        };
      }

      const credential = await signInWithCustomToken(auth, data.customToken);
      const mapped = await mapFirebaseUserToAppUser(credential.user);
      setUser(mapped);
      setSessionExpiredNotice(null);
      await syncUserProfileToFirestore(mapped);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Verification failed. Please try again.',
      };
    } finally {
      clearTimeout(timer);
    }
  };

  /**
   * Sign in with Google via Firebase Auth popup
   */
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setSessionExpiredNotice(null);
      return { success: true };
    } catch (err: any) {
      const msg =
        err?.code === 'auth/popup-closed-by-user'
          ? 'Sign-in popup was closed before completing.'
          : err?.message || 'Google Sign-In failed. You can use Email OTP instead.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    clearLegacyCustomSessionStorage();
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setSessionExpiredNotice(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionExpiredNotice,
        clearSessionExpiredNotice,
        requestEmailOtp,
        verifyEmailOtp,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
