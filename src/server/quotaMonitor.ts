import crypto from 'node:crypto';

export const QUOTA_CONFIG = {
  DAILY_LIMIT: 50,
  MONTHLY_LIMIT: 500,
};

export interface QuotaSnapshot {
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  usedThisMonth: number;
  monthlyLimit: number;
  remainingThisMonth: number;
  resetsAt: string;
}

export type RequestOutcome =
  | 'success'
  | 'unauthorized'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'validation_error'
  | 'error';

export interface MonitoredRequestEvent {
  requestId: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  outcome: RequestOutcome;
}

interface UserUsageBucket {
  dayKey: string;
  monthKey: string;
  usedToday: number;
  usedThisMonth: number;
  totalRequests: number;
  totalDurationMs: number;
  byEndpoint: Record<string, number>;
  recentRequests: MonitoredRequestEvent[];
}

const userUsageStore = new Map<string, UserUsageBucket>();
const globalStats = {
  totalRequests: 0,
  authFailures: 0,
  rateLimitHits: 0,
  quotaExceededHits: 0,
  errors: 0,
};

function getDayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function getMonthKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7); // YYYY-MM UTC
}

function getNextUtcMidnightIso(now: Date = new Date()): string {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  return next.toISOString();
}

function getOrRolloverBucket(uid: string): UserUsageBucket {
  const now = new Date();
  const dayKey = getDayKey(now);
  const monthKey = getMonthKey(now);

  let bucket = userUsageStore.get(uid);
  if (!bucket) {
    bucket = {
      dayKey,
      monthKey,
      usedToday: 0,
      usedThisMonth: 0,
      totalRequests: 0,
      totalDurationMs: 0,
      byEndpoint: {},
      recentRequests: [],
    };
    userUsageStore.set(uid, bucket);
    return bucket;
  }

  if (bucket.dayKey !== dayKey) {
    bucket.dayKey = dayKey;
    bucket.usedToday = 0;
  }
  if (bucket.monthKey !== monthKey) {
    bucket.monthKey = monthKey;
    bucket.usedThisMonth = 0;
  }
  return bucket;
}

export function getUserQuotaSnapshot(uid: string): QuotaSnapshot {
  const bucket = getOrRolloverBucket(uid);
  return {
    usedToday: bucket.usedToday,
    dailyLimit: QUOTA_CONFIG.DAILY_LIMIT,
    remainingToday: Math.max(0, QUOTA_CONFIG.DAILY_LIMIT - bucket.usedToday),
    usedThisMonth: bucket.usedThisMonth,
    monthlyLimit: QUOTA_CONFIG.MONTHLY_LIMIT,
    remainingThisMonth: Math.max(0, QUOTA_CONFIG.MONTHLY_LIMIT - bucket.usedThisMonth),
    resetsAt: getNextUtcMidnightIso(),
  };
}

export function checkAndConsumeUserQuota(
  uid: string,
  units: number = 1
): { allowed: boolean; quota: QuotaSnapshot; reason?: string } {
  const bucket = getOrRolloverBucket(uid);

  if (bucket.usedToday + units > QUOTA_CONFIG.DAILY_LIMIT) {
    return {
      allowed: false,
      quota: getUserQuotaSnapshot(uid),
      reason: `Daily AI usage quota reached (${bucket.usedToday}/${QUOTA_CONFIG.DAILY_LIMIT}). Resets at ${getNextUtcMidnightIso()}.`,
    };
  }

  if (bucket.usedThisMonth + units > QUOTA_CONFIG.MONTHLY_LIMIT) {
    return {
      allowed: false,
      quota: getUserQuotaSnapshot(uid),
      reason: `Monthly AI usage quota reached (${bucket.usedThisMonth}/${QUOTA_CONFIG.MONTHLY_LIMIT}).`,
    };
  }

  bucket.usedToday += units;
  bucket.usedThisMonth += units;

  return {
    allowed: true,
    quota: getUserQuotaSnapshot(uid),
  };
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 12);
}

export function recordMonitoredRequest(params: {
  endpoint: string;
  method: string;
  uid?: string;
  ip: string;
  statusCode: number;
  durationMs: number;
  outcome: RequestOutcome;
}): void {
  const requestId = crypto.randomUUID().slice(0, 12);
  const timestamp = new Date().toISOString();

  globalStats.totalRequests += 1;
  if (params.outcome === 'unauthorized') globalStats.authFailures += 1;
  if (params.outcome === 'rate_limited') globalStats.rateLimitHits += 1;
  if (params.outcome === 'quota_exceeded') globalStats.quotaExceededHits += 1;
  if (params.outcome === 'error') globalStats.errors += 1;

  if (params.uid) {
    const bucket = getOrRolloverBucket(params.uid);
    bucket.totalRequests += 1;
    bucket.totalDurationMs += params.durationMs;
    bucket.byEndpoint[params.endpoint] = (bucket.byEndpoint[params.endpoint] || 0) + 1;
    bucket.recentRequests.unshift({
      requestId,
      timestamp,
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.statusCode,
      durationMs: Math.round(params.durationMs),
      outcome: params.outcome,
    });
    if (bucket.recentRequests.length > 50) {
      bucket.recentRequests.length = 50;
    }
  }

  // Structured server monitoring log (no tokens, PII emails, or raw IPs)
  console.log(
    JSON.stringify({
      type: 'api_monitor',
      requestId,
      timestamp,
      method: params.method,
      endpoint: params.endpoint,
      uid: params.uid || 'anonymous',
      ipHash: hashIp(params.ip),
      statusCode: params.statusCode,
      durationMs: Math.round(params.durationMs),
      outcome: params.outcome,
    })
  );
}

export function getUserMonitoringSummary(uid: string): {
  totalRequests: number;
  avgLatencyMs: number;
  byEndpoint: Record<string, number>;
  recentRequests: MonitoredRequestEvent[];
} {
  const bucket = getOrRolloverBucket(uid);
  return {
    totalRequests: bucket.totalRequests,
    avgLatencyMs:
      bucket.totalRequests > 0 ? Math.round(bucket.totalDurationMs / bucket.totalRequests) : 0,
    byEndpoint: { ...bucket.byEndpoint },
    recentRequests: bucket.recentRequests.slice(0, 15),
  };
}
