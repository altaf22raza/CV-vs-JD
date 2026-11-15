import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { StructuredResume } from '../types/resume';
import { parseResumeText } from '../utils/latexParser';
import { DEFAULT_STRUCTURED_RESUME } from '../data/defaultResume';
import { sanitizeExtractedText, validateAndExtractDocumentFile } from '../utils/fileValidator';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadResume: (data: StructuredResume, rawText?: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLoadResume,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

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

  useEffect(() => {
    if (!isOpen) {
      setUploadError(null);
      setParseStatus(null);
      setFileName(null);
      setIsDragging(false);
      setIsValidating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processValidatedFile = async (file: File) => {
    setUploadError(null);
    setParseStatus('Validating file security & extracting text...');
    setFileName(file.name);
    setIsValidating(true);

    try {
      const result = await validateAndExtractDocumentFile(file);
      if (!result.valid || !result.extractedText) {
        setParseStatus(null);
        setFileName(null);
        setUploadError(result.error || 'Could not validate uploaded file.');
        return;
      }

      processContent(result.extractedText);
    } catch (err: any) {
      setParseStatus(null);
      setFileName(null);
      setUploadError(err?.message || 'Unexpected error validating file.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void processValidatedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processValidatedFile(file);
    }
  };

  const processContent = (rawText: string) => {
    const cleanText = sanitizeExtractedText(rawText);
    if (!cleanText || cleanText.length < 15) {
      setUploadError('Please provide at least a short resume summary or work history.');
      setParseStatus(null);
      return;
    }

    try {
      const parsed = parseResumeText(cleanText);
      const merged: StructuredResume = {
        ...DEFAULT_STRUCTURED_RESUME,
        name: parsed.name || DEFAULT_STRUCTURED_RESUME.name,
        summary: parsed.summary || cleanText.slice(0, 600),
      };

      setParseStatus('Validated and parsed resume content!');
      setTimeout(() => {
        onLoadResume(merged, cleanText);
        onClose();
      }, 350);
    } catch {
      setParseStatus('Imported sanitized plain text content');
      onLoadResume(
        {
          ...DEFAULT_STRUCTURED_RESUME,
          summary: cleanText.slice(0, 600),
        },
        cleanText
      );
      onClose();
    }
  };

  const handlePasteSubmit = () => {
    setUploadError(null);
    if (!pastedText.trim()) {
      setUploadError('Please paste your resume text first.');
      return;
    }
    processContent(pastedText);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-xl border border-[#E5EAF0] w-full max-w-lg max-h-[92dvh] overflow-hidden flex flex-col text-[#182230]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3 bg-[#F7F9FC] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#173B65] text-white flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#173B65] truncate">
                Upload or Paste Existing CV
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Supports PDF, DOCX, TXT, MD, TEX (Max 5 MB · Private).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex flex-wrap border-b border-[#E5EAF0] px-4 sm:px-6 pt-3 gap-4 sm:gap-5 text-xs font-medium bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setUploadError(null);
            }}
            className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#173B65] text-[#173B65] font-semibold'
                : 'border-transparent text-slate-500 hover:text-[#173B65]'
            }`}
          >
            Upload Document File
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('paste');
              setUploadError(null);
            }}
            className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'paste'
                ? 'border-[#173B65] text-[#173B65] font-semibold'
                : 'border-transparent text-slate-500 hover:text-[#173B65]'
            }`}
          >
            Paste Resume Text
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[12px] p-6 sm:p-8 text-center transition-all ${
                isDragging
                  ? 'border-[#173B65] bg-[#F7F9FC]'
                  : 'border-[#E5EAF0] hover:border-[#3978B8] hover:bg-[#F7F9FC]'
              }`}
            >
              <input
                type="file"
                id="cv-file-input"
                accept=".txt,.md,.tex,.pdf,.docx"
                disabled={isValidating}
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="cv-file-input" className="cursor-pointer block">
                <FileText className="w-10 h-10 text-[#3978B8] mx-auto mb-2.5" />
                <span className="text-sm font-semibold text-[#173B65] block">
                  {isValidating ? 'Scanning and validating file...' : 'Click to browse or drop file here'}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  PDF, DOCX, TXT, MD, TEX · Up to 5 MB
                </span>
              </label>

              {fileName && !uploadError && (
                <div className="mt-4 p-2.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] text-xs text-[#182230] flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="truncate">{fileName}</span>
                </div>
              )}

              {parseStatus && (
                <div className="mt-2.5 text-xs text-[#3978B8] font-medium">
                  {parseStatus}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={8}
                maxLength={80000}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your complete resume text or LaTeX source here..."
                className="w-full text-xs p-3 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] focus:outline-none font-mono text-[#182230]"
              />
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className="btn-interactive w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] transition-colors disabled:opacity-50"
              >
                Import and Parse Resume
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] px-3 py-2">
            <ShieldCheck className="w-4 h-4 text-[#3978B8] shrink-0" />
            <span>
              Files are validated for size, signature, and script safety, and stay private to your workspace.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
