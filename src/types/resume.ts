export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location?: string;
  employmentType?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  specialization?: string;
  duration: string;
  details: string; // e.g. CGPA / Percentage
}

export interface ProjectEntry {
  id: string;
  title: string;
  linkText?: string;
  linkUrl?: string;
  subtitle: string;
  technologies?: string;
  bullets: string[];
}

export interface SkillCategory {
  id: string;
  category: string;
  items: string[];
}

export interface CertificationGroup {
  id: string;
  category: string;
  items: string[];
  date?: string;
  url?: string;
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'hi';

export interface StructuredResume {
  name: string;
  targetRoleHeadline: string;
  templateId?: string;
  language?: SupportedLanguage;
  contact: {
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
    portfolio?: string;
    website?: string;
  };
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: SkillCategory[];
  certifications: CertificationGroup[];
  customSections?: CustomSection[];
}

export interface DiffItem {
  id: string;
  section: 'summary' | 'experience' | 'projects' | 'skills' | 'certifications' | 'headline' | 'custom';
  entryIndex?: number;
  bulletIndex?: number;
  originalText: string;
  optimizedText: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface KeywordMatch {
  keyword: string;
  category: 'technical' | 'product' | 'domain' | 'tool' | 'soft';
  foundInResume: boolean;
  frequencyInJD: number;
  context?: string;
  jdEvidence?: string;
  resumeEvidence?: string;
  matchedSections?: string[];
  matchType?: 'exact' | 'variant' | 'none';
}

export interface FormattingCheckItem {
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface ATSReport {
  overallScore: number;
  originalScore: number;
  atsCompatibility?: {
    score: number;
    status: 'High' | 'Moderate' | 'Needs Work';
    assessment: string;
    checks?: FormattingCheckItem[];
  };
  technicalSkillsMatch: number;
  experienceMatch: number;
  experienceAssessment?: string;
  productSkillsMatch: number;
  projectRelevance?: number;
  projectAssessment?: string;
  keywordMatch: number;
  improvementScore?: number;
  improvementSummary?: string;
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  strongPoints: string[];
  improvementRecommendations: string[];
  formattingNotes: string[];
  calculationMethod?: string;
  disclaimer: string;
}

export interface JDAnalysis {
  targetJobTitle: string;
  companyName: string;
  industry: string;
  seniorityLevel: string;
  requiredTechnicalSkills: string[];
  preferredSkills: string[];
  productCompetencies: string[];
  toolsAndTech: string[];
  keyResponsibilities: string[];
  coreKeywords: string[];
  summaryEvaluation: string;
}

export interface IdentifiedKeyword {
  keyword: string;
  category: string;
  reason: string;
  suggestedSection: 'Skills' | 'Experience' | 'Summary';
  added?: boolean;
}

export interface ResumeSnapshot {
  id: string;
  timestamp: string;
  label: string;
  note?: string;
  structuredData: StructuredResume;
  latexSource: string;
  estimatedScore?: number;
}

export interface ResumeVersion {
  id: string;
  userId?: string;
  title: string;
  targetRole: string;
  companyName: string;
  cvType: 'uploaded' | 'created' | 'optimized';
  templateId: string;
  language?: SupportedLanguage;
  latexSource: string;
  originalLatex: string;
  structuredData: StructuredResume;
  originalStructuredData: StructuredResume;
  diffItems: DiffItem[];
  identifiedKeywordsToAdd?: IdentifiedKeyword[];
  atsReport?: ATSReport;
  jdText?: string;
  snapshots?: ResumeSnapshot[];
  createdAt: string;
  updatedAt: string;
  isOriginal?: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  layoutFormat: 'Single-Column' | 'Two-Column Split';
  parsingProfile: string;
  accentColor: string;
  tags: string[];
}

export interface SavedJobDescription {
  id: string;
  userId?: string;
  role: string;
  company: string;
  industry?: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export interface CoverLetterResult {
  subject: string;
  greeting: string;
  bodyParagraphs: string[];
  closing: string;
  fullText: string;
  keyThemesMatched: string[];
}

export interface LinkedInOptimizationResult {
  headlines: string[];
  aboutSection: string;
  experienceHighlights: {
    role: string;
    company: string;
    bullets: string[];
  }[];
  topSkillsToPin: string[];
  profileKeywords: string[];
}

export interface InterviewQuestion {
  id: string;
  category: 'Technical & Domain' | 'Behavioral (STAR)' | 'Product & Case' | 'Resume Deep-Dive';
  difficulty: 'Standard' | 'Challenging';
  question: string;
  whyAsked: string;
  suggestedFramework: string;
  resumeAnchor: string;
}

export type ApplicationStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

export interface JobApplication {
  id: string;
  userId?: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  resumeVersionId?: string;
  resumeTitle?: string;
  estimatedFit?: number;
  appliedDate: string;
  followUpDate?: string;
  location?: string;
  jobUrl?: string;
  jdText?: string;
  notes?: string;
  updatedAt: string;
}
