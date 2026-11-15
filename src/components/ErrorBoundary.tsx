import React from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleResetCorruptedCache = () => {
    try {
      localStorage.removeItem('resumeiq_versions');
      localStorage.removeItem('resumeiq_saved_jds');
      localStorage.removeItem('resumeiq_applications');
    } catch {
      // ignore storage failure
    }
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4 text-[#182230]">
          <div className="max-w-md w-full bg-white border border-[#E5EAF0] rounded-[14px] shadow-lg p-6 space-y-4">
            <div className="w-11 h-11 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-[#173B65]">
                Something went wrong
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                The workspace encountered unexpected or malformed input data and safely paused rendering to protect your session.
              </p>
              {this.state.errorMessage && (
                <div className="mt-2 p-2.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] text-[11px] font-mono text-slate-600 break-words">
                  {this.state.errorMessage}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="btn-interactive flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCorruptedCache}
                className="btn-interactive flex-1 py-2.5 px-4 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-[10px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Local Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
