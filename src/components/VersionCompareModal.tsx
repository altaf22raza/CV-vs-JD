import React, { useState } from 'react';
import { X, ArrowLeftRight, Check, FileText } from 'lucide-react';
import { ResumeVersion } from '../types/resume';

interface VersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ResumeVersion[];
  currentVersion: ResumeVersion;
  onSelectVersion: (v: ResumeVersion) => void;
}

export const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onSelectVersion,
}) => {
  const [leftVersionId, setLeftVersionId] = useState<string>(
    versions[0]?.id || currentVersion.id
  );
  const [rightVersionId, setRightVersionId] = useState<string>(
    currentVersion.id
  );

  if (!isOpen) return null;

  const leftVersion = versions.find(v => v.id === leftVersionId) || currentVersion;
  const rightVersion = versions.find(v => v.id === rightVersionId) || currentVersion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2A44]">
                Side-by-Side Resume Version Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Compare wording, bullet tailoring, and ATS focus between saved versions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Pickers */}
        <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200 bg-slate-100/50 p-3">
          <div className="px-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Left Version:</span>
              <select
                value={leftVersionId}
                onChange={(e) => setLeftVersionId(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded p-1 font-medium focus:outline-none"
              >
                {versions.map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                onSelectVersion(leftVersion);
                onClose();
              }}
              className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
            >
              Load Left
            </button>
          </div>

          <div className="px-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Right Version:</span>
              <select
                value={rightVersionId}
                onChange={(e) => setRightVersionId(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded p-1 font-medium focus:outline-none"
              >
                {versions.map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                onSelectVersion(rightVersion);
                onClose();
              }}
              className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
            >
              Load Right
            </button>
          </div>
        </div>

        {/* Comparison Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 gap-6 divide-x divide-slate-100">
          {/* LEFT COLUMN */}
          <div className="space-y-4 pr-2">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider block">Headline</span>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5">{leftVersion.structuredData.targetRoleHeadline}</h4>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Professional Summary</span>
              <p className="text-xs text-slate-700 leading-relaxed">{leftVersion.structuredData.summary}</p>
            </div>

            <div className="space-y-3">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider block">Experience Bullets</span>
              {leftVersion.structuredData.experience.map(exp => (
                <div key={exp.id} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
                  <div className="text-xs font-bold text-[#1F2A44]">{exp.role} · {exp.company}</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                    {exp.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4 pl-4">
            <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-200">
              <span className="text-[10.5px] uppercase font-bold text-blue-700 tracking-wider block">Headline</span>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5">{rightVersion.structuredData.targetRoleHeadline}</h4>
            </div>

            <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-200">
              <span className="text-[10.5px] uppercase font-bold text-blue-700 tracking-wider block mb-1">Professional Summary</span>
              <p className="text-xs text-slate-700 leading-relaxed">{rightVersion.structuredData.summary}</p>
            </div>

            <div className="space-y-3">
              <span className="text-[10.5px] uppercase font-bold text-blue-700 tracking-wider block">Experience Bullets</span>
              {rightVersion.structuredData.experience.map(exp => (
                <div key={exp.id} className="p-3 rounded-lg border border-blue-200 bg-white space-y-1.5">
                  <div className="text-xs font-bold text-[#1F2A44]">{exp.role} · {exp.company}</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                    {exp.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
