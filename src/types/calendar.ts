// Calendar-specific types for Studex Study Calendar

export type CalendarView = 'month' | 'week' | 'day';

export type StudyPriority = 'Low' | 'Medium' | 'High';

export type StudyStatus = 'planned' | 'completed' | 'partial' | 'missed' | 'none';

export interface StudyPlan {
  id: string;
  date: string; // ISO date string "YYYY-MM-DD"
  subjectName: string;
  chapterName: string;
  pageStart: number;
  pageEnd: number;
  estimatedMinutes: number;
  priority: StudyPriority;
  notes?: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  date: string; // ISO date string "YYYY-MM-DD"
  planId?: string; // linked plan if any
  subjectName: string;
  chapterName: string;
  pagesCompleted: number;
  pageStart: number;
  pageEnd: number;
  minutesStudied: number;
  notes?: string;
  completedAt: string;
}

export interface CalendarDayData {
  date: string; // "YYYY-MM-DD"
  plans: StudyPlan[];
  sessions: StudySession[];
  status: StudyStatus;
  totalPlannedMinutes: number;
  totalStudiedMinutes: number;
  completionPercent: number;
}

export interface MissedTaskAction {
  planId: string;
  action: 'tomorrow' | 'reschedule' | 'cancel';
  newDate?: string;
}
