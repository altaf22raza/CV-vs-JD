import React, { useState } from 'react';
import {
  Layers,
  Upload,
  PlusCircle,
  Sparkles,
  Search,
  Copy,
  Trash2,
  Download,
  Clock,
  FileText,
  ChevronRight,
  History,
  FileDown,
} from 'lucide-react';
import { ResumeVersion } from '../types/resume';
import { RESUME_TEMPLATES } from '../data/templates';
import { exportResumeToPdf } from '../utils/pdfExport';
import { exportResumeToDocx } from '../utils/docxExport';
import { useAuth } from '../firebase/AuthContext';
import { ConfirmModal } from './ConfirmModal';

interface MyCvsViewProps {
  versions: ResumeVersion[];
  activeVersion: ResumeVersion | null;
  onSelectVersion: (ver: ResumeVersion) => void;
  onEditVersion: (ver: ResumeVersion) => void;
  onDuplicateVersion: (ver: ResumeVersion) => void;
  onDeleteVersion: (id: string) => void;
  onOptimizeVersion: (ver: ResumeVersion) => void;
  onOpenHistory?: (ver: ResumeVersion) => void;
  onOpenUpload: () => void;
  onOpenCreate: () => void;
  onRequireAuth?: (title: string, proceed: () => void) => void;
}

export const MyCvsView: React.FC<MyCvsViewProps> = ({
  versions,
  activeVersion,
  onSelectVersion,
  onEditVersion,
  onDuplicateVersion,
  onDeleteVersion,
  onOptimizeVersion,
  onOpenHistory,
  onOpenUpload,
  onOpenCreate,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'uploaded' | 'created' | 'optimized'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingDeleteCv, setPendingDeleteCv] = useState<ResumeVersion | null>(null);

  const filteredVersions = versions.filter((v) => {
    if (filterType === 'uploaded' && v.cvType !== 'uploaded') return false;
    if (filterType === 'created' && v.cvType !== 'created') return false;
    if (filterType === 'optimized' && v.cvType !== 'optimized') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchRole = v.targetRole.toLowerCase().includes(q);
      const matchCompany = v.companyName?.toLowerCase().includes(q);
      return matchTitle || matchRole || matchCompany;
    }
    return true;
  });

  const getTemplateName = (templateId: string) => {
    const t = RESUME_TEMPLATES.find((temp) => temp.id === templateId);
    return t ? t.name : 'Product Management';
  };

  const handleDownload = async (ver: ResumeVersion) => {
    const doDownload = async () => {
      await exportResumeToPdf(
        ver.structuredData,
        `${ver.title.replace(/\s+/g, '_')}_Resume.pdf`,
        ver.language || 'en'
      );
    };

    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Sign In to Download Your Resume', doDownload);
      }
      return;
    }
    await doDownload();
  };

  const handleDownloadDocx = async (ver: ResumeVersion) => {
    const doDocx = async () => {
      await exportResumeToDocx(
        ver.structuredData,
        `${ver.title.replace(/\s+/g, '_')}_Resume.docx`,
        ver.language || 'en'
      );
    };

    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Sign In to Download Your DOCX Resume', doDocx);
      }
      return;
    }
    await doDocx();
  };

  const canDeleteVersions = versions.length > 1;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5EAF0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3978B8] mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Personal Resume Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-[#173B65] tracking-tight">
            My CV Library ({versions.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize, edit, duplicate, inspect history, and tailor all your uploaded, custom-created, and job-optimized CVs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenUpload}
            className="btn-interactive flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] hover:border-[#3978B8] rounded-[10px] whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#3978B8]" />
            <span>Upload Existing CV</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="btn-interactive flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New CV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-white rounded-[10px] border border-[#E5EAF0] text-xs overflow-x-auto no-scrollbar max-w-full">
          {(
            [
              { id: 'all', label: `All CVs (${versions.length})` },
              {
                id: 'uploaded',
                label: `Uploaded (${versions.filter((v) => v.cvType === 'uploaded').length})`,
              },
              {
                id: 'created',
                label: `Created (${versions.filter((v) => v.cvType === 'created').length})`,
              },
              {
                id: 'optimized',
                label: `Optimized (${versions.filter((v) => v.cvType === 'optimized').length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-[8px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#173B65] text-white font-semibold'
                  : 'text-slate-600 hover:text-[#173B65] hover:bg-[#F7F9FC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or role..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
          />
        </div>
      </div>

      {/* CV Cards Grid or Empty State */}
      {filteredVersions.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white rounded-[12px] border border-dashed border-[#E5EAF0] space-y-3">
          <div className="w-11 h-11 rounded-[12px] bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5 text-[#3978B8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#182230]">No Resumes Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No resume matched "${searchQuery}". Try another keyword or clear your search.`
                : 'You have not added any resumes in this category yet.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {(searchQuery || filterType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="btn-interactive px-3.5 py-2 text-xs font-semibold text-[#173B65] bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] rounded-[10px] cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenUpload}
              className="btn-interactive px-3.5 py-2 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] cursor-pointer"
            >
              Upload CV
            </button>
            <button
              type="button"
              onClick={onOpenCreate}
              className="btn-interactive px-3.5 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] cursor-pointer"
            >
              Create New CV
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVersions.map((ver) => {
            const isCurrentActive = activeVersion?.id === ver.id;
            const allowDelete = canDeleteVersions && !ver.isOriginal;
            return (
              <div
                key={ver.id}
                onClick={() => onEditVersion(ver)}
                className={`card-interactive bg-white rounded-[12px] border flex flex-col justify-between overflow-hidden cursor-pointer group ${
                  isCurrentActive
                    ? 'border-[#3978B8]/70 bg-[#F7F9FC]/30 shadow-xs'
                    : 'border-[#E5EAF0]'
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#3978B8] font-mono">
                        {ver.cvType === 'optimized'
                          ? 'Optimized for JD'
                          : ver.cvType === 'uploaded'
                            ? 'Imported CV'
                            : 'Custom Built CV'}
                        {ver.language && ver.language !== 'en'
                          ? ` · ${ver.language.toUpperCase()}`
                          : ''}
                      </div>
                      <h3 className="text-sm font-bold text-[#182230] leading-snug line-clamp-1 group-hover:text-[#173B65] transition-colors">
                        {ver.title}
                      </h3>
                    </div>

                    {ver.atsReport && (
                      <span className="text-xs font-mono font-bold text-[#3978B8] tabular-nums shrink-0">
                        {ver.atsReport.overallScore}% Est. Fit
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="truncate flex items-center gap-1.5">
                      <span className="text-slate-400">Target Role:</span>
                      <span className="font-semibold text-[#182230] truncate">
                        {ver.targetRole}
                      </span>
                    </div>
                    {ver.companyName && (
                      <div className="truncate flex items-center gap-1.5">
                        <span className="text-slate-400">Company:</span>
                        <span className="font-semibold text-[#182230] truncate">
                          {ver.companyName}
                        </span>
                      </div>
                    )}
                    <div className="truncate">
                      <span className="text-slate-400">Template:</span>{' '}
                      <span className="font-medium text-slate-700">
                        {getTemplateName(ver.templateId)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions & Footer */}
                <div className="px-4 sm:px-5 py-3 bg-[#F7F9FC] border-t border-[#E5EAF0] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="w-3 h-3 text-[#3978B8]" />
                    {new Date(ver.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateVersion(ver);
                      }}
                      className="min-h-[34px] min-w-[34px] p-1.5 flex items-center justify-center text-slate-500 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                      title="Duplicate this version"
                      aria-label={`Duplicate ${ver.title}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(ver);
                      }}
                      className="min-h-[34px] min-w-[34px] p-1.5 flex items-center justify-center text-slate-500 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                      title="Download PDF"
                      aria-label={`Download PDF of ${ver.title}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocx(ver);
                      }}
                      className="min-h-[34px] min-w-[34px] p-1.5 flex items-center justify-center text-slate-500 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                      title="Download Word (.docx)"
                      aria-label={`Download DOCX of ${ver.title}`}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>

                    {onOpenHistory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenHistory(ver);
                        }}
                        className="min-h-[34px] min-w-[34px] p-1.5 flex items-center justify-center text-slate-500 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                        title="Version History & Checkpoints"
                        aria-label={`View version history of ${ver.title}`}
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOptimizeVersion(ver);
                      }}
                      className="min-h-[34px] min-w-[34px] p-1.5 flex items-center justify-center text-[#3978B8] hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                      title="Optimize this CV for a target JD"
                      aria-label={`Optimize ${ver.title}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {allowDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteCv(ver);
                        }}
                        className="min-h-[34px] min-w-[34px] p-1.5 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors cursor-pointer"
                        title="Delete CV"
                        aria-label={`Delete ${ver.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditVersion(ver);
                      }}
                      className="btn-interactive min-h-[34px] ml-0.5 flex items-center gap-1 px-3 py-1.5 font-semibold text-xs text-[#173B65] bg-white hover:bg-[#173B65] hover:text-white border border-[#E5EAF0] hover:border-[#173B65] rounded-[10px] whitespace-nowrap cursor-pointer"
                    >
                      <span>Edit &amp; View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog before deleting a Resume */}
      <ConfirmModal
        isOpen={Boolean(pendingDeleteCv)}
        title="Delete Resume Version?"
        description="Are you sure you want to permanently delete this resume version and its saved checkpoints? This action cannot be undone."
        itemName={
          pendingDeleteCv ? `${pendingDeleteCv.title} · ${pendingDeleteCv.targetRole}` : undefined
        }
        confirmLabel="Delete Resume"
        onConfirm={() => {
          if (pendingDeleteCv) {
            onDeleteVersion(pendingDeleteCv.id);
          }
        }}
        onCancel={() => setPendingDeleteCv(null)}
      />
    </div>
  );
};
