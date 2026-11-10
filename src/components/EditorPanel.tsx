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
  CheckCircle2
} from 'lucide-react';
import { StructuredResume, DiffItem, IdentifiedKeyword } from '../types/resume';
import { apiRewriteSection } from '../services/geminiClient';

interface EditorPanelProps {
  data: StructuredResume;
  originalData: StructuredResume;
  diffItems: DiffItem[];
  identifiedKeywords?: IdentifiedKeyword[];
  onUpdateData: (newData: StructuredResume) => void;
  onUpdateDiffItems: (newDiffs: DiffItem[]) => void;
  onRestoreOriginal: () => void;
  onAddKeywordToSkills: (keyword: string, category?: string) => void;
  jdText?: string;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  data,
  originalData,
  diffItems,
  identifiedKeywords = [],
  onUpdateData,
  onUpdateDiffItems,
  onRestoreOriginal,
  onAddKeywordToSkills,
  jdText
}) => {
  const [activeTab, setActiveTab] = useState<'keywords' | 'diff' | 'summary' | 'experience' | 'skills' | 'projects' | 'education' | 'certifications'>(
    identifiedKeywords.length > 0 ? 'keywords' : 'diff'
  );
  const [sectionPrompt, setSectionPrompt] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  // Apply or reject individual diff item
  const handleDiffAction = (id: string, action: 'accepted' | 'rejected') => {
    const updatedDiffs = diffItems.map(d => (d.id === id ? { ...d, status: action } : d));
    onUpdateDiffItems(updatedDiffs);

    const targetDiff = diffItems.find(d => d.id === id);
    if (!targetDiff) return;

    if (action === 'rejected') {
      if (targetDiff.section === 'summary') {
        onUpdateData({ ...data, summary: originalData.summary });
      } else if (targetDiff.section === 'headline') {
        onUpdateData({ ...data, targetRoleHeadline: originalData.targetRoleHeadline });
      }
    } else if (action === 'accepted') {
      if (targetDiff.section === 'summary') {
        onUpdateData({ ...data, summary: targetDiff.optimizedText });
      } else if (targetDiff.section === 'headline') {
        onUpdateData({ ...data, targetRoleHeadline: targetDiff.optimizedText });
      }
    }
  };

  const handleAcceptAll = () => {
    const acceptedDiffs = diffItems.map(d => ({ ...d, status: 'accepted' as const }));
    onUpdateDiffItems(acceptedDiffs);
  };

  const handleRejectAll = () => {
    const rejectedDiffs = diffItems.map(d => ({ ...d, status: 'rejected' as const }));
    onUpdateDiffItems(rejectedDiffs);
    onRestoreOriginal();
  };

  const handleAiRewriteSection = async (sectionKey: string, currentContent: string) => {
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

  const pendingDiffsCount = diffItems.filter(d => d.status === 'pending').length;

  // Check if a keyword is already in skills
  const isKeywordInSkills = (kw: string) => {
    const lowerKw = kw.toLowerCase().trim();
    return data.skills.some(cat => 
      cat.items.some(item => item.toLowerCase().trim() === lowerKw || item.toLowerCase().includes(lowerKw))
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header Tabs */}
      <div className="border-b border-slate-200 px-3 pt-2.5 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
              Resume Editor & Optimizer
            </span>
            {identifiedKeywords.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {identifiedKeywords.length} ATS Keywords
              </span>
            )}
          </div>

          <button
            onClick={onRestoreOriginal}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
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
              onClick={() => setActiveTab('keywords')}
              className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'keywords'
                  ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">ATS Keywords ({identifiedKeywords.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'diff'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rewrites ({diffItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'summary'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'experience'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Experience</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'skills'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Skills</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'projects'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('education')}
            className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'education'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Education</span>
          </button>

          <button
            onClick={() => setActiveTab('certifications')}
            className={`px-3 py-1.5 font-medium rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'certifications'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>ATS Keywords Identified from Job Description</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                These keywords are high priority in the target JD. Adding them to your CV increases your ATS ranking.
              </p>
            </div>

            <div className="space-y-2.5">
              {identifiedKeywords.map((kw, idx) => {
                const inSkills = isKeywordInSkills(kw.keyword);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{kw.keyword}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {kw.category}
                        </span>
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Best section: {kw.suggestedSection}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {kw.reason}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={inSkills}
                      onClick={() => onAddKeywordToSkills(kw.keyword, kw.category)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 flex items-center gap-1 ${
                        inSkills
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
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
                          <span>+ Add to Skills</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: AI REWRITES */}
        {activeTab === 'diff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-600">
                Review proposed optimizations against target job description.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Accept All</span>
                </button>
                <button
                  onClick={handleRejectAll}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Keep Original</span>
                </button>
              </div>
            </div>

            {diffItems.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-lg">
                <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-70" />
                <h4 className="text-sm font-semibold text-slate-800">No active AI changes</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Click &quot;Optimize for JD&quot; in the top bar and paste a Job Description to identify keywords and optimize your CV.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {diffItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-lg border text-xs transition-all ${
                      item.status === 'accepted'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : item.status === 'rejected'
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-blue-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-700 uppercase text-[10.5px] tracking-wider">
                        {item.section}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDiffAction(item.id, 'accepted')}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                            item.status === 'accepted'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDiffAction(item.id, 'rejected')}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                            item.status === 'rejected'
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* Diff comparison view */}
                    <div className="space-y-2 mt-1">
                      <div className="p-2 rounded bg-rose-50/60 border border-rose-100 text-slate-700">
                        <span className="font-semibold text-rose-800 text-[10px] uppercase block mb-0.5">
                          Original:
                        </span>
                        <p className="line-through decoration-rose-400 opacity-80">{item.originalText}</p>
                      </div>

                      <div className="p-2 rounded bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <span className="font-semibold text-emerald-800 text-[10px] uppercase block mb-0.5">
                          Optimized with Keywords:
                        </span>
                        <p className="font-medium text-slate-900">{item.optimizedText}</p>
                      </div>
                    </div>

                    {item.reason && (
                      <div className="mt-2 text-[11px] text-blue-700 bg-blue-50/70 px-2.5 py-1 rounded border border-blue-100">
                        <strong className="font-semibold">Reason:</strong> {item.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role Headline
              </label>
              <input
                type="text"
                value={data.targetRoleHeadline}
                onChange={(e) => onUpdateData({ ...data, targetRoleHeadline: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Professional Summary
                </label>
                <span className="text-[11px] text-slate-400">
                  {data.summary.length} characters
                </span>
              </div>
              <textarea
                rows={7}
                value={data.summary}
                onChange={(e) => onUpdateData({ ...data, summary: e.target.value })}
                className="w-full text-xs p-3 border border-slate-200 rounded-md focus:border-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Quick AI Refine tool */}
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
              <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-blue-600" />
                AI Summary Assistant
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 'Make it punchier' or 'Emphasize AI/ML thesis'"
                  value={sectionPrompt}
                  onChange={(e) => setSectionPrompt(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none"
                />
                <button
                  onClick={() => handleAiRewriteSection('summary', data.summary)}
                  disabled={isRewriting || !sectionPrompt.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 whitespace-nowrap"
                >
                  {isRewriting ? 'Rewriting...' : 'Rewrite'}
                </button>
              </div>
              {rewriteError && (
                <div className="text-[11px] text-rose-600">{rewriteError}</div>
              )}
            </div>
          </div>
        )}

        {/* TAB: EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            {data.experience.map((exp, expIdx) => (
              <div key={exp.id} className="p-3.5 border border-slate-200 rounded-lg space-y-3 bg-slate-50/40">
                <div className="grid grid-cols-2 gap-2">
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
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
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
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
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
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
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
                        className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = [...data.experience];
                          updated[expIdx].bullets.splice(bIdx, 1);
                          onUpdateData({ ...data, experience: updated });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete bullet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const updated = [...data.experience];
                      updated[expIdx].bullets.push('');
                      onUpdateData({ ...data, experience: updated });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bullet Point</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Skills are categorized and comma-separated. Reorder or add keywords to match target requirements.
            </p>
            {data.skills.map((skill, sIdx) => (
              <div key={skill.id} className="p-3 border border-slate-200 rounded-lg space-y-1.5 bg-slate-50/40">
                <label className="text-xs font-semibold text-slate-700 block">
                  {skill.category}
                </label>
                <textarea
                  rows={3}
                  value={skill.items.join(', ')}
                  onChange={(e) => {
                    const updated = [...data.skills];
                    updated[sIdx].items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    onUpdateData({ ...data, skills: updated });
                  }}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {data.projects.map((proj, pIdx) => (
              <div key={proj.id} className="p-3.5 border border-slate-200 rounded-lg space-y-3 bg-slate-50/40">
                <div className="grid grid-cols-2 gap-2">
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
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
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
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
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
                        className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = [...data.projects];
                          updated[pIdx].bullets.splice(bIdx, 1);
                          onUpdateData({ ...data, projects: updated });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const updated = [...data.projects];
                      updated[pIdx].bullets.push('');
                      onUpdateData({ ...data, projects: updated });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project Bullet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-3">
            {data.education.map((edu, eIdx) => (
              <div key={edu.id} className="p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50/40">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={edu.degree}
                    placeholder="Degree"
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[eIdx].degree = e.target.value;
                      onUpdateData({ ...data, education: updated });
                    }}
                    className="text-xs p-1.5 bg-white border border-slate-200 rounded"
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
                    className="text-xs p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={edu.duration}
                    placeholder="Duration"
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[eIdx].duration = e.target.value;
                      onUpdateData({ ...data, education: updated });
                    }}
                    className="text-xs p-1.5 bg-white border border-slate-200 rounded"
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
                    className="text-xs p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div className="space-y-3">
            {data.certifications.map((cert, cIdx) => (
              <div key={cert.id} className="p-3 border border-slate-200 rounded-lg space-y-1.5 bg-slate-50/40">
                <label className="text-xs font-semibold text-slate-700 block">
                  {cert.category}
                </label>
                <textarea
                  rows={3}
                  value={cert.items.join(' | ')}
                  onChange={(e) => {
                    const updated = [...data.certifications];
                    updated[cIdx].items = e.target.value.split('|').map(c => c.trim()).filter(Boolean);
                    onUpdateData({ ...data, certifications: updated });
                  }}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
