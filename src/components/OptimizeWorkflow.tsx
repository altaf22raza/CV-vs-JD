import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Building2,
  Briefcase,
  Info,
  FileCheck,
  FolderGit2,
  Tag,
  X,
  FileText,
  Eye,
} from 'lucide-react';
import { ResumeVersion, StructuredResume, ATSReport, SavedJobDescription, DiffItem } from '../types/resume';
import { SAMPLE_JOB_DESCRIPTIONS } from '../data/defaultResume';
import { ResumePreviewA4 } from './ResumePreviewA4';
import { EditorPanel } from './EditorPanel';
import { BeforeAfterCompareView } from './BeforeAfterCompareView';
import { AnalysisReportSkeleton, OptimizationDiffSkeleton } from './SkeletonLoaders';
import { apiAnalyzeJd, apiOptimizeResume } from '../services/geminiClient';
import { generateLatexFromStructured } from '../utils/latexParser';
import { exportResumeToPdf } from '../utils/pdfExport';
import { exportResumeToDocx } from '../utils/docxExport';
import { normalizeReportMetrics } from '../utils/reportMetrics';
import {
  buildDeterministicAtsReport,
  type CandidateKeywordInput,
} from '../utils/atsScoring';
import {
  generateDetailedDiffItems,
  applyDiffToStructuredResume,
  applyAllDiffsToResume,
} from '../utils/resumeDiff';
import { generateId } from '../utils/id';
import { validateAndExtractDocumentFile } from '../utils/fileValidator';
import { useAuth } from '../firebase/AuthContext';

interface OptimizeWorkflowProps {
  savedVersions: ResumeVersion[];
  onSaveOptimizedCv: (newVersion: ResumeVersion) => void;
  onCompareVersions: (verA: ResumeVersion, verB: ResumeVersion) => void;
  onCancel: () => void;
  onRequireAuth?: (title: string, proceed: () => void) => void;
  initialJd?: SavedJobDescription | null;
  onSaveJd?: (jd: { role: string; company: string; text: string }) => void;
}

export const OptimizeWorkflow: React.FC<OptimizeWorkflowProps> = ({
  savedVersions,
  onSaveOptimizedCv,
  onCancel,
  onRequireAuth,
  initialJd,
  onSaveJd,
}) => {
  const { user } = useAuth();
  // Steps: 1 (select CV) -> 2 (enter JD) -> 3 (analysis report) -> 4 (preview & review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected CV from library
  const [selectedCv, setSelectedCv] = useState<ResumeVersion | null>(savedVersions[0] || null);

  // JD Inputs
  const [jobTitle, setJobTitle] = useState<string>(initialJd?.role || 'Associate Product Manager');
  const [companyName, setCompanyName] = useState<string>(initialJd?.company || 'Razorpay');
  const [jdText, setJdText] = useState<string>(initialJd?.text || SAMPLE_JOB_DESCRIPTIONS[0].text);

  // AI Analysis Results & Inline Errors
  const [analysisReport, setAnalysisReport] = useState<ATSReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  // Generated Optimized CV State
  const [optimizedResume, setOptimizedResume] = useState<ResumeVersion | null>(null);
  const [step4View, setStep4View] = useState<'compare' | 'editor'>('compare');
  const [step4MobilePane, setStep4MobilePane] = useState<'editor' | 'preview'>('editor');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Handle Step 1: Select CV
  const handleSelectCv = (cv: ResumeVersion) => {
    setWorkflowError(null);
    setSelectedCv(cv);
    setCurrentStep(2);
  };

  // Handle Step 2: Upload JD text file with strict validation & sanitization
  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setWorkflowError(null);
    const result = await validateAndExtractDocumentFile(file);
    if (!result.valid || !result.extractedText) {
      setWorkflowError(result.error || 'Could not validate uploaded job description file.');
      return;
    }
    setJdText(result.extractedText);
  };

  // Handle Step 3: Run AI Analysis
  const executeAnalysis = async () => {
    if (!selectedCv || !jdText.trim()) return;
    setWorkflowError(null);
    if (onSaveJd) {
      onSaveJd({ role: jobTitle, company: companyName, text: jdText });
    }
    setIsAnalyzing(true);
    setProcessingStatus('Analyzing Job Description requirements and mapping ATS compatibility...');
    try {
      const result = await apiAnalyzeJd({
        jdText,
        resumeData: selectedCv.structuredData,
        companyName,
        targetRole: jobTitle,
      });
      setAnalysisReport(result.atsReport);
      setCurrentStep(3);
    } catch (err: any) {
      setWorkflowError(`Analysis failed: ${err?.message || 'Unable to reach AI analysis engine.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedCv || !jdText.trim()) return;
    if (!user && onRequireAuth) {
      onRequireAuth('Sign In to Analyze JD & Compatibility', () => {
        void executeAnalysis();
      });
      return;
    }
    await executeAnalysis();
  };

  // Handle Step 4: Generate Optimized CV
  const executeGenerateOptimized = async () => {
    if (!selectedCv || !jdText.trim()) return;
    setWorkflowError(null);
    if (onSaveJd) {
      onSaveJd({ role: jobTitle, company: companyName, text: jdText });
    }
    setIsOptimizing(true);
    setProcessingStatus('Generating tailored CV: optimizing summary, rewriting bullets, and adding ATS keywords...');
    try {
      const res = await apiOptimizeResume({
        resumeData: selectedCv.structuredData,
        jdText,
        options: {
          targetRole: jobTitle,
          companyName,
        },
      });

      const baselineStructuredCopy: StructuredResume = JSON.parse(
        JSON.stringify(selectedCv.structuredData)
      );
      const baselineLatex = generateLatexFromStructured(baselineStructuredCopy);
      const detailedDiffs = generateDetailedDiffItems(
        selectedCv.structuredData,
        res.optimizedData,
        res.diffItems,
        res.identifiedKeywordsToAdd
      );
      const editCount = detailedDiffs.length;

      const candidateKeywords: CandidateKeywordInput[] = [
        ...(analysisReport?.matchedKeywords || []).map((k) => ({
          keyword: k.keyword,
          category: k.category,
        })),
        ...(analysisReport?.missingKeywords || []).map((k) => ({
          keyword: k.keyword,
          category: k.category,
        })),
        ...(res.identifiedKeywordsToAdd || []).map((k) => ({
          keyword: k.keyword,
          category: 'technical' as const,
        })),
      ];

      const baselineEval =
        analysisReport ||
        buildDeterministicAtsReport({
          jdText,
          resumeData: baselineStructuredCopy,
          candidateKeywords,
        });

      const currentDeterministicReport = buildDeterministicAtsReport({
        jdText,
        resumeData: baselineStructuredCopy,
        candidateKeywords,
        aiExperienceScore: baselineEval.experienceMatch,
        aiExperienceAssessment: baselineEval.experienceAssessment,
        aiProjectScore: baselineEval.projectRelevance,
        aiProjectAssessment: baselineEval.projectAssessment,
        strongPoints: baselineEval.strongPoints,
        improvementRecommendations: baselineEval.improvementRecommendations,
        baselineScore: baselineEval.overallScore,
        diffItems: detailedDiffs,
      });

      const newVersion: ResumeVersion = {
        id: generateId('opt'),
        title: companyName ? `${jobTitle} (${companyName})` : `${jobTitle} (Optimized)`,
        targetRole: jobTitle || selectedCv.targetRole,
        companyName,
        cvType: 'optimized',
        templateId: selectedCv.templateId || 'template-pm',
        latexSource: baselineLatex,
        originalLatex: selectedCv.latexSource,
        structuredData: baselineStructuredCopy,
        originalStructuredData: selectedCv.structuredData,
        diffItems: detailedDiffs,
        identifiedKeywordsToAdd: res.identifiedKeywordsToAdd,
        atsReport: currentDeterministicReport,
        jdText,
        snapshots: [
          {
            id: generateId('snap-init'),
            timestamp: new Date().toISOString(),
            label: companyName
              ? `Tailoring Start (${companyName})`
              : `Tailoring Start (${jobTitle})`,
            note: `Baseline copied from ${selectedCv.title} with ${editCount} AI rewrite suggestions queued for review.`,
            structuredData: JSON.parse(JSON.stringify(baselineStructuredCopy)),
            latexSource: baselineLatex,
            estimatedScore: currentDeterministicReport.overallScore,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOriginal: false,
      };

      setOptimizedResume(newVersion);
      setStep4View('compare');
      setCurrentStep(4);
    } catch (err: any) {
      setWorkflowError(`Optimization failed: ${err?.message || 'Unable to optimize resume.'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateOptimized = async () => {
    if (!selectedCv || !jdText.trim()) return;
    if (!user && onRequireAuth) {
      onRequireAuth('Sign In to Generate Your Optimized CV', () => {
        void executeGenerateOptimized();
      });
      return;
    }
    await executeGenerateOptimized();
  };

  // Save as new CV in library
  const handleSaveAsNewCv = () => {
    if (!optimizedResume) return;
    onSaveOptimizedCv(optimizedResume);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:overflow-hidden bg-[#F7F9FC] text-[#182230]">
      {/* Top Workflow Stepper Header */}
      <div className="bg-white border-b border-[#E5EAF0] px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="btn-interactive p-1.5 text-slate-500 hover:text-[#173B65] hover:bg-[#F7F9FC] rounded-[8px] transition-colors shrink-0"
            title="Cancel"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#173B65] truncate">
              Optimize CV for Target Job Description
            </h1>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <span className={currentStep === 1 ? 'font-bold text-[#173B65] underline decoration-2 decoration-[#3978B8] underline-offset-4' : 'text-slate-400'}>
                1. Select CV
              </span>
              <span className="text-slate-300">/</span>
              <span className={currentStep === 2 ? 'font-bold text-[#173B65] underline decoration-2 decoration-[#3978B8] underline-offset-4' : 'text-slate-400'}>
                2. Input Target JD
              </span>
              <span className="text-slate-300">/</span>
              <span className={currentStep === 3 ? 'font-bold text-[#173B65] underline decoration-2 decoration-[#3978B8] underline-offset-4' : 'text-slate-400'}>
                3. Compatibility Analysis
              </span>
              <span className="text-slate-300">/</span>
              <span className={currentStep === 4 ? 'font-bold text-[#173B65] underline decoration-2 decoration-[#3978B8] underline-offset-4' : 'text-slate-400'}>
                4. Review &amp; Save
              </span>
            </div>
          </div>
        </div>

        {currentStep === 4 && optimizedResume && selectedCv && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-[10px] border border-[#E5EAF0] bg-[#F7F9FC] p-0.5">
              <button
                type="button"
                onClick={() => setStep4View('compare')}
                className={`px-3 py-1 text-xs font-semibold rounded-[8px] transition-colors whitespace-nowrap ${
                  step4View === 'compare'
                    ? 'bg-[#173B65] text-white'
                    : 'text-slate-600 hover:text-[#182230]'
                }`}
              >
                Before &amp; After Review
              </button>
              <button
                type="button"
                onClick={() => setStep4View('editor')}
                className={`px-3 py-1 text-xs font-semibold rounded-[8px] transition-colors whitespace-nowrap ${
                  step4View === 'editor'
                    ? 'bg-[#173B65] text-white'
                    : 'text-slate-600 hover:text-[#182230]'
                }`}
              >
                Editor &amp; A4 Preview
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const doDownload = async () => {
                  await exportResumeToPdf(
                    optimizedResume.structuredData,
                    `${optimizedResume.title.replace(/\s+/g, '_')}.pdf`,
                    optimizedResume.language || 'en'
                  );
                };
                if (!user) {
                  if (onRequireAuth) {
                    onRequireAuth('Sign In to Download Your Optimized Resume', doDownload);
                  }
                  return;
                }
                void doDownload();
              }}
              className="btn-interactive px-3 py-1.5 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#3978B8]" />
              <span>Download Text PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const doDocx = async () => {
                  await exportResumeToDocx(
                    optimizedResume.structuredData,
                    `${optimizedResume.title.replace(/\s+/g, '_')}.docx`,
                    optimizedResume.language || 'en'
                  );
                };
                if (!user) {
                  if (onRequireAuth) {
                    onRequireAuth('Sign In to Download Your DOCX Resume', doDocx);
                  }
                  return;
                }
                doDocx();
              }}
              className="btn-interactive px-3 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#3978B8]" />
              <span>Download DOCX</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAsNewCv}
              className="btn-interactive px-4 py-1.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] whitespace-nowrap"
            >
              {savedNotice ? 'Saved to My CVs!' : 'Save Final CV'}
            </button>
          </div>
        )}
      </div>

      {/* Inline Workflow Error Banner */}
      {workflowError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{workflowError}</span>
          </div>
          <button
            type="button"
            onClick={() => setWorkflowError(null)}
            className="p-1 text-rose-600 hover:bg-rose-100 rounded-[8px]"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: SELECT AVAILABLE CV */}
      {currentStep === 1 && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-bold text-[#173B65]">
              Step 1: Select a CV to Optimize
            </h2>
            <p className="text-xs text-slate-500">
              Select any CV currently saved in your account library. You do not need to re-upload.
            </p>
          </div>

          {savedVersions.length === 0 ? (
            <div className="bg-white border border-dashed border-[#E5EAF0] rounded-[14px] p-10 text-center space-y-3 max-w-lg mx-auto">
              <div className="w-11 h-11 rounded-[12px] bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center mx-auto text-[#3978B8]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#173B65]">No resumes in your library yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload an existing resume or create one in the builder before tailoring it to a job description.
              </p>
              <button
                type="button"
                onClick={onCancel}
                className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVersions.map((cv) => {
                const isSelected = selectedCv?.id === cv.id;
                return (
                  <div
                    key={cv.id}
                    onClick={() => handleSelectCv(cv)}
                    className={`card-interactive p-5 rounded-[14px] border bg-white cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'border-[#3978B8]/70 bg-[#F7F9FC]/40 shadow-xs'
                        : 'border-[#E5EAF0] hover:border-[#3978B8]/60'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectCv(cv);
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#3978B8] font-mono">
                          {cv.cvType || 'Master'}
                        </span>
                        {cv.atsReport && (
                          <span className="text-xs font-mono font-bold text-[#173B65] tabular-nums">
                            {cv.atsReport.overallScore}% Est. Fit
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#182230] leading-snug group-hover:text-[#3978B8] transition-colors">
                        {cv.title}
                      </h3>
                      <p className="text-xs text-slate-600 truncate">{cv.targetRole}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E5EAF0] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(cv.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="px-2 py-1 text-xs font-bold text-[#173B65] group-hover:text-[#3978B8] flex items-center gap-1 transition-colors">
                        <span>Select CV</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#3978B8]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: ENTER TARGET JOB DESCRIPTION */}
      {currentStep === 2 && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#3978B8]">Step 2 of 4</span>
              <h2 className="text-xl font-bold text-[#173B65]">
                Enter Target Job Description
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-interactive px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-[#173B65] bg-white border border-[#E5EAF0] rounded-[10px]"
            >
              Change Selected CV
            </button>
          </div>

          {isAnalyzing ? (
            <AnalysisReportSkeleton statusText={processingStatus} />
          ) : (
            <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E5EAF0] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#182230] block mb-1">Target Job Title</label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={jobTitle}
                      placeholder="e.g. Associate Product Manager"
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#182230] block mb-1">Company Name (Optional)</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={companyName}
                      placeholder="e.g. Razorpay, Swiggy, Stripe"
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
                    />
                  </div>
                </div>
              </div>

              {/* Quick sample pickers */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                <span>Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => {
                    setJobTitle('Associate Product Manager (AI & Data)');
                    setCompanyName('Razorpay');
                    setJdText(SAMPLE_JOB_DESCRIPTIONS[0].text);
                  }}
                  className="text-[#3978B8] hover:underline font-medium text-[11px]"
                >
                  Razorpay APM
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setJobTitle('AI Product Manager');
                    setCompanyName('Swiggy');
                    setJdText(SAMPLE_JOB_DESCRIPTIONS[1].text);
                  }}
                  className="text-[#3978B8] hover:underline font-medium text-[11px]"
                >
                  Swiggy AI PM
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setJobTitle('Technical Product Manager');
                    setCompanyName('Microsoft');
                    setJdText(SAMPLE_JOB_DESCRIPTIONS[2].text);
                  }}
                  className="text-[#3978B8] hover:underline font-medium text-[11px]"
                >
                  Microsoft TPM
                </button>
              </div>

              {/* Textarea */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-semibold text-[#182230]">Paste Full Job Description</label>
                  <label className="text-xs text-[#3978B8] font-semibold cursor-pointer hover:underline flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload JD (TXT / PDF / DOCX)</span>
                    <input type="file" accept=".txt,.pdf,.docx" onChange={handleJdFileUpload} className="hidden" />
                  </label>
                </div>
                <textarea
                  rows={10}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the complete job description responsibilities, requirements, and qualifications..."
                  className="w-full text-xs p-3.5 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500 truncate">
                  Selected CV: <strong className="text-[#173B65]">{selectedCv?.title}</strong>
                </span>

                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || !jdText.trim()}
                  className="btn-interactive px-5 py-2.5 bg-[#173B65] hover:bg-[#122F52] text-white text-xs font-semibold rounded-[10px] flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze JD &amp; Compatibility</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: AI-POWERED ANALYSIS REPORT */}
      {currentStep === 3 && analysisReport && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#3978B8]">Step 3 of 4</span>
              <h2 className="text-xl font-bold text-[#173B65]">
                CV vs JD Compatibility Report
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={isOptimizing}
                className="btn-interactive px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#173B65] bg-white border border-[#E5EAF0] rounded-[10px] disabled:opacity-50"
              >
                Back to JD
              </button>
              <button
                type="button"
                onClick={handleGenerateOptimized}
                disabled={isOptimizing}
                className="btn-interactive px-4 py-2 bg-[#173B65] hover:bg-[#122F52] text-white text-xs font-semibold rounded-[10px] flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Optimized CV</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {isOptimizing ? (
            <OptimizationDiffSkeleton statusText={processingStatus} />
          ) : (
            <>
              {/* 6-Metric Evaluation Breakdown */}
              {(() => {
                const metrics = normalizeReportMetrics(analysisReport, selectedCv);
                return (
                  <>
                    <div className="bg-white border border-[#E5EAF0] rounded-[14px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Estimated Overall Alignment
                        </div>
                        <div className="text-3xl font-bold font-mono tabular-nums text-[#173B65] mt-1">
                          {metrics.estimatedOverallIndex}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Heuristic fit estimate — not an official or guaranteed score from an employer&apos;s ATS.
                        </div>
                      </div>
                      <div className="md:max-w-lg text-xs text-slate-600 leading-relaxed bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] p-3.5">
                        <div className="font-semibold text-[#173B65] flex items-center gap-1.5 mb-1">
                          <Info className="w-3.5 h-3.5 text-[#3978B8] shrink-0" />
                          <span>How this estimate is calculated</span>
                        </div>
                        <p>{metrics.calculationMethod}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="card-interactive p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#182230] flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-[#173B65]" />
                            <span>ATS Compatibility</span>
                          </span>
                          <span className="text-xs font-bold font-mono tabular-nums text-[#173B65]">
                            {metrics.atsCompatibilityScore}% · {metrics.atsCompatibilityStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{metrics.atsCompatibilityAssessment}</p>
                      </div>

                      <div className="card-interactive p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#182230] flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-[#3978B8]" />
                            <span>Keyword Match</span>
                          </span>
                          <span className="text-xs font-bold font-mono tabular-nums text-[#173B65]">
                            {metrics.keywordMatchPercent}% ({metrics.matchedCount} matched)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {metrics.matchedCount > 0
                            ? `Matched JD terms: ${metrics.matchedKeywordsList.slice(0, 4).join(', ')}${metrics.matchedCount > 4 ? ` +${metrics.matchedCount - 4} more` : ''}`
                            : 'Matched keywords from the target job description.'}
                        </p>
                      </div>

                      <div className="card-interactive p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#182230] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Missing Skills</span>
                          </span>
                          <span className="text-xs font-bold font-mono tabular-nums text-amber-700">
                            {metrics.missingCount} {metrics.missingCount === 1 ? 'gap' : 'gaps'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {metrics.missingCount > 0
                            ? `Missing keywords: ${metrics.missingKeywordsList.slice(0, 4).join(', ')}${metrics.missingCount > 4 ? ` +${metrics.missingCount - 4} more` : ''}`
                            : 'No major missing JD skills identified.'}
                        </p>
                      </div>

                      <div className="card-interactive p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#182230] flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-[#173B65]" />
                            <span>Experience Relevance</span>
                          </span>
                          <span className="text-xs font-bold font-mono tabular-nums text-[#173B65]">
                            {metrics.experienceRelevanceScore}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{metrics.experienceAssessment}</p>
                      </div>

                      <div className="card-interactive p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#182230] flex items-center gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-[#3978B8]" />
                            <span>Project Relevance</span>
                          </span>
                          <span className="text-xs font-bold font-mono tabular-nums text-[#173B65]">
                            {metrics.projectRelevanceScore}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{metrics.projectAssessment}</p>
                      </div>

                      <div className="card-interactive p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#182230] flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Improvement Score</span>
                          </span>
                          <span className="text-xs font-bold font-mono tabular-nums text-emerald-700">
                            {metrics.improvementScore > 0 ? `+${metrics.improvementScore} pts` : 'Pre-optimization'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{metrics.improvementSummary}</p>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Formatting Compatibility Checks (Separate from Keyword Match) */}
              {(() => {
                const metrics = normalizeReportMetrics(analysisReport, selectedCv);
                if (!metrics.formattingChecks.length) return null;
                return (
                  <div className="bg-white border border-[#E5EAF0] rounded-[12px] overflow-hidden">
                    <div className="px-4 py-3 bg-[#F7F9FC] border-b border-[#E5EAF0] flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#173B65] flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-[#3978B8]" />
                        <span>Formatting Compatibility Audit (Independent of JD Keywords)</span>
                      </h4>
                      <span className="text-xs font-mono font-semibold text-[#173B65]">
                        {metrics.atsCompatibilityScore}% · {metrics.atsCompatibilityStatus}
                      </span>
                    </div>
                    <div className="divide-y divide-[#E5EAF0]">
                      {metrics.formattingChecks.map((chk, idx) => (
                        <div key={idx} className="px-4 py-2.5 flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-start gap-2 min-w-0">
                            {chk.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-[#182230]">{chk.label}: </span>
                              <span className="text-slate-600">{chk.detail}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-slate-600 shrink-0 tabular-nums">
                            {chk.points}/{chk.maxPoints}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Evidence-Backed Keywords Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#E5EAF0] rounded-[12px] space-y-2.5">
                  <h4 className="text-xs font-bold text-[#173B65] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Matched JD Keywords &amp; Evidence ({analysisReport.matchedKeywords.length})</span>
                  </h4>
                  {analysisReport.matchedKeywords.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No exact keyword matches found yet.</p>
                  ) : (
                    <div className="divide-y divide-[#E5EAF0] max-h-64 overflow-y-auto pr-1">
                      {analysisReport.matchedKeywords.map((k, i) => (
                        <div key={i} className="text-xs py-2.5 space-y-1">
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
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border border-[#E5EAF0] rounded-[12px] space-y-2.5">
                  <h4 className="text-xs font-bold text-[#173B65] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Missing Skills &amp; Evidence ({analysisReport.missingKeywords.length})</span>
                  </h4>
                  {analysisReport.missingKeywords.length === 0 ? (
                    <p className="text-xs text-emerald-700 py-4 text-center">All tracked JD keywords were found in this resume.</p>
                  ) : (
                    <div className="divide-y divide-[#E5EAF0] max-h-64 overflow-y-auto pr-1">
                      {analysisReport.missingKeywords.map((k, i) => (
                        <div key={i} className="text-xs py-2.5 space-y-1">
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
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Explicit No-Guarantee Notice */}
              <div className="flex items-start gap-2.5 p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] text-xs text-slate-600 leading-relaxed">
                <Info className="w-4 h-4 text-[#3978B8] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#173B65]">No ATS Pass Guarantees:</strong> {analysisReport.disclaimer}
                </span>
              </div>

              {/* Recommendations Banner */}
              <div className="p-4 bg-white rounded-[12px] border border-[#E5EAF0] space-y-2">
                <h4 className="text-xs font-bold text-[#173B65] uppercase tracking-wide">
                  Actionable Recommendations
                </h4>
                {analysisReport.improvementRecommendations.length === 0 ? (
                  <p className="text-xs text-slate-500">No additional structural recommendations.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {analysisReport.improvementRecommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#3978B8] shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 4: BEFORE-AND-AFTER REVIEW OR EDITOR & PREVIEW */}
      {currentStep === 4 && optimizedResume && (() => {
        const recomputeReport = (
          prev: ResumeVersion,
          nextData: StructuredResume,
          nextDiffs: DiffItem[]
        ): ATSReport => {
          const candidates: CandidateKeywordInput[] = [
            ...(prev.atsReport?.matchedKeywords || []).map((k) => ({
              keyword: k.keyword,
              category: k.category,
            })),
            ...(prev.atsReport?.missingKeywords || []).map((k) => ({
              keyword: k.keyword,
              category: k.category,
            })),
            ...(prev.identifiedKeywordsToAdd || []).map((k) => ({
              keyword: k.keyword,
              category: 'technical' as const,
            })),
          ];
          return buildDeterministicAtsReport({
            jdText,
            resumeData: nextData,
            candidateKeywords: candidates,
            aiExperienceScore: prev.atsReport?.experienceMatch,
            aiExperienceAssessment: prev.atsReport?.experienceAssessment,
            aiProjectScore: prev.atsReport?.projectRelevance,
            aiProjectAssessment: prev.atsReport?.projectAssessment,
            strongPoints: prev.atsReport?.strongPoints,
            improvementRecommendations: prev.atsReport?.improvementRecommendations,
            baselineScore: prev.atsReport?.originalScore ?? prev.atsReport?.overallScore,
            diffItems: nextDiffs,
          });
        };

        return step4View === 'compare' ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <BeforeAfterCompareView
              originalData={optimizedResume.originalStructuredData}
              currentData={optimizedResume.structuredData}
              diffItems={optimizedResume.diffItems}
              identifiedKeywords={optimizedResume.identifiedKeywordsToAdd}
              leftLabel={`Original CV · ${selectedCv?.title || 'Baseline'}`}
              rightLabel={`Optimized CV · ${optimizedResume.title}`}
              onAcceptRejectDiff={(diffId, action) => {
                setOptimizedResume((prev) => {
                  if (!prev) return null;
                  const target = prev.diffItems.find((d) => d.id === diffId);
                  if (!target) return prev;
                  const nextDiffs = prev.diffItems.map((d) =>
                    d.id === diffId ? { ...d, status: action } : d
                  );
                  const nextData = applyDiffToStructuredResume(
                    prev.structuredData,
                    prev.originalStructuredData,
                    target,
                    action
                  );
                  return {
                    ...prev,
                    structuredData: nextData,
                    latexSource: generateLatexFromStructured(nextData),
                    diffItems: nextDiffs,
                    atsReport: recomputeReport(prev, nextData, nextDiffs),
                    updatedAt: new Date().toISOString(),
                  };
                });
              }}
              onAcceptAll={() => {
                setOptimizedResume((prev) => {
                  if (!prev) return null;
                  const { nextData, nextDiffs } = applyAllDiffsToResume(
                    prev.structuredData,
                    prev.originalStructuredData,
                    prev.diffItems,
                    'accepted'
                  );
                  return {
                    ...prev,
                    structuredData: nextData,
                    latexSource: generateLatexFromStructured(nextData),
                    diffItems: nextDiffs,
                    atsReport: recomputeReport(prev, nextData, nextDiffs),
                    updatedAt: new Date().toISOString(),
                  };
                });
              }}
              onRejectAll={() => {
                setOptimizedResume((prev) => {
                  if (!prev) return null;
                  const { nextData, nextDiffs } = applyAllDiffsToResume(
                    prev.structuredData,
                    prev.originalStructuredData,
                    prev.diffItems,
                    'rejected'
                  );
                  return {
                    ...prev,
                    structuredData: nextData,
                    latexSource: generateLatexFromStructured(nextData),
                    diffItems: nextDiffs,
                    atsReport: recomputeReport(prev, nextData, nextDiffs),
                    updatedAt: new Date().toISOString(),
                  };
                });
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 lg:overflow-hidden">
            {/* Mobile & Tablet Pane Switcher (< lg) */}
            <div className="lg:hidden bg-[#F7F9FC] border-b border-[#E5EAF0] px-3 py-2 shrink-0">
              <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-[#E5EAF0] rounded-[10px]">
                <button
                  type="button"
                  onClick={() => setStep4MobilePane('editor')}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    step4MobilePane === 'editor'
                      ? 'bg-[#173B65] text-white'
                      : 'text-slate-600 hover:text-[#173B65]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit &amp; Rewrites</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep4MobilePane('preview')}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    step4MobilePane === 'preview'
                      ? 'bg-[#173B65] text-white'
                      : 'text-slate-600 hover:text-[#173B65]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live A4 Preview</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden">
              {/* LEFT SIDE: Editor & Diff Studio */}
              <div
                className={`w-full lg:w-1/2 lg:h-full lg:overflow-hidden ${
                  step4MobilePane === 'editor' ? 'flex-1 min-h-0' : 'hidden lg:block'
                }`}
              >
                <EditorPanel
                  data={optimizedResume.structuredData}
                  originalData={optimizedResume.originalStructuredData}
                  diffItems={optimizedResume.diffItems}
                  identifiedKeywords={optimizedResume.identifiedKeywordsToAdd}
                  onUpdateData={(newData) => {
                    const newLatex = generateLatexFromStructured(newData);
                    setOptimizedResume((prev) =>
                      prev
                        ? {
                            ...prev,
                            structuredData: newData,
                            latexSource: newLatex,
                            atsReport: recomputeReport(prev, newData, prev.diffItems),
                            updatedAt: new Date().toISOString(),
                          }
                        : null
                    );
                  }}
                  onUpdateDiffItems={(newDiffs) => {
                    setOptimizedResume((prev) =>
                      prev
                        ? {
                            ...prev,
                            diffItems: newDiffs,
                          }
                        : null
                    );
                  }}
                  onApplyDataAndDiffs={(newData, newDiffs) => {
                    const newLatex = generateLatexFromStructured(newData);
                    setOptimizedResume((prev) =>
                      prev
                        ? {
                            ...prev,
                            structuredData: newData,
                            latexSource: newLatex,
                            diffItems: newDiffs,
                            atsReport: recomputeReport(prev, newData, newDiffs),
                            updatedAt: new Date().toISOString(),
                          }
                        : null
                    );
                  }}
                  onRestoreOriginal={() => {
                    setOptimizedResume((prev) => {
                      if (!prev) return null;
                      const rejectedDiffs = prev.diffItems.map((d) => ({ ...d, status: 'rejected' as const }));
                      return {
                        ...prev,
                        structuredData: prev.originalStructuredData,
                        latexSource: prev.originalLatex,
                        diffItems: rejectedDiffs,
                        atsReport: recomputeReport(prev, prev.originalStructuredData, rejectedDiffs),
                      };
                    });
                  }}
                  onAddKeywordToSkills={(keyword, cat) => {
                    setOptimizedResume((prev) => {
                      if (!prev) return null;
                      const skills = [...prev.structuredData.skills];
                      const targetCat =
                        skills.find((s) =>
                          s.category.toLowerCase().includes((cat || '').toLowerCase())
                        ) || skills[0];

                      if (
                        targetCat &&
                        !targetCat.items.some((it) => it.toLowerCase() === keyword.toLowerCase())
                      ) {
                        targetCat.items = [keyword, ...targetCat.items];
                      }

                      const updatedData = { ...prev.structuredData, skills };
                      const newLatex = generateLatexFromStructured(updatedData);
                      return {
                        ...prev,
                        structuredData: updatedData,
                        latexSource: newLatex,
                        atsReport: recomputeReport(prev, updatedData, prev.diffItems),
                        updatedAt: new Date().toISOString(),
                      };
                    });
                  }}
                  onOpenBeforeAfterCompare={() => setStep4View('compare')}
                  jdText={jdText}
                />
              </div>

              {/* RIGHT SIDE: Live A4 Resume Preview */}
              <div
                className={`w-full lg:w-1/2 lg:h-full lg:overflow-hidden ${
                  step4MobilePane === 'preview' ? 'flex-1 min-h-[540px]' : 'hidden lg:block'
                }`}
              >
                <ResumePreviewA4
                  data={optimizedResume.structuredData}
                  targetRole={optimizedResume.targetRole}
                  onRequireAuth={onRequireAuth}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
