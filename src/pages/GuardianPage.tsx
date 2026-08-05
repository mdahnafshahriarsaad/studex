import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, AppSettings } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { t, formatNumber, translateSubjectName, getCurrentLanguage } from '../utils/i18n';
import { generateDailyReportSummary } from '../services/guardianService';
import { lookupGuardianStudentAsync, connectGuardianAsync, fetchGuardianDashboardAsync } from '../services/authService';
import { calculateRemainingDays } from '../services/plannerEngine';
import {
  ShieldCheck, Lock, Share2, Copy, Check, Eye, Heart, Clock,
  AlertTriangle, Send, LogOut, CheckCircle2, ShieldAlert, RefreshCw, Loader2, ArrowLeft
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface GuardianPageProps {
  profile?: UserProfile;
  settings?: AppSettings;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

export const GuardianPage: React.FC<GuardianPageProps> = ({ profile: studentProfile, settings, onUpdateProfile }) => {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get('code') || '';
  const lang = settings?.language || getCurrentLanguage();

  // When accessed via share link (public guardian), there's no student profile
  const isPublicGuardian = Boolean(urlCode) && !studentProfile?.setupCompleted;

  const [inputCode, setInputCode] = React.useState(urlCode);
  const [guardianName, setGuardianName] = React.useState('');
  const [connectedProfile, setConnectedProfile] = React.useState<UserProfile | null>(null);
  const [connectedStudentName, setConnectedStudentName] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [encouragementText, setEncouragementText] = React.useState('');
  const [encouragementSent, setEncouragementSent] = React.useState(false);
  const [loadingConnect, setLoadingConnect] = React.useState(false);
  const [loadingDashboard, setLoadingDashboard] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(isPublicGuardian);

  const isGuardianView = Boolean(connectedProfile);
  const targetProfile = connectedProfile || studentProfile || ({} as UserProfile);
  const guardianInfo = studentProfile?.guardian || { enabled: true, passcode: '', guardianCode: '' };
  const shareableUrl = `${window.location.origin}/#/guardian?code=${guardianInfo.guardianCode || guardianInfo.passcode}`;

  const report = connectedProfile || studentProfile ? generateDailyReportSummary(targetProfile) : null;
  const daysRemaining = calculateRemainingDays(targetProfile.examInfo?.date);

  // Auto-connect when opened with ?code= param
  React.useEffect(() => {
    if (urlCode) { handleConnectWithCode(urlCode); }
  }, []);

  const handleConnectWithCode = async (codeToConnect: string) => {
    setErrorMsg(null); setSuccessMsg(null);
    if (!codeToConnect.trim()) { setErrorMsg(t('guardian.enterCode', lang)); setInitialLoading(false); return; }
    setLoadingConnect(true);
    try {
      const result = await lookupGuardianStudentAsync(codeToConnect);
      if (result && result.profile) {
        setConnectedProfile(result.profile);
        setConnectedStudentName(result.profile.name);
        setLoadingConnect(false);
        setInitialLoading(false);
        return;
      }
    } catch (err) { console.warn('Cloud guardian lookup failed:', err); }
    setLoadingConnect(false);
    setInitialLoading(false);
    if (!studentProfile?.setupCompleted) {
      setErrorMsg(t('guardian.invalidCode', lang));
    }
  };

  const handleFullConnect = async () => {
    if (!inputCode.trim()) { setErrorMsg(t('guardian.enterCode', lang)); return; }
    setLoadingConnect(true); setErrorMsg(null);
    try {
      const result = await connectGuardianAsync(inputCode, guardianName.trim() || 'Guardian');
      if (result.success) {
        setSuccessMsg(t('guardian.connectedSuccess', lang));
        setConnectedStudentName(result.studentName || null);
        try {
          const dashData = await fetchGuardianDashboardAsync(inputCode);
          if (dashData && dashData.profile) { setConnectedProfile(dashData.profile); }
        } catch { /* ignore */ }
      }
    } catch (err: any) { setErrorMsg(err.message || t('guardian.connectFailed', lang)); } finally { setLoadingConnect(false); }
  };

  const handleCopyPasscode = () => {
    const code = guardianInfo.guardianCode || guardianInfo.passcode;
    navigator.clipboard.writeText(code);
    setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendEncouragement = () => {
    if (!encouragementText.trim()) return;
    setEncouragementSent(true); setEncouragementText('');
    setTimeout(() => setEncouragementSent(false), 3000);
  };

  const handleRefreshDashboard = async () => {
    const code = inputCode || urlCode;
    if (!code.trim()) return;
    setLoadingDashboard(true);
    try {
      const dashData = await fetchGuardianDashboardAsync(code);
      if (dashData && dashData.profile) { setConnectedProfile(dashData.profile); }
    } catch { /* ignore */ } finally { setLoadingDashboard(false); }
  };

  const handleDisconnect = () => {
    setConnectedProfile(null); setConnectedStudentName(null);
    setSuccessMsg(null); setErrorMsg(null); setInputCode(''); setGuardianName('');
  };

  const hasStudentData = studentProfile?.setupCompleted;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12 select-none">
        {/* Back button for public guardian view */}
        {isPublicGuardian && !isGuardianView && (
          <p className="text-xs text-neutral-500">{t('guardian.publicAccessNote', lang)}</p>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-electric-400" />
              <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">{t('guardian.multiDevice', lang)}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {isGuardianView
                ? `${t('guardian.monitoring', lang)}: ${connectedStudentName || targetProfile.name}`
                : hasStudentData ? t('guardian.title', lang) : t('guardian.guardianPortal', lang)}
            </h1>
            <p className="text-neutral-400 text-sm mt-0.5">
              {isGuardianView
                ? t('guardian.connectedView', lang)
                : hasStudentData ? t('guardian.shareDesc', lang) : t('guardian.publicDesc', lang)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isGuardianView && (
              <>
                <Button variant="glass" size="sm" icon={loadingDashboard ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} onClick={handleRefreshDashboard}>{t('guardian.refresh', lang)}</Button>
                <Button variant="glass" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={handleDisconnect}>{t('guardian.disconnect', lang)}</Button>
              </>
            )}
            <Badge variant="electric">{t('guardian.readOnlyActive', lang)}</Badge>
          </div>
        </div>

        {/* LOADING STATE */}
        {(initialLoading || loadingConnect) && !connectedProfile && (
          <GlassCard className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-electric-400 animate-spin mb-4" />
            <p className="text-sm text-neutral-400">{t('guardian.loadingStudentData', lang)}</p>
          </GlassCard>
        )}

        {/* ERROR STATE (public guardian, code not found) */}
        {!initialLoading && !loadingConnect && !connectedProfile && !hasStudentData && errorMsg && (
          <GlassCard className="border-rose-500/30">
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{t('guardian.codeNotFound', lang)}</h3>
                <p className="text-sm text-neutral-400 max-w-md">{errorMsg}</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={t('guardian.enterCodeManually', lang)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs uppercase tracking-wider font-mono focus:border-electric-400 focus:outline-none w-64"
                />
                <Button variant="primary" size="sm" onClick={() => handleConnectWithCode(inputCode)} disabled={loadingConnect}>
                  {t('guardian.connect', lang)}
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* STUDENT VIEW: Share code + connect portal (only when logged in) */}
        {hasStudentData && !isGuardianView && !initialLoading && (
          <>
            <GlassCard className="border-electric-500/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6">
                  <div className="flex items-center gap-2 text-xs text-electric-400 font-semibold uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>{t('guardian.studentCode', lang)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{t('guardian.yourCode', lang)}</h3>
                  <p className="text-xs text-neutral-400">{t('guardian.shareDesc', lang)}</p>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-sm font-mono font-extrabold text-electric-400 tracking-wider">
                      {guardianInfo.guardianCode || guardianInfo.passcode || t('dashboard.notGeneratedYet', lang)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="glass" icon={copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={handleCopyPasscode}>
                        {copiedCode ? t('guardian.copied', lang) : t('guardian.copyCode', lang)}
                      </Button>
                      <Button size="sm" variant="primary" icon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />} onClick={handleCopyShareLink}>
                        {copiedLink ? t('guardian.copied', lang) : t('guardian.shareLink', lang)}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-electric-400 font-semibold uppercase tracking-wider">
                    <Eye className="w-4 h-4" />
                    <span>{t('guardian.guardianConnect', lang)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{t('guardian.connectDevice', lang)}</h3>
                  <p className="text-xs text-neutral-400">{t('guardian.connectDesc', lang)}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder={t('guardian.codeFormat', lang)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs uppercase tracking-wider font-mono focus:border-electric-400 focus:outline-none" />
                    </div>
                  </div>
                  {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}
                  {successMsg && <p className="text-xs text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}</p>}
                </div>
              </div>
            </GlassCard>

            {/* PERMISSION RULES BANNER */}
            <GlassCard className="border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-medium">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span><strong>{t('guardian.rules', lang)}:</strong> {t('guardian.rulesDesc', lang)}</span>
                </div>
                <Badge variant="glass">{t('guardian.readOnly', lang)}</Badge>
              </div>
            </GlassCard>
          </>
        )}

        {/* GUARDIAN DASHBOARD (shown when connected — works for both student and public) */}
        {isGuardianView && report && (
          <>
            {/* PERMISSION RULES BANNER */}
            <GlassCard className="border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-medium">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span><strong>{t('guardian.rules', lang)}:</strong> {t('guardian.rulesDesc', lang)}</span>
                </div>
                <Badge variant="glass">{t('guardian.readOnly', lang)}</Badge>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-electric-400" />{t('guardian.liveReport', lang)}</h3>
                    <Badge variant="electric">{connectedStudentName || targetProfile.name}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <span className="block text-xl font-extrabold text-white">{report.studyTimeFormatted}</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{t('guardian.studyTime', lang)}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <span className="block text-xl font-extrabold text-electric-400">{report.totalStudyTimeFormatted}</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{t('guardian.totalStudyTime', lang)}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <span className="block text-xl font-extrabold text-amber-400">{formatNumber(targetProfile.gamification?.currentStreak || 1, lang)} {t('guardian.days', lang)}</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{t('guardian.streak', lang)}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <span className="block text-xl font-extrabold text-emerald-400">{report.overallProgressPercent}%</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{t('guardian.syllabusDone', lang)}</span>
                    </div>
                  </div>
                  {/* Today's detail row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-electric-500/8 border border-electric-500/15 text-center">
                      <span className="block text-lg font-extrabold text-electric-400">{formatNumber(report.pagesCompletedToday, lang)}</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{t('guardian.pagesToday', lang)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-electric-500/8 border border-electric-500/15 text-center">
                      <span className="block text-lg font-extrabold text-electric-400">{formatNumber(report.sessionsCount, lang)}</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{t('guardian.sessionsToday', lang)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-electric-500/8 border border-electric-500/15 text-center">
                      <span className="block text-lg font-extrabold text-electric-400">{formatNumber(targetProfile.gamification?.level || 1, lang)}</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{t('guardian.level', lang)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-white">{t('guardian.subjectCompletion', lang)}</h4>
                    {targetProfile.subjects && targetProfile.subjects.length > 0 ? targetProfile.subjects.map((subj) => (
                      <div key={subj.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-white block text-sm">{translateSubjectName(subj.name, lang)}</span>
                          <span className="text-neutral-400">{formatNumber(subj.completedChapters, lang)}/{formatNumber(subj.totalChapters || subj.chapters?.length || 0, lang)} {t('guardian.chapters', lang)} ({formatNumber(subj.completedPages, lang)} / {formatNumber(subj.totalPages, lang)} {t('guardian.pages', lang)})</span>
                        </div>
                        <div className="text-right">
                          <Badge variant="electric">{subj.progressPercent}%</Badge>
                          <span className="block text-[10px] text-neutral-500 mt-1">{t('common.readOnly', lang)}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-6 text-center text-neutral-500 text-xs">{t('guardian.noSubjects', lang)}</div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-400" />{t('guardian.sendEncouragement', lang)}</h3>
                  <p className="text-xs text-neutral-400 mb-4">{t('guardian.encouragementDesc', lang)}</p>
                  <div className="flex items-center gap-3">
                    <input type="text" value={encouragementText} onChange={(e) => setEncouragementText(e.target.value)}
                      placeholder={`${connectedStudentName || targetProfile.name}!`}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none" />
                    <Button variant="primary" size="sm" icon={<Send className="w-4 h-4" />} onClick={handleSendEncouragement}>{t('guardian.sendNote', lang)}</Button>
                  </div>
                  {encouragementSent && <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t('guardian.sent', lang)}</p>}
                </GlassCard>
              </div>

              <div className="space-y-6">
                <GlassCard>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-electric-400" />{t('guardian.examCountdown', lang)}</h3>
                    <Badge variant="glass">{t('guardian.examTarget', lang)}</Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{targetProfile.examInfo?.name || t('guardian.upcomingExam', lang)}</span>
                      <span className="text-xs text-neutral-400">{targetProfile.examInfo?.date || t('guardian.notSet', lang)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-electric-400">{formatNumber(daysRemaining, lang)}</span>
                      <span className="block text-[10px] text-neutral-400 uppercase tracking-wider">{t('guardian.daysLeft', lang)}</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="border-electric-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">{t('guardian.dailyReport', lang)}</h3>
                    <Badge variant="glass">{t('guardian.autoGenerated', lang)}</Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">{report.reportText}</div>
                  <div className="pt-4">
                    <Button variant="glass" size="sm" fullWidth icon={<Share2 className="w-4 h-4" />}
                      onClick={() => { navigator.clipboard.writeText(report.reportText); alert(t('guardian.dailyReportCopied', lang)); }}>
                      {t('guardian.copyReport', lang)}
                    </Button>
                  </div>
                </GlassCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
