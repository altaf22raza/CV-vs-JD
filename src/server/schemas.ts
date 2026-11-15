import { z } from 'zod';

const SupportedLanguageSchema = z.enum(['en', 'es', 'fr', 'de', 'hi']);

export const StructuredResumeSchema = z.object({
  name: z.string().max(200),
  targetRoleHeadline: z.string().max(250),
  templateId: z.string().max(100).optional(),
  language: SupportedLanguageSchema.optional(),
  contact: z.object({
    location: z.string().max(200),
    phone: z.string().max(60),
    email: z.string().max(200),
    linkedin: z.string().max(300),
    github: z.string().max(300),
    portfolio: z.string().max(300).optional(),
    website: z.string().max(300).optional(),
  }),
  summary: z.string().max(6000),
  experience: z
    .array(
      z.object({
        id: z.string().max(100),
        role: z.string().max(200),
        company: z.string().max(200),
        location: z.string().max(200).optional(),
        employmentType: z.string().max(100).optional(),
        startDate: z.string().max(80),
        endDate: z.string().max(80),
        bullets: z.array(z.string().max(1500)).max(25),
      })
    )
    .max(25),
  education: z
    .array(
      z.object({
        id: z.string().max(100),
        degree: z.string().max(200),
        institution: z.string().max(250),
        specialization: z.string().max(200).optional(),
        duration: z.string().max(100),
        details: z.string().max(400),
      })
    )
    .max(15),
  projects: z
    .array(
      z.object({
        id: z.string().max(100),
        title: z.string().max(250),
        linkText: z.string().max(120).optional(),
        linkUrl: z.string().max(400).optional(),
        subtitle: z.string().max(250),
        technologies: z.string().max(400).optional(),
        bullets: z.array(z.string().max(1500)).max(20),
      })
    )
    .max(25),
  skills: z
    .array(
      z.object({
        id: z.string().max(100),
        category: z.string().max(150),
        items: z.array(z.string().max(150)).max(50),
      })
    )
    .max(20),
  certifications: z
    .array(
      z.object({
        id: z.string().max(100),
        category: z.string().max(150),
        items: z.array(z.string().max(250)).max(40),
        date: z.string().max(80).optional(),
        url: z.string().max(400).optional(),
      })
    )
    .max(20),
});

// ---- Request Input Schemas ----

export const SendOtpRequestSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(254),
});

export const VerifyOtpRequestSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(254),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

export const AnalyzeJdRequestSchema = z.object({
  jdText: z.string().trim().min(20, 'Job description must be at least 20 characters').max(25000),
  resumeData: StructuredResumeSchema,
  companyName: z.string().max(200).optional(),
  targetRole: z.string().max(200).optional(),
});

export const OptimizeResumeRequestSchema = z.object({
  resumeData: StructuredResumeSchema,
  jdText: z.string().trim().min(20, 'Job description must be at least 20 characters').max(25000),
  options: z
    .object({
      targetRole: z.string().max(200).optional(),
      companyName: z.string().max(200).optional(),
      instructions: z.string().max(2000).optional(),
    })
    .optional(),
});

export const RewriteSectionRequestSchema = z.object({
  sectionName: z.string().trim().min(1).max(120),
  currentText: z.string().trim().min(1).max(10000),
  instruction: z.string().trim().min(1).max(1500),
  jdText: z.string().max(25000).optional(),
});

export const GenerateCoverLetterRequestSchema = z.object({
  resumeData: StructuredResumeSchema,
  jdText: z.string().trim().min(20, 'Job description must be at least 20 characters').max(25000),
  options: z
    .object({
      targetRole: z.string().max(200).optional(),
      companyName: z.string().max(200).optional(),
      tone: z.enum(['Executive', 'Concise', 'Technical', 'Storytelling']).optional(),
      language: SupportedLanguageSchema.optional(),
    })
    .optional(),
});

export const OptimizeLinkedInRequestSchema = z.object({
  resumeData: StructuredResumeSchema,
  jdText: z.string().max(25000).optional(),
  targetRole: z.string().max(200).optional(),
  language: SupportedLanguageSchema.optional(),
});

export const GenerateInterviewPrepRequestSchema = z.object({
  resumeData: StructuredResumeSchema,
  jdText: z.string().trim().min(20, 'Job description must be at least 20 characters').max(25000),
  targetRole: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  language: SupportedLanguageSchema.optional(),
});

export const TranslateResumeRequestSchema = z.object({
  resumeData: StructuredResumeSchema,
  targetLanguage: SupportedLanguageSchema,
});

// ---- AI Output Validation Schemas ----

const KeywordMatchSchema = z.object({
  keyword: z.string(),
  category: z.enum(['technical', 'product', 'domain', 'tool', 'soft']).catch('technical'),
  foundInResume: z.boolean(),
  frequencyInJD: z.number().min(0).max(100).catch(1),
  context: z.string().optional(),
  jdEvidence: z.string().optional(),
  resumeEvidence: z.string().optional(),
  matchedSections: z.array(z.string()).optional(),
  matchType: z.enum(['exact', 'variant', 'none']).optional(),
});

const FormattingCheckSchema = z.object({
  label: z.string(),
  passed: z.boolean(),
  points: z.number().min(0).max(100),
  maxPoints: z.number().min(1).max(100),
  detail: z.string(),
});

export const AnalyzeJdOutputSchema = z.object({
  analysis: z.object({
    targetJobTitle: z.string().min(1),
    companyName: z.string().default('Target Company'),
    industry: z.string().default('Technology'),
    seniorityLevel: z.string().default('Mid'),
    requiredTechnicalSkills: z.array(z.string()).default([]),
    preferredSkills: z.array(z.string()).default([]),
    productCompetencies: z.array(z.string()).default([]),
    toolsAndTech: z.array(z.string()).default([]),
    keyResponsibilities: z.array(z.string()).default([]),
    coreKeywords: z.array(z.string()).default([]),
    summaryEvaluation: z.string().default(''),
  }),
  atsReport: z.object({
    overallScore: z.number().min(0).max(100),
    originalScore: z.number().min(0).max(100),
    atsCompatibility: z.object({
      score: z.number().min(0).max(100),
      status: z.enum(['High', 'Moderate', 'Needs Work']).catch('High'),
      assessment: z.string(),
      checks: z.array(FormattingCheckSchema).optional(),
    }),
    technicalSkillsMatch: z.number().min(0).max(100),
    experienceMatch: z.number().min(0).max(100),
    experienceAssessment: z.string().optional(),
    productSkillsMatch: z.number().min(0).max(100),
    projectRelevance: z.number().min(0).max(100).optional(),
    projectAssessment: z.string().optional(),
    keywordMatch: z.number().min(0).max(100),
    improvementScore: z.number().min(0).max(100).optional(),
    improvementSummary: z.string().optional(),
    matchedKeywords: z.array(KeywordMatchSchema).default([]),
    missingKeywords: z.array(KeywordMatchSchema).default([]),
    strongPoints: z.array(z.string()).default([]),
    improvementRecommendations: z.array(z.string()).default([]),
    formattingNotes: z.array(z.string()).default([]),
    calculationMethod: z.string().optional(),
    disclaimer: z.string(),
  }),
});

export const OptimizeResumeOutputSchema = z.object({
  identifiedKeywordsToAdd: z
    .array(
      z.object({
        keyword: z.string().min(1),
        category: z.string().default('Product Management'),
        reason: z.string().default('Relevant to target job description'),
        suggestedSection: z.enum(['Skills', 'Experience', 'Summary']).catch('Skills'),
      })
    )
    .default([]),
  targetRoleHeadline: z.string().min(1),
  summary: z.string().min(1),
  experience: z
    .array(
      z.object({
        id: z.string(),
        role: z.string(),
        company: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        bullets: z.array(z.string()),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        linkText: z.string().optional(),
        linkUrl: z.string().optional(),
        subtitle: z.string(),
        bullets: z.array(z.string()),
      })
    )
    .default([]),
  skills: z
    .array(
      z.object({
        id: z.string(),
        category: z.string(),
        items: z.array(z.string()),
      })
    )
    .default([]),
  diffItems: z
    .array(
      z.object({
        id: z.string(),
        section: z
          .enum(['summary', 'experience', 'projects', 'skills', 'certifications', 'headline', 'custom'])
          .catch('summary'),
        entryIndex: z.number().optional(),
        bulletIndex: z.number().optional(),
        originalText: z.string(),
        optimizedText: z.string(),
        reason: z.string(),
        status: z.enum(['pending', 'accepted', 'rejected']).catch('pending'),
      })
    )
    .default([]),
  optimizedScore: z.number().min(0).max(100),
  reportSummary: z.string().default('Resume optimized with key ATS keywords from JD.'),
});

export const RewriteSectionOutputSchema = z.object({
  rewrittenText: z.string().min(1),
  reason: z.string().default('Rewritten according to instruction'),
});

export const CoverLetterOutputSchema = z.object({
  subject: z.string().min(1),
  greeting: z.string().min(1),
  bodyParagraphs: z.array(z.string()).min(1),
  closing: z.string().min(1),
  fullText: z.string().min(1),
  keyThemesMatched: z.array(z.string()).default([]),
});

export const LinkedInOutputSchema = z.object({
  headlines: z.array(z.string()).min(1),
  aboutSection: z.string().min(1),
  experienceHighlights: z
    .array(
      z.object({
        role: z.string(),
        company: z.string(),
        bullets: z.array(z.string()),
      })
    )
    .default([]),
  topSkillsToPin: z.array(z.string()).default([]),
  profileKeywords: z.array(z.string()).default([]),
});

export const InterviewPrepOutputSchema = z.object({
  prepFocusSummary: z.string().min(1),
  questions: z
    .array(
      z.object({
        id: z.string(),
        category: z
          .enum(['Technical & Domain', 'Behavioral (STAR)', 'Product & Case', 'Resume Deep-Dive'])
          .catch('Technical & Domain'),
        difficulty: z.enum(['Standard', 'Challenging']).catch('Standard'),
        question: z.string().min(1),
        whyAsked: z.string().default(''),
        suggestedFramework: z.string().default(''),
        resumeAnchor: z.string().default(''),
      })
    )
    .min(1),
});

export const TranslateResumeOutputSchema = StructuredResumeSchema;
