import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import { ResumeVersion, StructuredResume, DiffItem } from '../types/resume';
import { BeforeAfterCompareView } from './BeforeAfterCompareView';
import {
  applyDiffToStructuredResume,
  applyAllDiffsToResume,
} from '../utils/resumeDiff';

const ORIGINAL_BASELINE_ID = '__original_baseline__';

interface VersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ResumeVersion[];
  currentVersion: ResumeVersion;
  onSelectVersion: (v: ResumeVersion) => void;
  onUpdateVersionDataAndDiffs?: (
    versionId: string,
    nextData: StructuredResume,
    nextDiffs: DiffItem[]
  ) => void;
}

export const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onSelectVersion,
  onUpdateVersionDataAndDiffs,
}) => {
  const [rightVersionId, setRightVersionId] = useState<string>(currentVersion.id);
  const [leftVersionId, setLeftVersionId] = useState<string>(() => {
    if (currentVersion.diffItems && currentVersion.diffItems.length > 0) {
      return ORIGINAL_BASELINE_ID;
    }
    const other = versions.find((v) => v.id !== currentVersion.id);
    return other?.id || ORIGINAL_BASELINE_ID;
  });

  // Sync defaults when opening or changing active version
  useEffect(() => {
    if (!isOpen) return;
    setRightVersionId(currentVersion.id);
    if (
      (currentVersion.diffItems && currentVersion.diffItems.length > 0) ||
      !currentVersion.isOriginal
    ) {
      setLeftVersionId(ORIGINAL_BASELINE_ID);
    } else {
      const other = versions.find((v) => v.id !== currentVersion.id);
      setLeftVersionId(other?.id || ORIGINAL_BASELINE_ID);
    }
  }, [isOpen, currentVersion.id, currentVersion.diffItems?.length, currentVersion.isOriginal, versions]);

  // Close on Escape key press & lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rightVersion = versions.find((v) => v.id === rightVersionId) || currentVersion;
  const isComparingAgainstOriginal = leftVersionId === ORIGINAL_BASELINE_ID;
  const leftVersion = isComparingAgainstOriginal
    ? null
    : versions.find((v) => v.id === leftVersionId) || versions[0] || currentVersion;

  const handleAcceptRejectDiff = (diffId: string, action: 'accepted' | 'rejected') => {
    if (!onUpdateVersionDataAndDiffs) return;
    const targetDiff = rightVersion.diffItems.find((d) => d.id === diffId);
    if (!targetDiff) return;

    const nextDiffs = rightVersion.diffItems.map((d) =>
      d.id === diffId ? { ...d, status: action } : d
    );
    const nextData = applyDiffToStructuredResume(
      rightVersion.structuredData,
      rightVersion.originalStructuredData,
      targetDiff,
      action
    );
    onUpdateVersionDataAndDiffs(rightVersion.id, nextData, nextDiffs);
  };

  const handleAcceptAll = () => {
    if (!onUpdateVersionDataAndDiffs) return;
    const { nextData, nextDiffs } = applyAllDiffsToResume(
      rightVersion.structuredData,
      rightVersion.originalStructuredData,
      rightVersion.diffItems,
      'accepted'
    );
    onUpdateVersionDataAndDiffs(rightVersion.id, nextData, nextDiffs);
  };

  const handleRejectAll = () => {
    if (!onUpdateVersionDataAndDiffs) return;
    const { nextData, nextDiffs } = applyAllDiffsToResume(
      rightVersion.structuredData,
      rightVersion.originalStructuredData,
      rightVersion.diffItems,
      'rejected'
    );
    onUpdateVersionDataAndDiffs(rightVersion.id, nextData, nextDiffs);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-xl border border-[#E5EAF0] w-full max-w-6xl overflow-hidden flex flex-col h-[94dvh] sm:h-[90dvh] text-[#182230]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3 bg-[#F7F9FC] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#173B65] text-white flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#173B65] truncate">
                Before-and-After Resume Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Inspect added keywords, rewritten bullets, and deleted phrasing — and accept or reject any change individually.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors shrink-0"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-[#E5EAF0] divide-y sm:divide-y-0 sm:divide-x divide-[#E5EAF0] bg-[#F7F9FC] p-3 shrink-0">
          <div className="px-2 sm:px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Left (Before):</span>
              <select
                value={leftVersionId}
                onChange={(e) => setLeftVersionId(e.target.value)}
                className="text-xs bg-white border border-[#E5EAF0] rounded-[8px] px-2.5 py-1.5 font-medium text-[#182230] focus:outline-none focus:border-[#3978B8] truncate max-w-full min-w-0 flex-1"
              >
                <option value={ORIGINAL_BASELINE_ID}>
                  Original CV Baseline (Before AI)
                </option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
            {leftVersion && (
              <button
                type="button"
                onClick={() => {
                  onSelectVersion(leftVersion);
                  onClose();
                }}
                className="btn-interactive px-2.5 py-1 text-[11px] font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] rounded-[8px] border border-[#E5EAF0] whitespace-nowrap shrink-0"
              >
                Open Left CV
              </button>
            )}
          </div>

          <div className="px-2 sm:px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Right (After):</span>
              <select
                value={rightVersionId}
                onChange={(e) => setRightVersionId(e.target.value)}
                className="text-xs bg-white border border-[#E5EAF0] rounded-[8px] px-2.5 py-1.5 font-medium text-[#182230] focus:outline-none focus:border-[#3978B8] truncate max-w-full min-w-0 flex-1"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectVersion(rightVersion);
                onClose();
              }}
              className="btn-interactive px-2.5 py-1 text-[11px] font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[8px] whitespace-nowrap shrink-0"
            >
              Open Right CV
            </button>
          </div>
        </div>

        {/* Interactive Diff & Highlight Body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isComparingAgainstOriginal ? (
            <BeforeAfterCompareView
              originalData={rightVersion.originalStructuredData}
              currentData={rightVersion.structuredData}
              diffItems={rightVersion.diffItems}
              identifiedKeywords={rightVersion.identifiedKeywordsToAdd}
              leftLabel="Original CV (Before AI)"
              rightLabel={`Optimized CV · ${rightVersion.title}`}
              onAcceptRejectDiff={onUpdateVersionDataAndDiffs ? handleAcceptRejectDiff : undefined}
              onAcceptAll={onUpdateVersionDataAndDiffs ? handleAcceptAll : undefined}
              onRejectAll={onUpdateVersionDataAndDiffs ? handleRejectAll : undefined}
            />
          ) : (
            <BeforeAfterCompareView
              originalData={leftVersion!.structuredData}
              currentData={rightVersion.structuredData}
              compareOnlyData={rightVersion.structuredData}
              diffItems={[]}
              identifiedKeywords={
                rightVersion.identifiedKeywordsToAdd ||
                leftVersion?.identifiedKeywordsToAdd ||
                []
              }
              leftLabel={leftVersion!.title}
              rightLabel={rightVersion.title}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 bg-[#F7F9FC] border-t border-[#E5EAF0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            Changes accepted or rejected here immediately update your saved resume version.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-interactive px-4 py-1.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] transition-colors shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
