import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, AppSettings, ChapterDifficulty, StudySessionRecord } from '../types';
import { addXPAndCheckAchievements } from '../services/gamificationService';
import { t, formatNumber, translateSubjectName } from '../utils/i18n';
import {
  Play, Pause, RotateCcw, X, CheckCircle2, ArrowRight, Coffee,
  ChevronDown, ChevronUp, ChevronRight, Sparkles, Flame, BookOpen,
  Target, Timer as TimerIcon, SkipForward, Settings2, Zap, Clock,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface FocusPageProps {
  profile: UserProfile;
  settings?: AppSettings;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onToggleChapterComplete: (subjectId: string, chapterId: string) => void;
}

const PRESETS = [15, 25, 45, 60, 90, 120];
const BREAK_PRESETS = [5, 10, 15];
const DIFFICULTIES: ChapterDifficulty[] = ['Easy', 'Medium', 'Hard'];
const MOODS = [
  { emoji: '\u261D\uFE0F', label: 'Focused' },
  { emoji: '\u263A\uFE0F', label: 'Calm' },
  { emoji: '\u26A1', label: 'Energetic' },
  { emoji: '\uD83D\uDE34', label: 'Tired' },
];

/* ── Circular Progress Ring Component ── */
const CircularProgressRing: React.FC<{
  progress: number; // 0–100
  size: number;
  strokeWidth: number;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ progress, size, strokeWidth, isActive, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={isActive ? 'url(#ringGradient)' : 'rgba(255,255,255,0.15)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ filter: isActive ? 'drop-shadow(0 0 12px rgba(0,240,255,0.4))' : 'none' }}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity={1} />
            <stop offset="50%" stopColor="#00B4FF" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#A855F7" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        {/* Glow dot at the end of the progress arc */}
        {isActive && progress > 0 && (
          <motion.circle
            cx={size / 2 + radius * Math.cos(((progress / 100) * 360 - 90) * (Math.PI / 180))}
            cy={size / 2 + radius * Math.sin(((progress / 100) * 360 - 90) * (Math.PI / 180))}
            r={strokeWidth / 2 + 2}
            fill="#00F0FF"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ filter: 'blur(3px)' }}
          />
        )}
      </svg>
      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export const FocusPage: React.FC<FocusPageProps> = ({
  profile, settings, onUpdateProfile, onToggleChapterComplete,
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

  const [selectedDurationMins, setSelectedDurationMins] = useState(60);
  const [secondsLeft, setSecondsLeft] = useState(60 * 60);
  const [isActive, setIsActive] = useState(false);
  const [viewState, setViewState] = useState<'timer' | 'reflection' | 'break'>('timer');
  const [pagesInput, setPagesInput] = useState(activeChap.totalPages || 8);
  const [difficulty, setDifficulty] = useState<ChapterDifficulty>(activeChap.difficulty || 'Medium');
  const [mood, setMood] = useState('Focused');
  const [notes, setNotes] = useState('');
  const [breakMins, setBreakMins] = useState(10);
  const [breakSecs, setBreakSecs] = useState(10 * 60);
  const [breakActive, setBreakActive] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Timer countdown
  useEffect(() => {
    let iv: any = null;
    if (isActive && secondsLeft > 0) iv = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    else if (secondsLeft === 0 && isActive) { setIsActive(false); setViewState('reflection'); }
    return () => clearInterval(iv);
  }, [isActive, secondsLeft]);

  // Break countdown
  useEffect(() => {
    let iv: any = null;
    if (breakActive && breakSecs > 0) iv = setInterval(() => setBreakSecs((p) => p - 1), 1000);
    else if (breakSecs === 0 && breakActive) setBreakActive(false);
    return () => clearInterval(iv);
  }, [breakActive, breakSecs]);

  const pickDuration = (mins: number) => { setSelectedDurationMins(mins); setSecondsLeft(mins * 60); setIsActive(false); };
  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setSecondsLeft(selectedDurationMins * 60); };
  const endEarly = () => { setIsActive(false); setViewState('reflection'); };

  const submitReflection = () => {
    const elapsed = Math.max(1, Math.round((selectedDurationMins * 60 - secondsLeft) / 60));
    const session: StudySessionRecord = {
      id: `session-${Date.now()}`, subjectId: activeSubj?.id || 'subj-1',
      subjectName: activeSubj?.name || 'Physics', chapterId: activeChap?.id || 'ch-1',
      chapterName: activeChap?.name || 'Chapter Target', durationMinutes: elapsed,
      pagesCompleted: pagesInput, difficultyFeedback: difficulty, mood, notes, timestamp: new Date().toISOString(),
    };
    const xp = 50 + pagesInput * 5;
    const gam = addXPAndCheckAchievements(profile.gamification, xp, elapsed, pagesInput >= activeChap.totalPages, (profile.studyHistory?.length || 0) + 1);
    onUpdateProfile({ studyHistory: [session, ...(profile.studyHistory || [])], gamification: gam });
    if (pagesInput >= activeChap.totalPages && activeSubj?.id && activeChap?.id) onToggleChapterComplete(activeSubj.id, activeChap.id);
    setViewState('break');
  };

  const hh = Math.floor(secondsLeft / 3600);
  const mm = Math.floor((secondsLeft % 3600) / 60);
  const ss = secondsLeft % 60;
  const progress = ((selectedDurationMins * 60 - secondsLeft) / (selectedDurationMins * 60)) * 100;
  const elapsed = selectedDurationMins * 60 - secondsLeft;
  const elapsedMins = Math.floor(elapsed / 60);
  const elapsedSecs = elapsed % 60;
  const p2 = (n: number) => n.toString().padStart(2, '0');

  // Responsive ring size
  const ringSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 260 : 340;
  const ringStroke = typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 8;

  const totalSessions = profile.studyHistory?.length || 0;
  const streak = profile.gamification?.currentStreak || 0;
  const totalMins = profile.gamification?.totalStudyMinutes || 0;

  /* ──────── SUBJECT & CHAPTER SELECTOR ──────── */
  const renderSubjectSelector = () => (
    <div className="w-full">
      <button
        onClick={() => { setShowSubjectPicker(!showSubjectPicker); setShowChapterPicker(false); }}
        className="w-full liquid-glass-subtle rounded-2xl px-4 py-3 flex items-center justify-between transition-all hover:border-white/15"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-electric-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">{t('focus.subjectsAvailable', lang)}</p>
            <p className="text-sm font-semibold text-white">{translateSubjectName(activeSubj?.name || 'Physics', lang)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500">{profile.subjects.length} {t('focus.subjectsAvailable', lang)}</span>
          {showSubjectPicker ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </div>
      </button>

      <AnimatePresence>
        {showSubjectPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            className="overflow-hidden"
          >
            <div className="mt-2 liquid-glass-subtle rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
              {profile.subjects.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => {
                    setShowSubjectPicker(false);
                    navigate(`/focus?subjectId=${subj.id}&chapterId=${subj.chapters?.[0]?.id || ''}`);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${
                    subj.id === activeSubj?.id
                      ? 'bg-electric-500/10 text-electric-400'
                      : 'hover:bg-white/5 text-neutral-300'
                  }`}
                >
                  <span className="font-medium">{translateSubjectName(subj.name, lang)}</span>
                  <span className="text-[10px] text-neutral-500">{subj.completedChapters}/{subj.totalChapters}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ──────── TIMER VIEW ──────── */
  const renderTimer = () => (
    <motion.div
      key="timer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8 px-4"
    >
      {/* ── Left: Main Timer Area ── */}
      <div className="flex-1 flex flex-col items-center w-full lg:max-w-none">

        {/* Subject + Chapter Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-btn-active text-[11px] font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" />
            {translateSubjectName(activeSubj?.name || 'Physics', lang)}
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">{activeChap?.name || 'Chapter Target'}</h2>
          <p className="text-[11px] text-neutral-500 mt-1">
            {t('dashboard.pages', lang)} {formatNumber(activeChap?.startPage, lang)}–{formatNumber(activeChap?.endPage, lang)}
            <span className="mx-1.5 text-neutral-600">·</span>
            {formatNumber(activeChap?.totalPages, lang)} {t('dashboard.pages', lang)}
          </p>
        </div>

        {/* Circular Timer Ring */}
        <div className="relative mb-6">
          <CircularProgressRing
            progress={progress}
            size={ringSize}
            strokeWidth={ringStroke}
            isActive={isActive}
          >
            {/* Time digits inside ring */}
            <div className="flex items-baseline justify-center select-none">
              <span className={`text-5xl sm:text-6xl md:text-7xl font-extrabold text-white timer-digit timer-digit-glow ${isActive ? '' : 'opacity-80'}`}>{p2(hh)}</span>
              <span className={`text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-600 mx-1 timer-digit ${isActive ? 'timer-separator' : ''}`}>:</span>
              <span className={`text-5xl sm:text-6xl md:text-7xl font-extrabold text-white timer-digit timer-digit-glow ${isActive ? '' : 'opacity-80'}`}>{p2(mm)}</span>
              <span className={`text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-600 mx-1 timer-digit ${isActive ? 'timer-separator' : ''}`}>:</span>
              <span className={`text-5xl sm:text-6xl md:text-7xl font-extrabold text-white timer-digit timer-digit-glow ${isActive ? '' : 'opacity-80'}`}>{p2(ss)}</span>
            </div>
            {/* Status label below digits */}
            <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold mt-2 ${isActive ? 'text-electric-400' : 'text-neutral-500'}`}>
              {isActive ? t('focus.inProgress', lang) : t('focus.paused', lang)}
            </span>
            {/* Elapsed time */}
            {isActive && elapsed > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-neutral-500 mt-1 font-mono"
              >
                +{p2(elapsedMins)}:{p2(elapsedSecs)} elapsed
              </motion.span>
            )}
          </CircularProgressRing>

          {/* Ambient glow behind ring */}
          {isActive && (
            <div className="absolute inset-0 -z-10">
              <div
                className="rounded-full animate-pulse"
                style={{
                  width: ringSize * 0.8,
                  height: ringSize * 0.8,
                  top: '10%',
                  left: '10%',
                  background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)',
                }}
              />
            </div>
          )}
        </div>

        {/* Duration Presets — pill row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          {PRESETS.map((mins) => (
            <button
              key={mins}
              onClick={() => pickDuration(mins)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                selectedDurationMins === mins
                  ? 'liquid-glass-btn-active scale-105'
                  : 'liquid-glass-btn text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
            </button>
          ))}
        </div>

        {/* Main Action Buttons */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={resetTimer}
            className="liquid-glass-btn p-3 rounded-2xl text-neutral-400 hover:text-white transition-all active:scale-95"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <motion.button
            onClick={toggleTimer}
            whileTap={{ scale: 0.95 }}
            className="liquid-glass-start px-10 py-3.5 rounded-full text-sm font-bold flex items-center gap-2"
          >
            {isActive ? <><Pause className="w-4 h-4" /> {t('focus.paused', lang)}</> : <><Play className="w-4 h-4 ml-0.5" /> {t('focus.startFocus', lang)}</>}
          </motion.button>
          <button
            onClick={endEarly}
            className="liquid-glass-btn px-5 py-3.5 rounded-full text-xs font-semibold text-neutral-400 hover:text-white transition-all active:scale-95"
          >
            {t('focus.finishSession', lang)}
          </button>
        </div>
      </div>

      {/* ── Right: Session Settings Panel ── */}
      <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 shrink-0">
        {/* Session Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="liquid-glass-subtle rounded-xl p-3 text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{formatNumber(streak, lang)}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Streak</p>
          </div>
          <div className="liquid-glass-subtle rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 text-electric-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{formatNumber(totalSessions, lang)}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Sessions</p>
          </div>
          <div className="liquid-glass-subtle rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{totalMins >= 60 ? `${Math.floor(totalMins / 60)}h` : `${totalMins}m`}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Total</p>
          </div>
        </div>

        {/* Subject Selector */}
        {renderSubjectSelector()}

        {/* Chapter Info Card */}
        <div className="liquid-glass-subtle rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5 text-electric-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Chapter Target</span>
          </div>
          <p className="text-sm font-semibold text-white mb-1">{activeChap?.name || 'Chapter'}</p>
          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span>{t('dashboard.pages', lang)} {formatNumber(activeChap?.startPage, lang)}–{formatNumber(activeChap?.endPage, lang)}</span>
            <span>·</span>
            <span>{activeChap?.difficulty || 'Medium'}</span>
          </div>
          {/* Chapter progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-500">Progress</span>
              <span className="text-[10px] text-neutral-400 font-mono">{activeSubj?.completedPages || 0}/{activeSubj?.totalPages || 0}</span>
            </div>
            <div className="progress-track h-1.5">
              <div className="progress-fill" style={{ width: `${activeSubj?.progressPercent || 0}%` }} />
            </div>
          </div>
        </div>

        {/* Quick Settings Toggle (mobile) / Always visible (desktop) */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="lg:hidden liquid-glass-btn rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-neutral-400 hover:text-white transition"
        >
          <Settings2 className="w-3.5 h-3.5" />
          {showSettings ? 'Hide Settings' : 'Session Settings'}
        </button>

        <div className={`${showSettings ? 'flex' : 'hidden'} lg:flex flex-col gap-3`}>
          {/* Today's Plan Hint */}
          <div className="liquid-glass-subtle rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TimerIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Session Info</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Duration</span>
                <span className="text-neutral-300 font-mono">{selectedDurationMins >= 60 ? `${selectedDurationMins / 60}h` : `${selectedDurationMins}m`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Subject</span>
                <span className="text-neutral-300">{translateSubjectName(activeSubj?.name || 'Physics', lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pages</span>
                <span className="text-neutral-300 font-mono">{formatNumber(activeChap?.startPage, lang)}–{formatNumber(activeChap?.endPage, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Difficulty</span>
                <span className={`font-medium ${activeChap?.difficulty === 'Hard' ? 'text-red-400' : activeChap?.difficulty === 'Easy' ? 'text-green-400' : 'text-amber-400'}`}>
                  {activeChap?.difficulty || 'Medium'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  /* ──────── REFLECTION VIEW ──────── */
  const renderReflection = () => (
    <motion.div
      key="reflection"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Success Header with Circular Check */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 rounded-full liquid-glass mx-auto mb-4 flex items-center justify-center"
          style={{
            boxShadow: '0 0 40px rgba(0,240,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
            borderColor: 'rgba(0,240,255,0.3)',
          }}
        >
          <CheckCircle2 className="w-9 h-9 text-electric-400" />
        </motion.div>
        <h3 className="text-2xl font-extrabold text-white">{t('focus.sessionCompleted', lang)}</h3>
        <p className="text-xs text-neutral-500 mt-1">{t('focus.whatDidYouComplete', lang)}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="text-center">
            <p className="text-lg font-bold text-white font-mono">{p2(elapsedMins)}:{p2(elapsedSecs)}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Time</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">+{50 + pagesInput * 5}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">XP Earned</p>
          </div>
        </div>
      </div>

      {/* Reflection Form Card */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 space-y-5">
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.completedPages', lang)}</label>
          <input
            type="number" min="1"
            value={pagesInput}
            onChange={(e) => setPagesInput(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-xl liquid-glass-input text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.difficultyFeedback', lang)}</label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                  difficulty === d
                    ? 'liquid-glass-btn-active'
                    : 'liquid-glass-btn text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t(`difficulty.${d.toLowerCase()}` as any, lang)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.focusMood', lang)}</label>
          <div className="grid grid-cols-4 gap-2 text-lg">
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => setMood(m.label)}
                className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  mood === m.label
                    ? 'liquid-glass-btn-active'
                    : 'liquid-glass-btn text-neutral-400'
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.optionalNotes', lang)}</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('focus.notesPlaceholder', lang)}
            className="w-full px-4 py-3 rounded-xl liquid-glass-input text-white text-xs"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submitReflection}
          className="liquid-glass-start w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2"
        >
          {t('focus.saveSession', lang)} <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );

  /* ──────── BREAK VIEW ──────── */
  const bh = Math.floor(breakSecs / 60);
  const bs = breakSecs % 60;
  const renderBreak = () => (
    <motion.div
      key="break"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg mx-auto flex flex-col items-center"
    >
      {/* Break Timer Ring */}
      <div className="mb-6">
        <CircularProgressRing
          progress={breakActive ? ((breakMins * 60 - breakSecs) / (breakMins * 60)) * 100 : 0}
          size={200}
          strokeWidth={5}
          isActive={breakActive}
        >
          {breakActive ? (
            <>
              <span className="text-5xl font-extrabold text-amber-400 font-mono timer-digit">{p2(bh)}:{p2(bs)}</span>
              <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">{t('focus.breakInProgress', lang)}</span>
            </>
          ) : (
            <>
              <Coffee className="w-10 h-10 text-amber-400 mb-1" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Break Time</span>
            </>
          )}
        </CircularProgressRing>
      </div>

      {/* Break content card */}
      <div className="liquid-glass rounded-3xl p-8 text-center space-y-5 w-full">
        <div>
          <h3 className="text-2xl font-extrabold text-white">{t('focus.greatWork', lang)}</h3>
          <p className="text-sm text-neutral-400 mt-1.5">
            {t('focus.youStudied', lang)}{' '}
            <span className="text-white font-semibold">{formatNumber(selectedDurationMins, lang)} {t('focus.minutes', lang)}</span>{' '}
            {t('focus.takeBreak', lang)}
          </p>
        </div>

        {!breakActive && (
          <div className="flex items-center justify-center gap-2">
            {BREAK_PRESETS.map((bm) => (
              <button
                key={bm}
                onClick={() => setBreakMins(bm)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  breakMins === bm
                    ? 'liquid-glass-btn-active'
                    : 'liquid-glass-btn text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {formatNumber(bm, lang)} {t('focus.minBreak', lang)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {!breakActive && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setBreakSecs(breakMins * 60); setBreakActive(true); }}
              className="liquid-glass-start flex-1 py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2"
            >
              <Coffee className="w-4 h-4" /> {t('focus.startBreak', lang)}
            </motion.button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="liquid-glass-btn flex-1 py-3.5 rounded-full text-sm font-semibold text-neutral-300 hover:text-white transition"
          >
            {t('focus.returnDashboard', lang)}
          </button>
        </div>
      </div>
    </motion.div>
  );

  /* ──────── MAIN RENDER ──────── */
  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-electric-500/[0.04] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/[0.03] blur-[120px] pointer-events-none" />
      {isActive && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.03) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Top Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-5 pt-4 pb-2 z-10 relative">
        <div className="flex items-center gap-2.5">
          <img src="/logo-mark.png" alt="Studex" className="w-6 h-6 object-contain opacity-80" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">{t('focus.focusMode', lang)}</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2.5 rounded-full liquid-glass-btn text-neutral-500 hover:text-white transition"
          title={t('focus.exitFocus', lang)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center z-10 overflow-y-auto px-2 sm:px-4 pb-6 pt-2">
        <AnimatePresence mode="wait">
          {viewState === 'timer' && renderTimer()}
          {viewState === 'reflection' && renderReflection()}
          {viewState === 'break' && renderBreak()}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="w-full text-center pb-3 z-10">
        <p className="text-[10px] text-neutral-600 tracking-wider">{t('focus.focusEngine', lang)}</p>
      </div>
    </div>
  );
};
