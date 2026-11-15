import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Filter,
  Check,
  Layers,
  Eye,
} from 'lucide-react';
import { RESUME_TEMPLATES } from '../data/templates';
import { ResumeVersion, StructuredResume } from '../types/resume';
import { TemplateMiniMockup } from './TemplateMiniMockup';
import { TemplatePreviewModal } from './TemplatePreviewModal';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onCancel?: () => void;
  selectedTemplateId?: string;
  previewData?: StructuredResume;
  versions?: ResumeVersion[];
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onCancel,
  selectedTemplateId = 'template-pm',
  previewData,
  versions = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeId, setActiveId] = useState<string>(selectedTemplateId);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTemplateId, setModalTemplateId] = useState<string>(selectedTemplateId);

  const categories = [
    'All',
    'Product & Strategy',
    'Corporate & Finance',
    'General & Design',
    'Software & Cloud',
    'Data & Analytics',
    'Graduates & Interns',
    'Senior Leadership',
  ];

  // Usage counts derived strictly from user's actual saved resumes (never fabricated "Popular" tags)
  const usageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ver of versions) {
      const tid = ver.templateId || 'template-pm';
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
    return counts;
  }, [versions]);

  const filteredTemplates =
    selectedCategory === 'All'
      ? RESUME_TEMPLATES
      : RESUME_TEMPLATES.filter(
          (t) => t.category === selectedCategory || t.category.includes(selectedCategory)
        );

  const handleOpenPreview = (templateId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalTemplateId(templateId);
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-[#182230]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5EAF0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3978B8] mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Step 1 of 2: Select a Resume Template</span>
          </div>
          <h1 className="text-2xl font-bold text-[#173B65] tracking-tight">
            Choose Your Professional Resume Template
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Compare structural architectures—single-column linear layouts, classic serif formatting, and two-column technical splits. Select <strong>Preview</strong> to inspect full A4 typography before customizing.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-interactive px-4 py-2 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] shrink-0 self-start md:self-auto cursor-pointer"
          >
            Back
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar sm:flex-wrap pb-1">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[36px] px-3 py-1.5 rounded-[10px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#173B65] text-white'
                : 'bg-white border border-[#E5EAF0] text-slate-600 hover:bg-[#F7F9FC] hover:text-[#173B65]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5EAF0] rounded-[14px] p-10 text-center space-y-3">
          <Layers className="w-8 h-8 text-[#3978B8] mx-auto" />
          <p className="text-sm font-bold text-[#173B65]">No templates match this category</p>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] cursor-pointer"
          >
            Show All Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredTemplates.map((template) => {
            const isSelected = activeId === template.id;
            const usedCount = usageCounts.get(template.id) || 0;

            return (
              <div
                key={template.id}
                onClick={() => {
                  setActiveId(template.id);
                  onSelectTemplate(template.id);
                }}
                className={`card-interactive group bg-white rounded-[14px] border flex flex-col justify-between overflow-hidden cursor-pointer relative ${
                  isSelected
                    ? 'border-[#3978B8]/70 bg-[#F7F9FC]/30 shadow-xs'
                    : 'border-[#E5EAF0] hover:border-[#3978B8]/60'
                }`}
              >
                {/* Realistic Document Thumbnail Container */}
                <div
                  onClick={(e) => handleOpenPreview(template.id, e)}
                  className="px-4 pt-9 pb-4 bg-[#F7F9FC] border-b border-[#E5EAF0] relative h-56 flex flex-col items-center justify-center"
                  title="Click thumbnail to open full A4 preview"
                >
                  {usedCount > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-white text-[#173B65] border border-[#E5EAF0] text-[10px] font-semibold px-2 py-0.5 rounded-[6px] z-10">
                      Used in {usedCount} {usedCount === 1 ? 'CV' : 'CVs'}
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 text-[10px] font-medium text-slate-600 bg-white border border-[#E5EAF0] px-2 py-0.5 rounded-[6px] z-10">
                    {template.layoutFormat}
                  </div>

                  {/* Realistic micro-document preview */}
                  <div className="transform group-hover:scale-[1.03] transition-transform duration-200">
                    <TemplateMiniMockup
                      templateId={template.id}
                      accentColor={template.accentColor}
                    />
                  </div>
                </div>

                {/* Template Info & Unified Primary/Secondary Buttons */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[10.5px]">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider truncate">
                        {template.category}
                      </span>
                      <span className="text-[#3978B8] font-medium shrink-0">
                        {template.parsingProfile}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#173B65] flex items-center justify-between gap-2">
                      <span className="truncate">{template.name}</span>
                      <span
                        style={{ backgroundColor: template.accentColor }}
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 ring-1 ring-[#E5EAF0]"
                        title={`Accent: ${template.accentColor}`}
                      />
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {template.tags.join(' · ')}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleOpenPreview(template.id, e)}
                        className="btn-interactive py-2 px-3 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] hover:border-[#3978B8]/60 rounded-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#3978B8]" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(template.id);
                          onSelectTemplate(template.id);
                        }}
                        className={`btn-interactive py-2 px-3 text-xs font-semibold rounded-[10px] flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#173B65] text-white'
                            : 'bg-[#173B65] hover:bg-[#122F52] text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <span>Use</span>
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
      )}

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
