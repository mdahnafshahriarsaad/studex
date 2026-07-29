import { useState, useEffect, useCallback } from 'react';
import { StudyPlan, StudySession, CalendarDayData, StudyStatus } from '../types/calendar';

const PLANS_KEY = 'studex_calendar_plans_v1';
const SESSIONS_KEY = 'studex_calendar_sessions_v1';

function loadPlans(): StudyPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
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

export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function getTodayStr(): string {
  return formatDate(new Date());
}

function computeStatus(plans: StudyPlan[], sessions: StudySession[], dateStr: string): StudyStatus {
  const today = getTodayStr();
  const dayPlans = plans.filter(p => p.date === dateStr);
  const daySessions = sessions.filter(s => s.date === dateStr);

  if (dayPlans.length === 0 && daySessions.length === 0) return 'none';
  if (daySessions.length === 0 && dayPlans.length > 0) {
    if (dateStr < today) return 'missed';
    return 'planned';
  }

  const totalPlanned = dayPlans.reduce((a, p) => a + (p.pageEnd - p.pageStart + 1), 0);
  const totalDone = daySessions.reduce((a, s) => a + s.pagesCompleted, 0);

  if (totalPlanned === 0) return 'completed';
  const pct = totalDone / totalPlanned;
  if (pct >= 0.95) return 'completed';
  if (pct > 0) return 'partial';
  if (dateStr < today) return 'missed';
  return 'planned';
}

export function useDayData(plans: StudyPlan[], sessions: StudySession[], dateStr: string): CalendarDayData {
  const dayPlans = plans.filter(p => p.date === dateStr);
  const daySessions = sessions.filter(s => s.date === dateStr);
  const totalPlannedMinutes = dayPlans.reduce((a, p) => a + p.estimatedMinutes, 0);
  const totalStudiedMinutes = daySessions.reduce((a, s) => a + s.minutesStudied, 0);
  const totalPlannedPages = dayPlans.reduce((a, p) => a + (p.pageEnd - p.pageStart + 1), 0);
  const totalDonePages = daySessions.reduce((a, s) => a + s.pagesCompleted, 0);
  const completionPercent = totalPlannedPages > 0 ? Math.min(100, Math.round((totalDonePages / totalPlannedPages) * 100)) : daySessions.length > 0 ? 100 : 0;
  return {
    date: dateStr,
    plans: dayPlans,
    sessions: daySessions,
    status: computeStatus(plans, sessions, dateStr),
    totalPlannedMinutes,
    totalStudiedMinutes,
    completionPercent,
  };
}

export function useCalendarStore() {
  const [plans, setPlansState] = useState<StudyPlan[]>(loadPlans);
  const [sessions, setSessionsState] = useState<StudySession[]>(loadSessions);

  useEffect(() => { savePlans(plans); }, [plans]);
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  const addPlan = useCallback((plan: Omit<StudyPlan, 'id' | 'createdAt'>) => {
    const newPlan: StudyPlan = {
      ...plan,
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setPlansState(prev => [...prev, newPlan]);
    return newPlan;
  }, []);

  const editPlan = useCallback((id: string, updates: Partial<StudyPlan>) => {
    setPlansState(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlansState(prev => prev.filter(p => p.id !== id));
  }, []);

  const movePlan = useCallback((id: string, newDate: string) => {
    setPlansState(prev => prev.map(p => p.id === id ? { ...p, date: newDate } : p));
  }, []);

  const addSession = useCallback((session: Omit<StudySession, 'id' | 'completedAt'>) => {
    const newSession: StudySession = {
      ...session,
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      completedAt: new Date().toISOString(),
    };
    setSessionsState(prev => [...prev, newSession]);
    return newSession;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessionsState(prev => prev.filter(s => s.id !== id));
  }, []);

  const getPlansForDate = useCallback((dateStr: string) => plans.filter(p => p.date === dateStr), [plans]);
  const getSessionsForDate = useCallback((dateStr: string) => sessions.filter(s => s.date === dateStr), [sessions]);

  const getStatusForDate = useCallback((dateStr: string): StudyStatus => {
    return computeStatus(plans, sessions, dateStr);
  }, [plans, sessions]);

  const getMissedPlans = useCallback(() => {
    const today = getTodayStr();
    return plans.filter(p => p.date < today && !sessions.some(s => s.planId === p.id || s.date === p.date));
  }, [plans, sessions]);

  return {
    plans,
    sessions,
    addPlan,
    editPlan,
    deletePlan,
    movePlan,
    addSession,
    deleteSession,
    getPlansForDate,
    getSessionsForDate,
    getStatusForDate,
    getMissedPlans,
  };
}
