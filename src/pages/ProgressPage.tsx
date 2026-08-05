import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, AppSettings } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { t, formatNumber, translateSubjectName } from '../utils/i18n';
import {
  BarChart2, CheckCircle2, TrendingUp, Award, BookOpen, RefreshCw, AlertCircle, CheckSquare, Square, Plus
} from 'lucide-react';

interface ProgressPageProps {
  profile: UserProfile;
  settings?: AppSettings;
  onToggleRevisionComplete?: (revisionId: string) => void;
  onTriggerMissedRecovery?: (missedPages: number) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  profile,
  settings,
  onToggleRevisionComplete,
  onTriggerMissedRecovery,
}) => {
  const lang = settings?.language || 'English';
  const [missedInput, setMissedInput] = React.useState<string>('20');
  const [recoveryTriggered, setRecoveryTriggered] = React.useState<boolean>(false);

  const totalPages = profile.subjects.reduce((sum, s) => sum + (s.totalPages || 0), 0);
  const completedPages = profile.subjects.reduce((sum, s) => sum + (s.completedPages || 0), 0);
  const remainingPages = Math.max(0, totalPages - completedPages);
  const avgProgress = totalPages > 0 ? Math.min(100, Math.round((completedPages / totalPages) * 100)) : 0;

  const handleTriggerRecovery = () => {
    const pages = parseInt(missedInput);
    if (!isNaN(pages) && pages > 0 && onTriggerMissedRecovery) {
      onTriggerMissedRecovery(pages);
      setRecoveryTriggered(true);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">{t('progress.title', lang)}</h1>
        <p className="text-neutral-400 text-sm mt-1">
          {t('progress.subtitle', lang)} <span className="text-electric-400 font-semibold">{profile.name}</span>.
        </p>
      </div>

      {/* Top Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">{t('progress.overallCompletion', lang)}</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{formatNumber(avgProgress, lang)}%</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">{t('progress.completedPagesLabel', lang)}</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{formatNumber(completedPages, lang)} / {formatNumber(totalPages, lang)}</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">{t('progress.remainingPagesLabel', lang)}</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{formatNumber(remainingPages, lang)} {t('dashboard.pages', lang)}</h3>
          </div>
        </GlassCard>
      </div>

      {/* MISSED TARGET RECOVERY SYSTEM */}
      <GlassCard className="border-electric-500/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-electric-400" />
              <h3 className="text-lg font-bold text-white">{t('progress.missedRecovery', lang)}</h3>
            </div>
            <Badge variant="electric">{t('progress.noOverloadMode', lang)}</Badge>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            {t('progress.missedDesc', lang)}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="number"
              min="1"
              value={missedInput}
              onChange={(e) => setMissedInput(e.target.value)}
              placeholder={t('progress.enterMissed', lang)}
              className="w-44 px-3 py-2 rounded-xl glass-input text-xs text-white"
            />
            <Button variant="primary" size="sm" onClick={handleTriggerRecovery}>
              {t('progress.triggerRecovery', lang)}
            </Button>
          </div>

          {recoveryTriggered && profile.missedTargetRecovery && (
            <div className="p-3 rounded-xl bg-electric-500/15 border border-electric-500/30 text-xs text-electric-400 flex items-center justify-between">
              <span>
                {t('progress.recoveryActive', lang)} {profile.missedTargetRecovery.missedPages} {t('dashboard.pages', lang)} &bull; +{formatNumber(profile.missedTargetRecovery.extraPagesPerDay, lang)} {t('progress.recoveryDesc', lang)}
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
      </GlassCard>

      {/* SPACED REPETITION REVISION SCHEDULE */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-electric-400" />
            {t('progress.revisionSchedule', lang)}
          </h3>
          <Badge variant="glass">{t('progress.ebbinghaus', lang)}</Badge>
        </div>

        <div className="space-y-3">
          {(!profile.revisions || profile.revisions.length === 0) ? (
            <p className="text-xs text-neutral-500 text-center py-4">{t('progress.noRevisions', lang)}</p>
          ) : (
            profile.revisions.map((rev) => (
              <div key={rev.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleRevisionComplete && onToggleRevisionComplete(rev.id)}
                    className="text-electric-400 hover:text-white"
                  >
                    {rev.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-neutral-500" />}
                  </button>
                  <div>
                    <span className={`font-semibold block ${rev.completed ? 'line-through text-neutral-500' : 'text-white'}`}>
                      {rev.chapterName}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      {translateSubjectName(rev.subjectName, lang)} &bull; {t('progress.stage', lang)}: <strong className="text-electric-400">{rev.stage}</strong> &bull; {t('progress.dueDate', lang)}: {rev.dueDate}
                    </span>
                  </div>
                </div>

                <Badge variant={rev.completed ? 'glass' : 'electric'}>
                  {rev.completed ? t('progress.done', lang) : t('progress.pending', lang)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Subject Detailed Completion List */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-electric-400" />
            {t('progress.subjectBreakdown', lang)}
          </h3>
        </div>

        <div className="space-y-6">
          {profile.subjects.map((subj) => (
            <div key={subj.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{translateSubjectName(subj.name, lang)}</span>
                <span className="text-neutral-400">
                  {formatNumber(subj.completedPages, lang)} / {formatNumber(subj.totalPages, lang)} {t('progress.pagesLabel', lang)} &bull; <strong className="text-electric-400">{subj.progressPercent}%</strong>
                </span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subj.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-electric-600 to-electric-400 rounded-full shadow-glow-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
