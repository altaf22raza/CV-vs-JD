import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_JOB_DESCRIPTIONS } from '../data/defaultResume';
import { DocumentTextSkeleton } from './SkeletonLoaders';

interface JdInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimize: (jdText: string) => Promise<void>;
  isProcessing: boolean;
  statusMessage?: string;
}

export const JdInputModal: React.FC<JdInputModalProps> = ({
  isOpen,
  onClose,
  onOptimize,
  isProcessing,
  statusMessage = 'Extracting ATS keywords from JD & optimizing resume...'
}) => {
  const [jdText, setJdText] = useState<string>('');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoadSample = (sampleText: string) => {
    setJdText(sampleText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    onOptimize(jdText);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-xl border border-[#E5EAF0] w-full max-w-xl overflow-hidden flex flex-col max-h-[92dvh] text-[#182230]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3 bg-[#F7F9FC]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#173B65] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#173B65] truncate">
                Paste Job Description
              </h3>
              <p className="text-xs text-slate-500">
                Identify key ATS keywords to add to your CV and improve your alignment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors disabled:opacity-40 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {isProcessing ? (
            <div className="py-1">
              <DocumentTextSkeleton lines={5} statusText={statusMessage} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[#182230] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>Job Description Content</span>
                </label>

                {/* Quick 1-click sample button */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>Quick test:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(SAMPLE_JOB_DESCRIPTIONS[0].text)}
                    className="text-[#3978B8] hover:text-[#173B65] hover:underline font-medium text-[11px]"
                  >
                    Razorpay APM
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(SAMPLE_JOB_DESCRIPTIONS[1].text)}
                    className="text-[#3978B8] hover:text-[#173B65] hover:underline font-medium text-[11px]"
                  >
                    Swiggy AI PM
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                required
                autoFocus
                value={jdText}
                placeholder="Paste the target job description here..."
                onChange={(e) => setJdText(e.target.value)}
                className="w-full text-xs p-3.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
              />

              <div className="p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] text-xs text-[#182230] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#3978B8] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-slate-600">
                  <strong className="text-[#173B65]">How it works:</strong> The AI extracts critical keywords required by this JD, flags gaps to add to your CV, and proposes bullet edits you can accept or reject individually.
                </div>
              </div>
            </>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#173B65] rounded-[10px] hover:bg-[#F7F9FC] transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !jdText.trim()}
              className="btn-interactive flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Optimizing...' : 'Identify Keywords & Optimize'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
