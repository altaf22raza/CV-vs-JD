import { z } from 'zod';
import {
  AiServiceError,
  analyzeJdAndResume,
  generateCoverLetter,
  generateInterviewPrep,
  optimizeLinkedInProfile,
  optimizeResumeWithJd,
  rewriteSingleSection,
  translateStructuredResume,
} from './geminiBackend.ts';
import { issueEmailOtp, verifyEmailOtp } from './otpService.ts';
import {
  EmailDeliveryFailedError,
  EmailDeliveryNotConfiguredError,
} from './emailDelivery.ts';
import { SharedStoreUnavailableError } from './sharedStore.ts';
import {
  AnalyzeJdRequestSchema,
  GenerateCoverLetterRequestSchema,
  GenerateInterviewPrepRequestSchema,
  OptimizeLinkedInRequestSchema,
  OptimizeResumeRequestSchema,
  RewriteSectionRequestSchema,
  SendOtpRequestSchema,
  TranslateResumeRequestSchema,
  VerifyOtpRequestSchema,
} from './schemas.ts';
import {
  FirebaseCustomTokenUnavailableError,
  mintFirebaseCustomTokenForEmail,
} from './firebaseCustomAuth.ts';
import {
  authenticateRequest,
  type AuthenticatedUser,
} from './authMiddleware.ts';
import {
  checkAiIpRateLimit,
  checkAiUserRateLimit,
  checkSharedAuthSendIpLimit,
  checkSharedAuthVerifyIpLimit,
  normalizeClientIp,
  peekUserRateLimitStatus,
  type RateLimitDecision,
} from './rateLimiter.ts';
import {
  checkAndConsumeUserQuota,
  getUserMonitoringSummary,
  getUserQuotaSnapshot,
  recordMonitoredRequest,
  type QuotaSnapshot,
} from './quotaMonitor.ts';
import type { StructuredResume } from '../types/resume.ts';

export interface ApiDispatchResult {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

interface ApiDispatchParams {
  method: string;
  url: string;
  body: unknown;
  authorization?: string | string[];
  clientIp?: string;
}

function formatZodError(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return 'Invalid request payload';
  const path = first.path.length ? `${first.path.join('.')}: ` : '';
  return `${path}${first.message}`;
}

function buildRateLimitHeaders(
  decision: RateLimitDecision,
  quota?: QuotaSnapshot
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': String(Math.ceil(decision.resetAtMs / 1000)),
  };

  if (!decision.allowed && decision.retryAfterSec > 0) {
    headers['Retry-After'] = String(decision.retryAfterSec);
  }

  if (quota) {
    headers['X-Quota-Limit'] = String(quota.dailyLimit);
    headers['X-Quota-Remaining'] = String(quota.remainingToday);
    headers['X-Quota-Monthly-Remaining'] = String(quota.remainingThisMonth);
  }

  return headers;
}

/**
 * Shared security pipeline for all protected AI endpoints:
 * 1. Authenticate Bearer token (returns 401 on missing/invalid/expired/revoked credentials)
 * 2. Enforce per-IP sliding-window rate limit (429 + Retry-After)
 * 3. Enforce per-user sliding-window rate limit (429 + Retry-After)
 * 4. Validate request payload schema with Zod (400 on bad input without burning quota)
 * 5. Enforce & consume per-user daily/monthly AI quota (429 QUOTA_EXCEEDED)
 * 6. Execute Gemini handler + record structured monitoring metrics & latency
 */
async function handleProtectedAiRoute<TSchema extends z.ZodTypeAny>(
  params: ApiDispatchParams,
  cleanUrl: string,
  clientIp: string,
  schema: TSchema,
  handler: (data: z.infer<TSchema>, user: AuthenticatedUser) => Promise<Record<string, unknown>>
): Promise<ApiDispatchResult> {
  const startMs = performance.now();
  const method = params.method.toUpperCase();

  // 1. Authentication check -> strictly return 401 when unauthenticated
  const authResult = await authenticateRequest(params.authorization);
  if (!authResult.ok) {
    recordMonitoredRequest({
      endpoint: cleanUrl,
      method,
      ip: clientIp,
      statusCode: 401,
      durationMs: performance.now() - startMs,
      outcome: 'unauthorized',
    });
    return {
      status: 401,
      body: {
        error: authResult.error,
        code: 'UNAUTHORIZED',
      },
    };
  }

  const { user } = authResult;

  // 2. Per-IP rate limit
  const ipLimit = checkAiIpRateLimit(clientIp);
  if (!ipLimit.allowed) {
    recordMonitoredRequest({
      endpoint: cleanUrl,
      method,
      uid: user.uid,
      ip: clientIp,
      statusCode: 429,
      durationMs: performance.now() - startMs,
      outcome: 'rate_limited',
    });
    return {
      status: 429,
      headers: buildRateLimitHeaders(ipLimit),
      body: {
        error: `Too many requests from this IP address. Please retry in ${ipLimit.retryAfterSec}s.`,
        code: 'RATE_LIMITED',
        scope: 'ip',
        retryAfterSec: ipLimit.retryAfterSec,
      },
    };
  }

  // 3. Per-user rate limit
  const userLimit = checkAiUserRateLimit(user.uid);
  if (!userLimit.allowed) {
    recordMonitoredRequest({
      endpoint: cleanUrl,
      method,
      uid: user.uid,
      ip: clientIp,
      statusCode: 429,
      durationMs: performance.now() - startMs,
      outcome: 'rate_limited',
    });
    return {
      status: 429,
      headers: buildRateLimitHeaders(userLimit),
      body: {
        error: `Rate limit exceeded (${userLimit.limit} AI requests allowed per window). Please retry in ${userLimit.retryAfterSec}s.`,
        code: 'RATE_LIMITED',
        scope: 'user',
        retryAfterSec: userLimit.retryAfterSec,
      },
    };
  }

  // 4. Request schema validation (before quota deduction so invalid inputs don't spend quota)
  const parsed = schema.safeParse(params.body);
  if (!parsed.success) {
    const currentQuota = getUserQuotaSnapshot(user.uid);
    recordMonitoredRequest({
      endpoint: cleanUrl,
      method,
      uid: user.uid,
      ip: clientIp,
      statusCode: 400,
      durationMs: performance.now() - startMs,
      outcome: 'validation_error',
    });
    return {
      status: 400,
      headers: buildRateLimitHeaders(userLimit, currentQuota),
      body: {
        error: formatZodError(parsed.error),
        code: 'VALIDATION_ERROR',
      },
    };
  }

  // 5. Daily & Monthly Usage Quota enforcement
  const quotaResult = checkAndConsumeUserQuota(user.uid, 1);
  if (!quotaResult.allowed) {
    recordMonitoredRequest({
      endpoint: cleanUrl,
      method,
      uid: user.uid,
      ip: clientIp,
      statusCode: 429,
      durationMs: performance.now() - startMs,
      outcome: 'quota_exceeded',
    });
    return {
      status: 429,
      headers: buildRateLimitHeaders(userLimit, quotaResult.quota),
      body: {
        error: quotaResult.reason || 'AI usage quota exceeded. Please try again after reset.',
        code: 'QUOTA_EXCEEDED',
        quota: quotaResult.quota,
      },
    };
  }

  // 6. Execute AI operation
  try {
    const resultBody = await handler(parsed.data, user);
    recordMonitoredRequest({
      endpoint: cleanUrl,
      method,
      uid: user.uid,
      ip: clientIp,
      statusCode: 200,
      durationMs: performance.now() - startMs,
      outcome: 'success',
    });
    return {
      status: 200,
      headers: buildRateLimitHeaders(userLimit, quotaResult.quota),
      body: resultBody,
    };
  } catch (err) {
    const statusCode = err instanceof AiServiceError ? err.statusCode : 500;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    recordMonitoredRequest({
      endpoint: cleanUrl,
      method,
      uid: user.uid,
      ip: clientIp,
      statusCode,
      durationMs: performance.now() - startMs,
      outcome: 'error',
    });
    if (!(err instanceof AiServiceError)) {
      console.error(`API error [${method} ${cleanUrl}]:`, err);
    }
    return {
      status: statusCode,
      headers: buildRateLimitHeaders(userLimit, quotaResult.quota),
      body: { error: msg },
    };
  }
}

/**
 * Unified server request dispatcher shared between Express (prod) and Vite dev middleware.
 */
export async function handleApiRequest(params: ApiDispatchParams): Promise<ApiDispatchResult> {
  const cleanUrl = params.url.split('?')[0];
  const method = params.method.toUpperCase();
  const clientIp = normalizeClientIp(params.clientIp);

  try {
    // ---- Auth & Session Endpoints ----
    if (method === 'POST' && cleanUrl === '/api/auth/send-otp') {
      const authIpLimit = await checkSharedAuthSendIpLimit(clientIp);
      if (!authIpLimit.allowed) {
        return {
          status: 429,
          headers: buildRateLimitHeaders(authIpLimit),
          body: {
            error: `Too many verification requests from this IP address. Please retry in ${authIpLimit.retryAfterSec}s.`,
            code: 'RATE_LIMITED',
            retryAfterSec: authIpLimit.retryAfterSec,
          },
        };
      }

      const parsed = SendOtpRequestSchema.safeParse(params.body);
      if (!parsed.success) {
        return { status: 400, body: { error: formatZodError(parsed.error) } };
      }

      const { email } = parsed.data;
      const otpResult = await issueEmailOtp(email);
      if (otpResult.rateLimited) {
        return {
          status: 429,
          headers: { 'Retry-After': String(otpResult.retryAfterSec || 45) },
          body: {
            error:
              otpResult.error ||
              `Please wait ${otpResult.retryAfterSec}s before requesting another code.`,
            code: 'OTP_RESEND_LIMITED',
            retryAfterSec: otpResult.retryAfterSec,
          },
        };
      }

      return {
        status: 200,
        headers: buildRateLimitHeaders(authIpLimit),
        body: {
          success: true,
          message: `Verification code sent to ${email}`,
          expiresAt: otpResult.expiresAt,
          resendCooldownSec: otpResult.resendCooldownSec,
        },
      };
    }

    if (method === 'POST' && cleanUrl === '/api/auth/verify-otp') {
      const authIpLimit = await checkSharedAuthVerifyIpLimit(clientIp);
      if (!authIpLimit.allowed) {
        return {
          status: 429,
          headers: buildRateLimitHeaders(authIpLimit),
          body: {
            error: `Too many verification attempts from this IP address. Please retry in ${authIpLimit.retryAfterSec}s.`,
            code: 'RATE_LIMITED',
            retryAfterSec: authIpLimit.retryAfterSec,
          },
        };
      }

      const parsed = VerifyOtpRequestSchema.safeParse(params.body);
      if (!parsed.success) {
        return { status: 400, body: { error: formatZodError(parsed.error) } };
      }

      const { email, otp } = parsed.data;
      const result = await verifyEmailOtp(email, otp);
      if (!result.valid) {
        return {
          status: result.locked ? 429 : 400,
          headers: buildRateLimitHeaders(authIpLimit),
          body: { error: result.error || 'Invalid verification code' },
        };
      }

      const cleanEmail = email.toLowerCase().trim();
      const { customToken, user } = await mintFirebaseCustomTokenForEmail(cleanEmail);

      return {
        status: 200,
        headers: buildRateLimitHeaders(authIpLimit),
        body: {
          success: true,
          customToken,
          user,
        },
      };
    }

    // ---- Protected Usage Quota & Request Monitoring Endpoint ----
    if (method === 'GET' && cleanUrl === '/api/usage') {
      const startMs = performance.now();
      const authRes = await authenticateRequest(params.authorization);
      if (!authRes.ok) {
        recordMonitoredRequest({
          endpoint: cleanUrl,
          method,
          ip: clientIp,
          statusCode: 401,
          durationMs: performance.now() - startMs,
          outcome: 'unauthorized',
        });
        return {
          status: 401,
          body: { error: authRes.error, code: 'UNAUTHORIZED' },
        };
      }

      const quota = getUserQuotaSnapshot(authRes.user.uid);
      const rateLimit = peekUserRateLimitStatus(authRes.user.uid);
      const monitoring = getUserMonitoringSummary(authRes.user.uid);

      return {
        status: 200,
        body: {
          user: {
            uid: authRes.user.uid,
            email: authRes.user.email,
            displayName: authRes.user.displayName,
            provider: authRes.user.provider,
          },
          quota,
          rateLimit,
          monitoring,
        },
      };
    }

    // ---- Protected AI API Endpoints (Auth + Rate Limit + Schema + Quota + Monitoring) ----
    if (method === 'POST' && cleanUrl === '/api/analyze-jd') {
      return await handleProtectedAiRoute(
        params,
        cleanUrl,
        clientIp,
        AnalyzeJdRequestSchema,
        async ({ jdText, resumeData, companyName, targetRole }) => {
          const result = await analyzeJdAndResume(
            jdText,
            resumeData as StructuredResume,
            companyName,
            targetRole
          );
          return result as unknown as Record<string, unknown>;
        }
      );
    }

    if (method === 'POST' && cleanUrl === '/api/optimize-resume') {
      return await handleProtectedAiRoute(
        params,
        cleanUrl,
        clientIp,
        OptimizeResumeRequestSchema,
        async ({ resumeData, jdText, options }) => {
          const result = await optimizeResumeWithJd(
            resumeData as StructuredResume,
            jdText,
            options || {}
          );
          return result as unknown as Record<string, unknown>;
        }
      );
    }

    if (method === 'POST' && cleanUrl === '/api/rewrite-section') {
      return await handleProtectedAiRoute(
        params,
        cleanUrl,
        clientIp,
        RewriteSectionRequestSchema,
        async ({ sectionName, currentText, instruction, jdText }) => {
          const result = await rewriteSingleSection(sectionName, currentText, instruction, jdText);
          return result as unknown as Record<string, unknown>;
        }
      );
    }

    if (method === 'POST' && cleanUrl === '/api/generate-cover-letter') {
      return await handleProtectedAiRoute(
        params,
        cleanUrl,
        clientIp,
        GenerateCoverLetterRequestSchema,
        async ({ resumeData, jdText, options }) => {
          const result = await generateCoverLetter(
            resumeData as StructuredResume,
            jdText,
            options || {}
          );
          return result as unknown as Record<string, unknown>;
        }
      );
    }

    if (method === 'POST' && cleanUrl === '/api/optimize-linkedin') {
      return await handleProtectedAiRoute(
        params,
        cleanUrl,
        clientIp,
        OptimizeLinkedInRequestSchema,
        async ({ resumeData, jdText, targetRole, language }) => {
          const result = await optimizeLinkedInProfile(
            resumeData as StructuredResume,
            jdText,
            targetRole,
            language
          );
          return result as unknown as Record<string, unknown>;
        }
      );
    }

    if (method === 'POST' && cleanUrl === '/api/generate-interview-prep') {
      return await handleProtectedAiRoute(
        params,
        cleanUrl,
        clientIp,
        GenerateInterviewPrepRequestSchema,
        async ({ resumeData, jdText, targetRole, companyName, language }) => {
          const result = await generateInterviewPrep(
            resumeData as StructuredResume,
            jdText,
            targetRole,
            companyName,
            language
          );
          return result as unknown as Record<string, unknown>;
        }
      );
    }

    if (method === 'POST' && cleanUrl === '/api/translate-resume') {
      return await handleProtectedAiRoute(
        params,
        cleanUrl,
        clientIp,
        TranslateResumeRequestSchema,
        async ({ resumeData, targetLanguage }) => {
          const result = await translateStructuredResume(
            resumeData as StructuredResume,
            targetLanguage
          );
          return result as unknown as Record<string, unknown>;
        }
      );
    }

    return { status: 404, body: { error: `Endpoint not found: ${cleanUrl}` } };
  } catch (err) {
    if (
      err instanceof EmailDeliveryNotConfiguredError ||
      err instanceof EmailDeliveryFailedError ||
      err instanceof SharedStoreUnavailableError ||
      err instanceof FirebaseCustomTokenUnavailableError
    ) {
      return {
        status: err.statusCode,
        body: { error: err.message, code: err.code },
      };
    }
    if (err instanceof AiServiceError) {
      return { status: err.statusCode, body: { error: err.message } };
    }
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error(`API error [${method} ${cleanUrl}]:`, err);
    return { status: 500, body: { error: msg } };
  }
}
