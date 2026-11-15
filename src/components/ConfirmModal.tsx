import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  itemName,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-2xl border border-[#E5EAF0] w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F7F9FC] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-[#173B65]/10 text-[#173B65] border border-[#173B65]/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 id="confirm-modal-title" className="text-sm font-bold text-[#182230] truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-[#182230] rounded-[10px] hover:bg-white transition-colors cursor-pointer shrink-0"
            aria-label="Close confirmation dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
          {itemName && (
            <div className="px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] text-xs font-semibold text-[#182230] break-words">
              {itemName}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F7F9FC] border-t border-[#E5EAF0] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="btn-interactive px-4 py-2 text-xs font-semibold text-[#182230] bg-white hover:bg-slate-50 border border-[#E5EAF0] rounded-[10px] cursor-pointer whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`btn-interactive px-4 py-2 text-xs font-semibold text-white rounded-[10px] cursor-pointer whitespace-nowrap ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#173B65] hover:bg-[#122F52]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
