import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Filter, 
  Check, 
  Layers, 
  FileText,
  Star,
  Eye,
  Maximize2
} from 'lucide-react';
import { RESUME_TEMPLATES } from '../data/templates';
import { TemplateDefinition, StructuredResume } from '../types/resume';
import { TemplateMiniMockup } from './TemplateMiniMockup';
import { TemplatePreviewModal } from './TemplatePreviewModal';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onCancel?: () => void;
  selectedTemplateId?: string;
  previewData?: StructuredResume;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onCancel,
  selectedTemplateId = 'template-pm',
  previewData
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeId, setActiveId] = useState<string>(selectedTemplateId);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTemplateId, setModalTemplateId] = useState<string>(selectedTemplateId);

  const categories = ['All', 'Product & Strategy', 'Corporate & Finance', 'General & Design', 'Software & Cloud', 'Data & Analytics', 'Graduates & Interns', 'Senior Leadership'];

  const filteredTemplates = selectedCategory === 'All'
    ? RESUME_TEMPLATES
    : RESUME_TEMPLATES.filter(t => t.category === selectedCategory || t.category.includes(selectedCategory));

  const handleOpenPreview = (templateId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalTemplateId(templateId);
    setModalOpen(true);
  };

  // Archetype label helper
  const getArchetypeLabel = (id: string) => {
    switch (id) {
      case 'template-technical': return 'Two-Column Sidebar';
      case 'template-executive': return 'Executive Dark Banner';
      case 'template-data': return 'Analytics KPI Ribbon';
      case 'template-fresher': return 'Education & Projects First';
      case 'template-modern': return 'Left Accent Minimal';
      case 'template-corporate': return 'Classic Serif Executive';
      case 'template-ats': return '100% Linear ATS Pure Text';
      default: return 'Tabularx Compact Standard';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Step 1 of 2: Select a Resume Template</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1F2A44] tracking-tight">
            Choose Your Professional Resume Template
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Each template features a distinct structural architecture—from technical two-column layouts and executive dark banners to classic serif corporate and pure linear ATS designs. Click <strong>Preview</strong> on any template to inspect the live A4 layout.
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shrink-0"
          >
            Back
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#1F2A44] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => {
          const isSelected = activeId === template.id;
          const archetype = getArchetypeLabel(template.id);

          return (
            <div
              key={template.id}
              onClick={() => {
                setActiveId(template.id);
                onSelectTemplate(template.id);
              }}
              className={`group bg-white rounded-xl border-2 transition-all flex flex-col justify-between overflow-hidden cursor-pointer shadow-xs hover:shadow-md hover:border-[#1E2B3E] active:scale-[0.99] relative ${
                isSelected ? 'border-[#1E2B3E] ring-2 ring-[#C8973E]/40' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Visual Mini Preview Container */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 relative h-52 flex flex-col items-center justify-center">
                {template.popular && (
                  <div className="absolute top-2.5 left-2.5 bg-[#1E2B3E] text-[#C8973E] text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 shadow-xs z-10 border border-[#C8973E]/30">
                    <Star className="w-2.5 h-2.5 fill-[#C8973E]" />
                    <span>Popular</span>
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded z-10">
                  {template.atsScore}
                </div>

                {/* Bespoke miniature layout representation */}
                <div className="transform group-hover:scale-105 transition-transform duration-200">
                  <TemplateMiniMockup 
                    templateId={template.id} 
                    accentColor={template.accentColor} 
                  />
                </div>

                {/* Quick Preview Hover Trigger */}
                <button
                  type="button"
                  onClick={(e) => handleOpenPreview(template.id, e)}
                  className="absolute bottom-2 inset-x-4 py-1.5 px-2 bg-[#1E2B3E]/95 hover:bg-[#1E2B3E] text-white text-[11px] font-semibold rounded-md flex items-center justify-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
                  title="Preview Full A4 Layout"
                >
                  <Eye className="w-3.5 h-3.5 text-[#C8973E]" />
                  <span>Preview Layout</span>
                </button>
              </div>

              {/* Template Info & Tags */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {template.category}
                    </span>
                    <span className="text-[9.5px] font-bold text-[#1E2B3E] bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded font-mono">
                      {archetype}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1E2B3E] mt-1 flex items-center justify-between">
                    <span>{template.name}</span>
                    <span 
                      style={{ backgroundColor: template.accentColor }} 
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 ml-1.5 ring-1 ring-slate-300"
                      title={`Accent: ${template.accentColor}`}
                    />
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                    {template.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleOpenPreview(template.id, e)}
                      className="py-2 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template.id);
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                        isSelected
                          ? 'bg-[#1E2B3E] text-white shadow-xs ring-1 ring-[#C8973E]/50'
                          : 'bg-[#C8973E] hover:bg-[#B37D2C] text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#C8973E]" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <span>Select</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Full-scale Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTemplateId={modalTemplateId}
        onSelectTemplate={(templateId) => {
          setActiveId(templateId);
          onSelectTemplate(templateId);
        }}
        resumeData={previewData}
      />
    </div>
  );
};
