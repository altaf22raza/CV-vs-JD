import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_JOB_DESCRIPTIONS } from '../data/defaultResume';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2A44]">
                Paste Job Description
              </h3>
              <p className="text-xs text-slate-500">
                Identify key ATS keywords to add to your CV and improve your match score.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Job Description Content</span>
            </label>

            {/* Quick 1-click sample button */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Quick test:</span>
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_JOB_DESCRIPTIONS[0].text)}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-[11px]"
              >
                Razorpay APM
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_JOB_DESCRIPTIONS[1].text)}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-[11px]"
              >
                Swiggy AI PM
              </button>
            </div>
          </div>

          <textarea
            rows={10}
            required
            autoFocus
            value={jdText}
            placeholder="Paste the target job description here..."
            onChange={(e) => setJdText(e.target.value)}
            className="w-full text-xs p-3.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
          />

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>How it works:</strong> The AI extracts all critical keywords required by this JD, flags which ones to add to your CV to pass ATS filters, and improves your summary and bullets automatically.
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {isProcessing && (
                <span className="flex items-center gap-2 text-blue-600 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {statusMessage}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !jdText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Identify Keywords & Optimize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
