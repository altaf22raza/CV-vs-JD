import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Upload, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Download, 
  Copy, 
  Clock, 
  Loader2,
  Building2,
  Briefcase
} from 'lucide-react';
import { ResumeVersion, StructuredResume, DiffItem, ATSReport, IdentifiedKeyword } from '../types/resume';
import { RESUME_TEMPLATES } from '../data/templates';
import { SAMPLE_JOB_DESCRIPTIONS } from '../data/defaultResume';
import { ResumePreviewA4 } from './ResumePreviewA4';
import { EditorPanel } from './EditorPanel';
import { apiAnalyzeJd, apiOptimizeResume } from '../services/geminiClient';
import { generateLatexFromStructured } from '../utils/latexParser';
import { exportResumeToPdf } from '../utils/pdfExport';
import { useAuth } from '../firebase/AuthContext';

interface OptimizeWorkflowProps {
  savedVersions: ResumeVersion[];
  onSaveOptimizedCv: (newVersion: ResumeVersion) => void;
  onCompareVersions: (verA: ResumeVersion, verB: ResumeVersion) => void;
  onCancel: () => void;
  onRequireAuth?: (title: string, proceed: () => void) => void;
}

export const OptimizeWorkflow: React.FC<OptimizeWorkflowProps> = ({
  savedVersions,
  onSaveOptimizedCv,
  onCompareVersions,
  onCancel,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  // Steps: 1 (select CV) -> 2 (enter JD) -> 3 (analysis report) -> 4 (preview & review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected CV from library
  const [selectedCv, setSelectedCv] = useState<ResumeVersion | null>(savedVersions[0] || null);

  // JD Inputs
  const [jobTitle, setJobTitle] = useState<string>('Associate Product Manager');
  const [companyName, setCompanyName] = useState<string>('Razorpay');
  const [jdText, setJdText] = useState<string>(SAMPLE_JOB_DESCRIPTIONS[0].text);

  // AI Analysis Results
  const [analysisReport, setAnalysisReport] = useState<ATSReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Generated Optimized CV State
  const [optimizedResume, setOptimizedResume] = useState<ResumeVersion | null>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Handle Step 1: Select CV
  const handleSelectCv = (cv: ResumeVersion) => {
    setSelectedCv(cv);
    setCurrentStep(2);
  };

  // Handle Step 2: Upload JD text file
  const handleJdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setJdText(content);
    };
    reader.readAsText(file);
  };

  // Handle Step 3: Run AI Analysis
  const handleRunAnalysis = async () => {
    if (!selectedCv || !jdText.trim()) return;
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
      alert(`Analysis Failed: ${err?.message || 'Failed to reach AI analysis engine'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Step 4: Generate Optimized CV
  const handleGenerateOptimized = async () => {
    if (!selectedCv || !jdText.trim()) return;
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

      const newLatex = generateLatexFromStructured(res.optimizedData);
      const newVersion: ResumeVersion = {
        id: `opt-${Date.now()}`,
        title: companyName ? `${jobTitle} (${companyName})` : `${jobTitle} (Optimized)`,
        targetRole: jobTitle || selectedCv.targetRole,
        companyName,
        cvType: 'optimized',
        templateId: selectedCv.templateId || 'template-pm',
        latexSource: newLatex,
        originalLatex: selectedCv.latexSource,
        structuredData: res.optimizedData,
        originalStructuredData: selectedCv.structuredData,
        diffItems: res.diffItems,
        identifiedKeywordsToAdd: res.identifiedKeywordsToAdd,
        atsReport: {
          ...(analysisReport || selectedCv.atsReport || {} as ATSReport),
          overallScore: res.optimizedScore,
          originalScore: analysisReport?.overallScore || selectedCv.atsReport?.overallScore || 75,
          keywordMatch: Math.min(96, (analysisReport?.keywordMatch || 70) + 18),
        },
        jdText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOriginal: false,
      };

      setOptimizedResume(newVersion);
      setCurrentStep(4);
    } catch (err: any) {
      alert(`Optimization Failed: ${err?.message || 'Failed to optimize resume'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Save as new CV in library
  const handleSaveAsNewCv = () => {
    if (!optimizedResume) return;
    onSaveOptimizedCv(optimizedResume);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#F5F7FA]">
      {/* Top Workflow Stepper Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Cancel"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-[#1F2A44]">
              Optimize CV for Target Job Description
            </h1>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span className={currentStep === 1 ? 'font-bold text-blue-600' : 'text-slate-500'}>1. Select CV</span>
              <span>→</span>
              <span className={currentStep === 2 ? 'font-bold text-blue-600' : 'text-slate-500'}>2. Input JD</span>
              <span>→</span>
              <span className={currentStep === 3 ? 'font-bold text-blue-600' : 'text-slate-500'}>3. Compatibility Analysis</span>
              <span>→</span>
              <span className={currentStep === 4 ? 'font-bold text-blue-600' : 'text-slate-500'}>4. Review &amp; Save</span>
            </div>
          </div>
        </div>

        {currentStep === 4 && optimizedResume && selectedCv && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCompareVersions(selectedCv, optimizedResume)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs"
            >
              Compare
            </button>
            <button
              onClick={() => {
                const doDownload = async () => {
                  await exportResumeToPdf('resume-a4-document', `${optimizedResume.title.replace(/\s+/g, '_')}.pdf`);
                };
                if (!user) {
                  if (onRequireAuth) {
                    onRequireAuth('Sign In to Download Your Optimized Resume', doDownload);
                  }
                  return;
                }
                doDownload();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleSaveAsNewCv}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs"
            >
              {savedNotice ? 'Saved as New CV!' : 'Save as New CV'}
            </button>
          </div>
        )}
      </div>

      {/* STEP 1: SELECT AVAILABLE CV */}
      {currentStep === 1 && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-bold text-[#1F2A44]">
              Step 1: Select a CV to Optimize
            </h2>
            <p className="text-xs text-slate-500">
              Select any CV currently saved in your account library. You do not need to re-upload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedVersions.map((cv) => {
              const isSelected = selectedCv?.id === cv.id;
              return (
                <div
                  key={cv.id}
                  onClick={() => handleSelectCv(cv)}
                  className={`p-5 rounded-xl border-2 bg-white cursor-pointer transition-all flex flex-col justify-between shadow-xs hover:border-blue-500 hover:shadow-md active:scale-[0.99] group ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'
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
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cv.cvType || 'Master'}
                      </span>
                      {cv.atsReport && (
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          {cv.atsReport.overallScore}% ATS
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#1F2A44] leading-snug group-hover:text-blue-600 transition-colors">
                      {cv.title}
                    </h3>
                    <p className="text-xs text-slate-600 truncate">{cv.targetRole}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(cv.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="px-3 py-1 text-xs font-semibold text-blue-600 group-hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Select CV</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: ENTER TARGET JOB DESCRIPTION */}
      {currentStep === 2 && (
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-600">Step 2 of 4</span>
              <h2 className="text-xl font-bold text-[#1F2A44]">
                Enter Target Job Description
              </h2>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Change Selected CV
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Job Title</label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={jobTitle}
                    placeholder="e.g. Associate Product Manager"
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name (Optional)</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    placeholder="e.g. Razorpay, Swiggy, Stripe"
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick sample pickers */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <span>Quick Samples:</span>
              <button
                type="button"
                onClick={() => {
                  setJobTitle('Associate Product Manager (AI & Data)');
                  setCompanyName('Razorpay');
                  setJdText(SAMPLE_JOB_DESCRIPTIONS[0].text);
                }}
                className="text-blue-600 hover:underline font-medium text-[11px]"
              >
                Razorpay APM
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setJobTitle('AI Product Manager');
                  setCompanyName('Swiggy');
                  setJdText(SAMPLE_JOB_DESCRIPTIONS[1].text);
                }}
                className="text-blue-600 hover:underline font-medium text-[11px]"
              >
                Swiggy AI PM
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setJobTitle('Technical Product Manager');
                  setCompanyName('Microsoft');
                  setJdText(SAMPLE_JOB_DESCRIPTIONS[2].text);
                }}
                className="text-blue-600 hover:underline font-medium text-[11px]"
              >
                Microsoft TPM
              </button>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Paste Full Job Description</label>
                <label className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
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
                className="w-full text-xs p-3.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {isAnalyzing ? (
                  <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {processingStatus}
                  </span>
                ) : (
                  'Selected CV: ' + selectedCv?.title
                )}
              </span>

              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !jdText.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze JD &amp; Compatibility</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AI-POWERED ANALYSIS REPORT */}
      {currentStep === 3 && analysisReport && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-600">Step 3 of 4</span>
              <h2 className="text-xl font-bold text-[#1F2A44]">
                CV vs JD Compatibility Report
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ← Back to JD
              </button>
              <button
                onClick={handleGenerateOptimized}
                disabled={isOptimizing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
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

          {/* Scores Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#1F2A44] text-white rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Overall Match</span>
              <div className="text-3xl font-extrabold font-mono tabular-nums mt-1">
                {analysisReport.overallScore}%
              </div>
              <div className="text-[11px] text-emerald-300 mt-2 font-medium">
                Baseline fit against target JD
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Technical Skills</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {analysisReport.technicalSkillsMatch}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${analysisReport.technicalSkillsMatch}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Experience &amp; Role</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {analysisReport.experienceMatch}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${analysisReport.experienceMatch}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">ATS Keywords Match</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {analysisReport.keywordMatch}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${analysisReport.keywordMatch}%` }}></div>
              </div>
            </div>
          </div>

          {/* Keywords Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Existing Matching Skills ({analysisReport.matchedKeywords.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {analysisReport.matchedKeywords.map((k, i) => (
                  <div key={i} className="text-xs bg-white p-2 rounded border border-emerald-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{k.keyword}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">{k.category}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Missing High-Impact ATS Keywords ({analysisReport.missingKeywords.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {analysisReport.missingKeywords.map((k, i) => (
                  <div key={i} className="text-xs bg-white p-2 rounded border border-amber-100 flex justify-between items-center">
                    <span className="font-medium text-slate-700">{k.keyword}</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">{k.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations Banner */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
              Actionable AI Recommendations
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {analysisReport.improvementRecommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* STEP 4 & 5: UPDATED CV PREVIEW & DIFF STUDIO */}
      {currentStep === 4 && optimizedResume && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT SIDE: Editor & Diff Studio */}
          <div className="w-full lg:w-1/2 h-[50vh] lg:h-full overflow-hidden">
            <EditorPanel
              data={optimizedResume.structuredData}
              originalData={optimizedResume.originalStructuredData}
              diffItems={optimizedResume.diffItems}
              identifiedKeywords={optimizedResume.identifiedKeywordsToAdd}
              onUpdateData={(newData) => {
                const newLatex = generateLatexFromStructured(newData);
                setOptimizedResume(prev => prev ? ({
                  ...prev,
                  structuredData: newData,
                  latexSource: newLatex,
                  updatedAt: new Date().toISOString(),
                }) : null);
              }}
              onUpdateDiffItems={(newDiffs) => {
                setOptimizedResume(prev => prev ? ({
                  ...prev,
                  diffItems: newDiffs,
                }) : null);
              }}
              onRestoreOriginal={() => {
                setOptimizedResume(prev => prev ? ({
                  ...prev,
                  structuredData: prev.originalStructuredData,
                  latexSource: prev.originalLatex,
                  diffItems: prev.diffItems.map(d => ({ ...d, status: 'rejected' })),
                }) : null);
              }}
              onAddKeywordToSkills={(keyword, cat) => {
                setOptimizedResume(prev => {
                  if (!prev) return null;
                  const skills = [...prev.structuredData.skills];
                  let targetCat = skills.find(s => 
                    s.category.toLowerCase().includes((cat || '').toLowerCase())
                  ) || skills[0];

                  if (targetCat && !targetCat.items.some(it => it.toLowerCase() === keyword.toLowerCase())) {
                    targetCat.items = [keyword, ...targetCat.items];
                  }

                  const updatedData = { ...prev.structuredData, skills };
                  const newLatex = generateLatexFromStructured(updatedData);
                  return {
                    ...prev,
                    structuredData: updatedData,
                    latexSource: newLatex,
                    updatedAt: new Date().toISOString(),
                  };
                });
              }}
              jdText={jdText}
            />
          </div>

          {/* RIGHT SIDE: Live A4 Resume Preview */}
          <div className="w-full lg:w-1/2 h-[50vh] lg:h-full overflow-hidden">
            <ResumePreviewA4
              data={optimizedResume.structuredData}
              targetRole={optimizedResume.targetRole}
              onRequireAuth={onRequireAuth}
            />
          </div>
        </div>
      )}
    </div>
  );
};
