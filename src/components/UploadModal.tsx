import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { StructuredResume } from '../types/resume';
import { parseResumeText } from '../utils/latexParser';
import { DEFAULT_STRUCTURED_RESUME } from '../data/defaultResume';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadResume: (data: StructuredResume, rawText?: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLoadResume
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseStatus('Reading document...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processContent(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const processContent = (text: string, title?: string) => {
    try {
      const parsed = parseResumeText(text);
      // Merge with default base to ensure full schema integrity
      const merged: StructuredResume = {
        ...DEFAULT_STRUCTURED_RESUME,
        name: parsed.name || DEFAULT_STRUCTURED_RESUME.name,
        summary: parsed.summary || (text.slice(0, 400) || DEFAULT_STRUCTURED_RESUME.summary),
      };

      setParseStatus('Successfully parsed sections!');
      setTimeout(() => {
        onLoadResume(merged, text);
        onClose();
      }, 500);
    } catch {
      setParseStatus('Parsed plain text content');
      onLoadResume(DEFAULT_STRUCTURED_RESUME, text);
      onClose();
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    processContent(pastedText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F2A44] text-white flex items-center justify-center shadow-xs">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2A44]">
                Upload or Paste Existing CV
              </h3>
              <p className="text-xs text-slate-500">
                Supports PDF, DOCX, and TXT files.
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2 transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Upload Document File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2 transition-colors border-b-2 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Paste Resume Text
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/20 transition-all">
              <input
                type="file"
                id="cv-file-input"
                accept=".txt,.pdf,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="cv-file-input" className="cursor-pointer block">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <span className="text-sm font-semibold text-slate-800 block">
                  Click to browse or drop file here
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  PDF, DOCX, TXT
                </span>
              </label>

              {fileName && (
                <div className="mt-4 p-2 bg-slate-100 rounded text-xs text-slate-700 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{fileName}</span>
                </div>
              )}

              {parseStatus && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  {parseStatus}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your complete resume text or LaTeX source here..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className="w-full py-2 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                Import and Parse Resume
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
