import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  RotateCcw,
  Plus,
  Clock,
  Eye,
  ArrowLeftRight,
  Check,
} from 'lucide-react';
import { ResumeVersion, ResumeSnapshot } from '../types/resume';
import { BeforeAfterCompareView } from './BeforeAfterCompareView';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: ResumeVersion;
  onCreateSnapshot: (label: string, note?: string) => void;
  onRestoreSnapshot: (snapshot: ResumeSnapshot) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  version,
  onCreateSnapshot,
  onRestoreSnapshot,
}) => {
  const snapshots = version.snapshots || [];
  const [selectedSnapId, setSelectedSnapId] = useState<string>(
    snapshots[0]?.id || 'original-baseline'
  );
  const [checkpointLabel, setCheckpointLabel] = useState<string>('');
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'diff' | 'summary'>('diff');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSnapId(snapshots[0]?.id || 'original-baseline');
  }, [isOpen, version.id]);

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

  const syntheticBaseline: ResumeSnapshot = {
    id: 'original-baseline',
    timestamp: version.createdAt,
    label: 'Initial Baseline',
    note: 'Original structure when this CV version was first created or imported.',
    structuredData: version.originalStructuredData,
    latexSource: version.originalLatex,
    estimatedScore: version.atsReport?.originalScore,
  };

  const allSnapshots: ResumeSnapshot[] = [...snapshots, syntheticBaseline];
  const selectedSnapshot =
    allSnapshots.find((s) => s.id === selectedSnapId) || syntheticBaseline;

  const handleSaveCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    const label =
      checkpointLabel.trim() ||
      `Manual Checkpoint (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    onCreateSnapshot(label, 'Saved manually from Version History');
    setCheckpointLabel('');
  };

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
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
              <History className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#173B65] truncate">
                Resume Version History · {version.title}
              </h3>
              <p className="text-xs text-slate-500">
                Inspect saved checkpoints over time, compare against your live draft, or restore any earlier revision.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors shrink-0"
            aria-label="Close version history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Checkpoint Form Bar */}
        <form
          onSubmit={handleSaveCheckpoint}
          className="px-5 sm:px-6 py-3 bg-white border-b border-[#E5EAF0] flex flex-wrap items-center justify-between gap-3 shrink-0"
        >
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0 sm:min-w-[260px]">
            <input
              type="text"
              value={checkpointLabel}
              onChange={(e) => setCheckpointLabel(e.target.value)}
              placeholder="Checkpoint label (e.g. Before Stripe PM tailoring)"
              className="flex-1 min-w-[180px] text-xs px-3 py-2 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] focus:outline-none text-[#182230]"
            />
            <button
              type="submit"
              className="btn-interactive px-3.5 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current Checkpoint</span>
            </button>
          </div>

          <div className="inline-flex rounded-[10px] border border-[#E5EAF0] bg-[#F7F9FC] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                viewMode === 'diff'
                  ? 'bg-[#173B65] text-white'
                  : 'text-slate-600 hover:text-[#173B65]'
              }`}
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Diff vs. Live</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                viewMode === 'summary'
                  ? 'bg-[#173B65] text-white'
                  : 'text-slate-600 hover:text-[#173B65]'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Snapshot Outline</span>
            </button>
          </div>
        </form>

        {/* Main Split Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Timeline Sidebar */}
          <aside className="w-full md:w-80 max-h-40 md:max-h-none border-b md:border-b-0 md:border-r border-[#E5EAF0] bg-[#F7F9FC] overflow-y-auto p-3 sm:p-4 space-y-2.5 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              Checkpoints ({allSnapshots.length})
            </div>

            {allSnapshots.map((snap, idx) => {
              const isSelected = snap.id === selectedSnapshot.id;
              return (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapId(snap.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSnapId(snap.id);
                    }
                  }}
                  className={`p-3 rounded-[12px] border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-white border-[#3978B8] ring-1 ring-[#3978B8]/25'
                      : 'bg-white border-[#E5EAF0] hover:border-[#3978B8]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#173B65] leading-snug">
                      {snap.label}
                    </span>
                    {idx === 0 && snapshots.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
                        Latest
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{formatTimestamp(snap.timestamp)}</span>
                    {typeof snap.estimatedScore === 'number' && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">
                          Est. {snap.estimatedScore}%
                        </span>
                      </>
                    )}
                  </div>

                  {snap.note && (
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {snap.note}
                    </p>
                  )}

                  <div className="pt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreSnapshot(snap);
                        setRestoredId(snap.id);
                        setTimeout(() => setRestoredId(null), 2000);
                      }}
                      className="btn-interactive px-2.5 py-1 text-[11px] font-semibold text-[#173B65] bg-[#F7F9FC] hover:bg-[#173B65] hover:text-white border border-[#E5EAF0] rounded-[8px] flex items-center gap-1 transition-colors whitespace-nowrap"
                    >
                      {restoredId === snap.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Restored</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </aside>

          {/* Right: Snapshot Diff vs Live or Snapshot Outline */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {viewMode === 'diff' ? (
              <BeforeAfterCompareView
                originalData={selectedSnapshot.structuredData}
                currentData={version.structuredData}
                compareOnlyData={version.structuredData}
                diffItems={[]}
                identifiedKeywords={version.identifiedKeywordsToAdd}
                leftLabel={`Snapshot · ${selectedSnapshot.label}`}
                rightLabel={`Live Resume · ${version.title}`}
              />
            ) : (
              <div className="h-full overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#F7F9FC]">
                <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-5 space-y-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Snapshot Headline &amp; Summary
                    </div>
                    <h4 className="text-sm font-bold text-[#173B65] mt-1">
                      {selectedSnapshot.structuredData.targetRoleHeadline}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedSnapshot.structuredData.summary || 'No summary recorded in this checkpoint.'}
                  </p>
                </div>

                <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Experience ({selectedSnapshot.structuredData.experience.length})
                  </div>
                  {selectedSnapshot.structuredData.experience.length === 0 ? (
                    <p className="text-xs text-slate-500">No experience entries recorded in this checkpoint.</p>
                  ) : (
                    selectedSnapshot.structuredData.experience.map((exp) => (
                      <div key={exp.id} className="space-y-1 pt-2 first:pt-0 border-t first:border-t-0 border-[#E5EAF0]">
                        <div className="text-xs font-bold text-[#173B65]">
                          {exp.role} · {exp.company} ({exp.startDate} – {exp.endDate})
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-5 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Skills ({selectedSnapshot.structuredData.skills.length} categories)
                  </div>
                  {selectedSnapshot.structuredData.skills.length === 0 ? (
                    <p className="text-xs text-slate-500">No skills recorded in this checkpoint.</p>
                  ) : (
                    selectedSnapshot.structuredData.skills.map((s) => (
                      <div key={s.id} className="text-xs text-slate-700">
                        <strong className="text-[#173B65]">{s.category}:</strong>{' '}
                        {s.items.join(', ')}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
