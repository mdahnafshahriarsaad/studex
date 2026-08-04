import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StudyPlan, StudySession, CalendarDayData, StudyStatus } from '../types/calendar';
import { SubjectItem } from '../types';
import {
  formatDate, getTodayStr, addDays, computeDayStatus, computeDayData,
  generateAutoStudyPlan, adaptFuturePlans, calculateStudyStreak,
  generateHeatmapData, computeMonthlySummary, predictExamReadiness,
  searchPlans, filterPlans, HeatmapDay, MonthlySummary, ExamPrediction, AutoPlanResult
} from '../services/calendarEngine';

const PLANS_KEY = 'studex_calendar_plans_v2';
const SESSIONS_KEY = 'studex_calendar_sessions_v2';

function loadPlans(): StudyPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    // Migration: add status field to old plans
    return data.map((p: StudyPlan) => ({ ...p, status: p.status || 'todo' as const }));
  } catch { return []; }
}

function loadSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePlans(plans: StudyPlan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

function saveSessions(sessions: StudySession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// BroadcastChannel for cross-tab sync
const CHANNEL_NAME = 'studex-calendar-sync';
let channel: BroadcastChannel | null = null;
try { channel = new BroadcastChannel(CHANNEL_NAME); } catch { /* no broadcast support */ }

export { formatDate, getTodayStr, addDays };

export function useDayData(plans: StudyPlan[], sessions: StudySession[], dateStr: string): CalendarDayData {
  const dayPlans = plans.filter(p => p.date === dateStr);
  const daySessions = sessions.filter(s => s.date === dateStr);
  const totalPlannedMinutes = dayPlans.reduce((a, p) => a + p.estimatedMinutes, 0);
  const totalStudiedMinutes = daySessions.reduce((a, s) => a + s.minutesStudied, 0);
  const totalPlannedPages = dayPlans.reduce((a, p) => a + Math.max(0, p.pageEnd - p.pageStart + 1), 0);
  const totalDonePages = daySessions.reduce((a, s) => a + s.pagesCompleted, 0);
  const completionPercent = totalPlannedPages > 0
    ? Math.min(100, Math.round((totalDonePages / totalPlannedPages) * 100))
    : daySessions.length > 0 ? 100 : 0;

  const { currentStreak } = calculateStudyStreak(plans, sessions);

  return {
    date: dateStr,
    plans: dayPlans,
    sessions: daySessions,
    status: computeDayStatus(plans, sessions, dateStr),
    totalPlannedMinutes,
    totalStudiedMinutes,
    completionPercent,
    totalPlannedPages,
    totalCompletedPages: totalDonePages,
    studyStreak: currentStreak,
  };
}

export function useCalendarStore() {
  const [plans, setPlansState] = useState<StudyPlan[]>(loadPlans);
  const [sessions, setSessionsState] = useState<StudySession[]>(loadSessions);
  const [adaptMessage, setAdaptMessage] = useState<string | null>(null);
  const versionRef = useRef(0);

  useEffect(() => { savePlans(plans); }, [plans]);
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // Cross-tab sync
  useEffect(() => {
    if (!channel) return;
    const handler = () => {
      setPlansState(loadPlans());
      setSessionsState(loadSessions());
    };
    channel.addEventListener('message', handler);
    return () => channel?.removeEventListener('message', handler);
  }, []);

  const broadcast = useCallback(() => {
    if (channel) channel.postMessage({ type: 'calendar-updated', v: ++versionRef.current });
  }, []);

  // ─── PLAN CRUD ──────────────────────────────────────────────────────────

  const addPlan = useCallback((plan: Omit<StudyPlan, 'id' | 'createdAt'>) => {
    const newPlan: StudyPlan = {
      ...plan,
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: plan.status || 'todo',
    };
    setPlansState(prev => [...prev, newPlan]);
    broadcast();
    return newPlan;
  }, [broadcast]);

  const editPlan = useCallback((id: string, updates: Partial<StudyPlan>) => {
    setPlansState(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    broadcast();
  }, [broadcast]);

  const deletePlan = useCallback((id: string) => {
    setPlansState(prev => prev.filter(p => p.id !== id));
    broadcast();
  }, [broadcast]);

  const duplicatePlan = useCallback((id: string, newDate?: string) => {
    setPlansState(prev => {
      const plan = prev.find(p => p.id === id);
      if (!plan) return prev;
      const dup: StudyPlan = {
        ...plan,
        id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: newDate || plan.date,
        status: 'todo',
        createdAt: new Date().toISOString(),
      };
      return [...prev, dup];
    });
    broadcast();
  }, [broadcast]);

  const movePlan = useCallback((id: string, newDate: string) => {
    setPlansState(prev => prev.map(p => p.id === id ? { ...p, date: newDate } : p));
    broadcast();
  }, [broadcast]);

  const updatePlanStatus = useCallback((id: string, status: StudyPlan['status']) => {
    setPlansState(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    broadcast();
  }, [broadcast]);

  // ─── SESSION CRUD ──────────────────────────────────────────────────────

  const addSession = useCallback((session: Omit<StudySession, 'id' | 'completedAt'>) => {
    const newSession: StudySession = {
      ...session,
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      completedAt: new Date().toISOString(),
    };
    setSessionsState(prev => [...prev, newSession]);
    broadcast();
    return newSession;
  }, [broadcast]);

  const deleteSession = useCallback((id: string) => {
    setSessionsState(prev => prev.filter(s => s.id !== id));
    broadcast();
  }, [broadcast]);

  // ─── GETTERS ───────────────────────────────────────────────────────────

  const getPlansForDate = useCallback((dateStr: string) => plans.filter(p => p.date === dateStr), [plans]);
  const getSessionsForDate = useCallback((dateStr: string) => sessions.filter(s => s.date === dateStr), [sessions]);

  const getStatusForDate = useCallback((dateStr: string): StudyStatus => {
    return computeDayStatus(plans, sessions, dateStr);
  }, [plans, sessions]);

  const getMissedPlans = useCallback(() => {
    const today = getTodayStr();
    return plans.filter(p =>
      p.date < today &&
      p.status !== 'completed' &&
      p.status !== 'cancelled' &&
      !sessions.some(s => s.planId === p.id)
    );
  }, [plans, sessions]);

  // ─── AUTO PLANNING ─────────────────────────────────────────────────────

  const generateAutoPlan = useCallback((
    subjects: SubjectItem[],
    examDate: string,
    dailyStudyMinutes: number
  ): AutoPlanResult => {
    const result = generateAutoStudyPlan({
      subjects,
      examDate,
      dailyStudyMinutes,
    });
    // Replace all auto-generated plans with new ones
    setPlansState(prev => {
      const nonAuto = prev.filter(p => !p.isAutoGenerated);
      return [...nonAuto, ...result.plans];
    });
    broadcast();
    return result;
  }, [broadcast]);

  // ─── ADAPTIVE REDISTRIBUTION ────────────────────────────────────────────

  const adaptToday = useCallback((): string => {
    const result = adaptFuturePlans(plans, sessions);
    if (result.caseType !== 1) {
      setPlansState(result.updatedPlans);
      broadcast();
    }
    setAdaptMessage(result.message);
    setTimeout(() => setAdaptMessage(null), 5000);
    return result.message;
  }, [plans, sessions, broadcast]);

  // ─── HEATMAP ───────────────────────────────────────────────────────────

  const heatmapData = useMemo(() => generateHeatmapData(plans, sessions), [plans, sessions]);

  // ─── MONTHLY SUMMARY ───────────────────────────────────────────────────

  const getMonthlySummary = useCallback((year: number, month: number): MonthlySummary => {
    return computeMonthlySummary(plans, sessions, year, month);
  }, [plans, sessions]);

  // ─── STREAK ────────────────────────────────────────────────────────────

  const streak = useMemo(() => calculateStudyStreak(plans, sessions), [plans, sessions]);

  // ─── EXAM PREDICTION ───────────────────────────────────────────────────

  const getExamPrediction = useCallback((
    examDate: string,
    totalRemainingPages: number
  ): ExamPrediction => {
    return predictExamReadiness(plans, sessions, examDate, totalRemainingPages);
  }, [plans, sessions]);

  // ─── SEARCH & FILTER ──────────────────────────────────────────────────

  const search = useCallback((query: string) => {
    return searchPlans(plans, sessions, query);
  }, [plans, sessions]);

  const filter = useCallback((filters: {
    status?: StudyStatus | 'all';
    priority?: 'Low' | 'Medium' | 'High' | 'all';
    subject?: string;
  }) => {
    return filterPlans(plans, filters);
  }, [plans]);

  // ─── TODAY'S DATA (precomputed) ────────────────────────────────────────

  const todayData = useMemo(() => computeDayData(plans, sessions, getTodayStr()), [plans, sessions]);

  // ─── FUTURE OVERVIEW ──────────────────────────────────────────────────

  const getFutureDays = useCallback((numDays: number = 7) => {
    const today = getTodayStr();
    const days: CalendarDayData[] = [];
    for (let d = 1; d <= numDays; d++) {
      const dateStr = addDays(today, d);
      days.push(computeDayData(plans, sessions, dateStr));
    }
    return days;
  }, [plans, sessions]);

  // ─── PAST OVERVIEW ────────────────────────────────────────────────────

  const getPastDays = useCallback((numDays: number = 7) => {
    const today = getTodayStr();
    const days: CalendarDayData[] = [];
    for (let d = 1; d <= numDays; d++) {
      const dateStr = addDays(today, -d);
      days.push(computeDayData(plans, sessions, dateStr));
    }
    return days;
  }, [plans, sessions]);

  return {
    plans,
    sessions,
    adaptMessage,
    // CRUD
    addPlan,
    editPlan,
    deletePlan,
    duplicatePlan,
    movePlan,
    updatePlanStatus,
    addSession,
    deleteSession,
    // Getters
    getPlansForDate,
    getSessionsForDate,
    getStatusForDate,
    getMissedPlans,
    // Algorithms
    generateAutoPlan,
    adaptToday,
    // Data
    heatmapData,
    todayData,
    streak,
    getMonthlySummary,
    getExamPrediction,
    search,
    filter,
    getFutureDays,
    getPastDays,
    useDayData,
  };
}
