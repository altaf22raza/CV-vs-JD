import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  ExternalLink,
  Briefcase,
  FileText,
  MessageSquare,
  X,
} from 'lucide-react';
import {
  JobApplication,
  ApplicationStatus,
  ResumeVersion,
  SavedJobDescription,
} from '../types/resume';
import { CareerToolTab } from './CareerToolsView';
import { ConfirmModal } from './ConfirmModal';

interface ApplicationTrackerViewProps {
  applications: JobApplication[];
  versions: ResumeVersion[];
  savedJds: SavedJobDescription[];
  onAddApplication: (app: Omit<JobApplication, 'id' | 'updatedAt'>) => void;
  onUpdateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  onDeleteApplication: (id: string) => void;
  onOpenResumeInStudio: (resumeId: string) => void;
  onLaunchCareerPrep: (
    tab: CareerToolTab,
    ctx: { role: string; company: string; jdText?: string; resumeVersionId?: string }
  ) => void;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
];

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  Saved: 'text-slate-700 border-[#E5EAF0] bg-[#F7F9FC]',
  Applied: 'text-[#173B65] border-[#3978B8]/40 bg-[#F0F5FA]',
  Interviewing: 'text-amber-800 border-amber-300 bg-amber-50',
  Offer: 'text-emerald-800 border-emerald-300 bg-emerald-50',
  Rejected: 'text-rose-700 border-rose-200 bg-rose-50',
};

export const ApplicationTrackerView: React.FC<ApplicationTrackerViewProps> = ({
  applications,
  versions,
  savedJds,
  onAddApplication,
  onUpdateApplicationStatus,
  onDeleteApplication,
  onOpenResumeInStudio,
  onLaunchCareerPrep,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [pendingDeleteApp, setPendingDeleteApp] = useState<JobApplication | null>(null);

  // Add Form State
  const [company, setCompany] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [resumeVersionId, setResumeVersionId] = useState<string>(versions[0]?.id || '');
  const [appliedDate, setAppliedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [jobUrl, setJobUrl] = useState<string>('');
  const [jdText, setJdText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const metrics = useMemo(() => {
    const total = applications.length;
    const interviewing = applications.filter((a) => a.status === 'Interviewing').length;
    const offers = applications.filter((a) => a.status === 'Offer').length;
    const appliedOrBeyond = applications.filter((a) => a.status !== 'Saved').length;
    const responded = interviewing + offers;
    const responseRate =
      appliedOrBeyond > 0 ? Math.round((responded / appliedOrBeyond) * 100) : 0;
    return { total, interviewing, offers, responseRate };
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'All' && app.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          app.company.toLowerCase().includes(q) ||
          app.role.toLowerCase().includes(q) ||
          (app.resumeTitle || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, statusFilter, searchQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    const linkedCv = versions.find((v) => v.id === resumeVersionId);
    onAddApplication({
      company: company.trim(),
      role: role.trim(),
      status,
      resumeVersionId: linkedCv?.id,
      resumeTitle: linkedCv?.title,
      estimatedFit: linkedCv?.atsReport?.overallScore,
      appliedDate,
      followUpDate: followUpDate || undefined,
      location: location.trim() || undefined,
      jobUrl: jobUrl.trim() || undefined,
      jdText: jdText.trim() || linkedCv?.jdText || undefined,
      notes: notes.trim() || undefined,
    });
    setCompany('');
    setRole('');
    setNotes('');
    setJobUrl('');
    setJdText('');
    setShowAddForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5EAF0]">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#3978B8]">
            Pipeline Tracker
          </p>
          <h1 className="text-2xl font-bold text-[#173B65] tracking-tight mt-0.5">
            Application Tracking Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track submitted roles, link the exact CV version used, and jump straight into cover letters or interview prep.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="btn-interactive px-4 py-2.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAddForm ? 'Close Form' : 'Log Application'}</span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-1">
          <div className="text-xs text-slate-500">Tracked Roles</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#173B65]">
            {metrics.total}
          </div>
        </div>
        <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-1">
          <div className="text-xs text-slate-500">Active Interviews</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#3978B8]">
            {metrics.interviewing}
          </div>
        </div>
        <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-1">
          <div className="text-xs text-slate-500">Interview Response Rate</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#182230]">
            {metrics.responseRate}%
          </div>
        </div>
        <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-1">
          <div className="text-xs text-slate-500">Offers Received</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {metrics.offers}
          </div>
        </div>
      </div>

      {/* Add Application Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-[#E5EAF0] rounded-[12px] p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#173B65]">Add Job Application</h2>
            {savedJds.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  const jd = savedJds.find((j) => j.id === e.target.value);
                  if (jd) {
                    setCompany(jd.company);
                    setRole(jd.role);
                    setJdText(jd.text);
                  }
                }}
                className="text-xs px-2.5 py-1.5 border border-[#E5EAF0] rounded-[10px] bg-[#F7F9FC] text-[#182230] max-w-full"
              >
                <option value="">Prefill from Saved JD...</option>
                {savedJds.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} · {j.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Company *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Target Role *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Product Manager"
                className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pipeline Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full text-xs px-2.5 py-2 border border-[#E5EAF0] rounded-[10px] bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Linked Resume Version
              </label>
              <select
                value={resumeVersionId}
                onChange={(e) => setResumeVersionId(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-[#E5EAF0] rounded-[10px] bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Applied Date
              </label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Follow-up Date (Optional)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Location / Work Mode
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru · Hybrid"
                className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Job Posting URL (Optional)
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Notes / Recruiter Contact
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referral source, salary expectations, or round notes..."
              className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-interactive px-3.5 py-2 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] cursor-pointer"
            >
              Save Application
            </button>
          </div>
        </form>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-white rounded-[10px] border border-[#E5EAF0] overflow-x-auto no-scrollbar max-w-full">
          {(['All', ...STATUS_OPTIONS] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#173B65] text-white font-semibold'
                  : 'text-slate-600 hover:text-[#173B65] hover:bg-[#F7F9FC]'
              }`}
            >
              {tab} (
              {tab === 'All'
                ? applications.length
                : applications.filter((a) => a.status === tab).length}
              )
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, CV..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
          />
        </div>
      </div>

      {/* Empty State or Responsive Mobile Cards + Desktop Table */}
      {filteredApps.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5EAF0] rounded-[12px] p-10 sm:p-12 text-center space-y-3">
          <div className="w-11 h-11 rounded-[12px] bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center mx-auto">
            <Briefcase className="w-5 h-5 text-[#3978B8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#182230]">
              {applications.length === 0
                ? 'No job applications logged yet'
                : 'No applications match this filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Log each role you apply to along with the exact CV version submitted so you can track interview conversion rates.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {(statusFilter !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setSearchQuery('');
                }}
                className="btn-interactive px-4 py-2 text-xs font-semibold text-[#173B65] bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] rounded-[10px] cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] cursor-pointer"
            >
              {applications.length === 0 ? 'Log First Application' : 'Log Application'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* MOBILE & TABLET VIEW: Zero-scroll Stacked Cards (< lg) */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#182230] flex items-center gap-1.5 break-words">
                      <span>{app.role}</span>
                      {app.jobUrl && (
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-[#3978B8] shrink-0"
                          title="Open job posting"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {app.company}
                      {app.location ? ` · ${app.location}` : ''}
                    </div>
                  </div>

                  <select
                    value={app.status}
                    onChange={(e) =>
                      onUpdateApplicationStatus(app.id, e.target.value as ApplicationStatus)
                    }
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-[8px] border focus:outline-none cursor-pointer shrink-0 ${STATUS_STYLE[app.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5EAF0] text-xs">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Resume Used</div>
                    {app.resumeVersionId ? (
                      <button
                        type="button"
                        onClick={() => onOpenResumeInStudio(app.resumeVersionId!)}
                        className="text-left font-medium text-[#173B65] hover:underline truncate max-w-full cursor-pointer"
                      >
                        {app.resumeTitle || 'Linked CV'}
                      </button>
                    ) : (
                      <span className="text-slate-400">Not linked</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Applied</div>
                    <div className="font-mono tabular-nums text-[#182230]">{app.appliedDate}</div>
                  </div>
                </div>

                {app.notes && (
                  <p className="text-xs text-slate-600 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] px-3 py-2">
                    {app.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5EAF0]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchCareerPrep('cover-letter', {
                          role: app.role,
                          company: app.company,
                          jdText: app.jdText,
                          resumeVersionId: app.resumeVersionId,
                        })
                      }
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-[#173B65] bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] rounded-[8px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-[#3978B8]" />
                      <span>Cover Letter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchCareerPrep('interview', {
                          role: app.role,
                          company: app.company,
                          jdText: app.jdText,
                          resumeVersionId: app.resumeVersionId,
                        })
                      }
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-[#173B65] bg-[#F7F9FC] hover:bg-white border border-[#E5EAF0] rounded-[8px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-[#3978B8]" />
                      <span>Interview Prep</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingDeleteApp(app)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors cursor-pointer"
                    aria-label={`Delete ${app.role} at ${app.company}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: Structured Table (lg+) */}
          <div className="hidden lg:block bg-white border border-[#E5EAF0] rounded-[12px] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5EAF0] bg-[#F7F9FC] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Company &amp; Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Resume Used</th>
                  <th className="py-3 px-4">Applied</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] text-xs">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F7F9FC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#182230] flex items-center gap-1.5">
                        <span>{app.role}</span>
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-[#3978B8]"
                            title="Open job posting"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {app.company}
                        {app.location ? ` · ${app.location}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          onUpdateApplicationStatus(app.id, e.target.value as ApplicationStatus)
                        }
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-[8px] border focus:outline-none cursor-pointer ${STATUS_STYLE[app.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      {app.resumeVersionId ? (
                        <button
                          type="button"
                          onClick={() => onOpenResumeInStudio(app.resumeVersionId!)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-medium text-[#173B65] group-hover:underline">
                            {app.resumeTitle || 'Linked CV'}
                          </div>
                          {typeof app.estimatedFit === 'number' && (
                            <div className="text-[11px] font-mono tabular-nums text-[#3978B8]">
                              Est. {app.estimatedFit}% fit
                            </div>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400">Not linked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-[11px] text-slate-600">
                      <div>{app.appliedDate}</div>
                      {app.followUpDate && (
                        <div className="text-[#3978B8] mt-0.5">
                          Follow-up: {app.followUpDate}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="text-slate-600 truncate" title={app.notes || ''}>
                        {app.notes || '—'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onLaunchCareerPrep('cover-letter', {
                              role: app.role,
                              company: app.company,
                              jdText: app.jdText,
                              resumeVersionId: app.resumeVersionId,
                            })
                          }
                          className="p-1.5 text-slate-500 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                          title="Generate Cover Letter for this role"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onLaunchCareerPrep('interview', {
                              role: app.role,
                              company: app.company,
                              jdText: app.jdText,
                              resumeVersionId: app.resumeVersionId,
                            })
                          }
                          className="p-1.5 text-slate-500 hover:text-[#3978B8] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                          title="Prepare Interview Questions for this role"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteApp(app)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors cursor-pointer"
                          title="Delete application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDeleteApp)}
        title="Delete Job Application?"
        description="This removes the application record from your tracker. Your linked resume version and saved job descriptions will remain intact."
        itemName={
          pendingDeleteApp
            ? `${pendingDeleteApp.role} at ${pendingDeleteApp.company}`
            : undefined
        }
        confirmLabel="Delete Application"
        onConfirm={() => {
          if (pendingDeleteApp) {
            onDeleteApplication(pendingDeleteApp.id);
          }
        }}
        onCancel={() => setPendingDeleteApp(null)}
      />
    </div>
  );
};
