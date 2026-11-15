import React, { useMemo, useState } from 'react';
import {
  Upload,
  PlusCircle,
  Sparkles,
  ArrowRight,
  FileText,
  Briefcase,
  BarChart3,
  CheckCircle2,
  Circle,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  FileCheck,
  Layers,
  UserCheck,
  Globe,
  ClipboardList,
} from 'lucide-react';
import { ResumeVersion, SavedJobDescription, SupportedLanguage } from '../types/resume';
import { AppView } from './Navbar';
import { useAuth } from '../firebase/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import { normalizeReportMetrics } from '../utils/reportMetrics';
import { ConfirmModal } from './ConfirmModal';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  onOpenUpload: () => void;
  savedVersions: ResumeVersion[];
  activeVersion: ResumeVersion;
  onSelectVersion: (v: ResumeVersion) => void;
  onOptimizeVersion: (v: ResumeVersion) => void;
  onViewReport: (v: ResumeVersion) => void;
  savedJds: SavedJobDescription[];
  onOptimizeWithJd: (jd: SavedJobDescription | null) => void;
  onOpenSaveJdModal: (jd?: SavedJobDescription) => void;
  onDeleteJd: (id: string) => void;
  onOpenAuthModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenUpload,
  savedVersions,
  activeVersion,
  onSelectVersion,
  onOptimizeVersion,
  onViewReport,
  savedJds,
  onOptimizeWithJd,
  onOpenSaveJdModal,
  onDeleteJd,
  onOpenAuthModal,
}) => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [pendingDeleteJd, setPendingDeleteJd] = useState<SavedJobDescription | null>(null);

  const greetingName = useMemo(() => {
    if (user?.displayName && user.displayName.trim()) {
      return user.displayName.trim();
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'there';
  }, [user]);

  const recentResumes = useMemo(() => {
    return [...savedVersions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [savedVersions]);

  const optimizationReports = useMemo(() => {
    return recentResumes.filter((v) => Boolean(v.atsReport));
  }, [recentResumes]);

  const profileChecks = useMemo(() => {
    const data = activeVersion?.structuredData;
    const hasContact = Boolean(
      data?.name?.trim() &&
        data?.contact?.email?.trim() &&
        data?.targetRoleHeadline?.trim()
    );
    const hasSummary = Boolean(data?.summary && data.summary.trim().length >= 40);
    const hasExperience = Boolean(
      data?.experience?.length &&
        data.experience.some((exp) => exp.role.trim() && exp.bullets.length > 0)
    );
    const hasEducation = Boolean(data?.education?.length && data.education[0]?.degree?.trim());
    const hasSkills = Boolean(
      data?.skills?.length && data.skills.some((cat) => cat.items.length > 0)
    );
    const hasOptimizedCv = savedVersions.some(
      (v) => v.cvType === 'optimized' || Boolean(v.jdText)
    );

    return [
      {
        id: 'contact',
        label: 'Contact details & target headline',
        completed: hasContact,
        actionLabel: 'Edit in studio',
        onClick: () => {
          onSelectVersion(activeVersion);
          onNavigate('studio');
        },
      },
      {
        id: 'summary',
        label: 'Professional summary',
        completed: hasSummary,
        actionLabel: 'Add summary',
        onClick: () => {
          onSelectVersion(activeVersion);
          onNavigate('studio');
        },
      },
      {
        id: 'experience',
        label: 'Work history & impact bullets',
        completed: hasExperience,
        actionLabel: 'Add experience',
        onClick: () => {
          onSelectVersion(activeVersion);
          onNavigate('studio');
        },
      },
      {
        id: 'education',
        label: 'Education & credentials',
        completed: hasEducation,
        actionLabel: 'Add education',
        onClick: () => {
          onSelectVersion(activeVersion);
          onNavigate('studio');
        },
      },
      {
        id: 'skills',
        label: 'Technical & domain skills',
        completed: hasSkills,
        actionLabel: 'Add skills',
        onClick: () => {
          onSelectVersion(activeVersion);
          onNavigate('studio');
        },
      },
      {
        id: 'optimized',
        label: 'Tailored CV for a target job',
        completed: hasOptimizedCv,
        actionLabel: 'Optimize now',
        onClick: () => onOptimizeWithJd(savedJds[0] || null),
      },
    ];
  }, [activeVersion, savedVersions, savedJds, onSelectVersion, onNavigate, onOptimizeWithJd]);

  const completedCount = profileChecks.filter((c) => c.completed).length;
  const completionPercent = Math.round((completedCount / profileChecks.length) * 100);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  // =========================================================================
  // LOGGED-OUT VIEW: Fresh New-User Landing Page (no personal dashboard yet)
  // =========================================================================
  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* Hero Landing Section */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#3978B8]">
            {t.heroEyebrow}
          </p>

          <h1
            className="text-3xl sm:text-5xl font-bold text-[#173B65] tracking-tight leading-tight"
            style={{ textWrap: 'balance' }}
          >
            {t.heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>

          {/* Immediate Landing Actions */}
          <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOptimizeWithJd(null)}
              className="btn-interactive w-full sm:w-auto min-h-[44px] px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#9EC1E6]" />
              <span>{t.optimizeForJob}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenUpload}
              className="btn-interactive w-full sm:w-auto min-h-[44px] px-5 py-3 text-xs sm:text-sm font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] hover:border-[#3978B8] rounded-[10px] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#3978B8]" />
              <span>{t.uploadCv}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('create-cv')}
              className="btn-interactive w-full sm:w-auto min-h-[44px] px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-[#3978B8] hover:bg-[#2E649B] rounded-[10px] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>{t.createNewCv}</span>
            </button>
          </div>
        </section>

        {/* Core Workflows Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Primary Pathway: Optimize CV for Target JD */}
          <div className="lg:col-span-6 card-interactive bg-white border border-[#E5EAF0] rounded-[14px] p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="text-xs font-mono text-[#3978B8] font-semibold">
                01. Semantic Job Matching
              </div>
              <h2 className="text-2xl font-bold text-[#173B65] tracking-tight">
                Tailor Your Resume to Any Job Description
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Paste a job posting to uncover missing domain keywords, compare requirement alignment side-by-side, and refine bullet points while keeping your original metrics and career history intact.
              </p>

              <ul className="space-y-2.5 text-xs text-[#182230] pt-3 border-t border-[#E5EAF0]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3978B8] shrink-0" />
                  <span>Detailed ATS compatibility &amp; keyword gap audit</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3978B8] shrink-0" />
                  <span>Accept or reject individual bullet rewrites before saving</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3978B8] shrink-0" />
                  <span>Zero fabricated titles, companies, or unverified claims</span>
                </li>
              </ul>
            </div>

            <div>
              <button
                type="button"
                onClick={() => onOptimizeWithJd(null)}
                className="btn-interactive px-5 py-2.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Start Job Match Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Pathways Stacked */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {/* Pathway 02: Upload Existing CV */}
            <div className="card-interactive bg-white border border-[#E5EAF0] rounded-[14px] p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#3978B8] font-semibold">
                  02. Resume Ingestion
                </div>
                <h3 className="text-lg font-bold text-[#173B65]">Upload Existing CV</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Import a PDF, DOCX, or TXT resume to parse your work history, education, and skills into an editable A4 workspace.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="btn-interactive px-4 py-2 text-xs font-semibold text-[#173B65] bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] hover:border-[#3978B8] rounded-[10px] inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>Upload Existing Resume</span>
                </button>
              </div>
            </div>

            {/* Pathway 03: Create New CV */}
            <div className="card-interactive bg-white border border-[#E5EAF0] rounded-[14px] p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#3978B8] font-semibold">
                  03. Structured Templates
                </div>
                <h3 className="text-lg font-bold text-[#173B65]">Build a New CV from Scratch</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose from 8 recruiter-tested, single-page ATS layouts with live A4 preview and direct PDF &amp; DOCX export.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('create-cv')}
                  className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#3978B8] hover:bg-[#2E649B] rounded-[10px] inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Browse ATS Templates</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Value & Standards Strip + Returning User Sign In */}
        <section className="pt-6 border-t border-[#E5EAF0] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#173B65] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#182230]">Strict Factual Integrity</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Every rewrite preserves your actual roles, dates, employers, and verifiable achievements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-[#3978B8] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#182230]">Parser-Friendly Typography</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Clean hierarchy layouts exported as selectable text-based PDFs and linear DOCX files.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-[#173B65] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#182230]">Role-Specific Versions</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Sign in to access your saved resumes, target job descriptions, and past optimization reports.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5EAF0] rounded-[14px] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <UserCheck className="w-5 h-5 text-[#173B65] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#182230]">Returning to your workspace?</div>
                <div className="text-xs text-slate-500">
                  Sign in with your email to view recently edited resumes, saved job descriptions, and past ATS reports.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Globe className="w-3.5 h-3.5 text-[#3978B8]" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  aria-label={t.languageLabel}
                  className="text-xs font-medium text-[#182230] bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] px-2.5 py-2 focus:outline-none focus:border-[#3978B8]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeLabel}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In to Dashboard
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // LOGGED-IN VIEW: Personal Workspace Dashboard (5-second clarity)
  // =========================================================================
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Welcome Section + Immediate Primary Actions */}
      <section className="bg-white border border-[#E5EAF0] rounded-[14px] p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-[#3978B8]">Workspace Dashboard</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {savedVersions.length} {savedVersions.length === 1 ? 'resume' : 'resumes'} saved
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {savedJds.length} saved {savedJds.length === 1 ? 'JD' : 'JDs'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#173B65] tracking-tight break-words">
              {t.welcomeBack}, {greetingName}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload an existing CV, create a new one from an ATS template, or optimize a resume for a job description.
            </p>
            <div className="pt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('career-tools')}
                className="font-semibold text-[#173B65] hover:text-[#3978B8] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#3978B8]" />
                <span>{t.navCareerPrep} (Cover Letter · LinkedIn · Interview)</span>
              </button>
              <span className="text-[#E5EAF0] hidden sm:inline" aria-hidden="true">
                |
              </span>
              <button
                type="button"
                onClick={() => onNavigate('applications')}
                className="font-semibold text-[#173B65] hover:text-[#3978B8] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5 text-[#3978B8]" />
                <span>{t.navApplications}</span>
              </button>
            </div>
          </div>

          {/* Primary Action Trio */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenUpload}
              className="btn-interactive w-full sm:w-auto min-h-[42px] px-4 py-2.5 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] hover:border-[#3978B8] rounded-[10px] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#3978B8]" />
              <span>{t.uploadCv}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('create-cv')}
              className="btn-interactive w-full sm:w-auto min-h-[42px] px-4 py-2.5 text-xs font-semibold text-white bg-[#3978B8] hover:bg-[#2E649B] rounded-[10px] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.createNewCv}</span>
            </button>

            <button
              type="button"
              onClick={() => onOptimizeWithJd(null)}
              className="btn-interactive w-full sm:w-auto min-h-[42px] px-5 py-2.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#9EC1E6]" />
              <span>{t.optimizeForJob}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Two-Column Authenticated Dashboard Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Recently Edited Resumes + Saved Job Descriptions) */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Recently Edited Resumes */}
          <section className="bg-white border border-[#E5EAF0] rounded-[12px] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#173B65]">{t.recentlyEdited}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any resume to open the live editor and A4 preview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('my-cvs')}
                className="text-xs font-semibold text-[#3978B8] hover:text-[#173B65] inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>View all ({savedVersions.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentResumes.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-11 h-11 rounded-[12px] bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5 text-[#3978B8]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#182230]">No resumes in your library yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload your existing resume or start from a clean ATS-verified template.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onOpenUpload}
                    className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] cursor-pointer"
                  >
                    Upload CV
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('create-cv')}
                    className="btn-interactive px-4 py-2 text-xs font-semibold text-[#182230] bg-white border border-[#E5EAF0] hover:border-[#3978B8] rounded-[10px] cursor-pointer"
                  >
                    Create New CV
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#E5EAF0]">
                {recentResumes.slice(0, 4).map((ver) => (
                  <div
                    key={ver.id}
                    onClick={() => onSelectVersion(ver)}
                    className="px-5 sm:px-6 py-4 hover:bg-[#F7F9FC] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] bg-[#F7F9FC] border border-[#E5EAF0] text-[#173B65] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#173B65] group-hover:text-white group-hover:border-[#173B65] transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#182230] truncate group-hover:text-[#173B65] transition-colors">
                          {ver.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[#182230] font-medium">{ver.targetRole}</span>
                          {ver.companyName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{ver.companyName}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{ver.cvType || 'created'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">Updated {formatDate(ver.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                      {ver.atsReport ? (
                        <span className="text-xs font-mono font-semibold tabular-nums text-[#3978B8]">
                          Est. {ver.atsReport.overallScore}% fit
                        </span>
                      ) : (
                        <span className="sm:hidden" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOptimizeVersion(ver);
                        }}
                        className="btn-interactive min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#173B65] hover:text-white border border-[#E5EAF0] hover:border-[#173B65] rounded-[10px] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Optimize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved Job Descriptions */}
          <section className="bg-white border border-[#E5EAF0] rounded-[12px] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#173B65]">{t.savedJdsTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target roles you have saved for quick ATS matching and CV tailoring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenSaveJdModal()}
                className="btn-interactive px-3 py-1.5 text-xs font-semibold text-[#173B65] bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] hover:border-[#3978B8] rounded-[10px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#3978B8]" />
                <span>Add JD</span>
              </button>
            </div>

            {savedJds.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-11 h-11 rounded-[12px] bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center mx-auto">
                  <Briefcase className="w-5 h-5 text-[#3978B8]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#182230]">No saved job descriptions yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Save job postings here so you can compare your resume and generate tailored versions anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSaveJdModal()}
                  className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] cursor-pointer"
                >
                  Save First Job Description
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E5EAF0]">
                {savedJds.map((jd) => (
                  <div
                    key={jd.id}
                    className="px-5 sm:px-6 py-4 hover:bg-[#F7F9FC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] bg-[#F7F9FC] border border-[#E5EAF0] text-[#3978B8] flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#182230] truncate">{jd.role}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-[#182230]">{jd.company}</span>
                          {jd.industry && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{jd.industry}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">Saved {formatDate(jd.updatedAt)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {jd.text.replace(/\s+/g, ' ').trim()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenSaveJdModal(jd)}
                          className="p-2 text-slate-400 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                          title="Edit job description"
                          aria-label={`Edit ${jd.role}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteJd(jd)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors cursor-pointer"
                          title="Delete job description"
                          aria-label={`Delete ${jd.role}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOptimizeWithJd(jd)}
                        className="btn-interactive min-h-[36px] px-3 py-1.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Optimize CV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (Profile Completion + Previous Optimization Reports) */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          {/* Profile Completion Status */}
          <section className="bg-white border border-[#E5EAF0] rounded-[12px] p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#173B65]">{t.profileCompletion}</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Based on {activeVersion?.title || 'your active resume'}
                </p>
              </div>
              <span
                className={`text-lg font-bold font-mono tabular-nums shrink-0 ${
                  completionPercent === 100 ? 'text-emerald-700' : 'text-[#173B65]'
                }`}
              >
                {completionPercent}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    completionPercent === 100 ? 'bg-emerald-600' : 'bg-[#3978B8]'
                  }`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {completedCount} of {profileChecks.length} milestones complete
              </div>
            </div>

            <div className="divide-y divide-[#E5EAF0] border-t border-[#E5EAF0] pt-1">
              {profileChecks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-[#F7F9FC] px-2 -mx-2 rounded-[8px] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-[#3978B8]" />
                    )}
                    <span
                      className={`text-xs truncate ${
                        item.completed ? 'text-slate-600' : 'text-[#182230] font-semibold'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {!item.completed && (
                    <span className="text-[11px] font-semibold text-[#3978B8] group-hover:underline whitespace-nowrap shrink-0">
                      {item.actionLabel}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Previous Optimization Reports */}
          <section className="bg-white border border-[#E5EAF0] rounded-[12px] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#173B65]">{t.previousReports}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compatibility, keywords, gaps, experience, projects &amp; edits.
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-[#3978B8] shrink-0" />
            </div>

            {optimizationReports.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center mx-auto">
                  <BarChart3 className="w-4 h-4 text-[#3978B8]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#182230]">
                    No alignment reports generated yet
                  </p>
                  <p className="text-xs text-slate-500">
                    Run a job match check to inspect formatting compatibility, matched keywords, missing skills, and project relevance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOptimizeWithJd(null)}
                  className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] cursor-pointer"
                >
                  Run Optimization Check
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#E5EAF0]">
                  {optimizationReports.slice(0, 4).map((ver) => {
                    const m = normalizeReportMetrics(ver.atsReport!, ver);
                    return (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => onViewReport(ver)}
                        className="w-full px-5 sm:px-6 py-4 text-left hover:bg-[#F7F9FC] transition-colors space-y-2.5 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#182230] truncate group-hover:text-[#173B65] transition-colors">
                              {ver.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>{ver.targetRole}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{formatDate(ver.updatedAt)}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold font-mono tabular-nums text-[#3978B8] shrink-0">
                            Est. {m.estimatedOverallIndex}%
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-600 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">ATS compat</span>
                            <span className="font-mono font-semibold tabular-nums text-[#182230]">
                              {m.atsCompatibilityScore}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Keywords</span>
                            <span className="font-mono font-semibold tabular-nums text-emerald-700">
                              {m.matchedCount} matched
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Missing skills</span>
                            <span className="font-mono font-semibold tabular-nums text-amber-700">
                              {m.missingCount} gaps
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Experience</span>
                            <span className="font-mono font-semibold tabular-nums text-[#182230]">
                              {m.experienceRelevanceScore}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Projects</span>
                            <span className="font-mono font-semibold tabular-nums text-[#182230]">
                              {m.projectRelevanceScore}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Improvement</span>
                            <span className="font-mono font-semibold tabular-nums text-[#3978B8]">
                              {m.improvementScore > 0
                                ? `+${m.improvementScore} pts`
                                : `${m.changesCount} edits`}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-5 sm:px-6 py-3 bg-[#F7F9FC] border-t border-[#E5EAF0] text-[11px] text-slate-500 leading-relaxed">
                  Estimates weigh keywords (40%), formatting (20%), experience (25%), and projects (15%) — not an ATS pass guarantee. Click a report for full evidence.
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Confirmation before deleting a saved JD */}
      <ConfirmModal
        isOpen={Boolean(pendingDeleteJd)}
        title="Delete Saved Job Description?"
        description="This removes the job posting from your Saved Job Descriptions list. Any resume versions already tailored from it will remain in My CVs."
        itemName={
          pendingDeleteJd ? `${pendingDeleteJd.role} · ${pendingDeleteJd.company}` : undefined
        }
        confirmLabel="Delete JD"
        onConfirm={() => {
          if (pendingDeleteJd) {
            onDeleteJd(pendingDeleteJd.id);
          }
        }}
        onCancel={() => setPendingDeleteJd(null)}
      />
    </div>
  );
};
