import crypto from 'node:crypto';
import { getFirebaseAdminAuth } from './firebaseAdmin.ts';

export class FirebaseCustomTokenUnavailableError extends Error {
  readonly statusCode = 503;
  readonly code = 'FIREBASE_CUSTOM_TOKEN_UNAVAILABLE';

  constructor(
    message = 'Email sign-in could not mint a Firebase authentication token on this server (missing FIREBASE_SERVICE_ACCOUNT_JSON or IAM signBlob permission). Please use Google Sign-In instead.'
  ) {
    super(message);
    this.name = 'FirebaseCustomTokenUnavailableError';
  }
}

export interface MintedCustomAuthResult {
  customToken: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
  };
}

function deriveDeterministicUid(cleanEmail: string): string {
  const hash = crypto.createHash('sha256').update(cleanEmail).digest('base64url');
  return `otp_${hash.slice(0, 24)}`;
}

/**
 * Resolves or provisions the Firebase Authentication user for a verified email
 * and mints a Firebase custom token for client signInWithCustomToken(auth, token).
 */
export async function mintFirebaseCustomTokenForEmail(
  rawEmail: string
): Promise<MintedCustomAuthResult> {
  const cleanEmail = rawEmail.toLowerCase().trim();
  const rawName = cleanEmail.split('@')[0] || 'Candidate';
  const fallbackDisplayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const adminAuth = getFirebaseAdminAuth();
  let uid = deriveDeterministicUid(cleanEmail);
  let displayName = fallbackDisplayName;

  // Attempt to look up or provision the canonical Firebase Auth user so Google & Email OTP share UID/profile
  try {
    const existing = await adminAuth.getUserByEmail(cleanEmail);
    uid = existing.uid;
    displayName = existing.displayName || fallbackDisplayName;
    if (!existing.emailVerified) {
      await adminAuth.updateUser(uid, { emailVerified: true }).catch(() => {});
    }
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      try {
        const created = await adminAuth.createUser({
          email: cleanEmail,
          displayName: fallbackDisplayName,
          emailVerified: true,
        });
        uid = created.uid;
        displayName = created.displayName || fallbackDisplayName;
      } catch (createErr) {
        console.warn(
          '[AUTH] Could not create Firebase Auth user record, proceeding with custom token UID:',
          createErr instanceof Error ? createErr.message : createErr
        );
      }
    } else {
      console.warn(
        '[AUTH] Firebase Auth user lookup unavailable, falling back to deterministic UID for custom token:',
        err instanceof Error ? err.message : err
      );
    }
  }

  try {
    const customToken = await adminAuth.createCustomToken(uid, {
      authMethod: 'email_otp',
      email: cleanEmail,
      email_verified: true,
    });

    return {
      customToken,
      user: {
        uid,
        email: cleanEmail,
        displayName,
        emailVerified: true,
      },
    };
  } catch (err) {
    console.error(
      '[AUTH] Firebase createCustomToken failed:',
      err instanceof Error ? err.message : err
    );
    throw new FirebaseCustomTokenUnavailableError();
  }
}
