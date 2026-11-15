import {
  StructuredResume,
  ATSReport,
  DiffItem,
  JDAnalysis,
  CoverLetterResult,
  LinkedInOptimizationResult,
  InterviewQuestion,
  SupportedLanguage,
} from '../types/resume';
import {
  getActiveBearerToken,
  notifyUnauthorizedApiResponse,
} from './authTokenStore';

const DEFAULT_AI_TIMEOUT_MS = 45_000;

export interface UsageStatsResponse {
  user: {
    uid: string;
    email: string;
    displayName: string;
    provider: string;
  };
  quota: {
    usedToday: number;
    dailyLimit: number;
    remainingToday: number;
    usedThisMonth: number;
    monthlyLimit: number;
    remainingThisMonth: number;
    resetsAt: string;
  };
  rateLimit: {
    perMinuteLimit: number;
    remainingThisMinute: number;
    perHourLimit: number;
    remainingThisHour: number;
  };
  monitoring: {
    totalRequests: number;
    avgLatencyMs: number;
    byEndpoint: Record<string, number>;
    recentRequests: Array<{
      requestId: string;
      timestamp: string;
      endpoint: string;
      method: string;
      statusCode: number;
      durationMs: number;
      outcome: string;
    }>;
  };
}

async function requestProtectedJson<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  payload: unknown,
  fallbackErrorPrefix: string,
  timeoutMs: number = DEFAULT_AI_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const performFetch = async (forceRefresh: boolean) => {
    const token = await getActiveBearerToken(forceRefresh);
    const headers: Record<string, string> = {};
    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(endpoint, {
      method,
      headers,
      ...(method !== 'GET' ? { body: JSON.stringify(payload) } : {}),
      signal: controller.signal,
    });
  };

  try {
    let response = await performFetch(false);
    if (response.status === 401) {
      const refreshedToken = await getActiveBearerToken(true);
      if (refreshedToken) {
        response = await performFetch(true);
      }
    }

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      const msg =
        data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Authentication required (401). Please sign in to continue.';
      notifyUnauthorizedApiResponse(msg);
      throw new Error(msg);
    }

    if (!response.ok) {
      const msg =
        data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : `${fallbackErrorPrefix}: ${response.status} ${response.statusText}`;
      throw new Error(msg);
    }

    if (!data || typeof data !== 'object') {
      throw new Error(`${fallbackErrorPrefix}: Invalid response received from server.`);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `${fallbackErrorPrefix}: Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`
      );
    }
    throw err instanceof Error ? err : new Error(fallbackErrorPrefix);
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGetUsageStats(): Promise<UsageStatsResponse> {
  return requestProtectedJson<UsageStatsResponse>(
    '/api/usage',
    'GET',
    undefined,
    'Could not load usage quota',
    10_000
  );
}

export async function apiAnalyzeJd(params: {
  jdText: string;
  resumeData: StructuredResume;
  companyName?: string;
  targetRole?: string;
}): Promise<{ analysis: JDAnalysis; atsReport: ATSReport }> {
  const res = await requestProtectedJson<{ analysis: JDAnalysis; atsReport: ATSReport }>(
    '/api/analyze-jd',
    'POST',
    params,
    'Analysis failed'
  );
  if (!res.analysis || !res.atsReport) {
    throw new Error('Analysis returned an incomplete report structure.');
  }
  return res;
}

export async function apiOptimizeResume(params: {
  resumeData: StructuredResume;
  jdText: string;
  options?: { targetRole?: string; companyName?: string; instructions?: string };
}): Promise<{
  optimizedData: StructuredResume;
  diffItems: DiffItem[];
  identifiedKeywordsToAdd: {
    keyword: string;
    category: string;
    reason: string;
    suggestedSection: 'Skills' | 'Experience' | 'Summary';
  }[];
  optimizedScore: number;
  reportSummary: string;
}> {
  const res = await requestProtectedJson<{
    optimizedData: StructuredResume;
    diffItems: DiffItem[];
    identifiedKeywordsToAdd: {
      keyword: string;
      category: string;
      reason: string;
      suggestedSection: 'Skills' | 'Experience' | 'Summary';
    }[];
    optimizedScore: number;
    reportSummary: string;
  }>('/api/optimize-resume', 'POST', params, 'Optimization failed');

  if (!res.optimizedData || !Array.isArray(res.diffItems)) {
    throw new Error('Optimization returned an incomplete response structure.');
  }
  return res;
}

export async function apiRewriteSection(params: {
  sectionName: string;
  currentText: string;
  instruction: string;
  jdText?: string;
}): Promise<{ rewrittenText: string; reason: string }> {
  return requestProtectedJson<{ rewrittenText: string; reason: string }>(
    '/api/rewrite-section',
    'POST',
    params,
    'Rewrite failed',
    30_000
  );
}

export async function apiGenerateCoverLetter(params: {
  resumeData: StructuredResume;
  jdText: string;
  options?: {
    targetRole?: string;
    companyName?: string;
    tone?: 'Executive' | 'Concise' | 'Technical' | 'Storytelling';
    language?: SupportedLanguage;
  };
}): Promise<CoverLetterResult> {
  return requestProtectedJson<CoverLetterResult>(
    '/api/generate-cover-letter',
    'POST',
    params,
    'Cover letter generation failed'
  );
}

export async function apiOptimizeLinkedIn(params: {
  resumeData: StructuredResume;
  jdText?: string;
  targetRole?: string;
  language?: SupportedLanguage;
}): Promise<LinkedInOptimizationResult> {
  return requestProtectedJson<LinkedInOptimizationResult>(
    '/api/optimize-linkedin',
    'POST',
    params,
    'LinkedIn optimization failed'
  );
}

export async function apiGenerateInterviewPrep(params: {
  resumeData: StructuredResume;
  jdText: string;
  targetRole?: string;
  companyName?: string;
  language?: SupportedLanguage;
}): Promise<{ questions: InterviewQuestion[]; prepFocusSummary: string }> {
  return requestProtectedJson<{ questions: InterviewQuestion[]; prepFocusSummary: string }>(
    '/api/generate-interview-prep',
    'POST',
    params,
    'Interview prep failed'
  );
}

export async function apiTranslateResume(params: {
  resumeData: StructuredResume;
  targetLanguage: SupportedLanguage;
}): Promise<{ translatedData: StructuredResume }> {
  return requestProtectedJson<{ translatedData: StructuredResume }>(
    '/api/translate-resume',
    'POST',
    params,
    'Resume translation failed'
  );
}
