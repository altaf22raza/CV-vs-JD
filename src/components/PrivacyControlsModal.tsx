import React, { useEffect, useState } from 'react';
import {
  X,
  Shield,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Database,
  Gauge,
} from 'lucide-react';
import { apiGetUsageStats, type UsageStatsResponse } from '../services/geminiClient';

interface PrivacyControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  retentionDays: number;
  onChangeRetentionDays: (days: number) => void;
  resumeCount: number;
  savedJdCount: number;
  applicationCount: number;
  isSignedIn: boolean;
  userEmail?: string;
  onDeleteAllData: () => Promise<void>;
}

export const PrivacyControlsModal: React.FC<PrivacyControlsModalProps> = ({
  isOpen,
  onClose,
  retentionDays,
  onChangeRetentionDays,
  resumeCount,
  savedJdCount,
  applicationCount,
  isSignedIn,
  userEmail,
  onDeleteAllData,
}) => {
  const [confirmStep, setConfirmStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStatsResponse | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmStep(false);
      setStatusMsg(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  useEffect(() => {
    if (!isOpen || !isSignedIn) {
      setUsageStats(null);
      return;
    }
    let cancelled = false;
    setLoadingUsage(true);
    apiGetUsageStats()
      .then((res) => {
        if (!cancelled) setUsageStats(res);
      })
      .catch(() => {
        if (!cancelled) setUsageStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isSignedIn]);

  if (!isOpen) return null;

  const handlePurge = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAllData();
      setConfirmStep(false);
      setStatusMsg('All saved CVs, job descriptions, applications, and cloud records have been deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-xl border border-[#E5EAF0] w-full max-w-lg max-h-[92dvh] overflow-y-auto text-[#182230]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3 bg-[#F7F9FC]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#173B65] text-white flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#173B65] truncate">
                Privacy, Usage &amp; Data Controls
              </h3>
              <p className="text-xs text-slate-500">
                Manage AI usage quotas, retention policy, and personal data deletion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[10px] text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Stored Data Inventory */}
          <div className="bg-[#F7F9FC] border border-[#E5EAF0] rounded-[12px] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#173B65]">
              <Database className="w-4 h-4 text-[#3978B8]" />
              <span>Stored Workspace Data</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-2.5">
                <div className="text-lg font-bold font-mono tabular-nums text-[#173B65]">
                  {resumeCount}
                </div>
                <div className="text-[11px] text-slate-500">Resume Versions</div>
              </div>
              <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-2.5">
                <div className="text-lg font-bold font-mono tabular-nums text-[#173B65]">
                  {savedJdCount}
                </div>
                <div className="text-[11px] text-slate-500">Saved JDs</div>
              </div>
              <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-2.5">
                <div className="text-lg font-bold font-mono tabular-nums text-[#173B65]">
                  {applicationCount}
                </div>
                <div className="text-[11px] text-slate-500">Applications</div>
              </div>
            </div>
            {isSignedIn && userEmail && (
              <p className="text-[11px] text-slate-500 pt-1">
                Signed in as <strong className="text-[#182230]">{userEmail}</strong>. Uploaded CVs are stored privately to your workspace only.
              </p>
            )}
          </div>

          {/* Account AI Usage & Quota Summary */}
          {isSignedIn && (
            <div className="bg-[#F7F9FC] border border-[#E5EAF0] rounded-[12px] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#173B65]">
                  <Gauge className="w-4 h-4 text-[#3978B8]" />
                  <span>AI Usage &amp; Fair-Use Quota</span>
                </div>
                {usageStats && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {usageStats.rateLimit.remainingThisMinute}/{usageStats.rateLimit.perMinuteLimit} per min left
                  </span>
                )}
              </div>

              {loadingUsage ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="h-14 rounded-[10px] skeleton-block" />
                  <div className="h-14 rounded-[10px] skeleton-block" />
                </div>
              ) : usageStats ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-2.5">
                    <div className="text-xs font-semibold text-slate-500">Daily AI Quota</div>
                    <div className="text-base font-bold font-mono tabular-nums text-[#173B65] mt-0.5">
                      {usageStats.quota.usedToday} / {usageStats.quota.dailyLimit}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-2.5">
                    <div className="text-xs font-semibold text-slate-500">Monthly AI Quota</div>
                    <div className="text-base font-bold font-mono tabular-nums text-[#173B65] mt-0.5">
                      {usageStats.quota.usedThisMonth} / {usageStats.quota.monthlyLimit}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Daily limit: 50 AI optimizations &middot; Monthly limit: 500 requests.
                </p>
              )}
            </div>
          )}

          {/* Retention Policy Selector */}
          <div className="space-y-2">
            <label
              htmlFor="retention-select"
              className="text-xs font-bold text-[#173B65] flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-[#3978B8]" />
              <span>Automatic CV Data Retention Policy</span>
            </label>
            <select
              id="retention-select"
              value={retentionDays}
              onChange={(e) => onChangeRetentionDays(Number(e.target.value))}
              className="w-full text-xs font-medium text-[#182230] bg-white border border-[#E5EAF0] rounded-[10px] px-3 py-2.5 focus:outline-none focus:border-[#3978B8]"
            >
              <option value={0}>Manual — Keep until I delete</option>
              <option value={30}>30 Days — Auto-purge tailored CVs older than 30 days</option>
              <option value={90}>90 Days — Auto-purge tailored CVs older than 90 days</option>
              <option value={180}>180 Days — Auto-purge tailored CVs older than 180 days</option>
            </select>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When an auto-purge window is active, older non-master resume drafts and tailoring records past the selected age are automatically removed.
            </p>
          </div>

          {/* Permanent Deletion */}
          <div className="border-t border-[#E5EAF0] pt-4 space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Delete All My CV &amp; Personal Data</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Permanently erases all uploaded/tailored resumes, saved job descriptions, tracked applications, and cloud database records associated with your account.
              </p>
            </div>

            {!confirmStep ? (
              <button
                type="button"
                onClick={() => setConfirmStep(true)}
                className="btn-interactive w-full py-2.5 px-4 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-[10px] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Saved Data...</span>
              </button>
            ) : (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[12px] space-y-3">
                <p className="text-xs font-semibold text-rose-900">
                  Confirm permanent deletion? This cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setConfirmStep(false)}
                    className="btn-interactive flex-1 py-2 px-3 text-xs font-semibold text-[#182230] bg-white border border-[#E5EAF0] rounded-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handlePurge}
                    className="btn-interactive flex-1 py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-[10px] disabled:opacity-60 cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Erase Everything'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
