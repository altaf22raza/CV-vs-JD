import crypto from 'node:crypto';
import {
  EmailDeliveryNotConfiguredError,
  isEmailDeliveryConfigured,
  sendOtpEmail,
} from './emailDelivery.ts';
import {
  sharedCheckAndIncrementWindow,
  sharedDeleteKey,
  sharedGetJson,
  sharedSetJson,
} from './sharedStore.ts';

export const OTP_CONFIG = {
  OTP_TTL_MS: 10 * 60 * 1000, // 10 minutes expiration
  RESEND_COOLDOWN_MS: 45 * 1000, // 45s cooldown between resends
  RESEND_WINDOW_MS: 30 * 60 * 1000, // 30-minute rolling window
  MAX_SENDS_PER_WINDOW: 4, // max 4 codes sent per email per 30 min
  DAILY_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
  MAX_SENDS_PER_DAY: 8, // max 8 codes sent per email per 24h
  MAX_VERIFY_ATTEMPTS: 5, // lock/invalidate after 5 wrong attempts
};

interface StoredOtpRecord {
  codeHmac: string;
  emailHash: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

interface CooldownRecord {
  sentAt: number;
  expiresAt: number;
}

export interface IssueOtpResult {
  sent: boolean;
  expiresAt: number;
  resendCooldownSec: number;
  remainingSendsInWindow?: number;
  rateLimited?: boolean;
  retryAfterSec?: number;
  error?: string;
}

function getOtpHmacSecret(): string {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.OTP_HASH_SECRET?.trim() ||
    process.env.GEMINI_API_KEY?.trim();
  if (secret && secret.length >= 12) {
    return secret;
  }
  // Stable dev-only fallback scoped to working directory when no secret env var is present
  return crypto
    .createHash('sha256')
    .update(`cvvsjd-dev-otp-hmac:${process.cwd()}`)
    .digest('hex');
}

function hashEmail(normalizedEmail: string): string {
  return crypto.createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 32);
}

function computeCodeHmac(normalizedEmail: string, code: string): string {
  return crypto
    .createHmac('sha256', getOtpHmacSecret())
    .update(`${normalizedEmail}:${code}`)
    .digest('hex');
}

/**
 * Generates a 6-digit OTP, stores its HMAC hash in the shared store with expiration,
 * enforces per-email resend cooldown and resend window caps, and dispatches via a real email provider.
 * Fails closed if email delivery is not configured or fails, and NEVER returns the OTP code.
 */
export async function issueEmailOtp(rawEmail: string): Promise<IssueOtpResult> {
  const normalizedEmail = rawEmail.toLowerCase().trim();
  const emailKey = hashEmail(normalizedEmail);
  const now = Date.now();

  // Fail closed immediately if no real email delivery provider is configured
  if (!isEmailDeliveryConfigured()) {
    throw new EmailDeliveryNotConfiguredError();
  }

  // 1. Per-email resend cooldown check (shared store)
  const cooldown = await sharedGetJson<CooldownRecord>('otp_cooldown', emailKey);
  if (cooldown && now < cooldown.expiresAt) {
    const retryAfterSec = Math.max(1, Math.ceil((cooldown.expiresAt - now) / 1000));
    return {
      sent: false,
      expiresAt: cooldown.expiresAt,
      resendCooldownSec: Math.ceil(OTP_CONFIG.RESEND_COOLDOWN_MS / 1000),
      rateLimited: true,
      retryAfterSec,
      error: `Please wait ${retryAfterSec}s before requesting another verification code.`,
    };
  }

  // 2. Per-email 30-minute resend window limit (shared store)
  const window30m = await sharedCheckAndIncrementWindow(
    'otp_email_30m',
    emailKey,
    OTP_CONFIG.MAX_SENDS_PER_WINDOW,
    OTP_CONFIG.RESEND_WINDOW_MS
  );
  if (!window30m.allowed) {
    return {
      sent: false,
      expiresAt: window30m.resetAtMs,
      resendCooldownSec: window30m.retryAfterSec,
      rateLimited: true,
      retryAfterSec: window30m.retryAfterSec,
      error: `Resend limit reached for this email (${OTP_CONFIG.MAX_SENDS_PER_WINDOW} codes per 30 minutes). Please try again in ${Math.ceil(window30m.retryAfterSec / 60)} min.`,
    };
  }

  // 3. Per-email 24-hour resend ceiling (shared store)
  const window24h = await sharedCheckAndIncrementWindow(
    'otp_email_24h',
    emailKey,
    OTP_CONFIG.MAX_SENDS_PER_DAY,
    OTP_CONFIG.DAILY_WINDOW_MS
  );
  if (!window24h.allowed) {
    return {
      sent: false,
      expiresAt: window24h.resetAtMs,
      resendCooldownSec: window24h.retryAfterSec,
      rateLimited: true,
      retryAfterSec: window24h.retryAfterSec,
      error: `Daily verification code limit reached for this email. Please sign in with Google or try again later.`,
    };
  }

  // 4. Generate 6-digit OTP and store HMAC-hashed record with strict 10-min TTL
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = now + OTP_CONFIG.OTP_TTL_MS;
  const record: StoredOtpRecord = {
    codeHmac: computeCodeHmac(normalizedEmail, code),
    emailHash: emailKey,
    expiresAt,
    lastSentAt: now,
    attempts: 0,
  };

  await sharedSetJson('otp', emailKey, record, OTP_CONFIG.OTP_TTL_MS);

  // 5. Deliver via real email provider; rollback stored OTP if delivery fails (fail closed)
  try {
    await sendOtpEmail({
      to: normalizedEmail,
      code,
      expiresInMinutes: Math.round(OTP_CONFIG.OTP_TTL_MS / 60_000),
    });
  } catch (err) {
    await sharedDeleteKey('otp', emailKey);
    throw err;
  }

  // Record resend cooldown only after successful delivery
  await sharedSetJson<CooldownRecord>(
    'otp_cooldown',
    emailKey,
    { sentAt: now, expiresAt: now + OTP_CONFIG.RESEND_COOLDOWN_MS },
    OTP_CONFIG.RESEND_COOLDOWN_MS
  );

  return {
    sent: true,
    expiresAt,
    resendCooldownSec: Math.ceil(OTP_CONFIG.RESEND_COOLDOWN_MS / 1000),
    remainingSendsInWindow: window30m.remaining,
  };
}

/**
 * Verifies submitted 6-digit OTP against HMAC hash in shared store using constant-time comparison.
 */
export async function verifyEmailOtp(
  rawEmail: string,
  submittedCode: string
): Promise<{ valid: boolean; locked?: boolean; error?: string }> {
  const normalizedEmail = rawEmail.toLowerCase().trim();
  const emailKey = hashEmail(normalizedEmail);
  const cleanCode = submittedCode.trim();

  const record = await sharedGetJson<StoredOtpRecord>('otp', emailKey);
  if (!record) {
    return {
      valid: false,
      error: 'No active verification code was found for this email or it has expired. Please request a new code.',
    };
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    await sharedDeleteKey('otp', emailKey);
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  const nextAttempts = record.attempts + 1;
  if (nextAttempts > OTP_CONFIG.MAX_VERIFY_ATTEMPTS) {
    await sharedDeleteKey('otp', emailKey);
    return {
      valid: false,
      locked: true,
      error: 'Too many incorrect attempts. This verification code has been invalidated; please request a new code.',
    };
  }

  const providedHmac = computeCodeHmac(normalizedEmail, cleanCode);
  const a = Buffer.from(record.codeHmac, 'hex');
  const b = Buffer.from(providedHmac, 'hex');

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const remainingTtl = Math.max(1000, record.expiresAt - now);
    await sharedSetJson<StoredOtpRecord>(
      'otp',
      emailKey,
      { ...record, attempts: nextAttempts },
      remainingTtl
    );
    const remainingTries = Math.max(0, OTP_CONFIG.MAX_VERIFY_ATTEMPTS - nextAttempts);
    return {
      valid: false,
      error:
        remainingTries > 0
          ? `Incorrect verification code (${remainingTries} ${remainingTries === 1 ? 'attempt' : 'attempts'} remaining).`
          : 'Too many incorrect attempts. Please request a new code.',
    };
  }

  // Single-use OTP: delete immediately upon verification
  await sharedDeleteKey('otp', emailKey);
  return { valid: true };
}
