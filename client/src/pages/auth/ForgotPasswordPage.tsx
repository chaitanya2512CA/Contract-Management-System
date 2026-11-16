import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  KeyRound,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step flow: 'email' -> 'otp' -> 'success'
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend OTP countdown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      setSuccessMessage(res.data.message || 'Verification code sent to your email.');
      setStep('otp');
      setResendCooldown(60); // 60s cooldown for resending
    } catch (err: any) {
      console.error('[Forgot Password Error]:', err);
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setErrorMessage('Unable to connect to the authentication server. Please check your network.');
      } else {
        setErrorMessage('Failed to send recovery code. Please verify your email and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      setSuccessMessage(res.data.message || 'New verification code sent to your email.');
      setResendCooldown(60);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Failed to resend verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your new password.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword,
      });

      setStep('success');
    } catch (err: any) {
      console.error('[Reset Password Error]:', err);
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setErrorMessage('Unable to connect to the authentication server. Please check your network.');
      } else {
        setErrorMessage('Failed to reset password. Please verify the verification code and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] p-4 text-[#F5E6C4] selection:bg-[#D4AF37] selection:text-black">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#262118] bg-[#121212] text-[#D4AF37] shadow-sm transition group-hover:border-[#D4AF37]">
              <Scale className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-2xl font-black text-white group-hover:text-[#D4AF37] transition">
              JurisFlow
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-black tracking-tight text-white">
            {step === 'success'
              ? 'Password Reset Complete'
              : step === 'otp'
              ? 'Enter Verification Code'
              : 'Password Recovery'}
          </h2>
          <p className="mt-1 text-xs text-[#A39E93] font-medium">
            {step === 'success'
              ? 'Your account credentials have been securely updated.'
              : step === 'otp'
              ? `We sent a 6-digit reset code to ${email}`
              : 'Enter your registered email to receive a 6-digit reset code.'}
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-900/60 bg-rose-950/40 p-3.5 text-xs text-rose-300 shadow-lg">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && step !== 'success' && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-900/60 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 shadow-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="flex-1 leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-2xl backdrop-blur-sm">
          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#A39E93]">Registered Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A39E93]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-3.5 text-xs text-[#F5E6C4] placeholder:text-[#666158] focus:border-[#D4AF37] focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[#D4AF37] py-3.5 text-xs font-black text-[#080808] shadow-md transition hover:bg-[#AA7C11] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 text-black" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP and Set New Password */}
          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#A39E93]">6-Digit Code</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setErrorMessage('');
                    }}
                    className="text-[11px] font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A39E93]" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-3.5 text-center text-sm font-black tracking-widest text-[#D4AF37] placeholder:text-[#666158] focus:border-[#D4AF37] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A39E93]">New Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A39E93]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-10 text-xs text-[#F5E6C4] placeholder:text-[#666158] focus:border-[#D4AF37] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#A39E93] hover:text-[#D4AF37] transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A39E93]">Confirm New Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A39E93]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-10 text-xs text-[#F5E6C4] placeholder:text-[#666158] focus:border-[#D4AF37] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-[#A39E93] hover:text-[#D4AF37] transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#A39E93]">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-[11px] font-bold text-[#D4AF37] hover:underline disabled:opacity-50 disabled:hover:no-underline cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[#D4AF37] py-3.5 text-xs font-black text-[#080808] shadow-md transition hover:bg-[#AA7C11] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-black" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#1A1A1A] text-[#D4AF37] shadow-lg">
                <CheckCircle2 className="h-7 w-7 text-[#D4AF37]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-white">Credentials Updated</h3>
                <p className="text-xs text-[#A39E93] max-w-xs mx-auto leading-relaxed">
                  Your password has been securely reset. You can now access your JurisFlow account with your new credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-2xl bg-[#D4AF37] py-3.5 text-xs font-black text-[#080808] shadow-md transition hover:bg-[#AA7C11] cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          )}

          {/* Bottom Navigation */}
          {step !== 'success' && (
            <div className="mt-5 border-t border-[#262118] pt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A39E93] transition hover:text-[#D4AF37]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
