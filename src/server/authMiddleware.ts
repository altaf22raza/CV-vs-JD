import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  provider: 'google' | 'otp' | 'firebase';
}

export type AuthMiddlewareResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; status: 401; error: string };

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CertCache {
  certs: Record<string, string>;
  expiresAtMs: number;
}

let certCache: CertCache | null = null;

function resolveFirebaseProjectId(): string {
  const fromEnv = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (parsed && typeof parsed.projectId === 'string' && parsed.projectId.trim()) {
        return parsed.projectId.trim();
      }
    }
  } catch {
    // fallback below
  }

  return 'western-air-wkpm1';
}

function decodeBase64UrlJson<T>(segment: string): T | null {
  try {
    const json = Buffer.from(segment, 'base64url').toString('utf-8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

async function getGoogleSecureTokenCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certCache && now < certCache.expiresAtMs) {
    return certCache.certs;
  }

  const res = await fetch(GOOGLE_CERTS_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    if (certCache) return certCache.certs;
    throw new Error(`Failed to fetch Firebase public keys (${res.status})`);
  }

  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Math.max(60, Number(maxAgeMatch[1])) : 3600;

  certCache = {
    certs,
    expiresAtMs: now + maxAgeSec * 1000,
  };
  return certs;
}

interface FirebaseJwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface FirebaseJwtPayload {
  iss?: string;
  aud?: string;
  auth_time?: number;
  user_id?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
  authMethod?: string;
  firebase?: {
    sign_in_provider?: string;
  };
}

/**
 * Verifies a Firebase ID Token against Google's x509 public certificates and claims.
 */
export async function verifyFirebaseIdTokenWithCerts(
  idToken: string,
  certs: Record<string, string>,
  projectId: string
): Promise<AuthenticatedUser> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase ID token.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeBase64UrlJson<FirebaseJwtHeader>(headerB64);
  const payload = decodeBase64UrlJson<FirebaseJwtPayload>(payloadB64);

  if (!header || !payload) {
    throw new Error('Invalid Firebase ID token encoding.');
  }
  if (header.alg !== 'RS256') {
    throw new Error('Unsupported Firebase token signing algorithm.');
  }
  if (!header.kid || typeof header.kid !== 'string') {
    throw new Error('Missing key identifier in Firebase token header.');
  }

  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('Firebase signing certificate not found for key ID.');
  }

  const signatureValid = crypto
    .createVerify('RSA-SHA256')
    .update(`${headerB64}.${payloadB64}`)
    .end()
    .verify(certPem, Buffer.from(signatureB64, 'base64url'));

  if (!signatureValid) {
    throw new Error('Firebase ID token signature verification failed.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload.aud !== projectId) {
    throw new Error('Firebase token audience mismatch.');
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error('Firebase token issuer mismatch.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Firebase token has expired.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Firebase token issued-at timestamp is invalid.');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > nowSec + 300) {
    throw new Error('Firebase auth_time timestamp is invalid.');
  }
  if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
    throw new Error('Firebase token subject (uid) is missing.');
  }
  if (payload.user_id && payload.user_id !== payload.sub) {
    throw new Error('Firebase token user_id mismatch.');
  }
  if (payload.firebase?.sign_in_provider === 'anonymous') {
    throw new Error('Anonymous Firebase sessions are not permitted.');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const fallbackName = email ? email.split('@')[0] : 'Candidate';
  const signInProvider = payload.firebase?.sign_in_provider;
  const provider: AuthenticatedUser['provider'] =
    payload.authMethod === 'email_otp' || signInProvider === 'custom'
      ? 'otp'
      : signInProvider === 'google.com'
        ? 'google'
        : 'firebase';

  return {
    uid: payload.sub,
    email,
    displayName:
      typeof payload.name === 'string' && payload.name.trim()
        ? payload.name.trim()
        : fallbackName,
    emailVerified: Boolean(payload.email_verified),
    provider,
  };
}

/**
 * Fetches Google Secure Token certificates and verifies a Firebase ID Token.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<AuthenticatedUser> {
  const certs = await getGoogleSecureTokenCerts();
  const projectId = resolveFirebaseProjectId();
  return verifyFirebaseIdTokenWithCerts(idToken, certs, projectId);
}

/**
 * Extracts raw Bearer token from an Authorization header value.
 */
export function extractBearerToken(authorizationHeader?: string | string[]): string {
  const raw = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  if (!raw || typeof raw !== 'string') return '';
  const match = raw.match(/^\s*Bearer\s+(.+?)\s*$/i);
  return match ? match[1] : '';
}

/**
 * Enforces Firebase Authentication on all protected API routes.
 * Only genuine, verified Firebase ID tokens (Google or custom-token Email OTP) are accepted.
 */
export async function authenticateRequest(
  authorizationHeader?: string | string[]
): Promise<AuthMiddlewareResult> {
  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Authentication required. Please sign in to access this feature.',
    };
  }

  try {
    const firebaseUser = await verifyFirebaseIdToken(token);
    return { ok: true, user: firebaseUser };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Invalid or expired Firebase authentication token.';
    return {
      ok: false,
      status: 401,
      error: msg,
    };
  }
}
