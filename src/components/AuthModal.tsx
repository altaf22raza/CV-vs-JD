import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Download, 
  ShieldCheck, 
  Sparkles 
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
  const { requestEmailOtp, verifyEmailOtp } = useAuth();
  
  // Step 1: enter email | Step 2: enter 6-digit OTP
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Timer countdown for resending code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

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
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
      setStep('otp');
      setResendCooldown(30);
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

      // Success! Close modal and run success callback
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

  const handleAutoFillDebug = () => {
    if (debugOtp) {
      setOtp(debugOtp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F2A44] text-white flex items-center justify-center shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2A44]">
                {title || (step === 'email' ? 'Sign In / Sign Up' : 'Verify Email Code')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {subtitle || 'Use your email address with fast OTP verification.'}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Security Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Passwordless email authentication. No passwords to remember.</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL */}
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We will send a 6-digit one-time code to this email.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 px-4 bg-[#1F2A44] hover:bg-[#161f33] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {infoMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{infoMessage}</span>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="ml-2 text-blue-600 underline font-semibold hover:text-blue-800 text-[11px]"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Development OTP quick auto-fill helper */}
              {debugOtp && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-amber-800">Demo Code:</span>{' '}
                    <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                      {debugOtp}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDebug}
                    className="text-[11px] font-semibold text-blue-700 bg-white border border-amber-300 hover:bg-amber-100 px-2 py-0.5 rounded shadow-2xs transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                    className="w-full text-base font-mono tracking-widest pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-center font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Didn&apos;t get the code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendOtp}
                  className="text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="flex-1 py-2.5 px-4 bg-[#1F2A44] hover:bg-[#161f33] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
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
