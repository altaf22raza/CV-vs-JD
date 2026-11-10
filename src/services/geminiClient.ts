import { StructuredResume, ATSReport, DiffItem, JDAnalysis } from '../types/resume';

export async function apiAnalyzeJd(params: {
  jdText: string;
  resumeData: StructuredResume;
  companyName?: string;
  targetRole?: string;
}): Promise<{ analysis: JDAnalysis; atsReport: ATSReport }> {
  const response = await fetch('/api/analyze-jd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis failed: ${response.statusText}`);
  }

  return response.json();
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
  const response = await fetch('/api/optimize-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Optimization failed: ${response.statusText}`);
  }

  return response.json();
}

export async function apiRewriteSection(params: {
  sectionName: string;
  currentText: string;
  instruction: string;
  jdText?: string;
}): Promise<{ rewrittenText: string; reason: string }> {
  const response = await fetch('/api/rewrite-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Rewrite failed: ${response.statusText}`);
  }

  return response.json();
}
