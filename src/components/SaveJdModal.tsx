import React, { useState, useEffect } from 'react';
import { X, Briefcase, Building2, FileText } from 'lucide-react';
import { SavedJobDescription } from '../types/resume';

interface SaveJdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jd: { id?: string; role: string; company: string; industry?: string; text: string }) => void;
  editingJd?: SavedJobDescription | null;
}

export const SaveJdModal: React.FC<SaveJdModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingJd,
}) => {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (editingJd) {
      setRole(editingJd.role || '');
      setCompany(editingJd.company || '');
      setIndustry(editingJd.industry || '');
      setText(editingJd.text || '');
    } else {
      setRole('');
      setCompany('');
      setIndustry('');
      setText('');
    }
  }, [editingJd, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !text.trim()) return;
    onSave({
      id: editingJd?.id,
      role: role.trim(),
      company: company.trim() || 'Target Company',
      industry: industry.trim() || undefined,
      text: text.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-xl border border-[#E5EAF0] w-full max-w-xl overflow-hidden flex flex-col max-h-[92dvh] text-[#182230]">
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3 bg-[#F7F9FC]">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#173B65] truncate">
              {editingJd ? 'Edit Saved Job Description' : 'Save Target Job Description'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Store role requirements so you can tailor any resume version in one click.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#182230] mb-1.5">
                Target Role <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5EAF0] rounded-[10px] focus:outline-none focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] text-[#182230]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#182230] mb-1.5">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5EAF0] rounded-[10px] focus:outline-none focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] text-[#182230]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182230] mb-1.5">
              Domain / Industry (Optional)
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. B2B SaaS, FinTech"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5EAF0] rounded-[10px] focus:outline-none focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] text-[#182230]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182230] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#3978B8]" />
              <span>Job Description Text <span className="text-rose-600">*</span></span>
            </label>
            <textarea
              rows={8}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full job responsibilities and requirements..."
              className="w-full p-3 text-xs bg-white border border-[#E5EAF0] rounded-[10px] focus:outline-none focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] leading-relaxed text-[#182230]"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#173B65] rounded-[10px] hover:bg-[#F7F9FC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!role.trim() || !text.trim()}
              className="btn-interactive px-5 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              {editingJd ? 'Save Changes' : 'Save Job Description'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
