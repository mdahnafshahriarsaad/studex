import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, AppSettings, ChapterDifficulty, StudySessionRecord } from '../types';
import { addXPAndCheckAchievements } from '../services/gamificationService';
import { t, formatNumber, translateSubjectName } from '../utils/i18n';
import {
  Play, Pause, RotateCcw, X, CheckCircle2, ArrowRight, Coffee,
  ChevronDown, ChevronUp, Sparkles, Flame, BookOpen,
  Target, Timer as TimerIcon, Zap, Clock, Flag, Trophy,
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

type TimerMode = 'timer' | 'stopwatch';

/* ── Flip Digit: animates each digit change with a vertical slide ── */
const FlipDigit: React.FC<{ digit: string; className?: string }> = ({ digit, className = '' }) => {
  const [current, setCurrent] = useState(digit);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (digit !== current) {
      setCurrent(digit);
      setKey((k) => k + 1);
    }
  }, [digit, current]);

  return (
    <span className={`flip-digit-slot ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={key}
          initial={{ y: -30, opacity: 0, rotateX: -60, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, rotateX: 0, filter: 'blur(0px)' }}
          exit={{ y: 30, opacity: 0, rotateX: 60, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="block"
          style={{ perspective: '200px' }}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/* ── Animated Time Display with individual flip digits ── */
const AnimatedTime: React.FC<{
  h1: string; h2: string; m1: string; m2: string; s1: string; s2: string;
  digitClass: string; sepClass: string; blink: boolean;
}> = ({ h1, h2, m1, m2, s1, s2, digitClass, sepClass, blink }) => (
  <div className="flex items-baseline justify-center select-none" style={{ perspective: '800px' }}>
    <FlipDigit digit={h1} className={digitClass} />
    <FlipDigit digit={h2} className={digitClass} />
    <span className={`mx-1.5 ${sepClass} ${blink ? 'timer-separator' : ''}`}>:</span>
    <FlipDigit digit={m1} className={digitClass} />
    <FlipDigit digit={m2} className={digitClass} />
    <span className={`mx-1.5 ${sepClass} ${blink ? 'timer-separator' : ''}`}>:</span>
    <FlipDigit digit={s1} className={digitClass} />
    <FlipDigit digit={s2} className={digitClass} />
  </div>
);

/* ── Enhanced Circular Progress Ring with decorative outer rings ── */
const HeroRing: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  isActive: boolean;
  children: React.ReactNode;
  color?: string;
}> = ({ progress, size, strokeWidth, isActive, children, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const accent = color || '#00F0FF';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.08))' }}>
        <defs>
          <linearGradient id="heroRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="40%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="heroRingGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,240,255,0.1)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.05)" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Decorative outer dashed ring (spins) */}
        <circle
          cx={size / 2} cy={size / 2} r={radius + 16}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
          strokeDasharray="4 12"
          className="ring-outer-spin"
          style={{ transformOrigin: '50% 50%' }}
        />

        {/* Decorative inner dotted ring (counter-spins) */}
        <circle
          cx={size / 2} cy={size / 2} r={radius + 8}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={0.5}
          strokeDasharray="2 8"
          className="ring-inner-spin"
          style={{ transformOrigin: '50% 50%' }}
        />

        {/* Background track with subtle gradient */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#heroRingGrad2)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Main progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={isActive ? 'url(#heroRingGrad)' : 'rgba(255,255,255,0.12)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          filter={isActive ? 'url(#ringGlow)' : undefined}
        />

        {/* Glow dot at progress tip */}
        {isActive && progress > 0.5 && (
          <motion.circle
            cx={size / 2 + radius * Math.cos(((progress / 100) * 360 - 90) * (Math.PI / 180))}
            cy={size / 2 + radius * Math.sin(((progress / 100) * 360 - 90) * (Math.PI / 180))}
            r={strokeWidth / 2 + 3}
            fill={accent}
            animate={{ opacity: [0.4, 1, 0.4], r: [strokeWidth / 2 + 1, strokeWidth / 2 + 4, strokeWidth / 2 + 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'blur(2px)' }}
          />
        )}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

/* ── Floating Particles ── */
const Particles: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 6,
      size: 1 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 40,
    }))
  ).current;

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            background: 'rgba(0,240,255,0.6)',
            boxShadow: '0 0 6px rgba(0,240,255,0.4)',
          }}
          animate={{
            y: [0, -300 - Math.random() * 200],
            x: [0, p.drift],
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
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

  /* ── Mode ── */
  const [timerMode, setTimerMode] = useState<TimerMode>('timer');

  /* ── Timer state ── */
  const [selectedDurationMins, setSelectedDurationMins] = useState(60);
  const [secondsLeft, setSecondsLeft] = useState(60 * 60);
  const [isActive, setIsActive] = useState(false);
  const [viewState, setViewState] = useState<'main' | 'reflection' | 'break'>('main');

  /* ── Stopwatch state ── */
  const [swElapsed, setSwElapsed] = useState(0); // total ms
  const [swActive, setSwActive] = useState(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const [swLastLapTime, setSwLastLapTime] = useState(0);
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swStartRef = useRef<number>(0);

  /* ── Shared state ── */
  const [pagesInput, setPagesInput] = useState(activeChap.totalPages || 8);
  const [difficulty, setDifficulty] = useState<ChapterDifficulty>(activeChap.difficulty || 'Medium');
  const [mood, setMood] = useState('Focused');
  const [notes, setNotes] = useState('');
  const [breakMins, setBreakMins] = useState(10);
  const [breakSecs, setBreakSecs] = useState(10 * 60);
  const [breakActive, setBreakActive] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const p2 = (n: number) => n.toString().padStart(2, '0');
  const totalSessions = profile.studyHistory?.length || 0;
  const streak = profile.gamification?.currentStreak || 0;
  const totalMins = profile.gamification?.totalStudyMinutes || 0;

  /* ── Timer countdown ── */
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) iv = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    else if (secondsLeft === 0 && isActive) { setIsActive(false); setViewState('reflection'); }
    return () => { if (iv) clearInterval(iv); };
  }, [isActive, secondsLeft]);

  /* ── Stopwatch tick ── */
  useEffect(() => {
    if (swActive) {
      swStartRef.current = Date.now() - swElapsed;
      swIntervalRef.current = setInterval(() => {
        setSwElapsed(Date.now() - swStartRef.current);
      }, 50);
    } else {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    }
    return () => { if (swIntervalRef.current) clearInterval(swIntervalRef.current); };
  }, [swActive]);

  /* ── Break countdown ── */
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | null = null;
    if (breakActive && breakSecs > 0) iv = setInterval(() => setBreakSecs((p) => p - 1), 1000);
    else if (breakSecs === 0 && breakActive) setBreakActive(false);
    return () => { if (iv) clearInterval(iv); };
  }, [breakActive, breakSecs]);

  /* ── Timer actions ── */
  const pickDuration = (mins: number) => { setSelectedDurationMins(mins); setSecondsLeft(mins * 60); setIsActive(false); };
  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setSecondsLeft(selectedDurationMins * 60); };
  const endEarly = () => { setIsActive(false); setViewState('reflection'); };

  /* ── Stopwatch actions ── */
  const toggleStopwatch = () => setSwActive(!swActive);
  const resetStopwatch = () => { setSwActive(false); setSwElapsed(0); setSwLaps([]); setSwLastLapTime(0); };
  const recordLap = () => {
    if (swActive) {
      const lapTime = swElapsed - swLastLapTime;
      setSwLaps((prev) => [lapTime, ...prev]);
      setSwLastLapTime(swElapsed);
    }
  };

  /* ── Submit reflection ── */
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

  /* ── Derived timer values ── */
  const tHh = Math.floor(secondsLeft / 3600);
  const tMm = Math.floor((secondsLeft % 3600) / 60);
  const tSs = secondsLeft % 60;
  const progress = ((selectedDurationMins * 60 - secondsLeft) / (selectedDurationMins * 60)) * 100;
  const elapsed = selectedDurationMins * 60 - secondsLeft;
  const elapsedMins = Math.floor(elapsed / 60);
  const elapsedSecs = elapsed % 60;

  /* ── Derived stopwatch values ── */
  const swTotalSecs = Math.floor(swElapsed / 1000);
  const swH = Math.floor(swTotalSecs / 3600);
  const swM = Math.floor((swTotalSecs % 3600) / 60);
  const swS = swTotalSecs % 60;
  const swCs = Math.floor((swElapsed % 1000) / 10); // centiseconds
  const swMsDisplay = p2(swCs);

  /* ── Ring sizing ── */
  const ringSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 360;
  const ringStroke = typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : 7;

  const isRunning = timerMode === 'timer' ? isActive : swActive;

  /* ── Stopwatch: convert ms to display string ── */
  const formatSwTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${p2(h)}:${p2(m % 60)}:${p2(s % 60)}`;
  };

  /* ═══════════ MODE TAB SWITCHER ═══════════ */
  const renderModeTabs = () => (
    <div className="relative inline-flex liquid-glass-subtle rounded-full p-1 mb-6">
      <motion.div
        className="absolute top-1 bottom-1 rounded-full liquid-glass-btn-active mode-tab-indicator"
        style={{ left: timerMode === 'timer' ? '4px' : '50%', width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => { if (isActive) return; setTimerMode('timer'); }}
        className={`relative z-10 px-5 py-2 rounded-full text-xs font-semibold transition-colors duration-200 ${timerMode === 'timer' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
      >
        <span className="flex items-center gap-1.5"><TimerIcon className="w-3.5 h-3.5" /> Timer</span>
      </button>
      <button
        onClick={() => { if (swActive) return; setTimerMode('stopwatch'); }}
        className={`relative z-10 px-5 py-2 rounded-full text-xs font-semibold transition-colors duration-200 ${timerMode === 'stopwatch' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
      >
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Stopwatch</span>
      </button>
    </div>
  );

  /* ═══════════ SUBJECT SELECTOR ═══════════ */
  const renderSubjectSelector = () => (
    <div className="w-full">
      <button
        onClick={() => setShowSubjectPicker(!showSubjectPicker)}
        className="w-full liquid-glass-subtle rounded-2xl px-4 py-3 flex items-center justify-between transition-all hover:border-white/15"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-electric-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Subject</p>
            <p className="text-sm font-semibold text-white">{translateSubjectName(activeSubj?.name || 'Physics', lang)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            <div className="mt-2 liquid-glass-subtle rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
              {profile.subjects.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => { setShowSubjectPicker(false); navigate(`/focus?subjectId=${subj.id}&chapterId=${subj.chapters?.[0]?.id || ''}`); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${subj.id === activeSubj?.id ? 'bg-electric-500/10 text-electric-400' : 'hover:bg-white/5 text-neutral-300'}`}
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

  /* ═══════════ TIMER MODE VIEW ═══════════ */
  const renderTimerMode = () => (
    <div className="flex flex-col items-center w-full">
      {/* Subject + Chapter badge */}
      <div className="text-center mb-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-btn-active text-[11px] font-bold uppercase tracking-widest mb-2"
        >
          <Sparkles className="w-3 h-3" />
          {translateSubjectName(activeSubj?.name || 'Physics', lang)}
        </motion.div>
        <h2 className="text-lg md:text-xl font-extrabold text-white">{activeChap?.name || 'Chapter Target'}</h2>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {t('dashboard.pages', lang)} {formatNumber(activeChap?.startPage, lang)}–{formatNumber(activeChap?.endPage, lang)}
          <span className="mx-1.5 text-neutral-700">·</span>
          {formatNumber(activeChap?.totalPages, lang)} {t('dashboard.pages', lang)}
        </p>
      </div>

      {/* Hero Ring with flip digits */}
      <div className="relative mb-5">
        <HeroRing progress={progress} size={ringSize} strokeWidth={ringStroke} isActive={isActive}>
          <AnimatedTime
            h1={p2(tHh)[0]} h2={p2(tHh)[1]}
            m1={p2(tMm)[0]} m2={p2(tMm)[1]}
            s1={p2(tSs)[0]} s2={p2(tSs)[1]}
            digitClass="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white timer-digit timer-digit-glow"
            sepClass="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-600 timer-digit"
            blink={isActive}
          />
          <motion.span
            className={`text-[10px] uppercase tracking-[0.2em] font-semibold mt-2 ${isActive ? 'text-electric-400' : 'text-neutral-500'}`}
            animate={{ opacity: isActive ? [0.6, 1, 0.6] : 1 }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            {isActive ? t('focus.inProgress', lang) : t('focus.paused', lang)}
          </motion.span>
          {isActive && elapsed > 0 && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-neutral-500 mt-0.5 font-mono"
            >
              +{p2(elapsedMins)}:{p2(elapsedSecs)} elapsed
            </motion.span>
          )}
        </HeroRing>

        {/* Ambient glow */}
        {isActive && (
          <motion.div
            className="absolute inset-0 -z-10 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, rgba(124,58,237,0.04) 40%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
        {PRESETS.map((mins) => (
          <motion.button
            key={mins} whileTap={{ scale: 0.93 }}
            onClick={() => pickDuration(mins)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
              selectedDurationMins === mins ? 'liquid-glass-btn-active scale-105' : 'liquid-glass-btn text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
          </motion.button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={resetTimer} className="liquid-glass-btn p-3 rounded-2xl text-neutral-400 hover:text-white transition-all">
          <RotateCcw className="w-5 h-5" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={toggleTimer} className="liquid-glass-start px-10 py-3.5 rounded-full text-sm font-bold flex items-center gap-2">
          {isActive ? <><Pause className="w-4 h-4" /> {t('focus.paused', lang)}</> : <><Play className="w-4 h-4 ml-0.5" /> {t('focus.startFocus', lang)}</>}
        </motion.button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={endEarly} className="liquid-glass-btn px-4 py-3.5 rounded-full text-[11px] font-semibold text-neutral-400 hover:text-white transition-all">
          {t('focus.finishSession', lang)}
        </motion.button>
      </div>
    </div>
  );

  /* ═══════════ STOPWATCH MODE VIEW ═══════════ */
  const renderStopwatchMode = () => {
    const bestLap = swLaps.length > 0 ? Math.min(...swLaps) : 0;
    const worstLap = swLaps.length > 0 ? Math.max(...swLaps) : 0;

    return (
      <div className="flex flex-col items-center w-full">
        {/* Stopwatch Ring - always shows elapsed as fill percentage of an hour */}
        <div className="relative mb-5">
          <HeroRing
            progress={(swTotalSecs / 3600) * 100}
            size={ringSize}
            strokeWidth={ringStroke}
            isActive={swActive}
            color="#A855F7"
          >
            {/* Main time with flip digits */}
            <AnimatedTime
              h1={p2(swH)[0]} h2={p2(swH)[1]}
              m1={p2(swM)[0]} m2={p2(swM)[1]}
              s1={p2(swS)[0]} s2={p2(swS)[1]}
              digitClass="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white timer-digit"
              sepClass="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-600 timer-digit"
              blink={swActive}
            />
            {/* Centiseconds */}
            <motion.span
              className="text-2xl sm:text-3xl font-bold text-purple-400/70 font-mono timer-digit -mt-1"
              key={swMsDisplay}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              .{swMsDisplay}
            </motion.span>
            <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold mt-1 ${swActive ? 'text-purple-400' : 'text-neutral-500'}`}>
              {swActive ? 'Running' : swElapsed > 0 ? 'Paused' : 'Ready'}
            </span>
          </HeroRing>

          {swActive && (
            <motion.div
              className="absolute inset-0 -z-10 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(236,72,153,0.04) 40%, transparent 70%)' }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Stopwatch actions */}
        <div className="flex items-center gap-3 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={resetStopwatch} className="liquid-glass-btn p-3 rounded-2xl text-neutral-400 hover:text-white transition-all">
            <RotateCcw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={toggleStopwatch}
            className="px-10 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.85) 0%, rgba(236,72,153,0.85) 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderTopColor: 'rgba(255,255,255,0.35)',
              boxShadow: '0 4px 24px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.1)',
              color: '#fff',
            }}
          >
            {swActive ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4 ml-0.5" /> Start</>}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={recordLap}
            disabled={!swActive}
            className={`liquid-glass-btn p-3 rounded-2xl transition-all ${swActive ? 'text-amber-400 hover:text-amber-300' : 'text-neutral-600'}`}
          >
            <Flag className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Laps */}
        {swLaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs liquid-glass-subtle rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Trophy className="w-3 h-3" /> Laps ({swLaps.length})
              </span>
              <span className="text-[10px] text-neutral-500">Total: {formatSwTime(swElapsed)}</span>
            </div>
            <div className="max-h-36 overflow-y-auto">
              {swLaps.map((lapMs, i) => {
                const isBest = lapMs === bestLap && swLaps.length > 1;
                const isWorst = lapMs === worstLap && swLaps.length > 1;
                return (
                  <div key={i} className="lap-item flex items-center justify-between px-4 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <span className="text-[11px] text-neutral-500 w-12">Lap {swLaps.length - i}</span>
                    <span className={`text-[11px] font-mono font-semibold ${isBest ? 'text-green-400' : isWorst ? 'text-red-400' : 'text-neutral-300'}`}>
                      {formatSwTime(lapMs)}
                    </span>
                    <span className="text-[10px] text-neutral-600 font-mono">
                      +{formatSwTime(swLaps.slice(0, swLaps.length - i).reduce((a, b) => a + b, 0))}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  /* ═══════════ REFLECTION VIEW ═══════════ */
  const renderReflection = () => (
    <motion.div key="reflection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-lg mx-auto px-4">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="w-20 h-20 rounded-full liquid-glass mx-auto mb-4 flex items-center justify-center"
          style={{ boxShadow: '0 0 50px rgba(0,240,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)', borderColor: 'rgba(0,240,255,0.3)' }}
        >
          <CheckCircle2 className="w-9 h-9 text-electric-400" />
        </motion.div>
        <h3 className="text-2xl font-extrabold text-white">{t('focus.sessionCompleted', lang)}</h3>
        <p className="text-xs text-neutral-500 mt-1">{t('focus.whatDidYouComplete', lang)}</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-white font-mono">{p2(elapsedMins)}:{p2(elapsedSecs)}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Time</p>
          </div>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="text-center">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-xl font-bold text-electric-400"
            >
              +{50 + pagesInput * 5} XP
            </motion.p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Earned</p>
          </div>
        </div>
      </div>

      <div className="liquid-glass rounded-3xl p-6 md:p-8 space-y-5">
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.completedPages', lang)}</label>
          <input type="number" min="1" value={pagesInput} onChange={(e) => setPagesInput(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl liquid-glass-input text-white text-sm" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.difficultyFeedback', lang)}</label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} className={`py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 ${difficulty === d ? 'liquid-glass-btn-active' : 'liquid-glass-btn text-neutral-400 hover:text-neutral-200'}`}>
                {t(`difficulty.${d.toLowerCase()}` as any, lang)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.focusMood', lang)}</label>
          <div className="grid grid-cols-4 gap-2 text-lg">
            {MOODS.map((m) => (
              <button key={m.label} onClick={() => setMood(m.label)} className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${mood === m.label ? 'liquid-glass-btn-active' : 'liquid-glass-btn text-neutral-400'}`}>
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1.5">{t('focus.optionalNotes', lang)}</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('focus.notesPlaceholder', lang)} className="w-full px-4 py-3 rounded-xl liquid-glass-input text-white text-xs" />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={submitReflection} className="liquid-glass-start w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2">
          {t('focus.saveSession', lang)} <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );

  /* ═══════════ BREAK VIEW ═══════════ */
  const bh = Math.floor(breakSecs / 60);
  const bs = breakSecs % 60;
  const renderBreak = () => (
    <motion.div key="break" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg mx-auto flex flex-col items-center px-4">
      <div className="mb-6">
        <HeroRing progress={breakActive ? ((breakMins * 60 - breakSecs) / (breakMins * 60)) * 100 : 0} size={220} strokeWidth={5} isActive={breakActive} color="#F59E0B">
          {breakActive ? (
            <>
              <AnimatedTime
                h1="0" h2="0" m1={p2(bh)[0]} m2={p2(bh)[1]} s1={p2(bs)[0]} s2={p2(bs)[1]}
                digitClass="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono timer-digit"
                sepClass="text-2xl sm:text-3xl font-bold text-amber-400/30 timer-digit"
                blink={false}
              />
              <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">{t('focus.breakInProgress', lang)}</span>
            </>
          ) : (
            <>
              <Coffee className="w-10 h-10 text-amber-400 mb-1" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Break Time</span>
            </>
          )}
        </HeroRing>
      </div>
      <div className="liquid-glass rounded-3xl p-8 text-center space-y-5 w-full">
        <div>
          <h3 className="text-2xl font-extrabold text-white">{t('focus.greatWork', lang)}</h3>
          <p className="text-sm text-neutral-400 mt-1.5">
            {t('focus.youStudied', lang)}{' '}<span className="text-white font-semibold">{formatNumber(selectedDurationMins, lang)} {t('focus.minutes', lang)}</span>{' '}{t('focus.takeBreak', lang)}
          </p>
        </div>
        {!breakActive && (
          <div className="flex items-center justify-center gap-2">
            {BREAK_PRESETS.map((bm) => (
              <button key={bm} onClick={() => setBreakMins(bm)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${breakMins === bm ? 'liquid-glass-btn-active' : 'liquid-glass-btn text-neutral-400 hover:text-neutral-200'}`}>
                {formatNumber(bm, lang)} {t('focus.minBreak', lang)}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 pt-2">
          {!breakActive && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setBreakSecs(breakMins * 60); setBreakActive(true); }} className="liquid-glass-start flex-1 py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2">
              <Coffee className="w-4 h-4" /> {t('focus.startBreak', lang)}
            </motion.button>
          )}
          <button onClick={() => navigate('/dashboard')} className="liquid-glass-btn flex-1 py-3.5 rounded-full text-sm font-semibold text-neutral-300 hover:text-white transition">
            {t('focus.returnDashboard', lang)}
          </button>
        </div>
      </div>
    </motion.div>
  );

  /* ═══════════ MAIN RENDER ═══════════ */
  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-electric-500/[0.03] blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.03] blur-[140px]" />
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-pink-500/[0.02] blur-[120px]" />
      </div>

      {/* Particles (only when running) */}
      <Particles isActive={isRunning} />

      {/* Top Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-5 pt-4 pb-1 z-10 relative">
        <div className="flex items-center gap-2.5">
          <img src="/logo-mark.png" alt="Studex" className="w-6 h-6 object-contain opacity-80" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">{t('focus.focusMode', lang)}</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="p-2.5 rounded-full liquid-glass-btn text-neutral-500 hover:text-white transition" title={t('focus.exitFocus', lang)}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto px-4 pb-6 pt-1 z-10">
        <AnimatePresence mode="wait">
          {viewState === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8"
            >
              {/* Left: Timer/Stopwatch area */}
              <div className="flex-1 flex flex-col items-center w-full lg:max-w-none">
                {renderModeTabs()}
                <AnimatePresence mode="wait">
                  {timerMode === 'timer' ? (
                    <motion.div key="timer-mode" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      {renderTimerMode()}
                    </motion.div>
                  ) : (
                    <motion.div key="stopwatch-mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                      {renderStopwatchMode()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Side panel (hidden on stopwatch mode) */}
              {timerMode === 'timer' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 shrink-0"
                >
                  {/* Stats row */}
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

                  {/* Subject selector */}
                  {renderSubjectSelector()}

                  {/* Chapter card */}
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
                </motion.div>
              )}
            </motion.div>
          )}
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
