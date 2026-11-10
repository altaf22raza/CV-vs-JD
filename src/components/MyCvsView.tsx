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
  Edit3, 
  Clock, 
  FileText,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { ResumeVersion } from '../types/resume';
import { RESUME_TEMPLATES } from '../data/templates';
import { exportResumeToPdf } from '../utils/pdfExport';
import { useAuth } from '../firebase/AuthContext';

interface MyCvsViewProps {
  versions: ResumeVersion[];
  activeVersion: ResumeVersion | null;
  onSelectVersion: (ver: ResumeVersion) => void;
  onEditVersion: (ver: ResumeVersion) => void;
  onDuplicateVersion: (ver: ResumeVersion) => void;
  onDeleteVersion: (id: string) => void;
  onOptimizeVersion: (ver: ResumeVersion) => void;
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
  onOpenUpload,
  onOpenCreate,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'uploaded' | 'created' | 'optimized'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredVersions = versions.filter(v => {
    // Type filter
    if (filterType === 'uploaded' && v.cvType !== 'uploaded') return false;
    if (filterType === 'created' && v.cvType !== 'created') return false;
    if (filterType === 'optimized' && v.cvType !== 'optimized') return false;

    // Search query
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
    const t = RESUME_TEMPLATES.find(temp => temp.id === templateId);
    return t ? t.name : 'Product Management';
  };

  const handleDownload = async (ver: ResumeVersion) => {
    const doDownload = async () => {
      onSelectVersion(ver);
      setTimeout(async () => {
        await exportResumeToPdf('resume-a4-document', `${ver.title.replace(/\s+/g, '_')}_Resume.pdf`);
      }, 200);
    };

    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Sign In to Download Your Resume', doDownload);
      }
      return;
    }
    await doDownload();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Personal Resume Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1F2A44] tracking-tight">
            My CV Library ({versions.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize, edit, duplicate, and tailor all your uploaded, custom-created, and job-optimized CVs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload Existing CV</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1F2A44] hover:bg-[#161f33] rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New CV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All CVs ({versions.length})
          </button>

          <button
            onClick={() => setFilterType('uploaded')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'uploaded'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Uploaded ({versions.filter(v => v.cvType === 'uploaded').length})
          </button>

          <button
            onClick={() => setFilterType('created')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'created'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Created ({versions.filter(v => v.cvType === 'created').length})
          </button>

          <button
            onClick={() => setFilterType('optimized')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'optimized'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Optimized ({versions.filter(v => v.cvType === 'optimized').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or role..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* CV Cards Grid */}
      {filteredVersions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-dashed border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No CVs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? `No resume matched "${searchQuery}".` : 'You have not added any CVs in this category yet.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              Upload CV
            </button>
            <button
              onClick={onOpenCreate}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Create New CV
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVersions.map((ver) => {
            const isCurrentActive = activeVersion?.id === ver.id;
            return (
              <div
                key={ver.id}
                onClick={() => onEditVersion(ver)}
                className={`bg-white rounded-xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md cursor-pointer hover:border-blue-400 group ${
                  isCurrentActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        ver.cvType === 'optimized'
                          ? 'bg-blue-50 text-blue-700'
                          : ver.cvType === 'uploaded'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {ver.cvType === 'optimized' ? 'Optimized for JD' : ver.cvType === 'uploaded' ? 'Uploaded CV' : 'Created CV'}
                      </span>
                      <h3 className="text-sm font-bold text-[#1F2A44] pt-1 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {ver.title}
                      </h3>
                    </div>

                    {ver.atsReport && (
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                        {ver.atsReport.overallScore}% ATS
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-1">
                    <div className="truncate">
                      <span className="text-slate-400">Target Role:</span>{' '}
                      <span className="font-medium text-slate-800">{ver.targetRole}</span>
                    </div>
                    {ver.companyName && (
                      <div className="truncate">
                        <span className="text-slate-400">Company:</span>{' '}
                        <span className="font-medium text-slate-800">{ver.companyName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Template:</span>{' '}
                      <span className="font-medium text-slate-800">{getTemplateName(ver.templateId)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions & Footer */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(ver.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateVersion(ver);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
                      title="Duplicate this version"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(ver);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOptimizeVersion(ver);
                      }}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="Optimize this CV for a target JD"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {!ver.isOriginal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVersion(ver.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete CV"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditVersion(ver);
                      }}
                      className="ml-1 flex items-center gap-1 px-3 py-1.5 font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-md transition-colors group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
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
    </div>
  );
};
