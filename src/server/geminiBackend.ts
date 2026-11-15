import { GoogleGenAI, ThinkingLevel, Type, type Schema } from '@google/genai';
import type { z } from 'zod';
import {
  AnalyzeJdOutputSchema,
  CoverLetterOutputSchema,
  InterviewPrepOutputSchema,
  LinkedInOutputSchema,
  OptimizeResumeOutputSchema,
  RewriteSectionOutputSchema,
  TranslateResumeOutputSchema,
} from './schemas.ts';
import type {
  StructuredResume,
  ATSReport,
  DiffItem,
  JDAnalysis,
  CoverLetterResult,
  LinkedInOptimizationResult,
  InterviewQuestion,
  SupportedLanguage,
} from '../types/resume.ts';
import {
  buildDeterministicAtsReport,
  type CandidateKeywordInput,
} from '../utils/atsScoring.ts';

const MODEL_NAME = 'gemini-4-hydrogen';
const REQUEST_TIMEOUT_MS = 38_000;
const MAX_RETRIES = 2;

export class AiServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode;
  }
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError(
      'GEMINI_API_KEY is not configured on the server.',
      503
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractJsonText(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '{}';

  // Strip ```json ... ``` fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  // Fallback: slice outermost JSON object
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

async function generateStructuredJson<T>(params: {
  prompt: string;
  responseSchema: Schema;
  zodSchema: z.ZodType<T>;
  thinkingLevel: ThinkingLevel;
  operationName: string;
}): Promise<T> {
  const ai = getAiClient();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const promptToSend =
        attempt === 1
          ? params.prompt
          : `${params.prompt}\n\nIMPORTANT: Your previous response failed JSON schema validation. Return ONLY strict valid JSON conforming to the exact schema with all required fields.`;

      const response = await Promise.race([
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: promptToSend,
          config: {
            responseMimeType: 'application/json',
            responseSchema: params.responseSchema,
            thinkingConfig: { thinkingLevel: params.thinkingLevel },
            abortSignal: controller.signal,
          },
        }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(
              new AiServiceError(
                `${params.operationName} timed out after ${Math.round(REQUEST_TIMEOUT_MS / 1000)}s. Please try again.`,
                504
              )
            );
          });
        }),
      ]);

      const cleanedJson = extractJsonText(response.text || '');
      let rawObj: unknown;
      try {
        rawObj = JSON.parse(cleanedJson);
      } catch {
        throw new AiServiceError(
          `Invalid JSON returned by AI during ${params.operationName}.`,
          502
        );
      }

      const validated = params.zodSchema.safeParse(rawObj);
      if (!validated.success) {
        const issueSummary = validated.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
          .join('; ');
        throw new AiServiceError(
          `AI output schema validation failed (${issueSummary}).`,
          502
        );
      }

      return validated.data;
    } catch (err) {
      lastError = err;
      const isTimeout = err instanceof AiServiceError && err.statusCode === 504;
      const isSchemaError = err instanceof AiServiceError && err.statusCode === 502;
      if (attempt < MAX_RETRIES && (isTransientError(err) || isSchemaError) && !isTimeout) {
        await sleep(500 * attempt);
        continue;
      }
      if (err instanceof AiServiceError) throw err;
      const message = err instanceof Error ? err.message : `Failed during ${params.operationName}`;
      throw new AiServiceError(message, 500);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AiServiceError(`Failed to complete ${params.operationName}`, 500);
}

// ============================================================================
// Gemini Response Schemas (strictly typed with @google/genai Type)
// ============================================================================

const KeywordMatchGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    keyword: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['technical', 'product', 'domain', 'tool', 'soft'] },
    foundInResume: { type: Type.BOOLEAN },
    frequencyInJD: { type: Type.NUMBER },
    context: { type: Type.STRING },
  },
  required: ['keyword', 'category', 'foundInResume', 'frequencyInJD'],
};

const AnalyzeJdGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        targetJobTitle: { type: Type.STRING },
        companyName: { type: Type.STRING },
        industry: { type: Type.STRING },
        seniorityLevel: { type: Type.STRING },
        requiredTechnicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        productCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
        toolsAndTech: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyResponsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
        coreKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        summaryEvaluation: { type: Type.STRING },
      },
      required: [
        'targetJobTitle',
        'companyName',
        'industry',
        'seniorityLevel',
        'requiredTechnicalSkills',
        'preferredSkills',
        'productCompetencies',
        'toolsAndTech',
        'keyResponsibilities',
        'coreKeywords',
        'summaryEvaluation',
      ],
    },
    atsReport: {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.NUMBER },
        originalScore: { type: Type.NUMBER },
        atsCompatibility: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            status: { type: Type.STRING, enum: ['High', 'Moderate', 'Needs Work'] },
            assessment: { type: Type.STRING },
          },
          required: ['score', 'status', 'assessment'],
        },
        technicalSkillsMatch: { type: Type.NUMBER },
        experienceMatch: { type: Type.NUMBER },
        experienceAssessment: { type: Type.STRING },
        productSkillsMatch: { type: Type.NUMBER },
        projectRelevance: { type: Type.NUMBER },
        projectAssessment: { type: Type.STRING },
        keywordMatch: { type: Type.NUMBER },
        improvementScore: { type: Type.NUMBER },
        improvementSummary: { type: Type.STRING },
        matchedKeywords: { type: Type.ARRAY, items: KeywordMatchGeminiSchema },
        missingKeywords: { type: Type.ARRAY, items: KeywordMatchGeminiSchema },
        strongPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvementRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        formattingNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        calculationMethod: { type: Type.STRING },
        disclaimer: { type: Type.STRING },
      },
      required: [
        'overallScore',
        'originalScore',
        'atsCompatibility',
        'technicalSkillsMatch',
        'experienceMatch',
        'productSkillsMatch',
        'keywordMatch',
        'matchedKeywords',
        'missingKeywords',
        'strongPoints',
        'improvementRecommendations',
        'formattingNotes',
        'disclaimer',
      ],
    },
  },
  required: ['analysis', 'atsReport'],
};

const OptimizeResumeGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    identifiedKeywordsToAdd: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          category: { type: Type.STRING },
          reason: { type: Type.STRING },
          suggestedSection: { type: Type.STRING, enum: ['Skills', 'Experience', 'Summary'] },
        },
        required: ['keyword', 'category', 'reason', 'suggestedSection'],
      },
    },
    targetRoleHeadline: { type: Type.STRING },
    summary: { type: Type.STRING },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'role', 'company', 'startDate', 'endDate', 'bullets'],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          linkText: { type: Type.STRING },
          linkUrl: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'title', 'subtitle', 'bullets'],
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'category', 'items'],
      },
    },
    diffItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          section: {
            type: Type.STRING,
            enum: ['summary', 'experience', 'projects', 'skills', 'certifications', 'headline', 'custom'],
          },
          entryIndex: { type: Type.NUMBER },
          bulletIndex: { type: Type.NUMBER },
          originalText: { type: Type.STRING },
          optimizedText: { type: Type.STRING },
          reason: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['pending', 'accepted', 'rejected'] },
        },
        required: ['id', 'section', 'originalText', 'optimizedText', 'reason', 'status'],
      },
    },
    optimizedScore: { type: Type.NUMBER },
    reportSummary: { type: Type.STRING },
  },
  required: [
    'identifiedKeywordsToAdd',
    'targetRoleHeadline',
    'summary',
    'experience',
    'projects',
    'skills',
    'diffItems',
    'optimizedScore',
    'reportSummary',
  ],
};

const RewriteSectionGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    rewrittenText: { type: Type.STRING },
    reason: { type: Type.STRING },
  },
  required: ['rewrittenText', 'reason'],
};

const CoverLetterGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    greeting: { type: Type.STRING },
    bodyParagraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
    closing: { type: Type.STRING },
    fullText: { type: Type.STRING },
    keyThemesMatched: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['subject', 'greeting', 'bodyParagraphs', 'closing', 'fullText', 'keyThemesMatched'],
};

const LinkedInGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
    aboutSection: { type: Type.STRING },
    experienceHighlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['role', 'company', 'bullets'],
      },
    },
    topSkillsToPin: { type: Type.ARRAY, items: { type: Type.STRING } },
    profileKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['headlines', 'aboutSection', 'experienceHighlights', 'topSkillsToPin', 'profileKeywords'],
};

const InterviewPrepGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    prepFocusSummary: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['Technical & Domain', 'Behavioral (STAR)', 'Product & Case', 'Resume Deep-Dive'],
          },
          difficulty: { type: Type.STRING, enum: ['Standard', 'Challenging'] },
          question: { type: Type.STRING },
          whyAsked: { type: Type.STRING },
          suggestedFramework: { type: Type.STRING },
          resumeAnchor: { type: Type.STRING },
        },
        required: [
          'id',
          'category',
          'difficulty',
          'question',
          'whyAsked',
          'suggestedFramework',
          'resumeAnchor',
        ],
      },
    },
  },
  required: ['prepFocusSummary', 'questions'],
};

const TranslateResumeGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    targetRoleHeadline: { type: Type.STRING },
    contact: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING },
        phone: { type: Type.STRING },
        email: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        github: { type: Type.STRING },
        portfolio: { type: Type.STRING },
        website: { type: Type.STRING },
      },
      required: ['location', 'phone', 'email', 'linkedin', 'github'],
    },
    summary: { type: Type.STRING },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'role', 'company', 'startDate', 'endDate', 'bullets'],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          duration: { type: Type.STRING },
          details: { type: Type.STRING },
        },
        required: ['id', 'degree', 'institution', 'duration', 'details'],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          linkText: { type: Type.STRING },
          linkUrl: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'title', 'subtitle', 'bullets'],
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'category', 'items'],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'category', 'items'],
      },
    },
  },
  required: ['name', 'targetRoleHeadline', 'contact', 'summary', 'experience', 'education', 'projects', 'skills', 'certifications'],
};

// ============================================================================
// Public Server Functions
// ============================================================================

export async function analyzeJdAndResume(
  jdText: string,
  resumeData: StructuredResume,
  companyName?: string,
  targetRole?: string
): Promise<{ analysis: JDAnalysis; atsReport: ATSReport }> {
  const prompt = `You are a Senior Technical Recruiter and ATS Expert.
Analyze the following Job Description (JD) against the candidate's existing resume.

CANDIDATE RESUME:
Name: ${resumeData.name}
Headline: ${resumeData.targetRoleHeadline}
Summary: ${resumeData.summary}
Experience: ${JSON.stringify(resumeData.experience)}
Education: ${JSON.stringify(resumeData.education)}
Projects: ${JSON.stringify(resumeData.projects)}
Skills: ${JSON.stringify(resumeData.skills)}
Certifications: ${JSON.stringify(resumeData.certifications)}

JOB DESCRIPTION:
Company: ${companyName || 'Not specified'}
Target Role: ${targetRole || 'Not specified'}
Content:
${jdText}

ACCURACY & GROUNDING RULES:
1. Never fabricate candidate information or qualifications.
2. Only list keywords/skills that literally appear in the JOB DESCRIPTION text above. Use the exact phrasing from the JD.
3. Quantified metrics must be grounded in the candidate's genuine history.
4. Provide strongPoints, improvementRecommendations, experienceAssessment, and projectAssessment grounded strictly in the resume and JD.
5. Set calculationMethod to explain how keyword match (40%), formatting compatibility (20%), experience relevance (25%), and project relevance (15%) are weighed.
6. Set disclaimer clearly noting that no tool can guarantee a resume will pass every employer's ATS.`;

  const parsed = await generateStructuredJson({
    prompt,
    responseSchema: AnalyzeJdGeminiSchema,
    zodSchema: AnalyzeJdOutputSchema,
    thinkingLevel: ThinkingLevel.LOW,
    operationName: 'JD compatibility analysis',
  });

  const candidateKeywords: CandidateKeywordInput[] = [
    ...(parsed.atsReport.matchedKeywords || []).map((k) => ({
      keyword: k.keyword,
      category: k.category,
    })),
    ...(parsed.atsReport.missingKeywords || []).map((k) => ({
      keyword: k.keyword,
      category: k.category,
    })),
    ...(parsed.analysis.requiredTechnicalSkills || []).map((k) => ({
      keyword: k,
      category: 'technical' as const,
    })),
    ...(parsed.analysis.toolsAndTech || []).map((k) => ({
      keyword: k,
      category: 'tool' as const,
    })),
    ...(parsed.analysis.productCompetencies || []).map((k) => ({
      keyword: k,
      category: 'product' as const,
    })),
    ...(parsed.analysis.coreKeywords || []).map((k) => ({
      keyword: k,
      category: 'domain' as const,
    })),
  ];

  const deterministicReport = buildDeterministicAtsReport({
    jdText,
    resumeData,
    candidateKeywords,
    aiExperienceScore: parsed.atsReport.experienceMatch,
    aiExperienceAssessment: parsed.atsReport.experienceAssessment,
    aiProjectScore: parsed.atsReport.projectRelevance,
    aiProjectAssessment: parsed.atsReport.projectAssessment,
    strongPoints: parsed.atsReport.strongPoints,
    improvementRecommendations: parsed.atsReport.improvementRecommendations,
  });

  return {
    analysis: parsed.analysis as JDAnalysis,
    atsReport: deterministicReport,
  };
}

export async function optimizeResumeWithJd(
  resumeData: StructuredResume,
  jdText: string,
  options: { targetRole?: string; companyName?: string; instructions?: string } = {}
): Promise<{
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
  const prompt = `You are an elite Resume Consultant and Technical Recruiter.
A user has provided a Job Description (JD). Your job is to:
1. Identify 5-10 high-priority ATS keywords from the JD.
2. Optimize the resume by naturally weaving in relevant keywords and strengthening action verbs.
3. NEVER fabricate company names, jobs, dates, or fake metrics. All facts in the original resume must remain true.
4. Preserve all original experience/project/skill IDs where possible and provide diffItems with originalText and optimizedText.
${options.targetRole ? `TARGET ROLE: ${options.targetRole}` : ''}
${options.companyName ? `TARGET COMPANY: ${options.companyName}` : ''}
${options.instructions ? `USER INSTRUCTIONS: ${options.instructions}` : ''}

TARGET JOB DESCRIPTION:
${jdText}

CANDIDATE ORIGINAL RESUME:
Name: ${resumeData.name}
Current Headline: ${resumeData.targetRoleHeadline}
Current Summary: ${resumeData.summary}
Experience: ${JSON.stringify(resumeData.experience)}
Education: ${JSON.stringify(resumeData.education)}
Projects: ${JSON.stringify(resumeData.projects)}
Skills: ${JSON.stringify(resumeData.skills)}
Certifications: ${JSON.stringify(resumeData.certifications)}`;

  const parsed = await generateStructuredJson({
    prompt,
    responseSchema: OptimizeResumeGeminiSchema,
    zodSchema: OptimizeResumeOutputSchema,
    thinkingLevel: ThinkingLevel.MEDIUM,
    operationName: 'Resume optimization',
  });

  const optimizedData: StructuredResume = {
    ...resumeData,
    targetRoleHeadline: parsed.targetRoleHeadline || resumeData.targetRoleHeadline,
    summary: parsed.summary || resumeData.summary,
    experience: parsed.experience.length ? parsed.experience : resumeData.experience,
    projects: parsed.projects.length ? parsed.projects : resumeData.projects,
    skills: parsed.skills.length ? parsed.skills : resumeData.skills,
    education: resumeData.education,
    certifications: resumeData.certifications,
  };

  return {
    optimizedData,
    diffItems: parsed.diffItems as DiffItem[],
    identifiedKeywordsToAdd: parsed.identifiedKeywordsToAdd,
    optimizedScore: Math.round(parsed.optimizedScore),
    reportSummary: parsed.reportSummary,
  };
}

export async function rewriteSingleSection(
  sectionName: string,
  currentText: string,
  instruction: string,
  jdText?: string
): Promise<{ rewrittenText: string; reason: string }> {
  const prompt = `You are a professional resume editor.
Rewrite the following resume section: "${sectionName}".
User instruction: "${instruction}".
${jdText ? `Target Job Description:\n${jdText.slice(0, 2000)}` : ''}

Original Content:
${currentText}

RULES:
- Preserve genuine facts and metrics. Do not fabricate.
- Enhance action verbs and clarity.`;

  return generateStructuredJson({
    prompt,
    responseSchema: RewriteSectionGeminiSchema,
    zodSchema: RewriteSectionOutputSchema,
    thinkingLevel: ThinkingLevel.LOW,
    operationName: 'Section rewrite',
  });
}

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
};

export async function generateCoverLetter(
  resumeData: StructuredResume,
  jdText: string,
  options: {
    targetRole?: string;
    companyName?: string;
    tone?: 'Executive' | 'Concise' | 'Technical' | 'Storytelling';
    language?: SupportedLanguage;
  } = {}
): Promise<CoverLetterResult> {
  const langName = LANGUAGE_NAMES[options.language || 'en'] || 'English';
  const prompt = `You are a Senior Career Strategist. Write a compelling, strictly factual cover letter grounded exclusively in the candidate's resume and tailored to the target job description.
NEVER fabricate employers, degrees, metrics, or experiences not present in the resume.

TONE: ${options.tone || 'Executive'}
LANGUAGE: ${langName}
TARGET ROLE: ${options.targetRole || resumeData.targetRoleHeadline}
TARGET COMPANY: ${options.companyName || 'Target Company'}

CANDIDATE RESUME:
Name: ${resumeData.name}
Headline: ${resumeData.targetRoleHeadline}
Summary: ${resumeData.summary}
Experience: ${JSON.stringify(resumeData.experience)}
Projects: ${JSON.stringify(resumeData.projects)}
Skills: ${JSON.stringify(resumeData.skills)}

JOB DESCRIPTION:
${jdText.slice(0, 4000)}`;

  return generateStructuredJson({
    prompt,
    responseSchema: CoverLetterGeminiSchema,
    zodSchema: CoverLetterOutputSchema,
    thinkingLevel: ThinkingLevel.LOW,
    operationName: 'Cover letter generation',
  });
}

export async function optimizeLinkedInProfile(
  resumeData: StructuredResume,
  jdText?: string,
  targetRole?: string,
  language: SupportedLanguage = 'en'
): Promise<LinkedInOptimizationResult> {
  const langName = LANGUAGE_NAMES[language] || 'English';
  const prompt = `You are a LinkedIn Personal Branding & Recruiter Search Optimization specialist.
Transform the candidate's factual resume into a recruiter-discoverable LinkedIn profile in ${langName}.
Do NOT invent roles, companies, or unverified metrics.

TARGET ROLE FOCUS: ${targetRole || resumeData.targetRoleHeadline}
${jdText ? `REFERENCE JOB DESCRIPTION:\n${jdText.slice(0, 3000)}` : ''}

CANDIDATE RESUME:
Name: ${resumeData.name}
Headline: ${resumeData.targetRoleHeadline}
Summary: ${resumeData.summary}
Experience: ${JSON.stringify(resumeData.experience)}
Projects: ${JSON.stringify(resumeData.projects)}
Skills: ${JSON.stringify(resumeData.skills)}`;

  return generateStructuredJson({
    prompt,
    responseSchema: LinkedInGeminiSchema,
    zodSchema: LinkedInOutputSchema,
    thinkingLevel: ThinkingLevel.LOW,
    operationName: 'LinkedIn optimization',
  });
}

export async function generateInterviewPrep(
  resumeData: StructuredResume,
  jdText: string,
  targetRole?: string,
  companyName?: string,
  language: SupportedLanguage = 'en'
): Promise<{ questions: InterviewQuestion[]; prepFocusSummary: string }> {
  const langName = LANGUAGE_NAMES[language] || 'English';
  const prompt = `You are a Principal Hiring Manager conducting interviews for ${targetRole || resumeData.targetRoleHeadline}${companyName ? ` at ${companyName}` : ''}.
Compare the Job Description against the candidate's Resume and generate 8 targeted interview questions in ${langName}.
Include a balanced mix of categories: "Technical & Domain", "Behavioral (STAR)", "Product & Case", and "Resume Deep-Dive".
Ground every suggestedFramework in actual experiences/projects from the candidate's resume without fabricating facts.

CANDIDATE RESUME:
Name: ${resumeData.name}
Headline: ${resumeData.targetRoleHeadline}
Summary: ${resumeData.summary}
Experience: ${JSON.stringify(resumeData.experience)}
Projects: ${JSON.stringify(resumeData.projects)}
Skills: ${JSON.stringify(resumeData.skills)}

JOB DESCRIPTION:
${jdText.slice(0, 4000)}`;

  return generateStructuredJson({
    prompt,
    responseSchema: InterviewPrepGeminiSchema,
    zodSchema: InterviewPrepOutputSchema,
    thinkingLevel: ThinkingLevel.MEDIUM,
    operationName: 'Interview prep generation',
  });
}

export async function translateStructuredResume(
  resumeData: StructuredResume,
  targetLanguage: SupportedLanguage
): Promise<{ translatedData: StructuredResume }> {
  if (targetLanguage === (resumeData.language || 'en')) {
    return { translatedData: { ...resumeData, language: targetLanguage } };
  }

  const langName = LANGUAGE_NAMES[targetLanguage] || 'English';
  const prompt = `Translate this structured resume accurately into ${langName}.
RULES:
1. Preserve all JSON keys, IDs, dates, URLs, emails, phone numbers, company proper names, and quantified numbers accurately.
2. Translate job titles/headlines, summary, experience bullets, project descriptions, skill category labels, degree names, and certifications naturally into ${langName}.
3. Keep technical acronyms (SQL, Python, LLM, API, AWS, React, etc.) intact where industry standard.

INPUT RESUME JSON:
${JSON.stringify(resumeData)}`;

  const parsed = await generateStructuredJson({
    prompt,
    responseSchema: TranslateResumeGeminiSchema,
    zodSchema: TranslateResumeOutputSchema,
    thinkingLevel: ThinkingLevel.LOW,
    operationName: 'Resume translation',
  });

  const translatedData: StructuredResume = {
    ...resumeData,
    ...parsed,
    contact: {
      ...resumeData.contact,
      ...(parsed.contact || {}),
    },
    experience: parsed.experience.length ? parsed.experience : resumeData.experience,
    education: parsed.education.length ? parsed.education : resumeData.education,
    projects: parsed.projects.length ? parsed.projects : resumeData.projects,
    skills: parsed.skills.length ? parsed.skills : resumeData.skills,
    certifications: parsed.certifications.length ? parsed.certifications : resumeData.certifications,
    language: targetLanguage,
  };

  return { translatedData };
}
