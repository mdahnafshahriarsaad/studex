import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { AuthMode, ClassLevel } from '../types';
import {
  registerAccountAsync,
  loginAccountAsync,
  resendVerificationEmail,
  requestPasswordResetAsync,
  isConfigured,
} from '../services/authService';
import {
  Mail, Lock, User, GraduationCap, ArrowRight, CheckCircle2,
  ShieldCheck, Sparkles, X, RefreshCw, MailCheck, AlertTriangle,
} from 'lucide-react';

interface AuthModalProps {
  onSuccess: () => void;
  onClose?: () => void;
  initialMode?: AuthMode;
}

const CLASS_OPTIONS: ClassLevel[] = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('Class 9');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!email.trim() || !password || !name.trim()) {
        throw new Error('Please fill in all required fields.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const result = await registerAccountAsync(email, password, name, selectedClass);

      if (result.needsVerification) {
        setNeedsVerification(true);
        setSuccessMsg(result.message);
        setResendCooldown(60);
        startCooldown('resend');
      }
    } catch (err: any) {
      // Firebase auth/invalid-email, auth/email-already-in-use, auth/weak-password
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error('Please enter your email and password.');
      }

      await loginAccountAsync(email, password);
      setSuccessMsg('Authentication successful!');
      setTimeout(() => onSuccess(), 400);
    } catch (err: any) {
      if (err.unverified) {
        setNeedsVerification(true);
        setError('Your email has not been verified yet. Please check your inbox for the verification email from Firebase.');
      } else {
        const code = err?.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          setError('No account found with this email, or the password is incorrect.');
        } else if (code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else if (code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please wait a moment and try again.');
        } else {
          setError(err.message || 'Login failed.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const msg = await requestPasswordResetAsync(email);
      setSuccessMsg(msg);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const msg = await resendVerificationEmail();
      setSuccessMsg(msg);
      setResendCooldown(60);
      startCooldown('resend');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer
  const startCooldown = (type: 'resend') => {
    let count = 60;
    const interval = setInterval(() => {
      count -= 1;
      setResendCooldown(count);
      if (count <= 0) clearInterval(interval);
    }, 1000);
  };

  const switchToLogin = () => {
    setMode('login');
    setError(null);
    setSuccessMsg(null);
    setNeedsVerification(false);
  };

  const switchToSignup = () => {
    setMode('signup');
    setError(null);
    setSuccessMsg(null);
    setNeedsVerification(false);
  };

  const switchToForgotPassword = () => {
    setMode('forgot-password');
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  // If Firebase isn't configured, show a blocking message
  if (!isConfigured) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <GlassCard className="border-amber-500/30 bg-black/95 p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition z-20 border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="text-center mb-6">
              <img
                src="/logo-mark.png"
                alt="Studex Logo"
                className="w-20 h-20 mx-auto mb-4 object-contain filter drop-shadow-[0_0_32px_rgba(0,240,255,0.85)]"
              />
              <h2 className="text-lg font-bold text-white mb-2">Authentication Not Configured</h2>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Firebase project credentials are required.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-amber-400/80">
                <li>Create a project at <span className="text-white">console.firebase.google.com</span></li>
                <li>Enable <span className="text-white">Email/Password</span> authentication</li>
                <li>Add a <span className="text-white">Web app</span> and copy the config</li>
                <li>Set <span className="text-white">VITE_FIREBASE_*</span> env vars in Vercel</li>
              </ol>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

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
              {mode === 'login' && 'Sign in with your verified email account'}
              {mode === 'signup' && 'Create your Studex account — a verification email will be sent'}
              {mode === 'forgot-password' && 'A password reset link will be sent to your email'}
            </p>
          </div>

          {/* Tab Selection (login/signup only) */}
          {!needsVerification && (
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
          )}

          {/* Verification Pending Panel */}
          {needsVerification && (
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
                <p className="text-amber-300/80">
                  A verification email was sent to <span className="text-white font-semibold">{email}</span>.
                  Please open your email inbox, find the email from Firebase, and click the verification link.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs text-center space-y-1">
                <p className="font-semibold">After verifying your email:</p>
                <p>Come back here and sign in with your email and password.</p>
              </div>

              {/* Resend Verification Email */}
              <div className="mt-4 text-center">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-neutral-500">You can resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="text-xs text-electric-400 hover:text-electric-300 font-medium flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Resend Verification Email
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={switchToLogin}
                className="w-full mt-4 text-xs text-electric-400 hover:text-electric-300 font-medium transition"
              >
                Already verified? Sign In
              </button>
            </motion.div>
          )}

          {/* Error & Success Alerts */}
          {error && !needsVerification && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium"
            >
              {error}
            </motion.div>
          )}
          {successMsg && !needsVerification && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </motion.div>
          )}

          {/* Main Form */}
          {!needsVerification && (
            <form
              onSubmit={
                mode === 'login'
                  ? handleLogin
                  : mode === 'signup'
                  ? handleSignup
                  : handleForgotPassword
              }
              className="space-y-4"
            >
              {/* Full Name (signup only) */}
              {mode === 'signup' && (
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
              )}

              {/* Academic Class (signup only) */}
              {mode === 'signup' && (
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
              )}

              {/* Email */}
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Password (not for forgot-password) */}
              {mode !== 'forgot-password' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-neutral-300 font-medium">Password</label>
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
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition"
                    />
                  </div>
                </div>
              )}

              {/* Confirm Password (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1">Confirm Password</label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
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
                  loading ? undefined :
                  mode === 'login' ? <ArrowRight className="w-4 h-4" /> :
                  mode === 'signup' ? <Sparkles className="w-4 h-4" /> :
                  <Mail className="w-4 h-4" />
                }
              >
                {loading
                  ? 'Processing...'
                  : mode === 'login'
                  ? 'Sign In to Studex'
                  : mode === 'signup'
                  ? 'Create Studex Account'
                  : 'Send Password Reset Email'}
              </Button>

              {/* Forgot password: back to login */}
              {mode === 'forgot-password' && (
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="w-full text-xs text-neutral-400 hover:text-white transition"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          )}

          {/* Footer */}
          <div className="mt-5 text-center text-[10px] text-neutral-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-electric-400" />
            <span>Authentication powered by Firebase</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
