import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { AuthMode, ClassLevel } from '../types';
import { registerAccountAsync, loginAccountAsync, resetPasswordAsync, verifyEmailAsync } from '../services/authService';
import { Mail, Lock, User, GraduationCap, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, Sparkles, AlertTriangle, ExternalLink, X } from 'lucide-react';

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

  // Email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          setVerificationPending(false);
          setMode('login');
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          setError(err.message || 'Verification link expired or invalid.');
        })
        .finally(() => setLoading(false));
    }
  }, []);

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
        setVerificationPending(true);
        if (res.verificationLink) {
          setVerificationLink(res.verificationLink);
        }
        setSuccessMsg(res.message || 'Please verify your email before continuing.');
      } else if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password.');
        }
        await loginAccountAsync(email, password);
        setSuccessMsg('Authentication successful! Welcome to Studex Cloud.');
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else if (mode === 'forgot-password') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and new password.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await resetPasswordAsync(email, password);
        setSuccessMsg('Password reset successfully! Please log in with your new password.');
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setSuccessMsg(null);
        }, 1500);
      }
    } catch (err: any) {
      if (err.unverified) {
        setVerificationPending(true);
        if (err.verificationLink) setVerificationLink(err.verificationLink);
        setError('Please verify your email before continuing.');
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
    }
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
              <img src="/wordmark.png" alt="Studex" className="h-20 md:h-24 object-contain" />
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
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
                setVerificationPending(false);
              }}
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
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMsg(null);
                setVerificationPending(false);
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-electric-500/20 text-electric-400 border border-electric-500/40 shadow-glow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Verification Warning Alert */}
          {verificationPending && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs text-center font-medium space-y-2"
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Email Verification Required</span>
              </div>
              <p>Please verify your email before continuing.</p>
              {verificationLink && (
                <button
                  onClick={handleManualVerifyClick}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-electric-500/20 hover:bg-electric-500/30 border border-electric-400 text-electric-400 font-semibold text-xs transition mt-1"
                >
                  <span>Click to Confirm Verification Link</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          )}

          {/* Standard Error & Success Alerts */}
          {error && !verificationPending && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium"
            >
              {error}
            </motion.div>
          )}
          {successMsg && !verificationPending && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </motion.div>
          )}

          {/* Form */}
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
                    onClick={() => {
                      setMode('forgot-password');
                      setError(null);
                      setSuccessMsg(null);
                    }}
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Confirm Password for Reset */}
            {mode === 'forgot-password' && (
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              icon={
                mode === 'login' ? (
                  <ArrowRight className="w-4 h-4" />
                ) : mode === 'signup' ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )
              }
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Studex'
                : mode === 'signup'
                ? 'Create Studex Account'
                : 'Reset Password'}
            </Button>
          </form>

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
