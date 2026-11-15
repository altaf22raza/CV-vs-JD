import React, { useMemo, useState } from 'react';
import {
  Check,
  X,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Tag,
  Eye,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { StructuredResume, DiffItem, IdentifiedKeyword } from '../types/resume';
import {
  computeWordDiff,
  generateDetailedDiffItems,
  WordDiffToken,
} from '../utils/resumeDiff';

interface BeforeAfterCompareViewProps {
  originalData: StructuredResume;
  currentData: StructuredResume;
  diffItems: DiffItem[];
  identifiedKeywords?: IdentifiedKeyword[];
  leftLabel?: string;
  rightLabel?: string;
  onAcceptRejectDiff?: (diffId: string, action: 'accepted' | 'rejected') => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  compareOnlyData?: StructuredResume;
}

const TokenLine: React.FC<{ tokens: WordDiffToken[]; side: 'left' | 'right' }> = ({
  tokens,
  side,
}) => {
  return (
    <span>
      {tokens.map((tok, i) => {
        const space = i < tokens.length - 1 ? ' ' : '';
        if (side === 'left') {
          if (tok.type === 'removed') {
            return (
              <React.Fragment key={i}>
                <span className="bg-rose-100 text-rose-900 line-through decoration-rose-500 px-0.5 rounded-xs">
                  {tok.text}
                </span>
                {space}
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={i}>
              <span>{tok.text}</span>
              {space}
            </React.Fragment>
          );
        } else {
          if (tok.type === 'keyword') {
            return (
              <React.Fragment key={i}>
                <span
                  className="bg-emerald-100 text-emerald-950 font-semibold px-1 py-px rounded-xs ring-1 ring-emerald-300/80"
                  title="Added JD keyword"
                >
                  {tok.text}
                </span>
                {space}
              </React.Fragment>
            );
          }
          if (tok.type === 'added') {
            return (
              <React.Fragment key={i}>
                <span
                  className="bg-amber-100/90 text-slate-900 font-medium px-0.5 rounded-xs"
                  title="Rewritten / added phrasing"
                >
                  {tok.text}
                </span>
                {space}
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={i}>
              <span>{tok.text}</span>
              {space}
            </React.Fragment>
          );
        }
      })}
    </span>
  );
};

export const BeforeAfterCompareView: React.FC<BeforeAfterCompareViewProps> = ({
  originalData,
  currentData,
  diffItems,
  identifiedKeywords = [],
  leftLabel = 'Original CV',
  rightLabel = 'Optimized CV (Your Final Resume)',
  onAcceptRejectDiff,
  onAcceptAll,
  onRejectAll,
  compareOnlyData,
}) => {
  const [showChangesOnly, setShowChangesOnly] = useState<boolean>(false);

  const isReadOnlyCompare = Boolean(compareOnlyData) || !onAcceptRejectDiff;
  const keywordStrings = useMemo(
    () => identifiedKeywords.map((k) => k.keyword),
    [identifiedKeywords]
  );

  // When comparing two arbitrary versions without shared diffItems, synthesize read-only diffs
  const effectiveDiffs = useMemo(() => {
    if (compareOnlyData) {
      return generateDetailedDiffItems(originalData, compareOnlyData, [], identifiedKeywords);
    }
    return diffItems;
  }, [compareOnlyData, originalData, diffItems, identifiedKeywords]);

  // Fast lookups by section & indices
  const findDiff = (
    section: DiffItem['section'],
    entryIndex?: number,
    bulletIndex?: number
  ): DiffItem | undefined => {
    return effectiveDiffs.find((d) => {
      if (d.section !== section) return false;
      if (typeof entryIndex === 'number' && d.entryIndex !== entryIndex) return false;
      if (typeof bulletIndex === 'number' && d.bulletIndex !== bulletIndex) return false;
      return true;
    });
  };

  // Fallback text-based diff lookup if AI returned diffs without entryIndex/bulletIndex
  const findBulletDiff = (
    section: 'experience' | 'projects',
    entryIndex: number,
    bulletIndex: number,
    origBullet: string
  ): DiffItem | undefined => {
    const exact = findDiff(section, entryIndex, bulletIndex);
    if (exact) return exact;
    return effectiveDiffs.find(
      (d) =>
        d.section === section &&
        d.originalText.trim() === origBullet.trim()
    );
  };

  const pendingCount = effectiveDiffs.filter((d) => d.status === 'pending').length;
  const acceptedCount = effectiveDiffs.filter((d) => d.status === 'accepted').length;
  const rejectedCount = effectiveDiffs.filter((d) => d.status === 'rejected').length;

  const renderDiffControls = (diff: DiffItem) => {
    if (isReadOnlyCompare || !onAcceptRejectDiff) {
      return (
        <span className="text-[11px] font-semibold text-amber-800 whitespace-nowrap shrink-0">
          Modified
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {diff.status === 'pending' && (
          <span className="text-[10.5px] font-semibold text-amber-700 mr-1 whitespace-nowrap">
            Pending Review
          </span>
        )}
        {diff.status === 'accepted' && (
          <span className="text-[10.5px] font-semibold text-emerald-700 mr-1 whitespace-nowrap">
            Accepted
          </span>
        )}
        {diff.status === 'rejected' && (
          <span className="text-[10.5px] font-semibold text-slate-500 mr-1 whitespace-nowrap">
            Kept Original
          </span>
        )}

        <button
          type="button"
          onClick={() => onAcceptRejectDiff(diff.id, 'accepted')}
          className={`px-2 py-1 rounded-[8px] text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
            diff.status === 'accepted'
              ? 'bg-[#173B65] text-white'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
          title="Use this AI suggestion in final resume"
        >
          <Check className="w-3 h-3" />
          <span>{diff.status === 'accepted' ? 'Accepted' : 'Accept'}</span>
        </button>

        <button
          type="button"
          onClick={() => onAcceptRejectDiff(diff.id, 'rejected')}
          className={`px-2 py-1 rounded-[8px] text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
            diff.status === 'rejected'
              ? 'bg-slate-700 text-white'
              : 'bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-[#E5EAF0]'
          }`}
          title="Reject AI change and keep original wording"
        >
          <X className="w-3 h-3" />
          <span>{diff.status === 'rejected' ? 'Rejected' : 'Reject'}</span>
        </button>
      </div>
    );
  };

  // Helper to render a paired diff row (Left = Original, Right = Controlled Optimized)
  const renderSectionPair = (
    title: string,
    origText: string,
    activeRightText: string,
    diff?: DiffItem,
    isBullet: boolean = false
  ) => {
    if (showChangesOnly && !diff) return null;

    const proposedRightText = diff ? diff.optimizedText : activeRightText;
    const isDeletedProposal = Boolean(diff && diff.originalText && !diff.optimizedText);
    const isAddedProposal = Boolean(diff && !diff.originalText && diff.optimizedText);

    const { leftTokens, rightTokens, addedKeywordsInText } = diff
      ? computeWordDiff(diff.originalText, diff.optimizedText, keywordStrings)
      : {
          leftTokens: origText ? [{ text: origText, type: 'equal' as const }] : [],
          rightTokens: activeRightText ? [{ text: activeRightText, type: 'equal' as const }] : [],
          addedKeywordsInText: [],
        };

    const rightBoxClasses = !diff
      ? 'bg-white border-[#E5EAF0]'
      : diff.status === 'accepted'
        ? 'bg-emerald-50/40 border-emerald-300'
        : diff.status === 'rejected'
          ? 'bg-[#F7F9FC] border-[#E5EAF0]'
          : 'bg-amber-50/35 border-amber-300';

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        {/* LEFT: ORIGINAL CV */}
        <div
          className={`rounded-[12px] border p-3.5 text-xs leading-relaxed ${
            diff
              ? 'bg-rose-50/20 border-rose-200/80'
              : 'bg-white border-[#E5EAF0]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {isDeletedProposal && (
              <span className="text-[10.5px] font-semibold text-rose-700">
                Proposed Deletion
              </span>
            )}
            {isAddedProposal && (
              <span className="text-[10.5px] font-medium text-slate-400">
                Not in original
              </span>
            )}
          </div>

          {isAddedProposal ? (
            <p className="text-slate-400 italic">No corresponding bullet in original CV.</p>
          ) : diff ? (
            <div className="text-[#182230]">
              {isBullet && <span className="text-slate-400 mr-1.5">•</span>}
              <TokenLine tokens={leftTokens} side="left" />
            </div>
          ) : (
            <div className="text-slate-700">
              {isBullet && <span className="text-slate-400 mr-1.5">•</span>}
              {origText}
            </div>
          )}
        </div>

        {/* RIGHT: OPTIMIZED / FINAL USER-CONTROLLED CV */}
        <div className={`rounded-[12px] border p-3.5 text-xs leading-relaxed flex flex-col justify-between gap-2 ${rightBoxClasses}`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#173B65]">
                  {title}
                </span>
                {diff && isBullet && (
                  <span className="text-[10.5px] font-semibold text-amber-800">
                    {isAddedProposal
                      ? 'New Bullet'
                      : isDeletedProposal
                        ? 'Removal Suggested'
                        : 'Rewritten Bullet'}
                  </span>
                )}
              </div>
              {diff && renderDiffControls(diff)}
            </div>

            {diff ? (
              diff.status === 'rejected' ? (
                <div className="text-slate-700">
                  {origText ? (
                    <>
                      {isBullet && <span className="text-slate-400 mr-1.5">•</span>}
                      <span>{origText}</span>
                    </>
                  ) : (
                    <span className="italic text-slate-400">
                      AI bullet omitted (original preserved).
                    </span>
                  )}
                </div>
              ) : isDeletedProposal ? (
                <p className="text-rose-700 italic">
                  Deleted in AI draft — click &quot;Reject&quot; to keep original bullet in your final resume.
                </p>
              ) : (
                <div className="text-[#182230]">
                  {isBullet && <span className="text-[#3978B8] font-bold mr-1.5">•</span>}
                  <TokenLine tokens={rightTokens} side="right" />
                </div>
              )
            ) : (
              <div className="text-slate-700">
                {isBullet && <span className="text-slate-400 mr-1.5">•</span>}
                {activeRightText}
              </div>
            )}
          </div>

          {diff && (diff.reason || addedKeywordsInText.length > 0) && (
            <div className="pt-1.5 border-t border-[#E5EAF0] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <span className="leading-snug">{diff.reason}</span>
              {addedKeywordsInText.length > 0 && diff.status !== 'rejected' && (
                <span className="text-emerald-800 font-semibold whitespace-nowrap">
                  Keywords: {addedKeywordsInText.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const headlineDiff = findDiff('headline');
  const summaryDiff = findDiff('summary');

  const maxExpCount = Math.max(
    originalData.experience.length,
    currentData.experience.length
  );
  const maxProjCount = Math.max(
    originalData.projects.length,
    currentData.projects.length
  );
  const maxSkillCount = Math.max(
    originalData.skills.length,
    currentData.skills.length
  );

  return (
    <div className="flex flex-col h-full bg-[#F7F9FC] text-[#182230]">
      {/* Control & Legend Header */}
      <div className="bg-white border-b border-[#E5EAF0] px-4 sm:px-5 py-3 shrink-0 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-bold text-[#173B65]">
                Before &amp; After Comparison
              </h2>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                {effectiveDiffs.length} {effectiveDiffs.length === 1 ? 'change' : 'changes'} detected
              </span>
              {!isReadOnlyCompare && effectiveDiffs.length > 0 && (
                <>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-mono tabular-nums text-amber-700 font-semibold">
                    {pendingCount} pending
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-mono tabular-nums text-emerald-700 font-semibold">
                    {acceptedCount} accepted
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {rejectedCount} kept original
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review every proposed rewrite individually. Only suggestions you accept are applied to your final CV.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowChangesOnly((prev) => !prev)}
              className={`btn-interactive px-3 py-1.5 text-xs font-semibold rounded-[10px] border flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                showChangesOnly
                  ? 'bg-[#173B65] text-white border-[#173B65]'
                  : 'bg-white text-[#182230] border-[#E5EAF0] hover:bg-[#F7F9FC]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showChangesOnly ? 'Showing Changes Only' : 'Show Changes Only'}</span>
            </button>

            {!isReadOnlyCompare && effectiveDiffs.length > 0 && onAcceptAll && onRejectAll && (
              <>
                <button
                  type="button"
                  onClick={onAcceptAll}
                  className="btn-interactive px-3 py-1.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Accept All Suggestions</span>
                </button>
                <button
                  type="button"
                  onClick={onRejectAll}
                  className="btn-interactive px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reject All (Keep Original)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Highlight Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap pt-2 border-t border-[#E5EAF0]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block bg-rose-100 text-rose-900 line-through decoration-rose-500 px-1.5 py-0.5 rounded-xs font-medium">
              Removed / Modified
            </span>
            <span>Original phrasing changed or deleted</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block bg-amber-100 text-[#182230] px-1.5 py-0.5 rounded-xs font-medium">
              Rewritten Phrasing
            </span>
            <span>AI bullet &amp; wording edits</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block bg-emerald-100 text-emerald-950 ring-1 ring-emerald-300 px-1.5 py-0.5 rounded-xs font-semibold">
              Added Keyword
            </span>
            <span>New JD terms introduced</span>
          </span>
        </div>
      </div>

      {/* Column Headers (Sticky) */}
      <div className="hidden lg:grid grid-cols-2 gap-3 px-6 py-2 bg-[#F7F9FC] border-b border-[#E5EAF0] text-xs font-bold uppercase tracking-wider shrink-0">
        <div className="text-slate-600 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>{leftLabel}</span>
        </div>
        <div className="text-[#173B65] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#3978B8]" />
          <span>{rightLabel}</span>
        </div>
      </div>

      {/* Scrollable Comparison Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {effectiveDiffs.length === 0 && (
          <div className="bg-white border border-dashed border-[#E5EAF0] rounded-[14px] p-6 text-center space-y-1.5">
            <AlertCircle className="w-6 h-6 text-[#3978B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#173B65]">
              No differences detected between these two versions
            </h3>
            <p className="text-xs text-slate-500">
              Run &quot;Optimize for JD&quot; or select a different version to inspect word-level additions, rewritten bullets, and suggested edits.
            </p>
          </div>
        )}

        {/* Headline & Summary */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Headline &amp; Executive Summary
          </h3>
          {renderSectionPair(
            'Target Role Headline',
            originalData.targetRoleHeadline,
            currentData.targetRoleHeadline,
            headlineDiff
          )}
          {renderSectionPair(
            'Professional Summary',
            originalData.summary,
            currentData.summary,
            summaryDiff
          )}
        </section>

        {/* Experience */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Experience Bullets
          </h3>

          {Array.from({ length: maxExpCount }).map((_, eIdx) => {
            const origExp = originalData.experience[eIdx];
            const curExp = currentData.experience[eIdx];
            const roleHeader = `${(curExp || origExp)?.role || 'Role'} · ${(curExp || origExp)?.company || ''}`;

            const expDiffsForRole = effectiveDiffs.filter(
              (d) => d.section === 'experience' && d.entryIndex === eIdx
            );

            if (showChangesOnly && expDiffsForRole.length === 0) {
              return null;
            }

            const origBullets = origExp?.bullets || [];
            const curBullets = curExp?.bullets || [];
            const maxB = Math.max(
              origBullets.length,
              curBullets.length,
              ...expDiffsForRole.map((d) => (typeof d.bulletIndex === 'number' ? d.bulletIndex + 1 : 0))
            );

            return (
              <div key={(origExp || curExp)?.id || eIdx} className="space-y-2">
                <div className="text-xs font-bold text-[#1E2B3E] pt-1">
                  {roleHeader}
                </div>
                <div className="space-y-2">
                  {Array.from({ length: maxB }).map((__, bIdx) => {
                    const origB = origBullets[bIdx] || '';
                    const curB = curBullets[bIdx] || '';
                    const diff = findBulletDiff('experience', eIdx, bIdx, origB);
                    if (!origB && !curB && !diff) return null;
                    return (
                      <React.Fragment key={`${eIdx}-${bIdx}`}>
                        {renderSectionPair(
                          `Bullet ${bIdx + 1}`,
                          origB,
                          curB,
                          diff,
                          true
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Projects */}
        {maxProjCount > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Projects
            </h3>
            {Array.from({ length: maxProjCount }).map((_, pIdx) => {
              const origProj = originalData.projects[pIdx];
              const curProj = currentData.projects[pIdx];
              const projTitle = (curProj || origProj)?.title || `Project ${pIdx + 1}`;
              const projDiffs = effectiveDiffs.filter(
                (d) => d.section === 'projects' && d.entryIndex === pIdx
              );
              if (showChangesOnly && projDiffs.length === 0) return null;

              const origBullets = origProj?.bullets || [];
              const curBullets = curProj?.bullets || [];
              const maxB = Math.max(
                origBullets.length,
                curBullets.length,
                ...projDiffs.map((d) => (typeof d.bulletIndex === 'number' ? d.bulletIndex + 1 : 0))
              );

              return (
                <div key={(origProj || curProj)?.id || pIdx} className="space-y-2">
                  <div className="text-xs font-bold text-[#1E2B3E] pt-1">{projTitle}</div>
                  <div className="space-y-2">
                    {Array.from({ length: maxB }).map((__, bIdx) => {
                      const origB = origBullets[bIdx] || '';
                      const curB = curBullets[bIdx] || '';
                      const diff = findBulletDiff('projects', pIdx, bIdx, origB);
                      if (!origB && !curB && !diff) return null;
                      return (
                        <React.Fragment key={`proj-${pIdx}-${bIdx}`}>
                          {renderSectionPair(
                            `Project Bullet ${bIdx + 1}`,
                            origB,
                            curB,
                            diff,
                            true
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Skills */}
        {maxSkillCount > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Skills &amp; Added Keywords
            </h3>
            <div className="space-y-2">
              {Array.from({ length: maxSkillCount }).map((_, sIdx) => {
                const origSkill = originalData.skills[sIdx];
                const curSkill = currentData.skills[sIdx];
                const diff = findDiff('skills', sIdx);
                if (showChangesOnly && !diff) return null;

                const catName =
                  (curSkill || origSkill)?.category || `Skill Category ${sIdx + 1}`;
                const origItems = origSkill?.items || [];
                const proposedItems = diff
                  ? diff.optimizedText
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : curSkill?.items || [];
                const origSet = new Set(origItems.map((i) => i.toLowerCase()));
                const activeItems =
                  diff?.status === 'rejected'
                    ? origItems
                    : diff
                      ? proposedItems
                      : curSkill?.items || [];
                const rightSet = new Set(activeItems.map((i) => i.toLowerCase()));

                return (
                  <div
                    key={(origSkill || curSkill)?.id || sIdx}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch"
                  >
                    {/* Left: Original Skills */}
                    <div
                      className={`rounded-lg border p-3 text-xs ${
                        diff ? 'bg-rose-50/20 border-rose-200/80' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        {catName}
                      </div>
                      {origItems.length === 0 ? (
                        <span className="italic text-slate-400">None in original</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {origItems.map((item, idx) => {
                            const wasRemoved = diff && !rightSet.has(item.toLowerCase());
                            return (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[11px] ${
                                  wasRemoved
                                    ? 'bg-rose-100 text-rose-900 line-through decoration-rose-500'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Optimized Skills with highlighted additions */}
                    <div
                      className={`rounded-lg border p-3 text-xs space-y-2 ${
                        !diff
                          ? 'bg-white border-slate-200'
                          : diff.status === 'accepted'
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : diff.status === 'rejected'
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-amber-50/35 border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#1E2B3E] flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-[#1D5A3A]" />
                          <span>{catName}</span>
                        </span>
                        {diff && renderDiffControls(diff)}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {activeItems.map((item, idx) => {
                          const isNewlyAdded =
                            diff?.status !== 'rejected' && !origSet.has(item.toLowerCase());
                          return (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                isNewlyAdded
                                  ? 'bg-emerald-100 text-emerald-950 font-semibold ring-1 ring-emerald-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isNewlyAdded ? `+ ${item}` : item}
                            </span>
                          );
                        })}
                      </div>

                      {diff?.reason && (
                        <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/70">
                          {diff.reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
