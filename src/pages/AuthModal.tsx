import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { AuthMode, ClassLevel } from '../types';
import { registerAccountAsync, loginAccountAsync, verifyEmailAsync, verifyOtpAsync, resendOtpAsync, requestPasswordResetAsync, resetPasswordAsync } from '../services/authService';
import { Mail, Lock, User, GraduationCap, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, Sparkles, AlertTriangle, ExternalLink, X, RefreshCw, MailCheck } from 'lucide-react';

interface AuthModalProps {
  onSuccess: () => void;
  onClose?: () => void;
  initialMode?: AuthMode;
}

const CLASS_OPTIONS: ClassLevel[] = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('Class 9');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP verification state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [otpResendCount, setOtpResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpLocked, setOtpLocked] = useState(false);
  const [otpLockMessage, setOtpLockMessage] = useState('');

  // Forgot password state
  const [resetStep, setResetStep] = useState<'request' | 'enter-code'>('request');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [resetCodeSent, setResetCodeSent] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resetOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check URL parameters for email verification token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verifyToken');
    const paramEmail = params.get('email');

    if (token) {
      setLoading(true);
      verifyEmailAsync(token, paramEmail || undefined)
        .then((msg) => {
          setSuccessMsg(msg || 'Email verified successfully! You can now log in.');
          setMode('login');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          setError(err.message || 'Verification link expired or invalid.');
        })
        .finally(() => setLoading(false));
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Reset cooldown timer
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setTimeout(() => setResetCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCooldown]);

  // Auto-focus first OTP input when entering OTP mode
  useEffect(() => {
    if (mode === 'signup' && verificationPendingEmail) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
    if (mode === 'forgot-password' && resetStep === 'enter-code') {
      setTimeout(() => resetOtpInputRefs.current[0]?.focus(), 100);
    }
  }, [verificationPendingEmail, resetStep]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/\d/.test(value) && value !== '') return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetOtpChange = (index: number, value: string) => {
    if (!/\d/.test(value) && value !== '') return;
    const newOtp = [...resetOtp];
    newOtp[index] = value.slice(-1);
    setResetOtp(newOtp);
    if (value && index < 5) {
      resetOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleResetOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !resetOtp[index] && index > 0) {
      resetOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!verificationPendingEmail || resendCooldown > 0 || otpLocked) return;
    setLoading(true);
    setError(null);
    try {
      const result = await resendOtpAsync(verificationPendingEmail);
      setOtpCode(['', '', '', '', '', '']);
      setOtpResendCount(result.resendCount || 0);
      setResendCooldown(60);
      setSuccessMsg(result.message || 'New verification code sent!');
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
      if (err.maxResendReached) {
        setOtpLocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    const otpStr = otpCode.join('');
    if (otpStr.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    if (!verificationPendingEmail) return;

    setLoading(true);
    setError(null);
    try {
      const result = await verifyOtpAsync(verificationPendingEmail, otpStr);
      if (result.verified) {
        setSuccessMsg(result.message || 'Email verified! You can now sign in.');
        setVerificationPendingEmail(null);
        setVerificationLink(null);
        setTimeout(() => {
          setMode('login');
          setSuccessMsg(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
      if (err.locked) {
        setOtpLocked(true);
        setOtpLockMessage(err.message);
      }
      if (err.expired) {
        setOtpCode(['', '', '', '', '', '']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestPasswordResetAsync(email);
      setResetCodeSent(true);
      setResetStep('enter-code');
      setResetCooldown(60);
      setSuccessMsg('If an account exists with this email, a reset code has been sent.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithOtp = async () => {
    const otpStr = resetOtp.join('');
    if (otpStr.length !== 6) {
      setError('Please enter the complete 6-digit reset code.');
      return;
    }
    if (!password || password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPasswordAsync(email, password, undefined, otpStr);
      setSuccessMsg('Password reset successfully! Please log in with your new password.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg(null);
        setResetStep('request');
        setResetCodeSent(false);
        setResetOtp(['', '', '', '', '', '']);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !password || !name.trim()) {
          throw new Error('Please fill in all required fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const res = await registerAccountAsync(email, password, name, selectedClass);
        if (res.user && !res.user.isVerified) {
          // Backend requires email verification - switch to OTP entry
          setVerificationPendingEmail(email.trim().toLowerCase());
          setSuccessMsg(res.message || 'A verification code has been sent to your email.');
          setResendCooldown(60);
        } else {
          // Account created (auto-verified or local mode)
          setSuccessMsg(res.message || 'Account created! You can now sign in.');
          setTimeout(() => {
            setMode('login');
            setSuccessMsg(null);
          }, 1800);
        }
      } else if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password.');
        }
        await loginAccountAsync(email, password);
        setSuccessMsg('Authentication successful! Welcome to Studex Cloud.');
        setTimeout(() => {
          onSuccess();
        }, 600);
      }
    } catch (err: any) {
      if (err.unverified) {
        setVerificationPendingEmail(err.email || email.trim().toLowerCase());
        if (err.verificationLink) setVerificationLink(err.verificationLink);
        setError('Please verify your email before continuing. Enter the 6-digit code sent to your email.');
        setResendCooldown(60);
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerifyClick = async () => {
    if (verificationLink) {
      window.open(verificationLink, '_blank');
    } else if (verificationPendingEmail) {
      // No link but have email - resend OTP
      await handleResendOtp();
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setError(null);
    setSuccessMsg(null);
    setVerificationPendingEmail(null);
    setVerificationLink(null);
    setOtpCode(['', '', '', '', '', '']);
    setResetStep('request');
    setResetCodeSent(false);
    setResetOtp(['', '', '', '', '', '']);
    setOtpLocked(false);
  };

  const switchToSignup = () => {
    setMode('signup');
    setError(null);
    setSuccessMsg(null);
    setVerificationPendingEmail(null);
    setVerificationLink(null);
    setOtpCode(['', '', '', '', '', '']);
    setResetStep('request');
    setResetCodeSent(false);
    setResetOtp(['', '', '', '', '', '']);
    setOtpLocked(false);
  };

  const switchToForgotPassword = () => {
    setMode('forgot-password');
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setResetStep('request');
    setResetCodeSent(false);
    setResetOtp(['', '', '', '', '', '']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md"
      >
        <GlassCard className="border-electric-500/30 bg-black/95 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Glow & Watermark */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-electric-500/10 rounded-full blur-3xl pointer-events-none" />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition z-20 border border-white/10"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <img
            src="/watermark.png"
            alt=""
            className="absolute -bottom-8 -right-8 w-40 h-40 opacity-5 pointer-events-none"
          />

          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-3">
              <img
                src="/logo-mark.png"
                alt="Studex Logo"
                className="w-24 h-24 md:w-28 md:h-28 object-contain filter drop-shadow-[0_0_32px_rgba(0,240,255,0.85)]"
              />
              <img src="/wordmark.png" alt="Studex" className="h-16 md:h-18 object-contain" />
            </div>
            <p className="text-xs text-neutral-400 font-medium tracking-wide">
              {mode === 'login' && 'Sign in with your email account to access cloud study progress'}
              {mode === 'signup' && 'Create your Studex account for multi-device sync'}
              {mode === 'forgot-password' && 'Reset your Studex account password'}
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={switchToLogin}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'login'
                  ? 'bg-electric-500/20 text-electric-400 border border-electric-500/40 shadow-glow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={switchToSignup}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-electric-500/20 text-electric-400 border border-electric-500/40 shadow-glow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* OTP Verification Panel */}
          {verificationPendingEmail && mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="p-4 mb-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs text-center font-medium space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
                  <MailCheck className="w-4 h-4" />
                  <span>Email Verification Required</span>
                </div>
                <p>A 6-digit verification code was sent to <span className="text-white font-semibold">{verificationPendingEmail}</span></p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-2 mb-4">
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={otpLocked}
                    className={`w-10 h-12 rounded-lg bg-white/5 border text-center text-lg font-bold text-white focus:outline-none transition ${
                      otpLocked
                        ? 'border-red-500/30 opacity-50'
                        : 'border-white/20 focus:border-electric-400'
                    }`}
                  />
                ))}
              </div>

              {otpLocked ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                  {otpLockMessage || 'Too many failed attempts. Please try again later.'}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={loading || otpCode.join('').length !== 6}
                  icon={<ShieldCheck className="w-4 h-4" />}
                  onClick={handleOtpVerify}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
              )}

              {/* Resend OTP */}
              <div className="mt-3 text-center">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-neutral-500">Resend code in {resendCooldown}s</span>
                ) : !otpLocked ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs text-electric-400 hover:text-electric-300 font-medium flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend Verification Code
                  </button>
                ) : null}
              </div>

              {verificationLink && (
                <button
                  type="button"
                  onClick={handleManualVerifyClick}
                  className="w-full mt-2 text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center justify-center gap-1 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  Or verify via email link
                </button>
              )}

              <button
                type="button"
                onClick={switchToLogin}
                className="w-full mt-3 text-[11px] text-neutral-500 hover:text-white transition"
              >
                Already verified? Sign In
              </button>
            </motion.div>
          )}

          {/* Standard Error & Success Alerts */}
          {error && !verificationPendingEmail && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium"
            >
              {error}
            </motion.div>
          )}
          {successMsg && !verificationPendingEmail && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </motion.div>
          )}

          {/* Main Form (hidden when OTP panel is showing for signup) */}
          {!(verificationPendingEmail && mode === 'signup') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Saad Rahman"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Academic Class */}
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">Academic Class</label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:border-electric-400 focus:outline-none transition"
                      >
                        {CLASS_OPTIONS.map((c) => (
                          <option key={c} value={c} className="bg-black text-white">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@studex.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-neutral-300 font-medium">
                    {mode === 'forgot-password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={switchToForgotPassword}
                      className="text-[11px] text-electric-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'forgot-password' ? 'Enter new password' : '••••••••'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Forgot Password Flow */}
              {mode === 'forgot-password' && (
                <>
                  {/* Step 1: Request Reset */}
                  {resetStep === 'request' && (
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={loading}
                      icon={<Mail className="w-4 h-4" />}
                      onClick={(e) => { e.preventDefault(); handleRequestReset(); }}
                    >
                      {loading ? 'Sending...' : 'Send Reset Code to Email'}
                    </Button>
                  )}

                  {/* Step 2: Enter Reset OTP + New Password */}
                  {resetStep === 'enter-code' && (
                    <>
                      {/* Reset OTP Input Boxes */}
                      <div>
                        <label className="block text-xs text-neutral-300 font-medium mb-2">Reset Code (from email)</label>
                        <div className="flex justify-center gap-2">
                          {resetOtp.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => { resetOtpInputRefs.current[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleResetOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleResetOtpKeyDown(i, e)}
                              className="w-10 h-12 rounded-lg bg-white/5 border border-white/20 text-center text-lg font-bold text-white focus:border-electric-400 focus:outline-none transition"
                            />
                          ))}
                        </div>
                        <div className="mt-2 text-center">
                          {resetCooldown > 0 ? (
                            <span className="text-[11px] text-neutral-500">Resend in {resetCooldown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestReset}
                              disabled={loading}
                              className="text-[11px] text-electric-400 hover:text-electric-300 font-medium flex items-center gap-1 mx-auto"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Resend Reset Code
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-xs text-neutral-300 font-medium mb-1">Confirm New Password</label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={loading}
                        icon={<ShieldCheck className="w-4 h-4" />}
                        onClick={(e) => { e.preventDefault(); handleResetWithOtp(); }}
                      >
                        {loading ? 'Resetting...' : 'Reset Password'}
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Submit Button (login & signup) */}
              {mode !== 'forgot-password' && (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={loading}
                  icon={
                    mode === 'login' ? (
                      <ArrowRight className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )
                  }
                >
                  {loading
                    ? 'Processing...'
                    : mode === 'login'
                    ? 'Sign In to Studex'
                    : 'Create Studex Account'}
                </Button>
              )}
            </form>
          )}

          {/* Footer Sync Note */}
          <div className="mt-5 text-center text-[10px] text-neutral-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-electric-400" />
            <span>Automatic cross-device sync powered by Studex Cloud</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
