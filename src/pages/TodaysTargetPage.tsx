import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { generateDailyStudyPlan, calculateDailyPageTarget, calculateRemainingDays } from '../services/plannerEngine';
import { Target, Clock, BookOpen, CheckCircle2, Play, AlertCircle, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TodaysTargetPageProps {
  profile: UserProfile;
  onToggleChapterComplete?: (subjectId: string, chapterId: string) => void;
}

export const TodaysTargetPage: React.FC<TodaysTargetPageProps> = ({ profile, onToggleChapterComplete }) => {
  const navigate = useNavigate();

  const totalPages = profile.subjects.reduce((sum, s) => sum + (s.totalPages || 0), 0);
  const completedPages = profile.subjects.reduce((sum, s) => sum + (s.completedPages || 0), 0);
  const remainingPages = Math.max(0, totalPages - completedPages);

  const daysRemaining = calculateRemainingDays(profile.examInfo?.date);
  const { totalDailyTarget, baseTarget, extraRecovery } = calculateDailyPageTarget(
    remainingPages,
    profile.examInfo?.date,
    profile.missedTargetRecovery
  );

  // Generate 5 subjects daily study routine
  const todayRoutine = generateDailyStudyPlan(profile.subjects, profile.examInfo, profile.missedTargetRecovery, 5);

  const totalEstMinutes = todayRoutine.reduce((sum, item) => sum + item.estimatedMinutes, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard className="border-electric-500/40 bg-gradient-to-r from-electric-700/10 via-black to-black p-6 md:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-electric-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-electric-400">Daily Study Routine</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Today's Target Plan <span className="inline-block text-electric-400">🎯</span>
              </h1>
              <p className="text-neutral-400 text-sm mt-1">
                Allocated across <strong className="text-white">{todayRoutine.length} Subjects</strong> today. Target: <strong className="text-electric-400">{totalDailyTarget} Pages Total</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
                <span className="block text-2xl font-extrabold text-white">{totalDailyTarget}</span>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Pages Today</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-electric-500/15 border border-electric-500/30 text-center min-w-[100px]">
                <span className="block text-2xl font-extrabold text-electric-400">{totalEstMinutes}m</span>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Est. Time</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Routine Warning / Empty State */}
      {todayRoutine.length === 0 ? (
        <GlassCard className="p-12 text-center border-white/10 bg-white/5 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">All Daily Targets Completed!</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            You have completed all scheduled reading targets for today or haven't added syllabus chapters yet.
          </p>
          <Button variant="primary" size="md" icon={<BookOpen className="w-4 h-4" />} onClick={() => navigate('/subjects')}>
            Manage Syllabus & Subjects
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-electric-400" />
              Multi-Subject Target Routine ({todayRoutine.length} Subjects)
            </h3>
            <Badge variant="electric">Target Rounding: Math.ceil</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayRoutine.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
              >
                <GlassCard className="h-full flex flex-col justify-between hover:border-electric-500/40 transition">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] text-electric-400 font-bold uppercase tracking-widest">
                          Subject {idx + 1}
                        </span>
                        <h4 className="text-lg font-extrabold text-white">{item.subjectName}</h4>
                      </div>
                      <Badge variant={item.difficulty === 'Hard' ? 'neutral' : item.difficulty === 'Medium' ? 'electric' : 'glass'}>
                        {item.difficulty}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs text-neutral-400">Chapter</div>
                      <div className="text-sm font-semibold text-white">{item.chapterName}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs">
                      <div className="flex justify-between text-neutral-300">
                        <span>Pages Target:</span>
                        <strong className="text-white">Pages {item.startPage} – {item.endPage}</strong>
                      </div>
                      <div className="flex justify-between text-neutral-300">
                        <span>Total Reading:</span>
                        <strong className="text-electric-400">{item.pagesToRead} Pages</strong>
                      </div>
                      <div className="flex justify-between text-neutral-300">
                        <span>Estimated Time:</span>
                        <strong className="text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-electric-400" />
                          {item.estimatedMinutes} Mins
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                    <span className="text-xs text-amber-400 font-medium">Status: Incomplete</span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Play className="w-3.5 h-3.5 fill-black" />}
                      onClick={() => onToggleChapterComplete && onToggleChapterComplete(item.subjectId, item.chapterId)}
                    >
                      Complete
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
