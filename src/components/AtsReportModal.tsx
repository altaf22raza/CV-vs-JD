import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  BarChart3,
  Check,
  Info,
  FileCheck,
  Briefcase,
  FolderGit2,
  TrendingUp,
  Tag,
  SearchCheck,
} from 'lucide-react';
import { ATSReport, ResumeVersion } from '../types/resume';
import { downloadTextFile } from '../utils/pdfExport';
import { normalizeReportMetrics } from '../utils/reportMetrics';

interface AtsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ATSReport | null;
  version?: ResumeVersion | null;
  onOptimizeClick?: () => void;
}

export const AtsReportModal: React.FC<AtsReportModalProps> = ({
  isOpen,
  onClose,
  report,
  version,
  onOptimizeClick,
}) => {
  // Close on Escape key press & lock body scroll cleanly
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const metrics = normalizeReportMetrics(report, version);

  const handleDownloadReport = () => {
    const content = `# Resume vs Job Description Alignment Report (Deterministic & Heuristic)
Generated: ${new Date().toLocaleDateString()}

## Separate Pillar Breakdown
- Keyword Match (JD vs Resume): ${metrics.keywordMatchPercent}% (${metrics.matchedCount}/${metrics.matchedCount + metrics.missingCount} tracked JD terms)
- Formatting Compatibility (Structure & Parser Readiness): ${metrics.atsCompatibilityScore}% (${metrics.atsCompatibilityStatus}) — ${metrics.atsCompatibilityAssessment}
- Experience Relevance: ${metrics.experienceRelevanceScore}% — ${metrics.experienceAssessment}
- Project Relevance: ${metrics.projectRelevanceScore}% — ${metrics.projectAssessment}
- Estimated Overall Alignment: ${metrics.estimatedOverallIndex}%
- Tailoring Improvement: ${metrics.improvementSummary}

## Formatting & Structure Checks
${metrics.formattingChecks.map((c) => `- [${c.passed ? 'PASS' : 'ATTN'}] ${c.label} (${c.points}/${c.maxPoints}): ${c.detail}`).join('\n') || '- No checks logged'}

## Scoring Methodology
${metrics.calculationMethod}

## Matched JD Keywords & Evidence
${
  report.matchedKeywords
    .map(
      (k) =>
        `- [MATCHED · ${k.matchType || 'exact'}] ${k.keyword} (${k.category})\n  - JD: ${k.jdEvidence || `Mentioned ${k.frequencyInJD}x in JD`}\n  - Resume: ${k.resumeEvidence || k.context || 'Present in resume'}`
    )
    .join('\n') || '- None recorded'
}

## Missing Skills / Keywords & Evidence
${
  report.missingKeywords
    .map(
      (k) =>
        `- [MISSING] ${k.keyword} (${k.category})\n  - JD: ${k.jdEvidence || `Mentioned ${k.frequencyInJD}x in JD`}\n  - Resume Audit: ${k.resumeEvidence || 'Not found in resume sections'}`
    )
    .join('\n') || '- All tracked JD keywords are covered'
}

## Candidate Strengths
${report.strongPoints.map((s) => `- ${s}`).join('\n')}

## Improvement Recommendations
${report.improvementRecommendations.map((r) => `- ${r}`).join('\n')}

## Important Notice
${metrics.disclaimer}
`;
    downloadTextFile(content, 'Resume_JD_Alignment_Report.md', 'text/markdown');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ats-report-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-xl border border-[#E5EAF0] w-full max-w-4xl overflow-hidden flex flex-col max-h-[92dvh] text-[#182230]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3 bg-[#F7F9FC]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#173B65] text-white flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 id="ats-report-modal-title" className="text-base font-bold text-[#173B65] truncate">
                Resume vs JD Alignment &amp; Evidence Report
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic keyword verification separated from structural formatting compatibility.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors cursor-pointer shrink-0"
            aria-label="Close report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Separated Key Metrics Header + Methodology */}
          <div className="bg-[#F7F9FC] border border-[#E5EAF0] rounded-[12px] p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Keyword Match (JD vs Resume)
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#173B65] mt-1">
                  {metrics.keywordMatchPercent}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {metrics.matchedCount} of {metrics.matchedCount + metrics.missingCount} JD terms verified
                </div>
              </div>

              <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Formatting Compatibility
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                  {metrics.atsCompatibilityScore}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Separate structural audit ({metrics.atsCompatibilityStatus})
                </div>
              </div>

              <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Composite Alignment
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#173B65]">
                    {metrics.estimatedOverallIndex}%
                  </span>
                  {report.originalScore !== undefined && report.originalScore !== metrics.estimatedOverallIndex && (
                    <span className="text-xs font-mono tabular-nums text-emerald-700 font-semibold">
                      (baseline {report.originalScore}%)
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Weighted heuristic (never an ATS pass guarantee)
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-white border border-[#E5EAF0] rounded-[10px] p-3.5">
              <div className="font-semibold text-[#173B65] flex items-center gap-1.5 mb-1">
                <Info className="w-3.5 h-3.5 text-[#3978B8] shrink-0" />
                <span>Scoring Methodology</span>
              </div>
              <p>{metrics.calculationMethod}</p>
            </div>
          </div>

          {/* 5-Check Formatting Compatibility Breakdown */}
          {metrics.formattingChecks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-[#173B65] uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>Formatting &amp; Structure Audit (Independent of Keywords)</span>
                </h4>
                <span className="text-xs font-mono font-semibold text-[#173B65]">
                  {metrics.atsCompatibilityScore}% ({metrics.atsCompatibilityStatus})
                </span>
              </div>
              <div className="bg-white border border-[#E5EAF0] rounded-[12px] divide-y divide-[#E5EAF0]">
                {metrics.formattingChecks.map((chk, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-[#182230]">{chk.label}</div>
                        <p className="text-slate-500 mt-0.5 leading-relaxed">{chk.detail}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-700 shrink-0 tabular-nums">
                      {chk.points}/{chk.maxPoints}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Alignment Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#173B65]" />
                  <span>Experience Relevance</span>
                </span>
                <span className="text-sm font-bold font-mono tabular-nums text-[#173B65]">
                  {metrics.experienceRelevanceScore}%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {metrics.experienceAssessment}
              </p>
            </div>

            <div className="p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>Project Relevance</span>
                </span>
                <span className="text-sm font-bold font-mono tabular-nums text-[#173B65]">
                  {metrics.projectRelevanceScore}%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {metrics.projectAssessment}
              </p>
            </div>

            <div className="p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tailoring Delta</span>
                </span>
                <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                  {metrics.improvementScore > 0 ? `+${metrics.improvementScore} pts` : `${metrics.changesCount} edits`}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {metrics.improvementSummary}
              </p>
            </div>
          </div>

          {/* Evidence-Backed Keyword Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Matched Keywords with Evidence */}
            <div className="p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-[#173B65] flex items-center gap-1.5">
                  <SearchCheck className="w-4 h-4 text-emerald-600" />
                  <span>Matched JD Keywords &amp; Evidence ({report.matchedKeywords.length})</span>
                </h4>
                <Tag className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="divide-y divide-[#E5EAF0] max-h-72 overflow-y-auto pr-1">
                {report.matchedKeywords.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No exact keyword matches found yet.</p>
                ) : (
                  report.matchedKeywords.map((k, idx) => (
                    <div key={idx} className="py-2.5 space-y-1 text-xs">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-[#182230]">{k.keyword}</span>
                        <span className="text-[10.5px] text-slate-500 font-mono shrink-0">
                          {k.category}
                          {k.matchType ? ` · ${k.matchType}` : ''}
                        </span>
                      </div>
                      {k.jdEvidence && (
                        <p className="text-[11px] text-slate-500 leading-snug">{k.jdEvidence}</p>
                      )}
                      {(k.resumeEvidence || k.context) && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/70 rounded-[6px] px-2 py-1 leading-snug">
                          {k.resumeEvidence || k.context}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Missing Keywords with Evidence */}
            <div className="p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-3">
              <h4 className="text-xs font-bold text-[#173B65] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Missing JD Keywords &amp; Evidence ({report.missingKeywords.length})</span>
              </h4>
              <div className="divide-y divide-[#E5EAF0] max-h-72 overflow-y-auto pr-1">
                {report.missingKeywords.length === 0 ? (
                  <p className="text-xs text-emerald-700 py-4 text-center">
                    All tracked JD keywords were found in this resume.
                  </p>
                ) : (
                  report.missingKeywords.map((k, idx) => (
                    <div key={idx} className="py-2.5 space-y-1 text-xs">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-[#182230]">{k.keyword}</span>
                        <span className="text-[10.5px] text-amber-700 font-mono shrink-0">
                          {k.category} · ×{k.frequencyInJD} in JD
                        </span>
                      </div>
                      {k.jdEvidence && (
                        <p className="text-[11px] text-slate-600 leading-snug">{k.jdEvidence}</p>
                      )}
                      <p className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/70 rounded-[6px] px-2 py-1 leading-snug">
                        {k.resumeEvidence || 'Not found in Summary, Experience, Projects, Skills, Education, or Certifications.'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Strengths & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-[#E5EAF0]">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#173B65] uppercase tracking-wide">
                Key Strengths Identified
              </h4>
              {report.strongPoints.length === 0 ? (
                <p className="text-xs text-slate-500">No strengths logged yet.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {report.strongPoints.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#173B65] uppercase tracking-wide">
                Improvement Recommendations
              </h4>
              {report.improvementRecommendations.length === 0 ? (
                <p className="text-xs text-slate-500">No additional recommendations at this time.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {report.improvementRecommendations.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#3978B8] shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Honest Disclaimer */}
          <div className="flex items-start gap-2.5 p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] text-xs text-slate-600 leading-relaxed">
            <Info className="w-4 h-4 text-[#3978B8] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#173B65]">No ATS Pass Guarantees:</strong> {metrics.disclaimer}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-[#F7F9FC] border-t border-[#E5EAF0] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="btn-interactive flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#3978B8]" />
            <span>Download Evidence Report (.md)</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#173B65] rounded-[10px] hover:bg-white border border-transparent hover:border-[#E5EAF0] transition-colors cursor-pointer"
            >
              Close
            </button>
            {onOptimizeClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOptimizeClick();
                }}
                className="btn-interactive flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Optimize for These Keywords</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
