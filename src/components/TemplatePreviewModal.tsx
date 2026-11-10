import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  ChevronLeft,
  ChevronRight
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
          archetype: 'Zero-Clutter Linear ATS Pure Text',
          structure: 'Single-column monochrome text, standard headings, guaranteed 100% parser score across Workday & Taleo',
          bestFor: 'High-Volume Enterprise Applications, Strict ATS Portals',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Modal Navigation & Controls */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: currentTemplate.accentColor }}
              className="w-3.5 h-8 rounded-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1F2A44]">
                  {currentTemplate.name}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentTemplate.atsScore}
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                  {highlights.archetype}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Template {currentIndex + 1} of {RESUME_TEMPLATES.length} · {currentTemplate.category}
              </p>
            </div>
          </div>

          {/* Quick Prev / Next Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={handlePrev}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
              title="Previous Template"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-700 select-none">
              {currentIndex + 1} / {RESUME_TEMPLATES.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
              title="Next Template"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Primary actions */}
          <div className="flex items-center gap-3">

            <button
              onClick={() => {
                onSelectTemplate(activeTemplateId);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Use This Template</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Selector Pill Row (Quick thumbnail switcher) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0">
            Compare Styles:
          </span>
          {RESUME_TEMPLATES.map((tmpl) => {
            const isCurrent = tmpl.id === activeTemplateId;
            return (
              <button
                key={tmpl.id}
                onClick={() => setActiveTemplateId(tmpl.id)}
                style={{
                  borderColor: isCurrent ? tmpl.accentColor : undefined,
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                  isCurrent
                    ? 'bg-white shadow-xs text-slate-900 ring-2 ring-blue-500/20'
                    : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-white'
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

        {/* Content Area: Left Spec Card & Center Rendered A4 View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Spec Sidebar */}
          <div className="hidden lg:flex w-72 bg-white border-r border-slate-200 p-5 flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Layout Architecture
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {highlights.archetype}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {currentTemplate.description}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Structural Blueprint</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  {highlights.structure}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1.5">
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
                  Features & Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentTemplate.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  onSelectTemplate(activeTemplateId);
                  onClose();
                }}
                className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#1F2A44] hover:bg-slate-900 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>Select &amp; Customize</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central A4 Live Preview Render Viewport */}
          <div className="flex-1 bg-slate-100/90 h-full overflow-hidden">
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
