// ═══════════════════════════════════════════════════════════════════════════
// SMART STUDY CALENDAR ENGINE — Algorithm-only, no AI
// ═══════════════════════════════════════════════════════════════════════════

import { SubjectItem, Chapter, ChapterDifficulty } from '../types';
import { StudyPlan, StudySession, StudyStatus, CalendarDayData, TaskStatus } from '../types/calendar';

// ─── Core Date Helpers ────────────────────────────────────────────────────

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayStr(): string {
  return formatDate(new Date());
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── Status Computation ───────────────────────────────────────────────────

export function computeDayStatus(
  plans: StudyPlan[],
  sessions: StudySession[],
  dateStr: string
): StudyStatus {
  const today = getTodayStr();
  const dayPlans = plans.filter(p => p.date === dateStr);
  const daySessions = sessions.filter(s => s.date === dateStr);

  if (dayPlans.length === 0 && daySessions.length === 0) return 'none';
  if (daySessions.length === 0 && dayPlans.length > 0) {
    if (dateStr < today) return 'missed';
    return 'planned';
  }

  const totalPlanned = dayPlans.reduce((a, p) => a + Math.max(0, p.pageEnd - p.pageStart + 1), 0);
  const totalDone = daySessions.reduce((a, s) => a + s.pagesCompleted, 0);

  if (totalPlanned === 0) return 'completed';
  const pct = totalDone / totalPlanned;
  if (pct >= 0.95) return 'completed';
  if (pct > 0) return 'partial';
  if (dateStr < today) return 'missed';
  return 'planned';
}

// ─── Day Data Computation ─────────────────────────────────────────────────

export function computeDayData(
  plans: StudyPlan[],
  sessions: StudySession[],
  dateStr: string
): CalendarDayData {
  const dayPlans = plans.filter(p => p.date === dateStr);
  const daySessions = sessions.filter(s => s.date === dateStr);
  const totalPlannedMinutes = dayPlans.reduce((a, p) => a + p.estimatedMinutes, 0);
  const totalStudiedMinutes = daySessions.reduce((a, s) => a + s.minutesStudied, 0);
  const totalPlannedPages = dayPlans.reduce((a, p) => a + Math.max(0, p.pageEnd - p.pageStart + 1), 0);
  const totalDonePages = daySessions.reduce((a, s) => a + s.pagesCompleted, 0);
  const completionPercent = totalPlannedPages > 0
    ? Math.min(100, Math.round((totalDonePages / totalPlannedPages) * 100))
    : daySessions.length > 0 ? 100 : 0;

  const { currentStreak } = calculateStudyStreak(
    plans.filter(p => p.date <= dateStr),
    sessions.filter(s => s.date <= dateStr)
  );

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

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATIC STUDY PLANNER ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

export interface AutoPlanInput {
  subjects: SubjectItem[];
  examDate: string;
  startDate?: string; // defaults to today
  dailyStudyMinutes: number; // e.g. 120 for 2 hours
}

export interface AutoPlanResult {
  plans: StudyPlan[];
  totalDays: number;
  totalPagesPlanned: number;
  pagesPerDay: number;
  minutesPerDay: number;
}

/**
 * Generates a complete study plan from today to the exam date.
 * Distributes all remaining pages evenly across available study days.
 * Always rounds UP (Math.ceil).
 *
 * Algorithm:
 * 1. Collect all remaining pages across all subjects, ordered by chapter sequence.
 * 2. Calculate study days = calendar days between start and exam (exclusive of exam day).
 * 3. pagesPerDay = Math.ceil(totalRemaining / studyDays)
 * 4. Distribute pages sequentially across days, respecting subject boundaries.
 * 5. Estimate time per page based on difficulty: Easy=3min, Medium=5min, Hard=8min.
 */
export function generateAutoStudyPlan(input: AutoPlanInput): AutoPlanResult {
  const startDate = input.startDate || getTodayStr();
  const examDate = input.examDate;

  // Calculate available study days
  const totalDays = Math.max(1, daysBetween(startDate, examDate));

  // Collect all remaining page segments from each subject's chapters
  interface PageSegment {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    startPage: number;
    endPage: number;
    difficulty: ChapterDifficulty;
  }

  const segments: PageSegment[] = [];
  for (const subj of input.subjects) {
    for (const ch of subj.chapters) {
      if (ch.completed) continue;
      const completedInChapter = ch.completedPages || 0;
      const remainingInChapter = ch.totalPages - completedInChapter;
      if (remainingInChapter <= 0) continue;

      segments.push({
        subjectId: subj.id,
        subjectName: subj.name,
        chapterId: ch.id,
        chapterName: ch.name,
        startPage: ch.startPage + completedInChapter,
        endPage: ch.endPage,
        difficulty: ch.difficulty,
      });
    }
  }

  const totalPages = segments.reduce((sum, seg) => sum + (seg.endPage - seg.startPage + 1), 0);

  if (totalPages === 0 || totalDays === 0) {
    return { plans: [], totalDays, totalPagesPlanned: 0, pagesPerDay: 0, minutesPerDay: 0 };
  }

  // Base distribution: pages per day (always round UP)
  const basePagesPerDay = Math.ceil(totalPages / totalDays);

  // Build a flat page queue from segments
  interface PageEntry {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    pageNum: number;
    difficulty: ChapterDifficulty;
  }

  const pageQueue: PageEntry[] = [];
  for (const seg of segments) {
    for (let p = seg.startPage; p <= seg.endPage; p++) {
      pageQueue.push({
        subjectId: seg.subjectId,
        subjectName: seg.subjectName,
        chapterId: seg.chapterId,
        chapterName: seg.chapterName,
        pageNum: p,
        difficulty: seg.difficulty,
      });
    }
  }

  // Distribute pages into daily buckets
  const dailyBuckets: { date: string; pages: PageEntry[] }[] = [];
  for (let d = 0; d < totalDays; d++) {
    dailyBuckets.push({ date: addDays(startDate, d), pages: [] });
  }

  // Distribute: each day gets basePagesPerDay pages (last day gets remainder)
  let pageIdx = 0;
  for (let dayIdx = 0; dayIdx < totalDays && pageIdx < pageQueue.length; dayIdx++) {
    const isLastDay = dayIdx === totalDays - 1;
    const pagesForThisDay = isLastDay
      ? Math.min(pageQueue.length - pageIdx, pageQueue.length)
      : Math.min(basePagesPerDay, pageQueue.length - pageIdx);

    for (let p = 0; p < pagesForThisDay && pageIdx < pageQueue.length; p++) {
      dailyBuckets[dayIdx].pages.push(pageQueue[pageIdx]);
      pageIdx++;
    }
  }

  // Convert daily buckets to StudyPlan objects, grouping by subject+chapter within each day
  const plans: StudyPlan[] = [];
  const now = new Date().toISOString();

  for (const bucket of dailyBuckets) {
    if (bucket.pages.length === 0) continue;

    // Group pages by subject+chapter
    const groups: Map<string, { pages: PageEntry[]; subjectName: string; chapterName: string; chapterId: string; subjectId: string; difficulty: ChapterDifficulty }> = new Map();

    for (const pg of bucket.pages) {
      const key = `${pg.subjectId}-${pg.chapterId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          pages: [],
          subjectName: pg.subjectName,
          chapterName: pg.chapterName,
          chapterId: pg.chapterId,
          subjectId: pg.subjectId,
          difficulty: pg.difficulty,
        });
      }
      groups.get(key)!.pages.push(pg);
    }

    // Create one StudyPlan per subject-chapter group per day
    let groupIdx = 0;
    for (const [, group] of groups) {
      const pages = group.pages;
      const startPage = pages[0].pageNum;
      const endPage = pages[pages.length - 1].pageNum;
      const pageCount = endPage - startPage + 1;

      // Time estimation based on difficulty
      const minPerPage = group.difficulty === 'Easy' ? 3 : group.difficulty === 'Medium' ? 5 : 8;
      const estimatedMinutes = pageCount * minPerPage;

      plans.push({
        id: `auto-${bucket.date}-${group.subjectId}-${group.chapterId}-${groupIdx}`,
        date: bucket.date,
        subjectName: group.subjectName,
        chapterName: group.chapterName,
        pageStart: startPage,
        pageEnd: endPage,
        estimatedMinutes,
        priority: group.difficulty === 'Hard' ? 'High' : group.difficulty === 'Medium' ? 'Medium' : 'Low',
        notes: '',
        createdAt: now,
        status: 'todo' as TaskStatus,
        subjectId: group.subjectId,
        chapterId: group.chapterId,
        isAutoGenerated: true,
      });
      groupIdx++;
    }
  }

  // Calculate actual average
  const actualPagesPerDay = totalDays > 0 ? Math.ceil(totalPages / totalDays) : 0;
  const totalMinutes = plans.reduce((a, p) => a + p.estimatedMinutes, 0);
  const minutesPerDay = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

  return {
    plans,
    totalDays,
    totalPagesPlanned: totalPages,
    pagesPerDay: actualPagesPerDay,
    minutesPerDay,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTIVE PAGE DISTRIBUTION ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyzes today's completion and redistributes remaining future plans.
 *
 * Case 1: User completed exactly today's target → no change.
 * Case 2: User completed MORE than target → decrease future daily load.
 * Case 3: User completed LESS than target → redistribute unfinished pages.
 * Case 4: User completed NOTHING → mark missed, redistribute all.
 *
 * CRITICAL: Never modifies past/completed history.
 */
export function adaptFuturePlans(
  allPlans: StudyPlan[],
  allSessions: StudySession[],
  targetDate: string = getTodayStr()
): {
  updatedPlans: StudyPlan[];
  caseType: 1 | 2 | 3 | 4;
  completedPages: number;
  plannedPages: number;
  diff: number;
  message: string;
} {
  const today = targetDate;
  const todayPlans = allPlans.filter(p => p.date === today);
  const todaySessions = allSessions.filter(s => s.date === today);

  if (todayPlans.length === 0) {
    return { updatedPlans: allPlans, caseType: 1, completedPages: 0, plannedPages: 0, diff: 0, message: 'No plans for today.' };
  }

  const plannedPages = todayPlans.reduce((a, p) => a + Math.max(0, p.pageEnd - p.pageStart + 1), 0);
  const completedPages = todaySessions.reduce((a, s) => a + s.pagesCompleted, 0);
  const diff = completedPages - plannedPages;

  // Get all future plans (after today, not completed)
  const pastPlans = allPlans.filter(p => p.date < today && p.status !== 'completed' && p.status !== 'cancelled');
  const futurePlans = allPlans.filter(p => p.date > today && (p.status === 'todo' || p.status === undefined));
  const otherPlans = allPlans.filter(p => p.date !== today && p.date <= today && p.status !== 'todo' && p.status !== undefined);

  // Case 1: Exact completion (within 5% tolerance)
  if (Math.abs(diff) <= Math.max(1, Math.floor(plannedPages * 0.05))) {
    // Mark today's plans as completed
    const markedToday = todayPlans.map(p => ({ ...p, status: 'completed' as const }));
    return {
      updatedPlans: [...otherPlans, ...pastPlans, ...markedToday, ...futurePlans],
      caseType: 1,
      completedPages,
      plannedPages,
      diff: 0,
      message: 'Target met! Future schedule unchanged.',
    };
  }

  // Case 2: Completed MORE than target
  if (diff > 0) {
    const surplusPages = diff;
    // Remove surplus pages from future plans (start from the last day)
    const markedToday = todayPlans.map(p => ({ ...p, status: 'completed' as const }));
    let remainingSurplus = surplusPages;
    const adjustedFuture = [...futurePlans].reverse(); // work from end

    const newFuture: StudyPlan[] = [];
    for (const plan of adjustedFuture) {
      const planPages = Math.max(0, plan.pageEnd - plan.pageStart + 1);
      if (remainingSurplus <= 0) {
        newFuture.push(plan);
        continue;
      }

      if (planPages <= remainingSurplus) {
        // Remove this entire plan (surplus covers it)
        remainingSurplus -= planPages;
        // Don't add to newFuture — it's been absorbed by surplus
      } else {
        // Reduce this plan's page range
        const newStart = plan.pageStart + remainingSurplus;
        newFuture.push({
          ...plan,
          pageStart: newStart,
        });
        remainingSurplus = 0;
      }
    }

    return {
      updatedPlans: [...otherPlans, ...pastPlans, ...markedToday, ...newFuture.reverse()],
      caseType: 2,
      completedPages,
      plannedPages,
      diff: surplusPages,
      message: `Great work! ${surplusPages} extra pages completed. Future schedule lightened.`,
    };
  }

  // Case 3 or 4: Completed LESS (including 0)
  const deficitPages = Math.abs(diff);
  const isCase4 = completedPages === 0;

  // Mark today's plans
  const markedToday = todayPlans.map(p => ({
    ...p,
    status: (isCase4 ? 'missed' : 'partial') as StudyPlan['status'],
  }));

  // Redistribute deficit pages across future plans
  const futureDayCount = new Set(futurePlans.map(p => p.date)).size;
  if (futureDayCount === 0) {
    return {
      updatedPlans: [...otherPlans, ...pastPlans, ...markedToday, ...futurePlans],
      caseType: isCase4 ? 4 : 3,
      completedPages,
      plannedPages,
      diff: -deficitPages,
      message: isCase4
        ? `${deficitPages} pages missed. No future days to redistribute.`
        : `${deficitPages} pages short. No future days to redistribute.`,
    };
  }

  // Calculate extra pages per future day (round UP)
  const extraPerDay = Math.ceil(deficitPages / futureDayCount);

  // Distribute extra pages by extending future plans' end pages
  let remainingDeficit = deficitPages;
  const adjustedFuturePlans = futurePlans.map(plan => {
    if (remainingDeficit <= 0) return plan;
    const addPages = Math.min(extraPerDay, remainingDeficit);
    remainingDeficit -= addPages;
    return {
      ...plan,
      pageEnd: plan.pageEnd + addPages,
      estimatedMinutes: plan.estimatedMinutes + (addPages * 5), // ~5 min per extra page
    };
  });

  return {
    updatedPlans: [...otherPlans, ...pastPlans, ...markedToday, ...adjustedFuturePlans],
    caseType: isCase4 ? 4 : 3,
    completedPages,
    plannedPages,
    diff: -deficitPages,
    message: isCase4
      ? `${deficitPages} pages missed. Redistributed +${extraPerDay} pages/day across ${futureDayCount} remaining days.`
      : `${deficitPages} pages short. Redistributed +${extraPerDay} pages/day across ${futureDayCount} remaining days.`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HEATMAP DATA GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export type HeatmapColor = 'dark-green' | 'light-green' | 'yellow' | 'red' | 'grey';

export interface HeatmapDay {
  date: string;
  color: HeatmapColor;
  completionPercent: number;
  totalPlanned: number;
  totalCompleted: number;
}

export function generateHeatmapData(
  plans: StudyPlan[],
  sessions: StudySession[],
  startDate?: string,
  days: number = 365
): HeatmapDay[] {
  const start = startDate || addDays(getTodayStr(), -days);
  const result: HeatmapDay[] = [];

  for (let d = 0; d < days; d++) {
    const dateStr = addDays(start, d);
    const dayPlans = plans.filter(p => p.date === dateStr);
    const daySessions = sessions.filter(s => s.date === dateStr);

    const totalPlanned = dayPlans.reduce((a, p) => a + Math.max(0, p.pageEnd - p.pageStart + 1), 0);
    const totalCompleted = daySessions.reduce((a, s) => a + s.pagesCompleted, 0);
    const pct = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : -1;

    let color: HeatmapColor = 'grey';
    if (totalPlanned === 0 && totalCompleted === 0) {
      color = 'grey';
    } else if (pct >= 100) {
      color = 'dark-green';
    } else if (pct >= 75) {
      color = 'light-green';
    } else if (pct >= 25) {
      color = 'yellow';
    } else if (pct >= 0) {
      color = 'red';
    } else {
      // Only sessions, no plans (free study)
      color = totalCompleted > 0 ? 'dark-green' : 'grey';
    }

    result.push({
      date: dateStr,
      color,
      completionPercent: totalPlanned > 0 ? Math.round(pct) : (totalCompleted > 0 ? 100 : 0),
      totalPlanned,
      totalCompleted,
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTHLY SUMMARY ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

export interface MonthlySummary {
  year: number;
  month: number;
  studyDays: number;
  completedTasks: number;
  missedTasks: number;
  totalStudyHours: number;
  pagesStudied: number;
  avgPagesPerDay: number;
  avgStudyTime: number;
  completionPercent: number;
}

export function computeMonthlySummary(
  plans: StudyPlan[],
  sessions: StudySession[],
  year: number,
  month: number
): MonthlySummary {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(year, month);

  let studyDays = 0;
  let completedTasks = 0;
  let missedTasks = 0;
  let totalMinutes = 0;
  let pagesStudied = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${prefix}-${String(d).padStart(2, '0')}`;
    const dayPlans = plans.filter(p => p.date === dateStr);
    const daySessions = sessions.filter(s => s.date === dateStr);

    const status = computeDayStatus(plans, sessions, dateStr);

    if (status !== 'none') studyDays++;
    if (status === 'completed') completedTasks += dayPlans.length;
    if (status === 'missed') missedTasks += dayPlans.length;
    if (status === 'partial') {
      completedTasks += daySessions.length;
    }

    totalMinutes += daySessions.reduce((a, s) => a + s.minutesStudied, 0);
    pagesStudied += daySessions.reduce((a, s) => a + s.pagesCompleted, 0);
  }

  const totalTasks = completedTasks + missedTasks;
  const allMonthPlans = plans.filter(p => p.date.startsWith(prefix));
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / (completedTasks + missedTasks + allMonthPlans.length)) * 100) : 0;

  return {
    year,
    month,
    studyDays,
    completedTasks,
    missedTasks,
    totalStudyHours: Math.round(totalMinutes / 60 * 10) / 10,
    pagesStudied,
    avgPagesPerDay: studyDays > 0 ? Math.round(pagesStudied / studyDays) : 0,
    avgStudyTime: studyDays > 0 ? Math.round(totalMinutes / studyDays) : 0,
    completionPercent: Math.min(100, completionPercent),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAK CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export function calculateStudyStreak(
  plans: StudyPlan[],
  sessions: StudySession[]
): { currentStreak: number; longestStreak: number } {
  const today = getTodayStr();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check from today backwards for current streak
  for (let d = 0; d < 365; d++) {
    const dateStr = addDays(today, -d);
    const status = computeDayStatus(plans, sessions, dateStr);
    if (status === 'completed' || status === 'partial') {
      currentStreak++;
    } else if (d === 0) {
      // Today might not be done yet — check if there are plans
      const dayPlans = plans.filter(p => p.date === dateStr);
      if (dayPlans.length === 0) continue; // No plans today is ok for streak
      break;
    } else {
      break;
    }
  }

  // Calculate longest streak across all data
  // Get the date range of all data
  const allDates = new Set([...plans.map(p => p.date), ...sessions.map(s => s.date)]);
  if (allDates.size === 0) return { currentStreak, longestStreak: 0 };

  const sortedDates = Array.from(allDates).sort();
  let prevDate = sortedDates[0];

  for (const dateStr of sortedDates) {
    const status = computeDayStatus(plans, sessions, dateStr);
    if (status === 'completed' || status === 'partial') {
      if (dateStr === addDays(prevDate, 1) || dateStr === prevDate) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      prevDate = dateStr;
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }

  return { currentStreak, longestStreak };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAM PREDICTION
// ═══════════════════════════════════════════════════════════════════════════

export interface ExamPrediction {
  willFinishOnTime: boolean;
  predictedFinishDate: string;
  daysAheadOrBehind: number;
  avgPagesPerDay: number;
  requiredPagesPerDay: number;
}

export function predictExamReadiness(
  plans: StudyPlan[],
  sessions: StudySession[],
  examDate: string,
  totalRemainingPages: number
): ExamPrediction {
  if (totalRemainingPages <= 0) {
    return {
      willFinishOnTime: true,
      predictedFinishDate: getTodayStr(),
      daysAheadOrBehind: daysBetween(getTodayStr(), examDate),
      avgPagesPerDay: 0,
      requiredPagesPerDay: 0,
    };
  }

  const today = getTodayStr();
  const daysToExam = Math.max(1, daysBetween(today, examDate));
  const requiredPagesPerDay = Math.ceil(totalRemainingPages / daysToExam);

  // Calculate actual average from past sessions
  const studyDays = new Set(sessions.map(s => s.date)).size;
  const totalPagesDone = sessions.reduce((a, s) => a + s.pagesCompleted, 0);
  const avgPagesPerDay = studyDays > 0 ? Math.round(totalPagesDone / studyDays * 10) / 10 : 0;

  // Predict finish date based on average
  const daysNeeded = avgPagesPerDay > 0 ? Math.ceil(totalRemainingPages / avgPagesPerDay) : Infinity;
  const predictedFinishDate = daysNeeded === Infinity
    ? 'Cannot predict'
    : addDays(today, daysNeeded);

  const daysAheadOrBehind = daysNeeded === Infinity
    ? -daysToExam
    : daysBetween(examDate, predictedFinishDate); // negative = ahead, positive = behind

  return {
    willFinishOnTime: daysNeeded <= daysToExam,
    predictedFinishDate: typeof predictedFinishDate === 'string' && predictedFinishDate !== 'Cannot predict'
      ? predictedFinishDate
      : examDate,
    daysAheadOrBehind,
    avgPagesPerDay,
    requiredPagesPerDay,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH & FILTER HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function searchPlans(
  plans: StudyPlan[],
  sessions: StudySession[],
  query: string
): { plans: StudyPlan[]; sessions: StudySession[] } {
  const q = query.toLowerCase().trim();
  if (!q) return { plans: [], sessions: [] };

  return {
    plans: plans.filter(p =>
      p.subjectName.toLowerCase().includes(q) ||
      p.chapterName.toLowerCase().includes(q) ||
      p.date.includes(q) ||
      p.notes?.toLowerCase().includes(q)
    ),
    sessions: sessions.filter(s =>
      s.subjectName.toLowerCase().includes(q) ||
      s.chapterName.toLowerCase().includes(q) ||
      s.date.includes(q) ||
      s.notes?.toLowerCase().includes(q)
    ),
  };
}

export function filterPlans(
  plans: StudyPlan[],
  filters: {
    status?: StudyStatus | 'all';
    priority?: 'Low' | 'Medium' | 'High' | 'all';
    subject?: string;
  }
): StudyPlan[] {
  return plans.filter(p => {
    if (filters.status && filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'all' && p.priority !== filters.priority) return false;
    if (filters.subject && p.subjectName !== filters.subject) return false;
    return true;
  });
}

// ─── Formatting Helpers ───────────────────────────────────────────────────

export function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
