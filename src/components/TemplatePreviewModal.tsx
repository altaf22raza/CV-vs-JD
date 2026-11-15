import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { StructuredResume } from '../types/resume';
import { RESUME_TEMPLATES } from '../data/templates';
import { ResumePreviewA4 } from './ResumePreviewA4';
import { DEFAULT_STRUCTURED_RESUME } from '../data/defaultResume';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  resumeData?: StructuredResume;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  initialTemplateId,
  onSelectTemplate,
  resumeData,
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState<string>(initialTemplateId);
  const [showMobileSpecs, setShowMobileSpecs] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTemplateId(initialTemplateId);
    }
  }, [isOpen, initialTemplateId]);

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

  const currentTemplate = RESUME_TEMPLATES.find(t => t.id === activeTemplateId) || RESUME_TEMPLATES[0];
  const currentIndex = RESUME_TEMPLATES.findIndex(t => t.id === activeTemplateId);

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + RESUME_TEMPLATES.length) % RESUME_TEMPLATES.length;
    setActiveTemplateId(RESUME_TEMPLATES[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % RESUME_TEMPLATES.length;
    setActiveTemplateId(RESUME_TEMPLATES[nextIndex].id);
  };

  const previewResume: StructuredResume = {
    ...(resumeData || DEFAULT_STRUCTURED_RESUME),
    templateId: activeTemplateId,
  };

  // Archetype descriptions for template review
  const getLayoutHighlights = (id: string) => {
    switch (id) {
      case 'template-technical':
        return {
          archetype: 'Two-Column Split Sidebar',
          structure: 'Left sidebar (Contact, Tech Matrix, Education) + Right main body (Experience & Engineering Projects)',
          bestFor: 'Software Engineers, DevOps, Full-Stack, System Architects',
        };
      case 'template-executive':
        return {
          archetype: 'Executive Dark Banner & Competencies Grid',
          structure: 'Full-bleed executive slate header, 3-pillar leadership competency grid, and strategic achievements',
          bestFor: 'Directors, VPs, Heads of Product, Senior Leadership',
        };
      case 'template-data':
        return {
          archetype: 'Analytics KPI Ribbon & Tech Matrix',
          structure: 'Top 3-scorecard impact banner, categorized analytical tooling matrix, and statistical project bullets',
          bestFor: 'Data Analysts, BI Developers, Data Scientists, ML Engineers',
        };
      case 'template-fresher':
        return {
          archetype: 'Education & Capstone First',
          structure: 'Academic honors & GPA card on top, capstone projects with repo badges, skills, and internships',
          bestFor: 'College Graduates, Career Switchers, Interns, Junior Analysts',
        };
      case 'template-modern':
        return {
          archetype: 'Modern Minimal with Left Accent',
          structure: 'Asymmetrical left colored stripe, left-bordered section titles, and clean skill badges',
          bestFor: 'Product Designers, Growth Managers, Startup Operators',
        };
      case 'template-corporate':
        return {
          archetype: 'Classic Executive Serif',
          structure: 'Traditional centered serif typography, double horizontal rules, and formal academic structure',
          bestFor: 'Management Consulting, Investment Banking, Finance, Legal',
        };
      case 'template-ats':
        return {
          archetype: 'Linear Single-Column Text',
          structure: 'Single-column monochrome hierarchy with standard section headings and predictable reading order.',
          bestFor: 'Enterprise job portals and automated resume parsers requiring clean linear text.',
        };
      default:
        return {
          archetype: 'LaTeX Tabularx APM Standard',
          structure: 'High-density 10pt compact layout, navy headers, quantified metrics, and 0-to-1 launch highlights',
          bestFor: 'Product Managers, Technical Program Managers, Strategy Leads',
        };
    }
  };

  const highlights = getLayoutHighlights(activeTemplateId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#182230]/60 backdrop-blur-xs p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-6xl h-[94dvh] sm:h-[90dvh] rounded-[14px] shadow-2xl flex flex-col overflow-hidden border border-[#E5EAF0]">
        {/* Top Modal Navigation & Controls */}
        <div className="bg-white border-b border-[#E5EAF0] px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div 
              style={{ backgroundColor: currentTemplate.accentColor }}
              className="w-2.5 sm:w-3 h-7 sm:h-8 rounded-[4px] shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#173B65] truncate">
                  {currentTemplate.name}
                </h2>
                <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-0.5 rounded-[8px] bg-[#F7F9FC] text-[#173B65] border border-[#E5EAF0]">
                  {currentTemplate.parsingProfile}
                </span>
                <span className="text-[11px] text-slate-600 bg-[#F7F9FC] border border-[#E5EAF0] px-2 py-0.5 rounded-[8px] font-medium">
                  {currentTemplate.layoutFormat}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Template {currentIndex + 1} of {RESUME_TEMPLATES.length} · {currentTemplate.category}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick Prev / Next Switcher */}
            <div className="flex items-center gap-1 bg-[#F7F9FC] border border-[#E5EAF0] p-1 rounded-[10px]">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 text-slate-600 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                title="Previous Template"
                aria-label="Previous template"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-1.5 sm:px-2 text-[#182230] select-none font-mono tabular-nums">
                {currentIndex + 1} / {RESUME_TEMPLATES.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 text-slate-600 hover:text-[#173B65] hover:bg-white rounded-[8px] transition-colors cursor-pointer"
                title="Next Template"
                aria-label="Next template"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Primary actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setShowMobileSpecs((prev) => !prev)}
                className={`lg:hidden min-h-[36px] px-2.5 py-1.5 text-xs font-semibold rounded-[10px] border flex items-center gap-1 cursor-pointer transition-colors ${
                  showMobileSpecs
                    ? 'bg-[#173B65] text-white border-[#173B65]'
                    : 'bg-white text-[#173B65] border-[#E5EAF0] hover:bg-[#F7F9FC]'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(activeTemplateId);
                  onClose();
                }}
                className="btn-interactive min-h-[36px] px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>Use Template</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[36px] min-w-[36px] p-1.5 text-slate-400 hover:text-[#173B65] hover:bg-[#F7F9FC] rounded-[10px] transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Template Selector Pill Row (Quick thumbnail switcher) */}
        <div className="bg-[#F7F9FC] border-b border-[#E5EAF0] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0">
            Compare Styles:
          </span>
          {RESUME_TEMPLATES.map((tmpl) => {
            const isCurrent = tmpl.id === activeTemplateId;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setActiveTemplateId(tmpl.id)}
                style={{
                  borderColor: isCurrent ? tmpl.accentColor : undefined,
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all shrink-0 border cursor-pointer ${
                  isCurrent
                    ? 'bg-white text-[#173B65] border-[#3978B8] shadow-xs'
                    : 'bg-white/80 border-[#E5EAF0] text-slate-600 hover:bg-white'
                }`}
              >
                <span 
                  style={{ backgroundColor: tmpl.accentColor }} 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                />
                <span>{tmpl.name}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Mobile & Tablet Template Specs (< lg) */}
        {showMobileSpecs && (
          <div className="lg:hidden bg-white border-b border-[#E5EAF0] p-4 space-y-3 max-h-[38dvh] overflow-y-auto shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3978B8]">
                  {highlights.archetype}
                </span>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {currentTemplate.description}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-[#F7F9FC] rounded-[10px] border border-[#E5EAF0]">
                <div className="font-bold text-[#173B65] mb-0.5">Structural Blueprint</div>
                <p className="text-slate-600">{highlights.structure}</p>
              </div>
              <div className="p-2.5 bg-emerald-50/60 rounded-[10px] border border-emerald-200">
                <div className="font-bold text-emerald-900 mb-0.5">Recommended For</div>
                <p className="text-emerald-800">{highlights.bestFor}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area: Left Spec Card & Center Rendered A4 View */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Spec Sidebar */}
          <div className="hidden lg:flex w-72 bg-white border-r border-[#E5EAF0] p-5 flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3978B8]">
                  Layout Architecture
                </span>
                <h3 className="text-sm font-bold text-[#173B65] mt-0.5">
                  {highlights.archetype}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {currentTemplate.description}
                </p>
              </div>

              <div className="p-3 bg-[#F7F9FC] rounded-[10px] border border-[#E5EAF0] space-y-2">
                <div className="text-[11px] font-bold text-[#173B65] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>Structural Blueprint</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  {highlights.structure}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-[10px] border border-emerald-200 space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recommended For</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  {highlights.bestFor}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Features &amp; Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentTemplate.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-[#F7F9FC] border border-[#E5EAF0] text-slate-700 px-2 py-0.5 rounded-[6px] font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5EAF0]">
              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(activeTemplateId);
                  onClose();
                }}
                className="btn-interactive w-full py-2.5 px-3 text-xs font-bold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center justify-center gap-2"
              >
                <span>Select &amp; Customize</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central A4 Live Preview Render Viewport */}
          <div className="flex-1 bg-[#F7F9FC] h-full overflow-hidden">
            <ResumePreviewA4
              data={previewResume}
              targetRole={previewResume.targetRoleHeadline || 'Product Manager'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
