import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  title,
  subtitle,
  onSuccess
}) => {
  const { requestEmailOtp, verifyEmailOtp, signInWithGoogle } = useAuth();
  
  // Step 1: enter email | Step 2: enter 6-digit OTP
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Timer countdown for resending code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || 'Could not complete Google Sign-In.');
        return;
      }
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await requestEmailOtp(email);
      setInfoMessage(`We've sent a 6-digit verification code to ${email}`);
      setStep('otp');
      setResendCooldown(res.resendCooldownSec || 45);
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await verifyEmailOtp(email, otp);
      if (!result.success) {
        setError(result.error || 'Verification failed. Please check the code.');
        return;
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#182230]/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[14px] shadow-xl border border-[#E5EAF0] w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden text-[#182230]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3 bg-[#F7F9FC] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#173B65] text-white flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#173B65] truncate">
                {title || (step === 'email' ? 'Sign In / Sign Up' : 'Verify Email Code')}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {subtitle || 'Sign in with Google or verified email via Firebase Authentication.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-[#173B65] rounded-[8px] hover:bg-[#E5EAF0]/60 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Security Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] text-[11px] text-[#173B65]">
            <ShieldCheck className="w-4 h-4 text-[#3978B8] shrink-0" />
            <span>Firebase Authentication &amp; private Firestore cloud sync.</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL */}
          {step === 'email' ? (
            <div className="space-y-4">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="btn-interactive w-full min-h-[42px] py-2.5 px-4 bg-white hover:bg-[#F7F9FC] text-[#182230] border border-[#E5EAF0] hover:border-[#3978B8] text-xs font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span className="w-4 h-4 rounded-full bg-[#173B65] text-white text-[10px] font-bold flex items-center justify-center">
                  G
                </span>
                <span>Continue with Google (Cloud Sync)</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E5EAF0] w-full" />
                <span className="bg-white px-2.5 text-[11px] text-slate-400 shrink-0">
                  or sign in with email code
                </span>
                <div className="border-t border-[#E5EAF0] w-full" />
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#182230] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] focus:outline-none text-[#182230]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    We will send a 6-digit one-time code to this email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-interactive w-full min-h-[42px] py-2.5 px-4 bg-[#173B65] hover:bg-[#122F52] text-white text-xs font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* STEP 2: ENTER OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {infoMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[10px] text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{infoMessage}</span>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="ml-2 text-[#3978B8] underline font-semibold hover:text-[#173B65] text-[11px]"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#182230] mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full text-base font-mono tracking-widest pl-9 pr-3 py-2 bg-white border border-[#E5EAF0] rounded-[10px] focus:border-[#3978B8] focus:ring-1 focus:ring-[#3978B8] focus:outline-none text-center font-bold text-[#182230]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Didn&apos;t get the code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendOtp}
                  className="text-[#3978B8] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="btn-interactive py-2.5 px-3 bg-[#F7F9FC] hover:bg-[#E5EAF0]/60 border border-[#E5EAF0] text-[#182230] text-xs font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-interactive flex-1 py-2.5 px-4 bg-[#173B65] hover:bg-[#122F52] text-white text-xs font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
