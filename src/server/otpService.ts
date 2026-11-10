// In-memory OTP storage for Email OTP authentication
interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpRecord>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Generate a 6-digit numeric OTP and store it
 */
export function generateEmailOtp(email: string): { code: string; expiresAt: number } {
  const normalizedEmail = email.toLowerCase().trim();
  // Generate random 6-digit number
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(normalizedEmail, {
    code,
    email: normalizedEmail,
    expiresAt,
    attempts: 0
  });

  console.log(`[AUTH-OTP] Generated OTP for ${normalizedEmail}: ${code} (expires in 10 mins)`);
  return { code, expiresAt };
}

/**
 * Verify submitted OTP against stored code
 */
export function verifyEmailOtp(email: string, submittedCode: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = submittedCode.trim();

  const record = otpStore.get(normalizedEmail);
  if (!record) {
    return { valid: false, error: 'No verification code was requested for this email or it has expired. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (record.code !== cleanCode) {
    return { valid: false, error: 'Incorrect verification code. Please check your email and try again.' };
  }

  // Code is valid! Consume it so it cannot be reused
  otpStore.delete(normalizedEmail);
  return { valid: true };
}
