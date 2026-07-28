import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, AppSettings } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { t } from '../utils/i18n';
import {
  generateDailyStudyPlan, calculateSubjectPriorities, calculateDailyPageTarget, calculateRemainingDays
} from '../services/plannerEngine';
import {
  Play, Calendar, BookOpen, Clock, Settings as SettingsIcon, BarChart2, CheckCircle2,
  AlertCircle, RefreshCw, Compass, Target, Smartphone, CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardPageProps {
  profile: UserProfile;
  settings?: AppSettings;
  onToggleChapterComplete?: (subjectId: string, chapterId: string) => void;
  onToggleRevisionComplete?: (revisionId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  profile,
  settings,
  onToggleChapterComplete,
  onToggleRevisionComplete,
}) => {
  const navigate = useNavigate();
  const lang = settings?.language || 'English';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalPages = profile.subjects.reduce((sum, s) => sum + (s.totalPages || 0), 0);
  const completedPages = profile.subjects.reduce((sum, s) => sum + (s.completedPages || 0), 0);
  const remainingPages = Math.max(0, totalPages - completedPages);
  const overallProgressPercent = totalPages > 0 ? Math.min(100, Math.round((completedPages / totalPages) * 100)) : 0;

  const daysRemaining = calculateRemainingDays(profile.examInfo?.date);
  const { totalDailyTarget, baseTarget, extraRecovery } = calculateDailyPageTarget(
    remainingPages,
    profile.examInfo?.date,
    profile.missedTargetRecovery
  );

  const priorities = calculateSubjectPriorities(profile.subjects, profile.examInfo);
  const topRecommended = priorities.find((p) => p.score > 0) || priorities[0];

  // Generate 5 subjects daily study routine
  const todayPlanItems = generateDailyStudyPlan(profile.subjects, profile.examInfo, profile.missedTargetRecovery, 5);

  const activeRevisions = (profile.revisions || []).filter((r) => !r.completed).slice(0, 3);
  const hasSyllabus = totalPages > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* 1. GREETING & OVERALL PROGRESS BANNER */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard className="border-electric-500/30 bg-gradient-to-r from-electric-700/10 via-black to-black p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{profile.avatar || '🎓'}</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-electric-400">Smart Academic Planner</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {getGreeting()}, {profile.name || 'Saad'} <span className="inline-block animate-pulse">👋</span>
              </h1>
              <p className="text-neutral-400 text-sm md:text-base mt-1">
                Syllabus target: <span className="text-white font-semibold">{totalDailyTarget} Pages/day</span> ({baseTarget} base {extraRecovery > 0 ? `+ ${extraRecovery} recovery` : ''}).
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                <span className="block text-2xl font-extrabold text-white">{overallProgressPercent}%</span>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Overall</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-electric-500/15 border border-electric-500/30 text-center min-w-[100px]">
                <span className="block text-2xl font-extrabold text-electric-400">{remainingPages}</span>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Pages Left</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* QUICK ACCESS FEATURE BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center justify-between hover:border-electric-500/40 transition cursor-pointer" onClick={() => navigate('/todays-target')}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-electric-500/20 text-electric-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Today's Target</h4>
              <span className="text-xs text-neutral-400">{todayPlanItems.length} Subjects Scheduled</span>
            </div>
          </div>
          <span className="text-xs text-electric-400 font-semibold">&rarr;</span>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between hover:border-electric-500/40 transition cursor-pointer" onClick={() => navigate('/complete-syllabus')}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Complete Syllabus Plan</h4>
              <span className="text-xs text-neutral-400">Full Exam Roadmap</span>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-semibold">&rarr;</span>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between hover:border-electric-500/40 transition cursor-pointer" onClick={() => navigate('/download-app')}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Download App</h4>
              <span className="text-xs text-neutral-400">Android APK & PWA</span>
            </div>
          </div>
          <span className="text-xs text-indigo-400 font-semibold">&rarr;</span>
        </GlassCard>
      </div>

      {/* Helpful Alert if No Syllabus Chapters Added */}
      {!hasSyllabus && (
        <GlassCard className="border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">No Syllabus Added Yet</h4>
                <p className="text-xs text-neutral-300">
                  Please add your syllabus chapters first to generate a mathematical study plan.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" icon={<BookOpen className="w-4 h-4" />} onClick={() => navigate('/subjects')}>
              Add Syllabus Now
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Recovery Banner if Missed Target Active */}
      {profile.missedTargetRecovery && profile.missedTargetRecovery.daysRemaining > 0 && (
        <GlassCard className="border-electric-500/30 bg-electric-500/10 p-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-electric-400 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                Recovery Active: +{profile.missedTargetRecovery.extraPagesPerDay} extra pages/day distributed over next {profile.missedTargetRecovery.daysRemaining} days.
              </span>
            </div>
            <Badge variant="electric">No Overload Mode</Badge>
          </div>
        </GlassCard>
      )}

      {/* Dashboard Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. TODAY'S STUDY TARGET PLAN */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-electric-400" />
                  <h3 className="text-lg font-bold text-white">Today's Multi-Subject Routine</h3>
                </div>
                <button onClick={() => navigate('/todays-target')} className="text-xs text-electric-400 hover:underline font-semibold">
                  View Full Target Routine ({todayPlanItems.length} Subjects) &rarr;
                </button>
              </div>

              {todayPlanItems.length === 0 ? (
                <div className="p-8 text-center border border-white/10 rounded-2xl bg-white/5 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">All Daily Targets Clear!</h4>
                  <p className="text-xs text-neutral-400">Add or expand syllabus chapters to generate new daily study targets.</p>
                  <Button variant="glass" size="sm" onClick={() => navigate('/subjects')}>
                    Manage Syllabus
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayPlanItems.map((item, idx) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-electric-500/40 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div>
                          <span className="text-[10px] text-electric-400 font-bold uppercase tracking-wider">Subject {idx + 1}: {item.subjectName}</span>
                          <h4 className="text-base font-bold text-white mt-0.5">{item.chapterName}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.difficulty === 'Easy' ? 'glass' : item.difficulty === 'Medium' ? 'electric' : 'neutral'}>
                            {item.difficulty}
                          </Badge>
                          <span className="text-xs text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-electric-400" />
                            {item.estimatedMinutes} mins
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-300">
                        <span>Reading Target: <strong className="text-white">Pages {item.startPage} – {item.endPage}</strong> ({item.pagesToRead} Pages)</span>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Play className="w-3.5 h-3.5 fill-black" />}
                          onClick={() => {
                            if (onToggleChapterComplete) {
                              onToggleChapterComplete(item.subjectId, item.chapterId);
                            }
                          }}
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* 2. SUBJECT PROGRESS BARS */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-electric-400" />
                  <h3 className="text-lg font-bold text-white">Subject Progress</h3>
                </div>
                <button onClick={() => navigate('/subjects')} className="text-xs text-electric-400 hover:text-white font-medium transition">
                  Manage Subjects &rarr;
                </button>
              </div>

              <div className="space-y-4">
                {profile.subjects.map((subj) => (
                  <div key={subj.id} className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{subj.name}</span>
                      <span className="text-neutral-400">
                        {subj.completedPages} / {subj.totalPages} Pages &bull; <strong className="text-electric-400">{subj.progressPercent}%</strong>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-electric-600 to-electric-400 rounded-full transition-all duration-500"
                        style={{ width: `${subj.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 3. RECOMMENDED SUBJECT */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <GlassCard className="border-electric-500/40 shadow-glow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-5 h-5 text-electric-400" />
                <h3 className="text-lg font-bold text-white">Recommended Priority</h3>
              </div>

              {topRecommended ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-extrabold text-white">{topRecommended.subjectName}</h4>
                    <Badge variant="electric">Priority Score: {topRecommended.score}</Badge>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                    <strong className="text-electric-400">Reason: </strong>
                    {topRecommended.reason}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">All subjects completed!</p>
              )}
            </GlassCard>
          </motion.div>

          {/* 4. EXAM COUNTDOWN */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-electric-400" />
                  <h3 className="text-lg font-bold text-white">Exam Target</h3>
                </div>
                <Badge variant="glass">Days Remaining</Badge>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-base text-white">{profile.examInfo?.name || 'Target Exam'}</h5>
                  <span className="text-xs text-neutral-400">{profile.examInfo?.date || '2026-08-30'}</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-electric-400">{daysRemaining}</span>
                  <span className="block text-[10px] uppercase text-neutral-400 tracking-wider">Days Left</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* 5. UPCOMING REVISIONS */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-electric-400" />
                  Spaced Revisions
                </h3>
                <Badge variant="glass">{activeRevisions.length} Due</Badge>
              </div>

              <div className="space-y-2">
                {activeRevisions.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-3">No pending revision sessions. Complete a chapter to schedule revisions!</p>
                ) : (
                  activeRevisions.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white block">{rev.chapterName}</span>
                        <span className="text-[11px] text-neutral-400">{rev.subjectName} &bull; <strong className="text-electric-400">{rev.stage}</strong></span>
                      </div>
                      <button
                        onClick={() => onToggleRevisionComplete && onToggleRevisionComplete(rev.id)}
                        className="p-1.5 rounded-lg bg-electric-500/20 text-electric-400 hover:bg-electric-500/30 transition"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* 6. QUICK ACTIONS */}
          <GlassCard>
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Button variant="glass" size="md" fullWidth icon={<BookOpen className="w-4 h-4 text-electric-400" />} onClick={() => navigate('/subjects')}>
                Subject & Syllabus Editor
              </Button>
              <Button variant="glass" size="md" fullWidth icon={<BarChart2 className="w-4 h-4 text-electric-400" />} onClick={() => navigate('/progress')}>
                Spaced Revision Overview
              </Button>
              <Button variant="glass" size="md" fullWidth icon={<SettingsIcon className="w-4 h-4 text-electric-400" />} onClick={() => navigate('/settings')}>
                Settings & Preferences
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
