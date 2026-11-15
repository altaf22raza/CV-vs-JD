import React, { useState, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  MessageSquare,
  Globe,
  Sparkles,
  Copy,
  Check,
  Download,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  ResumeVersion,
  SavedJobDescription,
  CoverLetterResult,
  LinkedInOptimizationResult,
  InterviewQuestion,
  StructuredResume,
  SupportedLanguage,
} from '../types/resume';
import {
  apiGenerateCoverLetter,
  apiOptimizeLinkedIn,
  apiGenerateInterviewPrep,
  apiTranslateResume,
} from '../services/geminiClient';
import { downloadTextFile } from '../utils/pdfExport';
import { exportCoverLetterToDocx, exportResumeToDocx } from '../utils/docxExport';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../firebase/AuthContext';
import {
  DocumentTextSkeleton,
  CardListSkeleton,
  OptimizationDiffSkeleton,
} from './SkeletonLoaders';

export type CareerToolTab = 'cover-letter' | 'linkedin' | 'interview' | 'translate';

interface CareerToolsViewProps {
  versions: ResumeVersion[];
  activeVersion: ResumeVersion;
  savedJds: SavedJobDescription[];
  initialTab?: CareerToolTab;
  initialContext?: {
    role?: string;
    company?: string;
    jdText?: string;
    resumeVersionId?: string;
  } | null;
  onSaveTranslatedVersion: (
    sourceVersion: ResumeVersion,
    translatedData: StructuredResume,
    lang: SupportedLanguage
  ) => void;
  onRequireAuth?: (title: string, proceed: () => void) => void;
}

export const CareerToolsView: React.FC<CareerToolsViewProps> = ({
  versions,
  activeVersion,
  savedJds,
  initialTab = 'cover-letter',
  initialContext,
  onSaveTranslatedVersion,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const { language: uiLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<CareerToolTab>(initialTab);
  const [selectedCvId, setSelectedCvId] = useState<string>(
    initialContext?.resumeVersionId || activeVersion.id
  );
  const [selectedJdId, setSelectedJdId] = useState<string>(savedJds[0]?.id || 'custom');
  const [targetRole, setTargetRole] = useState<string>(
    initialContext?.role || savedJds[0]?.role || activeVersion.targetRole
  );
  const [companyName, setCompanyName] = useState<string>(
    initialContext?.company || savedJds[0]?.company || activeVersion.companyName || ''
  );
  const [jdText, setJdText] = useState<string>(
    initialContext?.jdText || activeVersion.jdText || savedJds[0]?.text || ''
  );
  const [outputLanguage, setOutputLanguage] = useState<SupportedLanguage>(uiLanguage);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync if launched from Application Tracker
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!initialContext) return;
    if (initialContext.resumeVersionId) setSelectedCvId(initialContext.resumeVersionId);
    if (initialContext.role) setTargetRole(initialContext.role);
    if (initialContext.company) setCompanyName(initialContext.company);
    if (initialContext.jdText) setJdText(initialContext.jdText);
  }, [initialContext]);

  const selectedCv = versions.find((v) => v.id === selectedCvId) || activeVersion;

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  // --- Cover Letter State ---
  const [tone, setTone] = useState<'Executive' | 'Concise' | 'Technical' | 'Storytelling'>('Executive');
  const [isGeneratingCl, setIsGeneratingCl] = useState<boolean>(false);
  const [coverLetter, setCoverLetter] = useState<CoverLetterResult | null>(null);
  const [editableClText, setEditableClText] = useState<string>('');

  const executeGenerateCoverLetter = async () => {
    if (!jdText.trim()) {
      setErrorMsg('Please select a saved JD or paste a target job description first.');
      return;
    }
    setErrorMsg(null);
    setIsGeneratingCl(true);
    try {
      const res = await apiGenerateCoverLetter({
        resumeData: selectedCv.structuredData,
        jdText,
        options: {
          targetRole,
          companyName,
          tone,
          language: outputLanguage,
        },
      });
      setCoverLetter(res);
      setEditableClText(res.fullText);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate cover letter.');
    } finally {
      setIsGeneratingCl(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jdText.trim()) {
      setErrorMsg('Please select a saved JD or paste a target job description first.');
      return;
    }
    if (!user && onRequireAuth) {
      onRequireAuth('Sign In to Generate Cover Letter', () => {
        void executeGenerateCoverLetter();
      });
      return;
    }
    await executeGenerateCoverLetter();
  };

  // --- LinkedIn State ---
  const [isGeneratingLi, setIsGeneratingLi] = useState<boolean>(false);
  const [linkedInResult, setLinkedInResult] = useState<LinkedInOptimizationResult | null>(null);

  const executeOptimizeLinkedIn = async () => {
    setErrorMsg(null);
    setIsGeneratingLi(true);
    try {
      const res = await apiOptimizeLinkedIn({
        resumeData: selectedCv.structuredData,
        jdText: jdText.trim() || undefined,
        targetRole,
        language: outputLanguage,
      });
      setLinkedInResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to optimize LinkedIn profile.');
    } finally {
      setIsGeneratingLi(false);
    }
  };

  const handleOptimizeLinkedIn = async () => {
    if (!user && onRequireAuth) {
      onRequireAuth('Sign In to Optimize LinkedIn Profile', () => {
        void executeOptimizeLinkedIn();
      });
      return;
    }
    await executeOptimizeLinkedIn();
  };

  // --- Interview Prep State ---
  const [isGeneratingIq, setIsGeneratingIq] = useState<boolean>(false);
  const [prepSummary, setPrepSummary] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [practicedIds, setPracticedIds] = useState<Record<string, boolean>>({});
  const [practiceNotes, setPracticeNotes] = useState<Record<string, string>>({});
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({});

  const executeGenerateInterview = async () => {
    if (!jdText.trim()) {
      setErrorMsg('Please select a saved JD or paste a job description to generate targeted interview questions.');
      return;
    }
    setErrorMsg(null);
    setIsGeneratingIq(true);
    try {
      const res = await apiGenerateInterviewPrep({
        resumeData: selectedCv.structuredData,
        jdText,
        targetRole,
        companyName,
        language: outputLanguage,
      });
      setPrepSummary(res.prepFocusSummary);
      setQuestions(res.questions);
      const initialExpanded: Record<string, boolean> = {};
      res.questions.slice(0, 2).forEach((q) => {
        initialExpanded[q.id] = true;
      });
      setExpandedQ(initialExpanded);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate interview questions.');
    } finally {
      setIsGeneratingIq(false);
    }
  };

  const handleGenerateInterview = async () => {
    if (!jdText.trim()) {
      setErrorMsg('Please select a saved JD or paste a job description to generate targeted interview questions.');
      return;
    }
    if (!user && onRequireAuth) {
      onRequireAuth('Sign In to Generate Interview Prep', () => {
        void executeGenerateInterview();
      });
      return;
    }
    await executeGenerateInterview();
  };

  // --- Translate CV State ---
  const [translateTargetLang, setTranslateTargetLang] = useState<SupportedLanguage>('es');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedPreview, setTranslatedPreview] = useState<StructuredResume | null>(null);
  const [savedTranslationNotice, setSavedTranslationNotice] = useState<boolean>(false);

  const executeTranslateCv = async () => {
    setErrorMsg(null);
    setIsTranslating(true);
    setSavedTranslationNotice(false);
    try {
      const res = await apiTranslateResume({
        resumeData: selectedCv.structuredData,
        targetLanguage: translateTargetLang,
      });
      setTranslatedPreview(res.translatedData);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to translate resume.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateCv = async () => {
    if (!user && onRequireAuth) {
      onRequireAuth('Sign In to Translate Resume', () => {
        void executeTranslateCv();
      });
      return;
    }
    await executeTranslateCv();
  };

  const filteredQuestions =
    categoryFilter === 'All'
      ? questions
      : questions.filter((q) => q.category === categoryFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 w-full text-[#182230]">
      {/* Header & Tool Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E5EAF0]">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#3978B8]">
            Career Preparation Suite
          </p>
          <h1 className="text-2xl font-bold text-[#173B65] tracking-tight mt-0.5">
            Cover Letters, LinkedIn, Interview Prep &amp; Localization
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate tailored application assets grounded strictly in your selected resume and target job description.
          </p>
        </div>

        {/* Segmented Navigation Tabs (horizontally swipeable on narrow mobile, wraps cleanly on sm+) */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-[12px] border border-[#E5EAF0] overflow-x-auto no-scrollbar max-w-full sm:flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cover-letter')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cover-letter'
                ? 'bg-[#173B65] text-white'
                : 'text-slate-600 hover:text-[#173B65] hover:bg-[#F7F9FC]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cover Letter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('linkedin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'linkedin'
                ? 'bg-[#173B65] text-white'
                : 'text-slate-600 hover:text-[#173B65] hover:bg-[#F7F9FC]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>LinkedIn Optimizer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'interview'
                ? 'bg-[#173B65] text-white'
                : 'text-slate-600 hover:text-[#173B65] hover:bg-[#F7F9FC]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Interview Questions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('translate')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'translate'
                ? 'bg-[#173B65] text-white'
                : 'text-slate-600 hover:text-[#173B65] hover:bg-[#F7F9FC]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Translate CV</span>
          </button>
        </div>
      </div>

      {/* Shared Context Bar: Resume + JD + Language */}
      <section className="bg-white border border-[#E5EAF0] rounded-[14px] p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#182230] mb-1">
              Source Resume Version
            </label>
            <select
              value={selectedCv.id}
              onChange={(e) => setSelectedCvId(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-[#E5EAF0] rounded-[10px] bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({v.targetRole})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182230] mb-1">
              Load Saved Job Description
            </label>
            <select
              value={selectedJdId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedJdId(val);
                const found = savedJds.find((j) => j.id === val);
                if (found) {
                  setTargetRole(found.role);
                  setCompanyName(found.company);
                  setJdText(found.text);
                }
              }}
              className="w-full text-xs px-2.5 py-2 border border-[#E5EAF0] rounded-[10px] bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
            >
              <option value="custom">Custom Job Description</option>
              {savedJds.map((jd) => (
                <option key={jd.id} value={jd.id}>
                  {jd.role} · {jd.company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182230] mb-1">
              Target Role &amp; Company
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Role title"
                className="w-full text-xs px-2.5 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company"
                className="w-full text-xs px-2.5 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182230] mb-1">
              Output Language
            </label>
            <select
              value={activeTab === 'translate' ? translateTargetLang : outputLanguage}
              onChange={(e) => {
                const lang = e.target.value as SupportedLanguage;
                if (activeTab === 'translate') {
                  setTranslateTargetLang(lang);
                } else {
                  setOutputLanguage(lang);
                }
              }}
              className="w-full text-xs px-2.5 py-2 border border-[#E5EAF0] rounded-[10px] bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.nativeLabel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTab !== 'translate' && (
          <div>
            <label className="block text-xs font-semibold text-[#182230] mb-1">
              Target Job Description {activeTab === 'linkedin' ? '(Optional for LinkedIn)' : ''}
            </label>
            <textarea
              rows={3}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the target job description here..."
              className="w-full text-xs p-3 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
            />
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* TAB 1: COVER LETTER GENERATOR                                     */}
      {/* ================================================================= */}
      {activeTab === 'cover-letter' && (
        <section className="bg-white border border-[#E5EAF0] rounded-[14px] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
            <div>
              <h2 className="text-base font-bold text-[#173B65]">
                Tailored Cover Letter Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Drafts a factual, role-aligned cover letter you can edit, copy, or export to DOCX and TXT.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap max-w-full">
              <div className="flex items-center gap-1 bg-[#F7F9FC] p-1 rounded-[10px] border border-[#E5EAF0] overflow-x-auto no-scrollbar max-w-full sm:flex-wrap">
                {(['Executive', 'Concise', 'Technical', 'Storytelling'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-[8px] transition-colors whitespace-nowrap shrink-0 ${
                      tone === t
                        ? 'bg-[#173B65] text-white'
                        : 'text-slate-600 hover:text-[#173B65]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateCoverLetter}
                disabled={isGeneratingCl}
                className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {isGeneratingCl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Drafting Cover Letter...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Cover Letter</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isGeneratingCl ? (
            <DocumentTextSkeleton
              lines={10}
              statusText="Analyzing target job requirements & drafting tailored cover letter..."
            />
          ) : !coverLetter ? (
            <div className="py-12 px-4 text-center space-y-2 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
              <FileText className="w-8 h-8 text-[#3978B8] mx-auto" />
              <div className="text-sm font-semibold text-[#173B65]">
                Ready to draft for {targetRole}{companyName ? ` at ${companyName}` : ''}
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &quot;Generate Cover Letter&quot; to connect verified projects and measurable outcomes from {selectedCv.title} to the job requirements.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-[#173B65]">Subject:</span> {coverLetter.subject}
                  {coverLetter.keyThemesMatched.length > 0 && (
                    <>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="text-[#3978B8] font-medium">
                        Themes: {coverLetter.keyThemesMatched.join(', ')}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy('cl-body', editableClText)}
                    className="btn-interactive px-3 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5"
                  >
                    {copiedKey === 'cl-body' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#3978B8]" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        editableClText,
                        `${(selectedCv.structuredData.name || 'Candidate').replace(/\s+/g, '_')}_Cover_Letter.txt`
                      )
                    }
                    className="btn-interactive px-3 py-1.5 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px]"
                  >
                    TXT
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      exportCoverLetterToDocx(
                        editableClText,
                        selectedCv.structuredData.name,
                        targetRole,
                        companyName
                      )
                    }
                    className="btn-interactive px-3 py-1.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download DOCX</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={15}
                value={editableClText}
                onChange={(e) => setEditableClText(e.target.value)}
                className="w-full text-sm text-[#182230] leading-relaxed p-5 border border-[#E5EAF0] rounded-[12px] focus:border-[#3978B8] focus:outline-none bg-[#F7F9FC]/60 font-sans"
              />
            </div>
          )}
        </section>
      )}

      {/* ================================================================= */}
      {/* TAB 2: LINKEDIN PROFILE OPTIMIZER                                 */}
      {/* ================================================================= */}
      {activeTab === 'linkedin' && (
        <section className="bg-white border border-[#E5EAF0] rounded-[14px] p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
            <div>
              <h2 className="text-base font-bold text-[#173B65]">
                LinkedIn Profile Optimization
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate recruiter-searchable headlines, a first-person About narrative, and scannable experience bullets.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOptimizeLinkedIn}
              disabled={isGeneratingLi}
              className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
            >
              {isGeneratingLi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Optimizing Profile...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize LinkedIn Profile</span>
                </>
              )}
            </button>
          </div>

          {isGeneratingLi ? (
            <CardListSkeleton
              cards={3}
              statusText="Extracting career highlights & recruiter-searchable keywords..."
            />
          ) : !linkedInResult ? (
            <div className="py-12 px-4 text-center space-y-2 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
              <Briefcase className="w-8 h-8 text-[#3978B8] mx-auto" />
              <div className="text-sm font-semibold text-[#173B65]">
                Ready to tailor your LinkedIn presence
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &quot;Optimize LinkedIn Profile&quot; to transform {selectedCv.title} into high-visibility LinkedIn copy.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Headlines */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Headline Options (Under 220 Characters)
                </h3>
                <div className="space-y-2">
                  {linkedInResult.headlines.map((hl, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[12px] border border-[#E5EAF0] bg-[#F7F9FC] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-semibold text-[#182230] break-words">{hl}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          Option {idx + 1} · {hl.length}/220 chars
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`li-hl-${idx}`, hl)}
                        className="btn-interactive px-2.5 py-1 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        {copiedKey === `li-hl-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#3978B8]" />
                        )}
                        <span>{copiedKey === `li-hl-${idx}` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    About / Bio Section
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy('li-about', linkedInResult.aboutSection)}
                    className="btn-interactive px-2.5 py-1 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] flex items-center gap-1"
                  >
                    {copiedKey === 'li-about' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#3978B8]" />
                    )}
                    <span>{copiedKey === 'li-about' ? 'Copied' : 'Copy About'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-[12px] border border-[#E5EAF0] bg-white text-xs text-[#182230] leading-relaxed whitespace-pre-line">
                  {linkedInResult.aboutSection}
                </div>
              </div>

              {/* Experience Highlights & Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Experience Highlights
                  </h3>
                  {linkedInResult.experienceHighlights.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-[12px] border border-[#E5EAF0] bg-white space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-[#173B65]">
                          {exp.role} · {exp.company}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `li-exp-${idx}`,
                              exp.bullets.map((b) => `• ${b}`).join('\n')
                            )
                          }
                          className="text-[11px] font-semibold text-[#3978B8] hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedKey === `li-exp-${idx}` ? 'Copied' : 'Copy bullets'}</span>
                        </button>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <div className="p-4 rounded-[12px] border border-[#E5EAF0] bg-[#F7F9FC] space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Top Skills to Pin
                    </h3>
                    <div className="text-xs text-[#182230] leading-relaxed">
                      {linkedInResult.topSkillsToPin.join(' · ')}
                    </div>
                  </div>
                  <div className="p-4 rounded-[12px] border border-[#E5EAF0] bg-[#F7F9FC] space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Recruiter Search Keywords
                    </h3>
                    <div className="text-xs text-[#173B65] font-medium leading-relaxed">
                      {linkedInResult.profileKeywords.join(' · ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ================================================================= */}
      {/* TAB 3: INTERVIEW QUESTIONS BASED ON JD                            */}
      {/* ================================================================= */}
      {activeTab === 'interview' && (
        <section className="bg-white border border-[#E5EAF0] rounded-[14px] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
            <div>
              <h2 className="text-base font-bold text-[#173B65]">
                JD-Grounded Interview Question Bank
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted technical, behavioral, product, and resume probe questions tailored to your actual history.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateInterview}
              disabled={isGeneratingIq}
              className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
            >
              {isGeneratingIq ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Interview Prep</span>
                </>
              )}
            </button>
          </div>

          {isGeneratingIq ? (
            <CardListSkeleton
              cards={4}
              statusText="Generating JD-grounded interview questions & STAR outlines..."
            />
          ) : questions.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
              <MessageSquare className="w-8 h-8 text-[#3978B8] mx-auto" />
              <div className="text-sm font-semibold text-[#173B65]">
                Generate role-specific interview questions
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Compare {selectedCv.title} against the target job description to predict likely interviewer questions and build STAR talking points.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prepSummary && (
                <div className="p-4 rounded-[12px] bg-[#F7F9FC] border border-[#E5EAF0] text-xs text-slate-700 leading-relaxed">
                  <strong className="text-[#173B65]">Interviewer Focus:</strong> {prepSummary}
                </div>
              )}

              {/* Category Filter */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 p-1 bg-[#F7F9FC] rounded-[10px] border border-[#E5EAF0] overflow-x-auto no-scrollbar max-w-full sm:flex-wrap">
                  {['All', 'Technical & Domain', 'Behavioral (STAR)', 'Product & Case', 'Resume Deep-Dive'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-[8px] transition-colors whitespace-nowrap shrink-0 ${
                        categoryFilter === cat
                          ? 'bg-[#173B65] text-white font-semibold'
                          : 'text-slate-600 hover:text-[#173B65]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {Object.values(practicedIds).filter(Boolean).length} of {questions.length} practiced
                </span>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
                  No questions match the selected category filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((q) => {
                    const isOpen = !!expandedQ[q.id];
                    const isPracticed = !!practicedIds[q.id];
                    return (
                      <div
                        key={q.id}
                        className={`card-interactive border rounded-[12px] transition-colors ${
                          isPracticed
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-[#E5EAF0] bg-white'
                        }`}
                      >
                        <div
                          onClick={() =>
                            setExpandedQ((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                          }
                          className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#173B65]">{q.category}</span>
                              <span>·</span>
                              <span>{q.difficulty}</span>
                              {q.resumeAnchor && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#3978B8] font-medium">Anchor: {q.resumeAnchor}</span>
                                </>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-[#182230] leading-snug">
                              {q.question}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPracticedIds((prev) => ({
                                  ...prev,
                                  [q.id]: !prev[q.id],
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                                isPracticed
                                  ? 'bg-[#173B65] text-white border-[#173B65]'
                                  : 'bg-white text-slate-600 border-[#E5EAF0] hover:bg-[#F7F9FC]'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isPracticed ? 'Practiced' : 'Mark Practiced'}</span>
                            </button>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="px-4 pb-4 pt-3 border-t border-[#E5EAF0] space-y-3 text-xs">
                            <div>
                              <span className="font-semibold text-[#173B65]">Why this is asked: </span>
                              <span className="text-slate-600">{q.whyAsked}</span>
                            </div>
                            <div className="p-3 rounded-[10px] bg-[#F7F9FC] border border-[#E5EAF0] text-slate-700 leading-relaxed">
                              <strong className="text-[#173B65] block mb-1">
                                Recommended STAR / Talking-Point Outline:
                              </strong>
                              {q.suggestedFramework}
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Your Practice Notes
                              </label>
                              <textarea
                                rows={2}
                                value={practiceNotes[q.id] || ''}
                                onChange={(e) =>
                                  setPracticeNotes((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                                placeholder="Draft your key examples, metrics, and talking points..."
                                className="w-full text-xs p-2.5 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none bg-white text-[#182230]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ================================================================= */}
      {/* TAB 4: MULTI-LANGUAGE CV TRANSLATION                              */}
      {/* ================================================================= */}
      {activeTab === 'translate' && (
        <section className="bg-white border border-[#E5EAF0] rounded-[14px] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
            <div>
              <h2 className="text-base font-bold text-[#173B65]">
                Resume Localization &amp; Translation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Translate your entire structured resume and section headings into another language while keeping dates, metrics, and employers intact.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTranslateCv}
              disabled={isTranslating}
              className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Translating Resume...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    Translate to {SUPPORTED_LANGUAGES.find((l) => l.code === translateTargetLang)?.label}
                  </span>
                </>
              )}
            </button>
          </div>

          {isTranslating ? (
            <OptimizationDiffSkeleton statusText="Translating resume sections and headings while preserving factual metrics..." />
          ) : !translatedPreview ? (
            <div className="py-12 px-4 text-center space-y-2 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
              <Globe className="w-8 h-8 text-[#3978B8] mx-auto" />
              <div className="text-sm font-semibold text-[#173B65]">
                Localize {selectedCv.title} for international applications
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Choose your target language above and click Translate to preview, export as DOCX, or save as a localized resume version.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#173B65]">
                  Translated Preview ({SUPPORTED_LANGUAGES.find((l) => l.code === translateTargetLang)?.label})
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      exportResumeToDocx(
                        translatedPreview,
                        `${(translatedPreview.name || 'Resume').replace(/\s+/g, '_')}_${translateTargetLang.toUpperCase()}.docx`,
                        translateTargetLang
                      )
                    }
                    className="btn-interactive px-3 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#3978B8]" />
                    <span>Download DOCX ({translateTargetLang.toUpperCase()})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveTranslatedVersion(selectedCv, translatedPreview, translateTargetLang);
                      setSavedTranslationNotice(true);
                    }}
                    className="btn-interactive px-3.5 py-1.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5"
                  >
                    <span>{savedTranslationNotice ? 'Saved & Opened!' : 'Save & Open in Studio'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-[12px] border border-[#E5EAF0] bg-[#F7F9FC] space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Original ({(selectedCv.language || 'en').toUpperCase()})
                  </div>
                  <div className="text-sm font-bold text-[#173B65]">
                    {selectedCv.structuredData.targetRoleHeadline}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedCv.structuredData.summary}
                  </p>
                  {selectedCv.structuredData.experience.slice(0, 2).map((e) => (
                    <div key={e.id} className="pt-2 border-t border-[#E5EAF0]">
                      <div className="text-xs font-semibold text-[#182230]">
                        {e.role} · {e.company}
                      </div>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-600">
                        {e.bullets.slice(0, 2).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-[12px] border border-[#3978B8]/40 bg-white space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#3978B8]">
                    Localized ({translateTargetLang.toUpperCase()})
                  </div>
                  <div className="text-sm font-bold text-[#173B65]">
                    {translatedPreview.targetRoleHeadline}
                  </div>
                  <p className="text-xs text-[#182230] leading-relaxed">
                    {translatedPreview.summary}
                  </p>
                  {translatedPreview.experience.slice(0, 2).map((e) => (
                    <div key={e.id} className="pt-2 border-t border-[#E5EAF0]">
                      <div className="text-xs font-semibold text-[#173B65]">
                        {e.role} · {e.company}
                      </div>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-700">
                        {e.bullets.slice(0, 2).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
