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

export interface StructuredResume {
  name: string;
  targetRoleHeadline: string;
  templateId?: string;
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
}

export interface ATSReport {
  overallScore: number;
  originalScore: number;
  technicalSkillsMatch: number;
  experienceMatch: number;
  productSkillsMatch: number;
  keywordMatch: number;
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  strongPoints: string[];
  improvementRecommendations: string[];
  formattingNotes: string[];
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

export interface ResumeVersion {
  id: string;
  userId?: string;
  title: string;
  targetRole: string;
  companyName: string;
  cvType: 'uploaded' | 'created' | 'optimized';
  templateId: string;
  latexSource: string;
  originalLatex: string;
  structuredData: StructuredResume;
  originalStructuredData: StructuredResume;
  diffItems: DiffItem[];
  identifiedKeywordsToAdd?: IdentifiedKeyword[];
  atsReport?: ATSReport;
  jdText?: string;
  createdAt: string;
  updatedAt: string;
  isOriginal?: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  atsScore: string;
  accentColor: string;
  tags: string[];
  popular?: boolean;
}
