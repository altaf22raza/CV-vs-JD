import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Redis } from 'ioredis';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminFirestore, hasExplicitServiceAccountEnv } from './firebaseAdmin.ts';

export type SharedStoreBackend = 'redis' | 'firestore' | 'sqlite';

export class SharedStoreUnavailableError extends Error {
  readonly statusCode = 503;
  readonly code = 'OTP_STORAGE_UNAVAILABLE';

  constructor(
    message = 'Verification storage service is unavailable. Please configure Redis or Firestore Admin credentials.'
  ) {
    super(message);
    this.name = 'SharedStoreUnavailableError';
  }
}

export interface WindowCheckResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSec: number;
}

// ---- Lazy Redis Client ----
let redisClient: Redis | null = null;
let redisErrorLogged = false;

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  if (!redisClient) {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    redisClient.on('error', (err) => {
      if (!redisErrorLogged) {
        redisErrorLogged = true;
        console.error('[STORE] Redis error:', err.message);
      }
    });
  }
  return redisClient;
}

// ---- Lazy Firestore Admin Client ----
let firestoreDb: Firestore | null = null;
let firestoreInitAttempted = false;

function shouldUseFirestoreBackend(): boolean {
  const explicit = process.env.OTP_STORAGE_BACKEND?.trim().toLowerCase();
  if (explicit === 'firestore') return true;
  if (explicit === 'sqlite' || explicit === 'redis') return false;
  return Boolean(hasExplicitServiceAccountEnv() || process.env.K_SERVICE?.trim());
}

function getFirestoreAdminDb(): Firestore | null {
  if (!shouldUseFirestoreBackend()) return null;
  if (firestoreDb) return firestoreDb;
  if (firestoreInitAttempted) return null;
  firestoreInitAttempted = true;

  try {
    firestoreDb = getFirebaseAdminFirestore();
    return firestoreDb;
  } catch (err) {
    console.error(
      '[STORE] Failed to initialize Firestore Admin:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// ---- Lazy SQLite Shared Local Store (Dev / Explicit SQLite Path) ----
let sqliteDb: DatabaseSync | null = null;
let sqlitePathInUse: string | null = null;

function getSqliteDb(): DatabaseSync {
  const dbPath =
    process.env.OTP_SQLITE_PATH?.trim() || path.resolve('/tmp', 'cvvsjd-auth-shared.sqlite');

  if (sqliteDb && sqlitePathInUse === dbPath) {
    return sqliteDb;
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(dbPath);
  sqlitePathInUse = dbPath;
  sqliteDb.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS auth_kv (
      k TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_kv_expires ON auth_kv (expires_at);
    CREATE TABLE IF NOT EXISTS auth_rate_windows (
      bucket_key TEXT NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_rate_bucket_ts ON auth_rate_windows (bucket_key, ts);
  `);

  return sqliteDb;
}

export function resolveSharedStoreBackend(): SharedStoreBackend {
  if (process.env.REDIS_URL?.trim()) {
    return 'redis';
  }
  if (shouldUseFirestoreBackend()) {
    return 'firestore';
  }
  if (process.env.NODE_ENV === 'production' && !process.env.OTP_SQLITE_PATH?.trim()) {
    throw new SharedStoreUnavailableError(
      'Production deployment requires REDIS_URL or Firestore Admin credentials for shared OTP storage.'
    );
  }
  return 'sqlite';
}

function makeDocId(namespace: string, key: string): string {
  const cleanNs = namespace.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
  const hash = crypto.createHash('sha256').update(`${namespace}:${key}`).digest('hex').slice(0, 40);
  return `${cleanNs}_${hash}`;
}

export async function sharedGetJson<T>(namespace: string, key: string): Promise<T | null> {
  const backend = resolveSharedStoreBackend();
  const fullKey = `cvvsjd:${namespace}:${key}`;

  if (backend === 'redis') {
    const client = getRedisClient();
    if (!client) throw new SharedStoreUnavailableError();
    try {
      const raw = await client.get(fullKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      console.error('[STORE] Redis get error:', err instanceof Error ? err.message : err);
      throw new SharedStoreUnavailableError('Redis OTP store is unreachable.');
    }
  }

  if (backend === 'firestore') {
    const db = getFirestoreAdminDb();
    if (!db) throw new SharedStoreUnavailableError('Firestore Admin could not be initialized.');
    const col = namespace === 'otp' ? 'auth_otps' : 'auth_rate_limits';
    const docId = makeDocId(namespace, key);
    try {
      const snap = await db.collection(col).doc(docId).get();
      if (!snap.exists) return null;
      const data = snap.data() as { payload?: T; expiresAt?: number } | undefined;
      if (!data || typeof data.expiresAt !== 'number' || Date.now() > data.expiresAt) {
        await db.collection(col).doc(docId).delete().catch(() => {});
        return null;
      }
      return (data.payload ?? null) as T | null;
    } catch (err) {
      console.error('[STORE] Firestore get error:', err instanceof Error ? err.message : err);
      throw new SharedStoreUnavailableError('Firestore OTP store request failed.');
    }
  }

  const db = getSqliteDb();
  const now = Date.now();
  db.prepare('DELETE FROM auth_kv WHERE expires_at <= ?').run(now);
  const row = db
    .prepare('SELECT value_json, expires_at FROM auth_kv WHERE k = ?')
    .get(fullKey) as { value_json: string; expires_at: number } | undefined;
  if (!row || row.expires_at <= now) {
    if (row) db.prepare('DELETE FROM auth_kv WHERE k = ?').run(fullKey);
    return null;
  }
  return JSON.parse(row.value_json) as T;
}

export async function sharedSetJson<T>(
  namespace: string,
  key: string,
  value: T,
  ttlMs: number
): Promise<void> {
  const backend = resolveSharedStoreBackend();
  const fullKey = `cvvsjd:${namespace}:${key}`;
  const expiresAt = Date.now() + Math.max(1000, ttlMs);

  if (backend === 'redis') {
    const client = getRedisClient();
    if (!client) throw new SharedStoreUnavailableError();
    try {
      await client.set(fullKey, JSON.stringify(value), 'PX', Math.max(1000, ttlMs));
      return;
    } catch (err) {
      console.error('[STORE] Redis set error:', err instanceof Error ? err.message : err);
      throw new SharedStoreUnavailableError('Redis OTP store is unreachable.');
    }
  }

  if (backend === 'firestore') {
    const db = getFirestoreAdminDb();
    if (!db) throw new SharedStoreUnavailableError('Firestore Admin could not be initialized.');
    const col = namespace === 'otp' ? 'auth_otps' : 'auth_rate_limits';
    const docId = makeDocId(namespace, key);
    try {
      await db.collection(col).doc(docId).set({
        payload: value,
        expiresAt,
        expireAt: Timestamp.fromMillis(expiresAt),
        updatedAt: Date.now(),
      });
      return;
    } catch (err) {
      console.error('[STORE] Firestore set error:', err instanceof Error ? err.message : err);
      throw new SharedStoreUnavailableError('Firestore OTP store write failed.');
    }
  }

  const db = getSqliteDb();
  db.prepare(
    `INSERT INTO auth_kv (k, value_json, expires_at)
     VALUES (?, ?, ?)
     ON CONFLICT(k) DO UPDATE SET value_json = excluded.value_json, expires_at = excluded.expires_at`
  ).run(fullKey, JSON.stringify(value), expiresAt);
}

export async function sharedDeleteKey(namespace: string, key: string): Promise<void> {
  const backend = resolveSharedStoreBackend();
  const fullKey = `cvvsjd:${namespace}:${key}`;

  if (backend === 'redis') {
    const client = getRedisClient();
    if (!client) return;
    await client.del(fullKey).catch(() => {});
    return;
  }

  if (backend === 'firestore') {
    const db = getFirestoreAdminDb();
    if (!db) return;
    const col = namespace === 'otp' ? 'auth_otps' : 'auth_rate_limits';
    const docId = makeDocId(namespace, key);
    await db.collection(col).doc(docId).delete().catch(() => {});
    return;
  }

  const db = getSqliteDb();
  db.prepare('DELETE FROM auth_kv WHERE k = ?').run(fullKey);
}

/**
 * Shared sliding-window rate limit check and atomic increment across Redis, Firestore, or SQLite.
 */
export async function sharedCheckAndIncrementWindow(
  namespace: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<WindowCheckResult> {
  const backend = resolveSharedStoreBackend();
  const fullKey = `cvvsjd:rl:${namespace}:${key}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  if (backend === 'redis') {
    const client = getRedisClient();
    if (!client) throw new SharedStoreUnavailableError();
    try {
      const member = `${now}-${crypto.randomUUID().slice(0, 8)}`;
      await client.zremrangebyscore(fullKey, 0, cutoff);
      const currentCount = await client.zcard(fullKey);
      if (currentCount >= limit) {
        const oldest = (await client.call('ZRANGE', fullKey, 0, 0, 'WITHSCORES')) as string[];
        const oldestTs = Array.isArray(oldest) && oldest.length >= 2 ? Number(oldest[1]) : now;
        const resetAtMs = oldestTs + windowMs;
        return {
          allowed: false,
          count: currentCount,
          limit,
          remaining: 0,
          resetAtMs,
          retryAfterSec: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
        };
      }
      await client
        .multi()
        .zadd(fullKey, now, member)
        .pexpire(fullKey, windowMs)
        .exec();
      const oldest = (await client.call('ZRANGE', fullKey, 0, 0, 'WITHSCORES')) as string[];
      const oldestTs = Array.isArray(oldest) && oldest.length >= 2 ? Number(oldest[1]) : now;
      return {
        allowed: true,
        count: currentCount + 1,
        limit,
        remaining: Math.max(0, limit - (currentCount + 1)),
        resetAtMs: oldestTs + windowMs,
        retryAfterSec: 0,
      };
    } catch (err) {
      console.error('[STORE] Redis rate limit error:', err instanceof Error ? err.message : err);
      throw new SharedStoreUnavailableError('Redis rate-limit store is unreachable.');
    }
  }

  if (backend === 'firestore') {
    const db = getFirestoreAdminDb();
    if (!db) throw new SharedStoreUnavailableError('Firestore Admin could not be initialized.');
    const docId = makeDocId(`rl:${namespace}`, key);
    const ref = db.collection('auth_rate_limits').doc(docId);

    try {
      return await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const rawTimestamps: number[] = snap.exists
          ? Array.isArray(snap.data()?.timestamps)
            ? (snap.data()?.timestamps as number[])
            : []
          : [];
        const active = rawTimestamps.filter((t) => typeof t === 'number' && t > cutoff);

        if (active.length >= limit) {
          const oldest = active[0] || now;
          const resetAtMs = oldest + windowMs;
          return {
            allowed: false,
            count: active.length,
            limit,
            remaining: 0,
            resetAtMs,
            retryAfterSec: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
          };
        }

        const next = [...active, now];
        const expiresAt = now + windowMs;
        tx.set(ref, {
          timestamps: next,
          expiresAt,
          expireAt: Timestamp.fromMillis(expiresAt),
          updatedAt: now,
        });
        const oldest = next[0] || now;
        return {
          allowed: true,
          count: next.length,
          limit,
          remaining: Math.max(0, limit - next.length),
          resetAtMs: oldest + windowMs,
          retryAfterSec: 0,
        };
      });
    } catch (err) {
      console.error('[STORE] Firestore rate limit error:', err instanceof Error ? err.message : err);
      throw new SharedStoreUnavailableError('Firestore rate-limit store failed.');
    }
  }

  const db = getSqliteDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('DELETE FROM auth_rate_windows WHERE bucket_key = ? AND ts <= ?').run(
      fullKey,
      cutoff
    );
    const rows = db
      .prepare('SELECT ts FROM auth_rate_windows WHERE bucket_key = ? ORDER BY ts ASC')
      .all(fullKey) as { ts: number }[];

    if (rows.length >= limit) {
      const oldest = rows[0]?.ts || now;
      const resetAtMs = oldest + windowMs;
      db.exec('COMMIT');
      return {
        allowed: false,
        count: rows.length,
        limit,
        remaining: 0,
        resetAtMs,
        retryAfterSec: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
      };
    }

    db.prepare('INSERT INTO auth_rate_windows (bucket_key, ts) VALUES (?, ?)').run(fullKey, now);
    const oldest = rows[0]?.ts || now;
    db.exec('COMMIT');
    return {
      allowed: true,
      count: rows.length + 1,
      limit,
      remaining: Math.max(0, limit - (rows.length + 1)),
      resetAtMs: oldest + windowMs,
      retryAfterSec: 0,
    };
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    throw err;
  }
}
