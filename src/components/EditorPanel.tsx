import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  Check,
  X,
  CheckCheck,
  Plus,
  Trash2,
  Wand2,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Cpu,
  Award,
  Tag,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { StructuredResume, DiffItem, IdentifiedKeyword } from '../types/resume';
import { apiRewriteSection } from '../services/geminiClient';
import { useAuth } from '../firebase/AuthContext';
import {
  applyDiffToStructuredResume,
  applyAllDiffsToResume,
  computeWordDiff,
} from '../utils/resumeDiff';

interface EditorPanelProps {
  data: StructuredResume;
  originalData: StructuredResume;
  diffItems: DiffItem[];
  identifiedKeywords?: IdentifiedKeyword[];
  onUpdateData: (newData: StructuredResume) => void;
  onUpdateDiffItems: (newDiffs: DiffItem[]) => void;
  onApplyDataAndDiffs?: (newData: StructuredResume, newDiffs: DiffItem[]) => void;
  onRestoreOriginal: () => void;
  onAddKeywordToSkills: (keyword: string, category?: string) => void;
  onOpenBeforeAfterCompare?: () => void;
  onRequireAuth?: (title: string, proceed: () => void) => void;
  jdText?: string;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  data,
  originalData,
  diffItems,
  identifiedKeywords = [],
  onUpdateData,
  onUpdateDiffItems,
  onApplyDataAndDiffs,
  onRestoreOriginal,
  onAddKeywordToSkills,
  onOpenBeforeAfterCompare,
  onRequireAuth,
  jdText,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'keywords' | 'diff' | 'summary' | 'experience' | 'skills' | 'projects' | 'education' | 'certifications'
  >(diffItems.length > 0 ? 'diff' : identifiedKeywords.length > 0 ? 'keywords' : 'summary');
  const [sectionPrompt, setSectionPrompt] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const commitDataAndDiffs = (nextData: StructuredResume, nextDiffs: DiffItem[]) => {
    if (onApplyDataAndDiffs) {
      onApplyDataAndDiffs(nextData, nextDiffs);
    } else {
      onUpdateData(nextData);
      onUpdateDiffItems(nextDiffs);
    }
  };

  // Apply or reject individual diff item across all sections
  const handleDiffAction = (id: string, action: 'accepted' | 'rejected') => {
    const targetDiff = diffItems.find((d) => d.id === id);
    if (!targetDiff) return;

    const updatedDiffs = diffItems.map((d) => (d.id === id ? { ...d, status: action } : d));
    const nextData = applyDiffToStructuredResume(data, originalData, targetDiff, action);
    commitDataAndDiffs(nextData, updatedDiffs);
  };

  const handleAcceptAll = () => {
    const { nextData, nextDiffs } = applyAllDiffsToResume(data, originalData, diffItems, 'accepted');
    commitDataAndDiffs(nextData, nextDiffs);
  };

  const handleRejectAll = () => {
    const { nextData, nextDiffs } = applyAllDiffsToResume(data, originalData, diffItems, 'rejected');
    commitDataAndDiffs(nextData, nextDiffs);
  };

  const executeAiRewriteSection = async (sectionKey: string, currentContent: string) => {
    if (!sectionPrompt.trim()) return;
    setIsRewriting(true);
    setRewriteError(null);
    try {
      const res = await apiRewriteSection({
        sectionName: sectionKey,
        currentText: currentContent,
        instruction: sectionPrompt,
        jdText,
      });

      if (sectionKey === 'summary') {
        onUpdateData({ ...data, summary: res.rewrittenText });
      } else if (sectionKey === 'targetRoleHeadline') {
        onUpdateData({ ...data, targetRoleHeadline: res.rewrittenText });
      }
      setSectionPrompt('');
    } catch (err: any) {
      setRewriteError(err?.message || 'Failed to rewrite section');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAiRewriteSection = async (sectionKey: string, currentContent: string) => {
    if (!sectionPrompt.trim()) return;
    if (!user && onRequireAuth) {
      onRequireAuth('Sign In to Use AI Rewrite Assistant', () => {
        void executeAiRewriteSection(sectionKey, currentContent);
      });
      return;
    }
    await executeAiRewriteSection(sectionKey, currentContent);
  };

  const pendingDiffsCount = diffItems.filter((d) => d.status === 'pending').length;

  // Check if a keyword is already in skills
  const isKeywordInSkills = (kw: string) => {
    const lowerKw = kw.toLowerCase().trim();
    return data.skills.some((cat) =>
      cat.items.some(
        (item) => item.toLowerCase().trim() === lowerKw || item.toLowerCase().includes(lowerKw)
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E5EAF0] text-[#182230]">
      {/* Header Tabs */}
      <div className="border-b border-[#E5EAF0] px-3 pt-2.5 bg-[#F7F9FC] shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#173B65] uppercase tracking-wide">
              Resume Editor &amp; Optimizer
            </span>
            {identifiedKeywords.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[8px] flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {identifiedKeywords.length} ATS Keywords
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onRestoreOriginal}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#173B65] transition-colors"
            title="Restore un-optimized original CV"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Original</span>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-xs">
          {identifiedKeywords.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('keywords')}
              className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'keywords'
                  ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                  : 'text-slate-600 hover:text-[#173B65]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-[#3978B8]" />
              <span>ATS Keywords ({identifiedKeywords.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'diff'
                ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rewrites ({diffItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'summary'
                ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'experience'
                ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Experience</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'skills'
                ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Skills</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'projects'
                ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('education')}
            className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'education'
                ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Education</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certifications')}
            className={`px-3 py-1.5 font-medium rounded-t-[10px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'certifications'
                ? 'bg-white text-[#173B65] border-t-2 border-[#3978B8] font-semibold'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certs</span>
          </button>
        </div>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB: IDENTIFIED ATS KEYWORDS */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[12px]">
              <div className="flex items-center gap-2 text-[#173B65] font-semibold text-xs">
                <TrendingUp className="w-4 h-4 text-[#3978B8]" />
                <span>ATS Keywords Identified from Job Description</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                These keywords are high priority in the target JD. Add verified terms directly to your skills or bullet points.
              </p>
            </div>

            {identifiedKeywords.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
                <Tag className="w-7 h-7 text-[#3978B8] mx-auto mb-2 opacity-75" />
                <p className="text-xs font-semibold text-[#173B65]">No target JD keywords loaded yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Run Optimize for JD to extract role-specific skills and domain terminology.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {identifiedKeywords.map((kw, idx) => {
                  const inSkills = isKeywordInSkills(kw.keyword);
                  return (
                    <div
                      key={idx}
                      className="card-interactive p-3 rounded-[12px] border border-[#E5EAF0] bg-white hover:border-[#3978B8] flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#182230]">{kw.keyword}</span>
                          <span className="text-[10px] bg-[#F7F9FC] border border-[#E5EAF0] text-slate-600 px-1.5 py-0.5 rounded-[6px] font-mono">
                            {kw.category}
                          </span>
                          <span className="text-[10px] text-[#173B65] bg-[#F7F9FC] border border-[#E5EAF0] px-1.5 py-0.5 rounded-[6px]">
                            Best section: {kw.suggestedSection}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{kw.reason}</p>
                      </div>

                      <button
                        type="button"
                        disabled={inSkills}
                        onClick={() => onAddKeywordToSkills(kw.keyword, kw.category)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-[8px] transition-colors shrink-0 flex items-center gap-1 self-start ${
                          inSkills
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-[#173B65] text-white hover:bg-[#122F52]'
                        }`}
                      >
                        {inSkills ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>In CV</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add to Skills</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: AI REWRITES */}
        {activeTab === 'diff' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7F9FC] p-2.5 rounded-[12px] border border-[#E5EAF0]">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-[#173B65]">{pendingDiffsCount} pending</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span>Accept or reject individual AI suggestions.</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {onOpenBeforeAfterCompare && (
                  <button
                    type="button"
                    onClick={onOpenBeforeAfterCompare}
                    className="btn-interactive px-2.5 py-1 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] rounded-[8px] border border-[#E5EAF0] whitespace-nowrap"
                  >
                    Full Side-by-Side
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="btn-interactive flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-[8px] border border-emerald-200 whitespace-nowrap"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Accept All</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="btn-interactive flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-[8px] border border-rose-200 whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Keep Original</span>
                </button>
              </div>
            </div>

            {diffItems.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
                <Sparkles className="w-8 h-8 text-[#3978B8] mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-[#173B65]">No active AI changes</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Click &quot;Optimize for JD&quot; in the top bar and paste a Job Description to identify keywords and optimize your CV.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {diffItems.map((item) => {
                  const { leftTokens, rightTokens } = computeWordDiff(
                    item.originalText,
                    item.optimizedText,
                    identifiedKeywords.map((k) => k.keyword)
                  );
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-[12px] border text-xs transition-colors ${
                        item.status === 'accepted'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : item.status === 'rejected'
                          ? 'bg-[#F7F9FC] border-[#E5EAF0] opacity-80'
                          : 'bg-amber-50/25 border-amber-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="font-semibold text-[#173B65] uppercase text-[10.5px] tracking-wider">
                          {item.section}
                          {typeof item.bulletIndex === 'number' ? ` · Bullet ${item.bulletIndex + 1}` : ''}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDiffAction(item.id, 'accepted')}
                            className={`px-2 py-0.5 rounded-[8px] text-[11px] font-medium flex items-center gap-1 transition-colors ${
                              item.status === 'accepted'
                                ? 'bg-[#173B65] text-white'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{item.status === 'accepted' ? 'Accepted' : 'Accept'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDiffAction(item.id, 'rejected')}
                            className={`px-2 py-0.5 rounded-[8px] text-[11px] font-medium flex items-center gap-1 transition-colors ${
                              item.status === 'rejected'
                                ? 'bg-slate-700 text-white'
                                : 'bg-white text-slate-700 hover:bg-[#F7F9FC] border border-[#E5EAF0]'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span>{item.status === 'rejected' ? 'Rejected' : 'Reject'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Word-level Diff comparison view */}
                      <div className="space-y-2 mt-1">
                        <div className="p-2.5 rounded-[10px] bg-rose-50/50 border border-rose-100 text-slate-700 leading-relaxed">
                          <span className="font-semibold text-rose-800 text-[10px] uppercase block mb-0.5">
                            Original:
                          </span>
                          {item.originalText ? (
                            <p>
                              {leftTokens.map((tok, i) => (
                                <React.Fragment key={i}>
                                  {tok.type === 'removed' ? (
                                    <span className="bg-rose-100 text-rose-900 line-through decoration-rose-500 px-0.5 rounded-xs">
                                      {tok.text}
                                    </span>
                                  ) : (
                                    <span>{tok.text}</span>
                                  )}
                                  {i < leftTokens.length - 1 ? ' ' : ''}
                                </React.Fragment>
                              ))}
                            </p>
                          ) : (
                            <p className="italic text-slate-400">Not present in original CV</p>
                          )}
                        </div>

                        <div className="p-2.5 rounded-[10px] bg-emerald-50/50 border border-emerald-100 text-[#182230] leading-relaxed">
                          <span className="font-semibold text-emerald-800 text-[10px] uppercase block mb-0.5">
                            Optimized Suggestion:
                          </span>
                          {item.optimizedText ? (
                            <p className="text-[#182230]">
                              {rightTokens.map((tok, i) => (
                                <React.Fragment key={i}>
                                  {tok.type === 'keyword' ? (
                                    <span className="bg-emerald-100 text-emerald-950 font-semibold px-1 rounded-xs ring-1 ring-emerald-300">
                                      {tok.text}
                                    </span>
                                  ) : tok.type === 'added' ? (
                                    <span className="bg-amber-100 text-[#182230] font-medium px-0.5 rounded-xs">
                                      {tok.text}
                                    </span>
                                  ) : (
                                    <span>{tok.text}</span>
                                  )}
                                  {i < rightTokens.length - 1 ? ' ' : ''}
                                </React.Fragment>
                              ))}
                            </p>
                          ) : (
                            <p className="italic text-rose-700">Proposed for removal from final CV</p>
                          )}
                        </div>
                      </div>

                      {item.reason && (
                        <div className="mt-2 text-[11px] text-slate-600 bg-[#F7F9FC] px-2.5 py-1.5 rounded-[8px] border border-[#E5EAF0]">
                          <strong className="font-semibold text-[#173B65]">Why:</strong> {item.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#182230] mb-1">
                Target Role Headline
              </label>
              <input
                type="text"
                value={data.targetRoleHeadline}
                onChange={(e) => onUpdateData({ ...data, targetRoleHeadline: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#182230]">
                  Professional Summary
                </label>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {data.summary.length} characters
                </span>
              </div>
              <textarea
                rows={7}
                value={data.summary}
                onChange={(e) => onUpdateData({ ...data, summary: e.target.value })}
                className="w-full text-xs p-3 border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
              />
            </div>

            {/* Quick AI Refine tool */}
            <div className="p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[12px] space-y-2.5">
              <span className="text-xs font-semibold text-[#173B65] flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#3978B8]" />
                <span>AI Summary Assistant</span>
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. 'Make it punchier' or 'Emphasize AI/ML thesis'"
                  value={sectionPrompt}
                  onChange={(e) => setSectionPrompt(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:outline-none text-[#182230]"
                />
                <button
                  type="button"
                  onClick={() => handleAiRewriteSection('summary', data.summary)}
                  disabled={isRewriting || !sectionPrompt.trim()}
                  className="btn-interactive px-3.5 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] disabled:opacity-50 whitespace-nowrap"
                >
                  {isRewriting ? 'Rewriting...' : 'Rewrite'}
                </button>
              </div>

              {isRewriting && (
                <div className="space-y-1.5 pt-1" aria-busy="true" aria-label="Rewriting summary">
                  <div className="h-2.5 w-full rounded-[6px] skeleton-block" />
                  <div className="h-2.5 w-5/6 rounded-[6px] skeleton-block" />
                </div>
              )}

              {rewriteError && (
                <div className="text-[11px] text-rose-600">{rewriteError}</div>
              )}
            </div>
          </div>
        )}

        {/* TAB: EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            {data.experience.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                <Briefcase className="w-7 h-7 text-[#3978B8] mx-auto opacity-75" />
                <p className="text-xs font-semibold text-[#173B65]">No experience entries yet</p>
                <p className="text-[11px] text-slate-500">
                  Add work history or internships using the CV Builder to edit bullets here.
                </p>
              </div>
            ) : (
              data.experience.map((exp, expIdx) => (
                <div key={exp.id} className="p-3.5 border border-[#E5EAF0] rounded-[12px] space-y-3 bg-[#F7F9FC]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Role</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...data.experience];
                          updated[expIdx].role = e.target.value;
                          onUpdateData({ ...data, experience: updated });
                        }}
                        className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...data.experience];
                          updated[expIdx].company = e.target.value;
                          onUpdateData({ ...data, experience: updated });
                        }}
                        className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Start Date</label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => {
                          const updated = [...data.experience];
                          updated[expIdx].startDate = e.target.value;
                          onUpdateData({ ...data, experience: updated });
                        }}
                        className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">End Date</label>
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => {
                          const updated = [...data.experience];
                          updated[expIdx].endDate = e.target.value;
                          onUpdateData({ ...data, experience: updated });
                        }}
                        className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Bullets */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 block">Accomplishment Bullets</label>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-1.5 items-start">
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[expIdx].bullets[bIdx] = e.target.value;
                            onUpdateData({ ...data, experience: updated });
                          }}
                          className="flex-1 text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...data.experience];
                            updated[expIdx].bullets.splice(bIdx, 1);
                            onUpdateData({ ...data, experience: updated });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-[8px]"
                          title="Delete bullet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...data.experience];
                        updated[expIdx].bullets.push('');
                        onUpdateData({ ...data, experience: updated });
                      }}
                      className="text-xs text-[#3978B8] hover:text-[#173B65] font-medium flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Bullet Point</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Skills are categorized and comma-separated. Reorder or add keywords to match target requirements.
            </p>
            {data.skills.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                <Cpu className="w-7 h-7 text-[#3978B8] mx-auto opacity-75" />
                <p className="text-xs font-semibold text-[#173B65]">No skill categories added</p>
                <p className="text-[11px] text-slate-500">
                  Add skills in the CV Builder or accept ATS keyword suggestions to populate this section.
                </p>
              </div>
            ) : (
              data.skills.map((skill, sIdx) => (
                <div key={skill.id} className="p-3 border border-[#E5EAF0] rounded-[12px] space-y-1.5 bg-[#F7F9FC]">
                  <label className="text-xs font-semibold text-[#173B65] block">
                    {skill.category}
                  </label>
                  <textarea
                    rows={3}
                    value={skill.items.join(', ')}
                    onChange={(e) => {
                      const updated = [...data.skills];
                      updated[sIdx].items = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      onUpdateData({ ...data, skills: updated });
                    }}
                    className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {data.projects.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                <FolderGit2 className="w-7 h-7 text-[#3978B8] mx-auto opacity-75" />
                <p className="text-xs font-semibold text-[#173B65]">No projects listed</p>
                <p className="text-[11px] text-slate-500">
                  Include relevant projects in the CV Builder to highlight domain alignment.
                </p>
              </div>
            ) : (
              data.projects.map((proj, pIdx) => (
                <div key={proj.id} className="p-3.5 border border-[#E5EAF0] rounded-[12px] space-y-3 bg-[#F7F9FC]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...data.projects];
                          updated[pIdx].title = e.target.value;
                          onUpdateData({ ...data, projects: updated });
                        }}
                        className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Subtitle / Thesis</label>
                      <input
                        type="text"
                        value={proj.subtitle}
                        onChange={(e) => {
                          const updated = [...data.projects];
                          updated[pIdx].subtitle = e.target.value;
                          onUpdateData({ ...data, projects: updated });
                        }}
                        className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 block">Project Description Bullets</label>
                    {proj.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex gap-1.5 items-start">
                        <textarea
                          rows={2}
                          value={b}
                          onChange={(e) => {
                            const updated = [...data.projects];
                            updated[pIdx].bullets[bIdx] = e.target.value;
                            onUpdateData({ ...data, projects: updated });
                          }}
                          className="flex-1 text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...data.projects];
                            updated[pIdx].bullets.splice(bIdx, 1);
                            onUpdateData({ ...data, projects: updated });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-[8px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...data.projects];
                        updated[pIdx].bullets.push('');
                        onUpdateData({ ...data, projects: updated });
                      }}
                      className="text-xs text-[#3978B8] hover:text-[#173B65] font-medium flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Project Bullet</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-3">
            {data.education.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                <GraduationCap className="w-7 h-7 text-[#3978B8] mx-auto opacity-75" />
                <p className="text-xs font-semibold text-[#173B65]">No education entries yet</p>
                <p className="text-[11px] text-slate-500">
                  Add degrees or coursework using the CV Builder.
                </p>
              </div>
            ) : (
              data.education.map((edu, eIdx) => (
                <div key={edu.id} className="p-3 border border-[#E5EAF0] rounded-[12px] space-y-2 bg-[#F7F9FC]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.degree}
                      placeholder="Degree"
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[eIdx].degree = e.target.value;
                        onUpdateData({ ...data, education: updated });
                      }}
                      className="text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      placeholder="Institution"
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[eIdx].institution = e.target.value;
                        onUpdateData({ ...data, education: updated });
                      }}
                      className="text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.duration}
                      placeholder="Duration"
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[eIdx].duration = e.target.value;
                        onUpdateData({ ...data, education: updated });
                      }}
                      className="text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={edu.details}
                      placeholder="Details (e.g. CGPA)"
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[eIdx].details = e.target.value;
                        onUpdateData({ ...data, education: updated });
                      }}
                      className="text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div className="space-y-3">
            {data.certifications.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                <Award className="w-7 h-7 text-[#3978B8] mx-auto opacity-75" />
                <p className="text-xs font-semibold text-[#173B65]">No certifications listed</p>
                <p className="text-[11px] text-slate-500">
                  Add industry credentials or licenses in the CV Builder.
                </p>
              </div>
            ) : (
              data.certifications.map((cert, cIdx) => (
                <div key={cert.id} className="p-3 border border-[#E5EAF0] rounded-[12px] space-y-1.5 bg-[#F7F9FC]">
                  <label className="text-xs font-semibold text-[#173B65] block">
                    {cert.category}
                  </label>
                  <textarea
                    rows={3}
                    value={cert.items.join(' | ')}
                    onChange={(e) => {
                      const updated = [...data.certifications];
                      updated[cIdx].items = e.target.value
                        .split('|')
                        .map((c) => c.trim())
                        .filter(Boolean);
                      onUpdateData({ ...data, certifications: updated });
                    }}
                    className="w-full text-xs p-2 bg-white border border-[#E5EAF0] rounded-[8px] focus:border-[#3978B8] focus:outline-none"
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
