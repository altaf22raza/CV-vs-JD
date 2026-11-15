import { sharedCheckAndIncrementWindow } from './sharedStore.ts';

interface BucketState {
  timestamps: number[];
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSec: number;
  scope: 'ip' | 'user' | 'auth-ip';
}

const buckets = new Map<string, BucketState>();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  const maxHorizon = 60 * 60 * 1000;
  for (const [key, state] of buckets.entries()) {
    state.timestamps = state.timestamps.filter((t) => now - t < maxHorizon);
    if (state.timestamps.length === 0) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

function checkWindow(
  key: string,
  limit: number,
  windowMs: number,
  scope: RateLimitDecision['scope'],
  consume: boolean = true
): RateLimitDecision {
  const now = Date.now();
  const existing = buckets.get(key) || { timestamps: [] };
  const active = existing.timestamps.filter((t) => now - t < windowMs);

  if (active.length >= limit) {
    const oldest = active[0] || now;
    const resetAtMs = oldest + windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
    buckets.set(key, { timestamps: active });
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAtMs,
      retryAfterSec,
      scope,
    };
  }

  if (consume) {
    active.push(now);
  }
  buckets.set(key, { timestamps: active });

  const oldest = active[0] || now;
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - active.length),
    resetAtMs: oldest + windowMs,
    retryAfterSec: 0,
    scope,
  };
}

export const RATE_LIMIT_CONFIG = {
  AUTH_IP_LIMIT: 15,
  AUTH_IP_WINDOW_MS: 10 * 60 * 1000, // 15 auth calls / 10 min per IP
  AUTH_SEND_OTP_IP_10M_LIMIT: 5,
  AUTH_SEND_OTP_IP_10M_WINDOW_MS: 10 * 60 * 1000, // 5 OTP sends / 10 min per IP
  AUTH_SEND_OTP_IP_24H_LIMIT: 20,
  AUTH_SEND_OTP_IP_24H_WINDOW_MS: 24 * 60 * 60 * 1000, // 20 OTP sends / 24h per IP
  AUTH_VERIFY_OTP_IP_15M_LIMIT: 10,
  AUTH_VERIFY_OTP_IP_15M_WINDOW_MS: 15 * 60 * 1000, // 10 verify attempts / 15 min per IP
  AI_IP_MINUTE_LIMIT: 30,
  AI_IP_MINUTE_WINDOW_MS: 60 * 1000, // 30 AI calls / min per IP
  AI_IP_HOUR_LIMIT: 200,
  AI_IP_HOUR_WINDOW_MS: 60 * 60 * 1000, // 200 AI calls / hour per IP
  AI_USER_MINUTE_LIMIT: 12,
  AI_USER_MINUTE_WINDOW_MS: 60 * 1000, // 12 AI calls / min per user
  AI_USER_HOUR_LIMIT: 100,
  AI_USER_HOUR_WINDOW_MS: 60 * 60 * 1000, // 100 AI calls / hour per user
};

export function normalizeClientIp(rawIp?: string): string {
  if (!rawIp || typeof rawIp !== 'string') return 'unknown';
  const first = rawIp.split(',')[0]?.trim() || 'unknown';
  return first.replace(/^::ffff:/, '').slice(0, 64) || 'unknown';
}

export function checkAuthIpRateLimit(ip: string): RateLimitDecision {
  return checkWindow(
    `auth:ip:${ip}`,
    RATE_LIMIT_CONFIG.AUTH_IP_LIMIT,
    RATE_LIMIT_CONFIG.AUTH_IP_WINDOW_MS,
    'auth-ip'
  );
}

/**
 * Shared-store IP rate limit for sending OTP emails (5 per 10 min, 20 per 24h per IP).
 */
export async function checkSharedAuthSendIpLimit(ip: string): Promise<RateLimitDecision> {
  const burst = await sharedCheckAndIncrementWindow(
    'auth_send_ip_10m',
    ip,
    RATE_LIMIT_CONFIG.AUTH_SEND_OTP_IP_10M_LIMIT,
    RATE_LIMIT_CONFIG.AUTH_SEND_OTP_IP_10M_WINDOW_MS
  );
  if (!burst.allowed) {
    return {
      allowed: false,
      limit: burst.limit,
      remaining: 0,
      resetAtMs: burst.resetAtMs,
      retryAfterSec: burst.retryAfterSec,
      scope: 'auth-ip',
    };
  }

  const daily = await sharedCheckAndIncrementWindow(
    'auth_send_ip_24h',
    ip,
    RATE_LIMIT_CONFIG.AUTH_SEND_OTP_IP_24H_LIMIT,
    RATE_LIMIT_CONFIG.AUTH_SEND_OTP_IP_24H_WINDOW_MS
  );
  return {
    allowed: daily.allowed,
    limit: burst.allowed ? Math.min(burst.limit, daily.limit) : daily.limit,
    remaining: Math.min(burst.remaining, daily.remaining),
    resetAtMs: daily.allowed ? burst.resetAtMs : daily.resetAtMs,
    retryAfterSec: daily.retryAfterSec,
    scope: 'auth-ip',
  };
}

/**
 * Shared-store IP rate limit for verifying OTP codes (10 attempts per 15 min per IP).
 */
export async function checkSharedAuthVerifyIpLimit(ip: string): Promise<RateLimitDecision> {
  const res = await sharedCheckAndIncrementWindow(
    'auth_verify_ip_15m',
    ip,
    RATE_LIMIT_CONFIG.AUTH_VERIFY_OTP_IP_15M_LIMIT,
    RATE_LIMIT_CONFIG.AUTH_VERIFY_OTP_IP_15M_WINDOW_MS
  );
  return {
    allowed: res.allowed,
    limit: res.limit,
    remaining: res.remaining,
    resetAtMs: res.resetAtMs,
    retryAfterSec: res.retryAfterSec,
    scope: 'auth-ip',
  };
}

export function checkAiIpRateLimit(ip: string): RateLimitDecision {
  const minCheck = checkWindow(
    `ai:ip:1m:${ip}`,
    RATE_LIMIT_CONFIG.AI_IP_MINUTE_LIMIT,
    RATE_LIMIT_CONFIG.AI_IP_MINUTE_WINDOW_MS,
    'ip',
    true
  );
  if (!minCheck.allowed) return minCheck;

  const hrCheck = checkWindow(
    `ai:ip:1h:${ip}`,
    RATE_LIMIT_CONFIG.AI_IP_HOUR_LIMIT,
    RATE_LIMIT_CONFIG.AI_IP_HOUR_WINDOW_MS,
    'ip',
    true
  );
  return hrCheck;
}

export function checkAiUserRateLimit(uid: string): RateLimitDecision {
  const minCheck = checkWindow(
    `ai:usr:1m:${uid}`,
    RATE_LIMIT_CONFIG.AI_USER_MINUTE_LIMIT,
    RATE_LIMIT_CONFIG.AI_USER_MINUTE_WINDOW_MS,
    'user',
    true
  );
  if (!minCheck.allowed) return minCheck;

  const hrCheck = checkWindow(
    `ai:usr:1h:${uid}`,
    RATE_LIMIT_CONFIG.AI_USER_HOUR_LIMIT,
    RATE_LIMIT_CONFIG.AI_USER_HOUR_WINDOW_MS,
    'user',
    true
  );
  return hrCheck;
}

export function peekUserRateLimitStatus(uid: string): {
  perMinuteLimit: number;
  remainingThisMinute: number;
  perHourLimit: number;
  remainingThisHour: number;
} {
  const minPeek = checkWindow(
    `ai:usr:1m:${uid}`,
    RATE_LIMIT_CONFIG.AI_USER_MINUTE_LIMIT,
    RATE_LIMIT_CONFIG.AI_USER_MINUTE_WINDOW_MS,
    'user',
    false
  );
  const hrPeek = checkWindow(
    `ai:usr:1h:${uid}`,
    RATE_LIMIT_CONFIG.AI_USER_HOUR_LIMIT,
    RATE_LIMIT_CONFIG.AI_USER_HOUR_WINDOW_MS,
    'user',
    false
  );
  return {
    perMinuteLimit: RATE_LIMIT_CONFIG.AI_USER_MINUTE_LIMIT,
    remainingThisMinute: minPeek.remaining,
    perHourLimit: RATE_LIMIT_CONFIG.AI_USER_HOUR_LIMIT,
    remainingThisHour: hrPeek.remaining,
  };
}
