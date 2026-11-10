import React from 'react';

interface TemplateMiniMockupProps {
  templateId: string;
  accentColor: string;
}

export const TemplateMiniMockup: React.FC<TemplateMiniMockupProps> = ({
  templateId,
  accentColor,
}) => {
  // 1. TECHNICAL / IT: Two-column layout with left sidebar
  if (templateId === 'template-technical') {
    return (
      <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Top minimal header */}
        <div className="px-2 pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div className="w-14 h-1.5 bg-teal-600 rounded-sm"></div>
          <div className="w-8 h-1 bg-slate-300 rounded-sm"></div>
        </div>

        {/* Two-Column split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar (38%) */}
          <div className="w-[38%] bg-teal-50/70 border-r border-teal-100 p-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="w-8 h-1 bg-teal-700 rounded-xs"></div>
              <div className="space-y-0.5">
                <div className="w-full h-0.5 bg-teal-200 rounded-xs"></div>
                <div className="w-4/5 h-0.5 bg-teal-200 rounded-xs"></div>
              </div>

              <div className="w-9 h-1 bg-teal-700 rounded-xs mt-1"></div>
              <div className="flex flex-wrap gap-0.5">
                <div className="w-4 h-1 bg-teal-200 rounded-xs"></div>
                <div className="w-5 h-1 bg-teal-200 rounded-xs"></div>
                <div className="w-4 h-1 bg-teal-200 rounded-xs"></div>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="w-7 h-1 bg-teal-600 rounded-xs"></div>
              <div className="w-full h-0.5 bg-teal-200 rounded-xs"></div>
            </div>
          </div>

          {/* Right Main Body (62%) */}
          <div className="w-[62%] p-1.5 space-y-1.5">
            <div className="space-y-0.5">
              <div className="w-12 h-1 bg-slate-700 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
            </div>

            <div className="space-y-1">
              <div className="w-14 h-1 bg-teal-600 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-300 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
              <div className="w-4/5 h-0.5 bg-slate-200 rounded-xs"></div>
            </div>

            <div className="space-y-1">
              <div className="w-12 h-1 bg-teal-600 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
              <div className="w-3/4 h-0.5 bg-slate-200 rounded-xs"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. EXECUTIVE / SENIOR LEADERSHIP: Dark Executive Top Banner
  if (templateId === 'template-executive') {
    return (
      <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Dark Executive Banner Header */}
        <div className="bg-[#1E293B] p-2 flex flex-col justify-center space-y-1">
          <div className="w-16 h-1.5 bg-white rounded-xs"></div>
          <div className="w-20 h-1 bg-amber-300/80 rounded-xs"></div>
          <div className="flex gap-1 pt-0.5">
            <div className="w-6 h-0.5 bg-slate-400 rounded-xs"></div>
            <div className="w-6 h-0.5 bg-slate-400 rounded-xs"></div>
            <div className="w-6 h-0.5 bg-slate-400 rounded-xs"></div>
          </div>
        </div>

        {/* 3-Column Core Competencies Grid */}
        <div className="p-1.5 space-y-1.5 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded border border-slate-100">
            <div className="h-2 bg-slate-200 rounded-xs"></div>
            <div className="h-2 bg-slate-200 rounded-xs"></div>
            <div className="h-2 bg-slate-200 rounded-xs"></div>
          </div>

          <div className="space-y-1">
            <div className="w-14 h-1 bg-slate-800 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
          </div>

          <div className="space-y-1">
            <div className="w-12 h-1 bg-slate-800 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-300 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
            <div className="w-5/6 h-0.5 bg-slate-200 rounded-xs"></div>
          </div>
        </div>
      </div>
    );
  }

  // 3. DATA ANALYST: Metrics & KPI Grid Layout
  if (templateId === 'template-data') {
    return (
      <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col p-2 justify-between">
        <div className="space-y-1.5">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="w-14 h-1.5 bg-indigo-600 rounded-xs"></div>
            <div className="w-8 h-1 bg-slate-300 rounded-xs"></div>
          </div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>

          {/* 3 Metric Scorecards */}
          <div className="grid grid-cols-3 gap-1 my-1">
            <div className="bg-indigo-50 border border-indigo-200 rounded p-0.5 text-center">
              <div className="w-full h-1 bg-indigo-600 rounded-xs mb-0.5"></div>
              <div className="w-3/4 mx-auto h-0.5 bg-indigo-300 rounded-xs"></div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded p-0.5 text-center">
              <div className="w-full h-1 bg-indigo-600 rounded-xs mb-0.5"></div>
              <div className="w-3/4 mx-auto h-0.5 bg-indigo-300 rounded-xs"></div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded p-0.5 text-center">
              <div className="w-full h-1 bg-indigo-600 rounded-xs mb-0.5"></div>
              <div className="w-3/4 mx-auto h-0.5 bg-indigo-300 rounded-xs"></div>
            </div>
          </div>

          {/* Analytics Experience */}
          <div className="space-y-1">
            <div className="w-16 h-1 bg-indigo-600 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-300 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
          </div>
        </div>

        {/* Tech Matrix Chips */}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          <div className="w-12 h-1 bg-indigo-600 rounded-xs"></div>
          <div className="flex flex-wrap gap-0.5">
            <span className="w-5 h-1 bg-indigo-100 border border-indigo-200 rounded-xs"></span>
            <span className="w-6 h-1 bg-indigo-100 border border-indigo-200 rounded-xs"></span>
            <span className="w-5 h-1 bg-indigo-100 border border-indigo-200 rounded-xs"></span>
          </div>
        </div>
      </div>
    );
  }

  // 4. FRESHER / ENTRY LEVEL: Education & Projects Top Highlight
  if (templateId === 'template-fresher') {
    return (
      <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col p-2 justify-between">
        <div className="space-y-1.5">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="w-16 h-1.5 bg-sky-600 rounded-xs"></div>
            <div className="w-7 h-1 bg-sky-100 text-sky-700 rounded-xs"></div>
          </div>
          <div className="w-full h-0.5 bg-sky-200 rounded-xs"></div>

          {/* Education Block (Featured Top) */}
          <div className="bg-sky-50/80 border border-sky-200 rounded p-1 space-y-1">
            <div className="flex justify-between items-center">
              <div className="w-12 h-1 bg-sky-700 rounded-xs"></div>
              <div className="w-4 h-1 bg-emerald-500 rounded-xs"></div>
            </div>
            <div className="w-full h-0.5 bg-sky-200 rounded-xs"></div>
          </div>

          {/* Projects Block */}
          <div className="space-y-1">
            <div className="w-14 h-1 bg-sky-600 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-300 rounded-xs"></div>
            <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
            <div className="w-4/5 h-0.5 bg-slate-200 rounded-xs"></div>
          </div>
        </div>

        {/* Skills & Coursework */}
        <div className="space-y-1">
          <div className="w-10 h-1 bg-sky-600 rounded-xs"></div>
          <div className="flex gap-0.5">
            <div className="w-6 h-1 bg-slate-200 rounded-xs"></div>
            <div className="w-6 h-1 bg-slate-200 rounded-xs"></div>
            <div className="w-5 h-1 bg-slate-200 rounded-xs"></div>
          </div>
        </div>
      </div>
    );
  }

  // 5. MODERN MINIMAL: Left-side Accent Stripe & Pill Badges
  if (templateId === 'template-modern') {
    return (
      <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex">
        {/* Left Vertical Accent Stripe */}
        <div className="w-1.5 bg-blue-600 h-full shrink-0"></div>

        <div className="flex-1 p-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div>
              <div className="w-16 h-1.5 bg-blue-600 rounded-xs"></div>
              <div className="w-20 h-1 bg-slate-400 rounded-xs mt-0.5"></div>
              <div className="w-14 h-0.5 bg-slate-300 rounded-xs mt-0.5"></div>
            </div>

            {/* Left-bordered section */}
            <div className="pl-1 border-l-2 border-blue-500 space-y-0.5">
              <div className="w-10 h-1 bg-slate-700 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
              <div className="w-4/5 h-0.5 bg-slate-200 rounded-xs"></div>
            </div>

            {/* Experience */}
            <div className="pl-1 border-l-2 border-blue-500 space-y-0.5">
              <div className="w-12 h-1 bg-slate-700 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-300 rounded-xs"></div>
              <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
            </div>
          </div>

          {/* Pill tags */}
          <div className="flex gap-0.5 pt-1">
            <div className="w-5 h-1.5 bg-blue-100 rounded-full"></div>
            <div className="w-5 h-1.5 bg-blue-100 rounded-full"></div>
            <div className="w-4 h-1.5 bg-blue-100 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // 6. PROFESSIONAL / CORPORATE: Classic Centered Serif with Double Rule
  if (templateId === 'template-corporate') {
    return (
      <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col p-2 justify-between">
        <div className="space-y-1 text-center">
          {/* Centered Name */}
          <div className="w-18 mx-auto h-1.5 bg-slate-900 rounded-xs"></div>
          <div className="w-14 mx-auto h-1 bg-slate-600 rounded-xs"></div>
          <div className="w-20 mx-auto h-0.5 bg-slate-400 rounded-xs"></div>

          {/* Double Rule Divider */}
          <div className="w-full border-t border-b border-slate-800 py-[0.5px] my-1"></div>

          {/* Centered Section Titles */}
          <div className="w-12 mx-auto h-1 bg-slate-800 rounded-xs mb-1"></div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>

          <div className="w-14 mx-auto h-1 bg-slate-800 rounded-xs mt-1.5 mb-1"></div>
          <div className="flex justify-between">
            <div className="w-10 h-0.5 bg-slate-700 rounded-xs"></div>
            <div className="w-6 h-0.5 bg-slate-400 rounded-xs"></div>
          </div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
        </div>

        <div className="space-y-0.5 text-center pt-1 border-t border-slate-100">
          <div className="w-10 mx-auto h-1 bg-slate-800 rounded-xs"></div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
        </div>
      </div>
    );
  }

  // 7. ATS-FRIENDLY ULTRA: Stark Monochrome Linear Text
  if (templateId === 'template-ats') {
    return (
      <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col p-2.5 justify-between font-mono">
        <div className="space-y-1.5">
          <div>
            <div className="w-20 h-1.5 bg-slate-900 rounded-none"></div>
            <div className="w-14 h-1 bg-slate-600 rounded-none mt-0.5"></div>
            <div className="w-22 h-0.5 bg-slate-400 rounded-none mt-0.5"></div>
          </div>

          {/* Linear Underlined Sections */}
          <div className="space-y-0.5">
            <div className="w-12 h-1 bg-slate-900 border-b border-slate-900 pb-0.5"></div>
            <div className="w-full h-0.5 bg-slate-300"></div>
            <div className="w-full h-0.5 bg-slate-200"></div>
            <div className="w-4/5 h-0.5 bg-slate-200"></div>
          </div>

          <div className="space-y-0.5">
            <div className="w-14 h-1 bg-slate-900 border-b border-slate-900 pb-0.5"></div>
            <div className="w-full h-0.5 bg-slate-300"></div>
            <div className="w-3/4 h-0.5 bg-slate-200"></div>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="w-10 h-1 bg-slate-900 border-b border-slate-900 pb-0.5"></div>
          <div className="w-full h-0.5 bg-slate-300"></div>
        </div>
      </div>
    );
  }

  // 8. PRODUCT MANAGEMENT (Default / LaTeX Tabularx)
  return (
    <div className="w-32 h-44 bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col p-2 justify-between">
      <div className="space-y-1 text-center">
        <div style={{ backgroundColor: accentColor }} className="w-18 mx-auto h-1.5 rounded-xs"></div>
        <div className="w-22 mx-auto h-1 bg-slate-700 rounded-xs"></div>
        <div className="w-16 mx-auto h-0.5 bg-slate-400 rounded-xs"></div>
        <div style={{ backgroundColor: accentColor }} className="w-full h-[1px] my-1"></div>

        {/* Dense tabular rows */}
        <div className="text-left space-y-1">
          <div style={{ color: accentColor }} className="w-12 h-1 bg-slate-800 rounded-xs"></div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>

          <div className="flex justify-between items-center pt-0.5">
            <div className="w-12 h-0.5 bg-slate-700 rounded-xs"></div>
            <div className="w-6 h-0.5 bg-slate-400 rounded-xs"></div>
          </div>
          <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
          <div className="w-5/6 h-0.5 bg-slate-200 rounded-xs"></div>
        </div>
      </div>

      <div className="space-y-0.5 text-left pt-1 border-t border-slate-100">
        <div className="w-10 h-1 bg-slate-800 rounded-xs"></div>
        <div className="w-full h-0.5 bg-slate-200 rounded-xs"></div>
      </div>
    </div>
  );
};
