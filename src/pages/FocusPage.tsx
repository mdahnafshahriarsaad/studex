import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, AppSettings, ChapterDifficulty, StudySessionRecord } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { addXPAndCheckAchievements } from '../services/gamificationService';
import { t, formatNumber, translateSubjectName } from '../utils/i18n';
import {
  Play, Pause, RotateCcw, X, CheckCircle2, Sparkles, Clock, BookOpen, Layers, Coffee, ArrowRight, Flame, Smile, Zap, Moon
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface FocusPageProps {
  profile: UserProfile;
  settings?: AppSettings;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onToggleChapterComplete: (subjectId: string, chapterId: string) => void;
}

export const FocusPage: React.FC<FocusPageProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onToggleChapterComplete,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = settings?.language || 'English';

  const initialSubjectId = searchParams.get('subjectId') || profile.subjects[0]?.id || '';
  const initialChapterId = searchParams.get('chapterId') || profile.subjects[0]?.chapters?.[0]?.id || '';

  const activeSubj = profile.subjects.find((s) => s.id === initialSubjectId) || profile.subjects[0];
  const activeChap = activeSubj?.chapters?.find((c) => c.id === initialChapterId) || activeSubj?.chapters?.[0] || {
    id: 'ch-default', name: 'Motion & Dynamics', startPage: 40, endPage: 48, totalPages: 9, difficulty: 'Medium' as ChapterDifficulty,
  };

  const [selectedDurationMins, setSelectedDurationMins] = useState<number>(60);
  const [secondsLeft, setSecondsLeft] = useState<number>(60 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [viewState, setViewState] = useState<'timer' | 'reflection' | 'break'>('timer');
  const [pagesCompletedInput, setPagesCompletedInput] = useState<number>(activeChap.totalPages || 8);
  const [difficultyFeedback, setDifficultyFeedback] = useState<ChapterDifficulty>(activeChap.difficulty || 'Medium');
  const [mood, setMood] = useState<string>('🔥 Focused');
  const [notes, setNotes] = useState<string>('');
  const [breakMins, setBreakMins] = useState<number>(10);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState<number>(10 * 60);
  const [breakIsActive, setBreakIsActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => { setSecondsLeft((prev) => prev - 1); }, 1000);
    } else if (secondsLeft === 0 && isActive) { setIsActive(false); setViewState('reflection'); }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  useEffect(() => {
    let interval: any = null;
    if (breakIsActive && breakSecondsLeft > 0) {
      interval = setInterval(() => { setBreakSecondsLeft((prev) => prev - 1); }, 1000);
    } else if (breakSecondsLeft === 0 && breakIsActive) { setBreakIsActive(false); }
    return () => clearInterval(interval);
  }, [breakIsActive, breakSecondsLeft]);

  const handleSelectDuration = (mins: number) => { setSelectedDurationMins(mins); setSecondsLeft(mins * 60); setIsActive(false); };
  const handleStartPause = () => { setIsActive(!isActive); };
  const handleResetTimer = () => { setIsActive(false); setSecondsLeft(selectedDurationMins * 60); };
  const handleEndEarly = () => { setIsActive(false); setViewState('reflection'); };

  const handleSubmitReflection = () => {
    const elapsedMins = Math.max(1, Math.round((selectedDurationMins * 60 - secondsLeft) / 60));
    const newSessionRecord: StudySessionRecord = {
      id: `session-${Date.now()}`, subjectId: activeSubj?.id || 'subj-1',
      subjectName: activeSubj?.name || 'Physics', chapterId: activeChap?.id || 'ch-1',
      chapterName: activeChap?.name || 'Chapter Target', durationMinutes: elapsedMins,
      pagesCompleted: pagesCompletedInput, difficultyFeedback, mood, notes, timestamp: new Date().toISOString(),
    };
    const earnedXP = 50 + pagesCompletedInput * 5;
    const updatedGamification = addXPAndCheckAchievements(
      profile.gamification, earnedXP, elapsedMins, pagesCompletedInput >= activeChap.totalPages,
      (profile.studyHistory?.length || 0) + 1
    );
    onUpdateProfile({ studyHistory: [newSessionRecord, ...(profile.studyHistory || [])], gamification: updatedGamification });
    if (pagesCompletedInput >= activeChap.totalPages && activeSubj?.id && activeChap?.id) {
      onToggleChapterComplete(activeSubj.id, activeChap.id);
    }
    setViewState('break');
  };

  const handleStartBreak = () => { setBreakSecondsLeft(breakMins * 60); setBreakIsActive(true); };
  const formatTime = (secs: number) => { const m = Math.floor(secs / 60); const s = secs % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };
  const timerProgress = ((selectedDurationMins * 60 - secondsLeft) / (selectedDurationMins * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-between p-6 select-none overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-electric-500/10 blur-[140px] pointer-events-none" />
      <div className="w-full max-w-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img src="/logo-mark.png" alt="Studex" className="w-7 h-7 object-contain filter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-electric-400">{t('focus.focusMode', lang)}</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full glass-panel text-neutral-400 hover:text-white hover:bg-white/10 transition" title={t('focus.exitFocus', lang)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewState === 'timer' && (
          <motion.div key="timerView" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg flex flex-col items-center z-10 my-auto">
            <div className="text-center mb-6 space-y-1">
              <Badge variant="electric">{translateSubjectName(activeSubj?.name || 'Physics', lang)}</Badge>
              <h2 className="text-2xl font-extrabold text-white mt-1">{activeChap?.name || 'Motion Chapter'}</h2>
              <p className="text-xs text-neutral-400">
                {t('focus.target', lang)}: {t('dashboard.pages', lang)} {formatNumber(activeChap?.startPage, lang)}–{formatNumber(activeChap?.endPage, lang)} ({formatNumber(activeChap?.totalPages, lang)} {t('dashboard.pages', lang)})
              </p>
            </div>

            <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full glass-panel border border-electric-500/40 flex items-center justify-center shadow-glow-md mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="45%" className="stroke-white/10 fill-none" strokeWidth="6" />
                <motion.circle cx="50%" cy="50%" r="45%" className="stroke-electric-400 fill-none" strokeWidth="6"
                  strokeDasharray="283%" strokeDashoffset={`${283 - (283 * timerProgress) / 100}%`} strokeLinecap="round" />
              </svg>
              <div className="text-center z-10">
                <span className="text-5xl md:text-6xl font-extrabold text-white tracking-tight font-mono">{formatTime(secondsLeft)}</span>
                <span className="block text-[11px] text-neutral-400 uppercase tracking-widest mt-2">
                  {isActive ? t('focus.inProgress', lang) : t('focus.paused', lang)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8">
              {[25, 45, 60].map((mins) => (
                <button key={mins} onClick={() => handleSelectDuration(mins)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${selectedDurationMins === mins ? 'bg-electric-500/20 border-electric-500 text-electric-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}`}>
                  {formatNumber(mins, lang)} min
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Button variant="glass" size="md" icon={<RotateCcw className="w-4 h-4" />} onClick={handleResetTimer}>{t('focus.reset', lang)}</Button>
              <Button variant="primary" size="lg" icon={isActive ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />} onClick={handleStartPause}>
                {isActive ? t('focus.paused', lang) : t('focus.startFocus', lang)}
              </Button>
              <Button variant="ghost" size="md" onClick={handleEndEarly}>{t('focus.finishSession', lang)}</Button>
            </div>
          </motion.div>
        )}

        {viewState === 'reflection' && (
          <motion.div key="reflectionView" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md glass-panel p-6 md:p-8 rounded-3xl border border-white/10 z-10 my-auto space-y-6 shadow-glass-card">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400 mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-2xl font-extrabold text-white">{t('focus.sessionCompleted', lang)}</h3>
              <p className="text-xs text-neutral-400">{t('focus.whatDidYouComplete', lang)}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">{t('focus.completedPages', lang)}</label>
                <input type="number" min="1" value={pagesCompletedInput} onChange={(e) => setPagesCompletedInput(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">{t('focus.difficultyFeedback', lang)}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as ChapterDifficulty[]).map((d) => (
                    <button key={d} type="button" onClick={() => setDifficultyFeedback(d)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition ${difficultyFeedback === d ? 'bg-electric-500/20 border-electric-500 text-electric-400' : 'bg-white/5 border-white/10 text-neutral-400'}`}>
                      {t(`difficulty.${d.toLowerCase()}` as any, lang)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">{t('focus.focusMood', lang)}</label>
                <div className="grid grid-cols-4 gap-2 text-xl">
                  {['🔥 Focused', '😊 Calm', '⚡ Energetic', '😴 Tired'].map((m) => (
                    <button key={m} type="button" onClick={() => setMood(m.split(' ')[1] || m)}
                      className={`p-2.5 rounded-xl border text-center transition ${mood.includes(m.split(' ')[1] || m) ? 'bg-electric-500/20 border-electric-500' : 'bg-white/5 border-white/10'}`}>
                      {m.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">{t('focus.optionalNotes', lang)}</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('focus.notesPlaceholder', lang)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-xs" />
              </div>
            </div>
            <Button variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-5 h-5 ml-1" />} onClick={handleSubmitReflection}>
              {t('focus.saveSession', lang)}
            </Button>
          </motion.div>
        )}

        {viewState === 'break' && (
          <motion.div key="breakView" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 z-10 my-auto text-center space-y-6 shadow-glass-card">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
              <Coffee className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">{t('focus.greatWork', lang)}</h3>
              <p className="text-sm text-neutral-400 mt-1">
                {t('focus.youStudied', lang)} <span className="text-white font-semibold">{formatNumber(selectedDurationMins, lang)} {t('focus.minutes', lang)}</span> {t('focus.takeBreak', lang)}
              </p>
            </div>
            {breakIsActive ? (
              <div className="py-4">
                <span className="text-5xl font-extrabold text-amber-400 font-mono tracking-tight">{formatTime(breakSecondsLeft)}</span>
                <span className="block text-xs text-neutral-400 mt-2">{t('focus.breakInProgress', lang)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {[5, 10, 15].map((bm) => (
                  <button key={bm} onClick={() => setBreakMins(bm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${breakMins === bm ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/10 text-neutral-400'}`}>
                    {formatNumber(bm, lang)} {t('focus.minBreak', lang)}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              {!breakIsActive ? (
                <Button variant="primary" size="md" fullWidth icon={<Coffee className="w-4 h-4" />} onClick={handleStartBreak}>{t('focus.startBreak', lang)}</Button>
              ) : null}
              <Button variant="glass" size="md" fullWidth onClick={() => navigate('/dashboard')}>{t('focus.returnDashboard', lang)}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-xl text-center z-10">
        <p className="text-[11px] text-neutral-500">{t('focus.focusEngine', lang)}</p>
      </div>
    </div>
  );
};
