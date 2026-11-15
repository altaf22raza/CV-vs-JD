import type {
  ATSReport,
  DiffItem,
  FormattingCheckItem,
  KeywordMatch,
  StructuredResume,
} from '../types/resume';

export const DEFAULT_CALCULATION_METHOD =
  'Composite estimate = 40% Keyword Match (deterministic ratio of actual JD terms found in your resume) + 20% Formatting Compatibility (5 independent structural parser checks) + 25% Experience Relevance + 15% Project Relevance.';

export const DEFAULT_ATS_DISCLAIMER =
  'No resume builder or checker can promise that a resume will pass every employer’s ATS. Different companies use proprietary parsing rules, knockout filters, and human screening criteria. Use the matched/missing evidence below to verify real alignment.';

interface ResumeSegment {
  section: string;
  kind: 'headline' | 'summary' | 'experience' | 'projects' | 'skills' | 'education' | 'certifications' | 'custom';
  text: string;
}

const CANONICAL_JD_TAXONOMY: Array<{ term: string; category: KeywordMatch['category'] }> = [
  { term: 'SQL', category: 'technical' },
  { term: 'Python', category: 'technical' },
  { term: 'TypeScript', category: 'technical' },
  { term: 'JavaScript', category: 'technical' },
  { term: 'React', category: 'technical' },
  { term: 'Node.js', category: 'technical' },
  { term: 'PostgreSQL', category: 'technical' },
  { term: 'BigQuery', category: 'tool' },
  { term: 'Snowflake', category: 'tool' },
  { term: 'Tableau', category: 'tool' },
  { term: 'Power BI', category: 'tool' },
  { term: 'Looker', category: 'tool' },
  { term: 'Amplitude', category: 'tool' },
  { term: 'Mixpanel', category: 'tool' },
  { term: 'Google Analytics', category: 'tool' },
  { term: 'Jira', category: 'tool' },
  { term: 'Figma', category: 'tool' },
  { term: 'AWS', category: 'tool' },
  { term: 'Docker', category: 'tool' },
  { term: 'Kubernetes', category: 'tool' },
  { term: 'REST API', category: 'technical' },
  { term: 'APIs', category: 'technical' },
  { term: 'LLM', category: 'technical' },
  { term: 'Generative AI', category: 'technical' },
  { term: 'RAG', category: 'technical' },
  { term: 'Machine Learning', category: 'technical' },
  { term: 'A/B Testing', category: 'product' },
  { term: 'Experimentation', category: 'product' },
  { term: 'Product Strategy', category: 'product' },
  { term: 'Product Roadmap', category: 'product' },
  { term: 'User Research', category: 'product' },
  { term: 'PRDs', category: 'product' },
  { term: 'KPIs', category: 'product' },
  { term: 'Product Analytics', category: 'product' },
  { term: 'Retention', category: 'product' },
  { term: 'Conversion Funnel', category: 'product' },
  { term: 'Go-to-Market', category: 'product' },
  { term: 'Agile', category: 'product' },
  { term: 'Scrum', category: 'product' },
  { term: 'Cross-functional', category: 'soft' },
  { term: 'Stakeholder Management', category: 'soft' },
  { term: 'FinTech', category: 'domain' },
  { term: 'B2B SaaS', category: 'domain' },
  { term: 'SaaS', category: 'domain' },
  { term: 'Payments', category: 'domain' },
  { term: 'E-commerce', category: 'domain' },
  { term: 'CI/CD', category: 'technical' },
  { term: 'Data Modeling', category: 'technical' },
  { term: 'Telemetry', category: 'technical' },
];

export function extractResumeSegments(resume: StructuredResume): ResumeSegment[] {
  const segments: ResumeSegment[] = [];

  if (resume.targetRoleHeadline?.trim()) {
    segments.push({
      section: 'Headline',
      kind: 'headline',
      text: resume.targetRoleHeadline.trim(),
    });
  }

  if (resume.summary?.trim()) {
    segments.push({
      section: 'Summary',
      kind: 'summary',
      text: resume.summary.trim(),
    });
  }

  for (const exp of resume.experience || []) {
    const label = `Experience · ${exp.role || 'Role'}${exp.company ? ` @ ${exp.company}` : ''}`;
    if (exp.role || exp.company) {
      segments.push({
        section: label,
        kind: 'experience',
        text: `${exp.role || ''} ${exp.company || ''}`.trim(),
      });
    }
    for (const bullet of exp.bullets || []) {
      if (bullet.trim()) {
        segments.push({ section: label, kind: 'experience', text: bullet.trim() });
      }
    }
  }

  for (const proj of resume.projects || []) {
    const label = `Projects · ${proj.title || 'Project'}`;
    const header = [proj.title, proj.subtitle, proj.technologies].filter(Boolean).join(' · ');
    if (header.trim()) {
      segments.push({ section: label, kind: 'projects', text: header.trim() });
    }
    for (const bullet of proj.bullets || []) {
      if (bullet.trim()) {
        segments.push({ section: label, kind: 'projects', text: bullet.trim() });
      }
    }
  }

  for (const skillCat of resume.skills || []) {
    if (skillCat.items?.length) {
      segments.push({
        section: `Skills · ${skillCat.category || 'General'}`,
        kind: 'skills',
        text: `${skillCat.category}: ${skillCat.items.join(', ')}`,
      });
    }
  }

  for (const edu of resume.education || []) {
    const text = [edu.degree, edu.institution, edu.specialization, edu.details]
      .filter(Boolean)
      .join(' · ');
    if (text.trim()) {
      segments.push({
        section: `Education · ${edu.degree || 'Degree'}`,
        kind: 'education',
        text: text.trim(),
      });
    }
  }

  for (const cert of resume.certifications || []) {
    if (cert.items?.length) {
      segments.push({
        section: `Certifications · ${cert.category || 'Credentials'}`,
        kind: 'certifications',
        text: `${cert.category}: ${cert.items.join(' | ')}`,
      });
    }
  }

  for (const custom of resume.customSections || []) {
    if (custom.content?.trim()) {
      segments.push({
        section: `Custom · ${custom.title || 'Section'}`,
        kind: 'custom',
        text: `${custom.title}: ${custom.content.trim()}`,
      });
    }
  }

  return segments;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTermRegex(term: string): RegExp {
  const escaped = escapeRegex(term.trim()).replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[^a-zA-Z0-9_+#.])${escaped}(?:$|[^a-zA-Z0-9_+#.])`, 'gi');
}

function buildStemVariants(term: string): string[] {
  const clean = term.trim();
  const variants = new Set<string>();
  const lower = clean.toLowerCase();

  if (lower.endsWith('s') && lower.length > 3) {
    variants.add(clean.slice(0, -1));
  } else if (lower.length > 3 && !/[+#.]$/.test(lower)) {
    variants.add(`${clean}s`);
  }

  if (lower === 'prds' || lower === 'prd') {
    variants.add('PRD');
    variants.add('PRDs');
    variants.add('Product Requirements Document');
  }
  if (lower === 'kpis' || lower === 'kpi') {
    variants.add('KPI');
    variants.add('KPIs');
  }
  if (lower === 'apis' || lower === 'api') {
    variants.add('API');
    variants.add('APIs');
    variants.add('REST API');
  }
  if (lower.includes('a/b test')) {
    variants.add('A/B Testing');
    variants.add('A/B test');
    variants.add('AB testing');
    variants.add('split testing');
  }
  if (lower.includes('cross-functional')) {
    variants.add('cross functional');
    variants.add('cross-functional');
  }
  if (lower.includes('go-to-market')) {
    variants.add('GTM');
    variants.add('go to market');
  }
  if (lower === 'generative ai') {
    variants.add('GenAI');
    variants.add('Gen AI');
  }

  variants.delete(clean);
  return Array.from(variants);
}

function extractSnippet(text: string, index: number, matchLen: number, radius: number = 46): string {
  const normalized = text.replace(/\s+/g, ' ');
  const start = Math.max(0, index - radius);
  const end = Math.min(normalized.length, index + matchLen + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < normalized.length ? '...' : '';
  return `${prefix}${normalized.slice(start, end).trim()}${suffix}`;
}

interface TextMatchStats {
  count: number;
  firstSnippet: string;
  matchType: 'exact' | 'variant' | 'none';
}

function findTermInText(term: string, text: string): TextMatchStats {
  if (!term.trim() || !text.trim()) {
    return { count: 0, firstSnippet: '', matchType: 'none' };
  }

  const normalized = text.replace(/\s+/g, ' ');
  const exactRegex = buildTermRegex(term);
  const exactMatches: Array<{ index: number; len: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = exactRegex.exec(normalized)) !== null) {
    // Adjust index past leading non-word boundary char if present
    const rawStr = m[0];
    const trimmedOffset = rawStr.length - rawStr.trimStart().length;
    exactMatches.push({
      index: m.index + trimmedOffset,
      len: term.trim().length,
    });
    if (exactMatches.length > 50) break;
  }

  if (exactMatches.length > 0) {
    return {
      count: exactMatches.length,
      firstSnippet: extractSnippet(normalized, exactMatches[0].index, exactMatches[0].len),
      matchType: 'exact',
    };
  }

  // Variant check (plurals, standard abbreviations, hyphenation)
  for (const variant of buildStemVariants(term)) {
    const varRegex = buildTermRegex(variant);
    const vm = varRegex.exec(normalized);
    if (vm) {
      const all = normalized.match(buildTermRegex(variant)) || [vm[0]];
      return {
        count: all.length,
        firstSnippet: extractSnippet(normalized, vm.index, variant.length),
        matchType: 'variant',
      };
    }
  }

  return { count: 0, firstSnippet: '', matchType: 'none' };
}

export interface CandidateKeywordInput {
  keyword: string;
  category: KeywordMatch['category'];
}

/**
 * Deterministically evaluates keywords against the ACTUAL JD and ACTUAL resume text,
 * producing verifiable snippets for both matched and missing terms.
 */
export function evaluateKeywordMatches(
  jdText: string,
  candidateKeywords: CandidateKeywordInput[] = [],
  resume: StructuredResume
): {
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  keywordMatchPercent: number;
} {
  const segments = extractResumeSegments(resume);
  const seenNormalized = new Set<string>();
  const combinedCandidates: CandidateKeywordInput[] = [];

  const pushCandidate = (kw: string, category: KeywordMatch['category']) => {
    const clean = kw.trim();
    if (!clean || clean.length < 2 || clean.length > 64) return;
    const norm = clean.toLowerCase().replace(/\s+/g, ' ');
    if (seenNormalized.has(norm)) return;
    seenNormalized.add(norm);
    combinedCandidates.push({ keyword: clean, category });
  };

  for (const item of candidateKeywords || []) {
    pushCandidate(item.keyword, item.category);
  }

  // Supplement with canonical domain/tech/product terms verified in the JD itself
  for (const canon of CANONICAL_JD_TAXONOMY) {
    const jdHit = findTermInText(canon.term, jdText);
    if (jdHit.count > 0) {
      pushCandidate(canon.term, canon.category);
    }
  }

  const matchedKeywords: KeywordMatch[] = [];
  const missingKeywords: KeywordMatch[] = [];

  for (const cand of combinedCandidates) {
    const jdStats = findTermInText(cand.keyword, jdText);
    // Strict grounding rule: ignore keywords that do not appear in the actual JD
    if (jdStats.count === 0) {
      continue;
    }

    const matchedSections: string[] = [];
    let bestResumeEvidence = '';
    let bestMatchType: KeywordMatch['matchType'] = 'none';

    for (const seg of segments) {
      const segHit = findTermInText(cand.keyword, seg.text);
      if (segHit.count > 0) {
        if (!matchedSections.includes(seg.section)) {
          matchedSections.push(seg.section);
        }
        if (!bestResumeEvidence || (bestMatchType === 'variant' && segHit.matchType === 'exact')) {
          bestMatchType = segHit.matchType;
          bestResumeEvidence = `[${seg.section}] "${segHit.firstSnippet}"`;
        }
      }
    }

    const jdEvidence = `JD (×${jdStats.count}): "${jdStats.firstSnippet}"`;

    if (matchedSections.length > 0) {
      matchedKeywords.push({
        keyword: cand.keyword,
        category: cand.category,
        foundInResume: true,
        frequencyInJD: jdStats.count,
        context: bestResumeEvidence,
        jdEvidence,
        resumeEvidence: bestResumeEvidence,
        matchedSections,
        matchType: bestMatchType,
      });
    } else {
      missingKeywords.push({
        keyword: cand.keyword,
        category: cand.category,
        foundInResume: false,
        frequencyInJD: jdStats.count,
        context: jdEvidence,
        jdEvidence,
        resumeEvidence:
          'Not found in Summary, Experience, Projects, Skills, Education, or Certifications.',
        matchedSections: [],
        matchType: 'none',
      });
    }
  }

  // Sort highest-frequency JD terms first
  matchedKeywords.sort((a, b) => b.frequencyInJD - a.frequencyInJD);
  missingKeywords.sort((a, b) => b.frequencyInJD - a.frequencyInJD);

  const totalTracked = matchedKeywords.length + missingKeywords.length;
  const keywordMatchPercent =
    totalTracked > 0 ? Math.round((matchedKeywords.length / totalTracked) * 100) : 0;

  return {
    matchedKeywords,
    missingKeywords,
    keywordMatchPercent,
  };
}

/**
 * Separately audits resume formatting & parser compatibility based purely on
 * document structure, layout, contact completeness, and machine-readability.
 */
export function calculateFormattingCompatibility(
  resume: StructuredResume,
  templateIdOverride?: string
): {
  score: number;
  status: 'High' | 'Moderate' | 'Needs Work';
  assessment: string;
  checks: FormattingCheckItem[];
  notes: string[];
} {
  const templateId = templateIdOverride || resume.templateId || 'template-pm';
  const checks: FormattingCheckItem[] = [];
  const notes: string[] = [];

  // 1. Contact completeness (20 pts)
  const hasName = Boolean(resume.name?.trim());
  const hasValidEmail = Boolean(resume.contact?.email?.trim() && resume.contact.email.includes('@'));
  const hasPhoneOrLink = Boolean(
    resume.contact?.phone?.trim() || resume.contact?.linkedin?.trim()
  );
  const contactPoints =
    (hasName ? 7 : 0) + (hasValidEmail ? 8 : 0) + (hasPhoneOrLink ? 5 : 0);
  checks.push({
    label: 'Machine-readable contact block',
    passed: contactPoints >= 15,
    points: contactPoints,
    maxPoints: 20,
    detail:
      contactPoints === 20
        ? 'Name, valid email, and phone/LinkedIn are structured as plain text.'
        : 'Add a full name, email address, and phone or LinkedIn URL in the header.',
  });

  // 2. Standard section headings coverage (25 pts)
  const hasSummary = Boolean(resume.summary?.trim() && resume.summary.trim().length >= 30);
  const hasExp = Boolean(resume.experience?.some((e) => e.role?.trim() && e.bullets?.length > 0));
  const hasSkills = Boolean(resume.skills?.some((s) => s.items?.length > 0));
  const hasEdu = Boolean(resume.education?.some((e) => e.degree?.trim()));
  const sectionPoints =
    (hasSummary ? 6 : 0) + (hasExp ? 8 : 0) + (hasSkills ? 6 : 0) + (hasEdu ? 5 : 0);
  checks.push({
    label: 'Standard ATS section headings',
    passed: sectionPoints >= 20,
    points: sectionPoints,
    maxPoints: 25,
    detail: `Detected ${[
      hasSummary && 'Summary',
      hasExp && 'Experience',
      hasSkills && 'Skills',
      hasEdu && 'Education',
    ]
      .filter(Boolean)
      .join(', ') || 'few standard sections'}.`,
  });

  // 3. Linear reading order (single-column vs two-column sidebar) (20 pts)
  const isTwoColumn = templateId === 'template-technical';
  const layoutPoints = isTwoColumn ? 12 : 20;
  checks.push({
    label: 'Single-column reading flow',
    passed: !isTwoColumn,
    points: layoutPoints,
    maxPoints: 20,
    detail: isTwoColumn
      ? 'Two-column layout selected; exported text-based PDF uses linear flow, while visual two-column layouts can confuse legacy parsers.'
      : 'Single-column top-to-bottom layout preserves predictable reading order.',
  });
  if (isTwoColumn) {
    notes.push(
      'Two-column sidebar selected: text-based PDF & DOCX exports normalize reading order linearly, though older company portals still favor single-column layouts.'
    );
  }

  // 4. Structured dates & clean bullet text (20 pts)
  const allExpHaveDates =
    (resume.experience?.length || 0) > 0 &&
    resume.experience.every((e) => Boolean(e.startDate?.trim() && e.endDate?.trim()));
  const bulletCount =
    (resume.experience || []).reduce((acc, e) => acc + (e.bullets?.length || 0), 0) +
    (resume.projects || []).reduce((acc, p) => acc + (p.bullets?.length || 0), 0);
  const structurePoints = (allExpHaveDates ? 10 : 4) + (bulletCount >= 3 ? 10 : bulletCount > 0 ? 6 : 0);
  checks.push({
    label: 'Consistent dates & bullet delimiters',
    passed: structurePoints >= 16,
    points: structurePoints,
    maxPoints: 20,
    detail: allExpHaveDates
      ? `${bulletCount} structured accomplishment bullets with explicit start/end date ranges.`
      : 'Ensure every experience entry includes explicit start/end dates and crisp bullet points.',
  });

  // 5. Conciseness & scannability (15 pts)
  const allBullets = [
    ...(resume.experience || []).flatMap((e) => e.bullets || []),
    ...(resume.projects || []).flatMap((p) => p.bullets || []),
  ].filter((b) => b.trim().length > 0);
  const avgBulletLen =
    allBullets.length > 0
      ? Math.round(allBullets.reduce((sum, b) => sum + b.length, 0) / allBullets.length)
      : 0;
  const fullText = extractResumeSegments(resume)
    .map((s) => s.text)
    .join(' ');
  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
  const goodDensity = wordCount >= 120 && wordCount <= 1050;
  const goodBulletLen = allBullets.length === 0 || avgBulletLen <= 260;
  const readabilityPoints = (goodDensity ? 8 : 4) + (goodBulletLen ? 7 : 3);
  checks.push({
    label: 'Text density & bullet scannability',
    passed: readabilityPoints >= 12,
    points: readabilityPoints,
    maxPoints: 15,
    detail: `${wordCount} total words${allBullets.length ? `, avg ${avgBulletLen} chars/bullet` : ''} — supports clean PDF text extraction and DOCX export.`,
  });

  const score = Math.min(
    100,
    Math.max(0, checks.reduce((sum, c) => sum + c.points, 0))
  );
  const status: 'High' | 'Moderate' | 'Needs Work' =
    score >= 85 ? 'High' : score >= 65 ? 'Moderate' : 'Needs Work';

  const passedCount = checks.filter((c) => c.passed).length;
  const assessment = `${passedCount}/${checks.length} structural parsing checks passed (${score}%). Assessed separately from JD keywords using text-extractable PDF/DOCX readiness.`;

  notes.unshift(assessment);

  return { score, status, assessment, checks, notes };
}

export interface DeterministicAtsInput {
  jdText: string;
  resumeData: StructuredResume;
  candidateKeywords?: CandidateKeywordInput[];
  aiExperienceScore?: number;
  aiExperienceAssessment?: string;
  aiProjectScore?: number;
  aiProjectAssessment?: string;
  strongPoints?: string[];
  improvementRecommendations?: string[];
  baselineScore?: number;
  diffItems?: DiffItem[];
}

export function buildDeterministicAtsReport(input: DeterministicAtsInput): ATSReport {
  const {
    jdText,
    resumeData,
    candidateKeywords = [],
    aiExperienceScore,
    aiExperienceAssessment,
    aiProjectScore,
    aiProjectAssessment,
    strongPoints = [],
    improvementRecommendations = [],
    baselineScore,
    diffItems = [],
  } = input;

  const { matchedKeywords, missingKeywords, keywordMatchPercent } = evaluateKeywordMatches(
    jdText,
    candidateKeywords,
    resumeData
  );

  const formatting = calculateFormattingCompatibility(resumeData, resumeData.templateId);

  // Category-specific deterministic ratios
  const techItems = [...matchedKeywords, ...missingKeywords].filter(
    (k) => k.category === 'technical' || k.category === 'tool'
  );
  const techMatched = techItems.filter((k) => k.foundInResume).length;
  const technicalSkillsMatch =
    techItems.length > 0
      ? Math.round((techMatched / techItems.length) * 100)
      : keywordMatchPercent;

  const prodItems = [...matchedKeywords, ...missingKeywords].filter(
    (k) => k.category === 'product' || k.category === 'domain' || k.category === 'soft'
  );
  const prodMatched = prodItems.filter((k) => k.foundInResume).length;
  const productSkillsMatch =
    prodItems.length > 0
      ? Math.round((prodMatched / prodItems.length) * 100)
      : keywordMatchPercent;

  // Deterministic Experience & Project relevance grounded in actual resume sections
  const segments = extractResumeSegments(resumeData);
  const expText = segments
    .filter((s) => s.kind === 'experience' || s.kind === 'headline' || s.kind === 'summary')
    .map((s) => s.text)
    .join('\n');
  const projText = segments
    .filter((s) => s.kind === 'projects')
    .map((s) => s.text)
    .join('\n');

  const trackedTerms = [...matchedKeywords, ...missingKeywords];
  const expTermHits = trackedTerms.filter((k) => findTermInText(k.keyword, expText).count > 0).length;
  const projTermHits = trackedTerms.filter((k) => findTermInText(k.keyword, projText).count > 0).length;

  const deterministicExpRatio =
    trackedTerms.length > 0 ? Math.round((expTermHits / trackedTerms.length) * 100) : keywordMatchPercent;
  const deterministicProjRatio =
    (resumeData.projects?.length || 0) === 0
      ? 0
      : trackedTerms.length > 0
        ? Math.round((projTermHits / trackedTerms.length) * 100)
        : keywordMatchPercent;

  const experienceMatch =
    typeof aiExperienceScore === 'number'
      ? Math.round(aiExperienceScore * 0.55 + deterministicExpRatio * 0.45)
      : deterministicExpRatio;

  const projectRelevance =
    (resumeData.projects?.length || 0) === 0
      ? 0
      : typeof aiProjectScore === 'number'
        ? Math.round(aiProjectScore * 0.5 + deterministicProjRatio * 0.5)
        : deterministicProjRatio;

  const overallScore = Math.round(
    keywordMatchPercent * 0.4 +
      formatting.score * 0.2 +
      experienceMatch * 0.25 +
      projectRelevance * 0.15
  );

  const origin = typeof baselineScore === 'number' ? baselineScore : overallScore;
  const activeEdits = diffItems.filter((d) => d.status === 'accepted').length;
  const pendingEdits = diffItems.filter((d) => d.status === 'pending').length;
  const scoreDelta = overallScore - origin;

  const totalTracked = matchedKeywords.length + missingKeywords.length;
  const calculationMethod = `Keyword Match (${matchedKeywords.length}/${totalTracked} verified JD terms = ${keywordMatchPercent}% × 0.40) + Formatting Compatibility (${formatting.score}% across 5 structural checks × 0.20) + Experience Relevance (${experienceMatch}% × 0.25) + Project Relevance (${projectRelevance}% × 0.15) = ${overallScore}% Estimated Alignment.`;

  const experienceAssessment =
    aiExperienceAssessment ||
    `${expTermHits}/${totalTracked} tracked JD keywords appear in Summary/Experience sections (${resumeData.experience?.length || 0} roles evaluated).`;

  const projectAssessment =
    (resumeData.projects?.length || 0) === 0
      ? 'No project entries present in this resume.'
      : aiProjectAssessment ||
        `${projTermHits}/${totalTracked} tracked JD keywords appear across ${resumeData.projects.length} listed project(s).`;

  let improvementSummary =
    'Pre-optimization baseline — generate tailored suggestions to improve JD alignment.';
  if (diffItems.length > 0) {
    improvementSummary = `${activeEdits} accepted / ${pendingEdits} pending of ${diffItems.length} rewrite suggestions${
      scoreDelta !== 0 ? ` (${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts vs baseline)` : ''
    }.`;
  }

  return {
    overallScore,
    originalScore: origin,
    atsCompatibility: {
      score: formatting.score,
      status: formatting.status,
      assessment: formatting.assessment,
      checks: formatting.checks,
    },
    technicalSkillsMatch,
    experienceMatch,
    experienceAssessment,
    productSkillsMatch,
    projectRelevance,
    projectAssessment,
    keywordMatch: keywordMatchPercent,
    improvementScore: Math.max(0, scoreDelta),
    improvementSummary,
    matchedKeywords,
    missingKeywords,
    strongPoints,
    improvementRecommendations:
      improvementRecommendations.length > 0
        ? improvementRecommendations
        : missingKeywords.slice(0, 4).map(
            (m) => `If truthful to your experience, add evidence of "${m.keyword}" in Skills or Experience.`
          ),
    formattingNotes: formatting.notes,
    calculationMethod,
    disclaimer: DEFAULT_ATS_DISCLAIMER,
  };
}
