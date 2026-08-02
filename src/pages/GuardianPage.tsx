import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { generateDailyReportSummary } from '../services/guardianService';
import { findAccountByGuardianCode, lookupGuardianStudentAsync, connectGuardianAsync, fetchGuardianDashboardAsync } from '../services/authService';
import { calculateRemainingDays } from '../services/plannerEngine';
import {
  ShieldCheck, Lock, Share2, Copy, Check, Eye, Heart, Clock, AlertTriangle, Send, LogOut, CheckCircle2, ShieldAlert, RefreshCw, Loader2
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface GuardianPageProps {
  profile: UserProfile;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

export const GuardianPage: React.FC<GuardianPageProps> = ({ profile, onUpdateProfile }) => {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get('code') || '';

  const [inputCode, setInputCode] = useState(urlCode);
  const [guardianName, setGuardianName] = useState('');
  const [connectedProfile, setConnectedProfile] = useState<UserProfile | null>(null);
  const [connectedStudentName, setConnectedStudentName] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [encouragementText, setEncouragementText] = useState('');
  const [encouragementSent, setEncouragementSent] = useState(false);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const isGuardianView = Boolean(connectedProfile);
  const targetProfile = connectedProfile || profile;
  const guardianInfo = profile.guardian || { enabled: true, passcode: '', guardianCode: '' };
  const shareableUrl = `${window.location.origin}/guardian?code=${guardianInfo.guardianCode || guardianInfo.passcode}`;

  const report = generateDailyReportSummary(targetProfile);
  const daysRemaining = calculateRemainingDays(targetProfile.examInfo?.date);

  useEffect(() => {
    if (urlCode) {
      handleConnectWithCode(urlCode);
    }
  }, []);

  const handleConnectWithCode = async (codeToConnect: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!codeToConnect.trim()) {
      setErrorMsg('Please enter a valid Guardian Access Code.');
      return;
    }

    setLoadingConnect(true);

    // Try backend lookup first
    try {
      const result = await lookupGuardianStudentAsync(codeToConnect);
      if (result && result.profile) {
        setConnectedProfile(result.profile);
        setConnectedStudentName(result.profile.name);
        setLoadingConnect(false);
        return;
      }
    } catch (err) {
      console.warn('Backend guardian lookup failed, trying local:', err);
    }

    // Fallback to local lookup
    const acc = findAccountByGuardianCode(codeToConnect);
    if (acc) {
      setConnectedProfile(acc.profile);
      setConnectedStudentName(acc.name);
    } else {
      setErrorMsg('Invalid Guardian Access Code. Please check the code provided by the student.');
    }

    setLoadingConnect(false);
  };

  const handleFullConnect = async () => {
    if (!inputCode.trim() || !guardianName.trim()) {
      setErrorMsg('Please enter the Guardian Code and your name.');
      return;
    }

    setLoadingConnect(true);
    setErrorMsg(null);

    try {
      const result = await connectGuardianAsync(inputCode, guardianName.trim());
      if (result.success) {
        setSuccessMsg(`Connected to ${result.studentName || 'student'}! You can now monitor their progress.`);
        setConnectedStudentName(result.studentName || null);

        // Load dashboard data after connecting
        try {
          const dashData = await fetchGuardianDashboardAsync(inputCode);
          if (dashData && dashData.profile) {
            setConnectedProfile(dashData.profile);
          }
        } catch {
          // Dashboard fetch optional
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect as guardian.');
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(guardianInfo.guardianCode || guardianInfo.passcode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendEncouragement = () => {
    if (!encouragementText.trim()) return;
    setEncouragementSent(true);
    setEncouragementText('');
    setTimeout(() => setEncouragementSent(false), 3000);
  };

  const handleRefreshDashboard = async () => {
    if (!inputCode.trim()) return;
    setLoadingDashboard(true);
    try {
      const dashData = await fetchGuardianDashboardAsync(inputCode);
      if (dashData && dashData.profile) {
        setConnectedProfile(dashData.profile);
      }
    } catch {
      console.warn('Dashboard refresh failed');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleDisconnect = () => {
    setConnectedProfile(null);
    setConnectedStudentName(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    setInputCode('');
    setGuardianName('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-electric-400" />
            <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">
              Multi-Device Guardian Portal
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {isGuardianView ? `Monitoring: ${connectedStudentName || targetProfile.name}` : 'Guardian Access System'}
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            {isGuardianView
              ? 'Connected from guardian device in read-only mode.'
              : 'Generate and share your Guardian code or link for cross-device parental monitoring.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGuardianView && (
            <>
              <Button
                variant="glass"
                size="sm"
                icon={loadingDashboard ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                onClick={handleRefreshDashboard}
              >
                Refresh
              </Button>
              <Button
                variant="glass"
                size="sm"
                icon={<LogOut className="w-4 h-4" />}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </>
          )}
          <Badge variant="electric">Read-Only Permission Active</Badge>
        </div>
      </div>

      {/* GUARDIAN CONNECT PORTAL */}
      {!isGuardianView && (
        <GlassCard className="border-electric-500/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Student Code Sharing */}
            <div className="space-y-3 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6">
              <div className="flex items-center gap-2 text-xs text-electric-400 font-semibold uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Student Guardian Code</span>
              </div>
              <h3 className="text-lg font-bold text-white">Your Guardian Connection Code</h3>
              <p className="text-xs text-neutral-400">
                Share this code or link with your parent to let them monitor your study progress from their phone or laptop.
              </p>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-sm font-mono font-extrabold text-electric-400 tracking-wider">
                  {guardianInfo.guardianCode || guardianInfo.passcode || 'Not generated yet'}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="glass" icon={copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={handleCopyPasscode}>
                    {copiedCode ? 'Copied' : 'Copy Code'}
                  </Button>
                  <Button size="sm" variant="primary" icon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />} onClick={handleCopyShareLink}>
                    {copiedLink ? 'Copied' : 'Share Link'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Guardian Connect Form */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-electric-400 font-semibold uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                <span>Guardian Log-in / Connect</span>
              </div>
              <h3 className="text-lg font-bold text-white">Connect From Another Device</h3>
              <p className="text-xs text-neutral-400">
                If you are a parent or guardian logging in from another phone/laptop, enter the student code and your name below:
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. STDX-74F9H2-LQP8A1"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs uppercase tracking-wider font-mono focus:border-electric-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Your name (e.g. Mr. Rahman)"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-electric-400 focus:outline-none"
                  />
                  <Button
                    variant="primary"
                    size="md"
                    icon={loadingConnect ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    onClick={handleFullConnect}
                    disabled={loadingConnect}
                  >
                    Connect
                  </Button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
              )}
              {successMsg && (
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* PERMISSION RULES BANNER */}
      <GlassCard className="border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-medium">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Guardian Rules Enforced:</strong> Guardian can view progress, receive daily reports, and monitor consistency. Guardian CANNOT edit syllabus, change progress, delete data, or modify timers.
            </span>
          </div>
          <Badge variant="glass">Strict Read-Only</Badge>
        </div>
      </GlassCard>

      {/* GUARDIAN MONITORING DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-electric-400" />
                Live Student Progress Report
              </h3>
              <Badge variant="electric">{connectedStudentName || targetProfile.name}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-xl font-extrabold text-white">{report.studyTimeFormatted}</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Study Time</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-xl font-extrabold text-electric-400">{report.pagesCompletedToday}</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Pages Read</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-xl font-extrabold text-amber-400">{targetProfile.gamification?.currentStreak || 1} Days</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Streak</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-xl font-extrabold text-emerald-400">{report.overallProgressPercent}%</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Syllabus Done</span>
              </div>
            </div>

            {/* Subject Status List */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white">Subject-Wise Completion</h4>
              {targetProfile.subjects && targetProfile.subjects.length > 0 ? targetProfile.subjects.map((subj) => (
                <div key={subj.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block text-sm">{subj.name}</span>
                    <span className="text-neutral-400">
                      {subj.completedChapters}/{subj.chapters?.length || 0} Chapters ({subj.completedPages} / {subj.totalPages} Pages)
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge variant="electric">{subj.progressPercent}%</Badge>
                    <span className="block text-[10px] text-neutral-500 mt-1">Read-Only</span>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  {isGuardianView ? 'Waiting for student data...' : 'No subjects added yet.'}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Send Encouragement Note */}
          <GlassCard>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              Send Encouragement to Student
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Send a positive motivational message to encourage consistent daily study habits.
            </p>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={encouragementText}
                onChange={(e) => setEncouragementText(e.target.value)}
                placeholder={`e.g. Proud of your focus today, ${connectedStudentName || targetProfile.name}! Keep it up!`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none"
              />
              <Button variant="primary" size="sm" icon={<Send className="w-4 h-4" />} onClick={handleSendEncouragement}>
                Send Note
              </Button>
            </div>

            {encouragementSent && (
              <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Encouragement note sent!
              </p>
            )}
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Exam Target & Countdown */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-electric-400" />
                Exam Countdown
              </h3>
              <Badge variant="glass">Exam Target</Badge>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">{targetProfile.examInfo?.name || 'Upcoming Exam'}</span>
                <span className="text-xs text-neutral-400">{targetProfile.examInfo?.date || 'Not set'}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-electric-400">{daysRemaining}</span>
                <span className="block text-[10px] text-neutral-400 uppercase tracking-wider">Days Left</span>
              </div>
            </div>
          </GlassCard>

          {/* Daily Report Summary */}
          <GlassCard className="border-electric-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Daily Report Summary</h3>
              <Badge variant="glass">Auto Generated</Badge>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {report.reportText}
            </div>

            <div className="pt-4">
              <Button
                variant="glass"
                size="sm"
                fullWidth
                icon={<Share2 className="w-4 h-4" />}
                onClick={() => {
                  navigator.clipboard.writeText(report.reportText);
                  alert('Daily Report copied to clipboard!');
                }}
              >
                Copy Report Text
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
