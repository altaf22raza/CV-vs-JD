import React from 'react';
import { 
  Upload, 
  PlusCircle, 
  Sparkles, 
  ArrowRight, 
  FileCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { ResumeVersion } from '../types/resume';
import { AppView } from './Navbar';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  onOpenUpload: () => void;
  savedVersions: ResumeVersion[];
  onSelectVersion: (v: ResumeVersion) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenUpload,
  savedVersions,
  onSelectVersion,
}) => {
  return (
    <div className="space-y-12 py-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero Intro featuring Official CV vs JD Emblem */}
      <div className="text-center max-w-3xl mx-auto space-y-4">

        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold border border-amber-200/80">
          <Sparkles className="w-3.5 h-3.5 text-[#C8973E]" />
          <span>AI-Powered Resume Creation &amp; ATS Matching</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1E2B3E] tracking-tight leading-tight">
          Create, Manage, and Optimize Your CV for Any Job Description
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Match your resume directly against target job descriptions (<strong className="text-[#1E2B3E]">CV</strong> <span className="text-[#C8973E] font-bold">vs</span> <strong className="text-[#1D5A3A]">JD</strong>). Built for candidates and professionals to maximize recruiter visibility and achieve 100% ATS score compatibility with zero false claims.
        </p>
      </div>

      {/* The Three Primary Action Cards (Navy CV · Gold VS · Emerald JD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ACTION 1: Upload Your CV (Executive Navy #1E2B3E) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-[#1E2B3E]/40 hover:shadow-md transition-all group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#1E2B3E] flex items-center justify-center group-hover:bg-[#1E2B3E] group-hover:text-white transition-colors shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Option 01 · Navy</span>
              <h2 className="text-lg font-bold text-[#1E2B3E] mt-0.5">Upload Your CV</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Upload your existing resume (PDF, DOCX, or TXT). Extract information automatically, preview, edit, and save to your personal CV library.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Auto-parse summary, roles, and skills</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct digital editing &amp; PDF preview</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Saved securely to your account</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onOpenUpload}
            className="mt-6 w-full py-2.5 px-4 bg-[#1E2B3E] hover:bg-[#152232] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-[0.99]"
          >
            <span>Upload Existing Resume</span>
            <ArrowRight className="w-4 h-4 text-[#C8973E]" />
          </button>
        </div>

        {/* ACTION 2: Create New CV (Prestige Gold #C8973E) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#C8973E] flex items-center justify-center group-hover:bg-[#C8973E] group-hover:text-white transition-colors shadow-2xs">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600/80 font-mono">Option 02 · Gold</span>
              <h2 className="text-lg font-bold text-[#1E2B3E] mt-0.5">Create New CV</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Build a professional resume from scratch using 8 recruiter-approved, high-scoring ATS templates tailored to your target industry.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>8 Professional &amp; ATS-Friendly Templates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Split-screen builder with live A4 preview</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant PDF &amp; TXT downloads</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('create-cv')}
            className="mt-6 w-full py-2.5 px-4 bg-[#C8973E] hover:bg-[#B37D2C] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-[0.99]"
          >
            <span>Choose Template &amp; Build</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* ACTION 3: Optimize CV for Target JD (Emerald Green #1D5A3A) */}
        <div className="bg-gradient-to-b from-emerald-50/50 via-white to-white rounded-2xl border-2 border-[#1D5A3A] p-6 flex flex-col justify-between shadow-sm relative group">
          <div className="absolute -top-3 right-5 bg-[#1D5A3A] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-[#C8973E]" />
            <span>Core AI Feature</span>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#1D5A3A] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-[#C8973E]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D5A3A] font-mono">Option 03 · Emerald</span>
              <h2 className="text-lg font-bold text-[#1E2B3E] mt-0.5">Optimize CV for Target JD</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Select any saved CV, paste a target Job Description, and let AI identify missing keywords and tailor bullet points to maximize your ATS match score.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-emerald-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1D5A3A] shrink-0" />
                <span>Automatic missing keyword identification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1D5A3A] shrink-0" />
                <span>Action verb &amp; achievement enhancement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1D5A3A] shrink-0" />
                <span>100% factual accuracy (zero hallucination)</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('optimize-cv')}
            className="mt-6 w-full py-2.5 px-4 bg-[#1D5A3A] hover:bg-[#164E32] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-[0.99] ring-2 ring-[#1D5A3A]/20"
          >
            <span>Optimize for Target Job</span>
            <ArrowRight className="w-4 h-4 text-[#C8973E]" />
          </button>
        </div>
      </div>

      {/* Trust & Performance Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1F2A44]">Strict Factual Integrity</div>
            <div className="text-[11px] text-slate-500">Never fabricates metrics, companies, or titles</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1F2A44]">100% ATS-Compliant Layouts</div>
            <div className="text-[11px] text-slate-500">Tested against Workday, Greenhouse &amp; Lever</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1F2A44]">Multi-Version Library</div>
            <div className="text-[11px] text-slate-500">Maintain custom versions for each job application</div>
          </div>
        </div>
      </div>

      {/* Quick Access to User's Saved CVs */}
      {savedVersions.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F2A44]">
                Your Saved CVs ({savedVersions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Continue editing or optimize any version for a new job.
              </p>
            </div>
            <button
              onClick={() => onNavigate('my-cvs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All in My CVs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedVersions.slice(0, 3).map((ver) => (
              <div
                key={ver.id}
                onClick={() => {
                  onSelectVersion(ver);
                  onNavigate('studio');
                }}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-[#1F2A44] truncate">{ver.title}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                    ver.cvType === 'optimized'
                      ? 'bg-blue-50 text-blue-700'
                      : ver.cvType === 'uploaded'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {ver.cvType || 'Master'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  Role: <span className="font-medium text-slate-700">{ver.targetRole}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ver.updatedAt).toLocaleDateString()}
                  </span>
                  {ver.atsReport && (
                    <span className="text-emerald-600 font-semibold">
                      {ver.atsReport.overallScore}% ATS
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
