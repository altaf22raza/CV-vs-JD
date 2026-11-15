import { ATSReport, FormattingCheckItem, KeywordMatch, ResumeVersion } from '../types/resume';
import {
  DEFAULT_ATS_DISCLAIMER,
  DEFAULT_CALCULATION_METHOD,
  calculateFormattingCompatibility,
} from './atsScoring';

export { DEFAULT_ATS_DISCLAIMER, DEFAULT_CALCULATION_METHOD };

export interface NormalizedEvaluationMetrics {
  atsCompatibilityScore: number;
  atsCompatibilityStatus: 'High' | 'Moderate' | 'Needs Work';
  atsCompatibilityAssessment: string;
  formattingChecks: FormattingCheckItem[];
  keywordMatchPercent: number;
  matchedCount: number;
  matchedKeywordsList: string[];
  matchedKeywordItems: KeywordMatch[];
  missingCount: number;
  missingKeywordsList: string[];
  missingKeywordItems: KeywordMatch[];
  experienceRelevanceScore: number;
  experienceAssessment: string;
  projectRelevanceScore: number;
  projectAssessment: string;
  improvementScore: number;
  changesCount: number;
  improvementSummary: string;
  estimatedOverallIndex: number;
  calculationMethod: string;
  disclaimer: string;
}

/**
 * Derives structured evaluation metrics from an ATSReport and optional ResumeVersion,
 * keeping Keyword Match and Formatting Compatibility cleanly separated and deterministic.
 */
export function normalizeReportMetrics(
  report: ATSReport,
  version?: ResumeVersion | null
): NormalizedEvaluationMetrics {
  const matched = report.matchedKeywords || [];
  const missing = report.missingKeywords || [];

  // 1. Formatting Compatibility (calculated independently from JD keywords)
  const fallbackFormatting = version?.structuredData
    ? calculateFormattingCompatibility(version.structuredData, version.templateId)
    : null;

  const formattingChecks: FormattingCheckItem[] =
    report.atsCompatibility?.checks && report.atsCompatibility.checks.length > 0
      ? report.atsCompatibility.checks
      : fallbackFormatting?.checks || [];

  const atsCompatibilityScore =
    report.atsCompatibility?.score ?? fallbackFormatting?.score ?? 85;

  const atsCompatibilityStatus: 'High' | 'Moderate' | 'Needs Work' =
    report.atsCompatibility?.status ??
    (atsCompatibilityScore >= 85
      ? 'High'
      : atsCompatibilityScore >= 65
        ? 'Moderate'
        : 'Needs Work');

  const atsCompatibilityAssessment =
    report.atsCompatibility?.assessment ||
    fallbackFormatting?.assessment ||
    'Assessed independently across contact block, standard headings, linear order, date structure, and text density.';

  // 2. Keyword Match & Missing Skills (purely derived from actual JD vs resume evaluation)
  const totalTrackedKeywords = matched.length + missing.length;
  const computedKeywordRatio =
    totalTrackedKeywords > 0
      ? Math.round((matched.length / totalTrackedKeywords) * 100)
      : report.keywordMatch ?? 0;
  const keywordMatchPercent =
    totalTrackedKeywords > 0 ? computedKeywordRatio : (report.keywordMatch ?? 0);

  // 3. Experience Relevance
  const experienceRelevanceScore = report.experienceMatch ?? 0;
  const experienceAssessment =
    report.experienceAssessment ||
    (experienceRelevanceScore >= 75
      ? 'Work history, role titles, and bullet deliverables align with target job requirements.'
      : 'Tailor experience bullet verbs and measurable outcomes toward the target job responsibilities.');

  // 4. Project Relevance
  const projectCount = version?.structuredData?.projects?.length ?? 0;
  const fallbackProjectScore =
    report.projectRelevance ??
    (projectCount > 0 ? Math.round((report.technicalSkillsMatch + report.productSkillsMatch) / 2) : 0);
  const projectRelevanceScore = Math.min(100, Math.max(0, fallbackProjectScore));
  const projectAssessment =
    report.projectAssessment ||
    (projectCount > 0
      ? `Evaluated ${projectCount} listed ${projectCount === 1 ? 'project' : 'projects'} for JD term coverage.`
      : 'No project entries detected in this resume.');

  // 5. Improvement Delta (actual deterministic score gain vs baseline)
  const diffs = version?.diffItems || [];
  const acceptedOrPendingDiffs = diffs.filter((d) => d.status !== 'rejected').length;
  const acceptedCount = diffs.filter((d) => d.status === 'accepted').length;
  const scoreDelta = Math.max(
    0,
    (report.overallScore || 0) - (report.originalScore ?? report.overallScore ?? 0)
  );
  const improvementScore = report.improvementScore ?? scoreDelta;

  const changesCount = acceptedOrPendingDiffs;
  const improvementSummary =
    report.improvementSummary ||
    (changesCount > 0
      ? `${acceptedCount} accepted / ${changesCount} total rewrite suggestions${scoreDelta > 0 ? ` (+${scoreDelta} pts vs baseline)` : ''}.`
      : version?.cvType === 'optimized'
        ? 'Tailored resume sections compared against target JD.'
        : 'Baseline evaluation prior to JD tailoring edits.');

  const weightedComposite = Math.round(
    keywordMatchPercent * 0.4 +
      atsCompatibilityScore * 0.2 +
      experienceRelevanceScore * 0.25 +
      projectRelevanceScore * 0.15
  );
  const estimatedOverallIndex = report.overallScore ?? weightedComposite;

  return {
    atsCompatibilityScore,
    atsCompatibilityStatus,
    atsCompatibilityAssessment,
    formattingChecks,
    keywordMatchPercent,
    matchedCount: matched.length,
    matchedKeywordsList: matched.map((k) => k.keyword),
    matchedKeywordItems: matched,
    missingCount: missing.length,
    missingKeywordsList: missing.map((k) => k.keyword),
    missingKeywordItems: missing,
    experienceRelevanceScore,
    experienceAssessment,
    projectRelevanceScore,
    projectAssessment,
    improvementScore,
    changesCount,
    improvementSummary,
    estimatedOverallIndex,
    calculationMethod: report.calculationMethod || DEFAULT_CALCULATION_METHOD,
    disclaimer: report.disclaimer || DEFAULT_ATS_DISCLAIMER,
  };
}
