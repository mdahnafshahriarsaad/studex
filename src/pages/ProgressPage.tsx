import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  BarChart2, CheckCircle2, TrendingUp, Award, BookOpen, RefreshCw, AlertCircle, CheckSquare, Square, Plus
} from 'lucide-react';

interface ProgressPageProps {
  profile: UserProfile;
  onToggleRevisionComplete?: (revisionId: string) => void;
  onTriggerMissedRecovery?: (missedPages: number) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  profile,
  onToggleRevisionComplete,
  onTriggerMissedRecovery,
}) => {
  const [missedInput, setMissedInput] = useState<string>('20');
  const [recoveryTriggered, setRecoveryTriggered] = useState<boolean>(false);

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
        <h1 className="text-3xl font-extrabold text-white">Study Analytics & Spaced Revisions</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Mathematical syllabus completion breakdown and spaced repetition schedule for <span className="text-electric-400 font-semibold">{profile.name}</span>.
        </p>
      </div>

      {/* Top Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Overall Completion</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{avgProgress}%</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Completed Pages</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{completedPages} / {totalPages}</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Remaining Pages</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{remainingPages} Pages</h3>
          </div>
        </GlassCard>
      </div>

      {/* MISSED TARGET RECOVERY SYSTEM */}
      <GlassCard className="border-electric-500/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-electric-400" />
              <h3 className="text-lg font-bold text-white">Missed Target Recovery Engine</h3>
            </div>
            <Badge variant="electric">No Overload Mode</Badge>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            If you missed yesterday's target, Studex distributes the missed pages across the next 5 days without overloading a single day.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="number"
              min="1"
              value={missedInput}
              onChange={(e) => setMissedInput(e.target.value)}
              placeholder="Missed pages (e.g. 20)"
              className="w-44 px-3 py-2 rounded-xl glass-input text-xs text-white"
            />
            <Button variant="primary" size="sm" onClick={handleTriggerRecovery}>
              Distribute Over 5 Days
            </Button>
          </div>

          {recoveryTriggered && profile.missedTargetRecovery && (
            <div className="p-3 rounded-xl bg-electric-500/15 border border-electric-500/30 text-xs text-electric-400 flex items-center justify-between">
              <span>
                Recovery set! Missed {profile.missedTargetRecovery.missedPages} pages &bull; Distributed +{profile.missedTargetRecovery.extraPagesPerDay} extra pages/day for 5 days.
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
            Spaced Repetition Revision Schedule (Day 1, 3, 7)
          </h3>
          <Badge variant="glass">Ebbinghaus Memory Curve</Badge>
        </div>

        <div className="space-y-3">
          {(!profile.revisions || profile.revisions.length === 0) ? (
            <p className="text-xs text-neutral-500 text-center py-4">No revision sessions active yet. Mark a chapter completed to generate automated spaced repetition schedules!</p>
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
                      {rev.subjectName} &bull; Stage: <strong className="text-electric-400">{rev.stage}</strong> &bull; Due: {rev.dueDate}
                    </span>
                  </div>
                </div>

                <Badge variant={rev.completed ? 'glass' : 'electric'}>
                  {rev.completed ? 'Completed' : 'Pending'}
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
            Subject Syllabus Breakdown
          </h3>
        </div>

        <div className="space-y-6">
          {profile.subjects.map((subj) => (
            <div key={subj.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{subj.name}</span>
                <span className="text-neutral-400">
                  {subj.completedPages} / {subj.totalPages} Pages Completed &bull; <strong className="text-electric-400">{subj.progressPercent}%</strong>
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
