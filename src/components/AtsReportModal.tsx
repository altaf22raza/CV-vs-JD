import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Download, 
  BarChart3, 
  Check, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { ATSReport } from '../types/resume';
import { downloadTextFile } from '../utils/pdfExport';

interface AtsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ATSReport | null;
  onOptimizeClick?: () => void;
}

export const AtsReportModal: React.FC<AtsReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onOptimizeClick
}) => {
  if (!isOpen || !report) return null;

  const handleDownloadReport = () => {
    const content = `# ResumeIQ ATS & JD Compatibility Audit Report
Generated: ${new Date().toLocaleDateString()}

## Scores Summary
- Overall Match Score: ${report.overallScore}%
- Technical Skills Match: ${report.technicalSkillsMatch}%
- Experience & Role Relevance: ${report.experienceMatch}%
- Product Competencies Match: ${report.productSkillsMatch}%
- ATS Keyword Alignment: ${report.keywordMatch}%

## Candidate Strengths
${report.strongPoints.map(s => `- ${s}`).join('\n')}

## Actionable Improvement Recommendations
${report.improvementRecommendations.map(r => `- ${r}`).join('\n')}

## ATS Keywords Analysis
### Matched Keywords:
${report.matchedKeywords.map(k => `- [MATCHED] ${k.keyword} (${k.category}) - ${k.context || ''}`).join('\n')}

### Missing or Under-represented Keywords:
${report.missingKeywords.map(k => `- [MISSING] ${k.keyword} (${k.category})`).join('\n')}

## Formatting & Readability Notes
${report.formattingNotes.map(n => `- ${n}`).join('\n')}

## Disclaimer
${report.disclaimer}
`;
    downloadTextFile(content, 'ResumeIQ_ATS_Compatibility_Report.md', 'text/markdown');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2A44]">
                ATS Compatibility & Keyword Audit Report
              </h3>
              <p className="text-xs text-slate-500">
                Detailed semantic breakdown against target job description.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2 bg-[#1F2A44] text-white p-5 rounded-xl flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">
                  Overall ATS Match Score
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-extrabold font-mono tabular-nums">
                    {report.overallScore}%
                  </span>
                  {report.originalScore && report.originalScore !== report.overallScore && (
                    <span className="text-xs text-emerald-300 font-medium">
                      (was {report.originalScore}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-300 mt-4 leading-relaxed">
                {report.overallScore >= 80 ? (
                  <span className="text-emerald-300 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High likelihood of passing ATS filters
                  </span>
                ) : (
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Room for keyword & bullet refinement
                  </span>
                )}
              </div>
            </div>

            {/* Category Sub-scores */}
            <div className="sm:col-span-3 grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block">Technical Skills</span>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {report.technicalSkillsMatch}%
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${report.technicalSkillsMatch}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block">Experience & Role</span>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {report.experienceMatch}%
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${report.experienceMatch}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block">Product Competencies</span>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {report.productSkillsMatch}%
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${report.productSkillsMatch}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block">ATS Keywords</span>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {report.keywordMatch}%
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full"
                    style={{ width: `${report.keywordMatch}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Keywords Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matched Keywords */}
            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Matched ATS Keywords ({report.matchedKeywords.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {report.matchedKeywords.map((k, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-emerald-100">
                    <span className="font-semibold text-slate-800">{k.keyword}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                      {k.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Missing / Under-represented Keywords ({report.missingKeywords.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {report.missingKeywords.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2">All major JD keywords are present in your resume!</p>
                ) : (
                  report.missingKeywords.map((k, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-amber-100">
                      <span className="font-medium text-slate-700">{k.keyword}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                        {k.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recommendations and Strengths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
                Key Strengths Identified
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {report.strongPoints.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
                Improvement Recommendations
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {report.improvementRecommendations.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Readability & Formatting */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">Template & Readability Compliance</span>
            <ul className="list-disc pl-4 space-y-0.5 text-[11.5px]">
              {report.formattingNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-slate-100 rounded-lg text-[11px] text-slate-500 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Disclaimer:</strong> {report.disclaimer || 'ATS scores are heuristic estimates based on semantic keyword relevance and formatting criteria, not a guarantee of interview selection.'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Report (.md)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
            {onOptimizeClick && (
              <button
                onClick={() => {
                  onClose();
                  onOptimizeClick();
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimize Resume for These Keywords</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
