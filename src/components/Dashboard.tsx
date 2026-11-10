import React from 'react';
import { 
  FileText, 
  Sparkles, 
  Upload, 
  ArrowLeftRight, 
  Plus, 
  Download, 
  Trash2, 
  Copy, 
  ExternalLink,
  Clock,
  TrendingUp,
  CheckCircle2,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ResumeVersion } from '../types/resume';

interface DashboardProps {
  versions: ResumeVersion[];
  activeVersion: ResumeVersion | null;
  onSelectVersion: (version: ResumeVersion) => void;
  onDuplicateVersion: (version: ResumeVersion) => void;
  onDeleteVersion: (id: string) => void;
  onRenameVersion: (id: string, newTitle: string) => void;
  onOpenJdModal: () => void;
  onOpenUploadModal: () => void;
  onOpenCompareModal: () => void;
  onOpenStudio: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  versions,
  activeVersion,
  onSelectVersion,
  onDuplicateVersion,
  onDeleteVersion,
  onRenameVersion,
  onOpenJdModal,
  onOpenUploadModal,
  onOpenCompareModal,
  onOpenStudio
}) => {
  const avgScore = Math.round(
    versions.reduce((acc, v) => acc + (v.atsReport?.overallScore || 70), 0) / (versions.length || 1)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2A44]">
            Resume Workspace & Version Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your LaTeX resume variations, target job applications, and ATS match performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload New CV</span>
          </button>

          <button
            onClick={onOpenCompareModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Compare Versions</span>
          </button>

          <button
            onClick={() => {
              onOpenJdModal();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optimize for Target JD</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active Resume Versions</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {versions.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standard A4 Professional Format preserved
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Average ATS Fit</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-2">
            {avgScore}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across tailored applications
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Target Roles Tracked</span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {new Set(versions.map(v => v.targetRole)).size}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            APM, AI Product, Data PM, Tech PM
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Template Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-2">
            100%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standard 10pt · Compact Margins
          </div>
        </div>
      </div>

      {/* Saved Versions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1F2A44]">
              Saved Resume Versions
            </h2>
            <p className="text-xs text-slate-500">
              Each version is tailored for a specific role and company while maintaining your original template.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((ver) => {
            const isActive = activeVersion?.id === ver.id;
            return (
              <div
                key={ver.id}
                className={`p-5 rounded-xl border bg-white transition-all flex flex-col justify-between shadow-xs ${
                  isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-[#1F2A44] leading-tight">
                      {ver.title}
                    </span>
                    {ver.isOriginal ? (
                      <span className="text-[10px] uppercase font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        Master CV
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded shrink-0 font-mono">
                        {ver.atsReport?.overallScore || 90}% Match
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ver.targetRole}</span>
                    </div>
                    {ver.companyName && (
                      <div className="text-[11px] text-slate-500">
                        Target Company: <span className="font-medium text-slate-700">{ver.companyName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(ver.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateVersion(ver)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                      title="Duplicate version"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {!ver.isOriginal && (
                      <button
                        onClick={() => onDeleteVersion(ver.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        title="Delete version"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectVersion(ver);
                        onOpenStudio();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <span>Open in Studio</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Job Applications Reference Strip */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1F2A44]">
            Preloaded Optimization Profiles
          </h3>
          <span className="text-xs text-slate-500">
            Powered by Gemini AI Recruiter models
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-800 block">Associate PM (0→1 B2B / FinTech)</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Emphasizes user discovery interviews (50+), 7-month launch velocity, and multi-tenant admin dashboards.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-800 block">AI Product Manager (LLM / ML)</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Elevates IIT Dhanbad hybrid CNN-LSTM thesis, time-series forecasting, and PyTorch / SQL analytics workflows.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-800 block">Data / Technical PM</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Highlights SQL querying, schema requirements, internal developer portals, and cross-functional Agile execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
